/**
 * Notifications Service
 * 
 * Serviço para gerenciar notificações em tempo real
 * Inclui notificações de WhatsApp via Superbot
 * 
 * @version 1.0
 * @date 2026-01-18
 */

import { getDatabase } from '../config/database.js';
import { cacheGet, cacheSet, cacheDelete } from '../config/redis.js';
import logger from '../config/logger.js';

const db = () => getDatabase();

// Tipos de notificação
export const NOTIFICATION_TYPES = {
    WHATSAPP_MESSAGE: 'whatsapp_message',
    WHATSAPP_PURCHASE_INTENT: 'whatsapp_purchase_intent',
    WHATSAPP_COMPLAINT: 'whatsapp_complaint',
    WHATSAPP_URGENT: 'whatsapp_urgent',
    LEAD_CREATED: 'lead_created',
    LEAD_CONVERTED: 'lead_converted',
    SYSTEM: 'system'
};

// Prioridades
export const PRIORITY = {
    LOW: 1,
    NORMAL: 2,
    HIGH: 3,
    URGENT: 4
};

export const NotificationsService = {
    /**
     * Cria uma nova notificação para um usuário
     */
    async create(notification) {
        const {
            userId,
            type = NOTIFICATION_TYPES.SYSTEM,
            title,
            message,
            priority = PRIORITY.NORMAL,
            data = {},
            expiresAt = null
        } = notification;

        try {
            const [result] = await db().query(`
        INSERT INTO user_notifications 
          (user_id, type, title, message, priority, data, expires_at, created_at, read_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NULL)
      `, [
                userId,
                type,
                title,
                message,
                priority,
                JSON.stringify(data),
                expiresAt
            ]);

            // Invalidar cache de notificações do usuário
            await cacheDelete(`notifications:unread:${userId}`);
            await cacheDelete(`notifications:list:${userId}`);

            logger.info('Notificação criada', {
                id: result.insertId,
                userId,
                type
            });

            // Também armazenar no Redis para polling rápido
            await this.addToRealtimeQueue(userId, {
                id: result.insertId,
                type,
                title,
                message,
                priority,
                data,
                created_at: new Date().toISOString()
            });

            return result.insertId;
        } catch (error) {
            logger.error('Erro ao criar notificação', { error: error.message });
            throw error;
        }
    },

    /**
     * Adiciona notificação à fila de tempo real (Redis)
     * Expira automaticamente após 24h
     */
    async addToRealtimeQueue(userId, notification) {
        const key = `notifications:realtime:${userId}`;

        try {
            // Buscar fila atual
            let queue = await cacheGet(key) || [];

            // Adicionar no início
            queue.unshift(notification);

            // Manter apenas últimas 50
            if (queue.length > 50) {
                queue = queue.slice(0, 50);
            }

            // Salvar com TTL de 24h
            await cacheSet(key, queue, 86400);
        } catch (e) {
            logger.warn('Erro ao adicionar à fila de tempo real', { error: e.message });
        }
    },

    /**
     * Busca notificações pendentes do usuário (para polling)
     */
    async getPending(userId, lastCheck = null) {
        const key = `notifications:realtime:${userId}`;

        try {
            const queue = await cacheGet(key) || [];

            if (lastCheck) {
                const lastCheckDate = new Date(lastCheck);
                return queue.filter(n => new Date(n.created_at) > lastCheckDate);
            }

            return queue;
        } catch (e) {
            logger.warn('Erro ao buscar notificações pendentes', { error: e.message });
            return [];
        }
    },

    /**
     * Busca notificações do usuário (paginado)
     */
    async getByUser(userId, options = {}) {
        const { page = 1, limit = 20, unreadOnly = false } = options;
        const offset = (page - 1) * limit;

        // Cache key
        const cacheKey = unreadOnly
            ? `notifications:unread:${userId}:${page}:${limit}`
            : `notifications:list:${userId}:${page}:${limit}`;

        const cached = await cacheGet(cacheKey);
        if (cached) return cached;

        let whereClause = 'WHERE user_id = ?';
        const params = [userId];

        if (unreadOnly) {
            whereClause += ' AND read_at IS NULL';
        }

        // Excluir expiradas
        whereClause += ' AND (expires_at IS NULL OR expires_at > NOW())';

        const [rows] = await db().query(`
      SELECT 
        id,
        type,
        title,
        message,
        priority,
        data,
        created_at,
        read_at
      FROM user_notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

        // Parsear data JSON
        const notifications = rows.map(n => ({
            ...n,
            data: n.data ? (typeof n.data === 'string' ? JSON.parse(n.data) : n.data) : {}
        }));

        // Contagem de não lidas
        const [countResult] = await db().query(`
      SELECT COUNT(*) as count
      FROM user_notifications
      WHERE user_id = ? 
        AND read_at IS NULL 
        AND (expires_at IS NULL OR expires_at > NOW())
    `, [userId]);

        const result = {
            notifications,
            unreadCount: countResult[0]?.count || 0
        };

        await cacheSet(cacheKey, result, 60); // Cache 1 minuto
        return result;
    },

    /**
     * Marca notificação como lida
     */
    async markAsRead(notificationId, userId) {
        const [result] = await db().query(`
      UPDATE user_notifications
      SET read_at = NOW()
      WHERE id = ? AND user_id = ? AND read_at IS NULL
    `, [notificationId, userId]);

        if (result.affectedRows > 0) {
            await cacheDelete(`notifications:unread:${userId}`);
            await cacheDelete(`notifications:list:${userId}`);
        }

        return result.affectedRows > 0;
    },

    /**
     * Marca todas as notificações como lidas
     */
    async markAllAsRead(userId) {
        const [result] = await db().query(`
      UPDATE user_notifications
      SET read_at = NOW()
      WHERE user_id = ? AND read_at IS NULL
    `, [userId]);

        await cacheDelete(`notifications:unread:${userId}`);
        await cacheDelete(`notifications:list:${userId}`);

        return result.affectedRows;
    },

    /**
     * Remove notificação
     */
    async delete(notificationId, userId) {
        const [result] = await db().query(`
      DELETE FROM user_notifications
      WHERE id = ? AND user_id = ?
    `, [notificationId, userId]);

        await cacheDelete(`notifications:list:${userId}`);

        return result.affectedRows > 0;
    },

    /**
     * Limpa notificações antigas (mais de 30 dias)
     */
    async cleanup() {
        try {
            const [result] = await db().query(`
        DELETE FROM user_notifications
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);

            logger.info('Limpeza de notificações antigas', {
                deleted: result.affectedRows
            });

            return result.affectedRows;
        } catch (error) {
            logger.error('Erro na limpeza de notificações', { error: error.message });
            return 0;
        }
    },

    /**
     * Conta notificações não lidas
     */
    async getUnreadCount(userId) {
        const cacheKey = `notifications:unread:count:${userId}`;
        const cached = await cacheGet(cacheKey);
        if (cached !== null) return cached;

        const [result] = await db().query(`
      SELECT COUNT(*) as count
      FROM user_notifications
      WHERE user_id = ? 
        AND read_at IS NULL 
        AND (expires_at IS NULL OR expires_at > NOW())
    `, [userId]);

        const count = result[0]?.count || 0;
        await cacheSet(cacheKey, count, 30); // Cache 30 segundos

        return count;
    },

    // ===================================
    // HELPERS PARA WHATSAPP
    // ===================================

    /**
     * Cria notificação de mensagem WhatsApp importante
     */
    async notifyWhatsAppMessage(sellerId, data) {
        const {
            phone,
            customerName,
            message,
            intent,
            sentiment,
            confidence
        } = data;

        // Determinar prioridade baseado na intenção/sentimento
        let priority = PRIORITY.NORMAL;
        let type = NOTIFICATION_TYPES.WHATSAPP_MESSAGE;
        let title = `Nova mensagem WhatsApp`;

        if (sentiment === 'negative' || intent === 'COMPLAINT') {
            priority = PRIORITY.URGENT;
            type = NOTIFICATION_TYPES.WHATSAPP_COMPLAINT;
            title = '⚠️ Cliente insatisfeito no WhatsApp';
        } else if (intent === 'PURCHASE_INTENT' || intent === 'QUOTE_REQUEST') {
            priority = PRIORITY.HIGH;
            type = NOTIFICATION_TYPES.WHATSAPP_PURCHASE_INTENT;
            title = '💰 Intenção de compra detectada';
        }

        return this.create({
            userId: sellerId,
            type,
            title,
            message: `${customerName || phone}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
            priority,
            data: {
                phone,
                customerName,
                intent,
                sentiment,
                confidence,
                fullMessage: message.substring(0, 500)
            }
        });
    },

    /**
     * Cria notificação de lead criado via WhatsApp
     */
    async notifyLeadCreated(sellerId, data) {
        const { leadId, phone, customerName, products } = data;

        return this.create({
            userId: sellerId,
            type: NOTIFICATION_TYPES.LEAD_CREATED,
            title: '🛒 Novo lead via WhatsApp',
            message: `Lead #${leadId} criado automaticamente para ${customerName || phone}`,
            priority: PRIORITY.HIGH,
            data: {
                leadId,
                phone,
                customerName,
                products
            }
        });
    }
};

export default NotificationsService;
