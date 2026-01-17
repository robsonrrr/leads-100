import logger from '../../../config/logger.js';
import { query } from '../../../config/database.js';

/**
 * AI Service - Fundação para Inteligência Artificial (Q1 2026)
 * Focado em recomendações de preço e análises preditivas sob governança.
 */
export class AIService {
    /**
     * Sugere um preço ideal baseado no histórico e na política.
     * IA Generativa sob Governança (Checklist 3.1.2)
     */
    async suggestPrice(productId, customerId, context = {}) {
        logger.info('V2: AIService calculating price suggestion', { productId, customerId });

        try {
            // 1. Buscar histórico de preços praticados para este produto/segmento
            const history = await this.getPriceHistory(productId, customerId);

            // 2. Mock de lógica de IA (No Q2 integraremos com LLMs/Modelos de ML)
            // Por enquanto usamos uma média ponderada do histórico com um viés de otimização
            const basePrice = context.unit_price_list || 100;
            const minMargin = context.limits?.min_margin_percent || 20;
            const cost = context.unit_cost || 60;

            // Sugestão "Inteligente": Média do histórico, mas nunca abaixo da margem mínima + 2% de "safety buffer"
            const historicAvg = history.avg_price || basePrice * 0.95;
            const safeMin = cost / (1 - (minMargin + 2) / 100);

            const suggestedPrice = Math.max(historicAvg, safeMin);

            return {
                suggested_price: Math.round(suggestedPrice * 100) / 100,
                confidence_level: history.count > 5 ? 'HIGH' : 'MEDIUM',
                reasoning: history.count > 0
                    ? `Baseado em ${history.count} vendas anteriores e margem alvo de ${minMargin + 2}%.`
                    : `Baseado em margem estratégica de ${minMargin + 2}% (sem histórico suficiente).`,
                impact_analysis: {
                    expected_margin: Math.round(((suggestedPrice - cost) / suggestedPrice) * 10000) / 100
                }
            };
        } catch (error) {
            logger.error('V2: AIService suggestion failed', { error: error.message });
            return null;
        }
    }

    /**
     * Predição de Risco de Churn/Conversão (Preparação para Q2)
     */
    async predictConversion(customerId, pricingDetails) {
        // Placeholder para lógica preditiva do Q2
        return {
            probability: 0.75,
            factors: ['Histórico de fidelidade', 'Preço competitivo']
        };
    }

    /**
     * Auxiliar: Busca média de preços praticados na tabela legacy mak.hist
     */
    async getPriceHistory(productId, customerId) {
        try {
            const sql = `
        SELECT 
          AVG(hi.valor / hi.quant) as avg_price,
          COUNT(*) as count
        FROM mak.hist hi
        INNER JOIN mak.hoje h ON hi.pedido = h.id
        WHERE hi.isbn = ? AND h.idcli = ? AND hi.quant > 0
      `;
            const results = await query(sql, [productId, customerId]);
            return results[0] || { avg_price: null, count: 0 };
        } catch (error) {
            return { avg_price: null, count: 0 };
        }
    }
}

export const aiService = new AIService();
