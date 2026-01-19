/**
 * Admin Routes
 * 
 * Rotas para o painel administrativo
 * 
 * @version 1.0
 * @date 2026-01-18
 */

import express from 'express'
import AdminController from '../controllers/admin.controller.js'
import { authenticateToken } from '../middleware/auth.js'
import { requireAdmin, requireSuperAdmin, logAdminAction } from '../middleware/adminAuth.js'

const router = express.Router()

// Todas as rotas admin requerem autenticação + nível 5+
router.use(authenticateToken)
router.use(requireAdmin)

// ============================================
// DASHBOARD
// ============================================

/**
 * GET /api/admin/stats
 * Estatísticas gerais do painel admin
 */
router.get('/stats', AdminController.getStats)

// ============================================
// USUÁRIOS
// ============================================

/**
 * GET /api/admin/users
 * Listar usuários com paginação e filtros
 */
router.get('/users', AdminController.listUsers)

/**
 * GET /api/admin/users/:id
 * Buscar usuário por ID
 */
router.get('/users/:id', AdminController.getUserById)

/**
 * POST /api/admin/users
 * Criar novo usuário
 */
router.post('/users',
    logAdminAction('CREATE_USER'),
    AdminController.createUser
)

/**
 * PUT /api/admin/users/:id
 * Atualizar usuário
 */
router.put('/users/:id',
    logAdminAction('UPDATE_USER'),
    AdminController.updateUser
)

/**
 * PUT /api/admin/users/:id/password
 * Alterar senha do usuário
 */
router.put('/users/:id/password',
    logAdminAction('RESET_PASSWORD'),
    AdminController.updatePassword
)

/**
 * PUT /api/admin/users/:id/deactivate
 * Desativar usuário
 */
router.put('/users/:id/deactivate',
    logAdminAction('DEACTIVATE_USER'),
    AdminController.deactivateUser
)

/**
 * PUT /api/admin/users/:id/activate
 * Reativar usuário
 */
router.put('/users/:id/activate',
    logAdminAction('ACTIVATE_USER'),
    AdminController.activateUser
)

/**
 * GET /api/admin/users/:id/login-history
 * Histórico de login do usuário
 */
router.get('/users/:id/login-history', AdminController.getLoginHistory)

// ============================================
// DEPARTAMENTOS
// ============================================

/**
 * GET /api/admin/departments
 * Listar departamentos disponíveis
 */
router.get('/departments', AdminController.listDepartments)

// ============================================
// SELLER PHONES
// ============================================

/**
 * GET /api/admin/seller-phones
 * Listar vinculações vendedor-telefone
 */
router.get('/seller-phones', AdminController.listSellerPhones)

/**
 * POST /api/admin/seller-phones
 * Vincular telefone a vendedor
 */
router.post('/seller-phones',
    logAdminAction('ADD_SELLER_PHONE'),
    AdminController.addSellerPhone
)

/**
 * DELETE /api/admin/seller-phones
 * Remover vinculação vendedor-telefone
 */
router.delete('/seller-phones',
    logAdminAction('REMOVE_SELLER_PHONE'),
    AdminController.removeSellerPhone
)

// ============================================
// CHATBOT CONFIG
// ============================================

/**
 * GET /api/admin/chatbot/config
 * Buscar configuração do chatbot
 */
router.get('/chatbot/config', AdminController.getChatbotConfig)

/**
 * PUT /api/admin/chatbot/config
 * Atualizar configuração do chatbot
 */
router.put('/chatbot/config',
    logAdminAction('UPDATE_CHATBOT_CONFIG'),
    AdminController.updateChatbotConfig
)

/**
 * POST /api/admin/chatbot/test
 * Testar resposta do chatbot
 */
router.post('/chatbot/test', AdminController.testChatbotResponse)

// ============================================
// LOGS E AUDITORIA
// ============================================

/**
 * GET /api/admin/logs
 * Listar logs de auditoria
 */
router.get('/logs', AdminController.listAuditLogs)

/**
 * GET /api/admin/logs/actions
 * Listar tipos de ações disponíveis
 */
router.get('/logs/actions', AdminController.getLogActions)

/**
 * GET /api/admin/logs/stats
 * Estatísticas de logs
 */
router.get('/logs/stats', AdminController.getLogStats)

// ============================================
// CUSTOMER LINKS (Superbot)
// ============================================

/**
 * GET /api/admin/customer-links
 * Listar vinculações cliente Superbot ↔ Leads
 */
router.get('/customer-links', AdminController.listCustomerLinks)

/**
 * POST /api/admin/customer-links
 * Criar nova vinculação
 */
router.post('/customer-links',
    logAdminAction('CREATE_CUSTOMER_LINK'),
    AdminController.createCustomerLink
)

/**
 * PUT /api/admin/customer-links/:id
 * Atualizar vinculação
 */
router.put('/customer-links/:id',
    logAdminAction('UPDATE_CUSTOMER_LINK'),
    AdminController.updateCustomerLink
)

/**
 * DELETE /api/admin/customer-links/:id
 * Remover vinculação
 */
router.delete('/customer-links/:id',
    logAdminAction('DELETE_CUSTOMER_LINK'),
    AdminController.deleteCustomerLink
)

/**
 * GET /api/admin/customer-links/stats
 * Estatísticas de vinculações
 */
router.get('/customer-links/stats', AdminController.getCustomerLinksStats)

/**
 * GET /api/admin/customer-links/unlinked
 * Listar contatos SuperBot não vinculados
 */
router.get('/customer-links/unlinked', AdminController.getUnlinkedSuperbotCustomers)

/**
 * GET /api/admin/customer-links/search-leads
 * Buscar clientes leads-agent para vincular
 */
router.get('/customer-links/search-leads', AdminController.searchLeadsCustomers)

/**
 * POST /api/admin/customer-links/auto-link
 * Vinculação automática em massa por telefone
 */
router.post('/customer-links/auto-link',
    logAdminAction('AUTO_LINK_CUSTOMERS'),
    AdminController.autoLinkCustomers
)

export default router

