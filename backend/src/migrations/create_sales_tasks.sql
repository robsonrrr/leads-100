-- =========================================================
-- Daily Tasks - DDL Principal v1.2 (Patch B + C)
-- Sistema de Tarefas Diárias OODA-driven
-- Schema: staging
-- Leads Agent - Rolemak
-- Criado: 2026-01-18
-- Atualizado: 2026-01-18 (Patch C: FK prefixes + event_ts docs)
-- =========================================================
--
-- PATCH B adiciona:
-- 1. sales_raw_signal (black box do Observe)
-- 2. sales_signal_feature (Normalize/Score explícito)
-- 3. orientation_snapshot ganha versionamento + sources
-- 4. sales_task ganha outcome_reason_code + BACKLOG + dedup
-- 5. sales_outcome_reason (taxonomia de reasons)
--
-- PATCH C adiciona:
-- 1. Prefixo staging. em todas as FKs (cross-schema safety)
-- 2. Documentação de event_ts para SLA calculation
-- 3. Decisões operacionais (scheduler on-login)
--
-- =========================================================

USE staging;

-- =========================================================
-- 1. TABELA: sales_task_run
-- Registra cada execução de geração de tasks
-- =========================================================
CREATE TABLE IF NOT EXISTS sales_task_run (
  run_id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  run_date         DATE            NOT NULL COMMENT 'Data de referência do run',
  seller_id        INT UNSIGNED    NOT NULL COMMENT 'ID do vendedor (mak.vendedores.id)',
  started_at       DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  finished_at      DATETIME(6)     NULL,
  status           ENUM('RUNNING','DONE','FAILED') NOT NULL DEFAULT 'RUNNING',
  stats_json       JSON            NULL COMMENT 'Estatísticas do run',
  error_msg        TEXT            NULL COMMENT 'Mensagem de erro se FAILED',
  PRIMARY KEY (run_id),
  UNIQUE KEY uq_run_seller_date (seller_id, run_date),
  KEY ix_run_date (run_date),
  KEY ix_run_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Registros de execução diária de geração de tasks';

-- =========================================================
-- 2. TABELA: sales_raw_signal (PATCH B - Observability)
-- Black box do Observe: sinais brutos com dedup
-- =========================================================
CREATE TABLE IF NOT EXISTS sales_raw_signal (
  signal_id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  run_id           BIGINT UNSIGNED NOT NULL,
  seller_id        INT UNSIGNED    NULL,
  customer_id      INT UNSIGNED    NULL,

  -- Fonte e tipo do sinal
  source           ENUM('CRM','WHATSAPP','EMAIL','ERP','STOCK','CREDIT','PRICING','AGENT','GOAL','CHURN') NOT NULL,
  signal_type      VARCHAR(64)     NOT NULL COMMENT 'ex: WHATSAPP_INBOUND, QUOTE_AGING, LEAD_STAGE_CHANGED',
  signal_ts        DATETIME(6)     NOT NULL COMMENT 'Timestamp do evento original (event_ts para SLA calc)',

  -- Entidade relacionada
  entity_type      VARCHAR(32)     NULL COMMENT 'LEAD, QUOTE, ORDER, MSG, CUSTOMER',
  entity_id        VARCHAR(64)     NULL,

  -- Payload original (para debug)
  payload_json     JSON            NOT NULL,

  -- Dedup por run (evita duplicar sinais ao reprocessar)
  dedup_hash       CHAR(32)        NOT NULL COMMENT 'MD5 hash para dedup',

  created_at       DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  
  PRIMARY KEY (signal_id),
  KEY ix_signal_run (run_id),
  KEY ix_signal_seller_ts (seller_id, signal_ts),
  KEY ix_signal_customer_ts (customer_id, signal_ts),
  KEY ix_signal_type (signal_type),
  UNIQUE KEY uq_signal_run_dedup (run_id, dedup_hash),
  CONSTRAINT fk_signal_run FOREIGN KEY (run_id) REFERENCES staging.sales_task_run(run_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Sinais brutos coletados (OBSERVE) - black box para debug';

-- =========================================================
-- 3. TABELA: sales_signal_feature (PATCH B - Normalize)
-- Features derivadas dos sinais para motor de regras
-- =========================================================
CREATE TABLE IF NOT EXISTS sales_signal_feature (
  feature_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  run_id           BIGINT UNSIGNED NOT NULL,
  seller_id        INT UNSIGNED    NULL,
  customer_id      INT UNSIGNED    NULL,

  -- Entidade (opcional)
  entity_type      VARCHAR(32)     NULL,
  entity_id        VARCHAR(64)     NULL,

  -- Feature key e valor
  feature_key      VARCHAR(64)     NOT NULL COMMENT 'ex: INBOUND_UNREPLIED_HOURS, QUOTE_AGE_DAYS',
  feature_value    DECIMAL(18,6)   NULL COMMENT 'Valor numérico',
  feature_str      VARCHAR(255)    NULL COMMENT 'Valor string (se aplicável)',
  feature_json     JSON            NULL COMMENT 'Valor estruturado',

  computed_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  PRIMARY KEY (feature_id),
  KEY ix_feat_run (run_id),
  KEY ix_feat_seller_customer (seller_id, customer_id),
  KEY ix_feat_key (feature_key),
  KEY ix_feat_entity (entity_type, entity_id),
  CONSTRAINT fk_feat_run FOREIGN KEY (run_id) REFERENCES staging.sales_task_run(run_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Features normalizadas (NORMALIZE) para motor de regras';

-- =========================================================
-- 4. TABELA: sales_orientation_snapshot (v1.1 com provenance)
-- Contexto/modelo mental do cliente no momento do run
-- =========================================================
CREATE TABLE IF NOT EXISTS sales_orientation_snapshot (
  snapshot_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  run_id           BIGINT UNSIGNED NOT NULL,
  seller_id        INT UNSIGNED    NOT NULL,
  customer_id      INT UNSIGNED    NOT NULL COMMENT 'ID do cliente (mak.clientes.id)',
  
  -- JSON completo da orientação
  orientation_json JSON            NOT NULL COMMENT 'Contexto completo em JSON',
  
  -- PATCH B: Versionamento e proveniência
  orientation_ver  INT             NOT NULL DEFAULT 1 COMMENT 'Versão do modelo/heurística',
  orientation_sources_json JSON    NULL COMMENT 'Quais features/signals alimentaram',
  computed_at      DATETIME(6)     NULL COMMENT 'Quando foi calculado',
  
  -- Campos desnormalizados para queries rápidas
  client_mode      ENUM('anchor','strategic','tactical','spot') NULL COMMENT 'Tipo de cliente',
  urgency          ENUM('high','medium','low') NULL COMMENT 'Urgência do momento',
  price_sensitivity ENUM('high','medium','low') NULL COMMENT 'Sensibilidade a preço',
  churn_risk       DECIMAL(4,3)    NULL COMMENT 'Score de churn 0-1',
  goal_progress    DECIMAL(5,2)    NULL COMMENT 'Progresso da meta em %',
  days_inactive    INT             NULL COMMENT 'Dias desde última compra',
  last_order_value DECIMAL(12,2)   NULL COMMENT 'Valor da última compra',
  
  created_at       DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  
  PRIMARY KEY (snapshot_id),
  KEY ix_orient_run (run_id),
  KEY ix_orient_customer (customer_id),
  KEY ix_orient_seller_customer (seller_id, customer_id),
  KEY ix_orient_churn (churn_risk DESC),
  KEY ix_orient_ver (orientation_ver),
  CONSTRAINT fk_orient_run FOREIGN KEY (run_id) REFERENCES staging.sales_task_run(run_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Snapshots de orientação por cliente (ORIENT) - versionados';

-- =========================================================
-- 5. TABELA: sales_task_rule
-- Regras configuráveis para geração de tasks
-- =========================================================
CREATE TABLE IF NOT EXISTS sales_task_rule (
  rule_id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  is_enabled       TINYINT(1)   NOT NULL DEFAULT 1,
  
  -- Classificação
  task_bucket      ENUM('CRITICAL','OPPORTUNITY','HYGIENE') NOT NULL,
  task_type        VARCHAR(64)  NOT NULL COMMENT 'Tipo: REPLY_WHATSAPP, QUOTE_FOLLOWUP, etc',
  
  -- Template
  title_template   VARCHAR(200) NOT NULL COMMENT 'Template: {customer_name}, {entity_id}',
  description_template TEXT     NULL COMMENT 'Descrição detalhada',
  
  -- Priorização
  priority_base    INT          NOT NULL DEFAULT 50 COMMENT '0-100',
  sla_hours        INT          NOT NULL DEFAULT 24 COMMENT 'SLA em horas',
  max_per_day      INT          NOT NULL DEFAULT 0 COMMENT '0 = sem limite',
  
  -- Configuração em JSON (schema padronizado - ver comentários)
  -- conditions_json schema:
  -- {
  --   "requires_any_feature": ["FEATURE_KEY_1", "FEATURE_KEY_2"],
  --   "feature_min": {"FEATURE_KEY": value},
  --   "feature_max": {"FEATURE_KEY": value},
  --   "requires_orient": [{"path":"$.field","in":["val1","val2"]}]
  -- }
  conditions_json  JSON         NOT NULL COMMENT 'Condições para ativar (schema padronizado)',
  
  -- scoring_json schema:
  -- {
  --   "add_if_feature": [{"key":"FEATURE","min":value,"points":N}],
  --   "add_if_orient": [{"path":"$.field","equals":"value","points":N}]
  -- }
  scoring_json     JSON         NOT NULL COMMENT 'Pontos extras por features (schema padronizado)',
  
  playbook_json    JSON         NULL     COMMENT 'O que fazer/dizer',
  guardrail_json   JSON         NULL     COMMENT 'O que NÃO fazer, requires, escalate_to',
  
  -- Metadados
  created_by       INT UNSIGNED NULL,
  created_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  
  PRIMARY KEY (rule_id),
  KEY ix_rule_enabled (is_enabled, task_bucket),
  KEY ix_rule_type (task_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Regras configuráveis de geração de tasks (DECIDE)';

-- =========================================================
-- 6. TABELA: sales_outcome_reason (PATCH B - Taxonomia)
-- Motivos padronizados para outcomes
-- =========================================================
CREATE TABLE IF NOT EXISTS sales_outcome_reason (
  reason_code      VARCHAR(32)  NOT NULL,
  label            VARCHAR(80)  NOT NULL,
  description      VARCHAR(255) NULL,
  applies_to       SET('WON','LOST','NO_RESPONSE','ESCALATED','DEFERRED') NULL COMMENT 'Em quais outcomes aplicar',
  is_active        TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order       INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (reason_code),
  KEY ix_reason_active (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Taxonomia de motivos de outcome (para aprendizado)';

-- =========================================================
-- 7. TABELA: sales_task (v1.1 com BACKLOG + dedup + reason)
-- Tasks finais geradas para os vendedores
-- =========================================================
CREATE TABLE IF NOT EXISTS sales_task (
  task_id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  run_id           BIGINT UNSIGNED NOT NULL,
  run_date         DATE            NOT NULL,
  seller_id        INT UNSIGNED    NOT NULL,
  customer_id      INT UNSIGNED    NULL,
  
  -- Entidade relacionada
  entity_type      VARCHAR(32)     NULL COMMENT 'LEAD, QUOTE, WHATSAPP_MSG, CUSTOMER, ORDER',
  entity_id        VARCHAR(64)     NULL COMMENT 'ID da entidade',
  
  -- PATCH B: Dedup key
  dedup_key        VARCHAR(255)    NULL COMMENT 'Hash para evitar duplicatas por re-run',
  
  -- Classificação
  task_bucket      ENUM('CRITICAL','OPPORTUNITY','HYGIENE') NOT NULL,
  task_type        VARCHAR(64)     NOT NULL,
  title            VARCHAR(200)    NOT NULL,
  description      TEXT            NULL,
  
  -- Priorização
  priority_score   INT             NOT NULL COMMENT '0-100, maior = urgente',
  sla_due_at       DATETIME(6)     NULL COMMENT 'Deadline do SLA (calculado de evento, não de criação)',
  sla_source_ts    DATETIME(6)     NULL COMMENT 'Timestamp do evento que iniciou o SLA',
  
  -- Contexto
  customer_name    VARCHAR(200)    NULL COMMENT 'Cache do nome do cliente',
  recommended_json JSON            NULL COMMENT 'Playbook + WHY (reason codes)',
  guardrail_json   JSON            NULL COMMENT 'do_not, requires, escalate_to',
  context_json     JSON            NULL COMMENT 'Contexto extra para UI',
  
  -- Referências
  orientation_ref  BIGINT UNSIGNED NULL COMMENT 'snapshot_id',
  rule_id          INT UNSIGNED    NULL COMMENT 'Regra que gerou',
  
  -- PATCH B: Status inclui BACKLOG
  status           ENUM('OPEN','IN_PROGRESS','DONE','SNOOZED','CANCELLED','BACKLOG') NOT NULL DEFAULT 'OPEN',
  created_at       DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  started_at       DATETIME(6)     NULL,
  done_at          DATETIME(6)     NULL,
  snoozed_until    DATETIME(6)     NULL,
  
  -- Outcome (preenchido ao fechar)
  outcome_code     VARCHAR(32)     NULL COMMENT 'WON, LOST, NO_RESPONSE, ESCALATED, DEFERRED',
  outcome_reason_code VARCHAR(32)  NULL COMMENT 'PRICE, DEADLINE, NO_STOCK, CREDIT, SPEC, COMPETITOR, etc',
  outcome_note     TEXT            NULL COMMENT 'Nota livre do vendedor',
  outcome_json     JSON            NULL COMMENT 'Dados extras do outcome',
  
  PRIMARY KEY (task_id),
  KEY ix_task_run (run_id),
  KEY ix_task_seller_date (seller_id, run_date),
  KEY ix_task_seller_status (seller_id, status),
  KEY ix_task_bucket_priority (task_bucket, priority_score DESC),
  KEY ix_task_due (sla_due_at),
  KEY ix_task_customer (customer_id),
  KEY ix_task_entity (entity_type, entity_id),
  KEY ix_task_outcome (outcome_code, outcome_reason_code),
  UNIQUE KEY uq_task_dedup (dedup_key),
  CONSTRAINT fk_task_run FOREIGN KEY (run_id) REFERENCES staging.sales_task_run(run_id) ON DELETE CASCADE,
  CONSTRAINT fk_task_orient FOREIGN KEY (orientation_ref) REFERENCES staging.sales_orientation_snapshot(snapshot_id) ON DELETE SET NULL,
  CONSTRAINT fk_task_rule FOREIGN KEY (rule_id) REFERENCES staging.sales_task_rule(rule_id) ON DELETE SET NULL,
  CONSTRAINT fk_task_reason FOREIGN KEY (outcome_reason_code) REFERENCES staging.sales_outcome_reason(reason_code) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tasks diárias geradas para vendedores (ACT)';

-- =========================================================
-- 8. TABELA: sales_task_action_log
-- Log de todas as ações nas tasks (telemetria)
-- =========================================================
CREATE TABLE IF NOT EXISTS sales_task_action_log (
  log_id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_id          BIGINT UNSIGNED NOT NULL,
  
  action_type      ENUM('CREATED','VIEWED','STARTED','DONE','SNOOZED','UNSNOOZED','CANCELLED','NOTE','ESCALATED','BACKLOGGED') NOT NULL,
  action_ts        DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  
  actor_type       ENUM('SYSTEM','SELLER','MANAGER','AGENT') NOT NULL DEFAULT 'SYSTEM',
  actor_id         INT UNSIGNED    NULL,
  
  note             TEXT            NULL,
  payload_json     JSON            NULL COMMENT 'Dados extras',
  
  PRIMARY KEY (log_id),
  KEY ix_log_task (task_id, action_ts),
  KEY ix_log_actor (actor_type, actor_id),
  KEY ix_log_action (action_type),
  CONSTRAINT fk_log_task FOREIGN KEY (task_id) REFERENCES staging.sales_task(task_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Log de ações nas tasks (TELEMETRY)';

-- =========================================================
-- 9. SEEDS: Outcome Reasons (Taxonomia)
-- =========================================================
INSERT INTO sales_outcome_reason (reason_code, label, description, applies_to, sort_order) VALUES
('PRICE',       'Preço',            'Cliente travou em preço/condição comercial',           'LOST',                                1),
('DEADLINE',    'Prazo',            'Cliente travou em prazo de entrega/urgência',          'LOST',                                2),
('NO_STOCK',    'Sem estoque',      'Sem disponibilidade ou lead time inviável',            'LOST,DEFERRED',                       3),
('CREDIT',      'Crédito',          'Limite, aprovação de crédito, risco, inadimplência',   'LOST,ESCALATED',                      4),
('SPEC',        'Especificação',    'Produto/modelo não atende aplicação do cliente',       'LOST',                                5),
('COMPETITOR',  'Concorrência',     'Cliente fechou com concorrente',                       'LOST',                                6),
('NO_REPLY',    'Sem resposta',     'Cliente não respondeu após tentativas',                'NO_RESPONSE',                         7),
('CHANNEL',     'Canal',            'Conflito de canal/carteira/território',                'ESCALATED',                           8),
('APPROVED',    'Aprovado',         'Pricing/crédito aprovado com sucesso',                 'WON',                                 9),
('UPSELL',      'Upsell',           'Venda maior que o esperado',                           'WON',                                 10),
('REPEAT',      'Recompra',         'Recompra do cliente',                                  'WON',                                 11),
('WAITING',     'Aguardando',       'Aguardando retorno do cliente/interno',                'DEFERRED',                            12),
('OTHER',       'Outro',            'Motivo não classificado (evitar usar)',                'WON,LOST,NO_RESPONSE,ESCALATED,DEFERRED', 99)
ON DUPLICATE KEY UPDATE label=VALUES(label), description=VALUES(description);

-- =========================================================
-- 10. SEEDS: Regras Iniciais (v1.1 com schema padronizado)
-- =========================================================

INSERT INTO sales_task_rule (
  task_bucket, task_type, title_template, description_template,
  priority_base, sla_hours, max_per_day,
  conditions_json, scoring_json, playbook_json, guardrail_json
) VALUES

-- CRITICAL 1: WhatsApp sem resposta
(
  'CRITICAL', 
  'REPLY_WHATSAPP',
  'Responder WhatsApp — {customer_name}',
  'Cliente enviou mensagem há mais de 1 hora sem resposta',
  75, 2, 0,
  '{
    "requires_any_feature": ["INBOUND_UNREPLIED_HOURS"],
    "feature_min": {"INBOUND_UNREPLIED_HOURS": 1}
  }',
  '{
    "add_if_feature": [
      {"key": "INBOUND_UNREPLIED_HOURS", "min": 4, "points": 15}
    ],
    "add_if_orient": [
      {"path": "$.churn_risk", "min": 0.5, "points": 15},
      {"path": "$.client_mode", "in": ["anchor", "strategic"], "points": 20},
      {"path": "$.goal_progress", "max": 50, "points": 10}
    ]
  }',
  '{
    "approach": "Responder com clareza, perguntar necessidade específica",
    "sample_message": "Olá! Desculpa a demora. Sobre sua dúvida...",
    "buttons": ["Responder", "Ver Histórico", "Abrir WhatsApp"]
  }',
  '{
    "do_not": ["Dar desconto sem aprovação", "Prometer prazo sem confirmar estoque"],
    "requires": ["stock_check"],
    "escalate_to": "pricing_agent"
  }'
),

-- CRITICAL 2: Lead quente envelhecendo
(
  'CRITICAL', 
  'FOLLOWUP_HOT_LEAD',
  'Follow-up Lead Quente — {customer_name} (#{entity_id})',
  'Lead aberto há mais de 2 dias, classificado como quente',
  70, 4, 0,
  '{
    "requires_any_feature": ["LEAD_AGE_DAYS", "LEAD_IS_HOT"],
    "feature_min": {"LEAD_AGE_DAYS": 2, "LEAD_IS_HOT": 1},
    "feature_max": {"LEAD_AGE_DAYS": 7}
  }',
  '{
    "add_if_feature": [
      {"key": "LEAD_TOTAL_VALUE", "min": 10000, "points": 20}
    ],
    "add_if_orient": [
      {"path": "$.urgency", "equals": "high", "points": 15},
      {"path": "$.client_mode", "in": ["strategic"], "points": 10}
    ]
  }',
  '{
    "approach": "Perguntar objeção principal, oferecer alternativa",
    "questions": ["O que te travou?", "É preço, prazo ou especificação?"],
    "buttons": ["Ligar", "WhatsApp", "Email", "Ver Lead"]
  }',
  '{
    "do_not": ["Desistir cedo demais", "Ignorar objeções"]
  }'
),

-- CRITICAL 3: Cliente em risco de churn
(
  'CRITICAL', 
  'CONTACT_AT_RISK',
  'Contatar cliente em risco — {customer_name}',
  'Cliente com score de churn alto, precisa de atenção',
  65, 24, 3,
  '{
    "requires_any_feature": ["CHURN_RISK_SCORE"],
    "feature_min": {"CHURN_RISK_SCORE": 0.65}
  }',
  '{
    "add_if_feature": [],
    "add_if_orient": [
      {"path": "$.goal_progress", "max": 30, "points": 20},
      {"path": "$.days_inactive", "min": 60, "points": 15}
    ]
  }',
  '{
    "approach": "Ligação de relacionamento, não venda direta",
    "checklist": ["Perguntar satisfação", "Identificar problemas", "Oferecer suporte"],
    "buttons": ["Ligar", "Ver Cliente"]
  }',
  '{
    "do_not": ["Empurrar produto", "Falar de metas internas"]
  }'
),

-- OPPORTUNITY 1: Orçamento parado
(
  'OPPORTUNITY', 
  'QUOTE_FOLLOWUP',
  'Follow-up Orçamento — #{entity_id} ({customer_name})',
  'Orçamento enviado há mais de 3 dias sem resposta',
  55, 24, 0,
  '{
    "requires_any_feature": ["QUOTE_AGE_DAYS"],
    "feature_min": {"QUOTE_AGE_DAYS": 3},
    "feature_max": {"QUOTE_AGE_DAYS": 14}
  }',
  '{
    "add_if_feature": [
      {"key": "QUOTE_TOTAL_VALUE", "min": 5000, "points": 15}
    ],
    "add_if_orient": [
      {"path": "$.price_sensitivity", "equals": "low", "points": 10}
    ]
  }',
  '{
    "approach": "Descobrir objeção, oferecer alternativa",
    "questions": ["Conseguiu avaliar?", "Posso ajustar algo?", "Qual a principal dúvida?"],
    "buttons": ["Ligar", "WhatsApp", "Ver Orçamento"]
  }',
  '{
    "do_not": ["Dar desconto de primeira"]
  }'
),

-- OPPORTUNITY 2: Cliente abaixo da meta
(
  'OPPORTUNITY', 
  'PUSH_GOAL',
  'Impulsionar meta — {customer_name} ({goal_progress}%)',
  'Cliente está abaixo de 80% da meta mensal',
  50, 48, 5,
  '{
    "requires_any_feature": ["GOAL_PROGRESS_PCT"],
    "feature_max": {"GOAL_PROGRESS_PCT": 80}
  }',
  '{
    "add_if_feature": [
      {"key": "GOAL_VALUE", "min": 20000, "points": 20}
    ],
    "add_if_orient": [
      {"path": "$.client_mode", "in": ["anchor"], "points": 15}
    ]
  }',
  '{
    "approach": "Propor mix complementar, oferecer condição de volume",
    "suggestions": ["Cross-sell", "Volume discount para fechar meta"],
    "buttons": ["Ver Meta", "Sugerir Produtos", "Ligar"]
  }',
  '{
    "do_not": ["Pressionar demais"],
    "requires": ["pricing_approval"]
  }'
),

-- OPPORTUNITY 3: Cross-sell recomendado por IA
(
  'OPPORTUNITY', 
  'CROSS_SELL',
  'Oportunidade de cross-sell — {customer_name}',
  'IA identificou produtos que o cliente provavelmente precisa',
  45, 72, 5,
  '{
    "requires_any_feature": ["AI_RECOMMENDATION_CONFIDENCE"],
    "feature_min": {"AI_RECOMMENDATION_CONFIDENCE": 0.7}
  }',
  '{
    "add_if_orient": [
      {"path": "$.client_mode", "in": ["strategic", "anchor"], "points": 15}
    ]
  }',
  '{
    "approach": "Sugerir produtos complementares baseado no histórico",
    "buttons": ["Ver Recomendações", "Ligar"]
  }',
  NULL
),

-- OPPORTUNITY 4: Lead parado (não hot)
(
  'OPPORTUNITY', 
  'FOLLOWUP_LEAD',
  'Retomar Lead — {customer_name} (#{entity_id})',
  'Lead aberto há mais de 5 dias',
  40, 48, 0,
  '{
    "requires_any_feature": ["LEAD_AGE_DAYS"],
    "feature_min": {"LEAD_AGE_DAYS": 5},
    "feature_max": {"LEAD_AGE_DAYS": 30}
  }',
  '{
    "add_if_feature": [
      {"key": "LEAD_TOTAL_VALUE", "min": 3000, "points": 10}
    ]
  }',
  '{
    "approach": "Verificar interesse, oferecer ajuda",
    "buttons": ["Ver Lead", "WhatsApp", "Arquivar"]
  }',
  NULL
),

-- HYGIENE 1: Atualizar contexto do cliente
(
  'HYGIENE', 
  'UPDATE_CONTEXT',
  'Atualizar perfil — {customer_name}',
  'Última atualização do perfil há mais de 30 dias',
  30, 72, 3,
  '{
    "requires_any_feature": ["DAYS_SINCE_CONTEXT_UPDATE"],
    "feature_min": {"DAYS_SINCE_CONTEXT_UPDATE": 30}
  }',
  '{
    "add_if_orient": [
      {"path": "$.churn_risk", "min": 0.5, "points": 10}
    ]
  }',
  '{
    "checklist": [
      "Validar contato principal",
      "Atualizar segmento/aplicação",
      "Registrar objeções frequentes",
      "Confirmar prazo de entrega preferido"
    ],
    "buttons": ["Abrir Cliente"]
  }',
  NULL
),

-- HYGIENE 2: Cliente inativo
(
  'HYGIENE', 
  'REACTIVATE_INACTIVE',
  'Reativar cliente inativo — {customer_name} ({days_inactive} dias)',
  'Cliente não compra há mais de 60 dias',
  35, 72, 3,
  '{
    "requires_any_feature": ["DAYS_INACTIVE"],
    "feature_min": {"DAYS_INACTIVE": 60},
    "feature_max": {"DAYS_INACTIVE": 180}
  }',
  '{
    "add_if_orient": [
      {"path": "$.last_order_value", "min": 10000, "points": 15}
    ]
  }',
  '{
    "approach": "Contato de relacionamento, perguntar se precisa de algo",
    "buttons": ["Ligar", "Ver Histórico"]
  }',
  '{
    "do_not": ["Empurrar promoção logo de cara"]
  }'
),

-- HYGIENE 3: Feedback de venda fechada
(
  'HYGIENE', 
  'COLLECT_FEEDBACK',
  'Coletar feedback — {customer_name}',
  'Venda fechada há 7-14 dias, hora de pedir feedback',
  25, 72, 3,
  '{
    "requires_any_feature": ["DAYS_SINCE_LAST_ORDER"],
    "feature_min": {"DAYS_SINCE_LAST_ORDER": 7},
    "feature_max": {"DAYS_SINCE_LAST_ORDER": 14}
  }',
  '{}',
  '{
    "approach": "Perguntar satisfação, identificar melhorias",
    "questions": ["Como foi a experiência?", "Entrega ok?", "Precisa de algo mais?"],
    "buttons": ["Ligar", "WhatsApp"]
  }',
  NULL
);

-- =========================================================
-- 11. VIEWS AUXILIARES
-- =========================================================

-- View: Tasks do dia (OPEN/IN_PROGRESS) - exclui BACKLOG
CREATE OR REPLACE VIEW vw_sales_tasks_today AS
SELECT
  t.task_id,
  t.run_date,
  t.seller_id,
  t.customer_id,
  t.customer_name,
  t.entity_type,
  t.entity_id,
  t.task_bucket,
  t.task_type,
  t.title,
  t.description,
  t.priority_score,
  t.sla_due_at,
  TIMESTAMPDIFF(MINUTE, NOW(), t.sla_due_at) AS sla_minutes_remaining,
  t.recommended_json,
  t.guardrail_json,
  t.context_json,
  t.status,
  t.created_at
FROM sales_task t
WHERE t.run_date = CURDATE()
  AND t.status IN ('OPEN', 'IN_PROGRESS', 'SNOOZED');

-- View: SLA estourado
CREATE OR REPLACE VIEW vw_sales_task_sla_breaches AS
SELECT
  t.task_id,
  t.seller_id,
  t.customer_id,
  t.customer_name,
  t.task_bucket,
  t.task_type,
  t.title,
  t.sla_due_at,
  TIMESTAMPDIFF(HOUR, t.sla_due_at, NOW()) AS hours_overdue
FROM sales_task t
WHERE t.status IN ('OPEN', 'IN_PROGRESS')
  AND t.sla_due_at IS NOT NULL
  AND t.sla_due_at < NOW();

-- View: Performance últimos 14 dias com reason codes
CREATE OR REPLACE VIEW vw_sales_task_performance AS
SELECT
  t.seller_id,
  t.task_bucket,
  t.task_type,
  COUNT(*) AS tasks_total,
  SUM(IF(t.status = 'DONE', 1, 0)) AS tasks_done,
  SUM(IF(t.status = 'BACKLOG', 1, 0)) AS tasks_backlog,
  SUM(IF(t.outcome_code = 'WON', 1, 0)) AS won,
  SUM(IF(t.outcome_code = 'LOST', 1, 0)) AS lost,
  SUM(IF(t.outcome_code = 'NO_RESPONSE', 1, 0)) AS no_response,
  ROUND(SUM(IF(t.status = 'DONE', 1, 0)) / NULLIF(SUM(IF(t.status != 'BACKLOG', 1, 0)), 0) * 100, 2) AS completion_rate_pct,
  AVG(TIMESTAMPDIFF(MINUTE, t.started_at, t.done_at)) AS avg_duration_minutes
FROM sales_task t
WHERE t.run_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
GROUP BY t.seller_id, t.task_bucket, t.task_type;

-- View: Backlog (overflow) para calibração
CREATE OR REPLACE VIEW vw_sales_task_backlog AS
SELECT
  t.run_date,
  t.seller_id,
  t.customer_id,
  t.customer_name,
  t.task_bucket,
  t.task_type,
  t.title,
  t.priority_score,
  JSON_EXTRACT(t.guardrail_json, '$.overflow_reason') AS overflow_reason
FROM sales_task t
WHERE t.status = 'BACKLOG';

-- View: Outcome reasons agregados (para análise)
CREATE OR REPLACE VIEW vw_sales_outcome_analysis AS
SELECT
  t.seller_id,
  t.task_bucket,
  t.task_type,
  t.outcome_code,
  t.outcome_reason_code,
  r.label AS reason_label,
  COUNT(*) AS count,
  AVG(t.priority_score) AS avg_priority
FROM sales_task t
LEFT JOIN sales_outcome_reason r ON r.reason_code = t.outcome_reason_code
WHERE t.outcome_code IS NOT NULL
  AND t.run_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY t.seller_id, t.task_bucket, t.task_type, t.outcome_code, t.outcome_reason_code, r.label;

-- View: Drift detection (regras que estão perdendo performance)
CREATE OR REPLACE VIEW vw_sales_rule_drift AS
SELECT
  t.rule_id,
  r.task_type,
  r.task_bucket,
  COUNT(*) AS tasks_total,
  SUM(IF(t.outcome_code = 'WON', 1, 0)) AS won,
  SUM(IF(t.outcome_code IN ('LOST','NO_RESPONSE'), 1, 0)) AS lost_or_no_response,
  ROUND(SUM(IF(t.outcome_code = 'WON', 1, 0)) / NULLIF(SUM(IF(t.outcome_code IS NOT NULL, 1, 0)), 0) * 100, 2) AS win_rate_pct,
  MIN(t.run_date) AS first_date,
  MAX(t.run_date) AS last_date
FROM sales_task t
JOIN sales_task_rule r ON r.rule_id = t.rule_id
WHERE t.run_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
  AND t.outcome_code IS NOT NULL
GROUP BY t.rule_id, r.task_type, r.task_bucket
HAVING COUNT(*) >= 5;

-- =========================================================
-- 12. FEATURE KEYS SUPORTADAS (documentação)
-- =========================================================
-- Este é o conjunto inicial de feature keys que o engine suporta.
-- Adicione novas keys aqui ao expandir a coleta de sinais.
--
-- WHATSAPP:
--   INBOUND_UNREPLIED_HOURS   - Horas desde última msg do cliente sem resposta
--   INBOUND_UNREPLIED_COUNT   - Qtd de mensagens não respondidas
--
-- LEADS:
--   LEAD_AGE_DAYS             - Dias desde criação do lead
--   LEAD_IS_HOT               - 1 se classificado como hot, 0 caso contrário
--   LEAD_TOTAL_VALUE          - Valor total do lead
--   LEAD_STATUS               - Status atual (string)
--
-- QUOTES:
--   QUOTE_AGE_DAYS            - Dias desde criação do orçamento
--   QUOTE_TOTAL_VALUE         - Valor total do orçamento
--
-- GOALS:
--   GOAL_PROGRESS_PCT         - Progresso da meta em %
--   GOAL_VALUE                - Valor absoluto da meta
--   GOAL_REMAINING            - Valor restante para atingir
--
-- CHURN:
--   CHURN_RISK_SCORE          - Score de churn (0-1)
--
-- CUSTOMER:
--   DAYS_INACTIVE             - Dias desde última compra
--   DAYS_SINCE_LAST_ORDER     - Alias de DAYS_INACTIVE
--   DAYS_SINCE_CONTEXT_UPDATE - Dias desde última atualização de contexto
--   LAST_ORDER_VALUE          - Valor da última compra
--
-- AI:
--   AI_RECOMMENDATION_CONFIDENCE - Confiança da recomendação de cross-sell
--
-- =========================================================

-- =========================================================
-- 13. GRANT PERMISSIONS (ajustar conforme seu usuário)
-- =========================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON staging.sales_task_run TO 'leads_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON staging.sales_raw_signal TO 'leads_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON staging.sales_signal_feature TO 'leads_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON staging.sales_orientation_snapshot TO 'leads_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON staging.sales_task_rule TO 'leads_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON staging.sales_outcome_reason TO 'leads_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON staging.sales_task TO 'leads_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON staging.sales_task_action_log TO 'leads_user'@'%';

-- =========================================================
-- FIM - v1.1 com Patch B
-- =========================================================
