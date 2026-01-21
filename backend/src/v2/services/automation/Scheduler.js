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

        // Tarefa 3: Verificar Pipeline (diariamente - a cada 24h)
        // Meta 30.000: Pipeline >= 3.000 máquinas/mês, alerta quando < 80%
        const pipelineTask = setInterval(async () => {
            try {
                logger.info('Running scheduled pipeline verification...');
                const { pipelineService } = await import('../analytics/PipelineService.js');
                const { alertRepository } = await import('../../../repositories/alert.repository.js');
                const { pushService } = await import('../../../services/push.service.js');

                // Verificar alertas de pipeline
                const alertsData = await pipelineService.checkAlerts();

                if (alertsData.has_alerts) {
                    logger.warn(`Pipeline alerts detected: ${alertsData.alerts_count} alerts`);

                    // Buscar gerentes (CRO/CMO) - usuarios nivel >= 4
                    const [managers] = await db().execute(`
                        SELECT id, username, segmento FROM rolemak_users 
                        WHERE level >= 4 AND blocked = 0
                        LIMIT 10
                    `);

                    for (const alert of alertsData.alerts) {
                        const today = new Date().toISOString().split('T')[0];
                        const referenceId = `PIPELINE_${alert.type}_${today}`;

                        // Verificar se já existe alerta hoje para evitar duplicação
                        const [existing] = await db().execute(`
                            SELECT id FROM staging.alerts 
                            WHERE reference_id = ? 
                            AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
                        `, [referenceId]);

                        if (existing.length > 0) {
                            logger.info(`Pipeline alert ${referenceId} already exists, skipping`);
                            continue;
                        }

                        // Criar alerta para cada gerente
                        for (const manager of managers) {
                            await alertRepository.create({
                                userId: manager.id,
                                type: alert.severity === 'HIGH' ? 'danger' : 'warning',
                                category: 'PIPELINE',
                                title: `⚠️ Alerta de Pipeline: ${alert.type}`,
                                description: alert.message,
                                referenceId: referenceId
                            });

                            // Enviar push notification para alertas críticos
                            if (alert.severity === 'HIGH') {
                                try {
                                    await pushService.sendToUser(manager.id, {
                                        title: '🔴 Alerta Crítico de Pipeline',
                                        body: alert.message,
                                        data: {
                                            type: 'PIPELINE_ALERT',
                                            alertType: alert.type,
                                            gap: alert.gap
                                        }
                                    });
                                    logger.info(`Push notification sent to manager ${manager.id} for pipeline alert`);
                                } catch (pushErr) {
                                    logger.warn(`Failed to send push to manager ${manager.id}:`, pushErr.message);
                                }
                            }
                        }

                        // Registrar no log de auditoria
                        await db().execute(`
                            INSERT INTO staging.audit_log (action, entity_type, entity_id, details, created_at)
                            VALUES (?, ?, ?, ?, NOW())
                        `, [
                            'PIPELINE_ALERT',
                            'PIPELINE',
                            referenceId,
                            JSON.stringify({
                                type: alert.type,
                                severity: alert.severity,
                                message: alert.message,
                                gap: alert.gap,
                                managers_notified: managers.length
                            })
                        ]);

                        logger.info(`Pipeline alert logged: ${alert.type} - ${alert.message}`);
                    }
                } else {
                    logger.info('Pipeline verification completed: No alerts');
                }
            } catch (error) {
                logger.error('Scheduled Task Error (Pipeline):', error);
            }
        }, 24 * 60 * 60 * 1000); // A cada 24 horas

        this.intervals.push(pipelineTask);

        // Tarefa 4: Verificar Rupturas de Estoque (diariamente - a cada 24h)
        // Meta 30.000: Rupturas S4-S5 = 0
        const inventoryTask = setInterval(async () => {
            try {
                logger.info('Running scheduled inventory stockout check...');
                const { inventoryService } = await import('../analytics/InventoryService.js');
                const { alertRepository } = await import('../../../repositories/alert.repository.js');
                const { pushService } = await import('../../../services/push.service.js');

                // Verificar alertas de ruptura críticos
                const alertsData = await inventoryService.checkCriticalAlerts();

                if (alertsData.has_critical) {
                    logger.warn(`Stockout alerts detected: ${alertsData.critical_count} critical alerts (S4: ${alertsData.s4_count}, S5: ${alertsData.s5_count})`);

                    // Buscar COO e gerentes de operações - usuarios nivel >= 4 do segmento machines
                    const [managers] = await db().execute(`
                        SELECT id, username, segmento FROM rolemak_users 
                        WHERE level >= 4 AND blocked = 0 AND (segmento = 'machines' OR level >= 5)
                        LIMIT 10
                    `);

                    for (const alert of alertsData.alerts) {
                        const today = new Date().toISOString().split('T')[0];
                        const referenceId = `STOCKOUT_${alert.severity}_${alert.product_id}_${today}`;

                        // Verificar se já existe alerta hoje para evitar duplicação
                        const [existing] = await db().execute(`
                            SELECT id FROM staging.alerts 
                            WHERE reference_id = ? 
                            AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
                        `, [referenceId]);

                        if (existing.length > 0) {
                            logger.info(`Stockout alert ${referenceId} already exists, skipping`);
                            continue;
                        }

                        // Criar alerta para cada gerente
                        for (const manager of managers) {
                            await alertRepository.create({
                                userId: manager.id,
                                type: alert.severity === 'S5' ? 'danger' : 'warning',
                                category: 'INVENTORY',
                                title: `🔴 Ruptura ${alert.severity}: ${alert.product_sku}`,
                                description: alert.message + (alert.substitutes_count > 0 ? ` | ${alert.substitutes_count} substitutos disponíveis` : ''),
                                referenceId: referenceId
                            });

                            // Enviar push notification para alertas S5 (críticos)
                            if (alert.severity === 'S5') {
                                try {
                                    await pushService.sendToUser(manager.id, {
                                        title: '🔴 Ruptura Crítica de Estoque (S5)',
                                        body: `${alert.product_sku} - ${alert.product_name}`,
                                        data: {
                                            type: 'STOCKOUT_ALERT',
                                            severity: alert.severity,
                                            productId: alert.product_id
                                        }
                                    });
                                    logger.info(`Push notification sent to manager ${manager.id} for stockout alert`);
                                } catch (pushErr) {
                                    logger.warn(`Failed to send push to manager ${manager.id}:`, pushErr.message);
                                }
                            }
                        }

                        // Registrar no log de auditoria
                        await db().execute(`
                            INSERT INTO staging.audit_log (action, entity_type, entity_id, details, created_at)
                            VALUES (?, ?, ?, ?, NOW())
                        `, [
                            'STOCKOUT_ALERT',
                            'INVENTORY',
                            referenceId,
                            JSON.stringify({
                                type: alert.type,
                                severity: alert.severity,
                                product_id: alert.product_id,
                                product_sku: alert.product_sku,
                                stock: alert.stock,
                                pending_orders: alert.pending_orders,
                                substitutes_count: alert.substitutes_count,
                                managers_notified: managers.length
                            })
                        ]);

                        logger.info(`Stockout alert logged: ${alert.severity} - ${alert.product_sku}`);
                    }
                } else {
                    logger.info('Inventory stockout check completed: No critical alerts');
                }
            } catch (error) {
                logger.error('Scheduled Task Error (Inventory):', error);
            }
        }, 24 * 60 * 60 * 1000); // A cada 24 horas

        this.intervals.push(inventoryTask);

        // Executar verificação de pipeline imediatamente na inicialização (após 1 minuto)
        setTimeout(async () => {
            try {
                logger.info('Running initial pipeline check...');
                const { pipelineService } = await import('../analytics/PipelineService.js');
                const alertsData = await pipelineService.checkAlerts();
                logger.info(`Initial pipeline check: ${alertsData.alerts_count} alerts found`);
            } catch (error) {
                logger.error('Initial pipeline check error:', error);
            }
        }, 60 * 1000);

        // Executar verificação de estoque após 2 minutos
        setTimeout(async () => {
            try {
                logger.info('Running initial inventory stockout check...');
                const { inventoryService } = await import('../analytics/InventoryService.js');
                const alertsData = await inventoryService.checkCriticalAlerts();
                logger.info(`Initial stockout check: ${alertsData.critical_count} critical alerts found`);
            } catch (error) {
                logger.error('Initial stockout check error:', error);
            }
        }, 120 * 1000);

        // Tarefa 5: Enviar Brief Executivo Diário (às 8h)
        // Verificamos a cada hora se é 8h para enviar o brief
        const briefTask = setInterval(async () => {
            try {
                const now = new Date();
                const hour = now.getHours();
                const minute = now.getMinutes();

                // Enviar às 8h (com margem de 5 minutos)
                if (hour === 8 && minute < 5) {
                    logger.info('Running scheduled executive brief generation...');
                    const { executiveBriefService } = await import('../analytics/ExecutiveBriefService.js');

                    // Gerar e enviar brief
                    try {
                        // Enviar por email
                        await executiveBriefService.sendBriefByEmail();
                        logger.info('Executive brief sent by email');
                    } catch (emailErr) {
                        logger.warn('Failed to send brief by email:', emailErr.message);
                    }

                    try {
                        // Enviar push notification
                        await executiveBriefService.sendBriefPushNotification();
                        logger.info('Executive brief push notification sent');
                    } catch (pushErr) {
                        logger.warn('Failed to send brief push:', pushErr.message);
                    }
                }
            } catch (error) {
                logger.error('Scheduled Task Error (Executive Brief):', error);
            }
        }, 60 * 60 * 1000); // A cada 1 hora

        this.intervals.push(briefTask);
    }

    stop() {
        this.intervals.forEach(clearInterval);
        logger.info('Automation Scheduler stopped');
    }
}

export const automationScheduler = new AutomationScheduler();
