-- Migração Q2 2026: Configuração de Dashboard Customizável

CREATE TABLE IF NOT EXISTS user_preferences (
    user_id INT PRIMARY KEY,
    dashboard_config JSON,
    theme VARCHAR(20) DEFAULT 'light',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inserir alguns widgets padrão para facilitar o início
-- Exemplo de config: { "widgets": ["metrics", "forecast", "alerts", "ranking", "followups", "risk"], "layout": "grid" }
