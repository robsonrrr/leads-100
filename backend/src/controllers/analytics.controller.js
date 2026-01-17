/**
 * Analytics Controller
 * Métricas consolidadas para gerentes
 */
import { getDatabase } from '../config/database.js';

const db = () => getDatabase();

/**
 * Verificar se é gerente
 */
function isManager(user) {
  return (user?.level || 0) > 4;
}

export async function getDashboard(req, res, next) {
  try {
    if (!isManager(req.user)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Apenas gerentes podem acessar' }
      });
    }

    const now = new Date();
    const year = now.getFullYear();
    const prevYear = year - 1;

    const sellerId = req.query.sellerId ? parseInt(req.query.sellerId, 10) : null;
    const sellerSegmento = req.query.sellerSegmento || null;

    let vendorFilterSql = '';
    const vendorParams = [];

    if (sellerId) {
      vendorFilterSql = ' AND h.vendedor = ?';
      vendorParams.push(sellerId);
    } else if (sellerSegmento) {
      vendorFilterSql = ` AND h.vendedor IN (
        SELECT id FROM rolemak_users
        WHERE depto = 'VENDAS' AND segmento = ?
      )`;
      vendorParams.push(sellerSegmento);
    }

    const yearTotalsQuery = `
      SELECT
        COALESCE(SUM(h.valor), 0) as total_value,
        COUNT(DISTINCT h.id) as orders_count
      FROM mak.hoje h
      WHERE YEAR(h.data) = ?
        AND h.valor > 0
        AND h.nop IN (27, 28, 51, 76)
        ${vendorFilterSql}
    `;

    const salesByMonthQuery = `
      SELECT
        MONTH(h.data) as month,
        COALESCE(SUM(h.valor), 0) as total_value,
        COUNT(DISTINCT h.id) as orders_count
      FROM mak.hoje h
      WHERE YEAR(h.data) = ?
        AND h.valor > 0
        AND h.nop IN (27, 28, 51, 76)
        ${vendorFilterSql}
      GROUP BY MONTH(h.data)
      ORDER BY MONTH(h.data)
    `;

    const salesByDayQuery = `
      SELECT
        DAYOFWEEK(h.data) as day_num,
        COALESCE(SUM(h.valor), 0) as total_value,
        COUNT(DISTINCT h.id) as orders_count
      FROM mak.hoje h
      WHERE YEAR(h.data) = ?
        AND h.valor > 0
        AND h.nop IN (27, 28, 51, 76)
        ${vendorFilterSql}
      GROUP BY DAYOFWEEK(h.data)
      ORDER BY DAYOFWEEK(h.data)
    `;

    const [[currentYearRows], [previousYearRows], [byMonthRows], [byDayRows]] = await Promise.all([
      db().execute(yearTotalsQuery, [year, ...vendorParams]),
      db().execute(yearTotalsQuery, [prevYear, ...vendorParams]),
      db().execute(salesByMonthQuery, [year, ...vendorParams]),
      db().execute(salesByDayQuery, [year, ...vendorParams])
    ]);

    const currentTotals = currentYearRows[0] || {};
    const previousTotals = previousYearRows[0] || {};

    const currentTotalValue = parseFloat(currentTotals.total_value) || 0;
    const currentOrdersCount = parseInt(currentTotals.orders_count) || 0;
    const currentAvgTicket = currentOrdersCount > 0 ? currentTotalValue / currentOrdersCount : 0;

    const prevTotalValue = parseFloat(previousTotals.total_value) || 0;
    const prevOrdersCount = parseInt(previousTotals.orders_count) || 0;
    const prevAvgTicket = prevOrdersCount > 0 ? prevTotalValue / prevOrdersCount : 0;

    const variation = prevTotalValue > 0
      ? Math.round(((currentTotalValue - prevTotalValue) / prevTotalValue) * 100)
      : 0;

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const salesByMonth = (byMonthRows || []).map(r => ({
      month: monthNames[(parseInt(r.month) || 1) - 1],
      monthNum: parseInt(r.month) || 0,
      totalValue: parseFloat(r.total_value) || 0,
      ordersCount: parseInt(r.orders_count) || 0
    }));

    const dayNames = {
      1: 'Dom',
      2: 'Seg',
      3: 'Ter',
      4: 'Qua',
      5: 'Qui',
      6: 'Sex',
      7: 'Sáb'
    };

    const salesByDay = (byDayRows || []).map(r => ({
      day: dayNames[parseInt(r.day_num)] || String(r.day_num),
      dayNum: parseInt(r.day_num) || 0,
      totalValue: parseFloat(r.total_value) || 0,
      ordersCount: parseInt(r.orders_count) || 0
    }));

    res.json({
      success: true,
      data: {
        yearComparison: {
          current: {
            year,
            totalValue: currentTotalValue,
            ordersCount: currentOrdersCount,
            avgTicket: currentAvgTicket
          },
          previous: {
            year: prevYear,
            totalValue: prevTotalValue,
            ordersCount: prevOrdersCount,
            avgTicket: prevAvgTicket
          },
          variation
        },
        salesByMonth,
        salesByDay
      }
    });
  } catch (error) {
    console.error('[getDashboard] Error:', error.message);
    next(error);
  }
}

export async function getTopCustomers(req, res, next) {
  try {
    if (!isManager(req.user)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Apenas gerentes podem acessar' }
      });
    }

    const limit = req.query.limit ? Math.min(parseInt(req.query.limit, 10) || 5, 50) : 5;
    const period = (req.query.period || 'year').toLowerCase();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const sellerId = req.query.sellerId ? parseInt(req.query.sellerId, 10) : null;
    const sellerSegmento = req.query.sellerSegmento || null;

    let wherePeriodSql = 'YEAR(h.data) = ?';
    const params = [year];

    if (period === 'month') {
      wherePeriodSql = 'YEAR(h.data) = ? AND MONTH(h.data) = ?';
      params.push(month);
    }

    let vendorSql = '';
    if (sellerId) {
      vendorSql = ' AND h.vendedor = ?';
      params.push(sellerId);
    } else if (sellerSegmento) {
      vendorSql = ` AND h.vendedor IN (
        SELECT id FROM rolemak_users
        WHERE depto = 'VENDAS' AND segmento = ?
      )`;
      params.push(sellerSegmento);
    }

    const query = `
      SELECT
        c.id as id,
        COALESCE(c.fantasia, c.nome) as trade_name,
        c.nome as name,
        COALESCE(u.nick, u.user) as seller_name,
        COALESCE(SUM(h.valor), 0) as total_value,
        COUNT(DISTINCT h.id) as orders_count
      FROM mak.hoje h
      INNER JOIN mak.clientes c ON c.id = h.idcli
      LEFT JOIN rolemak_users u ON u.id = h.vendedor
      WHERE ${wherePeriodSql}
        AND h.valor > 0
        AND h.nop IN (27, 28, 51, 76)
        ${vendorSql}
      GROUP BY c.id, c.fantasia, c.nome, u.nick, u.user
      ORDER BY total_value DESC
      LIMIT ${limit}
    `;

    const [rows] = await db().execute(query, params);

    const data = (rows || []).map(r => ({
      id: r.id,
      tradeName: r.trade_name,
      name: r.name,
      sellerName: r.seller_name,
      totalValue: parseFloat(r.total_value) || 0,
      ordersCount: parseInt(r.orders_count) || 0
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('[getTopCustomers] Error:', error.message);
    next(error);
  }
}

export async function getAtRiskCustomers(req, res, next) {
  try {
    if (!isManager(req.user)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Apenas gerentes podem acessar' }
      });
    }

    const limit = req.query.limit ? Math.min(parseInt(req.query.limit, 10) || 20, 200) : 20;
    const days = req.query.days ? Math.max(parseInt(req.query.days, 10) || 60, 1) : 60;

    const sellerId = req.query.sellerId ? parseInt(req.query.sellerId, 10) : null;
    const sellerSegmento = req.query.sellerSegmento || null;

    let vendorSql = '';
    const params = [days];

    if (sellerId) {
      vendorSql = ' AND c.vendedor = ?';
      params.push(sellerId);
    } else if (sellerSegmento) {
      vendorSql = ` AND c.vendedor IN (
        SELECT id FROM rolemak_users
        WHERE depto = 'VENDAS' AND segmento = ?
      )`;
      params.push(sellerSegmento);
    }

    const query = `
      SELECT
        c.id as id,
        COALESCE(c.fantasia, c.nome) as trade_name,
        c.nome as name,
        COALESCE(u.nick, u.user) as seller_name,
        lo.last_order as last_order
      FROM mak.clientes c
      LEFT JOIN rolemak_users u ON u.id = c.vendedor
      LEFT JOIN (
        SELECT
          h.idcli,
          h.vendedor,
          MAX(h.data) as last_order
        FROM mak.hoje h
        WHERE h.valor > 0
          AND h.nop IN (27, 28, 51, 76)
        GROUP BY h.idcli, h.vendedor
      ) lo ON lo.idcli = c.id AND lo.vendedor = c.vendedor
      WHERE lo.last_order IS NOT NULL
        AND lo.last_order < DATE_SUB(CURDATE(), INTERVAL ? DAY)
        ${vendorSql}
      ORDER BY lo.last_order ASC
      LIMIT ${limit}
    `;

    const [rows] = await db().execute(query, params);

    const data = (rows || []).map(r => ({
      id: r.id,
      tradeName: r.trade_name,
      name: r.name,
      sellerName: r.seller_name,
      lastOrder: r.last_order
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('[getAtRiskCustomers] Error:', error.message);
    next(error);
  }
}

export async function getSalesByPeriod(req, res, next) {
  try {
    if (!isManager(req.user)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Apenas gerentes podem acessar' }
      });
    }

    const period = (req.query.period || 'month').toLowerCase();
    const now = new Date();
    const year = now.getFullYear();

    const sellerId = req.query.sellerId ? parseInt(req.query.sellerId, 10) : null;
    const sellerSegmento = req.query.sellerSegmento || null;

    let vendorSql = '';
    const params = [year];

    if (sellerId) {
      vendorSql = ' AND h.vendedor = ?';
      params.push(sellerId);
    } else if (sellerSegmento) {
      vendorSql = ` AND h.vendedor IN (
        SELECT id FROM rolemak_users
        WHERE depto = 'VENDAS' AND segmento = ?
      )`;
      params.push(sellerSegmento);
    }

    if (period === 'day') {
      const query = `
        SELECT
          DATE(h.data) as period,
          COALESCE(SUM(h.valor), 0) as total_value,
          COUNT(DISTINCT h.id) as orders_count
        FROM mak.hoje h
        WHERE YEAR(h.data) = ?
          AND h.valor > 0
          AND h.nop IN (27, 28, 51, 76)
          ${vendorSql}
        GROUP BY DATE(h.data)
        ORDER BY DATE(h.data)
      `;

      const [rows] = await db().execute(query, params);
      const data = (rows || []).map(r => ({
        period: r.period,
        totalValue: parseFloat(r.total_value) || 0,
        ordersCount: parseInt(r.orders_count) || 0
      }));
      return res.json({ success: true, data });
    }

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const query = `
      SELECT
        MONTH(h.data) as month,
        COALESCE(SUM(h.valor), 0) as total_value,
        COUNT(DISTINCT h.id) as orders_count
      FROM mak.hoje h
      WHERE YEAR(h.data) = ?
        AND h.valor > 0
        AND h.nop IN (27, 28, 51, 76)
        ${vendorSql}
      GROUP BY MONTH(h.data)
      ORDER BY MONTH(h.data)
    `;

    const [rows] = await db().execute(query, params);
    const data = (rows || []).map(r => ({
      period: monthNames[(parseInt(r.month) || 1) - 1],
      month: parseInt(r.month) || 0,
      totalValue: parseFloat(r.total_value) || 0,
      ordersCount: parseInt(r.orders_count) || 0
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('[getSalesByPeriod] Error:', error.message);
    next(error);
  }
}

export async function getSellerSummary(req, res, next) {
  try {
    const userLevel = req.user?.level || 0;
    const manager = userLevel > 4;

    // Para usuário comum, sempre restringir ao próprio usuário
    let sellerId = req.user?.userId;
    let sellerSegmento = null;

    if (manager) {
      if (req.query.sellerId) {
        sellerId = parseInt(req.query.sellerId);
      } else if (req.query.sellerSegmento) {
        sellerSegmento = req.query.sellerSegmento;
        sellerId = null;
      }
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    // Leads: abertos (cType=1), convertidos (cType=2)
    let leadsQuery = `
      SELECT
        SUM(CASE WHEN s.cType = 1 THEN 1 ELSE 0 END) as open_leads,
        SUM(CASE WHEN s.cType = 2 THEN 1 ELSE 0 END) as converted_leads,
        COUNT(*) as total_leads
      FROM staging.staging_queries s
      WHERE 1=1
    `;
    const leadsParams = [];

    if (sellerId) {
      leadsQuery += ` AND s.cSeller = ?`;
      leadsParams.push(sellerId);
    } else if (sellerSegmento) {
      leadsQuery += ` AND s.cSeller IN (
        SELECT id FROM rolemak_users
        WHERE depto = 'VENDAS' AND segmento = ?
      )`;
      leadsParams.push(sellerSegmento);
    }

    // Pedidos do mês
    let monthOrdersQuery = `
      SELECT
        COALESCE(SUM(h.valor), 0) as total_value,
        COUNT(DISTINCT h.id) as orders_count
      FROM mak.hoje h
      WHERE YEAR(h.data) = ? AND MONTH(h.data) = ?
        AND h.valor > 0
        AND h.nop IN (27, 28, 51, 76)
    `;
    const monthOrdersParams = [year, month];

    if (sellerId) {
      monthOrdersQuery += ` AND h.vendedor = ?`;
      monthOrdersParams.push(sellerId);
    } else if (sellerSegmento) {
      monthOrdersQuery += ` AND h.vendedor IN (
        SELECT id FROM rolemak_users
        WHERE depto = 'VENDAS' AND segmento = ?
      )`;
      monthOrdersParams.push(sellerSegmento);
    }

    // Pedidos do mês anterior (para variação)
    let prevOrdersQuery = `
      SELECT
        COALESCE(SUM(h.valor), 0) as total_value
      FROM mak.hoje h
      WHERE YEAR(h.data) = ? AND MONTH(h.data) = ?
        AND h.valor > 0
        AND h.nop IN (27, 28, 51, 76)
    `;
    const prevOrdersParams = [prevYear, prevMonth];

    if (sellerId) {
      prevOrdersQuery += ` AND h.vendedor = ?`;
      prevOrdersParams.push(sellerId);
    } else if (sellerSegmento) {
      prevOrdersQuery += ` AND h.vendedor IN (
        SELECT id FROM rolemak_users
        WHERE depto = 'VENDAS' AND segmento = ?
      )`;
      prevOrdersParams.push(sellerSegmento);
    }

    // Clientes ativos e em risco
    // Não depende de c.ultimo_pedido (nem sempre existe). Calcula último pedido via mak.hoje.
    let customersQuery = `
      SELECT
        COUNT(DISTINCT c.id) as active_count,
        SUM(
          CASE
            WHEN lo.last_order IS NOT NULL
              AND lo.last_order < DATE_SUB(CURDATE(), INTERVAL 60 DAY)
            THEN 1
            ELSE 0
          END
        ) as at_risk_count
      FROM clientes c
      LEFT JOIN (
        SELECT
          h.idcli,
          h.vendedor,
          MAX(h.data) as last_order
        FROM mak.hoje h
        WHERE h.valor > 0
          AND h.nop IN (27, 28, 51, 76)
        GROUP BY h.idcli, h.vendedor
      ) lo ON lo.idcli = c.id AND lo.vendedor = c.vendedor
      WHERE 1=1
    `;
    const customersParams = [];

    if (sellerId) {
      customersQuery += ` AND c.vendedor = ?`;
      customersParams.push(sellerId);
    } else if (sellerSegmento) {
      customersQuery += ` AND c.vendedor IN (
        SELECT id FROM rolemak_users
        WHERE depto = 'VENDAS' AND segmento = ?
      )`;
      customersParams.push(sellerSegmento);
    }

    const [[leadsRows], [monthOrdersRows], [prevOrdersRows], [customersRows]] = await Promise.all([
      db().execute(leadsQuery, leadsParams),
      db().execute(monthOrdersQuery, monthOrdersParams),
      db().execute(prevOrdersQuery, prevOrdersParams),
      db().execute(customersQuery, customersParams)
    ]);

    const leads = leadsRows[0] || {};
    const monthOrders = monthOrdersRows[0] || {};
    const prevOrders = prevOrdersRows[0] || {};
    const customers = customersRows[0] || {};

    const openLeads = parseInt(leads.open_leads) || 0;
    const convertedLeads = parseInt(leads.converted_leads) || 0;
    const totalLeads = parseInt(leads.total_leads) || 0;
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    const monthTotal = parseFloat(monthOrders.total_value) || 0;
    const monthOrdersCount = parseInt(monthOrders.orders_count) || 0;
    const prevTotal = parseFloat(prevOrders.total_value) || 0;
    const variation = prevTotal > 0 ? Math.round(((monthTotal - prevTotal) / prevTotal) * 100) : 0;

    res.json({
      success: true,
      data: {
        leads: {
          open: openLeads,
          converted: convertedLeads,
          total: totalLeads,
          conversionRate
        },
        orders: {
          month: {
            totalValue: monthTotal,
            ordersCount: monthOrdersCount,
            variation
          }
        },
        customers: {
          activeCount: parseInt(customers.active_count) || 0,
          atRiskCount: parseInt(customers.at_risk_count) || 0
        }
      }
    });
  } catch (error) {
    console.error('[getSellerSummary] Error:', error.message);
    next(error);
  }
}

/**
 * Métricas consolidadas da equipe (apenas gerentes)
 * GET /api/analytics/team-metrics
 */
export async function getTeamMetrics(req, res, next) {
  try {
    if (!isManager(req.user)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Apenas gerentes podem acessar' }
      });
    }

    const segmento = req.query.segmento || null;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Vendas do mês atual
    let salesQuery = `
      SELECT 
        COALESCE(SUM(h.valor), 0) as total_sales,
        COUNT(DISTINCT h.id) as total_orders,
        COUNT(DISTINCT h.idcli) as unique_customers
      FROM mak.hoje h
      INNER JOIN rolemak_users u ON h.vendedor = u.id
      WHERE YEAR(h.data) = ? AND MONTH(h.data) = ?
        AND h.valor > 0
        AND h.nop IN (27, 28, 51, 76)
        AND u.depto = 'VENDAS'
    `;
    const salesParams = [year, month];

    if (segmento) {
      salesQuery += ` AND u.segmento = ?`;
      salesParams.push(segmento);
    }

    const [salesRows] = await db().execute(salesQuery, salesParams);
    const salesData = salesRows[0] || {};

    // Vendas do mês anterior (para comparação)
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    let prevSalesQuery = `
      SELECT COALESCE(SUM(h.valor), 0) as total_sales
      FROM mak.hoje h
      INNER JOIN rolemak_users u ON h.vendedor = u.id
      WHERE YEAR(h.data) = ? AND MONTH(h.data) = ?
        AND h.valor > 0
        AND h.nop IN (27, 28, 51, 76)
        AND u.depto = 'VENDAS'
    `;
    const prevSalesParams = [prevYear, prevMonth];

    if (segmento) {
      prevSalesQuery += ` AND u.segmento = ?`;
      prevSalesParams.push(segmento);
    }

    const [prevSalesRows] = await db().execute(prevSalesQuery, prevSalesParams);
    const prevSales = parseFloat(prevSalesRows[0]?.total_sales) || 0;

    // Leads abertos
    let leadsQuery = `
      SELECT 
        COUNT(*) as open_leads,
        COALESCE(SUM(total_value), 0) as leads_value
      FROM staging.staging_queries l
      INNER JOIN rolemak_users u ON l.cSeller = u.id
      WHERE l.cType = 1
        AND u.depto = 'VENDAS'
    `;
    const leadsParams = [];

    if (segmento) {
      leadsQuery += ` AND u.segmento = ?`;
      leadsParams.push(segmento);
    }

    const [leadsRows] = await db().execute(leadsQuery, leadsParams);
    const leadsData = leadsRows[0] || {};

    // Vendedores ativos
    let sellersQuery = `
      SELECT COUNT(DISTINCT u.id) as active_sellers
      FROM rolemak_users u
      WHERE u.depto = 'VENDAS'
        AND u.blocked = 0
    `;
    const sellersParams = [];

    if (segmento) {
      sellersQuery += ` AND u.segmento = ?`;
      sellersParams.push(segmento);
    }

    const [sellersRows] = await db().execute(sellersQuery, sellersParams);

    // Clientes em risco (sem pedido há mais de 60 dias)
    // Não depende de c.ultimo_pedido (nem sempre existe). Calcula último pedido via mak.hoje.
    let riskQuery = `
      SELECT
        COUNT(DISTINCT c.id) as at_risk_customers
      FROM mak.clientes c
      INNER JOIN rolemak_users u ON c.vendedor = u.id
      LEFT JOIN (
        SELECT
          h.idcli,
          h.vendedor,
          MAX(h.data) as last_order
        FROM mak.hoje h
        WHERE h.valor > 0
          AND h.nop IN (27, 28, 51, 76)
        GROUP BY h.idcli, h.vendedor
      ) lo ON lo.idcli = c.id AND lo.vendedor = c.vendedor
      WHERE lo.last_order IS NOT NULL
        AND lo.last_order < DATE_SUB(CURDATE(), INTERVAL 60 DAY)
        AND u.depto = 'VENDAS'
    `;
    const riskParams = [];

    if (segmento) {
      riskQuery += ` AND u.segmento = ?`;
      riskParams.push(segmento);
    }

    const [riskRows] = await db().execute(riskQuery, riskParams);

    // Calcular variação
    const currentSales = parseFloat(salesData.total_sales) || 0;
    const salesChange = prevSales > 0
      ? Math.round(((currentSales - prevSales) / prevSales) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        period: { year, month },
        sales: {
          total: currentSales,
          orders: parseInt(salesData.total_orders) || 0,
          uniqueCustomers: parseInt(salesData.unique_customers) || 0,
          change: salesChange
        },
        leads: {
          open: parseInt(leadsData.open_leads) || 0,
          value: parseFloat(leadsData.leads_value) || 0
        },
        team: {
          activeSellers: parseInt(sellersRows[0]?.active_sellers) || 0,
          atRiskCustomers: parseInt(riskRows[0]?.at_risk_customers) || 0
        }
      }
    });
  } catch (error) {
    console.error('[getTeamMetrics] Error:', error.message);
    next(error);
  }
}

/**
 * Performance por vendedor (apenas gerentes)
 * GET /api/analytics/seller-performance
 */
export async function getSellerPerformance(req, res, next) {
  try {
    if (!isManager(req.user)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Apenas gerentes podem acessar' }
      });
    }

    const segmento = req.query.segmento || null;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    let query = `
      SELECT 
        u.id as seller_id,
        COALESCE(u.nick, u.user) as seller_name,
        u.segmento,
        COALESCE(SUM(CASE WHEN MONTH(h.data) = ? THEN h.valor ELSE 0 END), 0) as month_sales,
        COALESCE(COUNT(DISTINCT CASE WHEN MONTH(h.data) = ? THEN h.id ELSE NULL END), 0) as month_orders,
        COALESCE(COUNT(DISTINCT CASE WHEN MONTH(h.data) = ? THEN h.idcli ELSE NULL END), 0) as month_customers,
        COALESCE(SUM(h.valor), 0) as year_sales,
        (SELECT COUNT(*) FROM staging.staging_queries l WHERE l.cVendedor = u.id AND l.cType = 1) as open_leads
      FROM rolemak_users u
      LEFT JOIN mak.hoje h ON u.id = h.vendedor 
        AND YEAR(h.data) = ? 
        AND h.valor > 0 
        AND h.nop IN (27, 28, 51, 76)
      WHERE u.depto = 'VENDAS'
        AND u.blocked = 0
    `;
    const params = [month, month, month, year];

    if (segmento) {
      query += ` AND u.segmento = ?`;
      params.push(segmento);
    }

    query += ` GROUP BY u.id, u.nick, u.user, u.segmento`;
    query += ` ORDER BY month_sales DESC`;

    const [rows] = await db().execute(query, params);

    const sellers = rows.map(row => ({
      sellerId: row.seller_id,
      sellerName: row.seller_name,
      segmento: row.segmento,
      monthSales: parseFloat(row.month_sales) || 0,
      monthOrders: parseInt(row.month_orders) || 0,
      monthCustomers: parseInt(row.month_customers) || 0,
      yearSales: parseFloat(row.year_sales) || 0,
      openLeads: parseInt(row.open_leads) || 0
    }));

    res.json({
      success: true,
      data: sellers
    });
  } catch (error) {
    console.error('[getSellerPerformance] Error:', error.message);
    next(error);
  }
}

/**
 * Tendência de vendas (últimos 6 meses)
 * GET /api/analytics/sales-trend
 */
export async function getSalesTrend(req, res, next) {
  try {
    if (!isManager(req.user)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Apenas gerentes podem acessar' }
      });
    }

    const segmento = req.query.segmento || null;

    let query = `
      SELECT 
        YEAR(h.data) as year,
        MONTH(h.data) as month,
        COALESCE(SUM(h.valor), 0) as total_sales,
        COUNT(DISTINCT h.id) as total_orders
      FROM mak.hoje h
      INNER JOIN rolemak_users u ON h.vendedor = u.id
      WHERE h.data >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        AND h.valor > 0
        AND h.nop IN (27, 28, 51, 76)
        AND u.depto = 'VENDAS'
    `;
    const params = [];

    if (segmento) {
      query += ` AND u.segmento = ?`;
      params.push(segmento);
    }

    query += ` GROUP BY YEAR(h.data), MONTH(h.data)`;
    query += ` ORDER BY year, month`;

    const [rows] = await db().execute(query, params);

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const trend = rows.map(row => ({
      period: `${monthNames[row.month - 1]}/${row.year}`,
      year: row.year,
      month: row.month,
      sales: parseFloat(row.total_sales) || 0,
      orders: parseInt(row.total_orders) || 0
    }));

    res.json({
      success: true,
      data: trend
    });
  } catch (error) {
    console.error('[getSalesTrend] Error:', error.message);
    next(error);
  }
}
