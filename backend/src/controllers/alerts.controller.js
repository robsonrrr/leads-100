/**
 * Alerts Controller
 * Endpoints para sistema de alertas do CRM
 */
import { getDatabase } from '../config/database.js';

const db = () => getDatabase();

/**
 * Obtém alertas do vendedor
 * GET /api/alerts/my-alerts
 */
export async function getMyAlerts(req, res, next) {
  try {
    const userLevel = req.user?.level || 0;
    const isManager = userLevel > 4;
    let sellerId = req.user.userId;
    let sellerSegmento = null;

    // Gerentes podem filtrar por vendedor ou segmento
    if (isManager) {
      if (req.query.sellerId) {
        sellerId = parseInt(req.query.sellerId);
      } else if (req.query.sellerSegmento) {
        sellerSegmento = req.query.sellerSegmento;
        sellerId = null;
      }
    }

    // Buscar alertas em paralelo
    const [inactiveCustomers, pendingLeads, atRiskCustomers] = await Promise.all([
      getInactiveCustomersAlert(sellerId, sellerSegmento),
      getPendingLeadsAlert(sellerId, sellerSegmento),
      getAtRiskCustomersAlert(sellerId, sellerSegmento)
    ]);

    const alerts = [];

    // Alerta de clientes inativos
    if (inactiveCustomers.count > 0) {
      alerts.push({
        id: 'inactive-customers',
        type: 'danger',
        icon: '🔴',
        title: `${inactiveCustomers.count} clientes inativos`,
        description: 'Sem compra há mais de 60 dias',
        count: inactiveCustomers.count,
        action: '/customers?status=inactive'
      });
    }

    // Alerta de clientes em risco
    if (atRiskCustomers.count > 0) {
      alerts.push({
        id: 'at-risk-customers',
        type: 'warning',
        icon: '🟡',
        title: `${atRiskCustomers.count} clientes em risco`,
        description: 'Sem compra há 30-60 dias',
        count: atRiskCustomers.count,
        action: '/customers?status=at_risk'
      });
    }

    // Alerta de cotações pendentes
    if (pendingLeads.count > 0) {
      alerts.push({
        id: 'pending-leads',
        type: 'warning',
        icon: '📝',
        title: `${pendingLeads.count} cotações pendentes`,
        description: 'Abertas há mais de 7 dias',
        count: pendingLeads.count,
        action: '/'
      });
    }

    res.json({
      success: true,
      data: {
        alerts,
        summary: {
          total: alerts.length,
          danger: alerts.filter(a => a.type === 'danger').length,
          warning: alerts.filter(a => a.type === 'warning').length
        }
      }
    });
  } catch (error) {
    console.error('[getMyAlerts] Error:', error.message, error.stack);
    next(error);
  }
}

/**
 * Obtém clientes em risco (para widget)
 * GET /api/alerts/at-risk-customers
 */
export async function getAtRiskCustomersList(req, res, next) {
  try {
    const userLevel = req.user?.level || 0;
    const isManager = userLevel > 4;
    let sellerId = req.user.userId;
    let sellerSegmento = null;
    const limit = parseInt(req.query.limit) || 5;

    // Gerentes podem filtrar
    if (isManager) {
      if (req.query.sellerId) {
        sellerId = parseInt(req.query.sellerId);
      } else if (req.query.sellerSegmento) {
        sellerSegmento = req.query.sellerSegmento;
        sellerId = null;
      }
    }

    let query = `
      SELECT 
        c.id,
        c.nome as name,
        c.fantasia as trade_name,
        c.cidade as city,
        c.estado as state,
        c.ddd,
        c.fone,
        c.email,
        COALESCE(u.nick, u.user) as seller_name,
        (
          SELECT MAX(h.data) 
          FROM mak.hoje h 
          WHERE h.idcli = c.id AND h.valor > 0 AND h.nop IN (27, 28, 51, 76)
        ) as last_order_date,
        (
          SELECT h.valor 
          FROM mak.hoje h 
          WHERE h.idcli = c.id AND h.valor > 0 AND h.nop IN (27, 28, 51, 76)
          ORDER BY h.data DESC 
          LIMIT 1
        ) as last_order_value,
        DATEDIFF(CURDATE(), (
          SELECT MAX(h.data) 
          FROM mak.hoje h 
          WHERE h.idcli = c.id AND h.valor > 0 AND h.nop IN (27, 28, 51, 76)
        )) as days_since_order
      FROM clientes c
      LEFT JOIN rolemak_users u ON c.vendedor = u.id
      WHERE 1=1
    `;
    const params = [];

    // Para usuários comuns (sellerId definido), garantir que os subselects de pedidos
    // considerem apenas pedidos emitidos por este vendedor.
    if (sellerId) {
      query = query
        .replace(/WHERE h\.idcli = c\.id AND h\.valor > 0 AND h\.nop IN \(27, 28, 51, 76\)/g,
          'WHERE h.idcli = c.id AND h.valor > 0 AND h.nop IN (27, 28, 51, 76) AND h.vendedor = ?');
    }

    if (sellerId) {
      query += ` AND c.vendedor = ?`;
      params.push(sellerId);
    } else if (sellerSegmento) {
      query += ` AND c.vendedor IN (
        SELECT id FROM rolemak_users 
        WHERE depto = 'VENDAS' AND segmento = ?
      )`;
      params.push(sellerSegmento);
    }

    // Filtrar clientes em risco (30-90 dias sem compra)
    query += `
      AND (
        SELECT MAX(h.data) FROM mak.hoje h 
        WHERE h.idcli = c.id AND h.valor > 0 AND h.nop IN (27, 28, 51, 76)
      ) BETWEEN DATE_SUB(CURDATE(), INTERVAL 90 DAY) AND DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `;

    if (sellerId) {
      query = query.replace(
        /SELECT MAX\(h\.data\) FROM mak\.hoje h \n\s*WHERE h\.idcli = c\.id AND h\.valor > 0 AND h\.nop IN \(27, 28, 51, 76\)/,
        'SELECT MAX(h.data) FROM mak.hoje h \n        WHERE h.idcli = c.id AND h.valor > 0 AND h.nop IN (27, 28, 51, 76) AND h.vendedor = ?'
      );
    }

    query += ` ORDER BY days_since_order DESC LIMIT ${limit}`;

    // Se sellerId está definido, os subselects adicionaram 4 parâmetros vendedor
    // (last_order_date, last_order_value, days_since_order, risk filter)
    const finalParams = sellerId ? [sellerId, sellerId, sellerId, ...params, sellerId] : params;
    const [rows] = await db().execute(query, finalParams);

    const customers = rows.map(row => ({
      id: row.id,
      name: row.name,
      tradeName: row.trade_name,
      city: row.city,
      state: row.state,
      phone: row.ddd && row.fone ? `(${row.ddd}) ${row.fone}` : row.fone || '',
      email: row.email,
      sellerName: row.seller_name,
      lastOrderDate: row.last_order_date,
      lastOrderValue: parseFloat(row.last_order_value) || 0,
      daysSinceOrder: parseInt(row.days_since_order) || 0
    }));

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('[getAtRiskCustomersList] Error:', error.message, error.stack);
    next(error);
  }
}

/**
 * Obtém cotações pendentes (mais de 7 dias)
 * GET /api/alerts/pending-leads
 */
export async function getPendingLeadsList(req, res, next) {
  try {
    const userLevel = req.user?.level || 0;
    const isManager = userLevel > 4;
    let sellerId = req.user.userId;
    let sellerSegmento = null;
    const limit = parseInt(req.query.limit) || 5;

    // Gerentes podem filtrar
    if (isManager) {
      if (req.query.sellerId) {
        sellerId = parseInt(req.query.sellerId);
      } else if (req.query.sellerSegmento) {
        sellerSegmento = req.query.sellerSegmento;
        sellerId = null;
      }
    }

    let query = `
      SELECT 
        s.cCart as id,
        s.dCart as created_at,
        s.cTotal as total_value,
        c.id as customer_id,
        c.nome as customer_name,
        c.fantasia as customer_trade_name,
        COALESCE(u.nick, u.user) as seller_name,
        DATEDIFF(CURDATE(), s.dCart) as days_pending
      FROM mak.sCart s
      LEFT JOIN clientes c ON s.cCustomer = c.id
      LEFT JOIN rolemak_users u ON s.cSeller = u.id
      WHERE s.cType = 1
        AND s.dCart < DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    `;
    const params = [];

    if (sellerId) {
      query += ` AND (s.cUser = ? OR s.cSeller = ?)`;
      params.push(sellerId, sellerId);
    } else if (sellerSegmento) {
      query += ` AND s.cSeller IN (
        SELECT id FROM rolemak_users 
        WHERE depto = 'VENDAS' AND segmento = ?
      )`;
      params.push(sellerSegmento);
    }

    query += ` ORDER BY s.dCart ASC LIMIT ${limit}`;

    const [rows] = await db().execute(query, params);

    const leads = rows.map(row => ({
      id: row.id,
      createdAt: row.created_at,
      totalValue: parseFloat(row.total_value) || 0,
      customerId: row.customer_id,
      customerName: row.customer_name || row.customer_trade_name,
      sellerName: row.seller_name,
      daysPending: parseInt(row.days_pending) || 0
    }));

    res.json({
      success: true,
      data: leads
    });
  } catch (error) {
    console.error('[getPendingLeadsList] Error:', error.message, error.stack);
    next(error);
  }
}

// ================ Funções auxiliares ================

async function getInactiveCustomersAlert(sellerId, sellerSegmento) {
  let query = `
    SELECT COUNT(*) as count
    FROM clientes c
    WHERE 1=1
  `;
  const params = [];

  if (sellerId) {
    query += ` AND c.vendedor = ?`;
    params.push(sellerId);
  } else if (sellerSegmento) {
    query += ` AND c.vendedor IN (
      SELECT id FROM rolemak_users 
      WHERE depto = 'VENDAS' AND segmento = ?
    )`;
    params.push(sellerSegmento);
  }

  query += `
    AND (
      (SELECT MAX(h.data) FROM mak.hoje h WHERE h.idcli = c.id AND h.valor > 0 AND h.nop IN (27, 28, 51, 76)) < DATE_SUB(CURDATE(), INTERVAL 60 DAY)
      OR (SELECT MAX(h.data) FROM mak.hoje h WHERE h.idcli = c.id AND h.valor > 0 AND h.nop IN (27, 28, 51, 76)) IS NULL
    )
  `;

  const [rows] = await db().execute(query, params);
  return { count: parseInt(rows[0]?.count) || 0 };
}

async function getAtRiskCustomersAlert(sellerId, sellerSegmento) {
  let query = `
    SELECT COUNT(*) as count
    FROM clientes c
    WHERE 1=1
  `;
  const params = [];

  if (sellerId) {
    query += ` AND c.vendedor = ?`;
    params.push(sellerId);
  } else if (sellerSegmento) {
    query += ` AND c.vendedor IN (
      SELECT id FROM rolemak_users 
      WHERE depto = 'VENDAS' AND segmento = ?
    )`;
    params.push(sellerSegmento);
  }

  query += `
    AND (SELECT MAX(h.data) FROM mak.hoje h WHERE h.idcli = c.id AND h.valor > 0 AND h.nop IN (27, 28, 51, 76))
        BETWEEN DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND DATE_SUB(CURDATE(), INTERVAL 30 DAY)
  `;

  const [rows] = await db().execute(query, params);
  return { count: parseInt(rows[0]?.count) || 0 };
}

async function getPendingLeadsAlert(sellerId, sellerSegmento) {
  let query = `
    SELECT COUNT(*) as count
    FROM mak.sCart s
    WHERE s.cType = 1
      AND s.dCart < DATE_SUB(CURDATE(), INTERVAL 7 DAY)
  `;
  const params = [];

  if (sellerId) {
    query += ` AND (s.cUser = ? OR s.cSeller = ?)`;
    params.push(sellerId, sellerId);
  } else if (sellerSegmento) {
    query += ` AND s.cSeller IN (
      SELECT id FROM rolemak_users 
      WHERE depto = 'VENDAS' AND segmento = ?
    )`;
    params.push(sellerSegmento);
  }

  const [rows] = await db().execute(query, params);
  return { count: parseInt(rows[0]?.count) || 0 };
}
