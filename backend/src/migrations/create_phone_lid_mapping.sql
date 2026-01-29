-- ============================================================================
-- Migration: Phone-LID Mapping for WhatsApp Business API
-- ============================================================================
-- 
-- Purpose: Map Linked IDs (LIDs) to real phone numbers
-- 
-- LIDs are used by WhatsApp Business API when customers contact via:
-- - Facebook/Instagram Click-to-WhatsApp ads  
-- - wa.me links with tracking parameters
-- - Facebook Messenger/Instagram Direct integration
--
-- @version 1.0
-- @date 2026-01-23
-- ============================================================================

-- 1. Create the mapping table
CREATE TABLE IF NOT EXISTS superbot.phone_lid_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- The Linked ID (15-digit identifier from WhatsApp API)
    lid VARCHAR(20) NOT NULL COMMENT 'Linked ID from WhatsApp Business API',
    
    -- The real phone number (when known)
    phone_number VARCHAR(15) NULL COMMENT 'Real phone number in format 55XXXXXXXXXXX',
    
    -- Customer identification
    push_name VARCHAR(255) NULL COMMENT 'WhatsApp profile name used for matching',
    customer_name VARCHAR(255) NULL COMMENT 'Name from superbot_customers',
    
    -- Reference to superbot_customers
    lid_customer_id INT NULL COMMENT 'ID in superbot_customers for LID record',
    phone_customer_id INT NULL COMMENT 'ID in superbot_customers for phone record',
    
    -- Mapping metadata
    confidence DECIMAL(3,2) DEFAULT 0.00 COMMENT 'Confidence score 0.00-1.00',
    match_method ENUM('push_name', 'manual', 'message_context', 'auto') DEFAULT 'push_name',
    is_verified BOOLEAN DEFAULT FALSE COMMENT 'Manually verified mapping',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    verified_by INT NULL,
    
    -- Indexes
    UNIQUE KEY uk_lid (lid),
    INDEX idx_phone (phone_number),
    INDEX idx_push_name (push_name),
    INDEX idx_verified (is_verified),
    INDEX idx_confidence (confidence DESC)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Maps WhatsApp Linked IDs (LIDs) to real phone numbers for unified customer view';


-- 2. Create helper function to detect if a phone_number is a LID
-- LIDs are typically 13-15 digits and don't start with country codes like 55
DELIMITER //
DROP FUNCTION IF EXISTS superbot.is_linked_id//
CREATE FUNCTION superbot.is_linked_id(phone VARCHAR(20))
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    -- LID detection rules:
    -- 1. Length between 13-15 digits
    -- 2. Does NOT start with '55' (Brazil country code)
    -- 3. All digits
    IF phone IS NULL THEN
        RETURN FALSE;
    END IF;
    
    IF LENGTH(phone) >= 13 
       AND LENGTH(phone) <= 15 
       AND phone REGEXP '^[0-9]+$'
       AND phone NOT LIKE '55%' THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END//
DELIMITER ;


-- 3. Populate initial mappings based on push_name matching
-- Find customers that have BOTH a LID and a real phone number with same push_name
INSERT IGNORE INTO superbot.phone_lid_mappings 
    (lid, phone_number, push_name, customer_name, lid_customer_id, phone_customer_id, confidence, match_method)
SELECT 
    lid_rec.phone_number as lid,
    phone_rec.phone_number as phone_number,
    COALESCE(lid_rec.push_name, lid_rec.name) as push_name,
    phone_rec.name as customer_name,
    lid_rec.id as lid_customer_id,
    phone_rec.id as phone_customer_id,
    0.85 as confidence,  -- High confidence for exact push_name match
    'push_name' as match_method
FROM superbot.superbot_customers lid_rec
INNER JOIN superbot.superbot_customers phone_rec 
    ON COALESCE(lid_rec.push_name, lid_rec.name) = COALESCE(phone_rec.push_name, phone_rec.name)
    AND lid_rec.id != phone_rec.id
WHERE 
    -- lid_rec is a LID (jid ends with @lid)
    lid_rec.jid LIKE '%@lid'
    -- phone_rec is a real phone (jid ends with @s.whatsapp.net)
    AND phone_rec.jid LIKE '%@s.whatsapp.net'
    -- Both have a name
    AND COALESCE(lid_rec.push_name, lid_rec.name) IS NOT NULL
    AND COALESCE(lid_rec.push_name, lid_rec.name) != ''
    -- Avoid very common/generic names
    AND COALESCE(lid_rec.push_name, lid_rec.name) NOT IN (
        '', 'WhatsApp User', 'Usuario', 'Cliente', 'Contato'
    )
    AND LENGTH(COALESCE(lid_rec.push_name, lid_rec.name)) > 3;


-- 4. Create view that provides unified customer contacts
CREATE OR REPLACE VIEW superbot.vw_unified_contacts AS
SELECT 
    -- Use phone number as primary identifier, fallback to LID
    COALESCE(plm.phone_number, sc.phone_number) as unified_phone,
    sc.phone_number as original_phone,
    
    -- Flag if this is a LID
    CASE 
        WHEN sc.jid LIKE '%@lid' THEN TRUE
        ELSE FALSE
    END as is_lid,
    
    -- Mapping info
    plm.phone_number as mapped_phone,
    plm.confidence as mapping_confidence,
    plm.is_verified as mapping_verified,
    
    -- Customer info
    sc.id as superbot_customer_id,
    sc.jid,
    sc.name,
    sc.push_name,
    sc.is_group,
    sc.created_at,
    sc.updated_at
    
FROM superbot.superbot_customers sc
LEFT JOIN superbot.phone_lid_mappings plm ON sc.phone_number = plm.lid
WHERE sc.is_group = 0;


-- 5. Create view for messages with unified sender/recipient
CREATE OR REPLACE VIEW superbot.vw_messages_unified AS
SELECT 
    m.id,
    m.message_id,
    m.session_id,
    
    -- Original values
    m.sender_phone as original_sender_phone,
    m.recipient_phone as original_recipient_phone,
    
    -- Unified values (resolve LIDs to real phones when mapping exists)
    COALESCE(sender_map.phone_number, m.sender_phone) as sender_phone,
    COALESCE(recipient_map.phone_number, m.recipient_phone) as recipient_phone,
    
    -- LID flags
    superbot.is_linked_id(m.sender_phone) as sender_is_lid,
    superbot.is_linked_id(m.recipient_phone) as recipient_is_lid,
    
    -- Sender mapping info
    sender_map.phone_number as sender_mapped_phone,
    sender_map.confidence as sender_mapping_confidence,
    
    -- Message content
    m.message_text,
    m.message_type,
    m.direction,
    m.source,
    m.status,
    m.is_group,
    
    -- Timestamps
    m.original_timestamp,
    m.received_at,
    m.delivered_at,
    m.read_at,
    m.processed_at
    
FROM superbot.messages m
LEFT JOIN superbot.phone_lid_mappings sender_map ON m.sender_phone = sender_map.lid
LEFT JOIN superbot.phone_lid_mappings recipient_map ON m.recipient_phone = recipient_map.lid;


-- 6. Show statistics after migration
SELECT 
    'Mappings Created' as metric,
    COUNT(*) as value
FROM superbot.phone_lid_mappings

UNION ALL

SELECT 
    'LIDs in superbot_customers' as metric,
    COUNT(*) as value
FROM superbot.superbot_customers 
WHERE jid LIKE '%@lid'

UNION ALL

SELECT 
    'LIDs with mapping' as metric,
    COUNT(*) as value
FROM superbot.superbot_customers sc
INNER JOIN superbot.phone_lid_mappings plm ON sc.phone_number = plm.lid
WHERE sc.jid LIKE '%@lid';
