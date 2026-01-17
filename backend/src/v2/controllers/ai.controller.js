import { forecastService } from '../services/analytics/ForecastService.js';
import { churnService } from '../services/analytics/ChurnService.js';
import { recommendationService } from '../services/analytics/RecommendationService.js';
import logger from '../../config/logger.js';

export class AIController {
    /**
     * Endpoint de Previsão de Vendas
     */
    async getForecast(req, res) {
        try {
            const { sellerId, segment, days } = req.query;

            // Segurança: Se for vendedor, só pode ver o seu próprio forecast
            const targetSellerId = req.user.level <= 1 ? req.user.id : sellerId;

            const result = await forecastService.predict({
                sellerId: targetSellerId,
                segment,
                days: parseInt(days) || 30
            });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Controller Error - getForecast:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Erro ao gerar previsão de vendas',
                    details: error.message
                }
            });
        }
    }

    /**
     * Endpoint de Risco de Churn
     */
    async getChurnRisk(req, res) {
        try {
            const { customerId } = req.query;
            if (!customerId) {
                return res.status(400).json({ success: false, error: { message: 'customerId é obrigatório' } });
            }

            const result = await churnService.getScore(customerId);

            res.json({
                success: true,
                data: result || { message: 'Sem dados de risco para este cliente' }
            });
        } catch (error) {
            logger.error('Controller Error - getChurnRisk:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Erro ao buscar risco de churn',
                    details: error.message
                }
            });
        }
    }

    /**
     * Endpoint de Análise de Desvio (Previsto vs Realizado)
     */
    async getDeviation(req, res) {
        try {
            const { sellerId, days } = req.query;

            // Segurança: vendedores só veem seus próprios dados
            const targetSellerId = req.user.level <= 1 ? req.user.id : sellerId;

            const result = await forecastService.analyzeDeviation({
                sellerId: targetSellerId,
                days: parseInt(days) || 7
            });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Controller Error - getDeviation:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Erro ao analisar desvio de vendas',
                    details: error.message
                }
            });
        }
    }

    /**
     * Endpoint de Recomendações de Produtos
     */
    async getRecommendations(req, res) {
        try {
            const { customerId, cartItems } = req.query;
            let result;

            if (cartItems) {
                // Recomendações baseadas no carrinho (IDs separados por vírgula)
                const productIds = cartItems.split(',').map(id => parseInt(id));
                result = await recommendationService.getForCart(productIds);
            } else if (customerId) {
                // Recomendações personalizadas para o cliente
                const targetSellerId = req.user.level <= 1 ? req.user.id : null;
                result = await recommendationService.getForCustomer(customerId, 5, targetSellerId);
            } else {
                return res.status(400).json({
                    success: false,
                    error: { message: 'Forneça customerId ou cartItems' }
                });
            }

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Controller Error - getRecommendations:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Erro ao buscar recomendações',
                    details: error.message
                }
            });
        }
    }

    /**
     * Endpoint de Recomendação de Desconto
     */
    async getDiscountRecommendation(req, res) {
        try {
            const { customerId, productId } = req.query;
            if (!customerId || !productId) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'customerId e productId são obrigatórios' }
                });
            }

            const result = await recommendationService.getDiscountRecommendation(customerId, productId);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Controller Error - getDiscountRecommendation:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Erro ao buscar recomendação de desconto',
                    details: error.message
                }
            });
        }
    }
    /**
     * Endpoint de Validação do Modelo (Backtesting)
     */
    async validateForecast(req, res) {
        try {
            const { months, sellerId } = req.query;
            const targetSellerId = req.user.level <= 1 ? req.user.id : sellerId;

            const result = await forecastService.validateModel({
                months: parseInt(months) || 3,
                sellerId: targetSellerId
            });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Controller Error - validateForecast:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Erro ao validar modelo de previsão',
                    details: error.message
                }
            });
        }
    }

    /**
     * Endpoint de Relatório Mensal de Forecast
     */
    async getMonthlyForecastReport(req, res) {
        try {
            const { sellerId } = req.query;
            const targetSellerId = req.user.level <= 1 ? req.user.id : sellerId;

            // Gerar análise de desvio para os últimos 30 dias consolidada
            const analysis = await forecastService.analyzeDeviation({
                sellerId: targetSellerId,
                days: 30
            });

            // Adicionar previsões para os próximos 30 dias
            const prediction = await forecastService.predict({
                sellerId: targetSellerId,
                days: 30
            });

            res.json({
                success: true,
                data: {
                    title: `Relatório Mensal de Vendas - AI Leads Agent`,
                    generated_at: new Date().toISOString(),
                    historical_analysis: analysis,
                    future_forecast: prediction,
                    summary: {
                        last_30_days_actual: analysis.total_actual,
                        next_30_days_predicted: prediction.forecast.reduce((sum, f) => sum + f.predicted_value, 0),
                        growth_trend: prediction.growth_rate > 1 ? 'UP' : 'DOWN'
                    }
                }
            });
        } catch (error) {
            logger.error('Controller Error - getMonthlyForecastReport:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Erro ao gerar relatório mensal de forecast',
                    details: error.message
                }
            });
        }
    }
}


export const aiController = new AIController();
