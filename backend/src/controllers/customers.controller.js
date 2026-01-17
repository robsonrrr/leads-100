import { CustomerRepository, CUSTOMER_STATUS } from '../repositories/customer.repository.js';
import Joi from 'joi';
import clientOpportunitiesService from '../services/clientOpportunities.service.js';

const customerRepository = new CustomerRepository();

// Schema de validação para carteira
const portfolioSchema = Joi.object({
  search: Joi.string().allow('').optional(),
  status: Joi.string().valid('active', 'at_risk', 'inactive').optional(),
  sort: Joi.string().valid('nome', 'last_order_date', 'year_total', 'month_total', 'limite').optional(),
  sortDir: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').optional(),
  sellerId: Joi.number().integer().optional(), // Para gerentes verem carteiras de outros vendedores
  segmento: Joi.string().optional(), // Para gerentes verem todos os clientes de um segmento
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

/**
 * Verifica se usuário é gerente/diretor (level > 4)
 */
function isManager(user) {
  return (user?.level || 0) > 4;
}

/**
 * Verifica se usuário tem permissão para acessar o cliente
 * Level < 4 só pode acessar clientes da própria carteira
 */
async function checkCustomerAccess(req, res, customerId) {
  const userLevel = req.user?.level || 0;
  const userId = req.user?.userId;

  if (userLevel >= 4) return true; // Gerentes podem acessar qualquer cliente

  const customer = await customerRepository.findById(customerId);
  if (!customer) {
    res.status(404).json({
      success: false,
      error: { message: 'Customer not found' }
    });
    return false;
  }

  if (customer.vendedor !== userId) {
    res.status(403).json({
      success: false,
      error: { message: 'Acesso negado: este cliente não pertence à sua carteira' }
    });
    return false;
  }

  return true;
}

/**
 * Lista clientes da carteira do vendedor
 * GET /api/customers/my-portfolio
 * 
 * Gerentes (level > 4) podem passar ?sellerId=X para ver carteira de outro vendedor
 * Vendedores comuns veem apenas sua própria carteira
 */
export async function getMyPortfolio(req, res, next) {
  try {
    const { error, value } = portfolioSchema.validate(req.query);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation error',
          details: error.details.map(d => d.message)
        }
      });
    }

    // Determinar qual vendedor ver
    let sellerId = req.user.userId;
    let viewingOther = false;
    let viewingSegment = null;

    // Se for gerente
    if (isManager(req.user)) {
      if (value.sellerId) {
        // Ver carteira de um vendedor específico
        sellerId = value.sellerId;
        viewingOther = sellerId !== req.user.userId;
      } else if (value.segmento) {
        // Ver todos os clientes do segmento (sem vendedor específico)
        sellerId = null;
        viewingSegment = value.segmento;
        viewingOther = true;
      }
    }

    console.log('[getMyPortfolio] sellerId:', sellerId, 'viewingOther:', viewingOther, 'viewingSegment:', viewingSegment, 'userLevel:', req.user.level);

    const filters = {};
    if (value.search) filters.search = value.search;
    if (value.status) filters.status = value.status;
    if (value.sort) filters.sort = value.sort;
    if (value.sortDir) filters.sortDir = value.sortDir.toUpperCase();
    if (viewingSegment) filters.segmento = viewingSegment;

    const result = await customerRepository.getPortfolio(
      sellerId,
      filters,
      { page: value.page, limit: value.limit },
      { requestUserId: req.user.userId, requestUserLevel: req.user.level || 0 }
    );

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      meta: {
        sellerId,
        viewingOther,
        viewingSegment,
        isManager: isManager(req.user)
      }
    });
  } catch (error) {
    console.error('[getMyPortfolio] Error:', error.message, error.stack);
    next(error);
  }
}

/**
 * Obtém resumo da carteira do vendedor
 * GET /api/customers/my-portfolio/summary
 * 
 * Gerentes (level > 4) podem passar ?sellerId=X
 */
export async function getMyPortfolioSummary(req, res, next) {
  try {
    let sellerId = req.user.userId;
    let segmento = null;

    // Gerentes podem filtrar por vendedor específico ou por segmento
    if (isManager(req.user)) {
      if (req.query.sellerId) {
        sellerId = parseInt(req.query.sellerId);
      } else if (req.query.segmento) {
        segmento = req.query.segmento;
        sellerId = null; // Ao filtrar por segmento, não filtra por vendedor específico
      }
    }

    console.log('[getMyPortfolioSummary] sellerId:', sellerId, 'segmento:', segmento, 'userLevel:', req.user.level);
    const summary = await customerRepository.getPortfolioSummary(sellerId, { segmento });

    res.json({
      success: true,
      data: summary,
      meta: {
        sellerId,
        segmento,
        isManager: isManager(req.user)
      }
    });
  } catch (error) {
    console.error('[getMyPortfolioSummary] Error:', error.message, error.stack);
    next(error);
  }
}

/**
 * Lista vendedores disponíveis (para gerentes selecionarem)
 * GET /api/customers/sellers
 * 
 * Apenas gerentes (level > 4) podem acessar
 * Query params: ?segmento=1 (opcional)
 */
export async function getSellers(req, res, next) {
  try {
    // Verificar se é gerente
    if (!isManager(req.user)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Acesso restrito a gerentes' }
      });
    }

    const filters = {};
    if (req.query.segmento) {
      filters.segmento = req.query.segmento;
    }

    const sellers = await customerRepository.getSellers(filters);

    res.json({
      success: true,
      data: sellers
    });
  } catch (error) {
    console.error('[getSellers] Error:', error.message, error.stack);
    next(error);
  }
}

/**
 * Lista segmentos disponíveis de vendedores
 * GET /api/customers/sellers/segments
 * 
 * Apenas gerentes (level > 4) podem acessar
 */
export async function getSellerSegments(req, res, next) {
  try {
    // Verificar se é gerente
    if (!isManager(req.user)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Acesso restrito a gerentes' }
      });
    }

    const segments = await customerRepository.getSellerSegments();

    res.json({
      success: true,
      data: segments
    });
  } catch (error) {
    console.error('[getSellerSegments] Error:', error.message, error.stack);
    next(error);
  }
}

// Schema de validação para busca
const searchSchema = Joi.object({
  search: Joi.string().allow('').optional(),
  state: Joi.string().length(2).optional(),
  city: Joi.string().optional(),
  sellerId: Joi.number().integer().optional(),
  personType: Joi.string().valid('F', 'J').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  simple: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()).optional()
});

/**
 * Busca clientes
 * GET /api/customers?search=termo&state=SP&page=1&limit=20
 */
export async function searchCustomers(req, res, next) {
  try {
    // Validação
    const { error, value } = searchSchema.validate(req.query);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation error',
          details: error.details.map(d => d.message)
        }
      });
    }

    const filters = {};
    if (value.state) filters.state = value.state;
    if (value.city) filters.city = value.city;
    if (value.sellerId) filters.sellerId = value.sellerId;
    if (value.personType) filters.personType = value.personType;

    const result = await customerRepository.search(
      value.search || '',
      filters,
      { page: value.page, limit: value.limit }
    );

    // Usar formato simplificado para listagem
    const simple = req.query.simple === 'true' || req.query.simple === '1';

    res.json({
      success: true,
      data: result.data.map(customer =>
        simple ? customer.toSimpleJSON() : customer.toJSON()
      ),
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Busca um cliente por ID
 * GET /api/customers/:id
 * 
 * Para level < 4, só permite acesso se cliente.vendedor == userId
 */
export async function getCustomerById(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid customer ID' }
      });
    }

    const customer = await customerRepository.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: { message: 'Customer not found' }
      });
    }

    // Verificar permissão: level < 4 só pode ver clientes da própria carteira
    const userLevel = req.user?.level || 0;
    const userId = req.user?.userId;
    if (userLevel < 4 && customer.vendedor !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Acesso negado: este cliente não pertence à sua carteira' }
      });
    }

    res.json({
      success: true,
      data: customer.toJSON()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Busca cliente por CNPJ
 * GET /api/customers/cnpj/:cnpj
 */
export async function getCustomerByCnpj(req, res, next) {
  try {
    const { cnpj } = req.params;

    if (!cnpj) {
      return res.status(400).json({
        success: false,
        error: { message: 'CNPJ is required' }
      });
    }

    const customer = await customerRepository.findByCnpj(cnpj);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: { message: 'Customer not found' }
      });
    }

    res.json({
      success: true,
      data: customer.toJSON()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lista clientes recentes
 * GET /api/customers/recent?limit=10
 */
export async function getRecentCustomers(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 10;

    if (limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        error: { message: 'Limit must be between 1 and 50' }
      });
    }

    const customers = await customerRepository.findRecent(limit);

    res.json({
      success: true,
      data: customers.map(customer => customer.toSimpleJSON())
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtém histórico de pedidos do cliente
 * GET /api/customers/:id/orders
 */
export async function getCustomerOrders(req, res, next) {
  try {
    const customerId = parseInt(req.params.id);

    if (isNaN(customerId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid customer ID' }
      });
    }

    // Verificar permissão de acesso
    const hasAccess = await checkCustomerAccess(req, res, customerId);
    if (!hasAccess) return;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const year = req.query.year ? parseInt(req.query.year) : null;

    const userLevel = req.user?.level || 0;
    const currentUserId = req.user?.userId;

    const options = { page, limit, year };
    if (userLevel < 4 && currentUserId) {
      options.sellerId = currentUserId;
    }

    const result = await customerRepository.getCustomerOrders(customerId, options);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('[getCustomerOrders] Error:', error.message, error.stack);
    next(error);
  }
}

/**
 * Obtém leads/cotações do cliente
 * GET /api/customers/:id/leads
 */
export async function getCustomerLeads(req, res, next) {
  try {
    const customerId = parseInt(req.params.id);

    if (isNaN(customerId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid customer ID' }
      });
    }

    // Verificar permissão de acesso
    const hasAccess = await checkCustomerAccess(req, res, customerId);
    if (!hasAccess) return;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || null; // 'open', 'converted', 'cancelled'

    const result = await customerRepository.getCustomerLeads(customerId, { page, limit, status });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('[getCustomerLeads] Error:', error.message, error.stack);
    next(error);
  }
}

/**
 * Obtém métricas do cliente
 * GET /api/customers/:id/metrics
 */
export async function getCustomerMetrics(req, res, next) {
  try {
    const customerId = parseInt(req.params.id);

    if (isNaN(customerId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid customer ID' }
      });
    }

    // Verificar permissão de acesso
    const hasAccess = await checkCustomerAccess(req, res, customerId);
    if (!hasAccess) return;

    const metrics = await customerRepository.getCustomerMetrics(
      customerId,
      { requestUserId: req.user.userId, requestUserLevel: req.user.level || 0 }
    );

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('[getCustomerMetrics] Error:', error.message, error.stack);
    next(error);
  }
}

/**
 * Obtém produtos mais comprados pelo cliente
 * GET /api/customers/:id/products
 */
export async function getCustomerTopProducts(req, res, next) {
  try {
    const customerId = parseInt(req.params.id);

    if (isNaN(customerId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid customer ID' }
      });
    }

    // Verificar permissão de acesso
    const hasAccess = await checkCustomerAccess(req, res, customerId);
    if (!hasAccess) return;

    const limit = parseInt(req.query.limit) || 10;

    const products = await customerRepository.getCustomerTopProducts(customerId, limit);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('[getCustomerTopProducts] Error:', error.message, error.stack);
    next(error);
  }
}

/**
 * Exportar carteira em CSV
 * GET /api/customers/my-portfolio/export
 */
export async function exportPortfolio(req, res, next) {
  try {
    let sellerId = req.user.userId;
    let viewingSegment = null;

    if (isManager(req.user)) {
      if (req.query.sellerId) {
        sellerId = parseInt(req.query.sellerId);
      } else if (req.query.segmento) {
        sellerId = null;
        viewingSegment = req.query.segmento;
      }
    }

    const filters = {};
    if (req.query.search) filters.search = req.query.search;
    if (req.query.status) filters.status = req.query.status;
    if (viewingSegment) filters.segmento = viewingSegment;
    filters.sort = 'nome';
    filters.sortDir = 'ASC';

    // Buscar todos os clientes (sem paginação)
    const result = await customerRepository.getPortfolio(sellerId, filters, { page: 1, limit: 10000 });

    // Gerar CSV
    const headers = ['CNPJ', 'Nome', 'Fantasia', 'Cidade', 'UF', 'Telefone', 'Email', 'Status', 'Último Pedido', 'Total Ano', 'Total Mês', 'Limite'];

    const statusLabels = {
      active: 'Ativo',
      at_risk: 'Em Risco',
      inactive: 'Inativo'
    };

    const rows = result.data.map(c => [
      c.cnpj || '',
      `"${(c.nome || '').replace(/"/g, '""')}"`,
      `"${(c.fantasia || '').replace(/"/g, '""')}"`,
      c.cidade || '',
      c.estado || '',
      c.phone || '',
      c.email || '',
      statusLabels[c.status] || c.status,
      c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('pt-BR') : '',
      c.yearTotal || 0,
      c.monthTotal || 0,
      c.limite || 0
    ]);

    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');

    // Adicionar BOM para UTF-8 no Excel
    const bom = '\uFEFF';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=carteira.csv');
    res.send(bom + csv);
  } catch (error) {
    console.error('[exportPortfolio] Error:', error.message, error.stack);
    next(error);
  }
}

/**
 * Obtém oportunidades perdidas (produtos que o cliente não compra mas segmento compra)
 * GET /api/customers/:id/opportunities
 */
export async function getLostOpportunities(req, res, next) {
  try {
    const customerId = parseInt(req.params.id);
    if (isNaN(customerId)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid customer ID' } });
    }

    // Verificar permissão
    const hasAccess = await checkCustomerAccess(req, res, customerId);
    if (!hasAccess) return;

    const limit = parseInt(req.query.limit) || 5;

    const opportunities = await clientOpportunitiesService.getLostOpportunities(customerId, limit);

    res.json({
      success: true,
      data: opportunities
    });
  } catch (error) {
    next(error);
  }
}
