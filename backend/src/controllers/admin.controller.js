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
    removeSellerPhone
}
