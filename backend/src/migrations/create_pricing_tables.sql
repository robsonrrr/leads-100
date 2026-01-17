-- ═══════════════════════════════════════════════════════════
-- MIGRATION: Pricing Agent Core Tables (Q1 2026)
-- ═══════════════════════════════════════════════════════════

-- TABELA: pricing_policies
CREATE TABLE IF NOT EXISTS pricing_policies (
    policy_id VARCHAR(36) PRIMARY KEY,
    policy_name VARCHAR(100) NOT NULL,
    policy_type VARCHAR(50) NOT NULL,
    policy_version VARCHAR(20) NOT NULL,
    config JSON NOT NULL,
    effective_from DATE NOT NULL,
    effective_until DATE NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    priority INT NOT NULL DEFAULT 100,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    
    INDEX idx_type (policy_type),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TABELA: pricing_decision_events
CREATE TABLE IF NOT EXISTS pricing_decision_events (
    event_id VARCHAR(36) PRIMARY KEY,
    event_version VARCHAR(10) NOT NULL DEFAULT '1.0',
    event_timestamp DATETIME(3) NOT NULL,
    
    -- Origem
    source ENUM('CRM', 'API', 'BATCH') NOT NULL,
    action VARCHAR(50) NOT NULL,
    
    -- Referências
    customer_id INT NOT NULL,
    seller_id INT NOT NULL,
    lead_id INT NULL,
    order_id INT NULL,
    cart_id INT NOT NULL,
    
    -- Política
    policy_version VARCHAR(20) NOT NULL,
    
    -- Resultado
    price_base DECIMAL(15,2) NOT NULL,
    price_final DECIMAL(15,2) NOT NULL,
    discount_total DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    margin_absolute DECIMAL(15,2) NOT NULL,
    margin_percent DECIMAL(5,2) NOT NULL,
    
    -- Classificação
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    compliance_status ENUM('APPROVED', 'PENDING_APPROVAL', 
                          'APPROVED_EXCEPTION', 'REJECTED', 'FROZEN') NOT NULL,
    
    -- Flags
    is_within_policy BOOLEAN NOT NULL DEFAULT TRUE,
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Contextos (JSON)
    customer_context JSON NOT NULL,
    seller_context JSON NOT NULL,
    transaction_context JSON NOT NULL,
    policy_context JSON NOT NULL,
    pricing_result JSON NOT NULL,
    metadata JSON NOT NULL,
    
    -- Auditoria
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    created_by INT NOT NULL,
    
    INDEX idx_customer (customer_id),
    INDEX idx_seller (seller_id),
    INDEX idx_lead (lead_id),
    INDEX idx_timestamp (event_timestamp),
    INDEX idx_compliance (compliance_status),
    INDEX idx_frozen (is_frozen)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TABELA: pricing_exceptions
CREATE TABLE IF NOT EXISTS pricing_exceptions (
    exception_id VARCHAR(36) PRIMARY KEY,
    event_id VARCHAR(36) NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED') NOT NULL,
    
    -- Solicitação
    requested_by INT NOT NULL,
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    requested_discount DECIMAL(5,2) NOT NULL,
    requested_reason TEXT NOT NULL,
    
    -- Aprovação
    approved_by INT NULL,
    approved_at DATETIME NULL,
    approved_discount DECIMAL(5,2) NULL,
    approval_notes TEXT NULL,
    
    -- Expiração
    expires_at DATETIME NOT NULL,
    
    -- Impacto
    margin_impact DECIMAL(15,2) NOT NULL,
    commission_impact DECIMAL(5,2) NULL,
    
    INDEX idx_event (event_id),
    INDEX idx_status (status),
    
    FOREIGN KEY (event_id) REFERENCES pricing_decision_events(event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Popular com políticas iniciais Q1 2026
INSERT IGNORE INTO pricing_policies (policy_id, policy_name, policy_type, policy_version, config, effective_from, created_by)
VALUES 
('pol-q1-margin-001', 'Margem Mínima Q1 2026', 'MINIMUM_MARGIN', '2026.1', '{"value": 20}', CURDATE(), 0),
('pol-q1-discount-001', 'Limites de Desconto por Nível Q1', 'DISCOUNT_LIMIT', '2026.1', '{"levels": {"1": 5, "2": 7, "3": 10, "4": 12, "5": 15, "6": 20}}', CURDATE(), 0);
