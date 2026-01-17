/**
 * Interactions Controller
 * CRUD para interações com clientes
 */
import { getDatabase } from '../config/database.js';
import Joi from 'joi';

const db = () => getDatabase();

// Schema de validação
const createInteractionSchema = Joi.object({
  customerId: Joi.number().integer().required(),
  type: Joi.string().valid('call', 'visit', 'email', 'whatsapp', 'meeting', 'note').required(),
  description: Joi.string().max(2000).required(),
  nextActionDate: Joi.date().allow(null),
  nextActionDescription: Joi.string().max(255).allow(null, '')
});

const updateInteractionSchema = Joi.object({
  type: Joi.string().valid('call', 'visit', 'email', 'whatsapp', 'meeting', 'note'),
  description: Joi.string().max(2000),
  nextActionDate: Joi.date().allow(null),
  nextActionDescription: Joi.string().max(255).allow(null, '')
});

/**
 * Listar interações de um cliente
 * GET /api/interactions/customer/:customerId
 */
export async function getCustomerInteractions(req, res, next) {
  try {
    const customerId = parseInt(req.params.customerId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        i.id,
        i.customer_id,
        i.user_id,
        i.type,
        i.description,
        i.next_action_date,
        i.next_action_description,
        i.created_at,
        i.updated_at,
        COALESCE(u.nick, u.user) as user_name
      FROM staging.customer_interactions i
      LEFT JOIN rolemak_users u ON i.user_id = u.id
      WHERE i.customer_id = ?
      ORDER BY i.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM staging.customer_interactions 
      WHERE customer_id = ?
    `;

    const [[rows], [countResult]] = await Promise.all([
      db().execute(query, [customerId]),
      db().execute(countQuery, [customerId])
    ]);

    const total = countResult[0]?.total || 0;

    const interactions = rows.map(row => ({
      id: row.id,
      customerId: row.customer_id,
      userId: row.user_id,
      userName: row.user_name,
      type: row.type,
      description: row.description,
      nextActionDate: row.next_action_date,
      nextActionDescription: row.next_action_description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      success: true,
      data: interactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[getCustomerInteractions] Error:', error.message);
    next(error);
  }
}

/**
 * Criar nova interação
 * POST /api/interactions
 */
export async function createInteraction(req, res, next) {
  try {
    const { error, value } = createInteractionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.details[0].message }
      });
    }

    const userId = req.user.userId;

    const query = `
      INSERT INTO staging.customer_interactions 
        (customer_id, user_id, type, description, next_action_date, next_action_description)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db().execute(query, [
      value.customerId,
      userId,
      value.type,
      value.description,
      value.nextActionDate || null,
      value.nextActionDescription || null
    ]);

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        customerId: value.customerId,
        userId,
        type: value.type,
        description: value.description,
        nextActionDate: value.nextActionDate,
        nextActionDescription: value.nextActionDescription
      }
    });
  } catch (error) {
    console.error('[createInteraction] Error:', error.message);
    next(error);
  }
}

/**
 * Atualizar interação
 * PUT /api/interactions/:id
 */
export async function updateInteraction(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user.userId;

    const { error, value } = updateInteractionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.details[0].message }
      });
    }

    // Verificar se a interação pertence ao usuário
    const [existing] = await db().execute(
      'SELECT id, user_id FROM staging.customer_interactions WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Interação não encontrada' }
      });
    }

    // Apenas o criador ou gerentes podem editar
    const userLevel = req.user?.level || 0;
    if (existing[0].user_id !== userId && userLevel <= 4) {
      return res.status(403).json({
        success: false,
        error: { message: 'Sem permissão para editar esta interação' }
      });
    }

    // Construir query dinâmica
    const updates = [];
    const params = [];

    if (value.type) {
      updates.push('type = ?');
      params.push(value.type);
    }
    if (value.description) {
      updates.push('description = ?');
      params.push(value.description);
    }
    if (value.nextActionDate !== undefined) {
      updates.push('next_action_date = ?');
      params.push(value.nextActionDate);
    }
    if (value.nextActionDescription !== undefined) {
      updates.push('next_action_description = ?');
      params.push(value.nextActionDescription);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Nenhum campo para atualizar' }
      });
    }

    params.push(id);
    await db().execute(
      `UPDATE staging.customer_interactions SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      data: { id, ...value }
    });
  } catch (error) {
    console.error('[updateInteraction] Error:', error.message);
    next(error);
  }
}

/**
 * Deletar interação
 * DELETE /api/interactions/:id
 */
export async function deleteInteraction(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user.userId;

    // Verificar se a interação pertence ao usuário
    const [existing] = await db().execute(
      'SELECT id, user_id FROM staging.customer_interactions WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Interação não encontrada' }
      });
    }

    // Apenas o criador ou gerentes podem deletar
    const userLevel = req.user?.level || 0;
    if (existing[0].user_id !== userId && userLevel <= 4) {
      return res.status(403).json({
        success: false,
        error: { message: 'Sem permissão para deletar esta interação' }
      });
    }

    await db().execute('DELETE FROM staging.customer_interactions WHERE id = ?', [id]);

    res.json({
      success: true,
      data: { id }
    });
  } catch (error) {
    console.error('[deleteInteraction] Error:', error.message);
    next(error);
  }
}

/**
 * Listar próximas ações (follow-ups) do vendedor
 * GET /api/interactions/follow-ups
 */
export async function getFollowUps(req, res, next) {
  try {
    const userLevel = req.user?.level || 0;
    const isManager = userLevel > 4;
    let userId = req.user.userId;

    // Gerentes podem ver de outros
    if (isManager && req.query.sellerId) {
      userId = parseInt(req.query.sellerId);
    }

    const query = `
      SELECT 
        i.id,
        i.customer_id,
        i.type,
        i.description,
        i.next_action_date,
        i.next_action_description,
        i.created_at,
        c.nome as customer_name,
        c.fantasia as customer_trade_name,
        COALESCE(u.nick, u.user) as user_name
      FROM staging.customer_interactions i
      LEFT JOIN clientes c ON i.customer_id = c.id
      LEFT JOIN rolemak_users u ON i.user_id = u.id
      WHERE i.user_id = ?
        AND i.next_action_date IS NOT NULL
        AND i.next_action_date >= CURDATE()
      ORDER BY i.next_action_date ASC
      LIMIT 10
    `;

    const [rows] = await db().execute(query, [userId]);

    const followUps = rows.map(row => ({
      id: row.id,
      customerId: row.customer_id,
      customerName: row.customer_trade_name || row.customer_name,
      type: row.type,
      description: row.description,
      nextActionDate: row.next_action_date,
      nextActionDescription: row.next_action_description,
      createdAt: row.created_at,
      userName: row.user_name
    }));

    res.json({
      success: true,
      data: followUps
    });
  } catch (error) {
    console.error('[getFollowUps] Error:', error.message);
    next(error);
  }
}

/**
 * Contar follow-ups pendentes para hoje
 * GET /api/interactions/follow-ups/count
 */
export async function getFollowUpsCount(req, res, next) {
  try {
    const userId = req.user.userId;

    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN next_action_date = CURDATE() THEN 1 ELSE 0 END) as today,
        SUM(CASE WHEN next_action_date < CURDATE() THEN 1 ELSE 0 END) as overdue
      FROM staging.customer_interactions
      WHERE user_id = ?
        AND next_action_date IS NOT NULL
        AND next_action_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    `;

    const [rows] = await db().execute(query, [userId]);
    const row = rows[0] || {};

    res.json({
      success: true,
      data: {
        total: parseInt(row.total) || 0,
        today: parseInt(row.today) || 0,
        overdue: parseInt(row.overdue) || 0
      }
    });
  } catch (error) {
    console.error('[getFollowUpsCount] Error:', error.message);
    next(error);
  }
}
