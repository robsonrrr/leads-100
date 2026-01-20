import { getDatabase } from '../config/database.js';
import { Customer } from '../models/Customer.js';
import { CacheService } from '../services/cache.service.js';

const db = () => getDatabase();

// Constantes para status do cliente
export const CUSTOMER_STATUS = {
  ACTIVE: 'active',      // Comprou nos últimos 30 dias
  AT_RISK: 'at_risk',    // Última compra entre 30-60 dias
  INACTIVE: 'inactive'   // Sem compra há mais de 60 dias
};

export class CustomerRepository {
  /**
   * Busca clientes da carteira do vendedor com métricas
   * Se sellerId for null e segmento for passado, busca todos os clientes do segmento
   */
  async getPortfolio(sellerId, filters = {}, pagination = { page: 1, limit: 20 }, userContext = {}) {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;
      const { requestUserId = null, requestUserLevel = 0 } = userContext;
      const restrictSalesToSeller = (requestUserLevel || 0) < 4 && requestUserId;

      // Query completa com dados de pedidos da tabela mak.hoje
      let query = `
        SELECT 
          c.id,
          c.cnpj,
          c.nome,
          c.fantasia,
          c.cidade,
          c.estado,
          c.email,
          c.ddd,
          c.fone,
          c.limite,
          c.credito,
          c.vendedor,
          COALESCE(u.nick, u.user) as seller_name,
          -- Último pedido
          (
            SELECT MAX(h.data) 
            FROM mak.hoje h 
            WHERE h.idcli = c.id AND h.valor > 0 AND h.nop IN (27, 28, 51, 76)
              ${restrictSalesToSeller ? 'AND h.vendedor = ?' : ''}
          ) as last_order_date,
          (
            SELECT hv.valor 
            FROM mak.hoje hv 
            WHERE hv.idcli = c.id AND hv.valor > 0 AND hv.nop IN (27, 28, 51, 76)
              ${restrictSalesToSeller ? 'AND hv.vendedor = ?' : ''}
            ORDER BY hv.data DESC 
            LIMIT 1
          ) as last_order_value,
          (
            SELECT ho.id 
            FROM mak.hoje ho 
            WHERE ho.idcli = c.id AND ho.valor > 0 AND ho.nop IN (27, 28, 51, 76)
              ${restrictSalesToSeller ? 'AND ho.vendedor = ?' : ''}
            ORDER BY ho.data DESC 
            LIMIT 1
          ) as last_order_id,
          -- Total no ano
          (
            SELECT COALESCE(SUM(h.valor), 0) 
            FROM mak.hoje h 
            WHERE h.idcli = c.id 
              AND YEAR(h.data) = YEAR(CURDATE())
              AND h.valor > 0
              ${restrictSalesToSeller ? 'AND h.vendedor = ?' : ''}
          ) as year_total,
          (
            SELECT COUNT(*) 
            FROM mak.hoje h 
            WHERE h.idcli = c.id 
              AND YEAR(h.data) = YEAR(CURDATE())
              AND h.valor > 0
              ${restrictSalesToSeller ? 'AND h.vendedor = ?' : ''}
          ) as year_orders_count,
          -- Total no mês
          (
            SELECT COALESCE(SUM(h.valor), 0) 
            FROM mak.hoje h 
            WHERE h.idcli = c.id 
              AND YEAR(h.data) = YEAR(CURDATE())
              AND MONTH(h.data) = MONTH(CURDATE())
              AND h.valor > 0
              ${restrictSalesToSeller ? 'AND h.vendedor = ?' : ''}
          ) as month_total,
          -- Dados de Meta (maquinas vendidas)
          g.goal_units as goal_2026,
          g.classification,
          COALESCE(vunits.sold_units_2026, 0) as sold_units_2026,
          COALESCE(vunits_month.sold_units_month, 0) as sold_units_month,
          ROUND(g.goal_units / 11) as goal_month
        FROM clientes c
        LEFT JOIN rolemak_users u ON c.vendedor = u.id
        LEFT JOIN mak.customer_goals g ON g.customer_id = c.id AND g.year = YEAR(CURDATE())
        LEFT JOIN (
          SELECT ClienteID, SUM(Quantidade) as sold_units_2026
          FROM mak.Vendas_Historia
          WHERE YEAR(DataVenda) = YEAR(CURDATE()) AND ProdutoSegmento = 'machines'
          GROUP BY ClienteID
        ) vunits ON vunits.ClienteID = c.id
        LEFT JOIN (
          SELECT ClienteID, SUM(Quantidade) as sold_units_month
          FROM mak.Vendas_Historia
          WHERE YEAR(DataVenda) = YEAR(CURDATE()) 
            AND MONTH(DataVenda) = MONTH(CURDATE()) 
            AND ProdutoSegmento = 'machines'
          GROUP BY ClienteID
        ) vunits_month ON vunits_month.ClienteID = c.id
        WHERE 1=1
      `;
      const params = [];

      // Parâmetros para filtro de vendedor nas subqueries (level 1)
      // 6 subqueries precisam do filtro: last_order_date, last_order_value, last_order_id, year_total, year_orders_count, month_total
      if (restrictSalesToSeller) {
        params.push(requestUserId, requestUserId, requestUserId, requestUserId, requestUserId, requestUserId);
      }

      // Filtro por vendedor ou segmento
      if (sellerId) {
        query += ` AND c.vendedor = ?`;
        params.push(sellerId);
      } else if (filters.segmento) {
        // Se não tem vendedor mas tem segmento, busca todos os clientes dos vendedores desse segmento
        query += ` AND c.vendedor IN (
          SELECT id FROM rolemak_users 
          WHERE depto = 'VENDAS' AND segmento = ?
        )`;
        params.push(filters.segmento);
      }

      // Filtro por busca
      if (filters.search) {
        query += ` AND (c.nome LIKE ? OR c.fantasia LIKE ? OR c.cnpj LIKE ? OR c.cidade LIKE ?)`;
        const searchPattern = `%${filters.search}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      // Filtro por status
      if (filters.status) {
        switch (filters.status) {
          case CUSTOMER_STATUS.ACTIVE:
            query += ` AND (
              SELECT MAX(h.data) FROM mak.hoje h WHERE h.idcli = c.id AND h.valor > 0 AND h.nop IN (27, 28, 51, 76)
            ) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
            break;
          case CUSTOMER_STATUS.AT_RISK:
            query += ` AND (
              SELECT MAX(h.data) FROM mak.hoje h WHERE h.idcli = c.id AND h.valor > 0 AND h.nop IN (27, 28, 51, 76)
            ) BETWEEN DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
            break;
          case CUSTOMER_STATUS.INACTIVE:
            query += ` AND (
              (SELECT MAX(h.data) FROM mak.hoje h WHERE h.idcli = c.id AND h.valor > 0 AND h.nop IN (27, 28, 51, 76)) < DATE_SUB(CURDATE(), INTERVAL 60 DAY)
              OR (SELECT MAX(h.data) FROM mak.hoje h WHERE h.idcli = c.id AND h.valor > 0 AND h.nop IN (27, 28, 51, 76)) IS NULL
            )`;
            break;
        }
      }

      // Ordenação
      const sortField = filters.sort || 'last_order_date';
      const sortDir = filters.sortDir || 'DESC';
      const validSortFields = ['nome', 'last_order_date', 'year_total', 'month_total', 'limite'];
      const field = validSortFields.includes(sortField) ? sortField : 'last_order_date';
      // Para campos calculados, ordenar com NULLS LAST
      if (field === 'last_order_date') {
        query += ` ORDER BY ${field} IS NULL, ${field} ${sortDir === 'ASC' ? 'ASC' : 'DESC'}`;
      } else {
        query += ` ORDER BY ${field} ${sortDir === 'ASC' ? 'ASC' : 'DESC'}`;
      }

      // Contar total
      let countQuery = `SELECT COUNT(*) as total FROM clientes c WHERE 1=1`;
      const countParams = [];

      if (sellerId) {
        countQuery += ` AND c.vendedor = ?`;
        countParams.push(sellerId);
      } else if (filters.segmento) {
        countQuery += ` AND c.vendedor IN (
          SELECT id FROM rolemak_users 
          WHERE depto = 'VENDAS' AND segmento = ?
        )`;
        countParams.push(filters.segmento);
      }

      if (filters.search) {
        countQuery += ` AND (c.nome LIKE ? OR c.fantasia LIKE ? OR c.cnpj LIKE ? OR c.cidade LIKE ?)`;
        countParams.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
      }

      const [countResult] = await db().execute(countQuery, countParams);
      const total = countResult[0]?.total || 0;

      // Paginação
      query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

      const [rows] = await db().execute(query, params);

      // Processar resultados e calcular status
      const customers = rows.map(row => {
        const daysSinceOrder = row.last_order_date
          ? Math.floor((Date.now() - new Date(row.last_order_date).getTime()) / (1000 * 60 * 60 * 24))
          : null;

        let status = CUSTOMER_STATUS.INACTIVE;
        if (daysSinceOrder !== null) {
          if (daysSinceOrder <= 30) {
            status = CUSTOMER_STATUS.ACTIVE;
          } else if (daysSinceOrder <= 60) {
            status = CUSTOMER_STATUS.AT_RISK;
          }
        }

        return {
          id: row.id,
          cnpj: row.cnpj,
          name: row.nome,
          tradeName: row.fantasia,
          city: row.cidade,
          state: row.estado,
          email: row.email,
          phone: row.ddd && row.fone ? `(${row.ddd}) ${row.fone}` : row.fone || '',
          creditLimit: parseFloat(row.limite) || 0,
          creditAvailable: parseFloat(row.credito) || 0,
          sellerId: row.vendedor,
          sellerName: row.seller_name || null,
          status,
          daysSinceOrder,
          lastOrder: row.last_order_date ? {
            date: row.last_order_date,
            value: parseFloat(row.last_order_value) || 0,
            id: row.last_order_id
          } : null,
          yearTotal: parseFloat(row.year_total) || 0,
          yearOrdersCount: parseInt(row.year_orders_count) || 0,
          monthTotal: parseFloat(row.month_total) || 0,
          // Dados de Metas (máquinas)
          goal: row.goal_2026 ? {
            year: parseInt(row.goal_2026) || 0,
            month: parseInt(row.goal_month) || 0,
            soldYear: parseInt(row.sold_units_2026) || 0,
            soldMonth: parseInt(row.sold_units_month) || 0,
            classification: row.classification || null,
            progressYear: row.goal_2026 > 0 ? Math.round((row.sold_units_2026 / row.goal_2026) * 100) : 0,
            progressMonth: row.goal_month > 0 ? Math.round((row.sold_units_month / row.goal_month) * 100) : 0,
            gapYear: Math.max(0, (parseInt(row.goal_2026) || 0) - (parseInt(row.sold_units_2026) || 0)),
            gapMonth: Math.max(0, (parseInt(row.goal_month) || 0) - (parseInt(row.sold_units_month) || 0))
          } : null
        };
      });

      return {
        data: customers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('[getPortfolio] SQL Error:', error.message);
      throw error;
    }
  }

  /**
   * Obtém resumo da carteira do vendedor
   */
  async getPortfolioSummary(sellerId, filters = {}) {
    try {
      let query = `
        SELECT
          COUNT(*) as total_customers,
          SUM(CASE
            WHEN (SELECT MAX(h.data) FROM mak.hoje h WHERE h.idcli = c.id AND h.valor > 0 AND h.nop IN (27, 28, 51, 76)) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            THEN 1 ELSE 0
          END) as active_count,
          SUM(CASE
            WHEN (SELECT MAX(h.data) FROM mak.hoje h WHERE h.idcli = c.id AND h.valor > 0 AND h.nop IN (27, 28, 51, 76))
                 BETWEEN DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            THEN 1 ELSE 0
          END) as at_risk_count,
          SUM(CASE
            WHEN (SELECT MAX(h.data) FROM mak.hoje h WHERE h.idcli = c.id AND h.valor > 0 AND h.nop IN (27, 28, 51, 76)) < DATE_SUB(CURDATE(), INTERVAL 60 DAY)
                 OR (SELECT MAX(h.data) FROM mak.hoje h WHERE h.idcli = c.id AND h.valor > 0 AND h.nop IN (27, 28, 51, 76)) IS NULL
            THEN 1 ELSE 0
          END) as inactive_count
        FROM clientes c
        WHERE 1=1
      `;
      const params = [];

      if (sellerId) {
        query += ` AND c.vendedor = ?`;
        params.push(sellerId);
      } else if (filters.segmento) {
        query += ` AND c.vendedor IN (
          SELECT id FROM rolemak_users
          WHERE depto = 'VENDAS' AND segmento = ?
        )`;
        params.push(filters.segmento);
      }

      const [rows] = await db().execute(query, params);
      const row = rows[0] || {};

      return {
        totalCustomers: parseInt(row.total_customers) || 0,
        activeCount: parseInt(row.active_count) || 0,
        atRiskCount: parseInt(row.at_risk_count) || 0,
        inactiveCount: parseInt(row.inactive_count) || 0
      };
    } catch (error) {
      console.error('[getPortfolioSummary] SQL Error:', error.message);
      throw error;
    }
  }

  /**
   * Lista todos os vendedores com clientes (para gerentes)
   */
  async getSellers(filters = {}) {
    try {
      let query = `
        SELECT 
          u.id,
          COALESCE(u.nick, u.user) as name,
          u.email,
          u.segmento,
          COUNT(DISTINCT c.id) as customers_count,
          (
            SELECT COALESCE(SUM(h.valor), 0) 
            FROM mak.hoje h 
            INNER JOIN clientes cli ON h.idcli = cli.id
            WHERE cli.vendedor = u.id 
              AND YEAR(h.data) = YEAR(CURDATE())
              AND h.valor > 0
              AND h.nop IN (27, 28, 51, 76)
          ) as year_total
        FROM rolemak_users u
        LEFT JOIN clientes c ON c.vendedor = u.id
        WHERE u.level >= 1
          AND u.depto = 'VENDAS'
      `;
      const params = [];

      // Filtro por segmento
      if (filters.segmento) {
        query += ` AND u.segmento = ?`;
        params.push(filters.segmento);
      }

      query += `
        GROUP BY u.id, u.nick, u.user, u.email, u.segmento
        HAVING customers_count > 0
        ORDER BY name ASC
      `;

      const [rows] = await db().execute(query, params);

      return rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        segmento: row.segmento,
        customersCount: parseInt(row.customers_count) || 0,
        yearTotal: parseFloat(row.year_total) || 0
      }));
    } catch (error) {
      console.error('[getSellers] SQL Error:', error.message);
      throw error;
    }
  }

  /**
   * Lista segmentos disponíveis de vendedores
   */
  async getSellerSegments() {
    try {
      const query = `
        SELECT DISTINCT u.segmento
        FROM rolemak_users u
        WHERE u.level >= 1
          AND u.depto = 'VENDAS'
          AND u.segmento IS NOT NULL
          AND u.segmento != ''
        ORDER BY u.segmento ASC
      `;

      const [rows] = await db().execute(query);
      return rows.map(row => row.segmento);
    } catch (error) {
      console.error('[getSellerSegments] SQL Error:', error.message);
      throw error;
    }
  }

  /**
   * Busca clientes com filtros e paginação
   */
  async search(searchTerm = '', filters = {}, pagination = { page: 1, limit: 20 }) {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM clientes WHERE 1=1';
    const params = [];

    // Busca por termo (nome, fantasia, CNPJ, cidade)
    if (searchTerm) {
      query += ` AND (
        nome LIKE ? OR 
        fantasia LIKE ? OR 
        cnpj LIKE ? OR 
        cidade LIKE ?
      )`;
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Filtros adicionais
    if (filters.state) {
      query += ' AND estado = ?';
      params.push(filters.state);
    }

    if (filters.city) {
      query += ' AND cidade LIKE ?';
      params.push(`%${filters.city}%`);
    }

    if (filters.sellerId) {
      query += ' AND vendedor = ?';
      params.push(filters.sellerId);
    }

    if (filters.personType) {
      query += ' AND tipo_pessoa = ?';
      params.push(filters.personType);
    }

    // Ordenação por limite descendente
    query += ' ORDER BY limite DESC, nome ASC';

    // Contar total antes de paginar
    const countQuery = query.replace(/SELECT \* FROM/, 'SELECT COUNT(*) as total FROM').replace(/ORDER BY.*$/, '');
    const countParams = params.slice();
    const [countResult] = await db().execute(countQuery, countParams);
    const total = countResult[0]?.total || 0;

    // Paginação
    query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const [rows] = await db().execute(query, params);

    return {
      data: rows.map(row => new Customer(row)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Busca um cliente por ID
   */
  async findById(id) {
    const query = 'SELECT * FROM clientes WHERE id = ?';
    const [rows] = await db().execute(query, [id]);

    if (rows.length === 0) {
      return null;
    }

    return new Customer(rows[0]);
  }

  /**
   * Busca cliente por CNPJ
   */
  async findByCnpj(cnpj) {
    const query = 'SELECT * FROM clientes WHERE cnpj = ? LIMIT 1';
    const [rows] = await db().execute(query, [cnpj]);

    if (rows.length === 0) {
      return null;
    }

    return new Customer(rows[0]);
  }

  /**
   * Lista clientes recentes
   */
  async findRecent(limit = 10) {
    const limitInt = parseInt(limit);
    const query = `
      SELECT * FROM clientes 
      ORDER BY timestamp DESC 
      LIMIT ${limitInt}
    `;
    const [rows] = await db().execute(query);
    return rows.map(row => new Customer(row));
  }

  /**
   * Obtém histórico de pedidos do cliente
   */
  async getCustomerOrders(customerId, options = {}) {
    try {
      const { page = 1, limit = 20, year = null, sellerId = null } = options;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          h.id,
          h.data,
          h.valor,
          h.valor_base,
          h.valor_ipi,
          h.valor_st,
          h.pg,
          h.fprazo,
          h.vendedor,
          h.obs,
          (SELECT COUNT(*) FROM mak.hist hi WHERE hi.pedido = h.id) as items_count
        FROM mak.hoje h
        WHERE h.idcli = ?
          AND h.valor > 0
          AND h.nop IN (27, 28, 51, 76)
      `;
      const params = [customerId];

      if (sellerId) {
        query += ` AND h.vendedor = ?`;
        params.push(sellerId);
      }

      if (year) {
        query += ` AND YEAR(h.data) = ?`;
        params.push(year);
      }

      // Contar total
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM mak.hoje h 
        WHERE h.idcli = ? AND h.valor > 0 AND h.nop IN (27, 28, 51, 76)
        ${sellerId ? 'AND h.vendedor = ?' : ''}
        ${year ? 'AND YEAR(h.data) = ?' : ''}
      `;
      const countParams = [customerId];
      if (sellerId) countParams.push(sellerId);
      if (year) countParams.push(year);
      const [countResult] = await db().execute(countQuery, countParams);
      const total = countResult[0]?.total || 0;

      // Ordenar e paginar
      query += ` ORDER BY h.data DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

      const [rows] = await db().execute(query, params);

      const orders = rows.map(row => ({
        id: row.id,
        date: row.data,
        total: parseFloat(row.valor) || 0,
        subtotal: parseFloat(row.valor_base) || 0,
        totalIPI: parseFloat(row.valor_ipi) || 0,
        totalST: parseFloat(row.valor_st) || 0,
        paymentType: row.pg,
        paymentTerms: row.fprazo,
        sellerId: row.vendedor,
        remarks: row.obs,
        itemsCount: parseInt(row.items_count) || 0
      }));

      return {
        data: orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('[getCustomerOrders] SQL Error:', error.message);
      throw error;
    }
  }

  /**
   * Obtém leads/cotações do cliente
   */
  async getCustomerLeads(customerId, options = {}) {
    try {
      const { page = 1, limit = 20, status = null } = options;
      const offset = (page - 1) * limit;

      // Usar staging_queries que é a view correta dos leads
      let query = `
        SELECT 
          l.cSCart as id,
          l.cCustomer as customer_id,
          CASE 
            WHEN l.cOrderWeb IS NOT NULL THEN 'converted'
            WHEN l.cType = 1 THEN 'open'
            ELSE 'cancelled'
          END as status,
          l.total_value as total,
          l.cOrderWeb as order_id,
          l.xRemarksOBS as notes,
          l.dCart as created_at,
          l.dCart as updated_at
        FROM staging.staging_queries l
        WHERE l.cCustomer = ?
      `;
      const params = [customerId];

      if (status === 'open') {
        query += ` AND l.cOrderWeb IS NULL AND l.cType = 1`;
      } else if (status === 'converted') {
        query += ` AND l.cOrderWeb IS NOT NULL`;
      }

      // Contar total
      let countQuery = `
        SELECT COUNT(*) as total 
        FROM staging.staging_queries l 
        WHERE l.cCustomer = ?
      `;
      const countParams = [customerId];
      if (status === 'open') {
        countQuery += ` AND l.cOrderWeb IS NULL AND l.cType = 1`;
      } else if (status === 'converted') {
        countQuery += ` AND l.cOrderWeb IS NOT NULL`;
      }
      const [countResult] = await db().execute(countQuery, countParams);
      const total = countResult[0]?.total || 0;

      // Ordenar e paginar
      query += ` ORDER BY l.dCart DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

      const [rows] = await db().execute(query, params);

      const leads = rows.map(row => ({
        id: row.id,
        customerId: row.customer_id,
        status: row.status,
        total: parseFloat(row.total) || 0,
        orderId: row.order_id,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      return {
        data: leads,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('[getCustomerLeads] SQL Error:', error.message);
      throw error;
    }
  }

  /**
   * Obtém métricas completas do cliente
   */
  async getCustomerMetrics(customerId, userContext = {}) {
    try {
      const { requestUserId = null, requestUserLevel = 0 } = userContext;
      const restrictSalesToSeller = (requestUserLevel || 0) < 4 && requestUserId;

      const query = `
        SELECT 
          -- Total no ano atual
          (
            SELECT COALESCE(SUM(h.valor), 0) 
            FROM mak.hoje h 
            WHERE h.idcli = ? 
              AND YEAR(h.data) = YEAR(CURDATE())
              AND h.valor > 0
              ${restrictSalesToSeller ? 'AND h.vendedor = ?' : ''}
          ) as year_total,
          (
            SELECT COUNT(*) 
            FROM mak.hoje h 
            WHERE h.idcli = ? 
              AND YEAR(h.data) = YEAR(CURDATE())
              AND h.valor > 0
              ${restrictSalesToSeller ? 'AND h.vendedor = ?' : ''}
          ) as year_orders_count,
          -- Total no mês atual
          (
            SELECT COALESCE(SUM(h.valor), 0) 
            FROM mak.hoje h 
            WHERE h.idcli = ? 
              AND YEAR(h.data) = YEAR(CURDATE())
              AND MONTH(h.data) = MONTH(CURDATE())
              AND h.valor > 0
              ${restrictSalesToSeller ? 'AND h.vendedor = ?' : ''}
          ) as month_total,
          (
            SELECT COUNT(*) 
            FROM mak.hoje h 
            WHERE h.idcli = ? 
              AND YEAR(h.data) = YEAR(CURDATE())
              AND MONTH(h.data) = MONTH(CURDATE())
              AND h.valor > 0
              ${restrictSalesToSeller ? 'AND h.vendedor = ?' : ''}
          ) as month_orders_count,
          -- Total histórico
          (
            SELECT COALESCE(SUM(h.valor), 0) 
            FROM mak.hoje h 
            WHERE h.idcli = ? 
              AND h.valor > 0
              ${restrictSalesToSeller ? 'AND h.vendedor = ?' : ''}
          ) as lifetime_total,
          (
            SELECT COUNT(*) 
            FROM mak.hoje h 
            WHERE h.idcli = ? 
              AND h.valor > 0
              ${restrictSalesToSeller ? 'AND h.vendedor = ?' : ''}
          ) as lifetime_orders_count,
          -- Primeiro e último pedido
          (
            SELECT MIN(h.data) 
            FROM mak.hoje h 
            WHERE h.idcli = ? AND h.valor > 0 AND h.nop IN (27, 28, 51, 76)
              ${restrictSalesToSeller ? 'AND h.vendedor = ?' : ''}
          ) as first_order_date,
          (
            SELECT MAX(h.data) 
            FROM mak.hoje h 
            WHERE h.idcli = ? AND h.valor > 0 AND h.nop IN (27, 28, 51, 76)
              ${restrictSalesToSeller ? 'AND h.vendedor = ?' : ''}
          ) as last_order_date,
          -- Leads em aberto (cType=1)
          (
            SELECT COUNT(*) 
            FROM staging.staging_queries l 
            WHERE l.cCustomer = ? AND l.cType = 1
          ) as open_leads_count,
          -- Valor em leads abertos
          (
            SELECT COALESCE(SUM(l.total_value), 0) 
            FROM staging.staging_queries l 
            WHERE l.cCustomer = ? AND l.cType = 1
          ) as open_leads_value
      `;

      // Build params: each subquery needs customerId, and if restricted, also requestUserId
      // 8 subqueries with hoje table + 2 subqueries with staging_queries (no seller filter)
      const params = [];
      if (restrictSalesToSeller) {
        // year_total, year_orders_count, month_total, month_orders_count, lifetime_total, lifetime_orders_count, first_order_date, last_order_date
        params.push(customerId, requestUserId, customerId, requestUserId, customerId, requestUserId, customerId, requestUserId, customerId, requestUserId, customerId, requestUserId, customerId, requestUserId, customerId, requestUserId, customerId, customerId);
      } else {
        params.push(customerId, customerId, customerId, customerId, customerId, customerId, customerId, customerId, customerId, customerId);
      }
      const [rows] = await db().execute(query, params);
      const row = rows[0] || {};

      const yearTotal = parseFloat(row.year_total) || 0;
      const yearOrdersCount = parseInt(row.year_orders_count) || 0;
      const monthTotal = parseFloat(row.month_total) || 0;
      const monthOrdersCount = parseInt(row.month_orders_count) || 0;
      const lifetimeTotal = parseFloat(row.lifetime_total) || 0;
      const lifetimeOrdersCount = parseInt(row.lifetime_orders_count) || 0;
      const lastOrderDate = row.last_order_date;

      // Calcular dias desde último pedido
      const daysSinceOrder = lastOrderDate
        ? Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Calcular status
      let status = CUSTOMER_STATUS.INACTIVE;
      if (daysSinceOrder !== null) {
        if (daysSinceOrder <= 30) {
          status = CUSTOMER_STATUS.ACTIVE;
        } else if (daysSinceOrder <= 60) {
          status = CUSTOMER_STATUS.AT_RISK;
        }
      }

      // Calcular ticket médio
      const avgTicket = lifetimeOrdersCount > 0 ? lifetimeTotal / lifetimeOrdersCount : 0;

      // Calcular frequência média (dias entre pedidos)
      let avgFrequency = null;
      if (lifetimeOrdersCount > 1 && row.first_order_date && row.last_order_date) {
        const firstDate = new Date(row.first_order_date);
        const lastDate = new Date(row.last_order_date);
        const daysBetween = Math.floor((lastDate - firstDate) / (1000 * 60 * 60 * 24));
        avgFrequency = Math.round(daysBetween / (lifetimeOrdersCount - 1));
      }

      return {
        status,
        daysSinceOrder,
        year: {
          total: yearTotal,
          ordersCount: yearOrdersCount,
          avgTicket: yearOrdersCount > 0 ? yearTotal / yearOrdersCount : 0
        },
        month: {
          total: monthTotal,
          ordersCount: monthOrdersCount,
          avgTicket: monthOrdersCount > 0 ? monthTotal / monthOrdersCount : 0
        },
        lifetime: {
          total: lifetimeTotal,
          ordersCount: lifetimeOrdersCount,
          avgTicket,
          avgFrequency,
          firstOrderDate: row.first_order_date,
          lastOrderDate: row.last_order_date
        },
        leads: {
          openCount: parseInt(row.open_leads_count) || 0,
          openValue: parseFloat(row.open_leads_value) || 0
        }
      };
    } catch (error) {
      console.error('[getCustomerMetrics] SQL Error:', error.message);
      throw error;
    }
  }

  /**
   * Obtém produtos mais comprados pelo cliente
   */
  async getCustomerTopProducts(customerId, limit = 10) {
    try {
      const query = `
        SELECT 
          hi.isbn as product_id,
          pe.produto_modelo as product_code,
          pe.produto_modelo as product_name,
          SUM(hi.quant) as total_quantity,
          SUM(hi.valor) as total_value,
          COUNT(DISTINCT hi.pedido) as orders_count,
          MAX(h.data) as last_order_date
        FROM mak.hist hi
        INNER JOIN mak.hoje h ON hi.pedido = h.id
        LEFT JOIN mak.produtos_estoque pe ON hi.isbn = pe.produto_id
        WHERE h.idcli = ?
          AND h.valor > 0
          AND h.nop IN (27, 28, 51, 76)
        GROUP BY hi.isbn, pe.produto_modelo
        ORDER BY total_quantity DESC
        LIMIT ${parseInt(limit)}
      `;

      const [rows] = await db().execute(query, [customerId]);

      return rows.map(row => ({
        productId: row.product_id,
        productCode: row.product_code,
        productName: row.product_name,
        totalQuantity: parseInt(row.total_quantity) || 0,
        totalValue: parseFloat(row.total_value) || 0,
        ordersCount: parseInt(row.orders_count) || 0,
        lastOrderDate: row.last_order_date
      }));
    } catch (error) {
      console.error('[getCustomerTopProducts] SQL Error:', error.message);
      throw error;
    }
  }

  /**
   * Busca meta de um cliente para um ano específico
   */
  async getCustomerGoal(customerId, year) {
    try {
      const query = `
        SELECT 
          customer_id,
          seller_id,
          year,
          goal_units,
          classification,
          sales_2025
        FROM mak.customer_goals
        WHERE customer_id = ? AND year = ?
      `;

      const [rows] = await db().execute(query, [customerId, year]);

      if (rows.length === 0) {
        return null;
      }

      return {
        customer_id: rows[0].customer_id,
        seller_id: rows[0].seller_id,
        year: rows[0].year,
        goal_units: parseInt(rows[0].goal_units) || 0,
        classification: rows[0].classification,
        sales_2025: parseInt(rows[0].sales_2025) || 0
      };
    } catch (error) {
      console.error('[getCustomerGoal] SQL Error:', error.message);
      throw error;
    }
  }

  /**
   * Atualiza a meta anual de um cliente
   */
  async updateCustomerGoal(customerId, year, newGoal, updatedBy) {
    try {
      const query = `
        UPDATE mak.customer_goals
        SET goal_units = ?, updated_at = NOW()
        WHERE customer_id = ? AND year = ?
      `;

      const [result] = await db().execute(query, [newGoal, customerId, year]);

      if (result.affectedRows === 0) {
        throw new Error('Meta não encontrada ou não foi possível atualizar');
      }

      return {
        success: true,
        affectedRows: result.affectedRows
      };
    } catch (error) {
      console.error('[updateCustomerGoal] SQL Error:', error.message);
      throw error;
    }
  }

  /**
   * Cria uma nova meta anual para um cliente
   */
  async createCustomerGoal(customerId, sellerId, year, goalUnits, createdBy) {
    try {
      // Calcular classificação baseada na meta
      let classification = 'I'; // Inativo por padrão
      if (goalUnits >= 100) {
        classification = 'A';
      } else if (goalUnits >= 50) {
        classification = 'B';
      } else if (goalUnits > 0) {
        classification = 'C';
      }

      const query = `
        INSERT INTO mak.customer_goals 
        (customer_id, seller_id, year, goal_units, classification, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const [result] = await db().execute(query, [customerId, sellerId, year, goalUnits, classification]);

      if (result.affectedRows === 0) {
        throw new Error('Não foi possível criar a meta');
      }

      return {
        success: true,
        insertId: result.insertId,
        affectedRows: result.affectedRows
      };
    } catch (error) {
      console.error('[createCustomerGoal] SQL Error:', error.message);
      throw error;
    }
  }

  /**
   * Atualiza o nome fantasia do cliente
   */
  async updateTradeName(customerId, newTradeName) {
    try {
      const query = `
        UPDATE clientes
        SET fantasia = ?
        WHERE id = ?
      `;

      const [result] = await db().execute(query, [newTradeName, customerId]);

      if (result.affectedRows === 0) {
        throw new Error('Cliente não encontrado ou não foi possível atualizar');
      }

      return {
        success: true,
        affectedRows: result.affectedRows
      };
    } catch (error) {
      console.error('[updateTradeName] SQL Error:', error.message);
      throw error;
    }
  }
}

