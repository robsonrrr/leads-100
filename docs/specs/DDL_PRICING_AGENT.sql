-- ═══════════════════════════════════════════════════════════════════════════════
-- DDL PRICING AGENT - Sistema de Gestão de Leads Rolemak
-- Versão: 1.0
-- Data: Janeiro 2026
-- Descrição: Scripts de criação das tabelas do Pricing Agent
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. TABELA PRINCIPAL: pricing_decision_events
-- Armazena todas as decisões de preço (núcleo da memória econômica)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pricing_decision_events (
    -- ═══════════════════════════════════════════════════════════════════════════
    -- IDENTIFICAÇÃO
    -- ═══════════════════════════════════════════════════════════════════════════
    event_id VARCHAR(36) NOT NULL,
    event_version VARCHAR(10) NOT NULL DEFAULT '1.0',
    event_timestamp DATETIME(3) NOT NULL,
    
    -- ═══════════════════════════════════════════════════════════════════════════
    -- ORIGEM
    -- ═══════════════════════════════════════════════════════════════════════════
    source ENUM('CRM', 'API', 'BATCH', 'MIGRATION') NOT NULL DEFAULT 'CRM',
    action ENUM(
        'ADD_ITEM',
        'UPDATE_QTY',
        'APPLY_DISCOUNT',
        'REMOVE_DISCOUNT',
        'APPLY_CAMPAIGN',
        'SIMULATE',
        'CONVERT_ORDER',
        'EXCEPTION_REQUEST',
        'EXCEPTION_APPROVE',
        'EXCEPTION_REJECT',
        'PRICE_FREEZE',
        'UNFREEZE_EXCEPTION'
    ) NOT NULL,
    
    -- ═══════════════════════════════════════════════════════════════════════════
    -- REFERÊNCIAS (Foreign Keys)
    -- ═══════════════════════════════════════════════════════════════════════════
    customer_id INT UNSIGNED NOT NULL,
    seller_id INT UNSIGNED NOT NULL,
    lead_id INT UNSIGNED NULL,
    order_id INT UNSIGNED NULL,
    cart_id INT UNSIGNED NOT NULL,
    
    -- ═══════════════════════════════════════════════════════════════════════════
    -- POLÍTICA
    -- ═══════════════════════════════════════════════════════════════════════════
    policy_version VARCHAR(20) NOT NULL,
    policy_id VARCHAR(36) NULL,
    
    -- ═══════════════════════════════════════════════════════════════════════════
    -- VALORES PRINCIPAIS (desnormalizados para consulta rápida)
    -- ═══════════════════════════════════════════════════════════════════════════
    price_base DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    price_final DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    discount_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    margin_absolute DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    margin_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    
    -- ═══════════════════════════════════════════════════════════════════════════
    -- CLASSIFICAÇÃO
    -- ═══════════════════════════════════════════════════════════════════════════
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'LOW',
    compliance_status ENUM(
        'APPROVED',
        'PENDING_APPROVAL',
        'APPROVED_EXCEPTION',
        'REJECTED',
        'FROZEN',
        'SIMULATED'
    ) NOT NULL DEFAULT 'APPROVED',
    
    -- ═══════════════════════════════════════════════════════════════════════════
    -- FLAGS
    -- ═══════════════════════════════════════════════════════════════════════════
    is_within_policy TINYINT(1) NOT NULL DEFAULT 1,
    requires_approval TINYINT(1) NOT NULL DEFAULT 0,
    is_frozen TINYINT(1) NOT NULL DEFAULT 0,
    is_simulation TINYINT(1) NOT NULL DEFAULT 0,
    
    -- ═══════════════════════════════════════════════════════════════════════════
    -- CONTEXTOS (JSON - dados completos para auditoria)
    -- ═══════════════════════════════════════════════════════════════════════════
    customer_context JSON NOT NULL,
    seller_context JSON NOT NULL,
    transaction_context JSON NOT NULL,
    policy_context JSON NOT NULL,
    pricing_result JSON NOT NULL,
    metadata JSON NOT NULL,
    
    -- ═══════════════════════════════════════════════════════════════════════════
    -- RASTREABILIDADE
    -- ═══════════════════════════════════════════════════════════════════════════
    correlation_id VARCHAR(36) NULL,
    previous_event_id VARCHAR(36) NULL,
    parent_event_id VARCHAR(36) NULL,
    
    -- ═══════════════════════════════════════════════════════════════════════════
    -- AUDITORIA
    -- ═══════════════════════════════════════════════════════════════════════════
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    created_by INT UNSIGNED NOT NULL,
    
    -- ═══════════════════════════════════════════════════════════════════════════
    -- CONSTRAINTS
    -- ═══════════════════════════════════════════════════════════════════════════
    PRIMARY KEY (event_id),
    
    -- Índices para consultas frequentes
    INDEX idx_pde_customer (customer_id),
    INDEX idx_pde_seller (seller_id),
    INDEX idx_pde_lead (lead_id),
    INDEX idx_pde_order (order_id),
    INDEX idx_pde_cart (cart_id),
    INDEX idx_pde_timestamp (event_timestamp),
    INDEX idx_pde_action (action),
    INDEX idx_pde_compliance (compliance_status),
    INDEX idx_pde_risk (risk_level),
    INDEX idx_pde_frozen (is_frozen),
    INDEX idx_pde_policy_version (policy_version),
    INDEX idx_pde_correlation (correlation_id),
    INDEX idx_pde_previous (previous_event_id),
    
    -- Índice composto para relatórios
    INDEX idx_pde_report (event_timestamp, seller_id, compliance_status),
    INDEX idx_pde_metrics (event_timestamp, is_within_policy, requires_approval),
    
    -- Foreign Keys (comentadas - ativar conforme estrutura existente)
    -- CONSTRAINT fk_pde_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    -- CONSTRAINT fk_pde_seller FOREIGN KEY (seller_id) REFERENCES users(id),
    -- CONSTRAINT fk_pde_lead FOREIGN KEY (lead_id) REFERENCES sCart(id),
    -- CONSTRAINT fk_pde_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_pde_previous FOREIGN KEY (previous_event_id) 
        REFERENCES pricing_decision_events(event_id) ON DELETE SET NULL
        
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Eventos de decisão de preço - memória econômica do sistema';


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. TABELA: pricing_policies
-- Armazena as políticas de preço versionadas
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pricing_policies (
    policy_id VARCHAR(36) NOT NULL,
    policy_code VARCHAR(50) NOT NULL,
    policy_name VARCHAR(100) NOT NULL,
    policy_description TEXT NULL,
    
    -- Tipo e versão
    policy_type ENUM(
        'BASE_PRICE',
        'VOLUME_CURVE',
        'CUSTOMER_DISCOUNT',
        'SEGMENT_DISCOUNT',
        'CAMPAIGN',
        'MINIMUM_MARGIN',
        'MAXIMUM_DISCOUNT',
        'CREDIT_RESTRICTION',
        'SPECIAL_CONDITION',
        'APPROVAL_RULE'
    ) NOT NULL,
    policy_version VARCHAR(20) NOT NULL,
    
    -- Configuração (JSON com regras específicas do tipo)
    config JSON NOT NULL,
    
    -- Vigência
    effective_from DATE NOT NULL,
    effective_until DATE NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    
    -- Prioridade (menor = maior prioridade)
    priority INT NOT NULL DEFAULT 100,
    
    -- Escopo de aplicação (NULL = todos)
    applies_to_segments JSON NULL COMMENT '["VAREJO", "ATACADO"] ou null',
    applies_to_categories JSON NULL COMMENT '["A", "B"] ou null',
    applies_to_products JSON NULL COMMENT '[123, 456] ou null',
    applies_to_sellers JSON NULL COMMENT '[1, 2, 3] ou null',
    applies_to_customers JSON NULL COMMENT '[100, 200] ou null',
    
    -- Auditoria
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED NOT NULL,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT UNSIGNED NULL,
    
    PRIMARY KEY (policy_id),
    UNIQUE KEY uk_pp_code_version (policy_code, policy_version),
    INDEX idx_pp_type (policy_type),
    INDEX idx_pp_version (policy_version),
    INDEX idx_pp_active (is_active),
    INDEX idx_pp_effective (effective_from, effective_until),
    INDEX idx_pp_priority (priority)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Políticas de preço versionadas';


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. TABELA: pricing_exceptions
-- Armazena solicitações e decisões de exceção
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pricing_exceptions (
    exception_id VARCHAR(36) NOT NULL,
    event_id VARCHAR(36) NOT NULL,
    
    -- Status do workflow
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    
    -- Solicitação
    requested_by INT UNSIGNED NOT NULL,
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    requested_discount DECIMAL(5,2) NOT NULL,
    requested_price DECIMAL(15,2) NULL,
    requested_reason TEXT NOT NULL,
    urgency ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    
    -- Violação detectada
    violation_type ENUM(
        'MARGIN_BELOW_MINIMUM',
        'DISCOUNT_ABOVE_LIMIT',
        'CREDIT_BLOCKED',
        'CAMPAIGN_OUT_OF_SCOPE',
        'PRICE_FROZEN',
        'OTHER'
    ) NOT NULL,
    violation_details JSON NULL,
    
    -- Aprovação
    approved_by INT UNSIGNED NULL,
    approved_at DATETIME NULL,
    approved_discount DECIMAL(5,2) NULL,
    approved_price DECIMAL(15,2) NULL,
    approval_notes TEXT NULL,
    
    -- Expiração
    expires_at DATETIME NOT NULL,
    
    -- Impacto calculado
    margin_impact DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    margin_impact_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    commission_impact DECIMAL(5,2) NULL,
    
    -- Evento resultante (se aprovado)
    result_event_id VARCHAR(36) NULL,
    
    -- Auditoria
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (exception_id),
    INDEX idx_pe_event (event_id),
    INDEX idx_pe_status (status),
    INDEX idx_pe_requested_by (requested_by),
    INDEX idx_pe_approved_by (approved_by),
    INDEX idx_pe_expires (expires_at),
    INDEX idx_pe_violation (violation_type),
    INDEX idx_pe_urgency (urgency),
    
    CONSTRAINT fk_pe_event FOREIGN KEY (event_id) 
        REFERENCES pricing_decision_events(event_id) ON DELETE CASCADE,
    CONSTRAINT fk_pe_result_event FOREIGN KEY (result_event_id) 
        REFERENCES pricing_decision_events(event_id) ON DELETE SET NULL
        
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Solicitações e decisões de exceção de preço';


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. TABELA: pricing_metrics_daily
-- Métricas agregadas diárias para dashboards
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pricing_metrics_daily (
    id INT UNSIGNED AUTO_INCREMENT,
    metric_date DATE NOT NULL,
    
    -- Dimensões (NULL = total geral)
    seller_id INT UNSIGNED NULL,
    segment VARCHAR(50) NULL,
    
    -- Contadores
    total_decisions INT UNSIGNED NOT NULL DEFAULT 0,
    decisions_within_policy INT UNSIGNED NOT NULL DEFAULT 0,
    decisions_with_exception INT UNSIGNED NOT NULL DEFAULT 0,
    decisions_rejected INT UNSIGNED NOT NULL DEFAULT 0,
    decisions_frozen INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- KPIs principais
    price_integrity_score DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    discount_drift DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    approval_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    approval_pressure_index DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    
    -- Exceções
    exception_attempts INT UNSIGNED NOT NULL DEFAULT 0,
    exceptions_approved INT UNSIGNED NOT NULL DEFAULT 0,
    exceptions_rejected INT UNSIGNED NOT NULL DEFAULT 0,
    exceptions_expired INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Margens
    avg_margin_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    min_margin_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    max_margin_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    total_margin_absolute DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Descontos
    avg_discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    total_discount_value DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Risco
    risk_exposure_value DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    high_risk_decisions INT UNSIGNED NOT NULL DEFAULT 0,
    critical_risk_decisions INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Valores
    total_sales_value DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_orders INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Auditoria
    calculated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_pmd_date_seller_segment (metric_date, seller_id, segment),
    INDEX idx_pmd_date (metric_date),
    INDEX idx_pmd_seller (seller_id),
    INDEX idx_pmd_segment (segment)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Métricas diárias agregadas de pricing';


-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. TABELA: ai_recommendations_log
-- Log de recomendações da IA para aprendizado futuro
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_recommendations_log (
    recommendation_id VARCHAR(36) NOT NULL,
    event_id VARCHAR(36) NULL,
    
    -- Contexto
    customer_id INT UNSIGNED NOT NULL,
    seller_id INT UNSIGNED NOT NULL,
    lead_id INT UNSIGNED NULL,
    
    -- Tipo de recomendação
    recommendation_type ENUM(
        'DISCOUNT_SUGGESTION',
        'PRICE_SUGGESTION',
        'PRODUCT_RECOMMENDATION',
        'FOLLOW_UP_SUGGESTION',
        'RISK_ALERT',
        'CAMPAIGN_SUGGESTION'
    ) NOT NULL,
    
    -- Sugestão da IA
    suggested_value DECIMAL(15,2) NULL,
    suggested_percent DECIMAL(5,2) NULL,
    suggested_action TEXT NULL,
    confidence_score DECIMAL(5,2) NULL COMMENT '0-100',
    
    -- Contexto da política
    policy_min DECIMAL(15,2) NULL,
    policy_max DECIMAL(15,2) NULL,
    was_within_policy TINYINT(1) NOT NULL DEFAULT 1,
    was_adjusted TINYINT(1) NOT NULL DEFAULT 0,
    adjusted_value DECIMAL(15,2) NULL,
    
    -- Resultado real (preenchido após ação do usuário)
    actual_value DECIMAL(15,2) NULL,
    actual_percent DECIMAL(5,2) NULL,
    was_accepted TINYINT(1) NULL,
    acceptance_rate DECIMAL(5,2) NULL,
    
    -- Metadados
    model_version VARCHAR(50) NULL,
    processing_time_ms INT UNSIGNED NULL,
    
    -- Auditoria
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (recommendation_id),
    INDEX idx_arl_event (event_id),
    INDEX idx_arl_customer (customer_id),
    INDEX idx_arl_seller (seller_id),
    INDEX idx_arl_lead (lead_id),
    INDEX idx_arl_type (recommendation_type),
    INDEX idx_arl_accepted (was_accepted),
    INDEX idx_arl_created (created_at),
    
    CONSTRAINT fk_arl_event FOREIGN KEY (event_id) 
        REFERENCES pricing_decision_events(event_id) ON DELETE SET NULL
        
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Log de recomendações da IA para aprendizado';


-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. TABELA: audit_log
-- Log de auditoria geral do sistema
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS audit_log (
    log_id BIGINT UNSIGNED AUTO_INCREMENT,
    
    -- Evento
    event_type ENUM(
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'LOGOUT',
        'PASSWORD_CHANGED',
        'PASSWORD_RESET',
        '2FA_ENABLED',
        '2FA_DISABLED',
        'PRICE_CALCULATED',
        'PRICE_CHANGED',
        'DISCOUNT_APPLIED',
        'DISCOUNT_REMOVED',
        'EXCEPTION_REQUESTED',
        'EXCEPTION_APPROVED',
        'EXCEPTION_REJECTED',
        'ORDER_CONVERTED',
        'PRICE_FROZEN',
        'POLICY_CREATED',
        'POLICY_UPDATED',
        'POLICY_DEACTIVATED',
        'USER_CREATED',
        'USER_UPDATED',
        'PERMISSION_CHANGED'
    ) NOT NULL,
    
    -- Contexto
    user_id INT UNSIGNED NULL,
    user_name VARCHAR(100) NULL,
    user_level INT UNSIGNED NULL,
    
    -- Entidade afetada
    entity_type VARCHAR(50) NULL COMMENT 'customer, lead, order, policy, etc',
    entity_id VARCHAR(50) NULL,
    
    -- Detalhes
    description TEXT NULL,
    old_value JSON NULL,
    new_value JSON NULL,
    metadata JSON NULL,
    
    -- Origem
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    session_id VARCHAR(100) NULL,
    
    -- Resultado
    success TINYINT(1) NOT NULL DEFAULT 1,
    error_message TEXT NULL,
    
    -- Timestamp
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (log_id),
    INDEX idx_al_event_type (event_type),
    INDEX idx_al_user (user_id),
    INDEX idx_al_entity (entity_type, entity_id),
    INDEX idx_al_created (created_at),
    INDEX idx_al_success (success),
    
    -- Particionamento por data (opcional, para tabelas grandes)
    INDEX idx_al_partition (created_at, event_type)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Log de auditoria geral do sistema';


-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. VIEWS ÚTEIS
-- ═══════════════════════════════════════════════════════════════════════════════

-- View: Decisões de preço com detalhes
CREATE OR REPLACE VIEW vw_pricing_decisions AS
SELECT 
    pde.event_id,
    pde.event_timestamp,
    pde.action,
    pde.customer_id,
    JSON_UNQUOTE(JSON_EXTRACT(pde.customer_context, '$.customer_name')) AS customer_name,
    pde.seller_id,
    JSON_UNQUOTE(JSON_EXTRACT(pde.seller_context, '$.seller_name')) AS seller_name,
    pde.lead_id,
    pde.order_id,
    pde.price_base,
    pde.price_final,
    pde.discount_percent,
    pde.margin_percent,
    pde.risk_level,
    pde.compliance_status,
    pde.is_within_policy,
    pde.requires_approval,
    pde.is_frozen,
    pde.policy_version,
    pde.created_at
FROM pricing_decision_events pde
WHERE pde.is_simulation = 0;


-- View: Exceções pendentes
CREATE OR REPLACE VIEW vw_pending_exceptions AS
SELECT 
    pe.exception_id,
    pe.event_id,
    pe.status,
    pe.requested_by,
    pe.requested_at,
    pe.requested_discount,
    pe.requested_reason,
    pe.urgency,
    pe.violation_type,
    pe.expires_at,
    pe.margin_impact,
    TIMESTAMPDIFF(HOUR, NOW(), pe.expires_at) AS hours_until_expiry,
    pde.customer_id,
    JSON_UNQUOTE(JSON_EXTRACT(pde.customer_context, '$.customer_name')) AS customer_name,
    pde.seller_id,
    JSON_UNQUOTE(JSON_EXTRACT(pde.seller_context, '$.seller_name')) AS seller_name,
    pde.price_base,
    pde.price_final
FROM pricing_exceptions pe
JOIN pricing_decision_events pde ON pe.event_id = pde.event_id
WHERE pe.status = 'PENDING'
  AND pe.expires_at > NOW()
ORDER BY pe.urgency DESC, pe.requested_at ASC;


-- View: KPIs atuais (últimos 30 dias)
CREATE OR REPLACE VIEW vw_pricing_kpis_current AS
SELECT 
    COUNT(*) AS total_decisions,
    SUM(CASE WHEN is_within_policy = 1 THEN 1 ELSE 0 END) AS decisions_within_policy,
    ROUND(SUM(CASE WHEN is_within_policy = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS price_integrity_score,
    ROUND(AVG(discount_percent), 2) AS avg_discount_percent,
    SUM(CASE WHEN requires_approval = 1 THEN 1 ELSE 0 END) AS exception_attempts,
    ROUND(SUM(CASE WHEN requires_approval = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS approval_pressure_index,
    ROUND(AVG(margin_percent), 2) AS avg_margin_percent,
    SUM(CASE WHEN risk_level IN ('HIGH', 'CRITICAL') THEN price_final ELSE 0 END) AS risk_exposure_value
FROM pricing_decision_events
WHERE event_timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND is_simulation = 0;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. STORED PROCEDURES
-- ═══════════════════════════════════════════════════════════════════════════════

DELIMITER //

-- Procedure: Calcular métricas diárias
CREATE PROCEDURE sp_calculate_daily_metrics(IN p_date DATE)
BEGIN
    -- Métricas gerais (sem dimensão)
    INSERT INTO pricing_metrics_daily (
        metric_date,
        seller_id,
        segment,
        total_decisions,
        decisions_within_policy,
        decisions_with_exception,
        decisions_rejected,
        decisions_frozen,
        price_integrity_score,
        exception_attempts,
        exceptions_approved,
        exceptions_rejected,
        avg_margin_percent,
        avg_discount_percent,
        total_sales_value,
        total_orders,
        approval_pressure_index
    )
    SELECT 
        p_date,
        NULL,
        NULL,
        COUNT(*),
        SUM(CASE WHEN is_within_policy = 1 THEN 1 ELSE 0 END),
        SUM(CASE WHEN compliance_status = 'APPROVED_EXCEPTION' THEN 1 ELSE 0 END),
        SUM(CASE WHEN compliance_status = 'REJECTED' THEN 1 ELSE 0 END),
        SUM(CASE WHEN is_frozen = 1 THEN 1 ELSE 0 END),
        ROUND(SUM(CASE WHEN is_within_policy = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2),
        SUM(CASE WHEN requires_approval = 1 THEN 1 ELSE 0 END),
        (SELECT COUNT(*) FROM pricing_exceptions WHERE DATE(approved_at) = p_date AND status = 'APPROVED'),
        (SELECT COUNT(*) FROM pricing_exceptions WHERE DATE(approved_at) = p_date AND status = 'REJECTED'),
        ROUND(AVG(margin_percent), 2),
        ROUND(AVG(discount_percent), 2),
        SUM(price_final),
        SUM(CASE WHEN action = 'CONVERT_ORDER' THEN 1 ELSE 0 END),
        ROUND(SUM(CASE WHEN requires_approval = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2)
    FROM pricing_decision_events
    WHERE DATE(event_timestamp) = p_date
      AND is_simulation = 0
    ON DUPLICATE KEY UPDATE
        total_decisions = VALUES(total_decisions),
        decisions_within_policy = VALUES(decisions_within_policy),
        decisions_with_exception = VALUES(decisions_with_exception),
        decisions_rejected = VALUES(decisions_rejected),
        decisions_frozen = VALUES(decisions_frozen),
        price_integrity_score = VALUES(price_integrity_score),
        exception_attempts = VALUES(exception_attempts),
        exceptions_approved = VALUES(exceptions_approved),
        exceptions_rejected = VALUES(exceptions_rejected),
        avg_margin_percent = VALUES(avg_margin_percent),
        avg_discount_percent = VALUES(avg_discount_percent),
        total_sales_value = VALUES(total_sales_value),
        total_orders = VALUES(total_orders),
        approval_pressure_index = VALUES(approval_pressure_index),
        calculated_at = NOW();
        
    -- Métricas por vendedor
    INSERT INTO pricing_metrics_daily (
        metric_date,
        seller_id,
        segment,
        total_decisions,
        decisions_within_policy,
        price_integrity_score,
        exception_attempts,
        avg_margin_percent,
        avg_discount_percent,
        approval_pressure_index
    )
    SELECT 
        p_date,
        seller_id,
        NULL,
        COUNT(*),
        SUM(CASE WHEN is_within_policy = 1 THEN 1 ELSE 0 END),
        ROUND(SUM(CASE WHEN is_within_policy = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2),
        SUM(CASE WHEN requires_approval = 1 THEN 1 ELSE 0 END),
        ROUND(AVG(margin_percent), 2),
        ROUND(AVG(discount_percent), 2),
        ROUND(SUM(CASE WHEN requires_approval = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2)
    FROM pricing_decision_events
    WHERE DATE(event_timestamp) = p_date
      AND is_simulation = 0
    GROUP BY seller_id
    ON DUPLICATE KEY UPDATE
        total_decisions = VALUES(total_decisions),
        decisions_within_policy = VALUES(decisions_within_policy),
        price_integrity_score = VALUES(price_integrity_score),
        exception_attempts = VALUES(exception_attempts),
        avg_margin_percent = VALUES(avg_margin_percent),
        avg_discount_percent = VALUES(avg_discount_percent),
        approval_pressure_index = VALUES(approval_pressure_index),
        calculated_at = NOW();
END //

-- Procedure: Expirar exceções pendentes
CREATE PROCEDURE sp_expire_pending_exceptions()
BEGIN
    UPDATE pricing_exceptions
    SET status = 'EXPIRED',
        updated_at = NOW()
    WHERE status = 'PENDING'
      AND expires_at < NOW();
      
    SELECT ROW_COUNT() AS expired_count;
END //

DELIMITER ;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

DELIMITER //

-- Trigger: Log de auditoria para decisões de preço
CREATE TRIGGER trg_pricing_decision_audit
AFTER INSERT ON pricing_decision_events
FOR EACH ROW
BEGIN
    IF NEW.is_simulation = 0 THEN
        INSERT INTO audit_log (
            event_type,
            user_id,
            entity_type,
            entity_id,
            description,
            new_value,
            created_at
        ) VALUES (
            CASE NEW.action
                WHEN 'APPLY_DISCOUNT' THEN 'DISCOUNT_APPLIED'
                WHEN 'CONVERT_ORDER' THEN 'ORDER_CONVERTED'
                WHEN 'PRICE_FREEZE' THEN 'PRICE_FROZEN'
                ELSE 'PRICE_CHANGED'
            END,
            NEW.created_by,
            'pricing_event',
            NEW.event_id,
            CONCAT('Pricing action: ', NEW.action, ' - Status: ', NEW.compliance_status),
            JSON_OBJECT(
                'price_base', NEW.price_base,
                'price_final', NEW.price_final,
                'discount_percent', NEW.discount_percent,
                'margin_percent', NEW.margin_percent,
                'compliance_status', NEW.compliance_status
            ),
            NEW.created_at
        );
    END IF;
END //

DELIMITER ;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. DADOS INICIAIS (Políticas padrão)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Política: Margem mínima geral
INSERT INTO pricing_policies (
    policy_id, policy_code, policy_name, policy_description,
    policy_type, policy_version, config, effective_from, priority
) VALUES (
    UUID(), 'MIN_MARGIN_DEFAULT', 'Margem Mínima Padrão', 
    'Margem mínima de 20% para todos os produtos',
    'MINIMUM_MARGIN', '2026.01.01',
    '{"min_margin_percent": 20, "enforcement": "BLOCK_OR_APPROVE"}',
    '2026-01-01', 10
);

-- Política: Limite de desconto Level 1
INSERT INTO pricing_policies (
    policy_id, policy_code, policy_name, policy_description,
    policy_type, policy_version, config, effective_from, priority,
    applies_to_sellers
) VALUES (
    UUID(), 'DISCOUNT_LIMIT_L1', 'Limite Desconto Vendedor Nível 1',
    'Vendedores nível 1 podem dar até 5% de desconto',
    'MAXIMUM_DISCOUNT', '2026.01.01',
    '{"max_discount_percent": 5, "requires_approval_above": 5, "approver_min_level": 5}',
    '2026-01-01', 20,
    NULL -- Será filtrado por seller.level no código
);

-- Política: Limite de desconto Level 3
INSERT INTO pricing_policies (
    policy_id, policy_code, policy_name, policy_description,
    policy_type, policy_version, config, effective_from, priority
) VALUES (
    UUID(), 'DISCOUNT_LIMIT_L3', 'Limite Desconto Vendedor Nível 3',
    'Vendedores nível 3 podem dar até 10% de desconto',
    'MAXIMUM_DISCOUNT', '2026.01.01',
    '{"max_discount_percent": 10, "requires_approval_above": 10, "approver_min_level": 5}',
    '2026-01-01', 21
);

-- Política: Bloqueio por crédito
INSERT INTO pricing_policies (
    policy_id, policy_code, policy_name, policy_description,
    policy_type, policy_version, config, effective_from, priority
) VALUES (
    UUID(), 'CREDIT_BLOCK', 'Bloqueio Cliente Inadimplente',
    'Bloqueia vendas para clientes com crédito bloqueado',
    'CREDIT_RESTRICTION', '2026.01.01',
    '{"block_status": ["BLOCKED"], "restrict_status": ["RESTRICTED"], "allow_exception": true}',
    '2026-01-01', 1
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- FIM DO DDL
-- ═══════════════════════════════════════════════════════════════════════════════
