/**
 * Serviço de Cache Centralizado - Q3.1 Performance
 * Gerencia cache Redis com TTLs configuráveis e keys padronizadas
 */
import { cacheGet, cacheSet, cacheDelete, getRedis } from '../config/redis.js';
import logger from '../config/logger.js';

// =====================
// Q3.1 CACHE CONFIGURATION
// =====================

// TTLs em segundos - otimizados para Q3.1
const TTL = {
  // Metadados estáticos (raramente mudam)
  METADATA: 3600,        // 1 hora para transportadoras, NOPs, units
  SEGMENTS: 3600,        // 1 hora para segmentos

  // Produtos (muda ocasionalmente)
  PRODUCT: 300,          // 5 minutos para produto individual
  PRODUCT_LIST: 120,     // 2 minutos para lista de produtos (busca)
  PRODUCT_STOCK: 60,     // 1 minuto para estoque (mais volátil)

  // Leads e Carrinhos (muda frequentemente)
  LEAD_TOTALS: 300,      // 5 minutos para totais de carrinho
  LEAD_LIST: 60,         // 1 minuto para lista de leads

  // Clientes
  CUSTOMER_DATA: 1800,   // 30 minutos para dados de cliente
  CUSTOMER_LIST: 300,    // 5 minutos para lista de clientes

  // Dashboard/Analytics (cache agressivo)
  DASHBOARD: 300,        // 5 minutos para widgets do dashboard
  ANALYTICS: 600,        // 10 minutos para analytics
  REPORTS: 900,          // 15 minutos para relatórios

  // Customer Goals
  CUSTOMER_GOALS_STATIC: 1800,   // 30 minutos para metas
  CUSTOMER_GOALS_ANNUAL: 600,    // 10 minutos para dados anuais

  // Variações
  SHORT: 60,             // 1 minuto para dados voláteis
  MEDIUM: 300,           // 5 minutos padrão
  LONG: 86400            // 24 horas para dados estáticos
};

// Prefixos de chaves organizados
const PREFIX = {
  METADATA: 'meta',
  LEAD: 'lead',
  CART: 'cart',
  CUSTOMER: 'customer',
  PRODUCT: 'product',
  STOCK: 'stock',
  DASHBOARD: 'dash',
  ANALYTICS: 'analytics',
  REPORTS: 'reports',
  CUSTOMER_GOALS: 'cgoals'
};

// Métricas de cache (Q3.1)
const cacheMetrics = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0,
  lastReset: Date.now()
};

/**
 * Gera chave de cache padronizada
 */
function makeKey(...parts) {
  return `leads-agent:${parts.join(':')}`;
}

/**
 * Cache service com métodos de alto nível
 */
export const CacheService = {
  // =====================
  // Métodos de Metadados
  // =====================

  /**
   * Busca transportadoras (com cache)
   */
  async getTransporters(fetchFn) {
    const key = makeKey(PREFIX.METADATA, 'transporters');

    // Tentar cache primeiro
    const cached = await cacheGet(key);
    if (cached) {
      logger.debug('Cache HIT: transporters');
      return cached;
    }

    // Cache miss - buscar do banco
    logger.debug('Cache MISS: transporters');
    const data = await fetchFn();

    // Salvar no cache
    await cacheSet(key, data, TTL.METADATA);

    return data;
  },

  /**
   * Busca NOPs (com cache)
   */
  async getNops(fetchFn) {
    const key = makeKey(PREFIX.METADATA, 'nops');

    const cached = await cacheGet(key);
    if (cached) {
      logger.debug('Cache HIT: nops');
      return cached;
    }

    logger.debug('Cache MISS: nops');
    const data = await fetchFn();
    await cacheSet(key, data, TTL.METADATA);

    return data;
  },

  /**
   * Busca Unidades Emitentes (com cache)
   */
  async getUnits(fetchFn) {
    const key = makeKey(PREFIX.METADATA, 'units');

    const cached = await cacheGet(key);
    if (cached) {
      logger.debug('Cache HIT: units');
      return cached;
    }

    logger.debug('Cache MISS: units');
    const data = await fetchFn();
    await cacheSet(key, data, TTL.METADATA);

    return data;
  },

  /**
   * Busca Segmentos (com cache)
   */
  async getSegments(fetchFn) {
    const key = makeKey(PREFIX.METADATA, 'segments');

    const cached = await cacheGet(key);
    if (cached) {
      logger.debug('Cache HIT: segments');
      return cached;
    }

    logger.debug('Cache MISS: segments');
    const data = await fetchFn();
    await cacheSet(key, data, TTL.SEGMENTS);

    return data;
  },

  // =====================
  // Métodos de Lead/Cart
  // =====================

  /**
   * Busca totais de carrinho (com cache curto)
   */
  async getCartTotals(cartId, fetchFn) {
    const key = makeKey(PREFIX.CART, cartId, 'totals');

    const cached = await cacheGet(key);
    if (cached) {
      logger.debug(`Cache HIT: cart totals ${cartId}`);
      return cached;
    }

    logger.debug(`Cache MISS: cart totals ${cartId}`);
    const data = await fetchFn();
    await cacheSet(key, data, TTL.LEAD_TOTALS);

    return data;
  },

  /**
   * Invalida cache de totais de carrinho
   */
  async invalidateCartTotals(cartId) {
    const key = makeKey(PREFIX.CART, cartId, 'totals');
    await cacheDelete(key);
    logger.debug(`Cache invalidated: cart totals ${cartId}`);
  },

  /**
   * Busca itens do carrinho (com cache curto)
   */
  async getCartItems(cartId, fetchFn) {
    const key = makeKey(PREFIX.CART, cartId, 'items');

    const cached = await cacheGet(key);
    if (cached) {
      logger.debug(`Cache HIT: cart items ${cartId}`);
      return cached;
    }

    logger.debug(`Cache MISS: cart items ${cartId}`);
    const data = await fetchFn();
    await cacheSet(key, data, TTL.LEAD_TOTALS);

    return data;
  },

  /**
   * Invalida cache de itens do carrinho
   */
  async invalidateCartItems(cartId) {
    const key = makeKey(PREFIX.CART, cartId, 'items');
    await cacheDelete(key);
    logger.debug(`Cache invalidated: cart items ${cartId}`);
  },

  /**
   * Invalida todo o cache relacionado a um carrinho
   */
  async invalidateCart(cartId) {
    await Promise.all([
      this.invalidateCartTotals(cartId),
      this.invalidateCartItems(cartId)
    ]);
  },

  // =====================
  // Métodos de Cliente
  // =====================

  /**
   * Busca transportadora preferida do cliente (com cache)
   */
  async getCustomerTransporter(customerId, fetchFn) {
    const key = makeKey(PREFIX.CUSTOMER, customerId, 'transporter');

    const cached = await cacheGet(key);
    if (cached) {
      logger.debug(`Cache HIT: customer transporter ${customerId}`);
      return cached;
    }

    logger.debug(`Cache MISS: customer transporter ${customerId}`);
    const data = await fetchFn();
    await cacheSet(key, data, TTL.CUSTOMER_DATA);

    return data;
  },

  // =====================
  // Métodos de Customer Goals (Metas por Cliente)
  // =====================

  /**
   * Busca dados estáticos de metas por cliente (com cache longo)
   * Inclui: lista de clientes, metas, classificações
   * NÃO inclui: sold_month, is_active_month, penetration (esses são realtime)
   */
  async getCustomerGoalsStatic(sellerId, options, fetchFn) {
    const { year, classification } = options;
    const classKey = classification || 'all';
    const key = makeKey(PREFIX.CUSTOMER_GOALS, 'static', sellerId, year, classKey);

    const cached = await cacheGet(key);
    if (cached) {
      logger.debug(`Cache HIT: customer goals static seller=${sellerId} year=${year} class=${classKey}`);
      return { data: cached, cacheHit: true };
    }

    logger.debug(`Cache MISS: customer goals static seller=${sellerId} year=${year} class=${classKey}`);
    const data = await fetchFn();
    await cacheSet(key, data, TTL.CUSTOMER_GOALS_STATIC);

    return { data, cacheHit: false };
  },

  /**
   * Busca dados anuais de metas (sold_2026, gap) com cache curto
   */
  async getCustomerGoalsAnnual(sellerId, options, fetchFn) {
    const { year, classification } = options;
    const classKey = classification || 'all';
    const key = makeKey(PREFIX.CUSTOMER_GOALS, 'annual', sellerId, year, classKey);

    const cached = await cacheGet(key);
    if (cached) {
      logger.debug(`Cache HIT: customer goals annual seller=${sellerId} year=${year}`);
      return { data: cached, cacheHit: true };
    }

    logger.debug(`Cache MISS: customer goals annual seller=${sellerId} year=${year}`);
    const data = await fetchFn();
    await cacheSet(key, data, TTL.CUSTOMER_GOALS_ANNUAL);

    return { data, cacheHit: false };
  },

  /**
   * Invalida cache de customer goals por vendedor
   * Chamado quando uma nova venda é registrada
   */
  async invalidateCustomerGoalsBySeller(sellerId) {
    // Invalida todos os caches relacionados a este vendedor
    const keys = [
      makeKey(PREFIX.CUSTOMER_GOALS, 'static', sellerId, '*'),
      makeKey(PREFIX.CUSTOMER_GOALS, 'annual', sellerId, '*')
    ];

    // Como não temos wildcard delete, invalida anos comuns
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];
    const classifications = ['all', 'A', 'B', 'C', 'I'];

    const deletePromises = [];
    for (const year of years) {
      for (const cls of classifications) {
        deletePromises.push(
          cacheDelete(makeKey(PREFIX.CUSTOMER_GOALS, 'static', sellerId, year, cls)),
          cacheDelete(makeKey(PREFIX.CUSTOMER_GOALS, 'annual', sellerId, year, cls))
        );
      }
    }

    await Promise.all(deletePromises);
    logger.info(`Cache invalidated: customer goals for seller ${sellerId}`);
    cacheMetrics.deletes += deletePromises.length;
  },

  // =====================
  // Métodos de Produto (Q3.1)
  // =====================

  /**
   * Cache de produto individual por ID
   */
  async getProduct(productId, fetchFn) {
    const key = makeKey(PREFIX.PRODUCT, productId);

    const cached = await cacheGet(key);
    if (cached) {
      cacheMetrics.hits++;
      logger.debug(`Cache HIT: product ${productId}`);
      return cached;
    }

    cacheMetrics.misses++;
    logger.debug(`Cache MISS: product ${productId}`);
    const data = await fetchFn();
    await cacheSet(key, data, TTL.PRODUCT);
    cacheMetrics.sets++;

    return data;
  },

  /**
   * Cache de múltiplos produtos (para busca)
   */
  async getProducts(searchKey, fetchFn) {
    const key = makeKey(PREFIX.PRODUCT, 'search', searchKey);

    const cached = await cacheGet(key);
    if (cached) {
      cacheMetrics.hits++;
      return cached;
    }

    cacheMetrics.misses++;
    const data = await fetchFn();
    await cacheSet(key, data, TTL.PRODUCT_LIST);
    cacheMetrics.sets++;

    return data;
  },

  /**
   * Cache de estoque (mais volátil)
   */
  async getStock(productId, fetchFn) {
    const key = makeKey(PREFIX.STOCK, productId);

    const cached = await cacheGet(key);
    if (cached) {
      cacheMetrics.hits++;
      return cached;
    }

    cacheMetrics.misses++;
    const data = await fetchFn();
    await cacheSet(key, data, TTL.PRODUCT_STOCK);
    cacheMetrics.sets++;

    return data;
  },

  async invalidateProduct(productId) {
    await cacheDelete(makeKey(PREFIX.PRODUCT, productId));
    cacheMetrics.deletes++;
  },

  // =====================
  // Métodos de Dashboard/Analytics (Q3.1)
  // =====================

  /**
   * Cache de widget do dashboard
   */
  async getDashboardWidget(widgetId, userId, fetchFn) {
    const key = makeKey(PREFIX.DASHBOARD, widgetId, userId || 'global');

    const cached = await cacheGet(key);
    if (cached) {
      cacheMetrics.hits++;
      logger.debug(`Cache HIT: dashboard widget ${widgetId}`);
      return cached;
    }

    cacheMetrics.misses++;
    logger.debug(`Cache MISS: dashboard widget ${widgetId}`);
    const data = await fetchFn();
    await cacheSet(key, data, TTL.DASHBOARD);
    cacheMetrics.sets++;

    return data;
  },

  /**
   * Cache de analytics
   */
  async getAnalytics(reportType, params, fetchFn) {
    const paramsKey = JSON.stringify(params);
    const key = makeKey(PREFIX.ANALYTICS, reportType, Buffer.from(paramsKey).toString('base64').slice(0, 32));

    const cached = await cacheGet(key);
    if (cached) {
      cacheMetrics.hits++;
      return cached;
    }

    cacheMetrics.misses++;
    const data = await fetchFn();
    await cacheSet(key, data, TTL.ANALYTICS);
    cacheMetrics.sets++;

    return data;
  },

  async invalidateDashboard(userId) {
    // Invalida widgets comuns
    const widgets = ['summary', 'leads', 'orders', 'goals', 'performance'];
    const promises = widgets.map(w =>
      cacheDelete(makeKey(PREFIX.DASHBOARD, w, userId || 'global'))
    );
    await Promise.all(promises);
    cacheMetrics.deletes += widgets.length;
  },

  // =====================
  // Métodos Utilitários
  // =====================

  /**
   * Invalida todo cache de metadados
   */
  async invalidateAllMetadata() {
    await Promise.all([
      cacheDelete(makeKey(PREFIX.METADATA, 'transporters')),
      cacheDelete(makeKey(PREFIX.METADATA, 'nops')),
      cacheDelete(makeKey(PREFIX.METADATA, 'units')),
      cacheDelete(makeKey(PREFIX.METADATA, 'segments'))
    ]);
    cacheMetrics.deletes += 4;
    logger.info('All metadata cache invalidated');
  },

  /**
   * Verifica se o Redis está disponível
   */
  isAvailable() {
    return getRedis() !== null;
  },

  /**
   * Wrapper genérico para cache (usado em Q3.1)
   */
  async cached(key, ttl, fetchFn) {
    const cached = await cacheGet(key);
    if (cached) {
      cacheMetrics.hits++;
      return cached;
    }

    cacheMetrics.misses++;
    const data = await fetchFn();
    await cacheSet(key, data, ttl);
    cacheMetrics.sets++;
    return data;
  },

  /**
   * Wrapper genérico para cache com padrão getOrSet (facilita uso)
   * @param {string} key - Chave do cache
   * @param {Function} fetchFn - Função para buscar dados se cache miss
   * @param {number} ttl - TTL em segundos (default: 300 = 5 minutos)
   */
  async getOrSet(key, fetchFn, ttl = 300) {
    const fullKey = key.startsWith('leads-agent:') ? key : makeKey(key);

    try {
      const cached = await cacheGet(fullKey);
      if (cached) {
        cacheMetrics.hits++;
        logger.debug(`Cache HIT: ${key}`);
        return cached;
      }

      cacheMetrics.misses++;
      logger.debug(`Cache MISS: ${key}`);
      const data = await fetchFn();

      if (data !== null && data !== undefined) {
        await cacheSet(fullKey, data, ttl);
        cacheMetrics.sets++;
      }

      return data;
    } catch (error) {
      cacheMetrics.errors++;
      logger.warn(`Cache error for ${key}: ${error.message}`);
      // Em caso de erro no cache, executa a função diretamente
      return await fetchFn();
    }
  },

  // =====================
  // Métricas Q3.1
  // =====================

  /**
   * Retorna métricas de cache
   */
  getMetrics() {
    const total = cacheMetrics.hits + cacheMetrics.misses;
    const hitRate = total > 0 ? ((cacheMetrics.hits / total) * 100).toFixed(2) : 0;

    return {
      hits: cacheMetrics.hits,
      misses: cacheMetrics.misses,
      sets: cacheMetrics.sets,
      deletes: cacheMetrics.deletes,
      errors: cacheMetrics.errors,
      hitRate: `${hitRate}%`,
      total,
      uptime: Math.floor((Date.now() - cacheMetrics.lastReset) / 1000)
    };
  },

  /**
   * Reseta métricas de cache
   */
  resetMetrics() {
    cacheMetrics.hits = 0;
    cacheMetrics.misses = 0;
    cacheMetrics.sets = 0;
    cacheMetrics.deletes = 0;
    cacheMetrics.errors = 0;
    cacheMetrics.lastReset = Date.now();
    logger.info('Cache metrics reset');
  },

  /**
   * Incrementa contador de erros
   */
  recordError() {
    cacheMetrics.errors++;
  }
};

// Constantes exportadas para uso externo
export { TTL, PREFIX, makeKey, cacheMetrics };

export default CacheService;
