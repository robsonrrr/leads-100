import { query } from '../../../config/database.js';
import logger from '../../../config/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Exception Handler - Gerencia workflow de exceções
 * Quando uma política é violada, este serviço cria e gerencia o pedido de aprovação.
 */
export class ExceptionHandler {
    /**
     * Cria uma solicitação de exceção.
     * @param {Object} decisionEvent - O evento que gerou a violação
     * @param {String} reason - Justificativa do vendedor
     */
    async request(decisionEvent, reason) {
        const exception_id = uuidv4();

        logger.info('V2: Creating pricing exception request', {
            exception_id,
            event_id: decisionEvent.event_id
        });

        try {
            const sql = `
        INSERT INTO pricing_exceptions (
          exception_id, event_id, status,
          requested_by, requested_discount, requested_reason,
          expires_at, margin_impact
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

            // Expira em 24 horas por padrão
            const expires_at = new Date();
            expires_at.setHours(expires_at.getHours() + 24);

            const params = [
                exception_id,
                decisionEvent.event_id,
                'PENDING',
                decisionEvent.metadata?.created_by || 0,
                decisionEvent.pricing_result?.discount_percent || 0,
                reason || 'Não informada',
                expires_at,
                decisionEvent.pricing_result?.margin_absolute || 0
            ];

            await query(sql, params);

            return {
                success: true,
                exception_id,
                status: 'PENDING',
                message: 'Solicitação de exceção enviada para aprovação.'
            };
        } catch (error) {
            logger.error('V2: Failed to create exception request', { error: error.message });
            throw error;
        }
    }

    /**
     * Decide sobre uma exceção (Aprovar/Rejeitar).
     */
    async decide(exceptionId, status, approverId, notes) {
        logger.info('V2: Deciding on exception', { exceptionId, status, approverId });

        try {
            const sql = `
        UPDATE pricing_exceptions 
        SET status = ?, approved_by = ?, approved_at = NOW(), approval_notes = ?
        WHERE exception_id = ?
      `;

            await query(sql, [status, approverId, notes, exceptionId]);

            // TODO: Se aprovado, atualizar status_compliance no evento original via DecisionLogger

            return { success: true, exception_id: exceptionId, new_status: status };
        } catch (error) {
            logger.error('V2: Failed to decide on exception', { error: error.message });
            throw error;
        }
    }
}
