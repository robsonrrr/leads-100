import webpush from 'web-push';
import { getDatabase } from '../config/database.js';
import logger from '../config/logger.js';

const db = () => getDatabase();

// VAPID keys for Web Push
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BOlOSU0e9JdIIzhRhQOPRA336DW2NsVOOPYIxpkgTNMbHySy2CjNyzirf5mkadFbPmuGqEgW7phZegvZ0w2_4pM';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'alQfgzks3ZZkEpaFwrudPRZvBK4H1LaWs0CxkwKBTwo';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:suporte@rolemak.com.br';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

class PushNotificationService {
    /**
     * Retorna a chave pública para o frontend
     */
    getPublicKey() {
        return VAPID_PUBLIC_KEY;
    }

    /**
     * Salva uma nova subscription de push
     */
    async subscribe(userId, subscription) {
        try {
            // Remover subscriptions antigas do mesmo usuário
            await db().execute('DELETE FROM staging.push_subscriptions WHERE user_id = ?', [userId]);

            // Inserir nova subscription
            await db().execute(`
                INSERT INTO staging.push_subscriptions (user_id, endpoint, p256dh, auth)
                VALUES (?, ?, ?, ?)
            `, [
                userId,
                subscription.endpoint,
                subscription.keys.p256dh,
                subscription.keys.auth
            ]);

            logger.info('Push subscription saved', { userId });
            return { success: true };
        } catch (error) {
            logger.error('Error saving push subscription:', error);
            throw error;
        }
    }

    /**
     * Remove subscription de push
     */
    async unsubscribe(userId) {
        await db().execute('DELETE FROM staging.push_subscriptions WHERE user_id = ?', [userId]);
        logger.info('Push subscription removed', { userId });
    }

    /**
     * Envia notificação para um usuário
     */
    async sendToUser(userId, notification) {
        try {
            const [subscriptions] = await db().execute(
                'SELECT * FROM staging.push_subscriptions WHERE user_id = ?',
                [userId]
            );

            if (subscriptions.length === 0) {
                logger.warn('No push subscription found for user', { userId });
                return { sent: false, reason: 'no_subscription' };
            }

            // Verificar preferências do usuário
            const prefs = await this.getPreferences(userId);
            if (!this.shouldSend(notification.category, prefs)) {
                return { sent: false, reason: 'disabled_by_user' };
            }

            const sub = subscriptions[0];
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };

            const payload = JSON.stringify({
                title: notification.title,
                body: notification.body,
                icon: notification.icon || '/icons/notification.png',
                badge: '/icons/badge.png',
                data: {
                    url: notification.url || '/',
                    category: notification.category
                }
            });

            await webpush.sendNotification(pushSubscription, payload);
            logger.info('Push notification sent', { userId, title: notification.title });
            return { sent: true };

        } catch (error) {
            if (error.statusCode === 410) {
                // Subscription expirou, remover
                await this.unsubscribe(userId);
                logger.warn('Push subscription expired and removed', { userId });
            } else {
                logger.error('Error sending push notification:', error);
            }
            return { sent: false, reason: error.message };
        }
    }

    /**
     * Envia notificação usando um template
     */
    async sendFromTemplate(userId, templateName, variables = {}) {
        try {
            const [templates] = await db().execute(
                'SELECT * FROM staging.notification_templates WHERE name = ?',
                [templateName]
            );

            if (templates.length === 0) {
                logger.warn('Notification template not found', { templateName });
                return { sent: false, reason: 'template_not_found' };
            }

            const template = templates[0];

            // Substituir variáveis no template
            let title = template.title_template;
            let body = template.body_template;
            let url = template.action_url || '/';

            for (const [key, value] of Object.entries(variables)) {
                const placeholder = `{${key}}`;
                title = title.replace(new RegExp(placeholder, 'g'), value);
                body = body.replace(new RegExp(placeholder, 'g'), value);
                url = url.replace(new RegExp(placeholder, 'g'), value);
            }

            return await this.sendToUser(userId, {
                title,
                body,
                icon: template.icon,
                url,
                category: template.category
            });

        } catch (error) {
            logger.error('Error sending notification from template:', error);
            throw error;
        }
    }

    /**
     * Obtém preferências de notificação do usuário
     */
    async getPreferences(userId) {
        const [rows] = await db().execute(
            'SELECT * FROM staging.notification_preferences WHERE user_id = ?',
            [userId]
        );

        if (rows.length === 0) {
            // Retornar padrões (tudo habilitado)
            return {
                follow_up_alerts: true,
                churn_alerts: true,
                goal_alerts: true,
                order_alerts: true,
                exception_alerts: true
            };
        }

        return rows[0];
    }

    /**
     * Atualiza preferências de notificação
     */
    async updatePreferences(userId, preferences) {
        const { follow_up_alerts, churn_alerts, goal_alerts, order_alerts, exception_alerts } = preferences;

        await db().execute(`
            INSERT INTO staging.notification_preferences 
                (user_id, follow_up_alerts, churn_alerts, goal_alerts, order_alerts, exception_alerts)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                follow_up_alerts = VALUES(follow_up_alerts),
                churn_alerts = VALUES(churn_alerts),
                goal_alerts = VALUES(goal_alerts),
                order_alerts = VALUES(order_alerts),
                exception_alerts = VALUES(exception_alerts)
        `, [
            userId,
            follow_up_alerts ? 1 : 0,
            churn_alerts ? 1 : 0,
            goal_alerts ? 1 : 0,
            order_alerts ? 1 : 0,
            exception_alerts ? 1 : 0
        ]);

        return await this.getPreferences(userId);
    }

    /**
     * Verifica se deve enviar notificação baseado nas preferências
     */
    shouldSend(category, prefs) {
        const categoryMap = {
            'FOLLOW_UP': prefs.follow_up_alerts,
            'CHURN': prefs.churn_alerts,
            'GOAL': prefs.goal_alerts,
            'ORDER': prefs.order_alerts,
            'EXCEPTION': prefs.exception_alerts,
            'GENERAL': true
        };
        return categoryMap[category] !== false;
    }
}

export const pushService = new PushNotificationService();
