/**
 * Constantes compartilhadas do frontend
 * Centraliza valores mágicos para evitar duplicação
 */

/**
 * Tipos de pagamento
 */
export const PAYMENT_TYPES = {
  1: 'Duplicata',
  2: 'Cheque',
  3: 'Boleto',
  4: 'Depósito',
  5: 'Dinheiro',
  6: 'Cartão de Crédito Visa POS (Máquina)',
  7: 'Cartão de Crédito MasterCard',
  8: 'Cartão de Crédito BNDES',
  9: 'Cartão de Crédito American Express',
  10: 'Cartão de Crédito Hipercard',
  11: 'Cartão de Débito Visa POS',
  12: 'Cartão de Crédito Visa WEB',
  13: 'Sem pagamento',
  14: 'PIX',
  15: 'Mercado Pago',
  16: 'Pagamento Especial'
}

/**
 * Tipos de frete
 */
export const FREIGHT_TYPES = {
  1: 'CIF (Cliente paga)',
  2: 'FOB (Emitente paga)',
  3: 'Terceiros'
}

/**
 * Tipos de lead/pedido
 */
export const LEAD_TYPES = {
  1: 'Lead/Consulta',
  2: 'Pedido',
  99: 'Deletado'
}

/**
 * Status de pedido
 */
export const ORDER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
}

/**
 * Labels de status de pedido
 */
export const ORDER_STATUS_LABELS = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado'
}

/**
 * Cores de status de pedido
 */
export const ORDER_STATUS_COLORS = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'default'
}

/**
 * Obtém label do tipo de pagamento
 * @param {number} type - Código do tipo
 * @returns {string} Label
 */
export function getPaymentTypeLabel(type) {
  return PAYMENT_TYPES[type] || 'Não especificado'
}

/**
 * Obtém label do tipo de frete
 * @param {number} type - Código do tipo
 * @returns {string} Label
 */
export function getFreightTypeLabel(type) {
  return FREIGHT_TYPES[type] || 'Não especificado'
}

/**
 * Obtém label do tipo de lead
 * @param {number} type - Código do tipo
 * @returns {string} Label
 */
export function getLeadTypeLabel(type) {
  return LEAD_TYPES[type] || 'Desconhecido'
}

/**
 * Obtém label do status do pedido
 * @param {string} status - Código do status
 * @returns {string} Label
 */
export function getOrderStatusLabel(status) {
  return ORDER_STATUS_LABELS[status] || status
}

/**
 * Obtém cor do status do pedido
 * @param {string} status - Código do status
 * @returns {string} Cor do MUI
 */
export function getOrderStatusColor(status) {
  return ORDER_STATUS_COLORS[status] || 'default'
}

/**
 * Segmentos de produtos
 */
export const PRODUCT_SEGMENTS = {
  machines: 'Máquinas',
  parts: 'Peças',
  accessories: 'Acessórios'
}

/**
 * Configuração de paginação padrão
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  OPTIONS: [10, 20, 50, 100]
}

/**
 * Timeout padrão para requisições (ms)
 */
export const REQUEST_TIMEOUT = 30000

/**
 * Debounce padrão para autocomplete (ms)
 */
export const AUTOCOMPLETE_DEBOUNCE = 300

export default {
  PAYMENT_TYPES,
  FREIGHT_TYPES,
  LEAD_TYPES,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PRODUCT_SEGMENTS,
  PAGINATION,
  REQUEST_TIMEOUT,
  AUTOCOMPLETE_DEBOUNCE,
  getPaymentTypeLabel,
  getFreightTypeLabel,
  getLeadTypeLabel,
  getOrderStatusLabel,
  getOrderStatusColor
}
