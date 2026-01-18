-- DDL MÍNIMO - CHATBOT DECISÓRIO
-- Leads Agent - Sistema de Gestão de Leads
-- Versão: 1.1 (PATCH-001) | Data: 20 de Janeiro 2026

-- =============================================================================
-- TABELAS PRINCIPAIS
-- =============================================================================

-- chat_interaction_event (audit + rastreio de intent/tool + latência)
CREATE TABLE IF NOT EXISTS chat_interaction_event (
  event_id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id          BIGINT UNSIGNED NOT NULL,
  user_id            BIGINT UNSIGNED NOT NULL,

  conversation_id    CHAR(36) NOT NULL,
  parent_event_id    BIGINT UNSIGNED NULL,

  channel            VARCHAR(20) NOT NULL DEFAULT 'web',
  role               ENUM('USER','ASSISTANT','SYSTEM','TOOL') NOT NULL,

  message_text       TEXT NULL,
  intent_key         VARCHAR(80) NULL,
  entities_json      JSON NULL,
  confidence         DECIMAL(5,4) NULL,

  tool_name          VARCHAR(120) NULL,
  tool_args_json     JSON NULL,
  tool_result_json   JSON NULL,

  status             ENUM('OK','NEEDS_CONFIRMATION','DENIED','ERROR') NOT NULL DEFAULT 'OK',
  error_code         VARCHAR(60) NULL,
  error_message      VARCHAR(255) NULL,

  latency_ms         INT UNSIGNED NULL,
  tokens_in          INT UNSIGNED NULL,
  tokens_out         INT UNSIGNED NULL,

  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (event_id),
  KEY idx_conv_time (tenant_id, conversation_id, created_at),
  KEY idx_intent_time (tenant_id, intent_key, created_at),
  KEY idx_user_time (tenant_id, user_id, created_at),
  KEY idx_parent (parent_event_id),

  CONSTRAINT fk_chat_parent_event
    FOREIGN KEY (parent_event_id) REFERENCES chat_interaction_event(event_id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

-- approval_sequence (sequence thread-safe por tenant)
CREATE TABLE IF NOT EXISTS approval_sequence (
  tenant_id   BIGINT UNSIGNED NOT NULL,
  next_id     BIGINT UNSIGNED NOT NULL DEFAULT 1,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (tenant_id)
) ENGINE=InnoDB;

-- approval_event (event-sourcing leve para governança de descontos)
CREATE TABLE IF NOT EXISTS approval_event (
  approval_event_id  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id          BIGINT UNSIGNED NOT NULL,

  approval_id        BIGINT UNSIGNED NOT NULL,
  lead_id            BIGINT UNSIGNED NOT NULL,
  requester_id       BIGINT UNSIGNED NOT NULL,
  actor_id           BIGINT UNSIGNED NOT NULL,

  event_type         ENUM(
                      'REQUESTED',
                      'AUTO_APPROVED',
                      'APPROVED',
                      'REJECTED',
                      'EXPIRED',
                      'ESCALATED'
                    ) NOT NULL,

  discount_requested DECIMAL(5,2) NULL,
  current_margin     DECIMAL(5,2) NULL,
  projected_margin   DECIMAL(5,2) NULL,
  reason             TEXT NULL,

  approver_role      VARCHAR(40) NULL,
  sla_minutes        INT UNSIGNED NULL,
  expires_at         DATETIME NULL,

  pricing_snapshot_json JSON NULL,
  meta_json          JSON NULL,

  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (approval_event_id),
  KEY idx_approval (tenant_id, approval_id, created_at),
  KEY idx_lead (tenant_id, lead_id, created_at),
  KEY idx_pending (tenant_id, event_type, created_at)
) ENGINE=InnoDB;

-- =============================================================================
-- PATCH-001 — CORREÇÕES E MELHORIAS
-- =============================================================================

/* ============================================================
   PATCH-001 — CHATBOT DDL / APPROVALS (MySQL 8.x)
   - Corrige index parcial (WHERE ...)
   - Corrige view approval_current_state (MAX id, não MAX created_at)
   - Adiciona vw_discount_approvals_current (estado atual)
   - Adiciona vw_chat_conversation_timeline (timeline UI/audit)
   - Cria view diária leve p/ métricas base de governança Q3
   ============================================================ */

-- ------------------------------------------------------------
-- 0) Remover index parcial inválido (se já tiver sido executado)
-- ------------------------------------------------------------
DROP INDEX IF EXISTS idx_approval_expires ON approval_event;

-- Substitui por index normal (MySQL indexa NULL também; ok)
CREATE INDEX idx_approval_expires
  ON approval_event (tenant_id, expires_at);

-- ------------------------------------------------------------
-- 1) Timeline do chat (UI + auditoria)
-- ------------------------------------------------------------
DROP VIEW IF EXISTS vw_chat_conversation_timeline;

CREATE VIEW vw_chat_conversation_timeline AS
SELECT
  e.tenant_id,
  e.conversation_id,
  e.event_id,
  e.parent_event_id,
  e.created_at,
  e.channel,
  e.role,
  e.message_text,
  e.intent_key,
  e.confidence,
  e.entities_json,
  e.tool_name,
  e.tool_args_json,
  e.tool_result_json,
  e.status,
  e.error_code,
  e.error_message,
  e.latency_ms,
  JSON_UNQUOTE(JSON_EXTRACT(e.tool_result_json, '$.risk_level'))      AS risk_level,
  JSON_UNQUOTE(JSON_EXTRACT(e.tool_result_json, '$.policy_version'))  AS policy_version,
  JSON_UNQUOTE(JSON_EXTRACT(e.tool_result_json, '$.policy_reason'))   AS policy_reason
FROM chat_interaction_event e;

-- ------------------------------------------------------------
-- 2) Estado atual das aprovações (robusto)
--    - Usa MAX(approval_event_id) como "último evento"
--    - Status derivado com expiração
-- ------------------------------------------------------------
DROP VIEW IF EXISTS vw_discount_approvals_current;

CREATE VIEW vw_discount_approvals_current AS
WITH last_event AS (
  SELECT
    tenant_id,
    approval_id,
    MAX(approval_event_id) AS last_approval_event_id
  FROM approval_event
  GROUP BY tenant_id, approval_id
)
SELECT
  ae.tenant_id,
  ae.approval_id,
  ae.lead_id,
  ae.requester_id,
  ae.actor_id AS last_actor_id,

  ae.discount_requested,
  ae.current_margin,
  ae.projected_margin,
  ae.reason,

  ae.approver_role,
  ae.sla_minutes,
  ae.expires_at,

  CASE
    WHEN ae.event_type IN ('APPROVED','AUTO_APPROVED') THEN 'APPROVED'
    WHEN ae.event_type = 'REJECTED' THEN 'REJECTED'
    WHEN ae.event_type = 'EXPIRED' THEN 'EXPIRED'
    WHEN ae.expires_at IS NOT NULL AND NOW() > ae.expires_at THEN 'EXPIRED'
    ELSE 'PENDING'
  END AS status,

  ae.event_type AS last_event_type,
  ae.pricing_snapshot_json,
  ae.meta_json,
  ae.created_at AS last_event_at
FROM approval_event ae
JOIN last_event le
  ON le.tenant_id = ae.tenant_id
 AND le.approval_id = ae.approval_id
 AND le.last_approval_event_id = ae.approval_event_id;

-- ------------------------------------------------------------
-- 3) Substituir approval_current_state (se você quiser manter o nome antigo)
--    (agora apenas alias do view robusto)
-- ------------------------------------------------------------
DROP VIEW IF EXISTS approval_current_state;

CREATE VIEW approval_current_state AS
SELECT * FROM vw_discount_approvals_current;

-- ------------------------------------------------------------
-- 4) Métricas diárias de governança (leve e correta)
--    - Conta approvals criadas (REQUESTED)
--    - Conta aprovadas/rejeitadas/expiradas (estado atual)
--    - Calcula tempo médio de resolução usando timestamps de REQUESTED e do último evento final
-- ------------------------------------------------------------
DROP VIEW IF EXISTS approval_stats_daily;

CREATE VIEW approval_stats_daily AS
WITH requested AS (
  SELECT
    tenant_id,
    approval_id,
    lead_id,
    requester_id,
    created_at AS requested_at,
    DATE(created_at) AS requested_date
  FROM approval_event
  WHERE event_type = 'REQUESTED'
),
final_event AS (
  SELECT
    ae.tenant_id,
    ae.approval_id,
    ae.event_type,
    ae.created_at AS final_at,
    ae.discount_requested
  FROM approval_event ae
  JOIN (
    SELECT tenant_id, approval_id, MAX(approval_event_id) AS last_id
    FROM approval_event
    GROUP BY tenant_id, approval_id
  ) x
    ON x.tenant_id = ae.tenant_id
   AND x.approval_id = ae.approval_id
   AND x.last_id = ae.approval_event_id
  WHERE ae.event_type IN ('APPROVED','AUTO_APPROVED','REJECTED','EXPIRED')
)
SELECT
  r.tenant_id,
  r.requested_date AS date,
  COUNT(DISTINCT r.approval_id) AS total_requested,
  SUM(CASE WHEN f.event_type IN ('APPROVED','AUTO_APPROVED') THEN 1 ELSE 0 END) AS approved_count,
  SUM(CASE WHEN f.event_type = 'REJECTED' THEN 1 ELSE 0 END) AS rejected_count,
  SUM(CASE WHEN f.event_type = 'EXPIRED' THEN 1 ELSE 0 END) AS expired_count,
  AVG(CASE WHEN f.event_type IN ('APPROVED','AUTO_APPROVED') THEN f.discount_requested END) AS avg_discount_approved,
  AVG(CASE WHEN f.final_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, r.requested_at, f.final_at) END) AS avg_resolution_minutes
FROM requested r
LEFT JOIN final_event f
  ON f.tenant_id = r.tenant_id
 AND f.approval_id = r.approval_id
GROUP BY r.tenant_id, r.requested_date;

-- =============================================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =============================================================================

-- Para buscas por período e status
CREATE INDEX idx_chat_event_status_time ON chat_interaction_event(tenant_id, status, created_at);
CREATE INDEX idx_chat_event_channel_time ON chat_interaction_event(tenant_id, channel, created_at);

-- Para analytics de conversas
CREATE INDEX idx_chat_event_confidence ON chat_interaction_event(tenant_id, confidence, created_at);

-- Para approvals por requester/actor
CREATE INDEX idx_approval_requester ON approval_event(tenant_id, requester_id, created_at);
CREATE INDEX idx_approval_actor ON approval_event(tenant_id, actor_id, created_at);

-- =============================================================================
-- COMENTÁRIOS E METADADOS
-- =============================================================================

ALTER TABLE chat_interaction_event COMMENT 'Auditoria completa de interações do chatbot - Q3 governança';
ALTER TABLE approval_event COMMENT 'Event sourcing para workflow de aprovações de desconto - Q3.2';

-- =============================================================================
-- Q3.2 — PACOTE COMPLETO: SLA + EXPIRAÇÃO + ESCALAÇÃO
-- =============================================================================

/* ============================================================
   Q3.2 — PACOTE COMPLETO: SLA + EXPIRAÇÃO + ESCALAÇÃO
   - Procedure: sp_approvals_expire_and_escalate()
   - Event Scheduler: roda a cada 5 min
   - Views UI: pendentes com SLA restante + histórico
   ============================================================ */

DELIMITER $$

/* ------------------------------------------------------------
   1) Procedure principal
   - Escala automaticamente quando estoura SLA
   - Expira quando não há mais para escalar
   - Baseado na matriz do Q3.2
------------------------------------------------------------ */
DROP PROCEDURE IF EXISTS sp_approvals_expire_and_escalate$$

CREATE PROCEDURE sp_approvals_expire_and_escalate()
BEGIN
  /*
    Convenções:
    - actor_id = 0 => SYSTEM
    - expires_at = deadline do SLA atual
    - approver_role indica o nível atual (MANAGER/DIRECTOR/CEO)
    - event_type: ESCALATED ou EXPIRED
  */

  DECLARE v_tenant_id BIGINT UNSIGNED;
  DECLARE v_approval_id BIGINT UNSIGNED;
  DECLARE v_lead_id BIGINT UNSIGNED;
  DECLARE v_requester_id BIGINT UNSIGNED;
  DECLARE v_discount DECIMAL(5,2);
  DECLARE v_role VARCHAR(40);
  DECLARE v_expires_at DATETIME;

  DECLARE v_next_role VARCHAR(40);
  DECLARE v_next_sla_minutes INT UNSIGNED;
  DECLARE v_next_expires_at DATETIME;

  DECLARE done INT DEFAULT 0;

  /* Cursor: pega somente approvals PENDING que já passaram do expires_at */
  DECLARE cur CURSOR FOR
    SELECT
      c.tenant_id,
      c.approval_id,
      c.lead_id,
      c.requester_id,
      c.discount_requested,
      c.approver_role,
      c.expires_at
    FROM vw_discount_approvals_current c
    WHERE c.status = 'PENDING'
      AND c.expires_at IS NOT NULL
      AND NOW() > c.expires_at;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  OPEN cur;

  read_loop: LOOP
    FETCH cur INTO v_tenant_id, v_approval_id, v_lead_id, v_requester_id, v_discount, v_role, v_expires_at;

    IF done = 1 THEN
      LEAVE read_loop;
    END IF;

    /* Decide próximo nível com base no nível atual */
    SET v_next_role = NULL;
    SET v_next_sla_minutes = NULL;

    /* Regra de escalação:
       MANAGER -> DIRECTOR (8h)
       DIRECTOR -> CEO (24h)
       CEO -> expira
       Observação: matriz original define SLA por faixa,
       aqui estamos escalando "um nível acima" quando o SLA estoura.
    */
    IF v_role = 'MANAGER' THEN
      SET v_next_role = 'DIRECTOR';
      SET v_next_sla_minutes = 8 * 60;
    ELSEIF v_role = 'DIRECTOR' THEN
      SET v_next_role = 'CEO';
      SET v_next_sla_minutes = 24 * 60;
    ELSE
      SET v_next_role = NULL;
    END IF;

    /* Se existe próximo nível -> ESCALATED, senão -> EXPIRED */
    IF v_next_role IS NOT NULL THEN
      SET v_next_expires_at = DATE_ADD(NOW(), INTERVAL v_next_sla_minutes MINUTE);

      INSERT INTO approval_event (
        tenant_id, approval_id, lead_id,
        requester_id, actor_id,
        event_type,
        discount_requested,
        approver_role, sla_minutes, expires_at,
        reason,
        meta_json
      ) VALUES (
        v_tenant_id, v_approval_id, v_lead_id,
        v_requester_id, 0,
        'ESCALATED',
        v_discount,
        v_next_role, v_next_sla_minutes, v_next_expires_at,
        CONCAT('Escalação automática: SLA estourou em ', DATE_FORMAT(v_expires_at, '%Y-%m-%d %H:%i:%s')),
        JSON_OBJECT(
          'from_role', v_role,
          'to_role', v_next_role,
          'previous_expires_at', DATE_FORMAT(v_expires_at, '%Y-%m-%d %H:%i:%s'),
          'new_expires_at', DATE_FORMAT(v_next_expires_at, '%Y-%m-%d %H:%i:%s'),
          'trigger', 'SLA_TIMEOUT'
        )
      );
    ELSE
      INSERT INTO approval_event (
        tenant_id, approval_id, lead_id,
        requester_id, actor_id,
        event_type,
        discount_requested,
        approver_role, sla_minutes, expires_at,
        reason,
        meta_json
      ) VALUES (
        v_tenant_id, v_approval_id, v_lead_id,
        v_requester_id, 0,
        'EXPIRED',
        v_discount,
        v_role, NULL, v_expires_at,
        CONCAT('Expirado automaticamente: SLA estourou em ', DATE_FORMAT(v_expires_at, '%Y-%m-%d %H:%i:%s')),
        JSON_OBJECT(
          'last_role', v_role,
          'previous_expires_at', DATE_FORMAT(v_expires_at, '%Y-%m-%d %H:%i:%s'),
          'trigger', 'SLA_TIMEOUT'
        )
      );
    END IF;

  END LOOP;

  CLOSE cur;
END$$


/* ------------------------------------------------------------
   2) Sequence thread-safe por tenant
   ------------------------------------------------------------ */
DROP PROCEDURE IF EXISTS sp_approval_next_id$$

CREATE PROCEDURE sp_approval_next_id(
  IN  p_tenant_id BIGINT UNSIGNED,
  OUT o_next_id   BIGINT UNSIGNED
)
BEGIN
  INSERT INTO approval_sequence (tenant_id, next_id)
  VALUES (p_tenant_id, 1)
  ON DUPLICATE KEY UPDATE next_id = LAST_INSERT_ID(next_id + 1);

  SET o_next_id = LAST_INSERT_ID();
END$$

/* ------------------------------------------------------------
   3) Procedure de criação de Approval a partir do Pricing Agent
   sp_approvals_request_from_pricing()
   - Recebe retorno do Pricing Agent (snapshot JSON)
   - Aplica matriz automaticamente:
       0–5%   -> AUTO_APPROVED (SLA 0)
       5–10%  -> REQUESTED (MANAGER, 4h)
       10–15% -> REQUESTED (DIRECTOR, 8h)
       >15%   -> REQUESTED (CEO, 24h)
     conforme checklist Q3.2
   - Define expires_at e sla_minutes
   - Retorna approval_id e status
------------------------------------------------------------ */
DROP PROCEDURE IF EXISTS sp_approvals_request_from_pricing$$

CREATE PROCEDURE sp_approvals_request_from_pricing(
  IN  p_tenant_id            BIGINT UNSIGNED,
  IN  p_lead_id              BIGINT UNSIGNED,
  IN  p_requester_id         BIGINT UNSIGNED,
  IN  p_discount_requested   DECIMAL(5,2),     -- % solicitado
  IN  p_current_margin       DECIMAL(5,2),     -- % margem atual (opcional)
  IN  p_projected_margin     DECIMAL(5,2),     -- % margem projetada (opcional)
  IN  p_reason               TEXT,
  IN  p_pricing_snapshot_json JSON,            -- retorno/inputs do pricing agent
  OUT o_approval_id          BIGINT UNSIGNED,
  OUT o_status               VARCHAR(20)       -- APPROVED | PENDING
)
BEGIN
  DECLARE v_role VARCHAR(40);
  DECLARE v_sla_minutes INT UNSIGNED;
  DECLARE v_expires_at DATETIME;

  DECLARE v_new_approval_id BIGINT UNSIGNED;

  /* ------------------------------------------------------------
     1) Gerar approval_id thread-safe usando sequence
     ------------------------------------------------------------ */
  CALL sp_approval_next_id(p_tenant_id, v_new_approval_id);
  SET o_approval_id = v_new_approval_id;

  /* ------------------------------------------------------------
     2) Aplicar matriz (faixas)
     ------------------------------------------------------------ */
  IF p_discount_requested < 5.00 THEN
    SET v_role = 'AUTO';
    SET v_sla_minutes = 0;
    SET v_expires_at = NULL;

    /* AUTO_APPROVED */
    INSERT INTO approval_event (
      tenant_id, approval_id, lead_id,
      requester_id, actor_id,
      event_type,
      discount_requested,
      current_margin, projected_margin,
      reason,
      approver_role, sla_minutes, expires_at,
      pricing_snapshot_json,
      meta_json
    ) VALUES (
      p_tenant_id, v_new_approval_id, p_lead_id,
      p_requester_id, 0,
      'AUTO_APPROVED',
      p_discount_requested,
      p_current_margin, p_projected_margin,
      p_reason,
      v_role, v_sla_minutes, v_expires_at,
      p_pricing_snapshot_json,
      JSON_OBJECT(
        'matrix', '0-5:auto',
        'trigger', 'DISCOUNT_REQUEST',
        'notes', 'Auto aprovado pela matriz'
      )
    );

    SET o_status = 'APPROVED';

  ELSEIF p_discount_requested < 10.00 THEN
    SET v_role = 'MANAGER';
    SET v_sla_minutes = 4 * 60;
    SET v_expires_at = DATE_ADD(NOW(), INTERVAL v_sla_minutes MINUTE);

  ELSEIF p_discount_requested < 15.00 THEN
    SET v_role = 'DIRECTOR';
    SET v_sla_minutes = 8 * 60;
    SET v_expires_at = DATE_ADD(NOW(), INTERVAL v_sla_minutes MINUTE);

  ELSE
    SET v_role = 'CEO';
    SET v_sla_minutes = 24 * 60;
    SET v_expires_at = DATE_ADD(NOW(), INTERVAL v_sla_minutes MINUTE);
  END IF;

  /* ------------------------------------------------------------
     3) Se não auto-aprovado, cria REQUESTED (pendente)
     ------------------------------------------------------------ */
  IF o_status IS NULL THEN
    INSERT INTO approval_event (
      tenant_id, approval_id, lead_id,
      requester_id, actor_id,
      event_type,
      discount_requested,
      current_margin, projected_margin,
      reason,
      approver_role, sla_minutes, expires_at,
      pricing_snapshot_json,
      meta_json
    ) VALUES (
      p_tenant_id, v_new_approval_id, p_lead_id,
      p_requester_id, p_requester_id,
      'REQUESTED',
      p_discount_requested,
      p_current_margin, p_projected_margin,
      p_reason,
      v_role, v_sla_minutes, v_expires_at,
      p_pricing_snapshot_json,
      JSON_OBJECT(
        'matrix_role', v_role,
        'sla_minutes', v_sla_minutes,
        'trigger', 'DISCOUNT_REQUEST'
      )
    );

    SET o_status = 'PENDING';
  END IF;

END$$


/* ------------------------------------------------------------
   4) Procedure de decisão (approve/reject)
   sp_approvals_decide()
   ------------------------------------------------------------ */
DROP PROCEDURE IF EXISTS sp_approvals_decide$$

CREATE PROCEDURE sp_approvals_decide(
  IN p_tenant_id      BIGINT UNSIGNED,
  IN p_approval_id    BIGINT UNSIGNED,
  IN p_actor_id       BIGINT UNSIGNED,
  IN p_decision       VARCHAR(10),   -- 'APPROVE' | 'REJECT'
  IN p_reason         TEXT
)
BEGIN
  DECLARE v_status VARCHAR(20);
  DECLARE v_last_event VARCHAR(20);
  DECLARE v_lead_id BIGINT UNSIGNED;
  DECLARE v_requester_id BIGINT UNSIGNED;
  DECLARE v_discount DECIMAL(5,2);
  DECLARE v_role VARCHAR(40);
  DECLARE v_expires_at DATETIME;
  DECLARE v_now DATETIME;

  SET v_now = NOW();

  -- Estado atual
  SELECT
    status,
    last_event_type,
    lead_id,
    requester_id,
    discount_requested,
    approver_role,
    expires_at
  INTO
    v_status,
    v_last_event,
    v_lead_id,
    v_requester_id,
    v_discount,
    v_role,
    v_expires_at
  FROM vw_discount_approvals_current
  WHERE tenant_id = p_tenant_id
    AND approval_id = p_approval_id
  LIMIT 1;

  -- Validações
  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'APPROVAL_NOT_FOUND';
  END IF;

  IF v_status <> 'PENDING' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'APPROVAL_NOT_PENDING';
  END IF;

  IF v_expires_at IS NOT NULL AND v_now > v_expires_at THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'APPROVAL_OVERDUE_USE_ESCALATION';
  END IF;

  -- Decide
  IF UPPER(p_decision) = 'APPROVE' THEN
    INSERT INTO approval_event (
      tenant_id, approval_id, lead_id,
      requester_id, actor_id,
      event_type,
      discount_requested,
      approver_role,
      reason,
      meta_json
    ) VALUES (
      p_tenant_id, p_approval_id, v_lead_id,
      v_requester_id, p_actor_id,
      'APPROVED',
      v_discount,
      v_role,
      p_reason,
      JSON_OBJECT('decision', 'APPROVE')
    );

  ELSEIF UPPER(p_decision) = 'REJECT' THEN
    INSERT INTO approval_event (
      tenant_id, approval_id, lead_id,
      requester_id, actor_id,
      event_type,
      discount_requested,
      approver_role,
      reason,
      meta_json
    ) VALUES (
      p_tenant_id, p_approval_id, v_lead_id,
      v_requester_id, p_actor_id,
      'REJECTED',
      v_discount,
      v_role,
      p_reason,
      JSON_OBJECT('decision', 'REJECT')
    );

  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_DECISION';
  END IF;

END$$


/* ------------------------------------------------------------
   5) Event Scheduler (MySQL)
   - Roda a cada 5 minutos (pode trocar p/ 1 min)
------------------------------------------------------------ */
DROP EVENT IF EXISTS ev_approvals_expire_and_escalate$$

CREATE EVENT ev_approvals_expire_and_escalate
ON SCHEDULE EVERY 5 MINUTE
DO
  CALL sp_approvals_expire_and_escalate()$$

DELIMITER ;

/* Dica operacional:
   Certifique que o scheduler está ligado:
   SET GLOBAL event_scheduler = ON;
*/


/* ------------------------------------------------------------
   3) Views para UI /approvals
   - PENDENTES com SLA restante + nível atual
   - HISTÓRICO por approval_id (timeline)
------------------------------------------------------------ */

DROP VIEW IF EXISTS vw_approvals_pending_ui;
CREATE VIEW vw_approvals_pending_ui AS
WITH requested AS (
  SELECT
    tenant_id,
    approval_id,
    MIN(created_at) AS requested_at
  FROM approval_event
  WHERE event_type = 'REQUESTED'
  GROUP BY tenant_id, approval_id
)
SELECT
  c.tenant_id,
  c.approval_id,
  c.lead_id,
  c.requester_id,
  c.approver_role,
  c.discount_requested,
  c.current_margin,
  c.projected_margin,
  c.reason,
  c.expires_at,
  r.requested_at,

  /* SLA restante (minutos) */
  CASE
    WHEN c.expires_at IS NULL THEN NULL
    ELSE TIMESTAMPDIFF(MINUTE, NOW(), c.expires_at)
  END AS sla_minutes_remaining,

  /* Indicador simples para UI */
  CASE
    WHEN c.expires_at IS NULL THEN 'NO_SLA'
    WHEN NOW() > c.expires_at THEN 'OVERDUE'
    WHEN TIMESTAMPDIFF(MINUTE, NOW(), c.expires_at) <= 30 THEN 'DUE_SOON'
    ELSE 'OK'
  END AS sla_status

FROM vw_discount_approvals_current c
LEFT JOIN requested r
  ON r.tenant_id = c.tenant_id
 AND r.approval_id = c.approval_id
WHERE c.status = 'PENDING';


DROP VIEW IF EXISTS vw_approvals_history_timeline;
CREATE VIEW vw_approvals_history_timeline AS
SELECT
  tenant_id,
  approval_id,
  approval_event_id,
  lead_id,
  requester_id,
  actor_id,
  event_type,
  discount_requested,
  approver_role,
  sla_minutes,
  expires_at,
  reason,
  meta_json,
  created_at
FROM approval_event
ORDER BY tenant_id, approval_id, approval_event_id;


/* ------------------------------------------------------------
   4) Índices recomendados (para deixar /approvals rápido)
------------------------------------------------------------ */
CREATE INDEX idx_approval_event_lookup
  ON approval_event (tenant_id, approval_id, approval_event_id);

CREATE INDEX idx_approval_event_pending_scan
  ON approval_event (tenant_id, event_type, expires_at);

CREATE INDEX idx_approval_event_lead
  ON approval_event (tenant_id, lead_id, approval_event_id);

-- =============================================================================
-- FIM DO DDL
-- =============================================================================

/*
NOTAS DE IMPLEMENTAÇÃO (PATCH-001 + Q3.2):
- As tabelas seguem convenções do ecossistema MySQL 8 existente
- Índices otimizados para os padrões de consulta identificados
- Views "cirúrgicas" para casos de uso específicos:
  * vw_chat_conversation_timeline → UI do chat e auditoria
  * vw_discount_approvals_current → Estado atual das aprovações
  * vw_approvals_pending_ui → Pendentes com SLA restante para UI
  * vw_approvals_history_timeline → Histórico completo por approval
- Procedure automatizada para expiração/escalação (Q3.2)
- Event Scheduler para execução automática a cada 5 minutos
- Extrações JSON eficientes para campos de política/risco
- Estrutura preparada para escalabilidade horizontal (tenant_id)
- Audit trail completo conforme requisitos do checklist v2.1
- Suporte completo a governança Q3.2: SLA + expiração + escalação
- Compatível com MySQL 8.x (InnoDB + JSON functions + Events)
- Correções aplicadas: index parcial → normal, MAX(created_at) → MAX(id)
*/