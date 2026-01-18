/**
 * Notifications Controller
 * 
 * Endpoints REST para notificações em tempo real
 * 
 * @version 1.0
 * @date 2026-01-18
 */

import { NotificationsService, NOTIFICATION_TYPES, PRIORITY } from '../services/notifications.service.js';
import logger from '../config/logger.js';

export const NotificationsController = {
    /**
     * GET /api/notifications
     * Lista notificações do usuário logado
     */
    async list(req, res) {
        try {
            const userId = req.user.id;
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
                error: 'Erro ao listar notificações'
            });
        }
    },

    /**
     * GET /api/notifications/poll
     * Polling para novas notificações (tempo real)
     */
    async poll(req, res) {
        try {
            const userId = req.user.id;
            const { last_check } = req.query;

            const pending = await NotificationsService.getPending(userId, last_check);
            const unreadCount = await NotificationsService.getUnreadCount(userId);

            res.json({
                success: true,
                data: pending,
                unreadCount,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Erro no polling de notificações', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar notificações'
            });
        }
    },

    /**
     * GET /api/notifications/count
     * Retorna contagem de notificações não lidas
     */
    async count(req, res) {
        try {
            const userId = req.user.id;
            const count = await NotificationsService.getUnreadCount(userId);

            res.json({
                success: true,
                count
            });
        } catch (error) {
            logger.error('Erro ao contar notificações', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao contar notificações'
            });
        }
    },

    /**
     * POST /api/notifications/:id/read
     * Marca notificação como lida
     */
    async markAsRead(req, res) {
        try {
            const userId = req.user.id;
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
                error: 'Erro ao marcar como lida'
            });
        }
    },

    /**
     * POST /api/notifications/read-all
     * Marca todas as notificações como lidas
     */
    async markAllAsRead(req, res) {
        try {
            const userId = req.user.id;
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
                error: 'Erro ao marcar como lidas'
            });
        }
    },

    /**
     * DELETE /api/notifications/:id
     * Remove notificação
     */
    async delete(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            const success = await NotificationsService.delete(id, userId);

            res.json({
                success,
                message: success ? 'Notificação removida' : 'Notificação não encontrada'
            });
        } catch (error) {
            logger.error('Erro ao remover notificação', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao remover notificação'
            });
        }
    },

    /**
     * POST /api/notifications/test
     * Cria notificação de teste (debug)
     */
    async test(req, res) {
        try {
            const userId = req.user.id;
            const { type = 'test', title = 'Notificação de Teste', message = 'Esta é uma notificação de teste.' } = req.body;

            const id = await NotificationsService.create({
                userId,
                type: NOTIFICATION_TYPES.SYSTEM,
                title,
                message,
                priority: PRIORITY.NORMAL,
                data: { test: true }
            });

            res.json({
                success: true,
                id,
                message: 'Notificação de teste criada'
            });
        } catch (error) {
            logger.error('Erro ao criar notificação de teste', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erro ao criar notificação'
            });
        }
    }
};

export default NotificationsController;
