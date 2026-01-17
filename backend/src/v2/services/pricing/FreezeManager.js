import { query } from '../../../config/database.js';
import logger from '../../../config/logger.js';

/**
 * Freeze Manager - Controla imutabilidade pós-conversão (Price Freeze)
 * Garante que uma vez que o lead virou pedido, o preço não mude sem uma nova exceção formal.
 */
export class FreezeManager {
    /**
     * Ativa o congelamento de preço para um evento de decisão.
     * Chamado no momento da conversão do pedido.
     */
    async freeze(event_id) {
        logger.info('V2: Freezing pricing event', { event_id });

        try {
            const sql = `
        UPDATE pricing_decision_events 
        SET is_frozen = 1, compliance_status = 'FROZEN'
        WHERE event_id = ?
      `;

            const results = await query(sql, [event_id]);

            return {
                success: results.affectedRows > 0,
                event_id,
                is_frozen: true
            };
        } catch (error) {
            logger.error('V2: Failed to freeze pricing event', { error: error.message });
            throw error;
        }
    }

    /**
     * Verifica se um pedido ou lead já está congelado.
     */
    async checkIsFrozen(event_id) {
        try {
            const sql = `SELECT is_frozen FROM pricing_decision_events WHERE event_id = ?`;
            const results = await query(sql, [event_id]);

            return results.length > 0 && results[0].is_frozen === 1;
        } catch (error) {
            return false;
        }
    }
}
