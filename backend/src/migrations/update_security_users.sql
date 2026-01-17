-- ═══════════════════════════════════════════════════════════
-- MIGRATION: Security Updates (Q1 2026)
-- ═══════════════════════════════════════════════════════════

-- Adicionar suporte a 2FA e metadados de senha na tabela de usuários legada
-- Mudar formato para DYNAMIC para permitir mais colunas e armazenamento off-row eficiente
ALTER TABLE rolemak_users ROW_FORMAT=DYNAMIC;

-- Liberar espaço convertendo colunas NÃO indexadas para TEXT (off-row)
ALTER TABLE rolemak_users MODIFY cor TEXT NULL;
ALTER TABLE rolemak_users MODIFY segment_access TEXT NULL;
ALTER TABLE rolemak_users MODIFY ramal TEXT NULL;
ALTER TABLE rolemak_users MODIFY imapuser TEXT NULL;
ALTER TABLE rolemak_users MODIFY skype TEXT NULL;
ALTER TABLE rolemak_users MODIFY msn TEXT NULL;

-- Agora adicionar as colunas de segurança
ALTER TABLE rolemak_users ADD COLUMN two_factor_secret TEXT NULL;
ALTER TABLE rolemak_users ADD COLUMN two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE rolemak_users ADD COLUMN password_version VARCHAR(10) NOT NULL DEFAULT 'MD5';
ALTER TABLE rolemak_users ADD COLUMN last_password_change DATETIME NULL;
ALTER TABLE rolemak_users ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE rolemak_users ADD COLUMN password_bcrypt VARCHAR(255) NULL AFTER newpassword;

-- Criar tabela de log de auditoria se não existir (conforme checklist 4.2.1)
-- Atualizado Jan 2026 para novo schema de log
CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    user_id INT NULL,
    user_name VARCHAR(100) NULL,
    resource_type VARCHAR(50) NULL,
    resource_id VARCHAR(50) NULL,
    old_value JSON NULL,
    new_value JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    request_id VARCHAR(50) NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_action (action),
    INDEX idx_user (user_id),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Atualizar View users para incluir novas colunas (Q1 2026)
CREATE OR REPLACE VIEW `users` AS 
select 
    `rolemak_users`.`id` AS `id`,
    `rolemak_users`.`cargo` AS `cargo`,
    `rolemak_users`.`target_customers` AS `target_customers`,
    `rolemak_users`.`unidade` AS `unidade`,
    `rolemak_users`.`user` AS `user`,
    `rolemak_users`.`nick` AS `nick`,
    `rolemak_users`.`birthday` AS `birthday`,
    `rolemak_users`.`email` AS `email`,
    `rolemak_users`.`email_interno` AS `email_interno`,
    `rolemak_users`.`newpassword` AS `newpassword`,
    `rolemak_users`.`password_bcrypt` AS `password_bcrypt`,
    `rolemak_users`.`date_last_pw` AS `date_last_pw`,
    `rolemak_users`.`vendedor` AS `vendedor`,
    `rolemak_users`.`empresa` AS `empresa`,
    `rolemak_users`.`segmento` AS `segmento`,
    `rolemak_users`.`depto` AS `depto`,
    `rolemak_users`.`level` AS `level`,
    `rolemak_users`.`target` AS `target`,
    `rolemak_users`.`prog_inicial` AS `prog_inicial`,
    `rolemak_users`.`background` AS `background`,
    `rolemak_users`.`inter_access` AS `inter_access`,
    `rolemak_users`.`customer_access` AS `customer_access`,
    `rolemak_users`.`sales_access` AS `sales_access`,
    `rolemak_users`.`css` AS `css`,
    `rolemak_users`.`ramal` AS `ramal`,
    `rolemak_users`.`skype` AS `skype`,
    `rolemak_users`.`skype_pass` AS `skype_pass`,
    `rolemak_users`.`msn` AS `msn`,
    `rolemak_users`.`msn_pass` AS `msn_pass`,
    `rolemak_users`.`linux_pass` AS `linux_pass`,
    `rolemak_users`.`tasks` AS `tasks`,
    `rolemak_users`.`ip_allow` AS `ip_allow`,
    `rolemak_users`.`nextel` AS `nextel`,
    `rolemak_users`.`imapuser` AS `imapuser`,
    `rolemak_users`.`imappw` AS `imappw`,
    `rolemak_users`.`recordListingID` AS `recordListingID`,
    '' AS `idcli`,
    `rolemak_users`.`two_factor_secret` AS `two_factor_secret`,
    `rolemak_users`.`two_factor_enabled` AS `two_factor_enabled`,
    `rolemak_users`.`password_version` AS `password_version`,
    `rolemak_users`.`last_password_change` AS `last_password_change`,
    `rolemak_users`.`must_change_password` AS `must_change_password`
from `rolemak_users` 
union all 
select 
    `a`.`id` AS `id`,
    '' AS `cargo`,
    '' AS `target_customers`,
    '' AS `unidade`,
    `a`.`name` AS `user`,
    `a`.`email` AS `nick`,
    '' AS `birthday`,
    `a`.`email` AS `email`,
    '' AS `email_interno`,
    '' AS `newpassword`,
    NULL AS `password_bcrypt`,
    '' AS `date_last_pw`,
    '' AS `vendedor`,
    '' AS `empresa`,
    '' AS `segmento`,
    'VENDAS' AS `depto`,
    '' AS `level`,
    '' AS `target`,
    '' AS `prog_inicial`,
    '' AS `background`,
    '' AS `inter_access`,
    '' AS `customer_access`,
    '' AS `sales_access`,
    '' AS `css`,
    '' AS `ramal`,
    '' AS `skype`,
    '' AS `skype_pass`,
    '' AS `msn`,
    '' AS `msn_pass`,
    '' AS `linux_pass`,
    '' AS `tasks`,
    '' AS `ip_allow`,
    '' AS `nextel`,
    '' AS `imapuser`,
    '' AS `imappw`,
    '' AS `recordListingID`,
    `a`.`idcli` AS `idcli`,
    NULL AS `two_factor_secret`,
    0 AS `two_factor_enabled`,
    'MD5' AS `password_version`,
    NULL AS `last_password_change`,
    0 AS `must_change_password`
from (`clientes_users` `a` left join `clientes` `b` on((`a`.`idcli` = `b`.`id`))) 
where (`b`.`hierarquia_id` = 10);
