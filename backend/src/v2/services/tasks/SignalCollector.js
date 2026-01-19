/**
 * Signal Collector Service
 * OBSERVE phase of OODA Loop
 * 
 * Collects raw signals from multiple sources:
 * - WHATSAPP: Unanswered inbound messages
 * - CRM: Open/aging leads, stale contexts
 * - ERP: Aging quotes, recent orders
 * - CHURN: High risk customers
 * - GOAL: Behind goal customers
 */
import { getDatabase } from '../../../config/database.js';
import logger from '../../../config/logger.js';
import { tasksRepository } from '../../repositories/tasks.repository.js';

const db = () => getDatabase();

export class SignalCollector {
    constructor() {
        this.sources = [
            { name: 'WHATSAPP', collector: this.collectWhatsAppSignals.bind(this) },
            { name: 'CRM_LEADS', collector: this.collectLeadSignals.bind(this) },
            { name: 'ERP_QUOTES', collector: this.collectQuoteSignals.bind(this) },
            { name: 'CHURN', collector: this.collectChurnSignals.bind(this) },
            { name: 'GOAL', collector: this.collectGoalSignals.bind(this) },
            { name: 'CUSTOMER', collector: this.collectCustomerSignals.bind(this) }
        ];
    }

    /**
     * Collect all signals for a seller
     * @param {number} runId - The run ID
     * @param {number} sellerId - The seller ID
     * @returns {Object} Stats about collected signals
     */
    async collectAll(runId, sellerId) {
        logger.info('SignalCollector: Starting collection', { runId, sellerId });

        const stats = {
            total: 0,
            by_source: {}
        };

        for (const source of this.sources) {
            try {
                const signals = await source.collector(sellerId);
                const inserted = await tasksRepository.insertSignals(runId, signals);

                stats.by_source[source.name] = { collected: signals.length, inserted };
                stats.total += inserted;

                logger.debug(`SignalCollector: ${source.name}`, {
                    collected: signals.length,
                    inserted
                });
            } catch (error) {
                logger.error(`SignalCollector: Error in ${source.name}`, error);
                stats.by_source[source.name] = { error: error.message };
            }
        }

        logger.info('SignalCollector: Collection complete', { runId, stats });
        return stats;
    }

    // ==========================================================
    // WHATSAPP SIGNALS
    // ==========================================================

    /**
     * Collect unanswered WhatsApp messages
     * Signal: WHATSAPP_INBOUND with no seller reply
     */
    async collectWhatsAppSignals(sellerId) {
        const signals = [];

        try {
            // Find unanswered inbound messages (customer sent, seller didn't reply)
            const [rows] = await db().execute(`
                SELECT 
                    m.id as msg_id,
                    m.customer_id,
                    m.phone_number,
                    m.message_body,
                    m.received_at,
                    m.seller_id,
                    c.nome as customer_name,
                    TIMESTAMPDIFF(MINUTE, m.received_at, NOW()) / 60.0 as hours_waiting
                FROM superbot.messages m
                LEFT JOIN mak.clientes c ON c.id = m.customer_id
                WHERE m.seller_id = ?
                  AND m.direction = 'inbound'
                  AND m.received_at >= DATE_SUB(NOW(), INTERVAL 48 HOUR)
                  AND NOT EXISTS (
                      SELECT 1 FROM superbot.messages reply
                      WHERE reply.customer_id = m.customer_id
                        AND reply.seller_id = m.seller_id
                        AND reply.direction = 'outbound'
                        AND reply.received_at > m.received_at
                  )
                ORDER BY m.received_at ASC
            `, [sellerId]);

            for (const row of rows) {
                signals.push({
                    sellerId,
                    customerId: row.customer_id,
                    source: 'WHATSAPP',
                    signalType: 'WHATSAPP_INBOUND_UNANSWERED',
                    signalTs: row.received_at,
                    entityType: 'MSG',
                    entityId: String(row.msg_id),
                    payloadJson: {
                        phone_number: row.phone_number,
                        customer_name: row.customer_name,
                        message_preview: row.message_body?.substring(0, 100),
                        hours_waiting: parseFloat(row.hours_waiting?.toFixed(2) || 0)
                    }
                });
            }
        } catch (error) {
            logger.error('SignalCollector: WhatsApp error', error);
        }

        return signals;
    }

    // ==========================================================
    // CRM / LEAD SIGNALS
    // ==========================================================

    /**
     * Collect aging leads
     * Signal: LEAD_AGING (open leads older than X days)
     */
    async collectLeadSignals(sellerId) {
        const signals = [];

        try {
            const [rows] = await db().execute(`
                SELECT 
                    l.id as lead_id,
                    l.customer_id,
                    l.customer_name,
                    l.total_value,
                    l.status,
                    l.segment,
                    l.created_at,
                    l.updated_at,
                    DATEDIFF(NOW(), l.created_at) as days_open,
                    CASE WHEN l.total_value >= 10000 OR l.priority = 'high' THEN 1 ELSE 0 END as is_hot
                FROM staging.leads l
                WHERE l.seller_id = ?
                  AND l.status IN ('open', 'pending', 'negotiating')
                  AND l.is_deleted = 0
                  AND l.created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
                ORDER BY l.total_value DESC
            `, [sellerId]);

            for (const row of rows) {
                signals.push({
                    sellerId,
                    customerId: row.customer_id,
                    source: 'CRM',
                    signalType: 'LEAD_AGING',
                    signalTs: row.updated_at || row.created_at,
                    entityType: 'LEAD',
                    entityId: String(row.lead_id),
                    payloadJson: {
                        customer_name: row.customer_name,
                        total_value: parseFloat(row.total_value || 0),
                        status: row.status,
                        segment: row.segment,
                        days_open: row.days_open,
                        is_hot: row.is_hot === 1
                    }
                });
            }
        } catch (error) {
            logger.error('SignalCollector: Leads error', error);
        }

        return signals;
    }

    // ==========================================================
    // ERP / QUOTE SIGNALS
    // ==========================================================

    /**
     * Collect aging quotes
     * Signal: QUOTE_AGING (pending quotes older than X days)
     */
    async collectQuoteSignals(sellerId) {
        const signals = [];

        try {
            // Assuming quotes are in staging.staging_queries or similar
            const [rows] = await db().execute(`
                SELECT 
                    q.id as quote_id,
                    q.customer_id,
                    c.nome as customer_name,
                    q.total_value,
                    q.created_at,
                    DATEDIFF(NOW(), q.created_at) as days_old
                FROM staging.staging_queries q
                LEFT JOIN mak.clientes c ON c.id = q.customer_id
                WHERE q.seller_id = ?
                  AND q.status = 'pending'
                  AND q.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                ORDER BY q.total_value DESC
            `, [sellerId]);

            for (const row of rows) {
                signals.push({
                    sellerId,
                    customerId: row.customer_id,
                    source: 'ERP',
                    signalType: 'QUOTE_AGING',
                    signalTs: row.created_at,
                    entityType: 'QUOTE',
                    entityId: String(row.quote_id),
                    payloadJson: {
                        customer_name: row.customer_name,
                        total_value: parseFloat(row.total_value || 0),
                        days_old: row.days_old
                    }
                });
            }
        } catch (error) {
            // Table may not exist - just log debug
            logger.debug('SignalCollector: Quotes table not found or error', error.message);
        }

        return signals;
    }

    // ==========================================================
    // CHURN SIGNALS
    // ==========================================================

    /**
     * Collect high churn risk customers
     * Signal: CHURN_RISK (score >= 0.65)
     */
    async collectChurnSignals(sellerId) {
        const signals = [];

        try {
            const [rows] = await db().execute(`
                SELECT 
                    cs.customer_id,
                    c.nome as customer_name,
                    cs.score,
                    cs.risk_level,
                    cs.days_since_last_order,
                    cs.updated_at
                FROM staging.customer_churn_scores cs
                LEFT JOIN mak.clientes c ON c.id = cs.customer_id
                LEFT JOIN mak.vendedores v ON v.id = c.idvend
                WHERE v.id = ?
                  AND cs.score >= 65
                ORDER BY cs.score DESC
                LIMIT 50
            `, [sellerId]);

            for (const row of rows) {
                signals.push({
                    sellerId,
                    customerId: row.customer_id,
                    source: 'CHURN',
                    signalType: 'CHURN_HIGH_RISK',
                    signalTs: row.updated_at || new Date(),
                    entityType: 'CUSTOMER',
                    entityId: String(row.customer_id),
                    payloadJson: {
                        customer_name: row.customer_name,
                        churn_score: row.score / 100, // Normalize to 0-1
                        risk_level: row.risk_level,
                        days_inactive: row.days_since_last_order
                    }
                });
            }
        } catch (error) {
            logger.debug('SignalCollector: Churn scores not found', error.message);
        }

        return signals;
    }

    // ==========================================================
    // GOAL SIGNALS
    // ==========================================================

    /**
     * Collect customers behind goal
     * Signal: GOAL_BEHIND (progress < 80%)
     */
    async collectGoalSignals(sellerId) {
        const signals = [];

        try {
            // Get current month goal progress
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

            const [rows] = await db().execute(`
                SELECT 
                    g.customer_id,
                    c.nome as customer_name,
                    g.goal_value,
                    g.achieved_value,
                    ROUND((g.achieved_value / NULLIF(g.goal_value, 0)) * 100, 2) as progress_pct,
                    g.period
                FROM staging.customer_goals g
                LEFT JOIN mak.clientes c ON c.id = g.customer_id
                LEFT JOIN mak.vendedores v ON v.id = c.idvend
                WHERE v.id = ?
                  AND g.period = ?
                  AND g.goal_value > 0
                  AND (g.achieved_value / NULLIF(g.goal_value, 0)) < 0.8
                ORDER BY g.goal_value DESC
                LIMIT 50
            `, [sellerId, currentMonth]);

            for (const row of rows) {
                signals.push({
                    sellerId,
                    customerId: row.customer_id,
                    source: 'GOAL',
                    signalType: 'GOAL_BEHIND',
                    signalTs: new Date(),
                    entityType: 'CUSTOMER',
                    entityId: String(row.customer_id),
                    payloadJson: {
                        customer_name: row.customer_name,
                        goal_value: parseFloat(row.goal_value || 0),
                        achieved_value: parseFloat(row.achieved_value || 0),
                        progress_pct: parseFloat(row.progress_pct || 0),
                        period: row.period
                    }
                });
            }
        } catch (error) {
            logger.debug('SignalCollector: Goals not found', error.message);
        }

        return signals;
    }

    // ==========================================================
    // CUSTOMER SIGNALS
    // ==========================================================

    /**
     * Collect inactive customers
     * Signal: INACTIVE_CUSTOMER (no purchase in X days)
     */
    async collectCustomerSignals(sellerId) {
        const signals = [];

        try {
            const [rows] = await db().execute(`
                SELECT 
                    c.id as customer_id,
                    c.nome as customer_name,
                    MAX(h.data) as last_order_date,
                    DATEDIFF(NOW(), MAX(h.data)) as days_inactive,
                    SUM(CASE WHEN h.data >= DATE_SUB(NOW(), INTERVAL 365 DAY) THEN h.valor ELSE 0 END) as annual_revenue
                FROM mak.clientes c
                LEFT JOIN mak.hoje h ON h.idcli = c.id AND h.valor > 0
                WHERE c.idvend = ?
                  AND c.ativo = 'S'
                GROUP BY c.id, c.nome
                HAVING days_inactive BETWEEN 60 AND 180
                   AND annual_revenue > 5000
                ORDER BY annual_revenue DESC
                LIMIT 30
            `, [sellerId]);

            for (const row of rows) {
                signals.push({
                    sellerId,
                    customerId: row.customer_id,
                    source: 'CRM',
                    signalType: 'INACTIVE_CUSTOMER',
                    signalTs: row.last_order_date || new Date(),
                    entityType: 'CUSTOMER',
                    entityId: String(row.customer_id),
                    payloadJson: {
                        customer_name: row.customer_name,
                        last_order_date: row.last_order_date,
                        days_inactive: row.days_inactive,
                        annual_revenue: parseFloat(row.annual_revenue || 0)
                    }
                });
            }
        } catch (error) {
            logger.debug('SignalCollector: Customers error', error.message);
        }

        return signals;
    }
}

export const signalCollector = new SignalCollector();
