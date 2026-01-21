-- =====================================================
-- VIEW: vw_whatsapp_contacts
-- 
-- Lista de contatos do WhatsApp agrupados por vendedor
-- session_id = telefone do vendedor
-- 
-- @date 2026-01-20
-- =====================================================

-- Estrutura da tabela messages (referência)
-- CREATE TABLE `messages` (
--   `id` int NOT NULL AUTO_INCREMENT,
--   `message_id` varchar(255) DEFAULT NULL,
--   `session_id` varchar(50) DEFAULT NULL,        -- ← Telefone do VENDEDOR
--   `sender_phone` varchar(20) NOT NULL,
--   `recipient_phone` varchar(20) DEFAULT NULL,
--   `message_text` text,
--   `source` enum('user','api') NOT NULL DEFAULT 'user',
--   `message_type` enum('text','media','status') DEFAULT 'text',
--   `original_timestamp` timestamp NULL DEFAULT NULL,
--   `read_at` timestamp NULL DEFAULT NULL,
--   `received_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
--   `processed_at` timestamp NULL DEFAULT NULL,
--   `environment` varchar(20) DEFAULT 'production',
--   `status` enum('received','processing','completed','error') DEFAULT 'received',
--   `is_group` int NOT NULL,
--   `direction` enum('incoming','outgoing') NOT NULL,
--   `delivered_at` timestamp NULL DEFAULT NULL,
--   PRIMARY KEY (`id`)
-- );

-- =====================================================
-- VIEW: Contatos por vendedor
-- =====================================================

DROP VIEW IF EXISTS superbot.vw_whatsapp_contacts;

CREATE VIEW superbot.vw_whatsapp_contacts AS
SELECT 
    -- Identificação do contato
    contact_phone,
    
    -- Dados do vendedor (session_id)
    session_id AS seller_phone,
    
    -- Nome do contato (buscar da tabela superbot_customers se existir)
    COALESCE(sc.name, sc.push_name, contact_phone) AS contact_name,
    sc.push_name,
    
    -- Estatísticas
    total_messages,
    incoming_messages,
    outgoing_messages,
    first_message_at,
    last_message_at,
    
    -- Dias desde última mensagem
    DATEDIFF(NOW(), last_message_at) AS days_since_last_message,
    
    -- Tem transcrição de áudio?
    has_transcription,
    
    -- Vinculação com leads-agent
    sc.id AS superbot_customer_id,
    CASE WHEN scl.id IS NOT NULL THEN 1 ELSE 0 END AS has_linked_customer,
    scl.leads_customer_id
    
FROM (
    -- Subquery principal: Agregar mensagens por contato e vendedor
    SELECT 
        session_id,
        
        -- O contato é quem NÃO é o vendedor (session_id)
        CASE 
            WHEN sender_phone = session_id THEN recipient_phone
            ELSE sender_phone
        END AS contact_phone,
        
        -- Contagens
        COUNT(*) AS total_messages,
        SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END) AS incoming_messages,
        SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END) AS outgoing_messages,
        
        -- Datas
        MIN(received_at) AS first_message_at,
        MAX(received_at) AS last_message_at,
        
        -- Flag de transcrição
        MAX(CASE WHEN message_type = 'audio' OR message_type = 'media' THEN 1 ELSE 0 END) AS has_transcription
        
    FROM superbot.messages
    WHERE 
        is_group = 0                                    -- Excluir grupos
        AND session_id IS NOT NULL                      -- Deve ter session_id
        AND session_id != ''                            -- Não pode ser vazio
        AND sender_phone NOT LIKE '%status@broadcast%'  -- Excluir status
        AND recipient_phone NOT LIKE '%status@broadcast%'
        AND COALESCE(sender_phone, '') NOT LIKE 'status%'
        AND COALESCE(recipient_phone, '') NOT LIKE 'status%'
    GROUP BY 
        session_id,
        CASE 
            WHEN sender_phone = session_id THEN recipient_phone
            ELSE sender_phone
        END
    HAVING 
        contact_phone IS NOT NULL 
        AND contact_phone != ''
        AND contact_phone != session_id                 -- Excluir o próprio vendedor
) AS contacts

-- LEFT JOIN com superbot_customers para obter nome
LEFT JOIN superbot.superbot_customers sc ON sc.phone_number = contacts.contact_phone

-- LEFT JOIN com customer_links para saber se está vinculado
LEFT JOIN superbot.superbot_customer_links scl ON scl.superbot_customer_id = sc.id

-- Ordenar por última mensagem (mais recentes primeiro)
ORDER BY last_message_at DESC;

-- =====================================================
-- COMO USAR A VIEW:
-- =====================================================

-- Listar todos os contatos de um vendedor específico:
-- SELECT * FROM superbot.vw_whatsapp_contacts WHERE seller_phone = '551133314782';

-- Listar contatos com última mensagem nos últimos 7 dias:
-- SELECT * FROM superbot.vw_whatsapp_contacts WHERE days_since_last_message <= 7;

-- Listar contatos que ainda não estão vinculados ao leads-agent:
-- SELECT * FROM superbot.vw_whatsapp_contacts WHERE has_linked_customer = 0;

-- Contar contatos por vendedor:
-- SELECT seller_phone, COUNT(*) as total_contacts 
-- FROM superbot.vw_whatsapp_contacts 
-- GROUP BY seller_phone;