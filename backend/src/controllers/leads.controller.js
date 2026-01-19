import { LeadRepository } from '../repositories/lead.repository.js';
import { CartItemRepository } from '../repositories/cartItem.repository.js';
import { OrderRepository } from '../repositories/order.repository.js';
import { TaxRepository } from '../repositories/tax.repository.js';
import { getDatabase } from '../config/database.js';
import Joi from 'joi';
import { Errors } from '../utils/AppError.js';
import { auditLog } from '../services/auditLog.service.js';
import { CacheService } from '../services/cache.service.js';
import { pricingAgent } from '../v2/services/pricing/PricingAgent.js';
import { automationEngine } from '../v2/services/automation/AutomationEngine.js';
import { fourCService } from '../v2/services/ai/FourCService.js';
import logger from '../config/logger.js';

const leadRepository = new LeadRepository();
const cartItemRepository = new CartItemRepository();
const orderRepository = new OrderRepository();
const taxRepository = new TaxRepository();

// Schema de validação para criar lead
const createLeadSchema = Joi.object({
  customerId: Joi.number().integer().required(),
  userId: Joi.number().integer().required(),
  sellerId: Joi.number().integer().optional(),
  cSegment: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null, '').optional(),
  cNatOp: Joi.number().integer().default(27),
  cEmitUnity: Joi.number().integer().default(1),
  cLogUnity: Joi.number().integer().default(1),
  cTransporter: Joi.number().integer().default(9),
  paymentType: Joi.number().integer().default(2), // Boleto (padrão)
  paymentTerms: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null, '').optional(),
  vPaymentTerms: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null, '').optional(),
  freight: Joi.number().default(0),
  freightType: Joi.number().integer().default(1),
  deliveryDate: Joi.date().allow(null).optional(),
  remarks: Joi.object({
    finance: Joi.string().allow('').optional(),
    logistic: Joi.string().allow('').optional(),
    nfe: Joi.string().allow('').optional(),
    obs: Joi.string().allow('').optional(),
    manager: Joi.string().allow('').optional()
  }).optional(),
  buyer: Joi.string().allow(null, '').optional(),
  purchaseOrder: Joi.string().allow(null, '').optional()
});

// Schema de validação para atualizar lead
const updateLeadSchema = Joi.object({
  customerId: Joi.number().integer().optional(),
  cSegment: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null, '').optional(),
  cNatOp: Joi.number().integer().optional(),
  cEmitUnity: Joi.number().integer().optional(),
  cLogUnity: Joi.number().integer().optional(),
  cTransporter: Joi.number().integer().optional(),
  paymentType: Joi.number().integer().optional(),
  paymentTerms: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null, '').optional(),
  vPaymentTerms: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null, '').optional(),
  freight: Joi.number().optional(),
  freightType: Joi.number().integer().optional(),
  deliveryDate: Joi.date().allow(null).optional(),
  remarks: Joi.object({
    finance: Joi.string().allow('').optional(),
    logistic: Joi.string().allow('').optional(),
    nfe: Joi.string().allow('').optional(),
    obs: Joi.string().allow('').optional(),
    manager: Joi.string().allow('').optional()
  }).optional(),
  buyer: Joi.string().allow(null, '').optional(),
  purchaseOrder: Joi.string().allow(null, '').optional()
});

// Schema de validação para converter lead
const convertLeadSchema = Joi.object({
  remarks: Joi.object({
    finance: Joi.string().allow('').optional(),
    logistic: Joi.string().allow('').optional(),
    nfe: Joi.string().allow('').optional(),
    obs: Joi.string().allow('').optional(),
    manager: Joi.string().allow('').optional()
  }).optional(),
  cTransporter: Joi.number().integer().optional()
}).unknown(true);

/**
 * Lista todos os leads com paginação e filtros
 * GET /api/leads?page=1&limit=20&customerId=123&userId=456
 */
export async function getLeads(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filters = {};

    // includeTotal: se 'true' ou '1', calcula total (mais lento)
    // Por padrão, não calcula para melhorar performance
    const includeTotal = req.query.includeTotal === 'true' || req.query.includeTotal === '1';

    // Filtrar por usuário se level <= 4 (usuários comuns só veem seus próprios leads)
    // Se level > 4 (admin/gerente), pode ver todos os leads
    // Se level não estiver definido, assume que é usuário comum (filtra por userId)
    // IMPORTANTE: Filtrar por cUser (criador) OU cSeller (vendedor) para usuários comuns
    const userLevelRaw = req.user?.level;
    const userLevel = userLevelRaw === undefined || userLevelRaw === null
      ? undefined
      : Number(userLevelRaw);
    const currentUserId = req.user?.userId;

    if (userLevel === undefined || Number.isNaN(userLevel) || userLevel <= 4) {
      // Usuários não-gerenciais: deve ver apenas leads onde ele é o criador (cUser)
      filters.userId = currentUserId;
    }

    if (req.query.customerId) filters.customerId = parseInt(req.query.customerId);
    if (req.query.q !== undefined && req.query.q !== null && String(req.query.q).trim() !== '') {
      filters.search = String(req.query.q).trim();
    }
    if (req.query.type !== undefined) filters.type = parseInt(req.query.type);
    if (req.query.cSegment !== undefined && req.query.cSegment !== '') {
      filters.cSegment = req.query.cSegment === 'null' ? null : req.query.cSegment;
    }
    if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
    if (req.query.dateTo) filters.dateTo = req.query.dateTo;
    if (req.query.status) filters.status = req.query.status;

    // Filtros para gerentes (level > 4)
    if (userLevel > 4) {
      // Somente gerentes podem filtrar por userId/sellerId arbitrários
      if (req.query.userId) filters.userId = parseInt(req.query.userId);
      if (req.query.sellerId) filters.sellerId = parseInt(req.query.sellerId);

      // Filtrar por segmento do vendedor (todos os vendedores de um segmento)
      if (req.query.sellerSegmento) {
        filters.sellerSegmento = req.query.sellerSegmento;
      }
      // Filtrar por vendedor específico
      if (req.query.filterSellerId) {
        filters.sellerId = parseInt(req.query.filterSellerId);
        delete filters.userId; // Remover filtro de userId quando filtrando por vendedor específico
      }
    }

    // Se não especificado, filtra apenas leads (tipo 1)
    if (filters.type === undefined) {
      filters.type = 1;
    }

    // Ordenação
    const sortBy = req.query.sort || 'date'; // Padrão: data (mais novos primeiro)
    const sortDir = req.query.sortDir || 'desc'; // Padrão: descendente

    const result = await leadRepository.findAll(filters, { page, limit }, includeTotal, { sortBy, sortDir });

    res.json({
      success: true,
      data: result.data.map(lead => lead.toJSON()),
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Busca um lead por ID
 * GET /api/leads/:id
 */
export async function getLeadById(req, res, next) {
  try {
    // Verificar se é uma rota reservada (como "segments")
    const reservedRoutes = ['segments', 'items', 'totals', 'convert'];
    if (reservedRoutes.includes(req.params.id)) {
      return next(); // Passar para o próximo middleware/rota
    }

    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return next(Errors.invalidId('lead'));
    }

    const lead = await leadRepository.findById(id);

    if (!lead) {
      return next(Errors.leadNotFound(id));
    }

    const userLevelRaw = req.user?.level;
    const userLevel = userLevelRaw === undefined || userLevelRaw === null
      ? undefined
      : Number(userLevelRaw);
    const currentUserId = req.user?.userId;

    // Usuários comuns só podem acessar leads onde são criador (cUser) OU vendedor (cSeller)
    if (userLevel === undefined || Number.isNaN(userLevel) || userLevel <= 4) {
      const leadJson = lead.toJSON();
      const leadUserId = leadJson?.userId;
      const leadSellerId = leadJson?.sellerId;

      if (leadUserId !== currentUserId) {
        return res.status(403).json({
          success: false,
          error: { message: 'Sem permissão para acessar este lead' }
        });
      }
    }

    res.json({
      success: true,
      data: lead.toJSON()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cria um novo lead
 * POST /api/leads
 */
export async function createLead(req, res, next) {
  try {
    // Validação
    const { error, value } = createLeadSchema.validate(req.body, { abortEarly: false });

    if (error) {
      return next(Errors.validation(error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))));
    }

    // Preparar dados
    const cSeller = value.sellerId || value.userId;

    // Buscar segmento do vendedor
    const [sellerRows] = await getDatabase().execute('SELECT segmento FROM users WHERE id = ?', [cSeller]);
    const sellerSegmentSlug = sellerRows.length > 0 ? sellerRows[0].segmento : null;

    // Mapeamento de segmento (slug -> id numérico)
    const segmentMapping = {
      'machines': 1,
      'bearings': 2,
      'parts': 3,
      'auto': 5,
      'moto': 6
    };
    const sellerSegmentId = segmentMapping[sellerSegmentSlug] || null;

    // Determine segment: use provided value (mapped or raw) or fallback to seller's segment
    let finalSegmentId = sellerSegmentId;

    if (value.cSegment !== undefined && value.cSegment !== null && value.cSegment !== '') {
      // If it's a number, use it. If it's a string, try to map it.
      if (typeof value.cSegment === 'number') {
        finalSegmentId = value.cSegment;
      } else if (typeof value.cSegment === 'string') {
        // Try to map from slug to ID if possible
        const mapped = segmentMapping[value.cSegment.toLowerCase()];
        if (mapped) {
          finalSegmentId = mapped;
        } else {
          // Try to parse as int
          const parsed = parseInt(value.cSegment);
          if (!isNaN(parsed)) finalSegmentId = parsed;
        }
      }
    }

    const rawPaymentTerms = value.vPaymentTerms !== undefined
      ? value.vPaymentTerms
      : (value.paymentTerms !== undefined ? value.paymentTerms : undefined);

    let paymentTermsId = null;
    let paymentTermsStr = null;

    if (rawPaymentTerms !== undefined && rawPaymentTerms !== null && rawPaymentTerms !== '') {
      if (typeof rawPaymentTerms === 'number') {
        paymentTermsId = rawPaymentTerms;
      } else if (typeof rawPaymentTerms === 'string') {
        const parsed = parseInt(rawPaymentTerms);
        if (!Number.isNaN(parsed) && String(parsed) === rawPaymentTerms.trim()) {
          paymentTermsId = parsed;
        } else {
          paymentTermsStr = rawPaymentTerms;
        }
      }
    }

    if (paymentTermsId) {
      const [termRows] = await getDatabase().execute(
        'SELECT terms FROM mak.terms WHERE id = ? LIMIT 1',
        [paymentTermsId]
      );
      paymentTermsStr = termRows?.[0]?.terms || null;
    }

    if (!paymentTermsStr) {
      paymentTermsStr = 'n:30:30';
    }

    // Preparar dados
    const leadData = {
      cCustomer: value.customerId,
      cUser: value.userId,
      cSeller: cSeller,
      cSegment: finalSegmentId,
      cNatOp: value.cNatOp,
      cEmitUnity: value.cEmitUnity,
      cLogUnity: value.cLogUnity || value.cEmitUnity,
      cTransporter: value.cTransporter,
      cPaymentType: value.paymentType,
      vPaymentTerms: paymentTermsId || 0,
      cPaymentTerms: paymentTermsStr,
      vFreight: value.freight,
      vFreightType: value.freightType,
      dDelivery: value.deliveryDate || null,
      xRemarksFinance: value.remarks?.finance || '',
      xRemarksLogistic: value.remarks?.logistic || '',
      xRemarksNFE: value.remarks?.nfe || '',
      xRemarksOBS: value.remarks?.obs || '',
      xRemarksManager: value.remarks?.manager || '',
      xBuyer: value.buyer || null,
      cPurchaseOrder: value.purchaseOrder || null,
      cType: 1 // Lead/Consulta
    };

    const lead = await leadRepository.create(leadData);

    // Audit log
    await auditLog.logLeadCreate(
      lead.cSCart,
      req.user?.userId,
      req.user?.username,
      req,
      { customerId: value.customerId, segment: sellerSegmentSlug }
    );

    // Automation Trigger (Q2 2026)
    await automationEngine.trigger({
      type: 'LEAD_CREATED',
      customerId: value.customerId,
      userId: value.userId,
      referenceId: lead.cSCart
    });

    res.status(201).json({
      success: true,
      data: lead.toJSON(),
      message: 'Lead created successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Atualiza um lead
 * PUT /api/leads/:id
 */
export async function updateLead(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return next(Errors.invalidId('lead'));
    }

    // Verificar se o lead existe
    const existingLead = await leadRepository.findById(id);
    if (!existingLead) {
      return next(Errors.leadNotFound(id));
    }

    // Validação
    const { error, value } = updateLeadSchema.validate(req.body, { abortEarly: false });

    if (error) {
      return next(Errors.validation(error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))));
    }

    const rawPaymentTerms = value.vPaymentTerms !== undefined
      ? value.vPaymentTerms
      : (value.paymentTerms !== undefined ? value.paymentTerms : undefined);

    let paymentTermsId = null;
    let paymentTermsStr = null;

    if (rawPaymentTerms !== undefined && rawPaymentTerms !== null && rawPaymentTerms !== '') {
      if (typeof rawPaymentTerms === 'number') {
        paymentTermsId = rawPaymentTerms;
      } else if (typeof rawPaymentTerms === 'string') {
        const parsed = parseInt(rawPaymentTerms);
        if (!Number.isNaN(parsed) && String(parsed) === rawPaymentTerms.trim()) {
          paymentTermsId = parsed;
        } else {
          paymentTermsStr = rawPaymentTerms;
        }
      }
    }

    if (paymentTermsId) {
      const [termRows] = await getDatabase().execute(
        'SELECT terms FROM mak.terms WHERE id = ? LIMIT 1',
        [paymentTermsId]
      );
      paymentTermsStr = termRows?.[0]?.terms || null;
    }

    // Preparar dados (manter valores existentes se não fornecidos)
    const leadData = {
      ...existingLead,
      cCustomer: value.customerId !== undefined ? value.customerId : existingLead.cCustomer,
      cSegment: value.cSegment !== undefined ? (value.cSegment || null) : existingLead.cSegment,
      cNatOp: value.cNatOp !== undefined ? value.cNatOp : existingLead.cNatOp,
      cEmitUnity: value.cEmitUnity !== undefined ? value.cEmitUnity : existingLead.cEmitUnity,
      cLogUnity: value.cLogUnity !== undefined ? value.cLogUnity : existingLead.cLogUnity,
      cTransporter: value.cTransporter !== undefined ? value.cTransporter : existingLead.cTransporter,
      cPaymentType: value.paymentType !== undefined ? value.paymentType : existingLead.cPaymentType,
      vPaymentTerms: rawPaymentTerms !== undefined
        ? (paymentTermsId || 0)
        : existingLead.vPaymentTerms,
      cPaymentTerms: rawPaymentTerms !== undefined
        ? (paymentTermsStr || existingLead.cPaymentTerms)
        : existingLead.cPaymentTerms,
      vFreight: value.freight !== undefined ? value.freight : existingLead.vFreight,
      vFreightType: value.freightType !== undefined ? value.freightType : existingLead.vFreightType,
      dDelivery: value.deliveryDate !== undefined ? value.deliveryDate : existingLead.dDelivery,
      xRemarksFinance: value.remarks?.finance !== undefined ? value.remarks.finance : existingLead.xRemarksFinance,
      xRemarksLogistic: value.remarks?.logistic !== undefined ? value.remarks.logistic : existingLead.xRemarksLogistic,
      xRemarksNFE: value.remarks?.nfe !== undefined ? value.remarks.nfe : existingLead.xRemarksNFE,
      xRemarksOBS: value.remarks?.obs !== undefined ? value.remarks.obs : existingLead.xRemarksOBS,
      xRemarksManager: value.remarks?.manager !== undefined ? value.remarks.manager : existingLead.xRemarksManager,
      xBuyer: value.buyer !== undefined ? value.buyer : existingLead.xBuyer,
      cPurchaseOrder: value.purchaseOrder !== undefined ? value.purchaseOrder : existingLead.cPurchaseOrder,
      cUpdated: 1 // Marca como atualizado
    };

    const lead = await leadRepository.update(id, leadData);

    // Audit log - registrar alteração
    await auditLog.logLeadUpdate(
      id,
      req.user?.userId,
      req.user?.username,
      req,
      existingLead.toJSON ? existingLead.toJSON() : existingLead,
      lead.toJSON()
    );

    res.json({
      success: true,
      data: lead.toJSON(),
      message: 'Lead updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove um lead
 * DELETE /api/leads/:id
 */
export async function deleteLead(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return next(Errors.invalidId('lead'));
    }

    // Verificar se o lead existe
    const lead = await leadRepository.findById(id);
    if (!lead) {
      return next(Errors.leadNotFound(id));
    }

    await leadRepository.delete(id);

    // Audit log
    await auditLog.logLeadDelete(
      id,
      req.user?.userId,
      req.user?.username,
      req,
      { customerId: lead.cCustomer }
    );

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

// Schema de validação para adicionar item
const addItemSchema = Joi.object({
  productId: Joi.number().integer().required(),
  quantity: Joi.number().positive().required(),
  price: Joi.number().min(0).required(),
  consumerPrice: Joi.number().min(0).optional(),
  originalPrice: Joi.number().min(0).optional(),
  times: Joi.number().integer().min(0).default(1),
  ipi: Joi.number().min(0).default(0),
  st: Joi.number().min(0).default(0),
  ttd: Joi.number().integer().default(0),
  decisionId: Joi.string().allow(null, '').optional()
});

// Schema de validação para atualizar item
const updateItemSchema = Joi.object({
  productId: Joi.number().integer().optional(),
  quantity: Joi.number().positive().optional(),
  price: Joi.number().min(0).optional(),
  consumerPrice: Joi.number().min(0).optional(),
  originalPrice: Joi.number().min(0).optional(),
  times: Joi.number().integer().min(0).optional(),
  ipi: Joi.number().min(0).optional(),
  st: Joi.number().min(0).optional(),
  ttd: Joi.number().integer().optional(),
  decisionId: Joi.string().allow(null, '').optional()
});

/**
 * Lista itens de um lead
 * GET /api/leads/:id/items
 */
export async function getLeadItems(req, res, next) {
  try {
    const leadId = parseInt(req.params.id);

    if (isNaN(leadId)) {
      return next(Errors.invalidId('lead'));
    }

    // Verificar se o lead existe
    const lead = await leadRepository.findById(leadId);
    if (!lead) {
      return next(Errors.leadNotFound(leadId));
    }

    const items = await cartItemRepository.findByLeadId(leadId);

    res.json({
      success: true,
      data: items.map(item => item.toJSON())
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Adiciona um item ao carrinho
 * POST /api/leads/:id/items
 */
export async function addItem(req, res, next) {
  try {
    const leadId = parseInt(req.params.id);

    if (isNaN(leadId)) {
      return next(Errors.invalidId('lead'));
    }

    // Verificar se o lead existe
    const lead = await leadRepository.findById(leadId);
    if (!lead) {
      return next(Errors.leadNotFound(leadId));
    }

    // Validação
    const { error, value } = addItemSchema.validate(req.body, { abortEarly: false });

    if (error) {
      return next(Errors.validation(error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))));
    }

    // Preço de tela (vProductOriginal) nunca pode vir do usuário.
    // Sempre derivar do produto no banco.
    const [invRows] = await getDatabase().execute(
      'SELECT revenda FROM inv WHERE id = ? LIMIT 1',
      [value.productId]
    );
    const productScreenPrice = parseFloat(invRows?.[0]?.revenda) || 0;

    // Preparar dados
    const itemData = {
      cSCart: leadId,
      cProduct: value.productId,
      qProduct: value.quantity,
      vProduct: value.price,
      vProductCC: value.consumerPrice || value.price,
      vProductOriginal: productScreenPrice,
      tProduct: value.times ?? 0,
      vIPI: value.ipi || 0,
      vCST: value.st || 0,
      TTD: value.ttd || 0,
      dInquiry: new Date(),
      ai_decision_id: value.decisionId || null
    };

    // V2: Integrar com PricingAgent para Governança Q1 2026
    try {
      await pricingAgent.calculate({
        customer_id: lead.cCustomer,
        seller_id: req.user?.userId || lead.cUser,
        lead_id: leadId,
        source: 'CRM_ADD_ITEM',
        items: [{
          product_id: value.productId,
          quantity: value.quantity,
          unit_price: value.price,
          unit_price_list: productScreenPrice
        }]
      });
    } catch (pricingError) {
      // Se for um erro de política impetrado como bloqueio, poderíamos parar aqui.
      // Por enquanto apenas logamos, a menos que seja um erro crítico.
      console.warn('V2 Pricing Policy Warning:', pricingError.message);
    }

    // Feedback 4C Intelligence (ACCEPTED)
    if (value.decisionId) {
      try {
        await fourCService.feedback(value.decisionId, 'ACCEPTED');
      } catch (fError) {
        logger.error('4C Feedback Error:', fError);
      }
    }

    const item = await cartItemRepository.create(itemData);

    const parseAccessoryIds = (raw) => {
      if (raw === undefined || raw === null) return [];
      const str = String(raw).trim();
      if (str === '' || str.toLowerCase() === 'null') return [];

      const tokens = str
        .split(/[\s,;|]+/g)
        .map(t => t.trim())
        .filter(Boolean);

      const ids = [];
      for (const t of tokens) {
        const n = Number(t);
        if (!Number.isNaN(n) && Number.isFinite(n) && n > 0) {
          ids.push(Math.trunc(n));
        }
      }
      return ids;
    };

    const addedAccessories = [];
    try {
      const db = getDatabase();
      const [accRows] = await db.execute(
        'SELECT motor, tampo FROM inv WHERE id = ? LIMIT 1',
        [value.productId]
      );

      if (accRows.length > 0) {
        const motorIds = parseAccessoryIds(accRows[0]?.motor);
        const tampoIds = parseAccessoryIds(accRows[0]?.tampo);
        const accessoryIds = Array.from(new Set([
          ...motorIds,
          ...tampoIds
        ].filter((id) => id && id !== value.productId)));

        for (const accessoryId of accessoryIds) {
          const existing = await cartItemRepository.findByLeadIdAndProductId(leadId, accessoryId);
          if (existing) {
            const updated = await cartItemRepository.incrementQuantity(existing.cCart, leadId, value.quantity);
            if (updated) {
              addedAccessories.push(updated.toJSON());
            }
            continue;
          }

          const [priceRows] = await db.execute(
            'SELECT revenda FROM inv WHERE id = ? LIMIT 1',
            [accessoryId]
          );
          const accessoryPrice = parseFloat(priceRows?.[0]?.revenda) || 0;

          const accessoryItemData = {
            cSCart: leadId,
            cProduct: accessoryId,
            qProduct: value.quantity,
            vProduct: accessoryPrice,
            vProductCC: accessoryPrice,
            vProductOriginal: accessoryPrice,
            tProduct: value.times ?? 0,
            vIPI: 0,
            vCST: 0,
            TTD: value.ttd || 0,
            dInquiry: new Date()
          };

          const created = await cartItemRepository.create(accessoryItemData);
          if (created) {
            addedAccessories.push(created.toJSON());
          }
        }
      }
    } catch (e) {
      // Não falhar a inclusão do item principal por erro nos acessórios
      console.error('Erro ao adicionar acessórios (motor/tampo):', e);
    }

    res.status(201).json({
      success: true,
      data: item.toJSON(),
      addedAccessories,
      message: 'Item added successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Atualiza um item do carrinho
 * PUT /api/leads/:id/items/:itemId
 */
export async function updateItem(req, res, next) {
  try {
    const leadId = parseInt(req.params.id);
    const itemId = parseInt(req.params.itemId);

    if (isNaN(leadId)) {
      return next(Errors.invalidId('lead'));
    }
    if (isNaN(itemId)) {
      return next(Errors.invalidId('item'));
    }

    // Verificar se o lead existe
    const lead = await leadRepository.findById(leadId);
    if (!lead) {
      return next(Errors.leadNotFound(leadId));
    }

    // Verificar se o item existe
    const existingItem = await cartItemRepository.findById(itemId);
    if (!existingItem || existingItem.cSCart !== leadId) {
      return next(Errors.itemNotFound(itemId));
    }

    // Validação
    const { error, value } = updateItemSchema.validate(req.body, { abortEarly: false });

    if (error) {
      return next(Errors.validation(error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))));
    }

    // Preparar dados (manter valores existentes se não fornecidos)
    const itemData = {
      cProduct: value.productId !== undefined ? value.productId : existingItem.cProduct,
      qProduct: value.quantity !== undefined ? value.quantity : existingItem.qProduct,
      vProduct: value.price !== undefined ? value.price : existingItem.vProduct,
      vProductCC: value.consumerPrice !== undefined ? value.consumerPrice : existingItem.vProductCC,
      // Preço de tela nunca pode ser alterado pelo usuário.
      vProductOriginal: existingItem.vProductOriginal,
      tProduct: value.times !== undefined ? value.times : existingItem.tProduct,
      vIPI: value.ipi !== undefined ? value.ipi : existingItem.vIPI,
      vCST: value.st !== undefined ? value.st : existingItem.vCST,
      TTD: value.ttd !== undefined ? value.ttd : existingItem.TTD,
      ai_decision_id: value.decisionId !== undefined ? value.decisionId : existingItem.ai_decision_id
    };

    // V2: Integrar com PricingAgent para Governança Q1 2026
    try {
      await pricingAgent.calculate({
        customer_id: lead.cCustomer,
        seller_id: req.user?.userId || lead.cUser,
        lead_id: leadId,
        source: 'CRM_UPDATE_ITEM',
        items: [{
          product_id: itemData.cProduct,
          quantity: itemData.qProduct,
          unit_price: itemData.vProduct,
          unit_price_list: itemData.vProductOriginal
        }]
      });
    } catch (pricingError) {
      console.warn('V2 Pricing Policy Warning (Update):', pricingError.message);
      if (pricingError.message.includes('ESTE_PRECO_ESTA_CONGELADO')) {
        return next(Errors.badRequest('Este item pertence a um pedido com preço congelado.'));
      }
    }

    // Feedback 4C Intelligence (ACCEPTED)
    if (value.decisionId) {
      try {
        await fourCService.feedback(value.decisionId, 'ACCEPTED');
      } catch (fError) {
        logger.error('4C Feedback Error (Update):', fError);
      }
    }

    const item = await cartItemRepository.update(itemId, itemData);

    // Função auxiliar para parsear IDs de acessórios
    const parseAccessoryIds = (raw) => {
      if (raw === undefined || raw === null) return [];
      const str = String(raw).trim();
      if (str === '' || str.toLowerCase() === 'null') return [];

      const tokens = str
        .split(/[\s,;|]+/g)
        .map(t => t.trim())
        .filter(Boolean);

      const ids = [];
      for (const t of tokens) {
        const n = Number(t);
        if (!Number.isNaN(n) && Number.isFinite(n) && n > 0) {
          ids.push(Math.trunc(n));
        }
      }
      return ids;
    };

    const updatedAccessories = [];
    const db = getDatabase();
    const productId = existingItem.cProduct;

    // Buscar acessórios do produto atual
    let accessoryIds = [];
    try {
      const [accRows] = await db.execute(
        'SELECT motor, tampo FROM inv WHERE id = ? LIMIT 1',
        [productId]
      );

      if (accRows.length > 0) {
        const motorIds = parseAccessoryIds(accRows[0]?.motor);
        const tampoIds = parseAccessoryIds(accRows[0]?.tampo);
        accessoryIds = Array.from(new Set([
          ...motorIds,
          ...tampoIds
        ].filter((id) => id && id !== productId)));
      }
    } catch (e) {
      console.error('Erro ao buscar acessórios do produto:', e);
    }

    // Se o times foi alterado, atualizar também os acessórios vinculados
    if (value.times !== undefined && value.times !== existingItem.tProduct) {
      try {
        for (const accessoryId of accessoryIds) {
          const existingAccessory = await cartItemRepository.findByLeadIdAndProductId(leadId, accessoryId);
          if (existingAccessory) {
            await cartItemRepository.update(existingAccessory.cCart, {
              ...existingAccessory,
              tProduct: value.times
            });
            updatedAccessories.push({
              id: existingAccessory.cCart,
              productId: accessoryId,
              field: 'times',
              newValue: value.times
            });
          }
        }
      } catch (e) {
        console.error('Erro ao atualizar prazo dos acessórios (motor/tampo):', e);
      }
    }

    // Se a quantidade foi alterada, recalcular quantidade dos acessórios
    // Um acessório pode ser usado por múltiplas máquinas, então precisamos somar todas
    if (value.quantity !== undefined && value.quantity !== existingItem.qProduct) {
      try {
        for (const accessoryId of accessoryIds) {
          // Buscar TODOS os produtos no lead que usam este acessório
          const [productsUsingAccessory] = await db.execute(`
            SELECT c.cProduct, c.qProduct, i.motor, i.tampo
            FROM mak.cart c
            INNER JOIN mak.inv i ON i.id = c.cProduct
            WHERE c.cSCart = ?
              AND c.cProduct != ?
              AND (
                FIND_IN_SET(?, REPLACE(REPLACE(i.motor, ' ', ','), '|', ',')) > 0
                OR FIND_IN_SET(?, REPLACE(REPLACE(i.tampo, ' ', ','), '|', ',')) > 0
              )
          `, [leadId, accessoryId, accessoryId, accessoryId]);

          // Calcular quantidade total necessária do acessório
          // = soma das quantidades de todas as máquinas que usam este acessório
          let totalQuantityNeeded = 0;

          // Adicionar a quantidade do item que acabamos de atualizar
          const updatedProductAccessories = [
            ...parseAccessoryIds((await db.execute('SELECT motor FROM inv WHERE id = ?', [productId]))[0]?.[0]?.motor),
            ...parseAccessoryIds((await db.execute('SELECT tampo FROM inv WHERE id = ?', [productId]))[0]?.[0]?.tampo)
          ];

          if (updatedProductAccessories.includes(accessoryId)) {
            totalQuantityNeeded += parseFloat(value.quantity) || 0;
          }

          // Adicionar quantidades de outras máquinas que usam este acessório
          for (const row of productsUsingAccessory) {
            totalQuantityNeeded += parseFloat(row.qProduct) || 0;
          }

          // Atualizar a quantidade do acessório
          const existingAccessory = await cartItemRepository.findByLeadIdAndProductId(leadId, accessoryId);
          if (existingAccessory && totalQuantityNeeded > 0) {
            const oldQuantity = parseFloat(existingAccessory.qProduct) || 0;
            if (oldQuantity !== totalQuantityNeeded) {
              await cartItemRepository.update(existingAccessory.cCart, {
                ...existingAccessory,
                qProduct: totalQuantityNeeded
              });
              updatedAccessories.push({
                id: existingAccessory.cCart,
                productId: accessoryId,
                field: 'quantity',
                oldValue: oldQuantity,
                newValue: totalQuantityNeeded
              });
            }
          }
        }
      } catch (e) {
        console.error('Erro ao atualizar quantidade dos acessórios (motor/tampo):', e);
      }
    }

    res.json({
      success: true,
      data: item.toJSON(),
      updatedAccessories,
      message: 'Item updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove um item do carrinho
 * DELETE /api/leads/:id/items/:itemId
 */
export async function removeItem(req, res, next) {
  try {
    const leadId = parseInt(req.params.id);
    const itemId = parseInt(req.params.itemId);

    if (isNaN(leadId)) {
      return next(Errors.invalidId('lead'));
    }
    if (isNaN(itemId)) {
      return next(Errors.invalidId('item'));
    }

    // Verificar se o lead existe
    const lead = await leadRepository.findById(leadId);
    if (!lead) {
      return next(Errors.leadNotFound(leadId));
    }

    // Verificar se o item existe e pertence ao lead
    const item = await cartItemRepository.findById(itemId);
    if (!item || item.cSCart !== leadId) {
      return next(Errors.itemNotFound(itemId));
    }

    const productId = item.cProduct;
    const machineQuantity = parseFloat(item.qProduct) || 1;

    // Função auxiliar para parsear IDs de acessórios
    const parseAccessoryIds = (raw) => {
      if (raw === undefined || raw === null) return [];
      const str = String(raw).trim();
      if (str === '' || str.toLowerCase() === 'null') return [];

      const tokens = str
        .split(/[\s,;|]+/g)
        .map(t => t.trim())
        .filter(Boolean);

      const ids = [];
      for (const t of tokens) {
        const n = Number(t);
        if (!Number.isNaN(n) && Number.isFinite(n) && n > 0) {
          ids.push(Math.trunc(n));
        }
      }
      return ids;
    };

    // Remover/diminuir acessórios (motor, tampo) associados à máquina
    const removedAccessories = [];
    const updatedAccessories = [];
    try {
      const db = getDatabase();
      const [accRows] = await db.execute(
        'SELECT motor, tampo FROM inv WHERE id = ? LIMIT 1',
        [productId]
      );

      if (accRows.length > 0) {
        const motorIds = parseAccessoryIds(accRows[0]?.motor);
        const tampoIds = parseAccessoryIds(accRows[0]?.tampo);
        const accessoryIds = Array.from(new Set([
          ...motorIds,
          ...tampoIds
        ].filter((id) => id && id !== productId)));

        for (const accessoryId of accessoryIds) {
          const existingAccessory = await cartItemRepository.findByLeadIdAndProductId(leadId, accessoryId);
          if (existingAccessory) {
            const accessoryQuantity = parseFloat(existingAccessory.qProduct) || 0;

            if (accessoryQuantity <= machineQuantity) {
              // Quantidade do acessório é igual ou menor que a da máquina -> remover acessório
              await cartItemRepository.delete(existingAccessory.cCart);
              removedAccessories.push({
                id: existingAccessory.cCart,
                productId: accessoryId,
                quantity: accessoryQuantity
              });
            } else {
              // Quantidade do acessório é maior -> diminuir quantidade
              const newQuantity = accessoryQuantity - machineQuantity;
              await cartItemRepository.update(existingAccessory.cCart, {
                ...existingAccessory,
                qProduct: newQuantity
              });
              updatedAccessories.push({
                id: existingAccessory.cCart,
                productId: accessoryId,
                oldQuantity: accessoryQuantity,
                newQuantity: newQuantity
              });
            }
          }
        }
      }
    } catch (e) {
      // Não falhar a remoção do item principal por erro nos acessórios
      console.error('Erro ao remover/atualizar acessórios (motor/tampo):', e);
    }

    // Remover o item principal (máquina)
    await cartItemRepository.delete(itemId);

    res.json({
      success: true,
      message: 'Item removed successfully',
      removedAccessories,
      updatedAccessories
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Calcula totais do carrinho
 * GET /api/leads/:id/totals
 */
export async function calculateTotals(req, res, next) {
  try {
    const leadId = parseInt(req.params.id);

    if (isNaN(leadId)) {
      return next(Errors.invalidId('lead'));
    }

    // Verificar se o lead existe
    const lead = await leadRepository.findById(leadId);
    if (!lead) {
      return next(Errors.leadNotFound(leadId));
    }

    const totals = await cartItemRepository.calculateTotals(leadId);

    // Adicionar frete ao total
    const freight = parseFloat(lead.vFreight) || 0;
    totals.freight = freight;
    totals.grandTotal = totals.total + freight;
    totals.consumerGrandTotal = totals.consumerTotal + freight;

    // Cálculo de Lucratividade / Comissão (seguindo lógica K3)
    // margin = vcTotal - vTotal
    // descFP = vcTotal * overcharge / 100
    // descFed = margin * 8.2%
    // descIcms = margin * 8.8%
    // commission = margin - descFed - descFP - descIcms

    if (lead.cCC > 0) {
      // Buscar overcharge da forma de pagamento
      const [fpRows] = await getDatabase().execute(
        'SELECT overcharge FROM mak.payment_types WHERE id_payment_type = ?',
        [lead.cPaymentType || 1]
      );
      const overcharge = fpRows[0]?.overcharge || 0;

      const margin = totals.consumerGrandTotal - totals.grandTotal;
      const descFP = (totals.consumerGrandTotal * overcharge) / 100;
      const descFed = margin * 0.082;
      const descIcms = margin * 0.088;

      const commission = margin - descFed - descFP - descIcms;
      const marginPercent = totals.consumerGrandTotal > 0 ? (commission / totals.consumerGrandTotal) * 100 : 0;

      totals.profitability = {
        margin,
        descFP,
        descFed,
        descIcms,
        commission: parseFloat(commission.toFixed(2)),
        marginPercent: parseFloat(marginPercent.toFixed(2))
      };
    } else {
      // Para leads sem Revendedor, a "lucratividade" pode ser simplificada 
      // ou baseada em outra regra. No momento, vamos apenas indicar que não se aplica 
      // o cálculo de comissão de revenda.
      totals.profitability = null;
    }

    // V2: Inclusão de análise de Governança (Checklist 2.3)
    try {
      const items = await cartItemRepository.findByLeadId(leadId);
      const v2Context = {
        customer_id: lead.cCustomer,
        seller_id: req.user?.userId || lead.cUser,
        lead_id: leadId,
        items: items.map(it => ({
          product_id: it.cProduct,
          quantity: it.qProduct,
          unit_price: it.vProduct,
          unit_price_list: it.vProductOriginal
        }))
      };

      const v2Evaluation = await pricingAgent.calculate(v2Context);
      totals.v2Evaluation = v2Evaluation;
    } catch (v2Error) {
      console.warn('V2 Pricing Evaluation Skip:', v2Error.message);
    }

    res.json({
      success: true,
      data: totals
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Converte um lead para pedido real
 * POST /api/leads/:id/convert
 * Body opcional: { remarks: { finance, logistic, nfe, obs, manager }, cTransporter }
 */
export async function convertToOrder(req, res, next) {
  try {
    const leadId = parseInt(req.params.id);

    if (isNaN(leadId)) {
      return next(Errors.invalidId('lead'));
    }

    // Validação do body
    const { error, value } = convertLeadSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return next(Errors.validation(error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))));
    }

    // 1. Buscar o lead
    let lead = await leadRepository.findById(leadId);
    if (!lead) {
      return next(Errors.leadNotFound(leadId));
    }

    // 2. Verificar se já é um pedido
    if (lead.cType === 2 || lead.cOrderWeb) {
      return next(Errors.leadAlreadyConverted(leadId));
    }

    // 3. Atualizar lead se houver dados no body
    if (value.remarks || value.cTransporter !== undefined) {
      const updateData = {
        ...lead,
        xRemarksFinance: value.remarks?.finance !== undefined ? value.remarks.finance : lead.xRemarksFinance,
        xRemarksLogistic: value.remarks?.logistic !== undefined ? value.remarks.logistic : lead.xRemarksLogistic,
        xRemarksNFE: value.remarks?.nfe !== undefined ? value.remarks.nfe : lead.xRemarksNFE,
        xRemarksOBS: value.remarks?.obs !== undefined ? value.remarks.obs : lead.xRemarksOBS,
        xRemarksManager: value.remarks?.manager !== undefined ? value.remarks.manager : lead.xRemarksManager,
        cTransporter: value.cTransporter !== undefined ? value.cTransporter : lead.cTransporter,
        cUpdated: 1
      };

      await leadRepository.update(leadId, updateData);
      lead = await leadRepository.findById(leadId); // Re-buscar lead atualizado
    }

    // 4. Buscar os itens do carrinho
    const items = await cartItemRepository.findByLeadId(leadId);
    if (items.length === 0) {
      return next(Errors.emptyCart());
    }

    // 5. Executar a conversão
    const userId = req.user.userId; // Usuário logado
    const orderId = await orderRepository.createFromLead(lead, items, userId);

    // V2: Congelar preço para Governança Q1 2026
    try {
      await pricingAgent.freeze(orderId);
    } catch (freezeError) {
      console.error('V2 Pricing Freeze Error:', freezeError.message);
    }

    // Audit log
    await auditLog.logLeadConvert(
      leadId,
      orderId,
      req.user?.userId,
      req.user?.username,
      req
    );

    // Invalidar cache de Customer Goals do vendedor
    // Garante que a página Metas por Cliente reflita a nova venda
    try {
      const sellerId = lead.cUser; // Vendedor do lead
      if (sellerId) {
        await CacheService.invalidateCustomerGoalsBySeller(sellerId);
        logger.info('CustomerGoals cache invalidated after lead conversion', {
          leadId,
          orderId,
          sellerId
        });
      }
    } catch (cacheError) {
      logger.warn('Failed to invalidate CustomerGoals cache', {
        error: cacheError.message
      });
    }

    // Feedback 4C Intelligence (CONVERTED)
    try {
      const aiItems = items.filter(it => it.aiDecisionId);
      if (aiItems.length > 0) {
        // Enviar feedback para cada decisão única
        const uniqueDecisions = [...new Set(aiItems.map(it => it.aiDecisionId))];
        for (const decisionId of uniqueDecisions) {
          await fourCService.feedback(decisionId, 'CONVERTED');
        }
      }
    } catch (fError) {
      logger.error('4C Feedback Error (Convert):', fError);
    }

    res.json({
      success: true,
      data: { orderId },
      message: `Lead successfully converted to Order #${orderId}`
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Calcula impostos para todos os itens do lead
 * POST /api/leads/:id/taxes
 */
export async function calculateLeadTaxes(req, res, next) {
  try {
    const leadId = parseInt(req.params.id);
    if (isNaN(leadId)) {
      return next(Errors.invalidId('lead'));
    }

    const lead = await leadRepository.findById(leadId);
    if (!lead) {
      return next(Errors.leadNotFound(leadId));
    }

    const items = await cartItemRepository.findByLeadId(leadId);
    if (items.length === 0) return res.json({ success: true, data: [], message: 'No items to calculate' });

    // Buscar UF do emitente (usando mak.Emitentes)
    const [emitRows] = await getDatabase().execute(
      'SELECT UF FROM mak.Emitentes WHERE EmitentePOID = ?',
      [lead.cEmitUnity || 1]
    );
    const emitUF = emitRows[0]?.UF || 'SP';

    const results = [];
    for (const item of items) {
      // Buscar regras
      const rules = await taxRepository.getTaxRules({
        state: lead.customer?.estado || 'SP',
        peopleType: lead.customer?.tipo_pessoa || 'J', // Fallback
        ncm: item.product?.ncm || '',
        origin: 1, // Padrão Nacional/Importado (ajustar se tiver no model)
        emitState: emitUF
      });

      if (rules) {
        const taxes = taxRepository.calculateItemTaxes(item, lead, rules);

        // Atualizar item no banco
        await cartItemRepository.update(item.id, {
          productId: item.cProduct,
          quantity: item.qProduct,
          price: item.vProduct,
          consumerPrice: item.vProductCC,
          originalPrice: item.vProductOriginal,
          times: item.tProduct,
          ttd: item.TTD,
          ipi: taxes.ipi,
          st: taxes.st
        });

        results.push({
          itemId: item.id,
          product: item.product?.model,
          ipi: taxes.ipi,
          st: taxes.st,
          rules: taxes.rules
        });
      }
    }

    res.json({
      success: true,
      data: results,
      message: 'Taxes calculated and updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Busca segmentos únicos dos leads
 * GET /api/leads/segments
 * Cached: 1 hora
 */
export async function getSegments(req, res, next) {
  try {
    const segments = await CacheService.getSegments(async () => {
      // Use findAllSegments to get id/name pairs instead of just unique IDs
      return await leadRepository.findAllSegments();
    });
    res.json({
      success: true,
      data: segments
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Busca Naturezas de Operação (NOP)
 * GET /api/leads/metadata/nops
 * Cached: 1 hora
 */
export async function getNops(req, res, next) {
  try {
    const data = await CacheService.getNops(async () => {
      const [rows] = await getDatabase().execute(
        'SELECT id_nop as id, nop as name, tipo FROM mak.nop ORDER BY nop ASC'
      );
      return rows;
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * Busca Transportadoras
 * GET /api/leads/metadata/transporters
 * Cached: 1 hora
 */
export async function getTransporters(req, res, next) {
  try {
    const data = await CacheService.getTransporters(async () => {
      const [rows] = await getDatabase().execute(
        'SELECT id, nome as name FROM mak.transportadora WHERE ativa = 1 ORDER BY nome ASC'
      );
      return rows;
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * Busca Tipos de Pagamento
 * GET /api/leads/metadata/payment-types
 */
export async function getPaymentTypes(req, res, next) {
  try {
    const data = await leadRepository.findPaymentTypes();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * Busca Prazos de Pagamento
 * GET /api/leads/metadata/payment-terms
 */
export async function getPaymentTerms(req, res, next) {
  try {
    const data = await leadRepository.findPaymentTerms();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * Busca Unidades Emitentes
 * GET /api/leads/metadata/units
 * Cached: 1 hora
 */
export async function getUnits(req, res, next) {
  try {
    const data = await CacheService.getUnits(async () => {
      const [rows] = await getDatabase().execute(
        'SELECT EmitentePOID as id, Fantasia as name, UF FROM mak.Emitentes ORDER BY Fantasia ASC'
      );
      return rows;
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * Busca a transportadora mais usada por um cliente
 * GET /api/leads/metadata/customer-transporter?customerId=123
 */
export async function getCustomerTransporter(req, res, next) {
  try {
    const customerId = parseInt(req.query.customerId);

    if (!customerId || isNaN(customerId)) {
      return next(Errors.missingField('customerId'));
    }

    // Buscar transportadora mais usada nos leads (sCart) e pedidos (orders)
    // Priorizar a mais recente em caso de empate
    const [rows] = await getDatabase().execute(
      `SELECT 
        cTransporter as transporterId,
        COUNT(*) as usageCount,
        MAX(dCart) as lastUsed
      FROM (
        SELECT cTransporter, dCart 
        FROM mak.sCart 
        WHERE cCustomer = ? AND cTransporter IS NOT NULL AND cTransporter > 0
        UNION ALL
        SELECT idtr as cTransporter, data as dCart
        FROM mak.hoje
        WHERE idcli = ? AND idtr IS NOT NULL AND idtr > 0
      ) AS combined
      GROUP BY cTransporter
      ORDER BY usageCount DESC, lastUsed DESC
      LIMIT 1`
      , [customerId, customerId]);

    if (rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No transporter found for this customer'
      });
    }

    const transporterId = rows[0].transporterId;

    // Buscar detalhes da transportadora
    const [transporterRows] = await getDatabase().execute(
      'SELECT id, nome as name FROM mak.transportadora WHERE id = ? AND ativa = 1',
      [transporterId]
    );

    if (transporterRows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'Transporter not found or inactive'
      });
    }

    res.json({
      success: true,
      data: {
        id: transporterRows[0].id,
        name: transporterRows[0].name,
        usageCount: rows[0].usageCount,
        lastUsed: rows[0].lastUsed
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Exporta leads para Excel
 * GET /api/leads/export?type=1&dateFrom=2024-01-01&dateTo=2024-12-31
 */
export async function exportLeads(req, res, next) {
  try {
    // Importar serviço de exportação dinamicamente
    const { exportLeadsToExcel, exportLeadDetailToExcel } = await import('../services/export.service.js');

    const leadId = req.query.leadId ? parseInt(req.query.leadId) : null;

    // Se for exportação de um único lead com detalhes
    if (leadId) {
      const lead = await leadRepository.findById(leadId);
      if (!lead) {
        return next(Errors.leadNotFound(leadId));
      }

      // Verificar permissões
      const userLevel = req.user?.level || 0;
      const currentUserId = req.user?.userId;
      if (userLevel <= 4 && lead.cUser !== currentUserId) {
        return res.status(403).json({
          success: false,
          error: { message: 'Sem permissão para exportar este lead' }
        });
      }

      // Buscar itens
      const items = await cartItemRepository.findByLeadId(leadId);
      const leadData = lead.toJSON();
      leadData.items = items.map(item => item.toJSON());

      const buffer = await exportLeadDetailToExcel(leadData);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="lead_${leadId}.xlsx"`);
      return res.send(buffer);
    }

    // Exportação de múltiplos leads
    const filters = {};
    const userLevel = req.user?.level || 0;
    const currentUserId = req.user?.userId;

    // Filtros de permissão
    if (userLevel <= 4) {
      filters.userId = currentUserId;
    }

    // Filtros da query string
    if (req.query.type !== undefined) filters.type = parseInt(req.query.type);
    if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
    if (req.query.dateTo) filters.dateTo = req.query.dateTo;
    if (req.query.cSegment) filters.cSegment = req.query.cSegment;
    if (req.query.sellerId && userLevel > 4) filters.sellerId = parseInt(req.query.sellerId);
    if (req.query.sellerSegmento && userLevel > 4) filters.sellerSegmento = req.query.sellerSegmento;

    // Status padrão: leads em aberto
    if (filters.type === undefined) {
      filters.type = 1;
    }

    // Limitar a 1000 registros para evitar problemas de memória
    const limit = Math.min(parseInt(req.query.limit) || 1000, 1000);

    const result = await leadRepository.findAll(filters, { page: 1, limit }, false);
    const leads = result.data.map(lead => lead.toJSON());

    const buffer = await exportLeadsToExcel(leads);

    // Gerar nome do arquivo
    const date = new Date().toISOString().split('T')[0];
    const filename = `leads_export_${date}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

/**
 * Busca o histórico de alterações de um lead
 * GET /api/leads/:id/history
 */
export async function getLeadHistory(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return next(Errors.invalidId('lead'));
    }

    // Verificar se o lead existe
    const lead = await leadRepository.findById(id);
    if (!lead) {
      return next(Errors.leadNotFound(id));
    }

    // Verificar permissões
    const userLevel = req.user?.level || 0;
    const currentUserId = req.user?.userId;
    if (userLevel <= 4 && lead.cUser !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Sem permissão para acessar este lead' }
      });
    }

    // Buscar logs do audit
    const logs = await auditLog.findLogs({
      resourceType: 'lead',
      resourceId: String(id),
      limit: 100
    });

    // Formatar logs para timeline
    const actionLabels = {
      'LEAD_CREATE': { label: 'Lead criado', icon: 'add_circle', color: 'success' },
      'LEAD_UPDATE': { label: 'Lead atualizado', icon: 'edit', color: 'primary' },
      'LEAD_DELETE': { label: 'Lead excluído', icon: 'delete', color: 'error' },
      'LEAD_CONVERT': { label: 'Convertido em pedido', icon: 'check_circle', color: 'success' },
      'ITEM_ADD': { label: 'Item adicionado', icon: 'add_shopping_cart', color: 'info' },
      'ITEM_UPDATE': { label: 'Item atualizado', icon: 'shopping_cart', color: 'primary' },
      'ITEM_DELETE': { label: 'Item removido', icon: 'remove_shopping_cart', color: 'warning' }
    };

    const history = logs.map(log => {
      const actionInfo = actionLabels[log.action] || { label: log.action, icon: 'info', color: 'default' };

      // Tentar parsear os valores JSON
      let oldValue = null;
      let newValue = null;
      let metadata = null;
      let changes = [];

      try { oldValue = log.old_value ? JSON.parse(log.old_value) : null; } catch (e) { }
      try { newValue = log.new_value ? JSON.parse(log.new_value) : null; } catch (e) { }
      try { metadata = log.metadata ? JSON.parse(log.metadata) : null; } catch (e) { }

      // Calcular mudanças específicas
      if (oldValue && newValue && log.action === 'LEAD_UPDATE') {
        const fieldsToTrack = [
          { key: 'customerId', label: 'Cliente' },
          { key: 'freight', label: 'Frete' },
          { key: 'paymentType', label: 'Tipo de Pagamento' },
          { key: 'paymentTerms', label: 'Condições de Pagamento' },
          { key: 'deliveryDate', label: 'Data de Entrega' },
          { key: 'remarks', label: 'Observações' },
          { key: 'buyer', label: 'Comprador' },
          { key: 'purchaseOrder', label: 'Pedido de Compra' }
        ];

        for (const field of fieldsToTrack) {
          const oldVal = oldValue[field.key];
          const newVal = newValue[field.key];
          if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changes.push({
              field: field.label,
              oldValue: oldVal,
              newValue: newVal
            });
          }
        }
      }

      return {
        id: log.id,
        action: log.action,
        label: actionInfo.label,
        icon: actionInfo.icon,
        color: actionInfo.color,
        userName: log.user_name,
        userId: log.user_id,
        createdAt: log.created_at,
        ipAddress: log.ip_address,
        changes,
        metadata,
        hasDetails: changes.length > 0 || metadata !== null
      };
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Envia o lead por email
 * POST /api/leads/:id/send-email
 */
export async function sendLeadEmail(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return next(Errors.invalidId('lead'));
    }

    // Buscar lead
    const lead = await leadRepository.findById(id);
    if (!lead) {
      return next(Errors.leadNotFound(id));
    }

    // Verificar permissões
    const userLevel = req.user?.level || 0;
    const currentUserId = req.user?.userId;
    if (userLevel <= 4 && lead.cUser !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Sem permissão para enviar email deste lead' }
      });
    }

    // Validar email
    const { email, cc, customMessage, senderName } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email do destinatário é obrigatório' }
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Formato de email inválido' }
      });
    }

    // Buscar itens do lead
    const items = await cartItemRepository.findByLeadId(id);
    const leadData = lead.toJSON();
    leadData.items = items.map(item => item.toJSON());

    // Importar serviço de email dinamicamente
    const { sendLeadQuotation } = await import('../services/email.service.js');

    // Enviar email
    const result = await sendLeadQuotation(leadData, email, {
      senderName: senderName || req.user?.username || 'Equipe Comercial',
      customMessage: customMessage || '',
      includeItems: true,
      ccEmails: cc ? (Array.isArray(cc) ? cc : [cc]) : []
    });

    // Registrar no audit log
    await auditLog.logEvent(
      'EMAIL_SENT',
      req.user?.userId,
      req.user?.username,
      `Cotação #${id} enviada para ${email}`,
      req,
      { leadId: id, recipientEmail: email, testMode: result.testMode || false }
    );

    res.json({
      success: true,
      data: {
        messageId: result.messageId,
        recipientEmail: email,
        testMode: result.testMode || false
      },
      message: result.testMode
        ? 'Email simulado (modo de teste - configure SMTP_USER e SMTP_PASS)'
        : `Cotação enviada com sucesso para ${email}`
    });
  } catch (error) {
    logger.error('Erro ao enviar email:', error);
    next(error);
  }
}
