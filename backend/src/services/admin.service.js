/**
 * Admin Service
 * 
 * Lógica de negócio para o painel administrativo
 * 
 * @version 1.0
 * @date 2026-01-18
 */

import AdminRepository from '../repositories/admin.repository.js'
import SuperbotRepository from '../repositories/superbot.repository.js'
import logger from '../config/logger.js'

class AdminService {
    /**
     * Listar usuários com paginação e filtros
     */
    async listUsers(filters) {
        return await AdminRepository.listUsers(filters)
    }

    /**
     * Buscar usuário por ID
     */
    async getUserById(userId) {
        const user = await AdminRepository.getUserById(userId)

        if (!user) {
            throw new Error('Usuário não encontrado')
        }

        return user
    }

    /**
     * Criar novo usuário
     */
    async createUser(userData, createdBy) {
        // Validar username único
        if (await AdminRepository.usernameExists(userData.user)) {
            throw new Error('Este nome de usuário já está em uso')
        }

        // Validar email único
        if (userData.email && await AdminRepository.emailExists(userData.email)) {
            throw new Error('Este email já está em uso')
        }

        // Validar nível
        if (userData.level < 1 || userData.level > 6) {
            throw new Error('Nível de acesso inválido (deve ser entre 1 e 6)')
        }

        // Criar usuário
        const userId = await AdminRepository.createUser(userData)

        logger.info('👤 Novo usuário criado', {
            userId,
            username: userData.user,
            level: userData.level,
            createdBy
        })

        return await this.getUserById(userId)
    }

    /**
     * Atualizar usuário
     */
    async updateUser(userId, userData, updatedBy) {
        // Verificar se usuário existe
        const existingUser = await AdminRepository.getUserById(userId)
        if (!existingUser) {
            throw new Error('Usuário não encontrado')
        }

        // Validar email único se estiver sendo alterado
        if (userData.email && userData.email !== existingUser.email) {
            if (await AdminRepository.emailExists(userData.email, userId)) {
                throw new Error('Este email já está em uso')
            }
        }

        // Validar nível
        if (userData.level !== undefined && (userData.level < 1 || userData.level > 6)) {
            throw new Error('Nível de acesso inválido (deve ser entre 1 e 6)')
        }

        await AdminRepository.updateUser(userId, userData)

        logger.info('👤 Usuário atualizado', {
            userId,
            changes: Object.keys(userData),
            updatedBy
        })

        return await this.getUserById(userId)
    }

    /**
     * Alterar senha do usuário
     */
    async updatePassword(userId, newPassword, updatedBy) {
        if (!newPassword || newPassword.length < 6) {
            throw new Error('A senha deve ter pelo menos 6 caracteres')
        }

        await AdminRepository.updatePassword(userId, newPassword)

        logger.info('🔑 Senha alterada', {
            userId,
            updatedBy
        })

        return true
    }

    /**
     * Desativar usuário
     */
    async deactivateUser(userId, deactivatedBy) {
        const user = await AdminRepository.getUserById(userId)
        if (!user) {
            throw new Error('Usuário não encontrado')
        }

        // Não permitir desativar a si mesmo
        if (userId === deactivatedBy) {
            throw new Error('Você não pode desativar sua própria conta')
        }

        await AdminRepository.deactivateUser(userId)

        logger.info('🚫 Usuário desativado', {
            userId,
            username: user.user,
            deactivatedBy
        })

        return true
    }

    /**
     * Reativar usuário
     */
    async activateUser(userId, activatedBy) {
        const user = await AdminRepository.getUserById(userId)
        if (!user) {
            throw new Error('Usuário não encontrado')
        }

        await AdminRepository.activateUser(userId)

        logger.info('✅ Usuário reativado', {
            userId,
            username: user.user,
            activatedBy
        })

        return true
    }

    /**
     * Listar departamentos
     */
    async listDepartments() {
        return await AdminRepository.listDepartments()
    }

    /**
     * Estatísticas de usuários
     */
    async getUserStats() {
        return await AdminRepository.getUserStats()
    }

    /**
     * Histórico de login
     */
    async getLoginHistory(userId, limit = 20) {
        return await AdminRepository.getLoginHistory(userId, limit)
    }

    /**
     * Vincular telefone a vendedor
     */
    async addSellerPhone(userId, phoneNumber, isPrimary, addedBy) {
        // Verificar se usuário existe
        const user = await AdminRepository.getUserById(userId)
        if (!user) {
            throw new Error('Usuário não encontrado')
        }

        await SuperbotRepository.addSellerPhone(userId, phoneNumber, isPrimary)

        logger.info('📞 Telefone vinculado a vendedor', {
            userId,
            phoneNumber,
            isPrimary,
            addedBy
        })

        return true
    }

    /**
     * Remover telefone de vendedor
     */
    async removeSellerPhone(userId, phoneNumber, removedBy) {
        await SuperbotRepository.removeSellerPhone(userId, phoneNumber)

        logger.info('📞 Telefone removido de vendedor', {
            userId,
            phoneNumber,
            removedBy
        })

        return true
    }

    /**
     * Listar todos os seller phones
     */
    async listSellerPhones() {
        return await SuperbotRepository.listSellerPhones()
    }

    /**
     * Dashboard stats
     */
    async getDashboardStats() {
        const userStats = await this.getUserStats()

        return {
            users: userStats
        }
    }
}

export default new AdminService()
