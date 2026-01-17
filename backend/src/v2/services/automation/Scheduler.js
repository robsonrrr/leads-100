import { automationEngine } from './AutomationEngine.js';
import { churnService } from '../analytics/ChurnService.js';
import { getDatabase } from '../../../config/database.js';
import logger from '../../../config/logger.js';

const db = () => getDatabase();

export class AutomationScheduler {
    constructor() {
        this.intervals = [];
    }

    start() {
        logger.info('V2: Automation Scheduler started');

        // Tarefa 1: Recalcular Churn e disparar alertas (A cada 6 horas para demo/dev)
        const churnTask = setInterval(async () => {
            try {
                logger.info('Running scheduled churn analysis...');
                await churnService.calculateScores();

                // Buscar clientes com risco crítico (Score > 80) que ainda não tiveram alerta hoje
                const [critical] = await db().execute(`
                    SELECT s.* FROM staging.customer_churn_scores s
                    WHERE s.risk_level = 'CRITICAL'
                    AND NOT EXISTS (
                        SELECT 1 FROM staging.alerts a 
                        WHERE a.reference_id = CONCAT('CHURN_', s.customer_id)
                        AND a.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
                    )
                `);

                for (const row of critical) {
                    await automationEngine.trigger({
                        type: 'CHURN_RISK_HIGH',
                        customerId: row.customer_id,
                        userId: 1, // Default Admin ou vendedor responsável (TODO)
                        referenceId: `CHURN_${row.customer_id}`
                    });
                }

            } catch (error) {
                logger.error('Scheduled Task Error (Churn):', error);
            }
        }, 6 * 60 * 60 * 1000);

        this.intervals.push(churnTask);

        // Tarefa 2: Verificar Desvio de Vendas (diariamente às 8h - simplificado aqui para a cada 12h)
        const deviationTask = setInterval(async () => {
            try {
                logger.info('Running scheduled deviation analysis...');
                const { forecastService } = await import('../analytics/ForecastService.js');
                const { alertRepository } = await import('../../../repositories/alert.repository.js');

                // Buscar vendedores ativos
                const [sellers] = await db().execute(`
                    SELECT id FROM rolemak_users 
                    WHERE depto = 'VENDAS' AND level BETWEEN 1 AND 3
                    LIMIT 50
                `);

                for (const seller of sellers) {
                    const analysis = await forecastService.analyzeDeviation({ sellerId: seller.id, days: 7 });

                    if (analysis.requires_attention) {
                        const direction = analysis.overall_deviation_percent > 0 ? 'acima' : 'abaixo';
                        await alertRepository.create({
                            userId: seller.id,
                            type: analysis.overall_deviation_percent < -20 ? 'danger' : 'warning',
                            category: 'GENERAL',
                            title: `Vendas ${Math.abs(analysis.overall_deviation_percent).toFixed(0)}% ${direction} do previsto`,
                            description: `Nos últimos 7 dias, suas vendas (R$ ${analysis.total_actual.toLocaleString('pt-BR')}) ficaram ${direction} da previsão (R$ ${analysis.total_expected.toLocaleString('pt-BR')}).`,
                            referenceId: `DEV_${seller.id}_${new Date().toISOString().split('T')[0]}`
                        });
                        logger.info(`Deviation alert created for seller ${seller.id}: ${analysis.overall_deviation_percent}%`);
                    }
                }
            } catch (error) {
                logger.error('Scheduled Task Error (Deviation):', error);
            }
        }, 12 * 60 * 60 * 1000);

        this.intervals.push(deviationTask);
    }

    stop() {
        this.intervals.forEach(clearInterval);
        logger.info('Automation Scheduler stopped');
    }
}

export const automationScheduler = new AutomationScheduler();
