import { forecastService } from '../../analytics/ForecastService.js';
import { churnService } from '../../analytics/ChurnService.js';
import { recommendationService } from '../../analytics/RecommendationService.js';
import logger from '../../../../config/logger.js';

export const analyticsTools = {
    definitions: [
        {
            type: 'function',
            function: {
                name: 'get_sales_forecast',
                description: 'Get sales forecast for the next 30 days. Can be filtered by segment or seller.',
                parameters: {
                    type: 'object',
                    properties: {
                        sellerId: { type: 'integer', description: 'Filter by seller ID' },
                        segment: { type: 'string', description: 'Filter by segment (e.g. TEXTIL, CALCADISTA)' },
                        days: { type: 'integer', description: 'Number of days to forecast (default 30)', default: 30 }
                    }
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'get_customer_churn_risk',
                description: 'Check the churn risk score for a specific customer. Higher scores (80+) mean critical risk of losing the customer.',
                parameters: {
                    type: 'object',
                    properties: {
                        customerId: { type: 'integer', description: 'The ID of the customer' }
                    },
                    required: ['customerId']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'check_sales_deviation',
                description: 'Compare actual sales vs predicted sales for the last N days. Use this when the user asks about sales performance, if they are meeting targets, or how they are doing compared to expectations.',
                parameters: {
                    type: 'object',
                    properties: {
                        days: { type: 'integer', description: 'Number of days to analyze (default 7)', default: 7 }
                    }
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'get_product_recommendations',
                description: 'Get product recommendations for a customer. Use this when the user asks what else they can sell to a customer, or for suggestions to offer.',
                parameters: {
                    type: 'object',
                    properties: {
                        customerId: { type: 'integer', description: 'The ID of the customer' },
                        limit: { type: 'integer', description: 'Number of recommendations to return (default 5)', default: 5 }
                    },
                    required: ['customerId']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'get_discount_recommendation',
                description: 'Get a recommended discount percentage for a specific product and customer based on historical deals.',
                parameters: {
                    type: 'object',
                    properties: {
                        customerId: { type: 'integer', description: 'The ID of the customer' },
                        productId: { type: 'integer', description: 'The ID of the product' }
                    },
                    required: ['customerId', 'productId']
                }
            }
        }
    ],

    handlers: {
        async get_sales_forecast(args) {
            const { sellerId, segment, days = 30, userId, userLevel } = args;

            try {
                // SEGURANÇA: Vendedores só veem seu próprio forecast
                const targetSellerId = userLevel <= 1 ? userId : sellerId;

                const result = await forecastService.predict({
                    sellerId: targetSellerId,
                    segment,
                    days
                });

                if (!result.forecast || result.forecast.length === 0) {
                    return JSON.stringify({ message: "Dados insuficientes para gerar previsão." });
                }

                const totalPredicted = result.forecast.reduce((sum, d) => sum + d.predicted_value, 0);

                return JSON.stringify({
                    summary: {
                        total_predicted: totalPredicted,
                        avg_daily: totalPredicted / days,
                        growth_rate: result.growth_rate
                    },
                    message: `Previsão de vendas para os próximos ${days} dias: R$ ${totalPredicted.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
                });
            } catch (error) {
                logger.error('Tool Error get_sales_forecast:', error);
                return JSON.stringify({ error: error.message });
            }
        },

        async get_customer_churn_risk({ customerId }) {
            try {
                const result = await churnService.getScore(customerId);
                if (!result) {
                    return JSON.stringify({ message: "Não há dados de risco disponíveis para este cliente no momento." });
                }

                return JSON.stringify({
                    score: result.score,
                    risk_level: result.risk_level,
                    days_since_last_order: result.days_since_last_order,
                    trend: result.avg_ticket_variation < 0 ? 'Queda no faturamento' : 'Estável/Crescente',
                    message: `O cliente tem um risco de churn ${result.risk_level} (Score: ${result.score}/100). Sua última compra foi há ${result.days_since_last_order} dias.`
                });
            } catch (error) {
                logger.error('Tool Error get_customer_churn_risk:', error);
                return JSON.stringify({ error: error.message });
            }
        },

        async check_sales_deviation(args) {
            const { days = 7, userId, userLevel } = args;

            try {
                const targetSellerId = userLevel <= 1 ? userId : null;
                const result = await forecastService.analyzeDeviation({
                    sellerId: targetSellerId,
                    days
                });

                const direction = result.overall_deviation_percent >= 0 ? 'acima' : 'abaixo';
                const absDeviation = Math.abs(result.overall_deviation_percent).toFixed(1);

                let statusMessage = '';
                if (result.requires_attention) {
                    statusMessage = `⚠️ Atenção: Suas vendas estão ${absDeviation}% ${direction} do previsto!`;
                } else {
                    statusMessage = `✅ Suas vendas estão dentro da meta (${absDeviation}% ${direction} do previsto).`;
                }

                return JSON.stringify({
                    period_days: result.period_days,
                    total_actual: result.total_actual,
                    total_expected: result.total_expected,
                    deviation_percent: result.overall_deviation_percent,
                    requires_attention: result.requires_attention,
                    message: statusMessage
                });
            } catch (error) {
                logger.error('Tool Error check_sales_deviation:', error);
                return JSON.stringify({ error: error.message });
            }
        },

        async get_product_recommendations({ customerId, limit = 5 }) {
            try {
                const result = await recommendationService.getForCustomer(customerId, limit);

                const repCount = result.replenishment.length;
                const crossCount = result.cross_sell.length;

                let message = `Encontrei ${repCount + crossCount} sugestões para este cliente.\n`;

                if (repCount > 0) {
                    message += `\nReposição (produtos que ele compra sempre):\n`;
                    result.replenishment.forEach(p => {
                        message += `- ${p.productCode}: ${p.productName} (Já comprou ${p.orders_count} vezes)\n`;
                    });
                }

                if (crossCount > 0) {
                    message += `\nSugestões Cross-sell (tendências do segmento):\n`;
                    result.cross_sell.forEach(p => {
                        message += `- ${p.codigo}: ${p.descricao}\n`;
                    });
                }

                return JSON.stringify({
                    recommendations: result,
                    message: message
                });
            } catch (error) {
                logger.error('Tool Error get_product_recommendations:', error);
                return JSON.stringify({ error: error.message });
            }
        },

        async get_discount_recommendation({ customerId, productId }) {
            try {
                const result = await recommendationService.getDiscountRecommendation(customerId, productId);
                return JSON.stringify({
                    suggested_discount: result.suggested_discount,
                    rationale: result.rationale,
                    message: `A IA sugere um desconto de ${result.suggested_discount}% para este item. Raciocínio: ${result.rationale}`
                });
            } catch (error) {
                logger.error('Tool Error get_discount_recommendation:', error);
                return JSON.stringify({ error: error.message });
            }
        }
    }
};
