import axios from 'axios';
import Joi from 'joi';
import { getDatabase } from '../config/database.js';

const db = () => getDatabase();

// Schema de validação para item do carrinho
const orderItemSchema = Joi.object({
  sku_id: Joi.number().integer().required(),
  quantity: Joi.number().positive().required(),
  model: Joi.string().optional().allow('', null)
});

// Schema de validação para calcular preço
const calculatePriceSchema = Joi.object({
  org_id: Joi.number().integer().required(),
  brand_id: Joi.number().integer().required(),
  customer_id: Joi.number().integer().required(),
  sku_id: Joi.number().integer().required(),
  sku_qty: Joi.number().positive().required(),
  order_value: Joi.number().min(0).required(),
  product_brand: Joi.string().optional().allow('', null),
  product_model: Joi.string().optional().allow('', null),
  // Campos opcionais para pricing avançado
  payment_term: Joi.string().optional().default('standard'),
  installments: Joi.number().integer().min(0).optional().default(1),
  stock_level: Joi.string().optional().default('normal'),
  machine_curve: Joi.string().optional().default('A'),
  // Todos os itens do carrinho
  order_items: Joi.array().items(orderItemSchema).optional().default([])
});

const PRICING_API_BASE = process.env.PRICING_API_URL || 'https://csuite.vallery.com.br/pricing';
const PRICING_API_URL = PRICING_API_BASE.endsWith('/run') ? PRICING_API_BASE : `${PRICING_API_BASE}/run`;
const PRICING_API_KEY = process.env.PRICING_API_KEY || 'eff0bf9efe8238b433f2587153c0c8209c4737e6a56fa90018308500678cafd5';

/**
 * Calcula preço usando o serviço de pricing
 * POST /api/pricing/calculate
 */
export async function calculatePrice(req, res, next) {
  try {
    // Validação
    const { error, value } = calculatePriceSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation error',
          details: error.details.map(d => d.message)
        }
      });
    }

    // Preparar dados para a API de pricing
    const pricingData = {
      org_id: value.org_id,
      brand_id: value.brand_id,
      customer_id: value.customer_id,
      sku_id: value.sku_id,
      sku_qty: value.sku_qty,
      order_value: value.order_value,
      product_brand: value.product_brand || '',
      product_model: value.product_model || '',
      payment_term: value.payment_term,
      installments: value.installments,
      stock_level: value.stock_level,
      machine_curve: value.machine_curve,
      order_items: value.order_items || []
    };

    // Fazer requisição para a API de pricing
    const response = await axios.post(PRICING_API_URL, pricingData, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': PRICING_API_KEY
      },
      timeout: 30000 // 30 segundos
    });

    // Retornar resposta da API de pricing
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    // Tratar erros da API de pricing
    if (error.response) {
      // A API de pricing retornou um erro
      return res.status(error.response.status || 500).json({
        success: false,
        error: {
          message: 'Pricing API error',
          details: error.response.data || error.message
        }
      });
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      return res.status(503).json({
        success: false,
        error: {
          message: 'Pricing API unavailable',
          details: 'The pricing service did not respond'
        }
      });
    } else {
      // Erro ao configurar a requisição
      return res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error',
          details: error.message
        }
      });
    }
  }
}

export async function listLaunchProducts(req, res, next) {
  try {
    const [rows] = await db().execute(`
      SELECT
        plp.*,
        i.marca as product_brand,
        i.modelo as product_model,
        i.nome as product_name
      FROM csuite_pricing.pricing_launch_products plp
      LEFT JOIN inv i ON plp.sku_id = i.id
      WHERE plp.is_active = 1
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

export async function listQuantityDiscounts(req, res, next) {
  try {
    const [rows] = await db().execute(`
      SELECT 
        pqd.id,
        pqd.sku_id,
        pqd.brand_id,
        pqd.product_family,
        pqd.min_quantity,
        pqd.max_quantity,
        pqd.price,
        pqd.discount_pct,
        pqd.description,
        i.marca as product_brand,
        i.modelo as product_model
      FROM csuite_pricing.pricing_quantity_discounts pqd
      LEFT JOIN inv i ON pqd.sku_id = i.id
      WHERE pqd.is_active = 1
      ORDER BY pqd.priority DESC, pqd.min_quantity ASC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lista preços fixos de um cliente
 * GET /api/pricing/customer-fixed-prices/:customerId
 */
export async function listCustomerFixedPrices(req, res, next) {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.json({ success: true, data: [] });
    }

    const [rows] = await db().execute(`
      SELECT 
        pcfp.id,
        pcfp.customer_id,
        pcfp.sku_id,
        pcfp.fixed_price,
        pcfp.original_pt_at_agreement,
        pcfp.discount_from_pt,
        pcfp.valid_from,
        pcfp.valid_until,
        pcfp.notes,
        i.marca as product_brand,
        i.modelo as product_model,
        i.nome as product_name
      FROM csuite_pricing.pricing_customer_fixed_prices pcfp
      LEFT JOIN inv i ON pcfp.sku_id = i.id
      WHERE pcfp.customer_id = ?
        AND pcfp.is_active = 1
        AND CURDATE() BETWEEN pcfp.valid_from AND pcfp.valid_until
      ORDER BY pcfp.sku_id
    `, [customerId]);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lista bundles ativos com seus itens
 * GET /api/pricing/bundles
 */
export async function listBundles(req, res, next) {
  try {
    // Buscar bundles ativos
    const [bundles] = await db().execute(`
      SELECT 
        pb.id,
        pb.name,
        pb.description,
        pb.discount_pct,
        pb.discount_type
      FROM csuite_pricing.pricing_bundles pb
      WHERE pb.is_active = 1
      ORDER BY pb.priority DESC, pb.name
    `);

    // Buscar itens de todos os bundles ativos
    const bundleIds = bundles.map(b => b.id);
    let items = [];

    if (bundleIds.length > 0) {
      const placeholders = bundleIds.map(() => '?').join(',');
      const [itemRows] = await db().execute(`
        SELECT 
          pbi.bundle_id,
          pbi.sku_id,
          pbi.product_family,
          pbi.min_quantity,
          i.marca as product_brand,
          i.modelo as product_model,
          i.nome as product_name
        FROM csuite_pricing.pricing_bundle_items pbi
        LEFT JOIN inv i ON pbi.sku_id = i.id
        WHERE pbi.bundle_id IN (${placeholders})
      `, bundleIds);
      items = itemRows;
    }

    // Agrupar itens por bundle
    const bundlesWithItems = bundles.map(bundle => ({
      ...bundle,
      items: items.filter(item => item.bundle_id === bundle.id)
    }));

    res.json({
      success: true,
      data: bundlesWithItems
    });
  } catch (error) {
    next(error);
  }
}
