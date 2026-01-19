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

// ==========================================
// CUSTOMER LINKS (Superbot)
// ==========================================

/**
 * GET /api/admin/customer-links
 * Listar vinculações cliente Superbot ↔ Leads
 */
const listCustomerLinks = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            verified,
            search
        } = req.query

        const db = (await import('../config/database.js')).getDatabase()

        let query = `
            SELECT 
                scl.id,
                scl.superbot_customer_id,
                scl.leads_customer_id,
                scl.linked_by,
                scl.linked_at,
                scl.confidence_score,
                scl.verified,
                sc.phone_number,
                sc.name as superbot_name,
                sc.push_name,
                c.nome as leads_customer_name,
                c.cnpj,
                u.nick as linked_by_name
            FROM superbot.superbot_customer_links scl
            LEFT JOIN superbot.superbot_customers sc ON sc.id = scl.superbot_customer_id
            LEFT JOIN mak.clientes c ON c.id = scl.leads_customer_id
            LEFT JOIN mak.rolemak_users u ON u.id = scl.linked_by
            WHERE 1=1
        `
        const params = []

        if (verified !== undefined && verified !== '') {
            query += ' AND scl.verified = ?'
            params.push(verified === 'true' ? 1 : 0)
        }

        if (search) {
            query += ' AND (sc.phone_number LIKE ? OR sc.name LIKE ? OR c.nome LIKE ?)'
            const searchTerm = `%${search}%`
            params.push(searchTerm, searchTerm, searchTerm)
        }

        query += ' ORDER BY scl.linked_at DESC'
        query += ` LIMIT ${parseInt(limit)} OFFSET ${(parseInt(page) - 1) * parseInt(limit)}`

        const [links] = await db.execute(query, params)

        // Count total
        const [countResult] = await db.execute(`
            SELECT COUNT(*) as total FROM superbot.superbot_customer_links
        `)

        res.json({
            success: true,
            data: links,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total
            }
        })
    } catch (error) {
        logger.error('Erro ao listar customer links:', error)
        res.status(500).json({
            success: false,
            error: 'Erro ao listar vinculações',
            message: error.message
        })
    }
}

/**
 * POST /api/admin/customer-links
 * Criar nova vinculação
 */
const createCustomerLink = async (req, res) => {
    try {
        const { superbot_customer_id, leads_customer_id, confidence_score = 100, verified = true } = req.body
        const linked_by = req.user?.userId

        if (!superbot_customer_id || !leads_customer_id) {
            return res.status(400).json({
                success: false,
                error: 'superbot_customer_id e leads_customer_id são obrigatórios'
            })
        }

        const db = (await import('../config/database.js')).getDatabase()

        const [result] = await db.execute(`
            INSERT INTO superbot.superbot_customer_links 
            (superbot_customer_id, leads_customer_id, linked_by, confidence_score, verified)
            VALUES (?, ?, ?, ?, ?)
        `, [superbot_customer_id, leads_customer_id, linked_by, confidence_score, verified ? 1 : 0])

        logger.info('📎 Customer link criado', {
            id: result.insertId,
            superbot_customer_id,
            leads_customer_id,
            linked_by
        })

        res.status(201).json({
            success: true,
            data: { id: result.insertId },
            message: 'Vinculação criada com sucesso'
        })
    } catch (error) {
        logger.error('Erro ao criar customer link:', error)
        res.status(400).json({
            success: false,
            error: error.message
        })
    }
}

/**
 * PUT /api/admin/customer-links/:id
 * Atualizar vinculação
 */
const updateCustomerLink = async (req, res) => {
    try {
        const { id } = req.params
        const { superbot_customer_id, leads_customer_id, confidence_score, verified } = req.body

        const db = (await import('../config/database.js')).getDatabase()

        const updates = []
        const params = []

        if (superbot_customer_id !== undefined) {
            updates.push('superbot_customer_id = ?')
            params.push(superbot_customer_id)
        }
        if (leads_customer_id !== undefined) {
            updates.push('leads_customer_id = ?')
            params.push(leads_customer_id)
        }
        if (confidence_score !== undefined) {
            updates.push('confidence_score = ?')
            params.push(confidence_score)
        }
        if (verified !== undefined) {
            updates.push('verified = ?')
            params.push(verified ? 1 : 0)
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Nenhum campo para atualizar'
            })
        }

        params.push(id)

        await db.execute(`
            UPDATE superbot.superbot_customer_links 
            SET ${updates.join(', ')}
            WHERE id = ?
        `, params)

        logger.info('📎 Customer link atualizado', { id })

        res.json({
            success: true,
            message: 'Vinculação atualizada com sucesso'
        })
    } catch (error) {
        logger.error('Erro ao atualizar customer link:', error)
        res.status(400).json({
            success: false,
            error: error.message
        })
    }
}

/**
 * DELETE /api/admin/customer-links/:id
 * Remover vinculação
 */
const deleteCustomerLink = async (req, res) => {
    try {
        const { id } = req.params

        const db = (await import('../config/database.js')).getDatabase()

        await db.execute(`
            DELETE FROM superbot.superbot_customer_links WHERE id = ?
        `, [id])

        logger.info('📎 Customer link removido', { id })

        res.json({
            success: true,
            message: 'Vinculação removida com sucesso'
        })
    } catch (error) {
        logger.error('Erro ao remover customer link:', error)
        res.status(400).json({
            success: false,
            error: error.message
        })
    }
}

/**
 * GET /api/admin/customer-links/stats
 * Estatísticas de vinculações
 */
const getCustomerLinksStats = async (req, res) => {
    try {
        const db = (await import('../config/database.js')).getDatabase()

        const [stats] = await db.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as verified,
                SUM(CASE WHEN verified = 0 THEN 1 ELSE 0 END) as pending,
                AVG(confidence_score) as avg_confidence,
                MIN(linked_at) as first_link,
                MAX(linked_at) as last_link
            FROM superbot.superbot_customer_links
        `)

        const [byUser] = await db.execute(`
            SELECT 
                u.nick as user_name,
                COUNT(*) as count
            FROM superbot.superbot_customer_links scl
            LEFT JOIN mak.rolemak_users u ON u.id = scl.linked_by
            WHERE scl.linked_by IS NOT NULL
            GROUP BY scl.linked_by, u.nick
            ORDER BY count DESC
            LIMIT 10
        `)

        const [recent] = await db.execute(`
            SELECT 
                DATE(linked_at) as date,
                COUNT(*) as count
            FROM superbot.superbot_customer_links
            WHERE linked_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(linked_at)
            ORDER BY date
        `)

        res.json({
            success: true,
            data: {
                summary: stats[0],
                byUser,
                recentActivity: recent
            }
        })
    } catch (error) {
        logger.error('Erro ao buscar estatísticas de links:', error)
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar estatísticas'
        })
    }
}

/**
 * POST /api/admin/customer-links/auto-link
 * Vinculação automática em massa por telefone
 */
const autoLinkCustomers = async (req, res) => {
    try {
        const linked_by = req.user?.userId
        const { dryRun = false } = req.body // Se true, apenas simula sem criar

        const db = (await import('../config/database.js')).getDatabase()

        // Buscar contatos SuperBot não vinculados e encontrar matches por telefone
        // A tabela cr.contatos contém os telefones dos clientes (campo fone1, fone2)
        // Normaliza telefones para comparar apenas os últimos 9 dígitos
        const [candidates] = await db.execute(`
            SELECT DISTINCT
                sc.id as superbot_customer_id,
                sc.phone_number as superbot_phone,
                sc.name as superbot_name,
                sc.push_name,
                c.id as leads_customer_id,
                c.nome as leads_customer_name,
                COALESCE(ct.fone1, ct.fone2, c.fone) as leads_phone,
                c.cnpj
            FROM superbot.superbot_customers sc
            INNER JOIN cr.contatos ct ON (
                -- Match por últimos 9 dígitos (ignora código de país e DDD)
                RIGHT(REGEXP_REPLACE(sc.phone_number, '[^0-9]', ''), 9) = 
                RIGHT(REGEXP_REPLACE(ct.fone1, '[^0-9]', ''), 9)
                AND LENGTH(REGEXP_REPLACE(ct.fone1, '[^0-9]', '')) >= 9
            ) OR (
                RIGHT(REGEXP_REPLACE(sc.phone_number, '[^0-9]', ''), 9) = 
                RIGHT(REGEXP_REPLACE(ct.fone2, '[^0-9]', ''), 9)
                AND LENGTH(REGEXP_REPLACE(ct.fone2, '[^0-9]', '')) >= 9
            )
            INNER JOIN mak.clientes c ON c.id = ct.cliente
            LEFT JOIN superbot.superbot_customer_links scl ON scl.superbot_customer_id = sc.id
            WHERE sc.is_group = 0
              AND scl.id IS NULL  -- Apenas não vinculados
            ORDER BY sc.phone_number
        `)

        if (dryRun) {
            // Modo simulação - apenas retorna os candidatos
            return res.json({
                success: true,
                dryRun: true,
                message: `${candidates.length} vinculações podem ser criadas automaticamente`,
                data: candidates.slice(0, 100) // Limita a 100 para preview
            })
        }

        // Criar vinculações em batch
        let created = 0
        let errors = []

        for (const candidate of candidates) {
            try {
                await db.execute(`
                    INSERT INTO superbot.superbot_customer_links 
                    (superbot_customer_id, leads_customer_id, linked_by, confidence_score, verified, notes)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    candidate.superbot_customer_id,
                    candidate.leads_customer_id,
                    linked_by,
                    80, // Score de 80% para vinculações automáticas
                    0,  // Não verificado (auto-link)
                    'Vinculação automática por telefone'
                ])
                created++
            } catch (err) {
                // Ignora duplicados e continua
                if (!err.message.includes('Duplicate')) {
                    errors.push({
                        superbot_id: candidate.superbot_customer_id,
                        leads_id: candidate.leads_customer_id,
                        error: err.message
                    })
                }
            }
        }

        logger.info('🔗 Auto-link concluído', {
            total_candidates: candidates.length,
            created,
            errors: errors.length,
            linked_by
        })

        res.json({
            success: true,
            message: `Vinculação automática concluída`,
            data: {
                candidates: candidates.length,
                created,
                errors: errors.length,
                errorDetails: errors.slice(0, 10) // Mostra apenas 10 erros
            }
        })
    } catch (error) {
        logger.error('Erro no auto-link:', error)
        res.status(500).json({
            success: false,
            error: 'Erro na vinculação automática',
            message: error.message
        })
    }
}

/**
 * GET /api/admin/customer-links/unlinked
 * Listar contatos SuperBot ainda não vinculados (para vinculação manual)
 */
const getUnlinkedSuperbotCustomers = async (req, res) => {
    try {
        const { page = 1, limit = 50, search } = req.query

        const db = (await import('../config/database.js')).getDatabase()

        let query = `
            SELECT 
                sc.id,
                sc.phone_number,
                sc.name,
                sc.push_name,
                sc.created_at,
                (
                    SELECT COUNT(*) 
                    FROM superbot.messages m 
                    WHERE m.sender_phone = sc.phone_number 
                       OR m.recipient_phone = sc.phone_number
                ) as message_count
            FROM superbot.superbot_customers sc
            LEFT JOIN superbot.superbot_customer_links scl ON scl.superbot_customer_id = sc.id
            WHERE sc.is_group = 0
              AND scl.id IS NULL
        `
        const params = []

        if (search) {
            query += ' AND (sc.phone_number LIKE ? OR sc.name LIKE ? OR sc.push_name LIKE ?)'
            const term = `%${search}%`
            params.push(term, term, term)
        }

        query += ' ORDER BY message_count DESC, sc.created_at DESC'
        query += ` LIMIT ${parseInt(limit)} OFFSET ${(parseInt(page) - 1) * parseInt(limit)}`

        const [customers] = await db.execute(query, params)

        // Total não vinculados
        const [countResult] = await db.execute(`
            SELECT COUNT(*) as total
            FROM superbot.superbot_customers sc
            LEFT JOIN superbot.superbot_customer_links scl ON scl.superbot_customer_id = sc.id
            WHERE sc.is_group = 0 AND scl.id IS NULL
        `)

        res.json({
            success: true,
            data: customers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total
            }
        })
    } catch (error) {
        logger.error('Erro ao listar não vinculados:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
}

/**
 * GET /api/admin/customer-links/search-leads
 * Buscar clientes do leads-agent para vincular manualmente
 */
const searchLeadsCustomers = async (req, res) => {
    try {
        const { q, limit = 20 } = req.query

        if (!q || q.length < 2) {
            return res.json({ success: true, data: [] })
        }

        const db = (await import('../config/database.js')).getDatabase()

        const [customers] = await db.execute(`
            SELECT 
                id,
                nome,
                fantasia,
                cnpj,
                fone,
                cidade,
                estado
            FROM mak.clientes
            WHERE nome LIKE ? 
               OR fantasia LIKE ? 
               OR cnpj LIKE ?
               OR fone LIKE ?
            ORDER BY nome
            LIMIT ?
        `, [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, parseInt(limit)])

        res.json({
            success: true,
            data: customers
        })
    } catch (error) {
        logger.error('Erro ao buscar clientes:', error)
        res.status(500).json({
            success: false,
            error: error.message
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
    getLogStats,
    listCustomerLinks,
    createCustomerLink,
    updateCustomerLink,
    deleteCustomerLink,
    getCustomerLinksStats,
    autoLinkCustomers,
    getUnlinkedSuperbotCustomers,
    searchLeadsCustomers
}

