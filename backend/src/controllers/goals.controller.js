/**
 * Goals Controller
 * Sistema de Metas de Vendedores
 */
import { getDatabase } from '../config/database.js';
import Joi from 'joi';

const db = () => getDatabase();

// Schemas de validação
const createGoalSchema = Joi.object({
  sellerId: Joi.number().integer().required(),
  year: Joi.number().integer().min(2020).max(2100).required(),
  month: Joi.number().integer().min(1).max(12).allow(null),
  targetValue: Joi.number().min(0).required(),
  targetOrders: Joi.number().integer().min(0).allow(null),
  notes: Joi.string().max(255).allow(null, '')
});

const updateGoalSchema = Joi.object({
  targetValue: Joi.number().min(0),
  targetOrders: Joi.number().integer().min(0).allow(null),
  notes: Joi.string().max(255).allow(null, '')
});

/**
 * Verificar se é gerente
 */
function isManager(user) {
  return (user?.level || 0) > 4;
}

/**
 * Obter metas de um vendedor
 * GET /api/goals/seller/:sellerId
 */
export async function getSellerGoals(req, res, next) {
  try {
    const sellerId = parseInt(req.params.sellerId);
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Vendedores só podem ver suas próprias metas
    if (!isManager(req.user) && req.user.userId !== sellerId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Sem permissão para ver metas de outro vendedor' }
      });
    }

    const query = `
      SELECT 
        g.id,
        g.seller_id,
        g.year,
        g.month,
        g.target_value,
        g.target_orders,
        g.notes,
        g.created_at,
        g.updated_at,
        COALESCE(u.nick, u.user) as seller_name
      FROM staging.seller_goals g
      LEFT JOIN rolemak_users u ON g.seller_id = u.id
      WHERE g.seller_id = ? AND g.year = ?
      ORDER BY g.month ASC
    `;

    const [rows] = await db().execute(query, [sellerId, year]);

    const goals = rows.map(row => ({
      id: row.id,
      sellerId: row.seller_id,
      sellerName: row.seller_name,
      year: row.year,
      month: row.month,
      targetValue: parseFloat(row.target_value) || 0,
      targetOrders: row.target_orders,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      success: true,
      data: goals
    });
  } catch (error) {
    console.error('[getSellerGoals] Error:', error.message);
    next(error);
  }
}

/**
 * Obter minha meta atual (vendedor logado)
 * GET /api/goals/my-progress
 */
export async function getMyProgress(req, res, next) {
  try {
    const userId = req.user.userId;
    const userLevel = req.user?.level || 0;
    const now = new Date();
    const year = parseInt(req.query.year) || now.getFullYear();
    const month = parseInt(req.query.month) || now.getMonth() + 1;

    // Gerentes podem ver de outros
    let sellerId = userId;
    if (userLevel > 4 && req.query.sellerId) {
      sellerId = parseInt(req.query.sellerId);
    }

    // Buscar meta mensal e anual
    const goalsQuery = `
      SELECT 
        g.id,
        g.year,
        g.month,
        g.target_value,
        g.target_orders
      FROM staging.seller_goals g
      WHERE g.seller_id = ? 
        AND g.year = ?
        AND (g.month = ? OR g.month IS NULL)
    `;

    const [goalRows] = await db().execute(goalsQuery, [sellerId, year, month]);

    const monthlyGoal = goalRows.find(g => g.month === month);
    const annualGoal = goalRows.find(g => g.month === null);

    // Buscar vendas realizadas
    const salesQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN MONTH(h.data) = ? THEN h.valor ELSE 0 END), 0) as month_sales,
        COALESCE(COUNT(DISTINCT CASE WHEN MONTH(h.data) = ? THEN h.id ELSE NULL END), 0) as month_orders,
        COALESCE(SUM(h.valor), 0) as year_sales,
        COALESCE(COUNT(DISTINCT h.id), 0) as year_orders
      FROM mak.hoje h
      WHERE h.vendedor = ?
        AND YEAR(h.data) = ?
        AND h.valor > 0
        AND h.nop IN (27, 28, 51, 76)
    `;

    const [salesRows] = await db().execute(salesQuery, [month, month, sellerId, year]);
    const sales = salesRows[0] || {};

    const monthSales = parseFloat(sales.month_sales) || 0;
    const monthOrders = parseInt(sales.month_orders) || 0;
    const yearSales = parseFloat(sales.year_sales) || 0;
    const yearOrders = parseInt(sales.year_orders) || 0;

    const monthTarget = parseFloat(monthlyGoal?.target_value) || 0;
    const yearTarget = parseFloat(annualGoal?.target_value) || 0;

    res.json({
      success: true,
      data: {
        sellerId,
        year,
        month,
        monthly: {
          target: monthTarget,
          achieved: monthSales,
          progress: monthTarget > 0 ? Math.round((monthSales / monthTarget) * 100) : 0,
          remaining: Math.max(0, monthTarget - monthSales),
          ordersTarget: monthlyGoal?.target_orders || null,
          ordersAchieved: monthOrders
        },
        annual: {
          target: yearTarget,
          achieved: yearSales,
          progress: yearTarget > 0 ? Math.round((yearSales / yearTarget) * 100) : 0,
          remaining: Math.max(0, yearTarget - yearSales),
          ordersTarget: annualGoal?.target_orders || null,
          ordersAchieved: yearOrders
        }
      }
    });
  } catch (error) {
    console.error('[getMyProgress] Error:', error.message);
    next(error);
  }
}

/**
 * Criar meta (apenas gerentes)
 * POST /api/goals
 */
export async function createGoal(req, res, next) {
  try {
    if (!isManager(req.user)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Apenas gerentes podem criar metas' }
      });
    }

    const { error, value } = createGoalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.details[0].message }
      });
    }

    const query = `
      INSERT INTO staging.seller_goals 
        (seller_id, year, month, target_value, target_orders, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        target_value = VALUES(target_value),
        target_orders = VALUES(target_orders),
        notes = VALUES(notes),
        updated_at = CURRENT_TIMESTAMP
    `;

    const [result] = await db().execute(query, [
      value.sellerId,
      value.year,
      value.month || null,
      value.targetValue,
      value.targetOrders || null,
      value.notes || null,
      req.user.userId
    ]);

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId || result.affectedRows,
        ...value
      }
    });
  } catch (error) {
    console.error('[createGoal] Error:', error.message);
    next(error);
  }
}

/**
 * Atualizar meta (apenas gerentes)
 * PUT /api/goals/:id
 */
export async function updateGoal(req, res, next) {
  try {
    if (!isManager(req.user)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Apenas gerentes podem atualizar metas' }
      });
    }

    const id = parseInt(req.params.id);
    const { error, value } = updateGoalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.details[0].message }
      });
    }

    const updates = [];
    const params = [];

    if (value.targetValue !== undefined) {
      updates.push('target_value = ?');
      params.push(value.targetValue);
    }
    if (value.targetOrders !== undefined) {
      updates.push('target_orders = ?');
      params.push(value.targetOrders);
    }
    if (value.notes !== undefined) {
      updates.push('notes = ?');
      params.push(value.notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Nenhum campo para atualizar' }
      });
    }

    params.push(id);
    await db().execute(
      `UPDATE staging.seller_goals SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      data: { id, ...value }
    });
  } catch (error) {
    console.error('[updateGoal] Error:', error.message);
    next(error);
  }
}

/**
 * Deletar meta (apenas gerentes)
 * DELETE /api/goals/:id
 */
export async function deleteGoal(req, res, next) {
  try {
    if (!isManager(req.user)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Apenas gerentes podem excluir metas' }
      });
    }

    const id = parseInt(req.params.id);
    await db().execute('DELETE FROM staging.seller_goals WHERE id = ?', [id]);

    res.json({
      success: true,
      data: { id }
    });
  } catch (error) {
    console.error('[deleteGoal] Error:', error.message);
    next(error);
  }
}

/**
 * Listar metas de todos os vendedores (apenas gerentes)
 * GET /api/goals
 */
export async function getAllGoals(req, res, next) {
  try {
    if (!isManager(req.user)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Apenas gerentes podem ver todas as metas' }
      });
    }

    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = req.query.month ? parseInt(req.query.month) : null;
    const segmento = req.query.segmento || null;

    let query = `
      SELECT 
        g.id,
        g.seller_id,
        g.year,
        g.month,
        g.target_value,
        g.target_orders,
        g.notes,
        COALESCE(u.nick, u.user) as seller_name,
        u.segmento
      FROM staging.seller_goals g
      LEFT JOIN rolemak_users u ON g.seller_id = u.id
      WHERE g.year = ?
    `;
    const params = [year];

    if (month !== null) {
      query += ` AND (g.month = ? OR g.month IS NULL)`;
      params.push(month);
    }

    if (segmento) {
      query += ` AND u.segmento = ?`;
      params.push(segmento);
    }

    query += ` ORDER BY u.nick, g.month`;

    const [rows] = await db().execute(query, params);

    const goals = rows.map(row => ({
      id: row.id,
      sellerId: row.seller_id,
      sellerName: row.seller_name,
      segmento: row.segmento,
      year: row.year,
      month: row.month,
      targetValue: parseFloat(row.target_value) || 0,
      targetOrders: row.target_orders,
      notes: row.notes
    }));

    res.json({
      success: true,
      data: goals
    });
  } catch (error) {
    console.error('[getAllGoals] Error:', error.message);
    next(error);
  }
}

/**
 * Resumo de progresso de todos os vendedores (apenas gerentes)
 * GET /api/goals/team-progress
 */
export async function getTeamProgress(req, res, next) {
  try {
    if (!isManager(req.user)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Apenas gerentes podem ver progresso da equipe' }
      });
    }

    const now = new Date();
    const year = parseInt(req.query.year) || now.getFullYear();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const segmento = req.query.segmento || null;

    let query = `
      SELECT 
        u.id as seller_id,
        COALESCE(u.nick, u.user) as seller_name,
        u.segmento,
        COALESCE(gm.target_value, 0) as month_target,
        COALESCE(ga.target_value, 0) as year_target,
        COALESCE(SUM(CASE WHEN MONTH(h.data) = ? THEN h.valor ELSE 0 END), 0) as month_sales,
        COALESCE(SUM(h.valor), 0) as year_sales
      FROM rolemak_users u
      LEFT JOIN staging.seller_goals gm ON u.id = gm.seller_id AND gm.year = ? AND gm.month = ?
      LEFT JOIN staging.seller_goals ga ON u.id = ga.seller_id AND ga.year = ? AND ga.month IS NULL
      LEFT JOIN mak.hoje h ON u.id = h.vendedor AND YEAR(h.data) = ? AND h.valor > 0 AND h.nop IN (27, 28, 51, 76)
      WHERE u.depto = 'VENDAS'
    `;
    const params = [month, year, month, year, year];

    if (segmento) {
      query += ` AND u.segmento = ?`;
      params.push(segmento);
    }

    query += ` GROUP BY u.id, u.nick, u.user, u.segmento, gm.target_value, ga.target_value`;
    query += ` ORDER BY month_sales DESC`;

    const [rows] = await db().execute(query, params);

    const team = rows.map(row => ({
      sellerId: row.seller_id,
      sellerName: row.seller_name,
      segmento: row.segmento,
      monthly: {
        target: parseFloat(row.month_target) || 0,
        achieved: parseFloat(row.month_sales) || 0,
        progress: row.month_target > 0 ? Math.round((row.month_sales / row.month_target) * 100) : 0
      },
      annual: {
        target: parseFloat(row.year_target) || 0,
        achieved: parseFloat(row.year_sales) || 0,
        progress: row.year_target > 0 ? Math.round((row.year_sales / row.year_target) * 100) : 0
      }
    }));

    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('[getTeamProgress] Error:', error.message);
    next(error);
  }
}
