import { v4 as uuidv4 } from 'uuid';
import logger from '../../../config/logger.js';
import { query } from '../../../config/database.js';

/**
 * Decision Logger - Registra PricingDecisionEvent
 * Transforma o objeto de decisão em um registro persistente no banco de dados.
 */
export class DecisionLogger {
    /**
     * Registra um evento de decisão de pricing no banco de dados.
     * @param {Object} eventData - O objeto PricingDecisionEvent completo.
     */
    async log(eventData) {
        const event = {
            event_id: uuidv4(),
            event_version: '1.0',
            event_timestamp: new Date(),
            ...eventData
        };

        try {
            logger.info('V2: Persisting Pricing Decision Event', { event_id: event.event_id, action: event.action });

            const sql = `
        INSERT INTO pricing_decision_events (
          event_id, event_version, event_timestamp,
          source, action, 
          customer_id, seller_id, lead_id, order_id, cart_id,
          policy_version,
          price_base, price_final, discount_total, discount_percent,
          margin_absolute, margin_percent,
          risk_level, compliance_status,
          is_within_policy, requires_approval, is_frozen,
          customer_context, seller_context, transaction_context,
          policy_context, pricing_result, metadata,
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

            const params = [
                event.event_id,
                event.event_version,
                event.event_timestamp,
                event.source,
                event.action,
                event.customer_context?.customer_id || 0,
                event.seller_context?.seller_id || 0,
                event.transaction_context?.lead_id || null,
                event.transaction_context?.order_id || null,
                event.transaction_context?.cart_id || 0,
                event.policy_context?.policy_version || '1.0',
                event.pricing_result?.price_base || 0,
                event.pricing_result?.price_final || 0,
                event.pricing_result?.discount_total || 0,
                event.pricing_result?.discount_percent || 0,
                event.pricing_result?.margin_absolute || 0,
                event.pricing_result?.margin_percent || 0,
                event.risk_level || 'LOW',
                event.compliance_status || 'APPROVED',
                event.is_within_policy ? 1 : 0,
                event.requires_approval ? 1 : 0,
                event.is_frozen ? 1 : 0,
                JSON.stringify(event.customer_context || {}),
                JSON.stringify(event.seller_context || {}),
                JSON.stringify(event.transaction_context || {}),
                JSON.stringify(event.policy_context || {}),
                JSON.stringify(event.pricing_result || {}),
                JSON.stringify(event.metadata || {}),
                event.metadata?.created_by || 0
            ];

            await query(sql, params);

            return event;
        } catch (error) {
            logger.error('V2: Failed to log pricing decision', { error: error.message, event_id: event.event_id });
            // Mesmo se o log falhar, retornamos o evento para não quebrar o fluxo do usuário, 
            // mas o log de erro acima alertará os administradores.
            return event;
        }
    }
}
