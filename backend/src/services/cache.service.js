/**
 * Serviço de Cache Centralizado
 * Gerencia cache Redis com TTLs configuráveis e keys padronizadas
 */
import { cacheGet, cacheSet, cacheDelete, getRedis } from '../config/redis.js';
import logger from '../config/logger.js';

// TTLs em segundos
const TTL = {
  METADATA: 3600,        // 1 hora para metadados (transportadoras, NOPs, units)
  LEAD_TOTALS: 300,      // 5 minutos para totais de carrinho
  CUSTOMER_DATA: 1800,   // 30 minutos para dados de cliente
  SEGMENTS: 3600,        // 1 hora para segmentos
  SHORT: 60,             // 1 minuto para dados voláteis
  LONG: 86400,           // 24 horas para dados estáticos
  // Cache para Metas por Cliente
  CUSTOMER_GOALS_STATIC: 1800,   // 30 minutos para dados estáticos (metas, classificação)
  CUSTOMER_GOALS_ANNUAL: 600     // 10 minutos para dados anuais (sold_2026, gap)
};

// Prefixos de chaves
const PREFIX = {
  METADATA: 'meta',
  LEAD: 'lead',
  CART: 'cart',
  CUSTOMER: 'customer',
  PRODUCT: 'product',
  CUSTOMER_GOALS: 'cgoals'  // Cache para metas por cliente
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
    logger.info('All metadata cache invalidated');
  },

  /**
   * Verifica se o Redis está disponível
   */
  isAvailable() {
    return getRedis() !== null;
  },

  /**
   * Wrapper genérico para cache
   */
  async cached(key, ttl, fetchFn) {
    const cached = await cacheGet(key);
    if (cached) {
      return cached;
    }

    const data = await fetchFn();
    await cacheSet(key, data, ttl);
    return data;
  }
};

// Constantes exportadas para uso externo
export { TTL, PREFIX, makeKey };

export default CacheService;
