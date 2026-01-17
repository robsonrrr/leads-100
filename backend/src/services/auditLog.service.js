import { getDatabase } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Tipos de ação para audit log
 */
export const AuditAction = {
  // Autenticação
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',

  // Leads
  LEAD_CREATE: 'LEAD_CREATE',
  LEAD_UPDATE: 'LEAD_UPDATE',
  LEAD_DELETE: 'LEAD_DELETE',
  LEAD_CONVERT: 'LEAD_CONVERT',

  // Itens do carrinho
  ITEM_ADD: 'ITEM_ADD',
  ITEM_UPDATE: 'ITEM_UPDATE',
  ITEM_DELETE: 'ITEM_DELETE',

  // Pedidos
  ORDER_CREATE: 'ORDER_CREATE',
  ORDER_UPDATE: 'ORDER_UPDATE',
  ORDER_CANCEL: 'ORDER_CANCEL',

  // Preços
  PRICE_UPDATE: 'PRICE_UPDATE',
  DISCOUNT_UPDATE: 'DISCOUNT_UPDATE',

  // Usuários
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE'
};

/**
 * Serviço de Audit Log
 * Registra ações críticas para auditoria
 */
class AuditLogService {
  constructor() {
    this.tableName = 'audit_log';
    this.initialized = false;
  }

  /**
   * Inicializa a tabela de audit log se não existir
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const db = getDatabase();

      // Criar tabela se não existir
      await db.execute(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          action VARCHAR(50) NOT NULL,
          user_id INT NULL,
          user_name VARCHAR(100) NULL,
          resource_type VARCHAR(50) NULL,
          resource_id VARCHAR(50) NULL,
          old_value JSON NULL,
          new_value JSON NULL,
          ip_address VARCHAR(45) NULL,
          user_agent VARCHAR(500) NULL,
          request_id VARCHAR(50) NULL,
          metadata JSON NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_action (action),
          INDEX idx_user_id (user_id),
          INDEX idx_resource (resource_type, resource_id),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      this.initialized = true;
      logger.info('Audit log table initialized');
    } catch (error) {
      logger.error('Failed to initialize audit log table', { error: error.message });
      // Não falhar se não conseguir criar tabela - usar apenas logging
    }
  }

  /**
   * Registra uma ação no audit log
   * @param {Object} params - Parâmetros do log
   */
  async log(params) {
    const {
      action,
      userId,
      userName,
      resourceType,
      resourceId,
      oldValue,
      newValue,
      req,
      metadata
    } = params;

    // Log estruturado sempre (mesmo se falhar no banco)
    const logEntry = {
      action,
      userId,
      userName,
      resourceType,
      resourceId,
      ip: req?.ip,
      requestId: req?.requestId,
      metadata
    };

    logger.info(`Audit: ${action}`, logEntry);

    // Tentar salvar no banco
    try {
      await this.initialize();

      const db = getDatabase();
      await db.execute(
        `INSERT INTO ${this.tableName} 
         (action, user_id, user_name, resource_type, resource_id, old_value, new_value, ip_address, user_agent, request_id, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          action,
          userId || null,
          userName || null,
          resourceType || null,
          resourceId?.toString() || null,
          oldValue ? JSON.stringify(oldValue) : null,
          newValue ? JSON.stringify(newValue) : null,
          req?.ip || null,
          req?.get?.('User-Agent')?.substring(0, 500) || null,
          req?.requestId || null,
          metadata ? JSON.stringify(metadata) : null
        ]
      );
    } catch (error) {
      // Não falhar a operação principal se o audit log falhar
      logger.error('Failed to save audit log', {
        error: error.message,
        action,
        resourceType,
        resourceId
      });
    }
  }

  /**
   * Atalhos para ações comuns
   */
  async logLogin(userId, userName, req, success = true) {
    await this.log({
      action: success ? AuditAction.LOGIN : AuditAction.LOGIN_FAILED,
      userId,
      userName,
      resourceType: 'auth',
      resourceId: userId,
      req,
      metadata: { success }
    });
  }

  async logLeadCreate(leadId, userId, userName, req, leadData) {
    await this.log({
      action: AuditAction.LEAD_CREATE,
      userId,
      userName,
      resourceType: 'lead',
      resourceId: leadId,
      newValue: leadData,
      req
    });
  }

  async logLeadUpdate(leadId, userId, userName, req, oldData, newData) {
    await this.log({
      action: AuditAction.LEAD_UPDATE,
      userId,
      userName,
      resourceType: 'lead',
      resourceId: leadId,
      oldValue: oldData,
      newValue: newData,
      req
    });
  }

  async logLeadDelete(leadId, userId, userName, req, leadData) {
    await this.log({
      action: AuditAction.LEAD_DELETE,
      userId,
      userName,
      resourceType: 'lead',
      resourceId: leadId,
      oldValue: leadData,
      req
    });
  }

  async logLeadConvert(leadId, orderId, userId, userName, req) {
    await this.log({
      action: AuditAction.LEAD_CONVERT,
      userId,
      userName,
      resourceType: 'lead',
      resourceId: leadId,
      req,
      metadata: { orderId }
    });
  }

  async logOrderCreate(orderId, userId, userName, req, orderData) {
    await this.log({
      action: AuditAction.ORDER_CREATE,
      userId,
      userName,
      resourceType: 'order',
      resourceId: orderId,
      newValue: orderData,
      req
    });
  }

  async logEvent(action, userId, userName, description, req, metadata = {}) {
    await this.log({
      action,
      userId,
      userName,
      resourceType: 'system_event',
      resourceId: null,
      req,
      metadata: { ...metadata, description }
    });
  }

  /**
   * Busca logs de auditoria
   * @param {Object} filters - Filtros de busca
   */
  async findLogs(filters = {}) {
    try {
      await this.initialize();

      const db = getDatabase();
      let query = `SELECT * FROM ${this.tableName} WHERE 1=1`;
      const params = [];

      if (filters.action) {
        query += ' AND action = ?';
        params.push(filters.action);
      }

      if (filters.userId) {
        query += ' AND user_id = ?';
        params.push(filters.userId);
      }

      if (filters.resourceType) {
        query += ' AND resource_type = ?';
        params.push(filters.resourceType);
      }

      if (filters.resourceId) {
        query += ' AND resource_id = ?';
        params.push(filters.resourceId);
      }

      if (filters.dateFrom) {
        query += ' AND created_at >= ?';
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        query += ' AND created_at <= ?';
        params.push(filters.dateTo);
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      logger.error('Failed to fetch audit logs', { error: error.message });
      return [];
    }
  }
}

// Singleton
export const auditLog = new AuditLogService();

export default auditLog;
