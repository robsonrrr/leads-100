import axios from 'axios';
import logger from '../../../config/logger.js';

/**
 * FourCService - Integração com a API de Inteligência e Decisão 4C (Q2 2026)
 */
class FourCService {
    constructor() {
        this.apiUrl = process.env.FOURC_API_URL || 'http://fourc_decision-api:8080';
        this.orgId = process.env.FOURC_ORG_ID || 1;
    }

    /**
     * POST /decide
     * Solicita ao 4C uma decisão sobre qual a próxima melhor oferta para o cliente
     * @param {number} customerId - ID do cliente no CRM
     * @param {Array} candidates - Lista de produtos candidatos (estoque/promoção)
     * @returns {Object} Decisão da IA com oferta e justificativa
     */
    async decide(customerId, candidates = []) {
        try {
            const payload = {
                customer_id: customerId,
                org_id: this.orgId,
                candidates,
                include_natural_justification: true
            };

            logger.info('4C Intelligence: Requesting decision', { customerId, candidatesCount: candidates.length });

            const response = await axios.post(`${this.apiUrl}/decide`, payload, {
                timeout: 5000 // Timeouts curtos para não travar o CRM
            });

            return {
                success: true,
                data: response.data
            };

        } catch (error) {
            // Caso a política de governança tenha bloqueado a oferta (409 Conflict)
            if (error.response && error.response.status === 409) {
                logger.warn('4C Intelligence: Decision blocked by governance', {
                    customerId,
                    reasons: error.response.data.detail?.reasons
                });
                return {
                    success: false,
                    blocked: true,
                    reasons: error.response.data.detail?.reasons || ['Políticas de governança interna']
                };
            }

            logger.error('4C Intelligence: API Error', { error: error.message, customerId });
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Envia feedback sobre o resultado da recomendação
     * @param {string} decisionId - ID da decisão gerada pelo 4C
     * @param {string} outcome - 'ACCEPTED', 'REJECTED', 'CONVERTED'
     */
    async feedback(decisionId, outcome) {
        try {
            await axios.post(`${this.apiUrl}/feedback`, {
                decision_id: decisionId,
                outcome,
                timestamp: new Date().toISOString()
            });
            logger.info('4C Intelligence: Feedback sent', { decisionId, outcome });
        } catch (error) {
            logger.error('4C Intelligence: Failed to send feedback', { error: error.message, decisionId });
        }
    }
}

export const fourCService = new FourCService();
