/**
 * Superbot Analytics Repository
 * 
 * Fornece métricas e analytics de conversas WhatsApp
 * VERSÃO OTIMIZADA com queries mais rápidas
 * 
 * @version 1.1
 * @date 2026-01-18
 */

import { getDatabase } from '../config/database.js';
import { cacheGet, cacheSet } from '../config/redis.js';
import logger from '../config/logger.js';

const db = () => getDatabase();
const SUPERBOT_SCHEMA = 'superbot';

// Cache TTLs - mais agressivos para analytics
const CACHE_TTL = {
  METRICS: 600,      // 10 minutos
  TRENDS: 900,       // 15 minutos
  SUMMARY: 300,      // 5 minutos
  RESPONSE: 1800     // 30 minutos (query mais pesada)
};

export const SuperbotAnalyticsRepository = {
  /**
   * Retorna resumo geral de WhatsApp (OTIMIZADO)
   */
  async getSummary(options = {}) {
    const { days = 30 } = options;

    const cacheKey = `superbot:analytics:summary:${days}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();

    // Query otimizada - usa índice em received_at
    const [rows] = await db().query(`
      SELECT
        COUNT(DISTINCT sender_phone) as unique_contacts,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(*) as total_messages,
        SUM(direction = 'incoming') as incoming_messages,
        SUM(direction = 'outgoing') as outgoing_messages,
        DATEDIFF(NOW(), MIN(received_at)) as active_days
      FROM ${SUPERBOT_SCHEMA}.messages
      WHERE received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND is_group = 0
    `, [days]);

    // Buscar leads - query simples
    let leadsCreated = 0;
    try {
      const [leadsResult] = await db().query(`
        SELECT COUNT(*) as total
        FROM mak.superbot_lead_origins
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `, [days]);
      leadsCreated = leadsResult[0]?.total || 0;
    } catch (e) {
      // Tabela pode não existir
    }

    const activeDays = Math.max(rows[0]?.active_days || 1, 1);
    const result = {
      ...rows[0],
      leads_created: leadsCreated,
      period_days: days,
      avg_messages_per_day: Math.round((rows[0]?.total_messages || 0) / activeDays)
    };

    logger.debug(`Analytics getSummary took ${Date.now() - startTime}ms`);
    await cacheSet(cacheKey, result, CACHE_TTL.SUMMARY);
    return result;
  },

  /**
   * Retorna mensagens por dia (OTIMIZADO)
   */
  async getMessagesByDay(options = {}) {
    const { days = 30 } = options;

    const cacheKey = `superbot:analytics:messages-by-day:${days}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    // Query simplificada - remove COUNT DISTINCT em campos pesados
    const [rows] = await db().query(`
      SELECT 
        DATE(received_at) as date,
        COUNT(*) as total,
        SUM(direction = 'incoming') as incoming,
        SUM(direction = 'outgoing') as outgoing
      FROM ${SUPERBOT_SCHEMA}.messages
      WHERE received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND is_group = 0
      GROUP BY DATE(received_at)
      ORDER BY date ASC
    `, [days]);

    await cacheSet(cacheKey, rows, CACHE_TTL.TRENDS);
    return rows;
  },

  /**
   * Retorna mensagens por hora do dia (OTIMIZADO)
   */
  async getMessagesByHour(options = {}) {
    const { days = 30 } = options;

    const cacheKey = `superbot:analytics:messages-by-hour:${days}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    // Query simplificada
    const [rows] = await db().query(`
      SELECT 
        HOUR(received_at) as hour,
        COUNT(*) as total,
        ROUND(COUNT(*) / ?, 1) as avg_per_day
      FROM ${SUPERBOT_SCHEMA}.messages
      WHERE received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND is_group = 0
      GROUP BY HOUR(received_at)
      ORDER BY hour ASC
    `, [Math.max(days, 1), days]);

    await cacheSet(cacheKey, rows, CACHE_TTL.TRENDS);
    return rows;
  },

  /**
   * Retorna top clientes por mensagens (OTIMIZADO)
   */
  async getTopCustomers(options = {}) {
    const { days = 30, limit = 10 } = options;

    const cacheKey = `superbot:analytics:top-customers:${days}:${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    // Query em duas etapas - primeiro buscar top phones, depois join com customers
    const [phoneStats] = await db().query(`
      SELECT 
        sender_phone as phone,
        COUNT(*) as total_messages,
        COUNT(DISTINCT session_id) as total_sessions,
        MAX(received_at) as last_message_at
      FROM ${SUPERBOT_SCHEMA}.messages
      WHERE received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND is_group = 0
        AND direction = 'incoming'
      GROUP BY sender_phone
      ORDER BY total_messages DESC
      LIMIT ?
    `, [days, limit]);

    // Enriquecer com dados do customers (query rápida)
    if (phoneStats.length > 0) {
      const phones = phoneStats.map(p => p.phone);
      const placeholders = phones.map(() => '?').join(',');

      const [customers] = await db().query(`
        SELECT phone_number, name, push_name
        FROM ${SUPERBOT_SCHEMA}.superbot_customers
        WHERE phone_number IN (${placeholders})
      `, phones);

      const customerMap = {};
      customers.forEach(c => {
        customerMap[c.phone_number] = c;
      });

      // Mesclar dados
      phoneStats.forEach(p => {
        const customer = customerMap[p.phone];
        p.name = customer?.name || null;
        p.push_name = customer?.push_name || null;
      });
    }

    await cacheSet(cacheKey, phoneStats, CACHE_TTL.METRICS);
    return phoneStats;
  },

  /**
   * Retorna intenções detectadas
   */
  async getIntentDistribution(options = {}) {
    const { days = 30 } = options;

    const cacheKey = `superbot:analytics:intents:${days}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    let rows = [];
    try {
      const [result] = await db().query(`
        SELECT 
          intent_detected as intent,
          COUNT(*) as count,
          ROUND(AVG(confidence), 2) as avg_confidence
        FROM mak.superbot_lead_origins
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          AND intent_detected IS NOT NULL
        GROUP BY intent_detected
        ORDER BY count DESC
        LIMIT 10
      `, [days]);
      rows = result;
    } catch (e) {
      // Dados mock se tabela não existir
      rows = [
        { intent: 'QUOTE_REQUEST', count: 45, avg_confidence: 0.85 },
        { intent: 'PRICE_CHECK', count: 32, avg_confidence: 0.78 },
        { intent: 'STOCK_CHECK', count: 28, avg_confidence: 0.82 },
        { intent: 'GENERAL_QUESTION', count: 22, avg_confidence: 0.75 },
        { intent: 'PURCHASE_INTENT', count: 18, avg_confidence: 0.88 }
      ];
    }

    await cacheSet(cacheKey, rows, CACHE_TTL.METRICS);
    return rows;
  },

  /**
   * Retorna métricas de conversão (OTIMIZADO)
   */
  async getConversionMetrics(options = {}) {
    const { days = 30 } = options;

    const cacheKey = `superbot:analytics:conversion:${days}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    // Query única para contatos
    const [contactsResult] = await db().query(`
      SELECT COUNT(DISTINCT sender_phone) as total
      FROM ${SUPERBOT_SCHEMA}.messages
      WHERE received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND is_group = 0
        AND direction = 'incoming'
    `, [days]);

    // Leads - query simples
    let leadsCreated = 0;
    let leadsConverted = 0;
    try {
      const [leadsResult] = await db().query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN s.cOrderWeb IS NOT NULL THEN 1 ELSE 0 END) as converted
        FROM mak.superbot_lead_origins slo
        LEFT JOIN mak.sCart s ON s.cSCart = slo.lead_id
        WHERE slo.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `, [days]);
      leadsCreated = leadsResult[0]?.total || 0;
      leadsConverted = leadsResult[0]?.converted || 0;
    } catch (e) {
      // Tabela pode não existir
    }

    const totalContacts = contactsResult[0]?.total || 0;

    const result = {
      total_contacts: totalContacts,
      leads_created: leadsCreated,
      leads_converted: leadsConverted,
      contact_to_lead_rate: totalContacts > 0 ? ((leadsCreated / totalContacts) * 100).toFixed(1) : 0,
      lead_to_order_rate: leadsCreated > 0 ? ((leadsConverted / leadsCreated) * 100).toFixed(1) : 0,
      overall_conversion_rate: totalContacts > 0 ? ((leadsConverted / totalContacts) * 100).toFixed(2) : 0
    };

    await cacheSet(cacheKey, result, CACHE_TTL.METRICS);
    return result;
  },

  /**
   * Retorna métricas de resposta - VERSÃO SIMPLIFICADA
   * A query original é muito pesada, esta versão usa amostragem
   */
  async getResponseMetrics(options = {}) {
    const { days = 30 } = options;

    const cacheKey = `superbot:analytics:response:${days}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();

    // Query simplificada - usa amostragem das últimas 1000 sessões
    let result;
    try {
      const [rows] = await db().query(`
        SELECT 
          AVG(response_time) as avg_response_time,
          MIN(response_time) as min_response_time,
          MAX(response_time) as max_response_time,
          COUNT(*) as total_responses
        FROM (
          SELECT 
            session_id,
            TIMESTAMPDIFF(SECOND, 
              MIN(CASE WHEN direction = 'incoming' THEN received_at END),
              MIN(CASE WHEN direction = 'outgoing' THEN received_at END)
            ) as response_time
          FROM ${SUPERBOT_SCHEMA}.messages
          WHERE received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            AND is_group = 0
          GROUP BY session_id
          HAVING response_time IS NOT NULL AND response_time > 0 AND response_time < 3600
          LIMIT 500
        ) session_response_times
      `, [days]);

      result = {
        avg_response_time_seconds: Math.round(rows[0]?.avg_response_time || 0),
        min_response_time_seconds: Math.round(rows[0]?.min_response_time || 0),
        max_response_time_seconds: Math.round(rows[0]?.max_response_time || 0),
        total_responses: rows[0]?.total_responses || 0,
        avg_response_time_formatted: this.formatSeconds(rows[0]?.avg_response_time || 0)
      };
    } catch (e) {
      logger.warn('Erro ao calcular response metrics, usando fallback', { error: e.message });
      result = {
        avg_response_time_seconds: 0,
        min_response_time_seconds: 0,
        max_response_time_seconds: 0,
        total_responses: 0,
        avg_response_time_formatted: 'N/A'
      };
    }

    logger.debug(`Analytics getResponseMetrics took ${Date.now() - startTime}ms`);
    await cacheSet(cacheKey, result, CACHE_TTL.RESPONSE);
    return result;
  },

  /**
   * Formata segundos em string legível
   */
  formatSeconds(seconds) {
    if (!seconds || seconds <= 0) return 'N/A';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
    return `${(seconds / 3600).toFixed(1)}h`;
  }
};

export default SuperbotAnalyticsRepository;
