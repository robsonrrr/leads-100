import { getDatabase } from '../../../config/database.js';
import logger from '../../../config/logger.js';
import { penetrationService } from './PenetrationService.js';
import { pipelineService } from './PipelineService.js';
import { inventoryService } from './InventoryService.js';
import { financialService } from './FinancialService.js';

const db = () => getDatabase();

/**
 * ExecutiveBriefService - Geração de Brief Executivo Diário
 * Meta 30.000 Máquinas/Ano
 * 
 * KPI: Briefs enviados todo dia às 8h
 * 
 * Coleta:
 * - Penetração (CMO)
 * - Pipeline (CRO)
 * - Margem/DSO (CFO)
 * - Giro/Rupturas (COO)
 */
class ExecutiveBriefService {

    constructor() {
        // Configurações padrão
        this.config = {
            sendHour: 8, // 8h da manhã
            recipients: ['ceo@rolemak.com', 'cro@rolemak.com'],
            timezone: 'America/Sao_Paulo'
        };
    }

    /**
     * Gera brief executivo completo
     */
    async generateBrief(options = {}) {
        const { period = null, format = 'json' } = options;

        logger.info('ExecutiveBriefService: Generating executive brief');

        try {
            const database = db();
            const today = new Date();
            const formattedDate = today.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            // Coletar todos os KPIs em paralelo
            const [penetration, pipeline, financial, inventory] = await Promise.all([
                this.getPenetrationKPIs().catch(err => ({ error: err.message })),
                this.getPipelineKPIs().catch(err => ({ error: err.message })),
                this.getFinancialKPIs().catch(err => ({ error: err.message })),
                this.getInventoryKPIs().catch(err => ({ error: err.message }))
            ]);

            // Gerar insights baseados nos KPIs
            const insights = this.generateInsights({ penetration, pipeline, financial, inventory });

            // Determinar status geral
            const allStatuses = [
                penetration.status,
                pipeline.status,
                financial.margin?.status,
                financial.dso?.status,
                inventory.giro?.status,
                inventory.ruptures?.status
            ].filter(s => s);

            const criticalCount = allStatuses.filter(s => s === 'CRITICAL').length;
            const warningCount = allStatuses.filter(s => s === 'WARNING').length;
            const overallStatus = criticalCount > 0 ? 'CRITICAL' : warningCount > 0 ? 'WARNING' : 'ON_TARGET';

            const brief = {
                date: formattedDate,
                generated_at: today.toISOString(),
                overall_status: overallStatus,

                kpis: {
                    penetration: penetration,
                    pipeline: pipeline,
                    financial: financial,
                    inventory: inventory
                },

                insights: insights,

                summary: {
                    critical_alerts: criticalCount,
                    warnings: warningCount,
                    on_target: allStatuses.length - criticalCount - warningCount
                }
            };

            if (format === 'html') {
                return this.formatAsHTML(brief);
            } else if (format === 'text') {
                return this.formatAsText(brief);
            }

            return brief;
        } catch (error) {
            logger.error('ExecutiveBriefService: Error generating brief', { error: error.message });
            throw error;
        }
    }

    /**
     * Coleta KPIs de Penetração
     */
    async getPenetrationKPIs() {
        try {
            const data = await penetrationService.calculate();

            return {
                name: 'Penetração',
                icon: '🎯',
                current: data.summary?.overall_penetration || data.metrics?.penetration_rate || 0,
                target: 2.5,
                unit: '',
                gap_percent: data.summary?.gap_percent || 0,
                status: data.status || 'ON_TARGET',
                details: {
                    active_customers: data.summary?.active_customers || 0,
                    total_customers: data.summary?.total_customers || 0,
                    sellers_on_target: data.summary?.sellers_on_target || 0,
                    sellers_warning: data.summary?.sellers_warning || 0,
                    sellers_critical: data.summary?.sellers_critical || 0
                }
            };
        } catch (error) {
            logger.warn('ExecutiveBriefService: Error getting penetration KPIs', { error: error.message });
            return { name: 'Penetração', error: error.message, status: 'ERROR' };
        }
    }

    /**
     * Coleta KPIs de Pipeline
     */
    async getPipelineKPIs() {
        try {
            const data = await pipelineService.calculate();

            return {
                name: 'Pipeline',
                icon: '📈',
                current: data.metrics?.machines_in_pipeline || 0,
                target: data.targets?.pipeline_minimum || 3000,
                unit: ' máquinas',
                gap: data.gaps?.pipeline || 0,
                gap_percent: data.targets?.pipeline_minimum > 0
                    ? Math.round((data.gaps?.pipeline / data.targets?.pipeline_minimum) * 100)
                    : 0,
                status: data.status?.pipeline || 'ON_TARGET',
                details: {
                    machines_sold: data.metrics?.machines_sold || 0,
                    machines_target: data.targets?.machines_monthly || 2500,
                    conversion_rate: data.metrics?.conversion_rate || 0,
                    projected: data.forecast?.projected_machines || 0,
                    on_track: data.forecast?.on_track || false
                }
            };
        } catch (error) {
            logger.warn('ExecutiveBriefService: Error getting pipeline KPIs', { error: error.message });
            return { name: 'Pipeline', error: error.message, status: 'ERROR' };
        }
    }

    /**
     * Coleta KPIs Financeiros
     */
    async getFinancialKPIs() {
        try {
            const data = await financialService.getOverview();

            return {
                margin: {
                    name: 'Margem Bruta',
                    icon: '💰',
                    current: data.kpis?.margin?.current || 0,
                    target: data.kpis?.margin?.target || 25,
                    unit: '%',
                    status: data.kpis?.margin?.status || 'ON_TARGET'
                },
                dso: {
                    name: 'DSO',
                    icon: '📅',
                    current: data.kpis?.dso?.current || 0,
                    target: data.kpis?.dso?.target || 45,
                    unit: ' dias',
                    status: data.kpis?.dso?.status || 'ON_TARGET'
                },
                details: {
                    total_revenue: data.summary?.total_revenue || 0,
                    gross_margin: data.summary?.gross_margin || 0,
                    sellers_at_risk: data.by_seller?.filter(s => s.risk === 'HIGH' || s.risk === 'CRITICAL').length || 0
                }
            };
        } catch (error) {
            logger.warn('ExecutiveBriefService: Error getting financial KPIs', { error: error.message });
            return { margin: { error: error.message }, dso: { error: error.message }, status: 'ERROR' };
        }
    }

    /**
     * Coleta KPIs de Inventário
     */
    async getInventoryKPIs() {
        try {
            const overview = await inventoryService.getOverview();
            const stockouts = await inventoryService.getStockoutAlerts();

            return {
                giro: {
                    name: 'Giro de Estoque',
                    icon: '📦',
                    current: overview.kpis?.giro_anual?.current || 0,
                    target: overview.kpis?.giro_anual?.target || 6,
                    unit: 'x/ano',
                    status: overview.kpis?.giro_anual?.status || 'ON_TARGET'
                },
                low_turn: {
                    name: 'Produtos Baixo Giro',
                    icon: '⏰',
                    current: overview.kpis?.low_turn_percent?.current || 0,
                    target: overview.kpis?.low_turn_percent?.target || 15,
                    unit: '%',
                    status: overview.kpis?.low_turn_percent?.status || 'ON_TARGET'
                },
                ruptures: {
                    name: 'Rupturas S4-S5',
                    icon: '🔴',
                    current: stockouts.critical_count || 0,
                    target: 0,
                    unit: '',
                    status: stockouts.status || 'ON_TARGET'
                },
                details: {
                    total_skus: overview.totals?.skus || 0,
                    total_value: overview.totals?.value_fob || 0,
                    s4_count: stockouts.by_severity?.S4 || 0,
                    s5_count: stockouts.by_severity?.S5 || 0
                }
            };
        } catch (error) {
            logger.warn('ExecutiveBriefService: Error getting inventory KPIs', { error: error.message });
            return { giro: { error: error.message }, ruptures: { error: error.message }, status: 'ERROR' };
        }
    }

    /**
     * Gera insights baseados nos KPIs
     */
    generateInsights(kpis) {
        const insights = [];

        // Insights de Penetração
        if (kpis.penetration?.details?.sellers_critical > 0) {
            insights.push({
                type: 'PENETRATION',
                severity: 'CRITICAL',
                message: `${kpis.penetration.details.sellers_critical} vendedores abaixo da meta de penetração`
            });
        }

        // Insights de Pipeline
        if (kpis.pipeline?.status === 'CRITICAL') {
            insights.push({
                type: 'PIPELINE',
                severity: 'CRITICAL',
                message: `Pipeline insuficiente: ${kpis.pipeline.gap} máquinas abaixo do mínimo`
            });
        }

        if (kpis.pipeline?.details?.on_track === false) {
            insights.push({
                type: 'FORECAST',
                severity: 'WARNING',
                message: `Projeção de ${kpis.pipeline.details.projected} máquinas (abaixo da meta)`
            });
        }

        // Insights de Margem
        if (kpis.financial?.margin?.status === 'CRITICAL') {
            insights.push({
                type: 'MARGIN',
                severity: 'CRITICAL',
                message: `Margem crítica: ${kpis.financial.margin.current}% (meta: ${kpis.financial.margin.target}%)`
            });
        }

        // Insights de DSO
        if (kpis.financial?.dso?.status !== 'ON_TARGET') {
            insights.push({
                type: 'DSO',
                severity: kpis.financial.dso.status === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
                message: `DSO elevado: ${kpis.financial.dso.current} dias (meta: ≤${kpis.financial.dso.target} dias)`
            });
        }

        // Insights de Rupturas
        if (kpis.inventory?.ruptures?.current > 0) {
            insights.push({
                type: 'RUPTURE',
                severity: 'CRITICAL',
                message: `${kpis.inventory.ruptures.current} rupturas críticas (S4-S5) detectadas`
            });
        }

        // Insights de Giro
        if (kpis.inventory?.giro?.status === 'CRITICAL') {
            insights.push({
                type: 'INVENTORY',
                severity: 'CRITICAL',
                message: `Giro de estoque baixo: ${kpis.inventory.giro.current}x (meta: ${kpis.inventory.giro.target}x)`
            });
        }

        // Se tudo está OK
        if (insights.length === 0) {
            insights.push({
                type: 'SUCCESS',
                severity: 'INFO',
                message: 'Todas as métricas dentro das metas. Excelente performance!'
            });
        }

        return insights;
    }

    /**
     * Formata brief como HTML para email
     */
    formatAsHTML(brief) {
        const statusColors = {
            'ON_TARGET': '#4caf50',
            'WARNING': '#ff9800',
            'CRITICAL': '#f44336',
            'ERROR': '#9e9e9e'
        };

        const statusEmoji = {
            'ON_TARGET': '✅',
            'WARNING': '⚠️',
            'CRITICAL': '🔴',
            'ERROR': '❓'
        };

        const formatKPI = (kpi) => {
            if (!kpi || kpi.error) return '<span style="color:#9e9e9e">N/A</span>';
            const emoji = statusEmoji[kpi.status] || '⚪';
            const color = statusColors[kpi.status] || '#333';
            return `${kpi.icon || ''} <strong>${kpi.name}:</strong> <span style="color:${color}">${kpi.current}${kpi.unit || ''} ${emoji}</span> (meta: ${kpi.target}${kpi.unit || ''})`;
        };

        const insightsHTML = brief.insights.map(i => {
            const color = i.severity === 'CRITICAL' ? '#f44336' : i.severity === 'WARNING' ? '#ff9800' : '#4caf50';
            const icon = i.severity === 'CRITICAL' ? '🔴' : i.severity === 'WARNING' ? '⚠️' : '💡';
            return `<li style="color:${color}">${icon} ${i.message}</li>`;
        }).join('');

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1a237e 0%, #283593 100%); color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0 0; opacity: 0.8; }
        .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; margin-top: 10px; }
        .content { padding: 20px; }
        .section { margin-bottom: 20px; }
        .section h2 { font-size: 16px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .kpi-list { list-style: none; padding: 0; }
        .kpi-list li { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
        .insights { background: #fafafa; padding: 15px; border-radius: 8px; }
        .insights h3 { margin-top: 0; font-size: 14px; color: #666; }
        .insights ul { margin: 0; padding-left: 20px; }
        .insights li { margin: 5px 0; }
        .footer { background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #999; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 BRIEF EXECUTIVO</h1>
            <p>${brief.date}</p>
            <div class="status-badge" style="background: ${statusColors[brief.overall_status]}; color: white;">
                ${statusEmoji[brief.overall_status]} ${brief.overall_status === 'ON_TARGET' ? 'TODAS AS METAS' : brief.overall_status}
            </div>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>📊 KPIs Principais</h2>
                <ul class="kpi-list">
                    <li>${formatKPI(brief.kpis.penetration)}</li>
                    <li>${formatKPI(brief.kpis.pipeline)}</li>
                    <li>${formatKPI(brief.kpis.financial?.margin)}</li>
                    <li>${formatKPI(brief.kpis.financial?.dso)}</li>
                    <li>${formatKPI(brief.kpis.inventory?.giro)}</li>
                    <li>${formatKPI(brief.kpis.inventory?.ruptures)}</li>
                </ul>
            </div>
            
            <div class="insights">
                <h3>💡 INSIGHTS</h3>
                <ul>${insightsHTML}</ul>
            </div>
            
            <div class="section" style="text-align: center; margin-top: 20px;">
                <p style="color: #666;">
                    🎯 Alertas: ${brief.summary.critical_alerts} críticos, ${brief.summary.warnings} avisos
                </p>
            </div>
        </div>
        
        <div class="footer">
            Gerado automaticamente pelo Sistema Leads Agent<br>
            ${brief.generated_at}
        </div>
    </div>
</body>
</html>`;

        return { html, brief };
    }

    /**
     * Formata brief como texto simples
     */
    formatAsText(brief) {
        const statusEmoji = {
            'ON_TARGET': '✅',
            'WARNING': '⚠️',
            'CRITICAL': '🔴'
        };

        const formatKPI = (kpi) => {
            if (!kpi || kpi.error) return 'N/A';
            return `${kpi.icon} ${kpi.name}: ${kpi.current}${kpi.unit || ''} ${statusEmoji[kpi.status] || '⚪'} (meta: ${kpi.target}${kpi.unit || ''})`;
        };

        const lines = [
            `📊 BRIEF EXECUTIVO - ${brief.date}`,
            ``,
            formatKPI(brief.kpis.penetration),
            formatKPI(brief.kpis.pipeline),
            formatKPI(brief.kpis.financial?.margin),
            formatKPI(brief.kpis.financial?.dso),
            formatKPI(brief.kpis.inventory?.giro),
            formatKPI(brief.kpis.inventory?.ruptures),
            ``,
            `💡 INSIGHTS:`,
            ...brief.insights.map(i => `- ${i.message}`),
            ``,
            `---`,
            `Gerado: ${brief.generated_at}`
        ];

        return { text: lines.join('\n'), brief };
    }

    /**
     * Envia brief por email
     */
    async sendBriefByEmail(recipients = null) {
        try {
            const briefData = await this.generateBrief({ format: 'html' });
            const { html, brief } = briefData;

            const to = recipients || this.config.recipients;

            // Usar serviço de email existente
            const { emailService } = await import('../../../services/email.service.js');

            await emailService.send({
                to: to,
                subject: `📊 Brief Executivo - ${brief.date} | ${brief.overall_status}`,
                html: html
            });

            // Registrar no log
            await this.logBriefSent(brief, to);

            logger.info('ExecutiveBriefService: Brief sent successfully', { recipients: to, status: brief.overall_status });

            return { success: true, brief, recipients: to };
        } catch (error) {
            logger.error('ExecutiveBriefService: Error sending brief', { error: error.message });
            throw error;
        }
    }

    /**
     * Envia push notification com resumo do brief
     */
    async sendBriefPushNotification(userIds = null) {
        try {
            const brief = await this.generateBrief();

            const { pushService } = await import('../../../services/push.service.js');

            // Se não especificou userIds, buscar gerentes
            if (!userIds) {
                const database = db();
                const [managers] = await database.execute(`
                    SELECT id FROM rolemak_users 
                    WHERE level >= 5 AND blocked = 0
                    LIMIT 10
                `);
                userIds = managers.map(m => m.id);
            }

            const title = `📊 Brief Executivo - ${brief.date}`;
            const body = brief.insights.length > 0
                ? brief.insights[0].message
                : 'Todas as métricas dentro das metas!';

            for (const userId of userIds) {
                try {
                    await pushService.sendToUser(userId, {
                        title,
                        body,
                        data: {
                            type: 'EXECUTIVE_BRIEF',
                            overall_status: brief.overall_status,
                            critical_alerts: brief.summary.critical_alerts
                        }
                    });
                } catch (err) {
                    logger.warn(`Failed to send push to user ${userId}:`, err.message);
                }
            }

            logger.info('ExecutiveBriefService: Push notifications sent', { count: userIds.length });

            return { success: true, brief, recipients_count: userIds.length };
        } catch (error) {
            logger.error('ExecutiveBriefService: Error sending push', { error: error.message });
            throw error;
        }
    }

    /**
     * Registra brief enviado no log
     */
    async logBriefSent(brief, recipients) {
        try {
            const database = db();
            await database.execute(`
                INSERT INTO staging.audit_log (action, entity_type, entity_id, details, created_at)
                VALUES (?, ?, ?, ?, NOW())
            `, [
                'EXECUTIVE_BRIEF_SENT',
                'BRIEF',
                `BRIEF_${brief.date.replace(/\//g, '-')}`,
                JSON.stringify({
                    date: brief.date,
                    overall_status: brief.overall_status,
                    recipients: recipients,
                    summary: brief.summary,
                    insights_count: brief.insights.length
                })
            ]);
        } catch (error) {
            logger.warn('ExecutiveBriefService: Error logging brief', { error: error.message });
        }
    }

    /**
     * Retorna configuração de envio
     */
    getConfig() {
        return this.config;
    }

    /**
     * Atualiza configuração de envio
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        logger.info('ExecutiveBriefService: Config updated', this.config);
        return this.config;
    }

    /**
     * Retorna histórico de briefs enviados
     */
    async getBriefHistory(limit = 30) {
        try {
            const database = db();
            const [results] = await database.execute(`
                SELECT 
                    entity_id,
                    details,
                    created_at
                FROM staging.audit_log
                WHERE action = 'EXECUTIVE_BRIEF_SENT'
                ORDER BY created_at DESC
                LIMIT ?
            `, [limit]);

            return results.map(r => ({
                id: r.entity_id,
                ...JSON.parse(r.details || '{}'),
                sent_at: r.created_at
            }));
        } catch (error) {
            logger.warn('ExecutiveBriefService: Error getting history', { error: error.message });
            return [];
        }
    }
}

export const executiveBriefService = new ExecutiveBriefService();
