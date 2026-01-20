-- Migração: Meta diária de leads por vendedor
-- Data: 2026-01-20

-- Adicionar coluna para meta diária de leads
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS daily_lead_goal INT DEFAULT 50;

-- Atualizar registros existentes com meta padrão
UPDATE user_preferences 
SET daily_lead_goal = 50 
WHERE daily_lead_goal IS NULL;
