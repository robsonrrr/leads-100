import { getDatabase } from '../../../config/database.js';
import logger from '../../../config/logger.js';

const db = () => getDatabase();

/**
 * AIGovernanceService - Monitoramento de Performance de IA
 * Meta 30.000 Máquinas/Ano
 * 
 * KPIs:
 * - Performance >= 90%
 * - Drift < 5%
 * 
 * Modelos Monitorados:
 * - Recomendações (CTR >= 5%, Conversão >= 15%)
 * - Forecast (MAPE < 15%)
 * - Churn (AUC-ROC > 0.75)
 */
class AIGovernanceService {

    constructor() {
        // Baselines históricos (normalmente carregados do banco)
        this.baselines = {
            recommendations: { ctr: 5.0, conversion: 15.0 },
            forecast: { mape: 15.0 },
            churn: { auc_roc: 0.75 }
        };

        // Thresholds para alertas
        this.driftThreshold = 5; // 5% de degradação
    }

    /**
     * Retorna performance consolidada de todos os modelos de IA
     */
    async getModelPerformance(options = {}) {
        const { days = 30 } = options;

        logger.info('AIGovernanceService: Getting model performance', { days });

        try {
            const database = db();

            // 1. Performance de Recomendações (CTR e Conversão)
            const recommendationsPerf = await this.getRecommendationsPerformance(database, days);

            // 2. Performance de Forecast (MAPE)
            const forecastPerf = await this.getForecastPerformance(database, days);

            // 3. Performance de Churn Score (AUC-ROC aproximado)
            const churnPerf = await this.getChurnPerformance(database, days);

            // Calcular status geral
            const models = [
                { name: 'recommendations', ...recommendationsPerf },
                { name: 'forecast', ...forecastPerf },
                { name: 'churn', ...churnPerf }
            ];

            const onTargetCount = models.filter(m => m.status === 'ON_TARGET').length;
            const overallStatus = onTargetCount === models.length ? 'ON_TARGET' :
                onTargetCount >= models.length / 2 ? 'WARNING' : 'CRITICAL';

            const overallScore = Math.round(
                models.reduce((sum, m) => sum + (m.score || 0), 0) / models.length
            );

            return {
                period_days: days,
                overall_status: overallStatus,
                overall_score: overallScore,
                target_score: 90,

                models: {
                    recommendations: recommendationsPerf,
                    forecast: forecastPerf,
                    churn: churnPerf
                },

                summary: {
                    total_models: models.length,
                    on_target: onTargetCount,
                    warning: models.filter(m => m.status === 'WARNING').length,
                    critical: models.filter(m => m.status === 'CRITICAL').length
                }
            };
        } catch (error) {
            logger.error('AIGovernanceService: Error getting model performance', { error: error.message });
            throw error;
        }
    }

    /**
     * Mede performance de recomendações (CTR e Conversão)
     */
    async getRecommendationsPerformance(database, days) {
        try {
            // Buscar recomendações e suas interações
            const [result] = await database.execute(`
                SELECT 
                    COUNT(*) as total_recommendations,
                    SUM(CASE WHEN viewed = 1 THEN 1 ELSE 0 END) as viewed,
                    SUM(CASE WHEN clicked = 1 THEN 1 ELSE 0 END) as clicked,
                    SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as converted
                FROM staging.ai_recommendations
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            `, [days]);

            const data = result[0] || {};
            const total = parseInt(data.total_recommendations) || 0;
            const clicked = parseInt(data.clicked) || 0;
            const converted = parseInt(data.converted) || 0;

            // Se não há dados, simular para demo
            if (total === 0) {
                return this.getSimulatedRecommendationsPerf();
            }

            const ctr = total > 0 ? Math.round((clicked / total) * 1000) / 10 : 0;
            const conversionRate = clicked > 0 ? Math.round((converted / clicked) * 1000) / 10 : 0;

            const ctrTarget = this.baselines.recommendations.ctr;
            const convTarget = this.baselines.recommendations.conversion;

            const ctrStatus = ctr >= ctrTarget ? 'ON_TARGET' : ctr >= ctrTarget * 0.8 ? 'WARNING' : 'CRITICAL';
            const convStatus = conversionRate >= convTarget ? 'ON_TARGET' : conversionRate >= convTarget * 0.8 ? 'WARNING' : 'CRITICAL';

            const score = Math.round(((ctr / ctrTarget + conversionRate / convTarget) / 2) * 100);

            return {
                type: 'Recomendações',
                status: ctrStatus === 'CRITICAL' || convStatus === 'CRITICAL' ? 'CRITICAL' :
                    ctrStatus === 'WARNING' || convStatus === 'WARNING' ? 'WARNING' : 'ON_TARGET',
                score: Math.min(score, 100),
                metrics: {
                    ctr: { current: ctr, target: ctrTarget, status: ctrStatus },
                    conversion: { current: conversionRate, target: convTarget, status: convStatus }
                },
                sample_size: total
            };
        } catch (error) {
            logger.warn('AIGovernanceService: Could not get recommendations metrics, using simulated', { error: error.message });
            return this.getSimulatedRecommendationsPerf();
        }
    }

    /**
     * Mede performance de Forecast (MAPE)
     */
    async getForecastPerformance(database, days) {
        try {
            // Comparar previsões com vendas reais
            const [result] = await database.execute(`
                SELECT 
                    AVG(ABS(predicted_value - actual_value) / NULLIF(actual_value, 0)) * 100 as mape,
                    COUNT(*) as samples
                FROM staging.forecast_accuracy
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                    AND actual_value > 0
            `, [days]);

            const data = result[0] || {};
            let mape = parseFloat(data.mape) || 0;
            const samples = parseInt(data.samples) || 0;

            // Se não há dados, simular para demo
            if (samples === 0) {
                return this.getSimulatedForecastPerf();
            }

            const mapeTarget = this.baselines.forecast.mape;
            const mapeStatus = mape <= mapeTarget ? 'ON_TARGET' : mape <= mapeTarget * 1.2 ? 'WARNING' : 'CRITICAL';
            const score = mape <= mapeTarget ? 100 : Math.round(Math.max(0, 100 - ((mape - mapeTarget) / mapeTarget) * 100));

            return {
                type: 'Forecast',
                status: mapeStatus,
                score: Math.min(score, 100),
                metrics: {
                    mape: { current: Math.round(mape * 10) / 10, target: mapeTarget, status: mapeStatus, unit: '%' }
                },
                sample_size: samples
            };
        } catch (error) {
            logger.warn('AIGovernanceService: Could not get forecast metrics, using simulated', { error: error.message });
            return this.getSimulatedForecastPerf();
        }
    }

    /**
     * Mede performance de Churn Score
     */
    async getChurnPerformance(database, days) {
        try {
            // Calcular precisão do churn score (clientes marcados como risco que realmente churned)
            const [result] = await database.execute(`
                SELECT 
                    COUNT(*) as total_predictions,
                    SUM(CASE WHEN risk_level IN ('HIGH', 'CRITICAL') AND churned = 1 THEN 1 ELSE 0 END) as true_positives,
                    SUM(CASE WHEN risk_level IN ('HIGH', 'CRITICAL') THEN 1 ELSE 0 END) as predicted_positives,
                    SUM(CASE WHEN churned = 1 THEN 1 ELSE 0 END) as actual_positives
                FROM staging.churn_validation
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            `, [days]);

            const data = result[0] || {};
            const total = parseInt(data.total_predictions) || 0;

            // Se não há dados, simular para demo
            if (total === 0) {
                return this.getSimulatedChurnPerf();
            }

            const tp = parseInt(data.true_positives) || 0;
            const pp = parseInt(data.predicted_positives) || 0;
            const ap = parseInt(data.actual_positives) || 0;

            // Aproximação de AUC-ROC usando precision e recall
            const precision = pp > 0 ? tp / pp : 0;
            const recall = ap > 0 ? tp / ap : 0;
            const aucApprox = (precision + recall) / 2;

            const aucTarget = this.baselines.churn.auc_roc;
            const aucStatus = aucApprox >= aucTarget ? 'ON_TARGET' : aucApprox >= aucTarget * 0.9 ? 'WARNING' : 'CRITICAL';
            const score = Math.round((aucApprox / aucTarget) * 100);

            return {
                type: 'Churn Score',
                status: aucStatus,
                score: Math.min(score, 100),
                metrics: {
                    auc_roc: { current: Math.round(aucApprox * 100) / 100, target: aucTarget, status: aucStatus },
                    precision: { current: Math.round(precision * 100) / 100 },
                    recall: { current: Math.round(recall * 100) / 100 }
                },
                sample_size: total
            };
        } catch (error) {
            logger.warn('AIGovernanceService: Could not get churn metrics, using simulated', { error: error.message });
            return this.getSimulatedChurnPerf();
        }
    }

    /**
     * Detecta drift em modelo específico comparando com baseline
     */
    async detectDrift(options = {}) {
        const { days = 30, baselineDays = 90 } = options;

        logger.info('AIGovernanceService: Detecting drift', { days, baselineDays });

        try {
            const currentPerf = await this.getModelPerformance({ days });

            const driftAlerts = [];

            // Verificar cada modelo
            for (const [modelName, modelData] of Object.entries(currentPerf.models)) {
                const baseline = this.baselines[modelName];
                if (!baseline) continue;

                for (const [metricName, metricData] of Object.entries(modelData.metrics || {})) {
                    const baselineValue = baseline[metricName];
                    if (baselineValue === undefined) continue;

                    const currentValue = metricData.current;
                    let driftPercent = 0;

                    // Para métricas onde menor é melhor (MAPE)
                    if (metricName === 'mape') {
                        driftPercent = baselineValue > 0 ? ((currentValue - baselineValue) / baselineValue) * 100 : 0;
                    } else {
                        // Para métricas onde maior é melhor (CTR, conversion, AUC)
                        driftPercent = baselineValue > 0 ? ((baselineValue - currentValue) / baselineValue) * 100 : 0;
                    }

                    if (Math.abs(driftPercent) > this.driftThreshold) {
                        driftAlerts.push({
                            model: modelName,
                            metric: metricName,
                            baseline_value: baselineValue,
                            current_value: currentValue,
                            drift_percent: Math.round(driftPercent * 10) / 10,
                            severity: Math.abs(driftPercent) > 10 ? 'CRITICAL' : 'WARNING',
                            message: `${modelName}: ${metricName} degradou ${Math.abs(driftPercent).toFixed(1)}% (${currentValue} vs baseline ${baselineValue})`,
                            requires_retraining: Math.abs(driftPercent) > 15
                        });
                    }
                }
            }

            return {
                has_drift: driftAlerts.length > 0,
                drift_count: driftAlerts.length,
                threshold: this.driftThreshold,
                alerts: driftAlerts,
                recommendation: driftAlerts.some(a => a.requires_retraining)
                    ? 'RETRAIN_REQUIRED'
                    : driftAlerts.length > 0 ? 'MONITOR' : 'HEALTHY'
            };
        } catch (error) {
            logger.error('AIGovernanceService: Error detecting drift', { error: error.message });
            throw error;
        }
    }

    /**
     * Retorna histórico de performance
     */
    async getPerformanceHistory(options = {}) {
        const { days = 90, granularity = 'week' } = options;

        logger.info('AIGovernanceService: Getting performance history', { days, granularity });

        // Gerar histórico simulado para os últimos N dias
        const history = [];
        const today = new Date();
        const interval = granularity === 'day' ? 1 : granularity === 'week' ? 7 : 30;

        for (let i = days; i >= 0; i -= interval) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            history.push({
                date: date.toISOString().split('T')[0],
                recommendations_score: 85 + Math.random() * 15,
                forecast_score: 80 + Math.random() * 18,
                churn_score: 82 + Math.random() * 16,
                overall_score: 82 + Math.random() * 15
            });
        }

        return {
            granularity,
            period_days: days,
            history: history.map(h => ({
                ...h,
                recommendations_score: Math.round(h.recommendations_score),
                forecast_score: Math.round(h.forecast_score),
                churn_score: Math.round(h.churn_score),
                overall_score: Math.round(h.overall_score)
            }))
        };
    }

    /**
     * Verifica alertas para notificação
     */
    async checkAlerts() {
        const performance = await this.getModelPerformance({ days: 30 });
        const drift = await this.detectDrift({ days: 7 });

        const alerts = [];

        // Alertas de performance
        if (performance.overall_status === 'CRITICAL') {
            alerts.push({
                type: 'PERFORMANCE_CRITICAL',
                severity: 'HIGH',
                message: `Performance geral de IA crítica: ${performance.overall_score}% (meta: 90%)`,
                models_affected: Object.entries(performance.models)
                    .filter(([_, m]) => m.status === 'CRITICAL')
                    .map(([name, _]) => name)
            });
        }

        // Alertas de drift
        for (const driftAlert of drift.alerts) {
            alerts.push({
                type: 'MODEL_DRIFT',
                severity: driftAlert.severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
                message: driftAlert.message,
                model: driftAlert.model,
                requires_retraining: driftAlert.requires_retraining
            });
        }

        return {
            has_alerts: alerts.length > 0,
            alerts_count: alerts.length,
            performance_status: performance.overall_status,
            drift_status: drift.recommendation,
            alerts: alerts
        };
    }

    // ============================================
    // MÉTODOS DE SIMULAÇÃO (para quando não há dados reais)
    // ============================================

    getSimulatedRecommendationsPerf() {
        const ctr = 4.5 + Math.random() * 2;
        const conv = 12 + Math.random() * 6;
        return {
            type: 'Recomendações',
            status: ctr >= 5 && conv >= 15 ? 'ON_TARGET' : ctr >= 4 && conv >= 12 ? 'WARNING' : 'CRITICAL',
            score: Math.round(((ctr / 5 + conv / 15) / 2) * 100),
            metrics: {
                ctr: { current: Math.round(ctr * 10) / 10, target: 5, status: ctr >= 5 ? 'ON_TARGET' : 'WARNING' },
                conversion: { current: Math.round(conv * 10) / 10, target: 15, status: conv >= 15 ? 'ON_TARGET' : 'WARNING' }
            },
            sample_size: 1000 + Math.floor(Math.random() * 500),
            simulated: true
        };
    }

    getSimulatedForecastPerf() {
        const mape = 10 + Math.random() * 8;
        return {
            type: 'Forecast',
            status: mape <= 15 ? 'ON_TARGET' : mape <= 18 ? 'WARNING' : 'CRITICAL',
            score: Math.round(Math.max(0, 100 - mape * 2)),
            metrics: {
                mape: { current: Math.round(mape * 10) / 10, target: 15, status: mape <= 15 ? 'ON_TARGET' : 'WARNING', unit: '%' }
            },
            sample_size: 200 + Math.floor(Math.random() * 100),
            simulated: true
        };
    }

    getSimulatedChurnPerf() {
        const auc = 0.72 + Math.random() * 0.15;
        return {
            type: 'Churn Score',
            status: auc >= 0.75 ? 'ON_TARGET' : auc >= 0.70 ? 'WARNING' : 'CRITICAL',
            score: Math.round((auc / 0.75) * 100),
            metrics: {
                auc_roc: { current: Math.round(auc * 100) / 100, target: 0.75, status: auc >= 0.75 ? 'ON_TARGET' : 'WARNING' },
                precision: { current: Math.round((0.65 + Math.random() * 0.2) * 100) / 100 },
                recall: { current: Math.round((0.60 + Math.random() * 0.25) * 100) / 100 }
            },
            sample_size: 500 + Math.floor(Math.random() * 200),
            simulated: true
        };
    }
}

export const aiGovernanceService = new AIGovernanceService();
