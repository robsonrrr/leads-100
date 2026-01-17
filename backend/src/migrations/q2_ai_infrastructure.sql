-- Migração Q2 2026: Infraestrutura de Chatbot IA

-- Tabela de Conversas
CREATE TABLE IF NOT EXISTS ai_conversations (
    id VARCHAR(36) PRIMARY KEY, -- UUID
    user_id INT NOT NULL,
    title VARCHAR(255),
    context_type ENUM('GENERAL', 'CUSTOMER', 'LEAD', 'ORDER') DEFAULT 'GENERAL',
    context_id VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_context (context_type, context_id)
);

-- Tabela de Mensagens
CREATE TABLE IF NOT EXISTS ai_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    role ENUM('user', 'assistant', 'system', 'tool') NOT NULL,
    content TEXT,
    tool_calls JSON NULL, -- Para function calling
    tool_output JSON NULL, -- Resultado da function
    tokens_usage INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conversation (conversation_id),
    FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
);
