/**
 * Sync Routes - Endpoints para sincronização incremental
 * 
 * Permite que o frontend baixe apenas dados alterados desde a última sync
 */

import express from 'express'
import pool from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

/**
 * GET /api/sync/products
 * Retorna produtos alterados desde timestamp
 * 
 * Query params:
 * - since: ISO timestamp da última sync (opcional)
 * - limit: máximo de registros (default 1000)
 */
router.get('/products', authenticateToken, async (req, res) => {
    try {
        const { since, limit = 1000 } = req.query
        const maxLimit = Math.min(parseInt(limit) || 1000, 5000)

        let sql = `
      SELECT 
        p.id,
        p.modelo as model,
        p.marca as brand,
        p.nome as name,
        p.descricao as description,
        p.segmento as segment,
        p.categoria as category,
        p.ncm,
        p.preco_tabela as price,
        CONCAT('https://img.rolemak.com.br/id/h180/', p.id, '.jpg') as image_url,
        p.updated_at,
        CASE WHEN p.vip = 9 THEN 1 ELSE 0 END as is_deleted
      FROM inv p
      WHERE p.preco_tabela > 0
    `
        const params = []

        if (since) {
            sql += ' AND p.updated_at > ?'
            params.push(since)
        }

        sql += ' ORDER BY p.updated_at ASC LIMIT ?'
        params.push(maxLimit)

        const [rows] = await pool.execute(sql, params)

        // Pegar timestamp do último registro para cursor
        const lastTimestamp = rows.length > 0
            ? rows[rows.length - 1].updated_at
            : since || new Date().toISOString()

        res.json({
            success: true,
            data: rows,
            pagination: {
                count: rows.length,
                hasMore: rows.length === maxLimit,
                lastSync: lastTimestamp
            }
        })
    } catch (error) {
        console.error('Erro no sync de produtos:', error)
        res.status(500).json({
            success: false,
            error: { message: 'Erro ao buscar produtos para sync' }
        })
    }
})

/**
 * GET /api/sync/customers
 * Retorna clientes da carteira do vendedor alterados desde timestamp
 */
router.get('/customers', authenticateToken, async (req, res) => {
    try {
        const { since, limit = 500 } = req.query
        const sellerId = req.user.emitentePOID // ID do vendedor logado
        const maxLimit = Math.min(parseInt(limit) || 500, 2000)

        let sql = `
      SELECT 
        c.id,
        c.razao_social as name,
        c.fantasia as fantasy_name,
        c.cnpj,
        c.cidade as city,
        c.uf as state,
        c.telefone as phone,
        c.email,
        c.vendedor_id as seller_id,
        c.updated_at
      FROM clientes c
      WHERE c.vendedor_id = ?
    `
        const params = [sellerId]

        if (since) {
            sql += ' AND c.updated_at > ?'
            params.push(since)
        }

        sql += ' ORDER BY c.updated_at ASC LIMIT ?'
        params.push(maxLimit)

        const [rows] = await pool.execute(sql, params)

        const lastTimestamp = rows.length > 0
            ? rows[rows.length - 1].updated_at
            : since || new Date().toISOString()

        res.json({
            success: true,
            data: rows,
            pagination: {
                count: rows.length,
                hasMore: rows.length === maxLimit,
                lastSync: lastTimestamp
            }
        })
    } catch (error) {
        console.error('Erro no sync de clientes:', error)
        res.status(500).json({
            success: false,
            error: { message: 'Erro ao buscar clientes para sync' }
        })
    }
})

/**
 * GET /api/sync/segments
 * Retorna todos os segmentos
 */
router.get('/segments', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
      SELECT DISTINCT 
        segmento as id,
        segmento as name,
        LOWER(REPLACE(segmento, ' ', '-')) as seo
      FROM inv 
      WHERE segmento IS NOT NULL AND segmento != ''
      ORDER BY segmento
    `)

        res.json({
            success: true,
            data: rows
        })
    } catch (error) {
        console.error('Erro no sync de segmentos:', error)
        res.status(500).json({
            success: false,
            error: { message: 'Erro ao buscar segmentos' }
        })
    }
})

/**
 * GET /api/sync/categories
 * Retorna todas as categorias
 */
router.get('/categories', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
      SELECT DISTINCT 
        categoria as id,
        categoria as name,
        segmento as segment_id,
        LOWER(REPLACE(categoria, ' ', '-')) as seo
      FROM inv 
      WHERE categoria IS NOT NULL AND categoria != ''
      ORDER BY categoria
    `)

        res.json({
            success: true,
            data: rows
        })
    } catch (error) {
        console.error('Erro no sync de categorias:', error)
        res.status(500).json({
            success: false,
            error: { message: 'Erro ao buscar categorias' }
        })
    }
})

/**
 * GET /api/sync/status
 * Retorna status geral da sync (contagens)
 */
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const sellerId = req.user.emitentePOID

        const [[productsCount]] = await pool.execute(
            'SELECT COUNT(*) as count FROM inv WHERE preco_tabela > 0 AND vip != 9'
        )

        const [[customersCount]] = await pool.execute(
            'SELECT COUNT(*) as count FROM clientes WHERE vendedor_id = ?',
            [sellerId]
        )

        res.json({
            success: true,
            data: {
                products: productsCount.count,
                customers: customersCount.count,
                serverTime: new Date().toISOString()
            }
        })
    } catch (error) {
        console.error('Erro no status de sync:', error)
        res.status(500).json({
            success: false,
            error: { message: 'Erro ao buscar status' }
        })
    }
})

export default router
