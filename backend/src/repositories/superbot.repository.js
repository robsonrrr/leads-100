/**
 * Superbot Repository
 * 
 * Acesso às tabelas do Superbot (conversas WhatsApp)
 * Integração com leads-agent para enriquecimento de contexto
 * 
 * @version 1.0
 * @date 2026-01-17
 */

import { getDatabase } from '../config/database.js';
import { cacheGet, cacheSet, cacheDelete } from '../config/redis.js';

const db = () => getDatabase();

// Schema do Superbot
const SUPERBOT_SCHEMA = 'superbot';
const LINKS_TABLE = `${SUPERBOT_SCHEMA}.superbot_customer_links`;

// Cache TTLs
const CACHE_TTL = {
  CUSTOMER: 300,      // 5 minutos
  CONVERSATIONS: 120, // 2 minutos
  STATS: 600,         // 10 minutos
  MESSAGES: 60        // 1 minuto
};

/**
 * Normaliza número de telefone para padrão brasileiro
 * Remove caracteres especiais e garante formato consistente
 */
function normalizePhone(phone) {
  if (!phone) return null;

  // Remove tudo que não é número
  const digits = phone.replace(/\D/g, '');

  // Se começar com 55 (código do Brasil), mantém
  // Se não, assume que é brasileiro e adiciona 55
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  } else if (digits.length >= 10) {
    return `55${digits}`;
  }

  return digits;
}

/**
 * Extrai últimos 9 dígitos para busca fuzzy
 */
function getPhoneSuffix(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized || normalized.length < 9) return null;
  return normalized.slice(-9);
}

export const SuperbotRepository = {
  /**
   * Busca cliente do Superbot por telefone
   * Suporta busca exata e fuzzy (últimos 9 dígitos)
   */
  async findCustomerByPhone(phone) {
    const cacheKey = `superbot:customer:${phone}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const normalized = normalizePhone(phone);
    const suffix = getPhoneSuffix(phone);

    const [rows] = await db().query(`
      SELECT 
        sc.id,
        sc.jid,
        sc.name,
        sc.push_name,
        sc.phone_number,
        sc.is_group,
        sc.created_at,
        sc.updated_at,
        COUNT(DISTINCT m.session_id) as total_sessions,
        COUNT(m.id) as total_messages,
        MAX(m.received_at) as last_message_at
      FROM ${SUPERBOT_SCHEMA}.superbot_customers sc
      LEFT JOIN ${SUPERBOT_SCHEMA}.messages m ON (
        m.sender_phone = sc.phone_number 
        OR m.recipient_phone = sc.phone_number
      )
      WHERE sc.phone_number = ?
         OR sc.phone_number LIKE ?
         OR sc.jid LIKE ?
      GROUP BY sc.id
      LIMIT 1
    `, [normalized, `%${suffix}`, `%${suffix}@%`]);

    const result = rows[0] || null;
    if (result) {
      await cacheSet(cacheKey, result, CACHE_TTL.CUSTOMER);
    }
    return result;
  },

  /**
   * Lista todos os clientes do Superbot com estatísticas básicas
   */
  async listCustomers(options = {}) {
    const { page = 1, limit = 20, search = '', hasLink = null, sellerPhones = null } = options;
    const offset = (page - 1) * limit;

    // Cache key (incluir sellerPhones se fornecido)
    const sellerKey = sellerPhones ? sellerPhones.join(',') : 'all';
    const cacheKey = `superbot:customers:list:${page}:${limit}:${search || 'none'}:${sellerKey}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    let whereClause = 'WHERE sc.is_group = 0';
    const params = [];

    if (search) {
      whereClause += ` AND (
        sc.name LIKE ? OR 
        sc.push_name LIKE ? OR 
        sc.phone_number LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Se sellerPhones foi passado, filtrar apenas clientes que conversaram com esses telefones
    let sellerFilter = '';
    let sellerPhonesPlaceholders = '';
    if (sellerPhones && sellerPhones.length > 0) {
      sellerPhonesPlaceholders = sellerPhones.map(() => '?').join(',');
      sellerFilter = `
        AND sc.phone_number IN (
          SELECT DISTINCT
            CASE 
              WHEN sender_phone IN (${sellerPhonesPlaceholders}) THEN recipient_phone
              ELSE sender_phone
            END as client_phone
          FROM ${SUPERBOT_SCHEMA}.messages
          WHERE (sender_phone IN (${sellerPhonesPlaceholders}) OR recipient_phone IN (${sellerPhonesPlaceholders}))
            AND is_group = 0
        )
      `;
      // Adicionar os telefones 3 vezes (para cada IN clause)
      params.push(...sellerPhones, ...sellerPhones, ...sellerPhones);
    }

    // PASSO 1: Buscar clientes ordenados pela última mensagem
    let query;
    let queryParams;

    if (sellerPhones && sellerPhones.length > 0) {
      // Query usando a VIEW vw_whatsapp_contacts
      // Filtra por seller_phone (session_id = telefone do vendedor)
      // JOIN com seller_phones e rolemak_users para obter o nome do vendedor
      query = `
        SELECT 
          v.contact_phone AS phone_number,
          v.contact_name AS name,
          v.push_name,
          v.seller_phone,
          COALESCE(u.nick, u.user) AS seller_name,
          v.total_messages,
          v.incoming_messages,
          v.outgoing_messages,
          v.first_message_at,
          v.last_message_at,
          v.days_since_last_message,
          v.superbot_customer_id AS id,
          v.has_linked_customer,
          v.leads_customer_id,
          0 AS is_group
        FROM ${SUPERBOT_SCHEMA}.vw_whatsapp_contacts v
        LEFT JOIN ${SUPERBOT_SCHEMA}.seller_phones sp ON sp.phone_number = v.seller_phone
        LEFT JOIN mak.rolemak_users u ON u.id = sp.user_id
        WHERE v.seller_phone IN (${sellerPhonesPlaceholders})
        ${search ? `AND (v.contact_name LIKE ? OR v.contact_phone LIKE ?)` : ''}
        ORDER BY v.last_message_at DESC
        LIMIT ? OFFSET ?
      `;
      // Parâmetros: sellerPhones, search params (se houver), limit, offset
      const searchParams = search ? [`%${search}%`, `%${search}%`] : [];
      queryParams = [...sellerPhones, ...searchParams, parseInt(limit), parseInt(offset)];
    } else {
      // Query padrão (sem filtro de vendedor)
      query = `
        SELECT 
          sc.id,
          sc.jid,
          sc.name,
          sc.push_name,
          sc.phone_number,
          sc.is_group,
          sc.created_at,
          sc.updated_at,
          msg_stats.last_message_at
        FROM ${SUPERBOT_SCHEMA}.superbot_customers sc
        LEFT JOIN (
          SELECT 
            CASE 
              WHEN sender_phone LIKE '55%' AND LENGTH(sender_phone) >= 12 THEN sender_phone
              ELSE recipient_phone 
            END as phone,
            MAX(received_at) as last_message_at
          FROM ${SUPERBOT_SCHEMA}.messages
          WHERE is_group = 0
          GROUP BY phone
        ) msg_stats ON msg_stats.phone = sc.phone_number
        ${whereClause}
        ORDER BY COALESCE(msg_stats.last_message_at, '1970-01-01') DESC, sc.updated_at DESC
        LIMIT ? OFFSET ?
      `;
      queryParams = [...params, parseInt(limit), parseInt(offset)];
    }

    const [customers] = await db().query(query, queryParams);

    // PASSO 2: Se tiver clientes, buscar estatísticas em batch
    let statsMap = {};
    if (customers.length > 0) {
      const phoneNumbers = customers.map(c => c.phone_number);
      const placeholders = phoneNumbers.map(() => '?').join(',');

      // Estatísticas agregadas por telefone (uma única query eficiente)
      try {
        const [stats] = await db().query(`
          SELECT 
            phone,
            SUM(total_sessions) as total_sessions,
            SUM(total_messages) as total_messages,
            MAX(last_message_at) as last_message_at
          FROM (
            SELECT sender_phone as phone, COUNT(DISTINCT session_id) as total_sessions, COUNT(*) as total_messages, MAX(received_at) as last_message_at
            FROM ${SUPERBOT_SCHEMA}.messages
            WHERE sender_phone IN (${placeholders})
            GROUP BY sender_phone
            UNION ALL
            SELECT recipient_phone as phone, COUNT(DISTINCT session_id) as total_sessions, COUNT(*) as total_messages, MAX(received_at) as last_message_at
            FROM ${SUPERBOT_SCHEMA}.messages
            WHERE recipient_phone IN (${placeholders})
            GROUP BY recipient_phone
          ) combined
          GROUP BY phone
        `, [...phoneNumbers, ...phoneNumbers]);

        stats.forEach(s => {
          if (s.phone) statsMap[s.phone] = s;
        });
      } catch (err) {
        // Se der erro, continua sem estatísticas
        console.warn('Erro ao buscar stats:', err.message);
      }
    }

    // PASSO 3: Verificar links existentes (rápido)
    let linksMap = {};
    if (customers.length > 0) {
      const customerIds = customers.map(c => c.id);
      const placeholders = customerIds.map(() => '?').join(',');

      try {
        const [links] = await db().query(`
          SELECT superbot_customer_id 
          FROM ${LINKS_TABLE} 
          WHERE superbot_customer_id IN (${placeholders})
        `, customerIds);

        links.forEach(l => linksMap[l.superbot_customer_id] = true);
      } catch (err) {
        // Tabela pode não existir
      }
    }

    // PASSO 3.5: Buscar vendedor associado (para admins/gerentes)
    // APENAS quando NÃO usamos a view (que já traz o seller_name)
    // O vendedor é identificado pelo telefone que participou das conversas
    let sellerMap = {};
    if (customers.length > 0 && !sellerPhones) {
      const phoneNumbers = customers.map(c => c.phone_number);
      const placeholders = phoneNumbers.map(() => '?').join(',');

      try {
        // Buscar o vendedor que tem telefone vinculado e conversou com cada cliente
        const [sellers] = await db().query(`
          SELECT DISTINCT
            m.sender_phone as client_phone,
            sp.phone_number as seller_phone,
            COALESCE(u.nick, u.user) as seller_name
          FROM ${SUPERBOT_SCHEMA}.messages m
          INNER JOIN ${SUPERBOT_SCHEMA}.seller_phones sp ON sp.phone_number = m.recipient_phone
          INNER JOIN mak.rolemak_users u ON u.id = sp.user_id
          WHERE m.sender_phone IN (${placeholders})
            AND sp.is_active = 1
          
          UNION
          
          SELECT DISTINCT
            m.recipient_phone as client_phone,
            sp.phone_number as seller_phone,
            COALESCE(u.nick, u.user) as seller_name
          FROM ${SUPERBOT_SCHEMA}.messages m
          INNER JOIN ${SUPERBOT_SCHEMA}.seller_phones sp ON sp.phone_number = m.sender_phone
          INNER JOIN mak.rolemak_users u ON u.id = sp.user_id
          WHERE m.recipient_phone IN (${placeholders})
            AND sp.is_active = 1
        `, [...phoneNumbers, ...phoneNumbers]);

        sellers.forEach(s => {
          if (s.client_phone && !sellerMap[s.client_phone]) {
            sellerMap[s.client_phone] = s.seller_name;
          }
        });
      } catch (err) {
        console.warn('Erro ao buscar vendedores:', err.message);
      }
    }

    // PASSO 4: Combinar resultados
    // Se usamos a view (sellerPhones fornecido), o seller_name já vem da query
    // Caso contrário, usamos o sellerMap
    const rows = customers.map(c => ({
      ...c,
      total_sessions: statsMap[c.phone_number]?.total_sessions || 0,
      total_messages: c.total_messages || statsMap[c.phone_number]?.total_messages || 0,
      last_message_at: c.last_message_at || statsMap[c.phone_number]?.last_message_at || null,
      has_linked_customer: c.has_linked_customer || !!linksMap[c.id],
      seller_name: c.seller_name || sellerMap[c.phone_number] || null
    }));

    // Contagem total (query separada, rápida)
    let countQuery, countParams;
    if (sellerPhones && sellerPhones.length > 0) {
      // Contar da view quando temos filtro de vendedor
      countQuery = `
        SELECT COUNT(*) as total
        FROM ${SUPERBOT_SCHEMA}.vw_whatsapp_contacts v
        WHERE v.seller_phone IN (${sellerPhonesPlaceholders})
        ${search ? `AND (v.contact_name LIKE ? OR v.contact_phone LIKE ?)` : ''}
      `;
      const searchParams = search ? [`%${search}%`, `%${search}%`] : [];
      countParams = [...sellerPhones, ...searchParams];
    } else {
      countQuery = `
        SELECT COUNT(*) as total
        FROM ${SUPERBOT_SCHEMA}.superbot_customers sc
        ${whereClause}
      `;
      countParams = params;
    }

    const [countResult] = await db().query(countQuery, countParams);

    const result = {
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0]?.total || 0,
        totalPages: Math.ceil((countResult[0]?.total || 0) / limit)
      }
    };

    // Cache por 2 minutos
    await cacheSet(cacheKey, result, 120);

    return result;
  },

  /**
   * Busca conversas (sessões) de um cliente por telefone
   */
  async getConversations(phone, options = {}) {
    const { days = 30, limit = 50 } = options;
    const normalized = normalizePhone(phone);
    const suffix = getPhoneSuffix(phone);

    const cacheKey = `superbot:conversations:${suffix}:${days}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const [rows] = await db().query(`
      SELECT 
        m.session_id,
        COUNT(*) as messages_count,
        MIN(m.received_at) as first_message_at,
        MAX(m.received_at) as last_message_at,
        SUM(CASE WHEN m.direction = 'incoming' THEN 1 ELSE 0 END) as incoming_count,
        SUM(CASE WHEN m.direction = 'outgoing' THEN 1 ELSE 0 END) as outgoing_count,
        SUM(CASE WHEN mm.id IS NOT NULL THEN 1 ELSE 0 END) as media_count,
        SUM(CASE WHEN mt.id IS NOT NULL THEN 1 ELSE 0 END) as transcriptions_count
      FROM ${SUPERBOT_SCHEMA}.messages m
      LEFT JOIN ${SUPERBOT_SCHEMA}.message_media mm ON mm.message_id = m.id
      LEFT JOIN ${SUPERBOT_SCHEMA}.message_transcriptions mt ON mt.media_id = mm.id
      WHERE (m.sender_phone LIKE ? OR m.recipient_phone LIKE ?)
        AND m.received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND m.is_group = 0
      GROUP BY m.session_id
      ORDER BY last_message_at DESC
      LIMIT ?
    `, [`%${suffix}`, `%${suffix}`, days, parseInt(limit)]);

    const result = rows;
    await cacheSet(cacheKey, result, CACHE_TTL.CONVERSATIONS);
    return result;
  },

  /**
   * Busca mensagens de uma sessão específica
   * NOTA: Página 1 retorna as mensagens MAIS RECENTES (para exibição inicial no chat)
   * As mensagens são ordenadas cronologicamente (ASC) para display correto
   * @param {string} sessionId - ID da sessão
   * @param {Object} options - Opções de busca
   * @param {number} options.page - Página (default: 1)
   * @param {number} options.limit - Limite por página (default: 50)
   * @param {string} options.phone - Telefone do contato para filtrar mensagens
   * @param {boolean} options.includeMedia - Incluir mídia (default: true)
   */
  async getMessagesBySession(sessionId, options = {}) {
    const { page = 1, limit = 50, includeMedia = true, phone = null } = options;

    // Gerar cache key incluindo o phone se fornecido
    const phoneSuffix = phone ? getPhoneSuffix(phone) : '';
    const cacheKey = `superbot:messages:${sessionId}:${page}:${limit}:${phoneSuffix}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    // Construir filtro de telefone se fornecido
    let phoneFilter = '';
    const countParams = [sessionId];
    const queryParams = [sessionId];

    if (phone) {
      phoneFilter = ` AND (m.sender_phone = ? OR m.recipient_phone = ?)`;
      countParams.push(phone, phone);
      queryParams.push(phone, phone);
    }

    // Contagem total (excluindo mensagens de Status)
    const [countResult] = await db().query(`
      SELECT COUNT(*) as total
      FROM ${SUPERBOT_SCHEMA}.messages m
      WHERE m.session_id = ?
        ${phoneFilter}
        AND m.sender_phone NOT LIKE '%status@broadcast%'
        AND m.recipient_phone NOT LIKE '%status@broadcast%'
        AND COALESCE(m.sender_phone, '') NOT LIKE 'status%'
        AND COALESCE(m.recipient_phone, '') NOT LIKE 'status%'
    `, countParams);

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // Offset normal: página 1 com offset 0 + ORDER BY DESC = mensagens mais recentes
    const offset = (page - 1) * limit;

    // Busca mensagens com mídia e transcrições
    // ESTRATÉGIA: ORDER BY DESC para pegar as mais recentes primeiro,
    // depois reordenar em ASC para display cronológico no chat
    const [rows] = await db().query(`
      SELECT * FROM (
        SELECT 
          m.id,
          m.message_id,
          m.session_id,
          m.sender_phone,
          m.recipient_phone,
          m.message_text,
          m.source,
          m.message_type,
          m.direction,
          m.status,
          m.original_timestamp,
          m.received_at,
          m.read_at,
          m.delivered_at,
          mm.id as media_id,
          mm.type as media_type,
          mm.file_name as media_filename,
          mm.s3_url as media_url,
          mm.is_voice_note,
          mm.duration as media_duration,
          mt.transcription_text,
          mt.confidence as transcription_confidence,
          mt.language as transcription_language,
          mr.ai_service,
          mr.formatted_response as ai_response,
          mr.status as ai_status
        FROM ${SUPERBOT_SCHEMA}.messages m
        LEFT JOIN ${SUPERBOT_SCHEMA}.message_media mm ON mm.message_id = m.id
        LEFT JOIN ${SUPERBOT_SCHEMA}.message_transcriptions mt ON mt.media_id = mm.id
        LEFT JOIN ${SUPERBOT_SCHEMA}.message_responses mr ON mr.message_id = m.id
        WHERE m.session_id = ?
          ${phoneFilter}
          -- Excluir mensagens de Status do WhatsApp (stories)
          AND m.sender_phone NOT LIKE '%status@broadcast%'
          AND m.recipient_phone NOT LIKE '%status@broadcast%'
          AND COALESCE(m.sender_phone, '') NOT LIKE 'status%'
          AND COALESCE(m.recipient_phone, '') NOT LIKE 'status%'
        ORDER BY m.received_at DESC
        LIMIT ? OFFSET ?
      ) recent_messages
      ORDER BY received_at ASC
    `, [...queryParams, parseInt(limit), parseInt(offset)]);

    const result = {
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: totalPages
      }
    };

    await cacheSet(cacheKey, result, CACHE_TTL.MESSAGES);
    return result;
  },

  /**
   * Busca mensagens de um cliente por telefone
   */
  async getMessagesByPhone(phone, options = {}) {
    const { days = 7, limit = 100, direction = null } = options;
    const suffix = getPhoneSuffix(phone);

    let whereClause = `
      WHERE (m.sender_phone LIKE ? OR m.recipient_phone LIKE ?)
        AND m.received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND m.is_group = 0
    `;
    const params = [`%${suffix}`, `%${suffix}`, days];

    if (direction) {
      whereClause += ' AND m.direction = ?';
      params.push(direction);
    }

    const [rows] = await db().query(`
      SELECT 
        m.id,
        m.message_id,
        m.session_id,
        m.sender_phone,
        m.recipient_phone,
        m.message_text,
        m.direction,
        m.message_type,
        m.received_at,
        mm.type as media_type,
        mm.s3_url as media_url,
        mm.is_voice_note,
        mt.transcription_text
      FROM ${SUPERBOT_SCHEMA}.messages m
      LEFT JOIN ${SUPERBOT_SCHEMA}.message_media mm ON mm.message_id = m.id
      LEFT JOIN ${SUPERBOT_SCHEMA}.message_transcriptions mt ON mt.media_id = mm.id
      ${whereClause}
      ORDER BY m.received_at DESC
      LIMIT ?
    `, [...params, parseInt(limit)]);

    return rows;
  },

  /**
   * Obtém estatísticas de conversas de um cliente
   */
  async getCustomerStats(phone) {
    const suffix = getPhoneSuffix(phone);

    const cacheKey = `superbot:stats:${suffix}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const [rows] = await db().query(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(DISTINCT session_id) as total_sessions,
        SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END) as incoming_count,
        SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END) as outgoing_count,
        MIN(received_at) as first_message_at,
        MAX(received_at) as last_message_at,
        AVG(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END) as incoming_ratio
      FROM ${SUPERBOT_SCHEMA}.messages
      WHERE (sender_phone LIKE ? OR recipient_phone LIKE ?)
        AND is_group = 0
    `, [`%${suffix}`, `%${suffix}`]);

    // Horários mais ativos
    const [hourlyStats] = await db().query(`
      SELECT 
        HOUR(received_at) as hour,
        COUNT(*) as message_count
      FROM ${SUPERBOT_SCHEMA}.messages
      WHERE (sender_phone LIKE ? OR recipient_phone LIKE ?)
        AND is_group = 0
        AND received_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY HOUR(received_at)
      ORDER BY message_count DESC
      LIMIT 5
    `, [`%${suffix}`, `%${suffix}`]);

    // Média de mensagens por sessão
    const [sessionStats] = await db().query(`
      SELECT 
        AVG(msg_count) as avg_messages_per_session,
        AVG(duration_minutes) as avg_session_duration
      FROM (
        SELECT 
          session_id,
          COUNT(*) as msg_count,
          TIMESTAMPDIFF(MINUTE, MIN(received_at), MAX(received_at)) as duration_minutes
        FROM ${SUPERBOT_SCHEMA}.messages
        WHERE (sender_phone LIKE ? OR recipient_phone LIKE ?)
          AND is_group = 0
        GROUP BY session_id
      ) sessions
    `, [`%${suffix}`, `%${suffix}`]);

    const result = {
      ...rows[0],
      avg_messages_per_session: sessionStats[0]?.avg_messages_per_session || 0,
      avg_session_duration_minutes: sessionStats[0]?.avg_session_duration || 0,
      peak_hours: hourlyStats.map(h => ({ hour: h.hour, count: h.message_count }))
    };

    await cacheSet(cacheKey, result, CACHE_TTL.STATS);
    return result;
  },

  /**
   * Busca transcrições de áudio de um cliente
   */
  async getTranscriptions(phone, options = {}) {
    const { days = 30, limit = 50 } = options;
    const suffix = getPhoneSuffix(phone);

    const [rows] = await db().query(`
      SELECT 
        m.id as message_id,
        m.session_id,
        m.sender_phone,
        m.direction,
        m.received_at,
        mm.id as media_id,
        mm.duration as audio_duration,
        mm.is_voice_note,
        mt.transcription_text,
        mt.confidence,
        mt.language,
        mt.service_used,
        mt.status as transcription_status
      FROM ${SUPERBOT_SCHEMA}.messages m
      INNER JOIN ${SUPERBOT_SCHEMA}.message_media mm ON mm.message_id = m.id
      INNER JOIN ${SUPERBOT_SCHEMA}.message_transcriptions mt ON mt.media_id = mm.id
      WHERE (m.sender_phone LIKE ? OR m.recipient_phone LIKE ?)
        AND m.received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND m.is_group = 0
        AND mt.status = 'success'
      ORDER BY m.received_at DESC
      LIMIT ?
    `, [`%${suffix}`, `%${suffix}`, days, parseInt(limit)]);

    return rows;
  },

  /**
   * Busca clientes do Superbot que podem ser vinculados a clientes do leads-agent
   * Match por telefone similar
   */
  async findPotentialLinks(options = {}) {
    const { limit = 50, minConfidence = 50 } = options;

    const [rows] = await db().query(`
      SELECT 
        sc.id as superbot_customer_id,
        sc.phone_number as superbot_phone,
        sc.name as superbot_name,
        sc.push_name,
        c.id as leads_customer_id,
        c.nome as leads_customer_name,
        c.fone as leads_phone,
        c.cnpj as cnpj,
        u.id as seller_id,
        u.nick as seller_name,
        -- Score de confiança simples baseado em match de telefone
        CASE 
          WHEN REPLACE(REPLACE(REPLACE(c.fone, ' ', ''), '-', ''), '(', '') 
               LIKE CONCAT('%', RIGHT(sc.phone_number, 9), '%') THEN 90
          WHEN REPLACE(REPLACE(REPLACE(c.fone, ' ', ''), '-', ''), '(', '') 
               LIKE CONCAT('%', RIGHT(sc.phone_number, 8), '%') THEN 70
          ELSE 50
        END as confidence_score
      FROM ${SUPERBOT_SCHEMA}.superbot_customers sc
      CROSS JOIN mak.clientes c
      LEFT JOIN mak.rolemak_users u ON u.id = c.vendedor
      WHERE sc.is_group = 0
        AND REPLACE(REPLACE(REPLACE(c.fone, ' ', ''), '-', ''), '(', '') 
            LIKE CONCAT('%', RIGHT(sc.phone_number, 8), '%')
        AND NOT EXISTS (
          SELECT 1 FROM ${LINKS_TABLE} scl 
          WHERE scl.superbot_customer_id = sc.id
        )
      HAVING confidence_score >= ?
      ORDER BY confidence_score DESC, sc.updated_at DESC
      LIMIT ?
    `, [minConfidence, parseInt(limit)]);

    return rows;
  },

  /**
   * Verifica se tabela de links existe
   */
  async ensureLinkTableExists() {
    const [tables] = await db().query(`
      SHOW TABLES IN ${SUPERBOT_SCHEMA} LIKE 'superbot_customer_links'
    `);

    if (tables.length === 0) {
      await db().query(`
        CREATE TABLE ${LINKS_TABLE} (
          id INT AUTO_INCREMENT PRIMARY KEY,
          superbot_customer_id INT NOT NULL,
          leads_customer_id INT NOT NULL,
          linked_by INT NULL,
          linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          confidence_score DECIMAL(5,2) DEFAULT 0,
          verified BOOLEAN DEFAULT FALSE,
          notes TEXT NULL,
          
          UNIQUE KEY uk_link (superbot_customer_id, leads_customer_id),
          INDEX idx_superbot (superbot_customer_id),
          INDEX idx_leads (leads_customer_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      return true;
    }
    return false;
  },

  /**
   * Cria vínculo entre cliente Superbot e cliente leads-agent
   */
  async createLink(superbotCustomerId, leadsCustomerId, options = {}) {
    const { linkedBy = null, confidenceScore = 0, verified = false, notes = null } = options;

    await this.ensureLinkTableExists();

    const [result] = await db().query(`
      INSERT INTO ${LINKS_TABLE} 
        (superbot_customer_id, leads_customer_id, linked_by, confidence_score, verified, notes)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        linked_by = VALUES(linked_by),
        confidence_score = VALUES(confidence_score),
        verified = VALUES(verified),
        notes = VALUES(notes),
        linked_at = CURRENT_TIMESTAMP
    `, [superbotCustomerId, leadsCustomerId, linkedBy, confidenceScore, verified, notes]);

    // Invalida cache do cliente
    const customer = await this.getCustomerById(superbotCustomerId);
    if (customer) {
      await cacheDelete(`superbot:customer:${customer.phone_number}`);
    }

    return result;
  },

  /**
   * Remove vínculo entre clientes
   */
  async removeLink(superbotCustomerId, leadsCustomerId) {
    const [result] = await db().query(`
      DELETE FROM ${LINKS_TABLE}
      WHERE superbot_customer_id = ? AND leads_customer_id = ?
    `, [superbotCustomerId, leadsCustomerId]);

    return result.affectedRows > 0;
  },

  /**
   * Busca cliente Superbot por ID
   */
  async getCustomerById(id) {
    const [rows] = await db().query(`
      SELECT * FROM ${SUPERBOT_SCHEMA}.superbot_customers WHERE id = ?
    `, [id]);
    return rows[0] || null;
  },

  /**
   * Busca links existentes de um cliente
   */
  async getCustomerLinks(superbotCustomerId) {
    await this.ensureLinkTableExists();

    const [rows] = await db().query(`
      SELECT 
        scl.*,
        c.nome as leads_customer_name,
        c.cnpj as cnpj,
        c.fone as leads_phone,
        u.nick as seller_name
      FROM ${LINKS_TABLE} scl
      INNER JOIN mak.clientes c ON c.id = scl.leads_customer_id
      LEFT JOIN mak.rolemak_users u ON u.id = c.vendedor
      WHERE scl.superbot_customer_id = ?
    `, [superbotCustomerId]);

    return rows;
  },

  /**
   * Busca cliente Superbot vinculado a um cliente leads-agent
   */
  async findLinkedSuperbotCustomer(leadsCustomerId) {
    await this.ensureLinkTableExists();

    const [rows] = await db().query(`
      SELECT 
        sc.*,
        scl.confidence_score,
        scl.verified,
        scl.linked_at
      FROM ${LINKS_TABLE} scl
      INNER JOIN ${SUPERBOT_SCHEMA}.superbot_customers sc ON sc.id = scl.superbot_customer_id
      WHERE scl.leads_customer_id = ?
      ORDER BY scl.verified DESC, scl.confidence_score DESC
      LIMIT 1
    `, [leadsCustomerId]);

    return rows[0] || null;
  },

  // ==========================================
  // SELLER PHONES - Vincular telefones a vendedores
  // ==========================================

  /**
   * Lista todos os telefones de vendedores
   */
  async listSellerPhones() {
    const [rows] = await db().query(`
      SELECT 
        sp.*,
        COALESCE(u.nick, u.user) as seller_name,
        u.email as seller_email,
        u.level as seller_level
      FROM ${SUPERBOT_SCHEMA}.seller_phones sp
      LEFT JOIN mak.rolemak_users u ON u.id = sp.user_id
      WHERE sp.is_active = 1
      ORDER BY sp.user_id, sp.is_primary DESC
    `);
    return rows;
  },

  /**
   * Busca telefones de um vendedor específico
   */
  async getSellerPhones(userId) {
    const [rows] = await db().query(`
      SELECT * FROM ${SUPERBOT_SCHEMA}.seller_phones
      WHERE user_id = ? AND is_active = 1
      ORDER BY is_primary DESC
    `, [userId]);
    return rows;
  },

  /**
   * Adiciona telefone a um vendedor
   */
  async addSellerPhone(userId, phoneNumber, options = {}) {
    const { phoneName = null, isPrimary = false } = options;

    const [result] = await db().query(`
      INSERT INTO ${SUPERBOT_SCHEMA}.seller_phones 
        (user_id, phone_number, phone_name, is_primary)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        user_id = VALUES(user_id),
        phone_name = VALUES(phone_name),
        is_primary = VALUES(is_primary),
        is_active = 1
    `, [userId, phoneNumber, phoneName, isPrimary]);

    return result;
  },

  /**
   * Remove telefone de vendedor
   */
  async removeSellerPhone(phoneNumber) {
    const [result] = await db().query(`
      UPDATE ${SUPERBOT_SCHEMA}.seller_phones 
      SET is_active = 0 
      WHERE phone_number = ?
    `, [phoneNumber]);
    return result.affectedRows > 0;
  },

  /**
   * Busca vendedor pelo telefone do bot
   */
  async getSellerByPhone(phoneNumber) {
    const suffix = getPhoneSuffix(phoneNumber);

    const [rows] = await db().query(`
      SELECT 
        sp.*,
        u.id as user_id,
        u.nick as seller_name,
        u.email as seller_email,
        u.level as seller_level
      FROM ${SUPERBOT_SCHEMA}.seller_phones sp
      INNER JOIN mak.rolemak_users u ON u.id = sp.user_id
      WHERE sp.is_active = 1
        AND (sp.phone_number = ? OR sp.phone_number LIKE ?)
    `, [phoneNumber, `%${suffix}`]);

    return rows[0] || null;
  },

  /**
   * Lista clientes filtrados por vendedor (para usuários level < 4)
   * Filtra apenas clientes que conversaram com os telefones do vendedor
   */
  async listCustomersBySeller(userId, options = {}) {
    const { page = 1, limit = 20, search = '' } = options;
    const offset = (page - 1) * limit;

    // Primeiro, buscar os telefones do vendedor
    const sellerPhones = await this.getSellerPhones(userId);

    if (sellerPhones.length === 0) {
      // Vendedor não tem telefones vinculados - retorna vazio
      return {
        customers: [],
        total: 0,
        page,
        limit,
        sellerPhones: []
      };
    }

    const phoneNumbers = sellerPhones.map(p => p.phone_number);
    const phonePlaceholders = phoneNumbers.map(() => '?').join(',');

    let whereClause = 'WHERE sc.is_group = 0';
    const params = [];

    if (search) {
      whereClause += ` AND (
        sc.name LIKE ? OR 
        sc.push_name LIKE ? OR 
        sc.phone_number LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Query que filtra clientes que conversaram com os telefones do vendedor
    const [customers] = await db().query(`
      SELECT DISTINCT
        sc.id,
        sc.jid,
        sc.name,
        sc.push_name,
        sc.phone_number,
        sc.is_group,
        sc.created_at,
        sc.updated_at,
        MAX(m.received_at) as last_message_at,
        COUNT(DISTINCT m.id) as total_messages
      FROM ${SUPERBOT_SCHEMA}.superbot_customers sc
      INNER JOIN ${SUPERBOT_SCHEMA}.messages m ON (
        (m.sender_phone = sc.phone_number OR m.recipient_phone = sc.phone_number)
        AND (m.sender_phone IN (${phonePlaceholders}) OR m.recipient_phone IN (${phonePlaceholders}))
      )
      ${whereClause}
      GROUP BY sc.id
      ORDER BY last_message_at DESC
      LIMIT ? OFFSET ?
    `, [...phoneNumbers, ...phoneNumbers, ...params, parseInt(limit), parseInt(offset)]);

    // Contar total
    const [countResult] = await db().query(`
      SELECT COUNT(DISTINCT sc.id) as total
      FROM ${SUPERBOT_SCHEMA}.superbot_customers sc
      INNER JOIN ${SUPERBOT_SCHEMA}.messages m ON (
        (m.sender_phone = sc.phone_number OR m.recipient_phone = sc.phone_number)
        AND (m.sender_phone IN (${phonePlaceholders}) OR m.recipient_phone IN (${phonePlaceholders}))
      )
      ${whereClause}
    `, [...phoneNumbers, ...phoneNumbers, ...params]);

    return {
      customers,
      total: countResult[0]?.total || 0,
      page,
      limit,
      sellerPhones: phoneNumbers
    };
  },

  /**
   * Busca mensagens filtradas por vendedor
   */
  async getMessagesBySeller(userId, options = {}) {
    const { phone = null, days = 7, limit = 100 } = options;

    // Buscar telefones do vendedor
    const sellerPhones = await this.getSellerPhones(userId);

    if (sellerPhones.length === 0) {
      return [];
    }

    const phoneNumbers = sellerPhones.map(p => p.phone_number);
    const phonePlaceholders = phoneNumbers.map(() => '?').join(',');

    let whereClause = `
      WHERE (m.sender_phone IN (${phonePlaceholders}) OR m.recipient_phone IN (${phonePlaceholders}))
        AND m.is_group = 0
        AND m.received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    const params = [...phoneNumbers, ...phoneNumbers, days];

    // Se filtrar por telefone específico do cliente
    if (phone) {
      const suffix = getPhoneSuffix(phone);
      whereClause += ` AND (m.sender_phone LIKE ? OR m.recipient_phone LIKE ?)`;
      params.push(`%${suffix}`, `%${suffix}`);
    }

    const [rows] = await db().query(`
      SELECT 
        m.id,
        m.message_id,
        m.session_id,
        m.sender_phone,
        m.recipient_phone,
        m.message_text,
        m.direction,
        m.message_type,
        m.received_at,
        mm.type as media_type,
        mm.s3_url as media_url,
        mm.is_voice_note,
        mt.transcription_text
      FROM ${SUPERBOT_SCHEMA}.messages m
      LEFT JOIN ${SUPERBOT_SCHEMA}.message_media mm ON mm.message_id = m.id
      LEFT JOIN ${SUPERBOT_SCHEMA}.message_transcriptions mt ON mt.media_id = mm.id
      ${whereClause}
      ORDER BY m.received_at DESC
      LIMIT ?
    `, [...params, parseInt(limit)]);

    return rows;
  }
};

export default SuperbotRepository;
