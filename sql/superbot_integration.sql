-- =============================================================================
-- DDL SUPERBOT INTEGRATION — LEADS AGENT
-- Sistema de Integração com WhatsApp (Superbot)
-- Versão: 1.0 | Data: 17 de Janeiro 2026
-- =============================================================================

-- =============================================================================
-- TABELAS DE INTEGRAÇÃO
-- =============================================================================

-- -----------------------------------------------------------------------------
-- superbot_customer_links
-- Vinculação entre clientes do Superbot (WhatsApp) e clientes do leads-agent
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS superbot_customer_links (
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
  COMMENT='Vinculação entre clientes do Superbot (WhatsApp) e clientes do leads-agent';


-- -----------------------------------------------------------------------------
-- superbot_lead_origins
-- Rastreamento de leads originados do WhatsApp
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS superbot_lead_origins (
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
  INDEX idx_created_at (created_at),
  INDEX idx_auto_created (auto_created)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 
  COMMENT='Rastreamento de leads originados do WhatsApp';


-- =============================================================================
-- VIEWS DE INTEGRAÇÃO
-- =============================================================================

-- -----------------------------------------------------------------------------
-- vw_superbot_leads_customers
-- View unificada de clientes Superbot + leads-agent
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS superbot.vw_superbot_leads_customers;

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
  
  -- Dados do link
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
LEFT JOIN mak.superbot_customer_links scl ON scl.superbot_customer_id = sc.id
LEFT JOIN mak.clientes c ON c.id = scl.leads_customer_id
LEFT JOIN mak.users u ON u.id = c.vendedor
WHERE sc.is_group = 0;


-- -----------------------------------------------------------------------------
-- vw_superbot_customer_stats
-- Estatísticas de conversas por cliente
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS vw_superbot_customer_stats;

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
GROUP BY sc.id;


-- -----------------------------------------------------------------------------
-- vw_superbot_lead_origins_summary
-- Resumo de leads criados via WhatsApp
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS vw_superbot_lead_origins_summary;

CREATE VIEW vw_superbot_lead_origins_summary AS
SELECT 
  slo.id,
  slo.lead_id,
  slo.session_id,
  slo.intent_detected,
  slo.confidence,
  slo.auto_created,
  slo.created_at,
  
  -- Dados do lead
  s.dCart as lead_date,
  s.cType as lead_type,
  s.cOrderWeb as order_id,
  
  -- Dados do cliente Superbot
  sc.phone_number as superbot_phone,
  sc.name as superbot_name,
  
  -- Dados do cliente leads-agent (via link)
  c.xNome as customer_name,
  c.xCNPJ as cnpj,
  
  -- Vendedor
  u.nick as seller_name,
  
  -- Total do lead
  (
    SELECT COALESCE(SUM(vTotal), 0)
    FROM sCartItem 
    WHERE cSCart = slo.lead_id
  ) as lead_total_value
  
FROM superbot_lead_origins slo
LEFT JOIN sCart s ON s.cSCart = slo.lead_id
LEFT JOIN superbot.superbot_customers sc ON sc.id = slo.superbot_customer_id
LEFT JOIN superbot_customer_links scl ON scl.superbot_customer_id = sc.id
LEFT JOIN mak.clientes c ON c.cCliente = COALESCE(scl.leads_customer_id, s.cCustomer)
LEFT JOIN mak.users u ON u.id = s.cSeller;


-- =============================================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =============================================================================

-- Índice para busca por telefone nas mensagens (fuzzy match)
-- Nota: Este índice pode já existir, verifique antes de executar
-- CREATE INDEX idx_messages_phone_suffix ON messages (
--   (RIGHT(sender_phone, 9)),
--   (RIGHT(recipient_phone, 9))
-- );


-- =============================================================================
-- NOTAS DE IMPLEMENTAÇÃO
-- =============================================================================

/*
TABELAS DO SUPERBOT (já existentes, não criar):
- superbot_customers: Clientes do WhatsApp (JID, nome, telefone)
- messages: Mensagens de conversas
- message_media: Arquivos de mídia (áudio, imagem, vídeo)
- message_transcriptions: Transcrições de áudio (Whisper)
- message_responses: Respostas da IA
- whatsapp_deliveries: Log de entregas
- phone_validations: Cache de validações de telefone

TABELAS CRIADAS PELA INTEGRAÇÃO:
- superbot_customer_links: Link Superbot ↔ leads-agent
- superbot_lead_origins: Origem de leads do WhatsApp

VIEWS CRIADAS:
- vw_superbot_leads_customers: Clientes unificados
- vw_superbot_customer_stats: Estatísticas por cliente
- vw_superbot_lead_origins_summary: Resumo de leads WhatsApp
*/

-- =============================================================================
-- FIM DO DDL
-- =============================================================================
