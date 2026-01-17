import { getDatabase } from '../../../config/database.js';
import logger from '../../../config/logger.js';
import { alertRepository } from '../../../repositories/alert.repository.js';
import { pushService } from '../../../services/push.service.js';

const db = () => getDatabase();

export class AutomationEngine {
    /**
     * Processa um evento e verifica se há regras de automação ativas para ele
     */
    async trigger(event, context = {}) {
        const { type, userId, customerId, referenceId } = event;

        try {
            logger.info('Automation trigger received', { type, customerId });

            // 1. Buscar regras ativas para este tipo de evento
            const [rules] = await db().execute(
                'SELECT * FROM staging.automation_rules WHERE trigger_event = ? AND is_active = 1',
                [type]
            );

            for (const rule of rules) {
                logger.info(`Processing automation rule: ${rule.name}`);

                switch (rule.action_type) {
                    case 'CREATE_FOLLOWUP':
                        await this.createFollowUp(rule, event, context);
                        break;
                    case 'SEND_ALERT':
                        await this.sendAlert(rule, event, context);
                        break;
                    default:
                        logger.warn(`Unknown action type: ${rule.action_type}`);
                }
            }
        } catch (error) {
            logger.error('Automation Engine Error:', error);
        }
    }

    /**
     * Cria um follow-up agendado
     */
    async createFollowUp(rule, event, context) {
        const { userId, customerId } = event;
        const delay = rule.delay_days || 0;
        const date = new Date();
        date.setDate(date.getDate() + delay);

        try {
            // No futuro, usar InteractionRepository.create
            await db().execute(`
                INSERT INTO staging.customer_interactions 
                    (customer_id, user_id, type, description, next_action_date, next_action_description)
                VALUES (?, ?, 'note', ?, ?, ?)
            `, [
                customerId,
                userId,
                `Automação: ${rule.name}`,
                date.toISOString().split('T')[0],
                `Follow-up automático via ${rule.name}`
            ]);

            logger.info('Auto follow-up created', { customerId, delay });

            // Enviar push notification também
            await this.sendPushNotification(userId, 'follow_up_due', {
                customer_name: context.customerName || `Cliente #${customerId}`,
                customer_id: customerId
            });

        } catch (err) {
            logger.error('Error in createFollowUp automation:', err);
        }
    }

    /**
     * Cria um alerta interno e envia push notification
     */
    async sendAlert(rule, event, context) {
        try {
            // 1. Criar alerta persistente
            await alertRepository.create({
                userId: event.userId,
                type: 'info',
                category: 'GENERAL',
                title: rule.name,
                description: `Ação automática: ${rule.name} para o cliente #${event.customerId}`,
                referenceId: event.referenceId
            });

            // 2. Enviar push notification
            const templateMap = {
                'CHURN_RISK_HIGH': 'churn_critical',
                'LEAD_INACTIVE': 'follow_up_due',
                'ORDER_CONVERTED': 'new_order'
            };

            const template = templateMap[event.type] || null;
            if (template) {
                await this.sendPushNotification(event.userId, template, {
                    customer_name: context.customerName || `Cliente #${event.customerId}`,
                    customer_id: event.customerId
                });
            }

        } catch (err) {
            logger.error('Error in sendAlert automation:', err);
        }
    }

    /**
     * Envia Push Notification usando templates
     */
    async sendPushNotification(userId, templateName, variables = {}) {
        try {
            await pushService.sendFromTemplate(userId, templateName, variables);
            logger.info('Push notification sent via automation', { userId, templateName });
        } catch (err) {
            // Push é best-effort, não deve bloquear automação
            logger.warn('Failed to send push notification:', err.message);
        }
    }
}

export const automationEngine = new AutomationEngine();
