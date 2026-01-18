/**
 * Migration: Superbot Integration
 * 
 * Cria tabelas e views necessárias para integração com Superbot
 * 
 * @version 1.0
 * @date 2026-01-17
 */

import { getDatabase } from '../config/database.js';
import logger from '../config/logger.js';

const db = () => getDatabase();

export async function initSuperbotIntegration() {
  try {
    logger.info('Iniciando migration: Superbot Integration...');

    // 1. Criar tabela de links entre clientes Superbot e leads-agent
    await createCustomerLinksTable();

    // 2. Criar tabela de origens de leads do WhatsApp
    await createLeadOriginsTable();

    // 3. Criar view de clientes unificados
    await createUnifiedCustomersView();

    // 4. Criar view de estatísticas de conversas
    await createConversationStatsView();

    // 5. Criar índices para otimização de analytics
    await createAnalyticsIndexes();

    // 6. Criar tabela de notificações
    await createNotificationsTable();

    logger.info('✅ Migration Superbot Integration concluída com sucesso');
    return true;
  } catch (error) {
    logger.error('❌ Erro na migration Superbot Integration', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
}

/**
 * Cria tabela de links entre clientes Superbot e leads-agent
 */
async function createCustomerLinksTable() {
  const [tables] = await db().query(`
    SHOW TABLES IN superbot LIKE 'superbot_customer_links'
  `);

  if (tables.length === 0) {
    await db().query(`
      CREATE TABLE superbot.superbot_customer_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        superbot_customer_id INT NOT NULL COMMENT 'ID do cliente na tabela superbot_customers',
        leads_customer_id INT NOT NULL COMMENT 'ID do cliente na tabela mak.clientes (cCliente)',
        linked_by INT NULL COMMENT 'ID do usuário que criou o link',
        linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        confidence_score DECIMAL(5,2) DEFAULT 0 COMMENT 'Score de confiança do match (0-100)',
        verified BOOLEAN DEFAULT FALSE COMMENT 'Se o link foi verificado manualmente',
        notes TEXT NULL COMMENT 'Notas sobre o vínculo',
        
        UNIQUE KEY uk_superbot_leads (superbot_customer_id, leads_customer_id),
        INDEX idx_superbot_customer (superbot_customer_id),
        INDEX idx_leads_customer (leads_customer_id),
        INDEX idx_verified (verified),
        INDEX idx_linked_at (linked_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 
        COMMENT='Vinculação entre clientes do Superbot (WhatsApp) e clientes do leads-agent'
    `);
    logger.info('Tabela superbot.superbot_customer_links criada');
  } else {
    logger.info('Tabela superbot.superbot_customer_links já existe');
  }
}

/**
 * Cria tabela de origens de leads criados via WhatsApp
 */
async function createLeadOriginsTable() {
  const [tables] = await db().query(`
    SHOW TABLES LIKE 'superbot_lead_origins'
  `);

  if (tables.length === 0) {
    await db().query(`
      CREATE TABLE superbot_lead_origins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lead_id INT NOT NULL COMMENT 'ID do lead na tabela sCart (cSCart)',
        session_id VARCHAR(50) NOT NULL COMMENT 'ID da sessão do WhatsApp',
        message_id INT NULL COMMENT 'ID da mensagem que originou o lead',
        superbot_customer_id INT NULL COMMENT 'ID do cliente Superbot',
        intent_detected VARCHAR(80) COMMENT 'Intenção detectada (QUOTE_REQUEST, etc)',
        confidence DECIMAL(5,4) COMMENT 'Confiança da detecção (0-1)',
        entities_json JSON COMMENT 'Entidades extraídas (produtos, quantidades)',
        auto_created BOOLEAN DEFAULT FALSE COMMENT 'Se foi criado automaticamente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE KEY uk_lead (lead_id),
        INDEX idx_session (session_id),
        INDEX idx_superbot_customer (superbot_customer_id),
        INDEX idx_intent (intent_detected),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 
        COMMENT='Rastreamento de leads originados do WhatsApp'
    `);
    logger.info('Tabela superbot_lead_origins criada');
  } else {
    logger.info('Tabela superbot_lead_origins já existe');
  }
}

/**
 * Cria view de clientes unificados (Superbot + leads-agent)
 */
async function createUnifiedCustomersView() {
  try {
    // Verificar se as tabelas do superbot existem
    const [superbotTables] = await db().query(`
      SELECT COUNT(*) as cnt FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'superbot' AND TABLE_NAME = 'superbot_customers'
    `);

    if (superbotTables[0].cnt === 0) {
      logger.warn('Tabela superbot.superbot_customers não encontrada - view não será criada');
      return;
    }

    await db().query(`DROP VIEW IF EXISTS superbot.vw_superbot_leads_customers`);

    await db().query(`
      CREATE VIEW superbot.vw_superbot_leads_customers AS
      SELECT 
        sc.id as superbot_customer_id,
        sc.jid as whatsapp_jid,
        sc.phone_number as superbot_phone,
        sc.name as superbot_name,
        sc.push_name as whatsapp_push_name,
        sc.is_group,
        sc.created_at as superbot_created_at,
        sc.updated_at as superbot_updated_at,
        
        -- Dados do leads-agent (via link)
        scl.id as link_id,
        scl.confidence_score,
        scl.verified as link_verified,
        scl.linked_at,
        scl.linked_by,
        
        -- Dados do cliente leads-agent
        c.id as leads_customer_id,
        c.nome as leads_customer_name,
        c.Fantasia as leads_trade_name,
        c.cnpj as cnpj,
        c.fone as leads_phone,
        c.email as leads_email,
        c.cidade as city,
        c.estado as state,
        
        -- Dados do vendedor
        u.id as seller_id,
        u.nick as seller_name,
        u.segmento as seller_segment,
        
        -- Status do link
        CASE 
          WHEN scl.id IS NOT NULL AND scl.verified = 1 THEN 'verified'
          WHEN scl.id IS NOT NULL THEN 'linked'
          ELSE 'unlinked'
        END as link_status
        
      FROM superbot.superbot_customers sc
      LEFT JOIN superbot.superbot_customer_links scl ON scl.superbot_customer_id = sc.id
      LEFT JOIN mak.clientes c ON c.id = scl.leads_customer_id
      LEFT JOIN mak.users u ON u.id = c.vendedor
      WHERE sc.is_group = 0
    `);

    logger.info('View superbot.vw_superbot_leads_customers criada');
  } catch (error) {
    logger.warn('Não foi possível criar view vw_superbot_leads_customers', { error: error.message });
  }
}

/**
 * Cria view de estatísticas de conversas por cliente
 */
async function createConversationStatsView() {
  try {
    // Verificar se as tabelas do superbot existem
    const [messagesTables] = await db().query(`
      SELECT COUNT(*) as cnt FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'superbot' AND TABLE_NAME = 'messages'
    `);

    if (messagesTables[0].cnt === 0) {
      logger.warn('Tabela superbot.messages não encontrada - view não será criada');
      return;
    }

    await db().query(`DROP VIEW IF EXISTS vw_superbot_customer_stats`);

    await db().query(`
      CREATE VIEW vw_superbot_customer_stats AS
      SELECT 
        sc.id as superbot_customer_id,
        sc.phone_number,
        sc.name,
        sc.push_name,
        
        -- Estatísticas de mensagens
        COUNT(DISTINCT m.id) as total_messages,
        COUNT(DISTINCT m.session_id) as total_sessions,
        SUM(CASE WHEN m.direction = 'incoming' THEN 1 ELSE 0 END) as incoming_count,
        SUM(CASE WHEN m.direction = 'outgoing' THEN 1 ELSE 0 END) as outgoing_count,
        
        -- Datas
        MIN(m.received_at) as first_message_at,
        MAX(m.received_at) as last_message_at,
        
        -- Mídia
        SUM(CASE WHEN mm.id IS NOT NULL THEN 1 ELSE 0 END) as media_count,
        SUM(CASE WHEN mm.is_voice_note = 1 THEN 1 ELSE 0 END) as voice_notes_count,
        SUM(CASE WHEN mt.id IS NOT NULL THEN 1 ELSE 0 END) as transcriptions_count,
        
        -- Respostas IA
        SUM(CASE WHEN mr.id IS NOT NULL THEN 1 ELSE 0 END) as ai_responses_count,
        
        -- Calculados
        DATEDIFF(NOW(), MAX(m.received_at)) as days_since_last_message,
        ROUND(COUNT(m.id) / NULLIF(COUNT(DISTINCT m.session_id), 0), 1) as avg_messages_per_session
        
      FROM superbot.superbot_customers sc
      LEFT JOIN superbot.messages m ON (
        m.sender_phone LIKE CONCAT('%', RIGHT(sc.phone_number, 9))
        OR m.recipient_phone LIKE CONCAT('%', RIGHT(sc.phone_number, 9))
      ) AND m.is_group = 0
      LEFT JOIN superbot.message_media mm ON mm.message_id = m.id
      LEFT JOIN superbot.message_transcriptions mt ON mt.media_id = mm.id
      LEFT JOIN superbot.message_responses mr ON mr.message_id = m.id
      WHERE sc.is_group = 0
      GROUP BY sc.id
    `);

    logger.info('View vw_superbot_customer_stats criada');
  } catch (error) {
    logger.warn('Não foi possível criar view vw_superbot_customer_stats', { error: error.message });
  }
}

/**
 * Cria índices para otimização de queries de analytics
 */
async function createAnalyticsIndexes() {
  const indexes = [
    {
      name: 'idx_messages_analytics',
      table: 'superbot.messages',
      columns: '(received_at, is_group, direction)'
    },
    {
      name: 'idx_messages_sender',
      table: 'superbot.messages',
      columns: '(sender_phone, received_at)'
    },
    {
      name: 'idx_messages_session',
      table: 'superbot.messages',
      columns: '(session_id, received_at)'
    }
  ];

  for (const idx of indexes) {
    try {
      // Verificar se índice já existe
      const [existing] = await db().query(`
        SHOW INDEX FROM ${idx.table} WHERE Key_name = ?
      `, [idx.name]);

      if (existing.length === 0) {
        await db().query(`
          CREATE INDEX ${idx.name} ON ${idx.table} ${idx.columns}
        `);
        logger.info(`Índice ${idx.name} criado`);
      } else {
        logger.debug(`Índice ${idx.name} já existe`);
      }
    } catch (error) {
      // Índice pode já existir ou tabela não existir
      logger.debug(`Não foi possível criar índice ${idx.name}: ${error.message}`);
    }
  }
}

/**
 * Cria tabela de notificações se não existir
 */
async function createNotificationsTable() {
  const [tables] = await db().query(`
    SHOW TABLES LIKE 'user_notifications'
  `);

  if (tables.length === 0) {
    await db().query(`
      CREATE TABLE user_notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'system',
        title VARCHAR(255) NOT NULL,
        message TEXT,
        priority TINYINT DEFAULT 2,
        data JSON,
        expires_at DATETIME DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        read_at DATETIME DEFAULT NULL,
        
        INDEX idx_user_notifications_user (user_id, read_at, created_at),
        INDEX idx_user_notifications_type (type, created_at),
        INDEX idx_user_notifications_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('Tabela user_notifications criada');
  } else {
    logger.debug('Tabela user_notifications já existe');
  }
}

export default initSuperbotIntegration;
