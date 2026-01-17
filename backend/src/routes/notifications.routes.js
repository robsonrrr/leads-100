import express from 'express';
import { pushService } from '../services/push.service.js';
import { authenticateToken } from '../middleware/auth.js';
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
