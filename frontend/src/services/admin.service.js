/**
 * Admin Service - Frontend
 * 
 * Serviço para comunicação com API de administração
 * 
 * @version 1.0
 * @date 2026-01-18
 */

import api from './api'

export const adminService = {
    // ============================================
    // DASHBOARD
    // ============================================

    /**
     * Buscar estatísticas gerais do admin
     */
    getStats: () => api.get('/admin/stats'),

    // ============================================
    // USUÁRIOS
    // ============================================

    /**
     * Listar usuários com filtros
     */
    getUsers: (params = {}) => api.get('/admin/users', { params }),

    /**
     * Buscar usuário por ID
     */
    getUserById: (id) => api.get(`/admin/users/${id}`),

    /**
     * Criar novo usuário
     */
    createUser: (data) => api.post('/admin/users', data),

    /**
     * Atualizar usuário
     */
    updateUser: (id, data) => api.put(`/admin/users/${id}`, data),

    /**
     * Alterar senha do usuário
     */
    updatePassword: (id, password) => api.put(`/admin/users/${id}/password`, { password }),

    /**
     * Desativar usuário
     */
    deactivateUser: (id) => api.put(`/admin/users/${id}/deactivate`),

    /**
     * Reativar usuário
     */
    activateUser: (id) => api.put(`/admin/users/${id}/activate`),

    /**
     * Histórico de login
     */
    getLoginHistory: (id, limit = 20) => api.get(`/admin/users/${id}/login-history`, { params: { limit } }),

    // ============================================
    // DEPARTAMENTOS
    // ============================================

    /**
     * Listar departamentos
     */
    getDepartments: () => api.get('/admin/departments'),

    // ============================================
    // SELLER PHONES
    // ============================================

    /**
     * Listar vinculações vendedor-telefone
     */
    getSellerPhones: () => api.get('/admin/seller-phones'),

    /**
     * Vincular telefone a vendedor
     */
    addSellerPhone: (userId, phoneNumber, isPrimary = false) =>
        api.post('/admin/seller-phones', { userId, phoneNumber, isPrimary }),

    /**
     * Remover vinculação vendedor-telefone
     */
    removeSellerPhone: (userId, phoneNumber) =>
        api.delete('/admin/seller-phones', { data: { userId, phoneNumber } }),
}

export default adminService
