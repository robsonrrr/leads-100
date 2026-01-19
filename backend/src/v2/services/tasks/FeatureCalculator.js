/**
 * Feature Calculator Service
 * NORMALIZE phase of OODA Loop
 * 
 * Converts raw signals into standardized features for the Rules Engine.
 * Each feature has a fixed key and normalized value.
 */
import { getDatabase } from '../../../config/database.js';
import logger from '../../../config/logger.js';
import { tasksRepository } from '../../repositories/tasks.repository.js';

const db = () => getDatabase();

/**
 * Feature key definitions
 * This is the canonical list of supported feature keys
 */
export const FEATURE_KEYS = {
    // WhatsApp
    INBOUND_UNREPLIED_HOURS: 'INBOUND_UNREPLIED_HOURS',
    INBOUND_UNREPLIED_COUNT: 'INBOUND_UNREPLIED_COUNT',

    // Leads
    LEAD_AGE_DAYS: 'LEAD_AGE_DAYS',
    LEAD_IS_HOT: 'LEAD_IS_HOT',
    LEAD_TOTAL_VALUE: 'LEAD_TOTAL_VALUE',

    // Quotes
    QUOTE_AGE_DAYS: 'QUOTE_AGE_DAYS',
    QUOTE_TOTAL_VALUE: 'QUOTE_TOTAL_VALUE',

    // Goals
    GOAL_PROGRESS_PCT: 'GOAL_PROGRESS_PCT',
    GOAL_VALUE: 'GOAL_VALUE',
    GOAL_REMAINING: 'GOAL_REMAINING',

    // Churn/Customer
    CHURN_RISK_SCORE: 'CHURN_RISK_SCORE',
    DAYS_INACTIVE: 'DAYS_INACTIVE',
    LAST_ORDER_VALUE: 'LAST_ORDER_VALUE',
    DAYS_SINCE_CONTEXT_UPDATE: 'DAYS_SINCE_CONTEXT_UPDATE',
    ANNUAL_REVENUE: 'ANNUAL_REVENUE',

    // AI
    AI_RECOMMENDATION_CONFIDENCE: 'AI_RECOMMENDATION_CONFIDENCE'
};

export class FeatureCalculator {
    /**
     * Calculate features from signals
     * @param {number} runId - The run ID
     * @param {number} sellerId - The seller ID
     * @returns {Object} Stats about calculated features
     */
    async calculate(runId, sellerId) {
        logger.info('FeatureCalculator: Starting calculation', { runId, sellerId });

        const stats = {
            total: 0,
            by_key: {}
        };

        try {
            // Get all signals for this run
            const [signals] = await db().execute(
                `SELECT * FROM staging.sales_raw_signal WHERE run_id = ?`,
                [runId]
            );

            // Group signals by customer and entity
            const grouped = this._groupSignals(signals);

            // Calculate features for each group
            for (const [groupKey, groupSignals] of Object.entries(grouped)) {
                const features = await this._calculateGroupFeatures(sellerId, groupSignals);

                for (const feature of features) {
                    await tasksRepository.upsertFeature(runId, feature);
                    stats.total++;
                    stats.by_key[feature.featureKey] = (stats.by_key[feature.featureKey] || 0) + 1;
                }
            }

            logger.info('FeatureCalculator: Calculation complete', { runId, stats });
            return stats;

        } catch (error) {
            logger.error('FeatureCalculator: Error', error);
            throw error;
        }
    }

    /**
     * Group signals by customer + entity for aggregation
     */
    _groupSignals(signals) {
        const groups = {};

        for (const signal of signals) {
            // Group by customer_id + entity_type + entity_id
            const key = `${signal.customer_id || 'null'}_${signal.entity_type || 'null'}_${signal.entity_id || 'null'}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(signal);
        }

        return groups;
    }

    /**
     * Calculate features for a group of signals
     */
    async _calculateGroupFeatures(sellerId, signals) {
        const features = [];

        if (!signals || signals.length === 0) return features;

        const first = signals[0];
        const { customer_id: customerId, entity_type: entityType, entity_id: entityId } = first;

        // Process by signal type
        for (const signal of signals) {
            let payload = {};
            try {
                payload = typeof signal.payload_json === 'string'
                    ? JSON.parse(signal.payload_json)
                    : (signal.payload_json || {});
            } catch (e) {
                logger.debug('FeatureCalculator: Invalid payload JSON', { signal_id: signal.signal_id });
                payload = {};
            }

            switch (signal.signal_type) {
                case 'WHATSAPP_INBOUND_UNANSWERED':
                    features.push({
                        sellerId,
                        customerId,
                        entityType: 'MSG',
                        entityId: signal.entity_id,
                        featureKey: FEATURE_KEYS.INBOUND_UNREPLIED_HOURS,
                        featureValue: payload.hours_waiting || 0
                    });
                    break;

                case 'LEAD_AGING':
                    features.push({
                        sellerId,
                        customerId,
                        entityType: 'LEAD',
                        entityId: signal.entity_id,
                        featureKey: FEATURE_KEYS.LEAD_AGE_DAYS,
                        featureValue: payload.days_open || 0
                    });
                    features.push({
                        sellerId,
                        customerId,
                        entityType: 'LEAD',
                        entityId: signal.entity_id,
                        featureKey: FEATURE_KEYS.LEAD_IS_HOT,
                        featureValue: payload.is_hot ? 1 : 0
                    });
                    features.push({
                        sellerId,
                        customerId,
                        entityType: 'LEAD',
                        entityId: signal.entity_id,
                        featureKey: FEATURE_KEYS.LEAD_TOTAL_VALUE,
                        featureValue: payload.total_value || 0
                    });
                    break;

                case 'QUOTE_AGING':
                    features.push({
                        sellerId,
                        customerId,
                        entityType: 'QUOTE',
                        entityId: signal.entity_id,
                        featureKey: FEATURE_KEYS.QUOTE_AGE_DAYS,
                        featureValue: payload.days_old || 0
                    });
                    features.push({
                        sellerId,
                        customerId,
                        entityType: 'QUOTE',
                        entityId: signal.entity_id,
                        featureKey: FEATURE_KEYS.QUOTE_TOTAL_VALUE,
                        featureValue: payload.total_value || 0
                    });
                    break;

                case 'CHURN_HIGH_RISK':
                    features.push({
                        sellerId,
                        customerId,
                        entityType: 'CUSTOMER',
                        entityId: signal.entity_id,
                        featureKey: FEATURE_KEYS.CHURN_RISK_SCORE,
                        featureValue: payload.churn_score || 0
                    });
                    if (payload.days_inactive) {
                        features.push({
                            sellerId,
                            customerId,
                            entityType: 'CUSTOMER',
                            entityId: signal.entity_id,
                            featureKey: FEATURE_KEYS.DAYS_INACTIVE,
                            featureValue: payload.days_inactive
                        });
                    }
                    break;

                case 'GOAL_BEHIND':
                    features.push({
                        sellerId,
                        customerId,
                        entityType: 'CUSTOMER',
                        entityId: signal.entity_id,
                        featureKey: FEATURE_KEYS.GOAL_PROGRESS_PCT,
                        featureValue: payload.progress_pct || 0
                    });
                    features.push({
                        sellerId,
                        customerId,
                        entityType: 'CUSTOMER',
                        entityId: signal.entity_id,
                        featureKey: FEATURE_KEYS.GOAL_VALUE,
                        featureValue: payload.goal_value || 0
                    });
                    features.push({
                        sellerId,
                        customerId,
                        entityType: 'CUSTOMER',
                        entityId: signal.entity_id,
                        featureKey: FEATURE_KEYS.GOAL_REMAINING,
                        featureValue: (payload.goal_value || 0) - (payload.achieved_value || 0)
                    });
                    break;

                case 'INACTIVE_CUSTOMER':
                    features.push({
                        sellerId,
                        customerId,
                        entityType: 'CUSTOMER',
                        entityId: signal.entity_id,
                        featureKey: FEATURE_KEYS.DAYS_INACTIVE,
                        featureValue: payload.days_inactive || 0
                    });
                    features.push({
                        sellerId,
                        customerId,
                        entityType: 'CUSTOMER',
                        entityId: signal.entity_id,
                        featureKey: FEATURE_KEYS.ANNUAL_REVENUE,
                        featureValue: payload.annual_revenue || 0
                    });
                    break;
            }
        }

        return features;
    }

    /**
     * Get features as a map for easy lookup
     * @param {number} runId - The run ID
     * @param {number} customerId - The customer ID
     * @param {string} entityType - The entity type
     * @param {string} entityId - The entity ID
     * @returns {Object} Map of featureKey -> featureValue
     */
    async getFeatureMap(runId, customerId, entityType = null, entityId = null) {
        const features = await tasksRepository.getFeatures(runId, customerId, entityType, entityId);

        const map = {};
        for (const f of features) {
            let jsonVal = null;
            if (f.feature_json) {
                try {
                    jsonVal = typeof f.feature_json === 'string'
                        ? JSON.parse(f.feature_json)
                        : f.feature_json;
                } catch (e) {
                    jsonVal = null;
                }
            }
            map[f.feature_key] = {
                value: parseFloat(f.feature_value) || 0,
                str: f.feature_str,
                json: jsonVal
            };
        }

        return map;
    }

    /**
     * Aggregate features for a customer across all entities
     */
    async getCustomerFeatures(runId, customerId) {
        const [rows] = await db().execute(`
            SELECT 
                feature_key,
                MAX(feature_value) as max_value,
                MIN(feature_value) as min_value,
                AVG(feature_value) as avg_value,
                COUNT(*) as count
            FROM staging.sales_signal_feature
            WHERE run_id = ? AND customer_id = ?
            GROUP BY feature_key
        `, [runId, customerId]);

        const map = {};
        for (const row of rows) {
            map[row.feature_key] = {
                max: parseFloat(row.max_value) || 0,
                min: parseFloat(row.min_value) || 0,
                avg: parseFloat(row.avg_value) || 0,
                count: row.count
            };
        }

        return map;
    }
}

export const featureCalculator = new FeatureCalculator();
