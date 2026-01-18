/**
 * Admin Controller
 * 
 * Endpoints para o painel administrativo
 * 
 * @version 1.0
 * @date 2026-01-18
 */

import AdminService from '../services/admin.service.js'
import logger from '../config/logger.js'

/**
 * GET /api/admin/users
 * Listar usuários com paginação e filtros
 */
const listUsers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            level,
            depto,
            active,
            search,
            orderBy = 'nick',
            orderDir = 'ASC'
        } = req.query

        const result = await AdminService.listUsers({
            page: parseInt(page),
            limit: parseInt(limit),
            level,
            depto,
            active,
            search,
            orderBy,
            orderDir
        })

        res.json({
            success: true,
            data: result.users,
            pagination: result.pagination
        })
    } catch (error) {
        logger.error('Erro ao listar usuários:', error)
        res.status(500).json({
            success: false,
            error: 'Erro ao listar usuários',
            message: error.message
        })
    }
}

/**
 * GET /api/admin/users/:id
 * Buscar usuário por ID
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params

        const user = await AdminService.getUserById(parseInt(id))

        res.json({
            success: true,
            data: user
        })
    } catch (error) {
        if (error.message === 'Usuário não encontrado') {
            return res.status(404).json({
                success: false,
                error: error.message
            })
        }

        logger.error('Erro ao buscar usuário:', error)
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar usuário',
            message: error.message
        })
    }
}

/**
 * POST /api/admin/users
 * Criar novo usuário
 */
const createUser = async (req, res) => {
    try {
        const { user, nick, email, password, level, depto, segmento } = req.body
        const createdBy = req.user?.userId

        // Validações básicas
        if (!user || !nick || !password) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: user, nick, password'
            })
        }

        const newUser = await AdminService.createUser({
            user,
            nick,
            email,
            password,
            level: level || 1,
            depto,
            segmento
        }, createdBy)

        res.status(201).json({
            success: true,
            data: newUser,
            message: 'Usuário criado com sucesso'
        })
    } catch (error) {
        logger.error('Erro ao criar usuário:', error)
        res.status(400).json({
            success: false,
            error: error.message
        })
    }
}

/**
 * PUT /api/admin/users/:id
 * Atualizar usuário
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params
        const { nick, email, level, depto, segmento, active } = req.body
        const updatedBy = req.user?.userId

        const user = await AdminService.updateUser(parseInt(id), {
            nick,
            email,
            level,
            depto,
            segmento,
            active
        }, updatedBy)

        res.json({
            success: true,
            data: user,
            message: 'Usuário atualizado com sucesso'
        })
    } catch (error) {
        if (error.message === 'Usuário não encontrado') {
            return res.status(404).json({
                success: false,
                error: error.message
            })
        }

        logger.error('Erro ao atualizar usuário:', error)
        res.status(400).json({
            success: false,
            error: error.message
        })
    }
}

/**
 * PUT /api/admin/users/:id/password
 * Alterar senha do usuário
 */
const updatePassword = async (req, res) => {
    try {
        const { id } = req.params
        const { password } = req.body
        const updatedBy = req.user?.userId

        if (!password) {
            return res.status(400).json({
                success: false,
                error: 'Senha é obrigatória'
            })
        }

        await AdminService.updatePassword(parseInt(id), password, updatedBy)

        res.json({
            success: true,
            message: 'Senha alterada com sucesso'
        })
    } catch (error) {
        logger.error('Erro ao alterar senha:', error)
        res.status(400).json({
            success: false,
            error: error.message
        })
    }
}

/**
 * PUT /api/admin/users/:id/deactivate
 * Desativar usuário
 */
const deactivateUser = async (req, res) => {
    try {
        const { id } = req.params
        const deactivatedBy = req.user?.userId

        await AdminService.deactivateUser(parseInt(id), deactivatedBy)

        res.json({
            success: true,
            message: 'Usuário desativado com sucesso'
        })
    } catch (error) {
        logger.error('Erro ao desativar usuário:', error)
        res.status(400).json({
            success: false,
            error: error.message
        })
    }
}

/**
 * PUT /api/admin/users/:id/activate
 * Reativar usuário
 */
const activateUser = async (req, res) => {
    try {
        const { id } = req.params
        const activatedBy = req.user?.userId

        await AdminService.activateUser(parseInt(id), activatedBy)

        res.json({
            success: true,
            message: 'Usuário reativado com sucesso'
        })
    } catch (error) {
        logger.error('Erro ao reativar usuário:', error)
        res.status(400).json({
            success: false,
            error: error.message
        })
    }
}

/**
 * GET /api/admin/users/:id/login-history
 * Histórico de login do usuário
 */
const getLoginHistory = async (req, res) => {
    try {
        const { id } = req.params
        const { limit = 20 } = req.query

        const history = await AdminService.getLoginHistory(parseInt(id), parseInt(limit))

        res.json({
            success: true,
            data: history
        })
    } catch (error) {
        logger.error('Erro ao buscar histórico de login:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
}

/**
 * GET /api/admin/departments
 * Listar departamentos
 */
const listDepartments = async (req, res) => {
    try {
        const departments = await AdminService.listDepartments()

        res.json({
            success: true,
            data: departments
        })
    } catch (error) {
        logger.error('Erro ao listar departamentos:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
}

/**
 * GET /api/admin/stats
 * Estatísticas gerais do admin
 */
const getStats = async (req, res) => {
    try {
        const stats = await AdminService.getDashboardStats()

        res.json({
            success: true,
            data: stats
        })
    } catch (error) {
        logger.error('Erro ao buscar estatísticas:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
}

/**
 * GET /api/admin/seller-phones
 * Listar vinculações vendedor-telefone
 */
const listSellerPhones = async (req, res) => {
    try {
        const phones = await AdminService.listSellerPhones()

        res.json({
            success: true,
            data: phones
        })
    } catch (error) {
        logger.error('Erro ao listar seller phones:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
}

/**
 * POST /api/admin/seller-phones
 * Vincular telefone a vendedor
 */
const addSellerPhone = async (req, res) => {
    try {
        const { userId, phoneNumber, isPrimary = false } = req.body
        const addedBy = req.user?.userId

        if (!userId || !phoneNumber) {
            return res.status(400).json({
                success: false,
                error: 'userId e phoneNumber são obrigatórios'
            })
        }

        await AdminService.addSellerPhone(
            parseInt(userId),
            phoneNumber,
            isPrimary,
            addedBy
        )

        res.status(201).json({
            success: true,
            message: 'Telefone vinculado com sucesso'
        })
    } catch (error) {
        logger.error('Erro ao vincular telefone:', error)
        res.status(400).json({
            success: false,
            error: error.message
        })
    }
}

/**
 * DELETE /api/admin/seller-phones
 * Remover vinculação vendedor-telefone
 */
const removeSellerPhone = async (req, res) => {
    try {
        const { userId, phoneNumber } = req.body
        const removedBy = req.user?.userId

        if (!userId || !phoneNumber) {
            return res.status(400).json({
                success: false,
                error: 'userId e phoneNumber são obrigatórios'
            })
        }

        await AdminService.removeSellerPhone(
            parseInt(userId),
            phoneNumber,
            removedBy
        )

        res.json({
            success: true,
            message: 'Telefone removido com sucesso'
        })
    } catch (error) {
        logger.error('Erro ao remover telefone:', error)
        res.status(400).json({
            success: false,
            error: error.message
        })
    }
}

// ============================================
// CHATBOT CONFIG
// ============================================

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CONFIG_FILE = path.join(__dirname, '../../config/chatbot-config.json')

/**
 * GET /api/admin/chatbot/config
 * Buscar configuração do chatbot
 */
const getChatbotConfig = async (req, res) => {
    try {
        let config = {}

        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf-8')
            config = JSON.parse(data)
        }

        res.json({
            success: true,
            data: config
        })
    } catch (error) {
        logger.error('Erro ao buscar configuração do chatbot:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
}

/**
 * PUT /api/admin/chatbot/config
 * Atualizar configuração do chatbot
 */
const updateChatbotConfig = async (req, res) => {
    try {
        const { config } = req.body
        const updatedBy = req.user?.userId

        if (!config) {
            return res.status(400).json({
                success: false,
                error: 'Configuração é obrigatória'
            })
        }

        // Garantir que o diretório existe
        const configDir = path.dirname(CONFIG_FILE)
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true })
        }

        // Adicionar metadata
        const configWithMeta = {
            ...config,
            _updatedAt: new Date().toISOString(),
            _updatedBy: updatedBy
        }

        fs.writeFileSync(CONFIG_FILE, JSON.stringify(configWithMeta, null, 2))

        logger.info('🤖 Configuração do chatbot atualizada', {
            updatedBy,
            enabled: config.enabled
        })

        res.json({
            success: true,
            message: 'Configuração salva com sucesso'
        })
    } catch (error) {
        logger.error('Erro ao salvar configuração do chatbot:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
}

/**
 * POST /api/admin/chatbot/test
 * Testar resposta do chatbot
 */
const testChatbotResponse = async (req, res) => {
    try {
        const { message } = req.body

        // Por enquanto, retornar resposta mock
        // TODO: Integrar com o serviço real de chatbot
        res.json({
            success: true,
            data: {
                input: message,
                response: `[Teste] Resposta simulada para: "${message}"`,
                intent: 'test',
                confidence: 0.95
            }
        })
    } catch (error) {
        logger.error('Erro ao testar chatbot:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
}

// ==========================================
// LOGS E AUDITORIA
// ==========================================

import { auditLog, AuditAction } from '../services/auditLog.service.js'

/**
 * GET /api/admin/logs
 * Listar logs de auditoria
 */
const listAuditLogs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            action,
            userId,
            resourceType,
            dateFrom,
            dateTo
        } = req.query

        // Calcular offset para paginação
        const offset = (parseInt(page) - 1) * parseInt(limit)

        const filters = {
            action: action || null,
            userId: userId ? parseInt(userId) : null,
            resourceType: resourceType || null,
            dateFrom: dateFrom || null,
            dateTo: dateTo || null,
            limit: parseInt(limit) + 1 // +1 para checar se há mais
        }

        const logs = await auditLog.findLogs(filters)

        // Verificar se há mais páginas
        const hasMore = logs.length > parseInt(limit)
        const data = hasMore ? logs.slice(0, -1) : logs

        res.json({
            success: true,
            data: data.map(log => ({
                id: log.id,
                action: log.action,
                userId: log.user_id,
                userName: log.user_name,
                resourceType: log.resource_type,
                resourceId: log.resource_id,
                oldValue: log.old_value ? JSON.parse(log.old_value) : null,
                newValue: log.new_value ? JSON.parse(log.new_value) : null,
                ipAddress: log.ip_address,
                userAgent: log.user_agent,
                metadata: log.metadata ? JSON.parse(log.metadata) : null,
                createdAt: log.created_at
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                hasMore
            }
        })
    } catch (error) {
        logger.error('Erro ao listar logs:', error)
        res.status(500).json({
            success: false,
            error: 'Erro ao listar logs'
        })
    }
}

/**
 * GET /api/admin/logs/actions
 * Listar tipos de ações disponíveis
 */
const getLogActions = async (req, res) => {
    res.json({
        success: true,
        data: Object.keys(AuditAction).map(key => ({
            value: AuditAction[key],
            label: key.replace(/_/g, ' ')
        }))
    })
}

/**
 * GET /api/admin/logs/stats
 * Estatísticas de logs
 */
const getLogStats = async (req, res) => {
    try {
        await auditLog.initialize()
        const db = (await import('../config/database.js')).getDatabase()

        const [stats] = await db.execute(`
            SELECT 
                COUNT(*) as total,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(DISTINCT action) as unique_actions,
                MIN(created_at) as first_log,
                MAX(created_at) as last_log
            FROM audit_log
        `)

        const [byAction] = await db.execute(`
            SELECT action, COUNT(*) as count
            FROM audit_log
            GROUP BY action
            ORDER BY count DESC
            LIMIT 10
        `)

        const [byUser] = await db.execute(`
            SELECT user_name, user_id, COUNT(*) as count
            FROM audit_log
            WHERE user_id IS NOT NULL
            GROUP BY user_id, user_name
            ORDER BY count DESC
            LIMIT 10
        `)

        const [recent] = await db.execute(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM audit_log
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date
        `)

        res.json({
            success: true,
            data: {
                summary: stats[0],
                byAction,
                byUser,
                recentActivity: recent
            }
        })
    } catch (error) {
        logger.error('Erro ao buscar estatísticas de logs:', error)
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar estatísticas'
        })
    }
}

export default {
    listUsers,
    getUserById,
    createUser,
    updateUser,
    updatePassword,
    deactivateUser,
    activateUser,
    getLoginHistory,
    listDepartments,
    getStats,
    listSellerPhones,
    addSellerPhone,
    removeSellerPhone,
    getChatbotConfig,
    updateChatbotConfig,
    testChatbotResponse,
    listAuditLogs,
    getLogActions,
    getLogStats
}
