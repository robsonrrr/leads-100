import { getDatabase } from '../config/database.js';
import { Lead } from '../models/Lead.js';
import logger from '../config/logger.js';

const db = () => getDatabase();

export class LeadRepository {
  /**
   * Lista todos os leads com paginação e filtros
   */
  async findAll(filters = {}, pagination = { page: 1, limit: 20 }, includeTotal = true, sortOptions = { sortBy: 'date', sortDir: 'desc' }) {
    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 20;
    const offset = (page - 1) * limit;

    // Otimização: usar view pré-calculada para melhor performance
    // A view staging.staging_queries já inclui customer_nome e total_value calculados
    // e filtra apenas leads dos últimos 7 dias
    // Adicionar JOIN com users para obter o nick do vendedor
    let query = `
      SELECT 
        s.*,
        COALESCE(u.nick, u.user) as seller_nick,
        u.user as seller_user,
        COALESCE(ou.nick, ou.user) as owner_nick,
        ou.user as owner_user,
        c.fone as customer_phone,
        seg.segment as segment_name,
        (SELECT COUNT(*) FROM icart i WHERE i.cSCart = s.cSCart) as item_count,
        (SELECT COUNT(*) FROM icart i WHERE i.cSCart = s.cSCart AND i.vProduct > 0) as priced_item_count
      FROM staging.staging_queries s
      LEFT JOIN users u ON s.cSeller = u.id
      LEFT JOIN users ou ON s.cUser = ou.id
      LEFT JOIN clientes c ON s.cCustomer = c.id
      LEFT JOIN segments seg ON s.cSegment = seg.id_segments
      WHERE 1=1
    `;
    const params = [];

    // Filtros (a view usa os mesmos nomes de colunas da tabela sCart)
    if (filters.customerId) {
      query += ' AND s.cCustomer = ?';
      params.push(filters.customerId);
    }

    if (filters.search) {
      const term = String(filters.search).trim();
      const isNumeric = !Number.isNaN(Number(term)) && term !== '';

      if (isNumeric) {
        query += ' AND (s.cSCart = ? OR s.cCustomer = ? OR s.cOrderWeb = ?)';
        params.push(Number(term), Number(term), String(term));
      } else {
        query += ' AND (s.customer_nome LIKE ? OR s.cOrderWeb LIKE ? OR s.xBuyer LIKE ?)';
        const like = `%${term}%`;
        params.push(like, like, like);
      }
    }

    // Se ambos userId e sellerId estão definidos e são iguais:
    // - strictUserSeller=true: exigir que o usuário seja criador E vendedor
    // - caso contrário: permitir criador OU vendedor
    if (filters.userId && filters.sellerId && filters.userId === filters.sellerId) {
      if (filters.strictUserSeller) {
        query += ' AND (s.cUser = ? AND s.cSeller = ?)';
      } else {
        query += ' AND (s.cUser = ? OR s.cSeller = ?)';
      }
      params.push(filters.userId, filters.sellerId);
    } else {
      if (filters.userId) {
        query += ' AND s.cUser = ?';
        params.push(filters.userId);
      }

      if (filters.sellerId) {
        query += ' AND s.cSeller = ?';
        params.push(filters.sellerId);
      }
    }

    if (filters.type !== undefined) {
      query += ' AND s.cType = ?';
      params.push(filters.type);
    }

    if (filters.cSegment !== undefined && filters.cSegment !== null && filters.cSegment !== '') {
      // Se o filtro for "null" ou "sem-segmento", mostrar apenas leads sem segmento
      if (filters.cSegment === 'null' || filters.cSegment === 'sem-segmento') {
        query += ' AND (s.cSegment IS NULL OR s.cSegment = 0)';
      } else {
        // Para outros segmentos, mostrar leads do segmento OU sem segmento (null/0)
        query += ' AND (s.cSegment = ? OR s.cSegment IS NULL OR s.cSegment = 0)';
        params.push(filters.cSegment);
      }
    }

    // Filtro por segmento do vendedor (para gerentes verem todos os leads de vendedores de um segmento)
    if (filters.sellerSegmento) {
      query += ` AND s.cSeller IN (
        SELECT id FROM rolemak_users 
        WHERE depto = 'VENDAS' AND segmento = ?
      )`;
      params.push(filters.sellerSegmento);
    }

    // Filtro por status (aberto/convertido)
    if (filters.status === 'aberto') {
      query += " AND (s.cOrderWeb IS NULL OR s.cOrderWeb = '')";
    } else if (filters.status === 'convertido') {
      query += " AND s.cOrderWeb IS NOT NULL AND s.cOrderWeb != ''";
    }

    // Filtro de data: se dateFrom e dateTo são iguais, usar igualdade exata
    if (filters.dateFrom && filters.dateTo && filters.dateFrom === filters.dateTo) {
      query += ' AND DATE(s.dCart) = DATE(?)';
      params.push(filters.dateFrom);
    } else {
      if (filters.dateFrom) {
        query += ' AND DATE(s.dCart) >= DATE(?)';
        params.push(filters.dateFrom);
      }
      if (filters.dateTo) {
        query += ' AND DATE(s.dCart) <= DATE(?)';
        params.push(filters.dateTo);
      }
    }

    // Contar total ANTES de adicionar paginação
    // Usar a mesma view para consistência
    let countQuery = `
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(s.total_value), 0) as total_value,
        SUM(CASE WHEN s.cOrderWeb IS NOT NULL AND s.cOrderWeb != '' THEN 1 ELSE 0 END) as converted_count
      FROM staging.staging_queries s
      LEFT JOIN users u ON s.cSeller = u.id
      WHERE 1=1
    `;
    const countParams = [];

    // Aplicar os mesmos filtros na query de contagem
    if (filters.customerId) {
      countQuery += ' AND s.cCustomer = ?';
      countParams.push(filters.customerId);
    }

    if (filters.search) {
      const term = String(filters.search).trim();
      const isNumeric = !Number.isNaN(Number(term)) && term !== '';

      if (isNumeric) {
        countQuery += ' AND (s.cSCart = ? OR s.cCustomer = ? OR s.cOrderWeb = ?)';
        countParams.push(Number(term), Number(term), String(term));
      } else {
        countQuery += ' AND (s.customer_nome LIKE ? OR s.cOrderWeb LIKE ? OR s.xBuyer LIKE ?)';
        const like = `%${term}%`;
        countParams.push(like, like, like);
      }
    }
    // Se ambos userId e sellerId estão definidos e são iguais:
    // - strictUserSeller=true: exigir que o usuário seja criador E vendedor
    // - caso contrário: permitir criador OU vendedor
    if (filters.userId && filters.sellerId && filters.userId === filters.sellerId) {
      if (filters.strictUserSeller) {
        countQuery += ' AND (s.cUser = ? AND s.cSeller = ?)';
      } else {
        countQuery += ' AND (s.cUser = ? OR s.cSeller = ?)';
      }
      countParams.push(filters.userId, filters.sellerId);
    } else {
      if (filters.userId) {
        countQuery += ' AND s.cUser = ?';
        countParams.push(filters.userId);
      }
      if (filters.sellerId) {
        countQuery += ' AND s.cSeller = ?';
        countParams.push(filters.sellerId);
      }
    }
    if (filters.type !== undefined) {
      countQuery += ' AND s.cType = ?';
      countParams.push(filters.type);
    }
    if (filters.cSegment !== undefined && filters.cSegment !== null && filters.cSegment !== '') {
      // Se o filtro for "null" ou "sem-segmento", mostrar apenas leads sem segmento
      if (filters.cSegment === 'null' || filters.cSegment === 'sem-segmento') {
        countQuery += ' AND s.cSegment IS NULL';
      } else {
        // Para outros segmentos, mostrar leads do segmento OU sem segmento (null)
        countQuery += ' AND (s.cSegment = ? OR s.cSegment IS NULL)';
        countParams.push(filters.cSegment);
      }
    }
    // Filtro por segmento do vendedor (para gerentes)
    if (filters.sellerSegmento) {
      countQuery += ` AND s.cSeller IN (
        SELECT id FROM rolemak_users 
        WHERE depto = 'VENDAS' AND segmento = ?
      )`;
      countParams.push(filters.sellerSegmento);
    }
    // Filtro por status (aberto/convertido)
    if (filters.status === 'aberto') {
      countQuery += " AND (s.cOrderWeb IS NULL OR s.cOrderWeb = '')";
    } else if (filters.status === 'convertido') {
      countQuery += " AND s.cOrderWeb IS NOT NULL AND s.cOrderWeb != ''";
    }
    // Filtro de data: se dateFrom e dateTo são iguais, usar igualdade exata
    if (filters.dateFrom && filters.dateTo && filters.dateFrom === filters.dateTo) {
      countQuery += ' AND DATE(s.dCart) = DATE(?)';
      countParams.push(filters.dateFrom);
    } else {
      if (filters.dateFrom) {
        countQuery += ' AND DATE(s.dCart) >= DATE(?)';
        countParams.push(filters.dateFrom);
      }
      if (filters.dateTo) {
        countQuery += ' AND DATE(s.dCart) <= DATE(?)';
        countParams.push(filters.dateTo);
      }
    }

    const [countResult] = await db().execute(countQuery, countParams);
    const total = countResult[0]?.total || 0;
    const totalValue = parseFloat(countResult[0]?.total_value) || 0;
    const convertedCount = parseInt(countResult[0]?.converted_count) || 0;

    // Ordenação dinâmica
    const { sortBy = 'date', sortDir = 'desc' } = sortOptions || {}
    const direction = sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    let orderBy = 'dCart DESC, cSCart DESC' // Padrão

    switch (sortBy) {
      case 'total':
        orderBy = `s.total_value ${direction}, s.cSCart DESC`
        break
      case 'id':
        orderBy = `s.cSCart ${direction}`
        break
      case 'customer':
        orderBy = `s.customer_nome ${direction}, s.cSCart DESC`
        break
      case 'date':
        orderBy = `s.dCart ${direction}, s.cSCart DESC`
        break
      case 'orderWeb':
        orderBy = `s.cOrderWeb ${direction}, s.cSCart DESC`
        break
      case 'segment':
        orderBy = `s.cSegment ${direction}, s.cSCart DESC`
        break
      default:
        orderBy = `s.dCart DESC, s.cSCart DESC`
    }

    query += ` ORDER BY ${orderBy}`

    // Paginação - usar valores diretos (já validados como inteiros)
    // MySQL não aceita LIMIT/OFFSET como placeholders em algumas versões
    const limitInt = parseInt(limit);
    const offsetInt = parseInt(offset);
    query += ` LIMIT ${limitInt} OFFSET ${offsetInt}`;

    logger.debug('LeadRepository.findAll query', {
      query: query.replace(/\s+/g, ' ').trim(),
      params,
      pagination: { page, limit, offset }
    });

    const [rows] = await db().execute(query, params);

    logger.debug('LeadRepository.findAll result', { rowCount: rows.length });

    return {
      data: rows.map(row => {
        const lead = new Lead(row);
        // Adicionar nome do cliente para listagem
        if (row.customer_nome) {
          lead.customerName = row.customer_nome;
        }
        // Adicionar valor total do lead
        if (row.total_value !== undefined) {
          lead.totalValue = parseFloat(row.total_value) || 0;
        }
        // Adicionar nick do vendedor/usuário (do JOIN com users)
        if (row.seller_nick) {
          lead.sellerNick = row.seller_nick;
        } else if (row.seller_user) {
          lead.sellerNick = row.seller_user;
        }
        if (row.owner_nick) {
          lead.ownerNick = row.owner_nick;
        } else if (row.owner_user) {
          lead.ownerNick = row.owner_user;
        }
        // Adicionar nome do segmento
        if (row.segment_name) {
          lead.segmentName = row.segment_name;
        }
        // Adicionar quantidade de itens
        if (row.item_count !== undefined) {
          lead.itemCount = parseInt(row.item_count) || 0;
        }
        // Adicionar quantidade de itens com preço
        if (row.priced_item_count !== undefined) {
          lead.pricedItemCount = parseInt(row.priced_item_count) || 0;
        }
        return lead;
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        metrics: {
          totalValue,
          convertedCount
        }
      }
    };
  }

  /**
   * Busca segmentos únicos dos leads
   */
  async findUniqueSegments() {
    const query = `
      SELECT DISTINCT cSegment 
      FROM staging.staging_queries
      WHERE cSegment IS NOT NULL
      ORDER BY cSegment ASC
    `;
    const [rows] = await db().execute(query);
    return rows.map(row => row.cSegment);
  }

  /**
   * Lista todos os segmentos disponíveis (tabela segments)
   */
  async findAllSegments() {
    // Tenta buscar da tabela segments se existir
    try {
      const query = 'SELECT id_segments as id, segment as name FROM segments ORDER BY segment ASC';
      const [rows] = await db().execute(query);
      return rows;
    } catch (e) {
      // Fallback se a tabela não existir ou der erro: retorna mapa fixo
      // Baseado no segmentMapping do controller
      return [
        { id: 1, name: 'Machines' },
        { id: 2, name: 'Bearings' },
        { id: 3, name: 'Parts' },
        { id: 5, name: 'Auto' },
        { id: 6, name: 'Moto' }
      ];
    }
  }

  /**
   * Busca tipos de pagamento
   */
  async findPaymentTypes() {
    try {
      const query = 'SELECT id_payment_type as id, payment_type as name FROM mak.payment_types ORDER BY id_payment_type';
      const [rows] = await db().execute(query);
      return rows;
    } catch (e) {
      logger.error('Error fetching payment types:', e);
      // Fallback
      return [
        { id: 1, name: 'À Vista' },
        { id: 2, name: 'Boleto' },
        { id: 3, name: 'Cartão de Crédito' },
        { id: 4, name: 'Cartão de Débito' },
        { id: 5, name: 'PIX' },
        { id: 6, name: 'Transferência' }
      ];
    }
  }

  /**
   * Busca prazos de pagamento (terms)
   */
  async findPaymentTerms() {
    // Filtrar apenas ativos (bancos diferentes podem usar 'ativo' ou 'active')
    const baseQuery = 'SELECT id, terms, nat_op FROM mak.terms';

    try {
      const query = `${baseQuery} WHERE ativo=1 ORDER BY id`;
      const [rows] = await db().execute(query);
      return rows;
    } catch (e1) {
      try {
        const query = `${baseQuery} WHERE active=1 ORDER BY id`;
        const [rows] = await db().execute(query);
        return rows;
      } catch (e2) {
        logger.error('Error fetching payment terms:', e2);
        return [];
      }
    }
  }

  /**
   * Busca um lead por ID
   */
  async findById(id) {
    const query = `
      SELECT 
        s.*,
        c.nome as customer_nome,
        c.ender as customer_ender,
        c.cidade as customer_cidade,
        c.estado as customer_estado
      FROM sCart s
      LEFT JOIN clientes c ON s.cCustomer = c.id
      WHERE s.cSCart = ?
    `;
    const [rows] = await db().execute(query, [id]);

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    const lead = new Lead(row);

    // Adicionar informações do cliente
    if (row.customer_nome) {
      lead.customer = {
        nome: row.customer_nome,
        ender: row.customer_ender,
        cidade: row.customer_cidade,
        estado: row.customer_estado
      };
    }

    return lead;
  }

  /**
   * Cria um novo lead
   */
  async create(leadData) {
    const lead = new Lead(leadData);

    const query = `
      INSERT INTO sCart (
        dCart, cSegment, cNatOp, cCustomer, cUser, cSeller, cCC,
        cPaymentType, vPaymentTerms, cPaymentTerms, cTransporter,
        vFreight, vFreightType, cEmitUnity, cLogUnity, cUpdated,
        dDelivery, xRemarksFinance, xRemarksLogistic, xRemarksNFE,
        xRemarksOBS, xRemarksManager, cOrderWeb, cType, xBuyer,
        cPurchaseOrder, cAuthorized, cSource, vComission
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      lead.dCart,
      lead.cSegment,
      lead.cNatOp,
      lead.cCustomer,
      lead.cUser,
      lead.cSeller,
      lead.cCC,
      lead.cPaymentType,
      lead.vPaymentTerms,
      lead.cPaymentTerms,
      lead.cTransporter,
      lead.vFreight,
      lead.vFreightType,
      lead.cEmitUnity,
      lead.cLogUnity,
      lead.cUpdated,
      lead.dDelivery,
      lead.xRemarksFinance,
      lead.xRemarksLogistic,
      lead.xRemarksNFE,
      lead.xRemarksOBS,
      lead.xRemarksManager,
      lead.cOrderWeb,
      lead.cType,
      lead.xBuyer,
      lead.cPurchaseOrder,
      lead.cAuthorized,
      lead.cSource,
      lead.vComission
    ];

    const [result] = await db().execute(query, params);
    lead.cSCart = result.insertId;

    return lead;
  }

  /**
   * Atualiza um lead
   */
  async update(id, leadData) {
    const lead = new Lead(leadData);

    const query = `
      UPDATE sCart SET
        dCart = ?, cSegment = ?, cNatOp = ?, cCustomer = ?, cUser = ?,
        cSeller = ?, cCC = ?, cPaymentType = ?, vPaymentTerms = ?,
        cPaymentTerms = ?, cTransporter = ?, vFreight = ?, vFreightType = ?,
        cEmitUnity = ?, cLogUnity = ?, cUpdated = ?, dDelivery = ?,
        xRemarksFinance = ?, xRemarksLogistic = ?, xRemarksNFE = ?,
        xRemarksOBS = ?, xRemarksManager = ?, cOrderWeb = ?, cType = ?,
        xBuyer = ?, cPurchaseOrder = ?, cAuthorized = ?, cSource = ?,
        vComission = ?
      WHERE cSCart = ?
    `;

    const params = [
      lead.dCart,
      lead.cSegment,
      lead.cNatOp,
      lead.cCustomer,
      lead.cUser,
      lead.cSeller,
      lead.cCC,
      lead.cPaymentType,
      lead.vPaymentTerms,
      lead.cPaymentTerms,
      lead.cTransporter,
      lead.vFreight,
      lead.vFreightType,
      lead.cEmitUnity,
      lead.cLogUnity,
      lead.cUpdated,
      lead.dDelivery,
      lead.xRemarksFinance,
      lead.xRemarksLogistic,
      lead.xRemarksNFE,
      lead.xRemarksOBS,
      lead.xRemarksManager,
      lead.cOrderWeb,
      lead.cType,
      lead.xBuyer,
      lead.cPurchaseOrder,
      lead.cAuthorized,
      lead.cSource,
      lead.vComission,
      id
    ];

    await db().execute(query, params);
    return this.findById(id);
  }

  /**
   * Remove um lead (soft delete - marca como deletado)
   */
  async delete(id) {
    // Soft delete - atualiza o tipo ou marca como deletado
    const query = 'UPDATE sCart SET cType = 99 WHERE cSCart = ?';
    await db().execute(query, [id]);
    return true;
  }

  /**
   * Busca leads por cliente
   */
  async findByCustomer(customerId, limit = 20) {
    const limitInt = parseInt(limit);
    const query = `
      SELECT * FROM sCart 
      WHERE cCustomer = ? AND cType = 1
      ORDER BY dCart DESC
      LIMIT ${limitInt}
    `;
    const [rows] = await db().execute(query, [customerId]);
    return rows.map(row => new Lead(row));
  }
}

