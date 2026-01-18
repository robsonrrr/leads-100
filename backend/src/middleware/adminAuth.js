/**
 * Admin Authorization Middleware
 * 
 * Middlewares para proteger rotas administrativas
 * 
 * @version 1.0
 * @date 2026-01-18
 */

import logger from '../config/logger.js'

/**
 * Middleware que requer nível de gerente (level >= 5)
 * Permite acesso ao painel admin básico
 */
export const requireAdmin = (req, res, next) => {
    const userLevel = req.user?.level || 0
    const userId = req.user?.userId
    const userName = req.user?.username || req.user?.nick

    if (userLevel < 5) {
        logger.warn('🚫 Acesso admin negado - nível insuficiente', {
            userId,
            userName,
            userLevel,
            requiredLevel: 5,
            path: req.path
        })

        return res.status(403).json({
            success: false,
            error: 'Acesso negado',
            message: 'Você precisa de nível de gerente (5+) para acessar esta área.'
        })
    }

    // Log de acesso admin
    logger.info('👤 Acesso admin autorizado', {
        userId,
        userName,
        userLevel,
        path: req.path,
        method: req.method
    })

    next()
}

/**
 * Middleware que requer nível de super admin (level = 6)
 * Permite acesso a configurações críticas do sistema
 */
export const requireSuperAdmin = (req, res, next) => {
    const userLevel = req.user?.level || 0
    const userId = req.user?.userId
    const userName = req.user?.username || req.user?.nick

    if (userLevel !== 6) {
        logger.warn('🚫 Acesso super admin negado', {
            userId,
            userName,
            userLevel,
            requiredLevel: 6,
            path: req.path
        })

        return res.status(403).json({
            success: false,
            error: 'Acesso negado',
            message: 'Apenas administradores (nível 6) podem acessar esta função.'
        })
    }

    logger.info('🔐 Acesso super admin autorizado', {
        userId,
        userName,
        path: req.path,
        method: req.method
    })

    next()
}

/**
 * Middleware de logging para todas as ações admin
 * Registra ações para auditoria
 */
export const logAdminAction = (action) => {
    return (req, res, next) => {
        const userId = req.user?.userId
        const userName = req.user?.username || req.user?.nick

        // Armazenar info de auditoria no request
        req.auditInfo = {
            userId,
            userName,
            action,
            timestamp: new Date().toISOString(),
            ip: req.ip || req.connection?.remoteAddress,
            userAgent: req.get('User-Agent')
        }

        next()
    }
}

export default {
    requireAdmin,
    requireSuperAdmin,
    logAdminAction
}
