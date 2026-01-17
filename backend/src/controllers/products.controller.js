import { ProductRepository } from '../repositories/product.repository.js';
import FavoriteProductRepository from '../repositories/favoriteProduct.repository.js';
import Joi from 'joi';

const productRepository = new ProductRepository();

// Schema de validação para busca
const searchSchema = Joi.object({
  search: Joi.string().allow('').optional(),
  segment: Joi.string().optional(),
  segmentId: Joi.number().integer().optional(),
  category: Joi.string().optional(),
  ncm: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  simple: Joi.string().allow('1', 'true', '0', 'false').optional() // Permite formato simplificado
});

/**
 * Busca produtos
 * GET /api/products?search=termo&category=ROLAMENTOS&page=1&limit=20
 */
export async function searchProducts(req, res, next) {
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
    if (value.segment) filters.segment = value.segment;
    if (value.segmentId) filters.segmentId = value.segmentId;
    if (value.category) filters.category = value.category;
    if (value.ncm) filters.ncm = value.ncm;

    const result = await productRepository.search(
      value.search || '',
      filters,
      { page: value.page, limit: value.limit }
    );

    // Buscar estoque em lote para os produtos retornados
    const productIds = result.data.map(p => p.id);
    const stockMap = await productRepository.getStockForProducts(productIds);

    // Usar formato simplificado para listagem
    const simple = req.query.simple === 'true' || req.query.simple === '1';

    res.json({
      success: true,
      data: result.data.map(product => {
        const json = simple ? product.toSimpleJSON() : product.toJSON();
        json.estoque = parseInt(stockMap.get(product.id)) || 0;
        return json;
      }),
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Busca um produto por ID
 * GET /api/products/:id
 */
export async function getProductById(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid product ID' }
      });
    }

    const product = await productRepository.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: { message: 'Product not found' }
      });
    }

    res.json({
      success: true,
      data: product.toJSON()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Busca dados enriquecidos de um produto (para modal de detalhes)
 * GET /api/products/:id/details
 */
export async function getEnrichedProductById(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'ID do produto inválido' }
      });
    }

    const product = await productRepository.findEnrichedById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: { message: 'Produto não encontrado' }
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lista produtos por categoria
 * GET /api/products/category/:category?limit=50
 */
export async function getProductsByCategory(req, res, next) {
  try {
    const { category } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: { message: 'Limit must be between 1 and 100' }
      });
    }

    const products = await productRepository.findByCategory(category, limit);

    res.json({
      success: true,
      data: products.map(product => product.toSimpleJSON())
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lista produtos por segmento
 * GET /api/products/segment/:segment?limit=50
 */
export async function getProductsBySegment(req, res, next) {
  try {
    const { segment } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: { message: 'Limit must be between 1 and 100' }
      });
    }

    const products = await productRepository.findBySegment(segment, limit);

    res.json({
      success: true,
      data: products.map(product => product.toSimpleJSON())
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lista categorias disponíveis
 * GET /api/products/categories
 */
export async function getCategories(req, res, next) {
  try {
    const categories = await productRepository.getCategories();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lista segmentos disponíveis
 * GET /api/products/segments
 */
export async function getSegments(req, res, next) {
  try {
    const segments = await productRepository.getSegments();

    res.json({
      success: true,
      data: segments
    });
  } catch (error) {
    next(error);
  }
}

// ========== FAVORITOS ==========

/**
 * Lista produtos favoritos do vendedor
 * GET /api/products/favorites
 */
export async function getFavorites(req, res, next) {
  try {
    const sellerId = req.user?.id;

    // Se não está autenticado, retorna lista vazia (não 401)
    // Isso evita redirect para /login no frontend
    if (!sellerId) {
      return res.json({
        success: true,
        data: [],
        total: 0
      });
    }

    const favorites = await FavoriteProductRepository.getFavorites(sellerId);

    res.json({
      success: true,
      data: favorites,
      total: favorites.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Adiciona produto aos favoritos
 * POST /api/products/:id/favorite
 */
export async function addFavorite(req, res, next) {
  try {
    const sellerId = req.user?.id;
    const productId = parseInt(req.params.id);

    if (!sellerId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Autenticação necessária' }
      });
    }

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'ID do produto inválido' }
      });
    }

    await FavoriteProductRepository.addFavorite(sellerId, productId);

    res.json({
      success: true,
      message: 'Produto adicionado aos favoritos',
      data: { productId, isFavorite: true }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove produto dos favoritos
 * DELETE /api/products/:id/favorite
 */
export async function removeFavorite(req, res, next) {
  try {
    const sellerId = req.user?.id;
    const productId = parseInt(req.params.id);

    if (!sellerId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Autenticação necessária' }
      });
    }

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'ID do produto inválido' }
      });
    }

    await FavoriteProductRepository.removeFavorite(sellerId, productId);

    res.json({
      success: true,
      message: 'Produto removido dos favoritos',
      data: { productId, isFavorite: false }
    });
  } catch (error) {
    next(error);
  }
}

// ========== ESTOQUE POR UNIDADE ==========

/**
 * Busca estoque de um produto por unidade/depósito
 * GET /api/products/:id/stock-by-warehouse
 */
export async function getStockByWarehouse(req, res, next) {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'ID do produto inválido' }
      });
    }

    const stockData = await productRepository.getStockByWarehouse(productId);

    res.json({
      success: true,
      data: stockData
    });
  } catch (error) {
    console.error('Erro getStockByWarehouse:', error);
    next(error);
  }
}

/**
 * Previsão de reposição de estoque (4.1.5)
 * GET /api/products/:id/replenishment
 */
export async function getReplenishmentForecast(req, res, next) {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'ID do produto inválido' }
      });
    }

    const forecast = await productRepository.getReplenishmentForecast(productId);

    res.json({
      success: true,
      data: forecast
    });
  } catch (error) {
    console.error('Erro getReplenishmentForecast:', error);
    next(error);
  }
}

/**
 * Invalida cache de estoque (4.1.6)
 * POST /api/products/:id/invalidate-stock-cache
 */
export async function invalidateStockCache(req, res, next) {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'ID do produto inválido' }
      });
    }

    await productRepository.invalidateStockCache(productId);

    res.json({
      success: true,
      message: `Cache de estoque invalidado para produto ${productId}`
    });
  } catch (error) {
    console.error('Erro invalidateStockCache:', error);
    next(error);
  }
}

/**
 * Calcula tempo de entrega (4.2.6)
 * GET /api/products/delivery-time?origin=SP&destination=RJ
 */
export async function getDeliveryTime(req, res, next) {
  try {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: { message: 'UF de origem e destino são obrigatórios' }
      });
    }

    const deliveryTime = productRepository.getDeliveryTime(origin, destination);

    res.json({
      success: true,
      data: {
        origin,
        destination,
        ...deliveryTime
      }
    });
  } catch (error) {
    console.error('Erro getDeliveryTime:', error);
    next(error);
  }
}

// ========== HISTÓRICO DE PREÇOS ==========

/**
 * Busca histórico de preços de um produto (últimos 12 meses)
 * GET /api/products/:id/price-history
 */
export async function getPriceHistory(req, res, next) {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'ID do produto inválido' }
      });
    }

    const priceHistory = await productRepository.getPriceHistory(productId);

    res.json({
      success: true,
      data: priceHistory
    });
  } catch (error) {
    console.error('Erro getPriceHistory:', error);
    next(error);
  }
}

// ========== HISTÓRICO DE BUSCAS E TRENDING ==========

import searchHistoryRepository from '../repositories/searchHistory.repository.js';

/**
 * Registra uma busca do vendedor
 * POST /api/products/log-search
 */
export async function logSearch(req, res, next) {
  try {
    const sellerId = req.user?.id;
    const { searchTerm, productId } = req.body;

    if (!sellerId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Autenticação necessária' }
      });
    }

    await searchHistoryRepository.logSearch(sellerId, searchTerm, productId);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro logSearch:', error);
    next(error);
  }
}

/**
 * Busca histórico de buscas do vendedor
 * GET /api/products/search-history
 */
export async function getSearchHistory(req, res, next) {
  try {
    const sellerId = req.user?.id;

    if (!sellerId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Autenticação necessária' }
      });
    }

    const history = await searchHistoryRepository.getSellerHistory(sellerId);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Erro getSearchHistory:', error);
    next(error);
  }
}

/**
 * Busca produtos mais buscados (trending)
 * GET /api/products/trending
 */
export async function getTrendingProducts(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const trending = await searchHistoryRepository.getTrendingProducts(limit);

    res.json({
      success: true,
      data: trending
    });
  } catch (error) {
    console.error('Erro getTrendingProducts:', error);
    next(error);
  }
}

/**
 * Busca termos mais buscados
 * GET /api/products/trending-terms
 */
export async function getTrendingTerms(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const trending = await searchHistoryRepository.getTrendingTerms(limit);

    res.json({
      success: true,
      data: trending
    });
  } catch (error) {
    console.error('Erro getTrendingTerms:', error);
    next(error);
  }
}

/**
 * Busca produtos recentes do vendedor
 * GET /api/products/recent
 */
export async function getRecentProducts(req, res, next) {
  try {
    const sellerId = req.user?.id;
    const limit = Math.min(parseInt(req.query.limit) || 20, 20); // Max 20

    if (!sellerId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Autenticação necessária' }
      });
    }

    const recentProducts = await searchHistoryRepository.getRecentProducts(sellerId, limit);

    res.json({
      success: true,
      data: recentProducts
    });
  } catch (error) {
    console.error('Erro getRecentProducts:', error);
    next(error);
  }
}

// ========== BUSCA INTELIGENTE ==========

import SmartSearchService from '../services/smartSearch.service.js';

/**
 * Busca sugestões "Did you mean?"
 * GET /api/products/suggestions?q=termo
 */
export async function getSuggestions(req, res, next) {
  try {
    const { q: searchTerm } = req.query;
    const limit = parseInt(req.query.limit) || 5;

    if (!searchTerm || searchTerm.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const suggestions = await SmartSearchService.getSuggestions(searchTerm, limit);

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Erro getSuggestions:', error);
    next(error);
  }
}

/**
 * Expande termo com sinônimos
 * GET /api/products/expand-synonyms?q=termo
 */
export async function expandSynonyms(req, res, next) {
  try {
    const { q: searchTerm } = req.query;

    if (!searchTerm) {
      return res.json({ success: true, data: { original: '', expanded: [] } });
    }

    const expanded = SmartSearchService.expandWithSynonyms(searchTerm);

    res.json({
      success: true,
      data: {
        original: searchTerm,
        expanded
      }
    });
  } catch (error) {
    console.error('Erro expandSynonyms:', error);
    next(error);
  }
}

/**
 * Busca fuzzy com tolerância a erros
 * GET /api/products/fuzzy-search?q=termo
 */
export async function fuzzySearch(req, res, next) {
  try {
    const { q: searchTerm } = req.query;
    const limit = parseInt(req.query.limit) || 10;

    if (!searchTerm || searchTerm.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const results = await SmartSearchService.searchWithFuzzyMatch(searchTerm, limit);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Erro fuzzySearch:', error);
    next(error);
  }
}
