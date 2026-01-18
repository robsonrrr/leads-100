/**
 * Admin Repository
 * 
 * Queries para o painel administrativo
 * 
 * @version 1.0
 * @date 2026-01-18
 */

import { getDatabase } from '../config/database.js'
import logger from '../config/logger.js'

class AdminRepository {
    /**
     * Listar todos os usuários com paginação e filtros
     */
    async listUsers({ page = 1, limit = 20, level, depto, active, search, orderBy = 'nick', orderDir = 'ASC' }) {
        const connection = getDatabase()
        const offset = (page - 1) * limit

        let whereClause = 'WHERE 1=1'
        const params = []

        if (level !== undefined && level !== null && level !== '') {
            whereClause += ' AND u.level = ?'
            params.push(parseInt(level))
        }

        if (depto) {
            whereClause += ' AND u.depto = ?'
            params.push(depto)
        }

        if (active !== undefined && active !== null && active !== '') {
            // active=true significa blocked=0 (não bloqueado)
            // active=false significa blocked=1 (bloqueado)
            whereClause += ' AND u.blocked = ?'
            params.push(active === 'true' || active === true ? 0 : 1)
        }

        if (search) {
            whereClause += ' AND (u.nick LIKE ? OR u.user LIKE ? OR u.email LIKE ?)'
            const searchTerm = `%${search}%`
            params.push(searchTerm, searchTerm, searchTerm)
        }

        // Validar orderBy para evitar SQL injection
        const validColumns = ['id', 'nick', 'user', 'email', 'nivel', 'depto', 'ativo', 'created_at', 'last_login']
        const safeOrderBy = validColumns.includes(orderBy) ? orderBy : 'nick'
        const safeOrderDir = orderDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

        // Query principal
        const query = `
            SELECT 
                u.id,
                u.user,
                u.nick,
                u.email,
                u.level as level,
                u.depto,
                u.segmento,
                CASE WHEN u.blocked = 0 THEN 1 ELSE 0 END as active,
                u.created_at,
                u.last_login,
                (SELECT COUNT(*) FROM staging.staging_queries l WHERE l.cSeller = u.id) as leads_count,
                (SELECT GROUP_CONCAT(sp.phone_number) 
                 FROM superbot.seller_phones sp 
                 WHERE sp.user_id = u.id) as phones
            FROM mak.rolemak_users u
            ${whereClause}
            ORDER BY u.${safeOrderBy} ${safeOrderDir}
            LIMIT ? OFFSET ?
        `

        params.push(limit, offset)

        const [users] = await connection.execute(query, params)

        // Query de contagem total
        const countQuery = `
            SELECT COUNT(*) as total
            FROM mak.rolemak_users u
            ${whereClause}
        `

        const [countResult] = await connection.execute(countQuery, params.slice(0, -2))
        const total = countResult[0]?.total || 0

        return {
            users: users.map(u => ({
                ...u,
                phones: u.phones ? u.phones.split(',') : []
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    }

    /**
     * Buscar usuário por ID
     */
    async getUserById(userId) {
        const connection = getDatabase()

        const [users] = await connection.execute(`
            SELECT 
                u.id,
                u.user,
                u.nick,
                u.email,
                u.level as level,
                u.depto,
                u.segmento,
                CASE WHEN u.blocked = 0 THEN 1 ELSE 0 END as active,
                u.created_at,
                u.last_login
            FROM mak.rolemak_users u
            WHERE u.id = ?
        `, [userId])

        if (users.length === 0) return null

        // Buscar telefones vinculados
        const [phones] = await connection.execute(`
            SELECT phone_number, is_primary, created_at
            FROM superbot.seller_phones
            WHERE user_id = ?
            ORDER BY is_primary DESC, created_at ASC
        `, [userId])

        return {
            ...users[0],
            phones
        }
    }

    /**
     * Criar novo usuário
     */
    async createUser({ user, nick, email, password, level, depto, segmento }) {
        const connection = getDatabase()

        const [result] = await connection.execute(`
            INSERT INTO mak.rolemak_users (user, nick, email, newpassword, level, depto, segmento, blocked)
            VALUES (?, ?, ?, MD5(?), ?, ?, ?, 0)
        `, [user, nick, email, password, level, depto || null, segmento || null])

        return result.insertId
    }

    /**
     * Atualizar usuário
     */
    async updateUser(userId, { nick, email, level, depto, segmento, active }) {
        const connection = getDatabase()

        const updates = []
        const params = []

        if (nick !== undefined) {
            updates.push('nick = ?')
            params.push(nick)
        }

        if (email !== undefined) {
            updates.push('email = ?')
            params.push(email)
        }

        if (level !== undefined) {
            updates.push('level = ?')
            params.push(level)
        }

        if (depto !== undefined) {
            updates.push('depto = ?')
            params.push(depto)
        }

        if (segmento !== undefined) {
            updates.push('segmento = ?')
            params.push(segmento)
        }

        if (active !== undefined) {
            updates.push('blocked = ?')
            params.push(active ? 0 : 1)  // active=true -> blocked=0
        }

        if (updates.length === 0) {
            return false
        }

        params.push(userId)

        await connection.execute(`
            UPDATE mak.rolemak_users
            SET ${updates.join(', ')}
            WHERE id = ?
        `, params)

        return true
    }

    /**
     * Alterar senha do usuário
     */
    async updatePassword(userId, newPassword) {
        const connection = getDatabase()

        await connection.execute(`
            UPDATE mak.rolemak_users
            SET newpassword = MD5(?)
            WHERE id = ?
        `, [newPassword, userId])

        return true
    }

    /**
     * Desativar usuário
     */
    async deactivateUser(userId) {
        const connection = getDatabase()

        await connection.execute(`
            UPDATE mak.rolemak_users
            SET blocked = 1
            WHERE id = ?
        `, [userId])

        return true
    }

    /**
     * Reativar usuário
     */
    async activateUser(userId) {
        const connection = getDatabase()

        await connection.execute(`
            UPDATE mak.rolemak_users
            SET blocked = 0
            WHERE id = ?
        `, [userId])

        return true
    }

    /**
     * Verificar se username já existe
     */
    async usernameExists(username, excludeUserId = null) {
        const connection = getDatabase()

        let query = 'SELECT COUNT(*) as count FROM mak.rolemak_users WHERE user = ?'
        const params = [username]

        if (excludeUserId) {
            query += ' AND id != ?'
            params.push(excludeUserId)
        }

        const [result] = await connection.execute(query, params)
        return result[0].count > 0
    }

    /**
     * Verificar se email já existe
     */
    async emailExists(email, excludeUserId = null) {
        const connection = getDatabase()

        let query = 'SELECT COUNT(*) as count FROM mak.rolemak_users WHERE email = ?'
        const params = [email]

        if (excludeUserId) {
            query += ' AND id != ?'
            params.push(excludeUserId)
        }

        const [result] = await connection.execute(query, params)
        return result[0].count > 0
    }

    /**
     * Listar departamentos distintos
     */
    async listDepartments() {
        const connection = getDatabase()

        const [result] = await connection.execute(`
            SELECT DISTINCT depto
            FROM mak.rolemak_users
            WHERE depto IS NOT NULL AND depto != ''
            ORDER BY depto
        `)

        return result.map(r => r.depto)
    }

    /**
     * Estatísticas de usuários
     */
    async getUserStats() {
        const connection = getDatabase()

        const [stats] = await connection.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN blocked = 0 THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN blocked = 1 THEN 1 ELSE 0 END) as inactive,
                SUM(CASE WHEN level >= 5 THEN 1 ELSE 0 END) as admins,
                SUM(CASE WHEN level < 5 THEN 1 ELSE 0 END) as sellers,
                SUM(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as active_last_week
            FROM mak.rolemak_users
        `)

        return stats[0]
    }

    /**
     * Histórico de login do usuário
     */
    async getLoginHistory(userId, limit = 20) {
        const connection = getDatabase()

        // Se existir tabela de login_history, usar ela
        // Por enquanto, retornar apenas last_login
        const [users] = await connection.execute(`
            SELECT last_login
            FROM mak.rolemak_users
            WHERE id = ?
        `, [userId])

        return users.length > 0 ? [{ login_at: users[0].last_login }] : []
    }
}

export default new AdminRepository()
