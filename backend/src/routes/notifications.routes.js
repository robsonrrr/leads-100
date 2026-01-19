import express from 'express';
import { pushService } from '../services/push.service.js';
import { NotificationsService, NOTIFICATION_TYPES, PRIORITY } from '../services/notifications.service.js';
import { authenticateToken } from '../middleware/auth.js';
import { pollingLimiter } from '../middleware/rateLimiter.js';
import { getDatabase } from '../config/database.js';
import logger from '../config/logger.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

/**
 * @swagger
 * /api/notifications/vapid-public-key:
 *   get:
 *     summary: Obtém a chave pública VAPID para push notifications
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Chave pública VAPID
 */
router.get('/vapid-public-key', (req, res) => {
    res.json({
        success: true,
        data: { publicKey: pushService.getPublicKey() }
    });
});

/**
 * @swagger
 * /api/notifications/subscribe:
 *   post:
 *     summary: Registra subscription para push notifications
 *     tags: [Notifications]
 */
router.post('/subscribe', async (req, res) => {
    try {
        const { subscription } = req.body;
        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({ success: false, error: { message: 'Subscription inválida' } });
        }

        await pushService.subscribe(req.user.userId, subscription);
        res.json({ success: true, message: 'Notificações ativadas com sucesso!' });
    } catch (error) {
        logger.error('Error subscribing to push:', error);
        res.status(500).json({ success: false, error: { message: error.message } });
    }
});

/**
 * @swagger
 * /api/notifications/unsubscribe:
 *   post:
 *     summary: Remove subscription de push notifications
 *     tags: [Notifications]
 */
router.post('/unsubscribe', async (req, res) => {
    try {
        await pushService.unsubscribe(req.user.userId);
        res.json({ success: true, message: 'Notificações desativadas' });
    } catch (error) {
        logger.error('Error unsubscribing from push:', error);
        res.status(500).json({ success: false, error: { message: error.message } });
    }
});

/**
 * @swagger
 * /api/notifications/preferences:
 *   get:
 *     summary: Obtém preferências de notificação do usuário
 *     tags: [Notifications]
 */
router.get('/preferences', async (req, res) => {
    try {
        const prefs = await pushService.getPreferences(req.user.userId);
        res.json({ success: true, data: prefs });
    } catch (error) {
        logger.error('Error getting notification preferences:', error);
        res.status(500).json({ success: false, error: { message: error.message } });
    }
});

/**
 * @swagger
 * /api/notifications/preferences:
 *   put:
 *     summary: Atualiza preferências de notificação
 *     tags: [Notifications]
 */
router.put('/preferences', async (req, res) => {
    try {
        const updated = await pushService.updatePreferences(req.user.userId, req.body);
        res.json({ success: true, data: updated });
    } catch (error) {
        logger.error('Error updating notification preferences:', error);
        res.status(500).json({ success: false, error: { message: error.message } });
    }
});

/**
 * @swagger
 * /api/notifications/test:
 *   post:
 *     summary: Envia uma notificação de teste
 *     tags: [Notifications]
 */
router.post('/test', async (req, res) => {
    try {
        const result = await pushService.sendToUser(req.user.userId, {
            title: '🔔 Teste de Notificação',
            body: 'As notificações push estão funcionando corretamente!',
            category: 'GENERAL',
            url: '/'
        });
        res.json({ success: true, data: result });
    } catch (error) {
        logger.error('Error sending test notification:', error);
        res.status(500).json({ success: false, error: { message: error.message } });
    }
});

// ======================================================
// ENDPOINTS PARA LISTA E POLLING (TEMPO REAL)
// ======================================================

/**
 * @swagger
 * /api/notifications/list:
 *   get:
 *     summary: Lista notificações do usuário (paginado)
 *     tags: [Notifications]
 */
router.get('/list', async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { page = 1, limit = 20, unread_only = false } = req.query;

        const result = await NotificationsService.getByUser(userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            unreadOnly: unread_only === 'true'
        });

        res.json({
            success: true,
            data: result.notifications,
            unreadCount: result.unreadCount,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        logger.error('Erro ao listar notificações', { error: error.message });
        res.status(500).json({
            success: false,
            error: { message: 'Erro ao listar notificações' }
        });
    }
});

/**
 * @swagger
 * /api/notifications/poll:
 *   get:
 *     summary: Polling para novas notificações (tempo real)
 *     tags: [Notifications]
 */
router.get('/poll', pollingLimiter, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { last_check } = req.query;

        // Executar em paralelo com timeout de 5 segundos
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 5000)
        );

        const [pending, unreadCount] = await Promise.race([
            Promise.all([
                NotificationsService.getPending(userId, last_check),
                NotificationsService.getUnreadCount(userId)
            ]),
            timeout.then(() => [[], 0]) // Retorna vazio se timeout
        ]);

        res.json({
            success: true,
            data: pending || [],
            unreadCount: unreadCount || 0,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        // Log apenas erros não-timeout para não poluir os logs
        if (error.message !== 'timeout') {
            logger.error('Erro no polling de notificações', { error: error.message });
        }
        res.json({
            success: true,
            data: [],
            unreadCount: 0,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @swagger
 * /api/notifications/count:
 *   get:
 *     summary: Contagem de notificações não lidas
 *     tags: [Notifications]
 */
router.get('/count', pollingLimiter, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const count = await NotificationsService.getUnreadCount(userId);

        res.json({
            success: true,
            count
        });
    } catch (error) {
        logger.error('Erro ao contar notificações', { error: error.message });
        res.status(500).json({
            success: false,
            error: { message: 'Erro ao contar notificações' }
        });
    }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   post:
 *     summary: Marca notificação como lida
 *     tags: [Notifications]
 */
router.post('/:id/read', async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { id } = req.params;

        const success = await NotificationsService.markAsRead(id, userId);

        res.json({
            success,
            message: success ? 'Notificação marcada como lida' : 'Notificação não encontrada'
        });
    } catch (error) {
        logger.error('Erro ao marcar notificação como lida', { error: error.message });
        res.status(500).json({
            success: false,
            error: { message: 'Erro ao marcar como lida' }
        });
    }
});

/**
 * @swagger
 * /api/notifications/read-all:
 *   post:
 *     summary: Marca todas as notificações como lidas
 *     tags: [Notifications]
 */
router.post('/read-all', async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const count = await NotificationsService.markAllAsRead(userId);

        res.json({
            success: true,
            count,
            message: `${count} notificações marcadas como lidas`
        });
    } catch (error) {
        logger.error('Erro ao marcar todas como lidas', { error: error.message });
        res.status(500).json({
            success: false,
            error: { message: 'Erro ao marcar como lidas' }
        });
    }
});

// ======================================================
// ENDPOINTS PARA ENVIO EXTERNO (API)
// Requer nível admin (level >= 5) ou API Key válida
// ======================================================

/**
 * Middleware para verificar se é admin ou tem API Key válida
 */
const requireApiAccess = (req, res, next) => {
    // Verificar API Key no header
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.LEADS_AGENT_API_KEY || 'rolemak-leads-agent-2026';

    if (apiKey && apiKey === validApiKey) {
        return next();
    }

    // Ou verificar se é admin (level >= 5)
    if (req.user && req.user.level >= 5) {
        return next();
    }

    return res.status(403).json({
        success: false,
        error: { message: 'Acesso negado. Requer API Key ou nível admin.' }
    });
};

/**
 * @swagger
 * /api/notifications/send:
 *   post:
 *     summary: Envia notificação para um usuário específico (uso externo)
 *     tags: [Notifications]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, title, body]
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID do usuário destinatário
 *               title:
 *                 type: string
 *                 description: Título da notificação
 *               body:
 *                 type: string
 *                 description: Corpo da notificação
 *               url:
 *                 type: string
 *                 description: URL para abrir ao clicar (opcional)
 *               category:
 *                 type: string
 *                 enum: [FOLLOW_UP, CHURN, GOAL, ORDER, EXCEPTION, GENERAL]
 *                 default: GENERAL
 *     responses:
 *       200:
 *         description: Notificação enviada
 */
router.post('/send', requireApiAccess, async (req, res) => {
    try {
        const { userId, title, body, url, category, icon } = req.body;

        if (!userId || !title || !body) {
            return res.status(400).json({
                success: false,
                error: { message: 'userId, title e body são obrigatórios' }
            });
        }

        const result = await pushService.sendToUser(userId, {
            title,
            body,
            url: url || '/',
            category: category || 'GENERAL',
            icon: icon || '/icons/notification.png'
        });

        logger.info('External notification sent', { userId, title, sentBy: req.user?.userId || 'API' });

        res.json({ success: true, data: result });
    } catch (error) {
        logger.error('Error sending external notification:', error);
        res.status(500).json({ success: false, error: { message: error.message } });
    }
});

/**
 * @swagger
 * /api/notifications/send-template:
 *   post:
 *     summary: Envia notificação usando template (uso externo)
 *     tags: [Notifications]
 *     security:
 *       - ApiKeyAuth: []
 */
router.post('/send-template', requireApiAccess, async (req, res) => {
    try {
        const { userId, templateName, variables } = req.body;

        if (!userId || !templateName) {
            return res.status(400).json({
                success: false,
                error: { message: 'userId e templateName são obrigatórios' }
            });
        }

        const result = await pushService.sendFromTemplate(userId, templateName, variables || {});

        logger.info('Template notification sent', { userId, templateName, sentBy: req.user?.userId || 'API' });

        res.json({ success: true, data: result });
    } catch (error) {
        logger.error('Error sending template notification:', error);
        res.status(500).json({ success: false, error: { message: error.message } });
    }
});

/**
 * @swagger
 * /api/notifications/broadcast:
 *   post:
 *     summary: Envia notificação para todos os usuários com subscription ativa
 *     tags: [Notifications]
 *     security:
 *       - ApiKeyAuth: []
 */
router.post('/broadcast', requireApiAccess, async (req, res) => {
    try {
        const { title, body, url, category } = req.body;

        if (!title || !body) {
            return res.status(400).json({
                success: false,
                error: { message: 'title e body são obrigatórios' }
            });
        }

        // Buscar todos os usuários com subscription ativa
        const [subscriptions] = await getDatabase().execute(
            'SELECT DISTINCT user_id FROM staging.push_subscriptions'
        );

        const results = [];
        for (const sub of subscriptions) {
            const result = await pushService.sendToUser(sub.user_id, {
                title,
                body,
                url: url || '/',
                category: category || 'GENERAL'
            });
            results.push({ userId: sub.user_id, ...result });
        }

        logger.info('Broadcast notification sent', {
            title,
            totalUsers: subscriptions.length,
            sentBy: req.user?.userId || 'API'
        });

        res.json({
            success: true,
            data: {
                totalUsers: subscriptions.length,
                results
            }
        });
    } catch (error) {
        logger.error('Error broadcasting notification:', error);
        res.status(500).json({ success: false, error: { message: error.message } });
    }
});

export default router;
