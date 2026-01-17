-- Tabela de Interações com Clientes
-- Schema: staging (mesmo do leads-agent)

CREATE TABLE IF NOT EXISTS staging.customer_interactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    user_id INT NOT NULL,
    type ENUM('call', 'visit', 'email', 'whatsapp', 'meeting', 'note') NOT NULL,
    description TEXT,
    next_action_date DATE NULL,
    next_action_description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_customer_id (customer_id),
    INDEX idx_user_id (user_id),
    INDEX idx_next_action_date (next_action_date),
    INDEX idx_created_at (created_at)
);

-- Tipos de interação:
-- call: Ligação telefônica
-- visit: Visita presencial
-- email: Email enviado/recebido
-- whatsapp: Mensagem WhatsApp
-- meeting: Reunião
-- note: Nota/observação
