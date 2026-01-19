/**
 * Orientation Service
 * ORIENT phase of OODA Loop
 * 
 * Creates a "mental model" of each customer based on features and context.
 * Produces versioned snapshots with provenance for auditing.
 */
import { getDatabase } from '../../../config/database.js';
import logger from '../../../config/logger.js';
import { tasksRepository } from '../../repositories/tasks.repository.js';
import { FEATURE_KEYS } from './FeatureCalculator.js';

const db = () => getDatabase();

// Current orientation model version
const ORIENTATION_VERSION = 1;

export class OrientationService {
    /**
     * Build orientation snapshots for all customers with signals
     * @param {number} runId - The run ID
     * @param {number} sellerId - The seller ID
     * @returns {Object} Stats about created snapshots
     */
    async buildSnapshots(runId, sellerId) {
        logger.info('OrientationService: Building snapshots', { runId, sellerId });

        const stats = {
            total: 0,
            by_mode: {}
        };

        try {
            // Get unique customers from features
            const [customers] = await db().execute(`
                SELECT DISTINCT customer_id 
                FROM staging.sales_signal_feature 
                WHERE run_id = ? AND customer_id IS NOT NULL
            `, [runId]);

            for (const { customer_id: customerId } of customers) {
                const snapshot = await this._buildCustomerSnapshot(runId, sellerId, customerId);

                if (snapshot) {
                    await tasksRepository.createSnapshot(runId, snapshot);
                    stats.total++;
                    stats.by_mode[snapshot.clientMode] = (stats.by_mode[snapshot.clientMode] || 0) + 1;
                }
            }

            logger.info('OrientationService: Snapshots complete', { runId, stats });
            return stats;

        } catch (error) {
            logger.error('OrientationService: Error', error);
            throw error;
        }
    }

    /**
     * Build orientation snapshot for a single customer
     */
    async _buildCustomerSnapshot(runId, sellerId, customerId) {
        // Get aggregated features
        const features = await this._getCustomerFeatures(runId, customerId);

        // Get customer profile from database
        const profile = await this._getCustomerProfile(customerId);

        if (!profile) {
            logger.warn('OrientationService: Customer not found', { customerId });
            return null;
        }

        // Calculate orientation fields
        const clientMode = this._calculateClientMode(profile, features);
        const urgency = this._calculateUrgency(features);
        const priceSensitivity = this._calculatePriceSensitivity(profile, features);
        const churnRisk = features[FEATURE_KEYS.CHURN_RISK_SCORE]?.max || 0;
        const goalProgress = features[FEATURE_KEYS.GOAL_PROGRESS_PCT]?.max || null;
        const daysInactive = features[FEATURE_KEYS.DAYS_INACTIVE]?.max || profile.days_since_last_order || null;
        const lastOrderValue = profile.last_order_value || null;

        // Build full orientation JSON
        const orientationJson = {
            client_mode: clientMode,
            urgency,
            price_sensitivity: priceSensitivity,
            churn_risk: churnRisk,
            goal_progress: goalProgress,
            days_inactive: daysInactive,
            last_order_value: lastOrderValue,
            // Extra context
            annual_revenue: profile.annual_revenue || 0,
            avg_ticket: profile.avg_ticket || 0,
            purchase_frequency: profile.purchase_frequency || 0,
            segment: profile.segment || null,
            // Signals summary
            has_unanswered_whatsapp: (features[FEATURE_KEYS.INBOUND_UNREPLIED_HOURS]?.count || 0) > 0,
            has_open_leads: (features[FEATURE_KEYS.LEAD_AGE_DAYS]?.count || 0) > 0,
            has_pending_quotes: (features[FEATURE_KEYS.QUOTE_AGE_DAYS]?.count || 0) > 0
        };

        // Build sources JSON (for provenance)
        const orientationSourcesJson = {
            features: Object.keys(features),
            signals: await this._getSignalTypes(runId, customerId),
            service_versions: {
                OrientationService: `v${ORIENTATION_VERSION}`,
                ChurnService: '1.0',
                GoalsService: '1.0'
            }
        };

        return {
            sellerId,
            customerId,
            orientationJson,
            orientationVer: ORIENTATION_VERSION,
            orientationSourcesJson,
            clientMode,
            urgency,
            priceSensitivity,
            churnRisk,
            goalProgress,
            daysInactive,
            lastOrderValue
        };
    }

    /**
     * Get aggregated features for customer
     */
    async _getCustomerFeatures(runId, customerId) {
        const [rows] = await db().execute(`
            SELECT 
                feature_key,
                MAX(feature_value) as max,
                MIN(feature_value) as min,
                AVG(feature_value) as avg,
                COUNT(*) as count
            FROM staging.sales_signal_feature
            WHERE run_id = ? AND customer_id = ?
            GROUP BY feature_key
        `, [runId, customerId]);

        const map = {};
        for (const row of rows) {
            map[row.feature_key] = {
                max: parseFloat(row.max) || 0,
                min: parseFloat(row.min) || 0,
                avg: parseFloat(row.avg) || 0,
                count: row.count
            };
        }
        return map;
    }

    /**
     * Get signal types for provenance
     */
    async _getSignalTypes(runId, customerId) {
        const [rows] = await db().execute(`
            SELECT DISTINCT signal_type 
            FROM staging.sales_raw_signal
            WHERE run_id = ? AND customer_id = ?
        `, [runId, customerId]);
        return rows.map(r => r.signal_type);
    }

    /**
     * Get customer profile from database
     */
    async _getCustomerProfile(customerId) {
        try {
            const [rows] = await db().execute(`
                SELECT 
                    c.id,
                    c.nome as name,
                    c.segmento as segment,
                    c.idvend as seller_id,
                    -- Revenue metrics
                    (SELECT SUM(valor) FROM mak.hoje h 
                     WHERE h.idcli = c.id AND h.data >= DATE_SUB(NOW(), INTERVAL 365 DAY)) as annual_revenue,
                    (SELECT AVG(valor) FROM mak.hoje h 
                     WHERE h.idcli = c.id AND h.data >= DATE_SUB(NOW(), INTERVAL 365 DAY)) as avg_ticket,
                    (SELECT COUNT(*) FROM mak.hoje h 
                     WHERE h.idcli = c.id AND h.data >= DATE_SUB(NOW(), INTERVAL 365 DAY)) as purchase_frequency,
                    (SELECT MAX(data) FROM mak.hoje h WHERE h.idcli = c.id) as last_order_date,
                    (SELECT valor FROM mak.hoje h WHERE h.idcli = c.id ORDER BY data DESC LIMIT 1) as last_order_value,
                    DATEDIFF(NOW(), (SELECT MAX(data) FROM mak.hoje h WHERE h.idcli = c.id)) as days_since_last_order,
                    -- Churn score if exists
                    cs.score as churn_score,
                    cs.risk_level as churn_risk_level
                FROM mak.clientes c
                LEFT JOIN staging.customer_churn_scores cs ON cs.customer_id = c.id
                WHERE c.id = ?
            `, [customerId]);

            return rows[0] || null;
        } catch (error) {
            logger.error('OrientationService: Profile query error', error);
            return null;
        }
    }

    /**
     * Calculate client mode based on revenue and behavior
     * anchor: Top 20% revenue
     * strategic: High growth potential
     * tactical: Regular buyer
     * spot: Occasional buyer
     */
    _calculateClientMode(profile, features) {
        const annualRevenue = profile.annual_revenue || 0;
        const purchaseFreq = profile.purchase_frequency || 0;
        const avgTicket = profile.avg_ticket || 0;

        // Anchor: High revenue (top tier)
        if (annualRevenue >= 100000) return 'anchor';

        // Strategic: Medium-high revenue or high frequency
        if (annualRevenue >= 50000 || (purchaseFreq >= 12 && avgTicket >= 5000)) return 'strategic';

        // Tactical: Regular purchases
        if (purchaseFreq >= 6 || annualRevenue >= 20000) return 'tactical';

        // Spot: Everything else
        return 'spot';
    }

    /**
     * Calculate urgency based on signals
     */
    _calculateUrgency(features) {
        // High urgency if:
        // - Unanswered WhatsApp > 4 hours
        // - High churn risk
        // - Goal very behind (< 50%)
        const unrepliedHours = features[FEATURE_KEYS.INBOUND_UNREPLIED_HOURS]?.max || 0;
        const churnRisk = features[FEATURE_KEYS.CHURN_RISK_SCORE]?.max || 0;
        const goalProgress = features[FEATURE_KEYS.GOAL_PROGRESS_PCT]?.max || 100;

        if (unrepliedHours >= 4 || churnRisk >= 0.7 || goalProgress < 30) {
            return 'high';
        }

        if (unrepliedHours >= 1 || churnRisk >= 0.5 || goalProgress < 60) {
            return 'medium';
        }

        return 'low';
    }

    /**
     * Calculate price sensitivity based on history
     */
    _calculatePriceSensitivity(profile, features) {
        // This would ideally use discount history and win/loss reasons
        // For MVP, use heuristics based on segment and ticket
        const avgTicket = profile.avg_ticket || 0;
        const segment = profile.segment?.toLowerCase() || '';

        // Higher ticket = lower sensitivity (generally)
        if (avgTicket >= 10000) return 'low';
        if (avgTicket >= 3000) return 'medium';

        // Certain segments are more price-sensitive
        if (segment.includes('varejo') || segment.includes('retail')) return 'high';

        return 'medium';
    }

    /**
     * Get orientation for a customer (existing or calculate on-the-fly)
     */
    async getOrientation(runId, customerId) {
        // Try to get existing snapshot
        const existing = await tasksRepository.getSnapshot(runId, customerId);
        if (existing) {
            let orientJson = {};
            if (existing.orientation_json) {
                try {
                    orientJson = typeof existing.orientation_json === 'string'
                        ? JSON.parse(existing.orientation_json)
                        : existing.orientation_json;
                } catch (e) {
                    orientJson = {};
                }
            }
            return {
                ...existing,
                orientation_json: orientJson
            };
        }
        return null;
    }
}

export const orientationService = new OrientationService();
