/**
 * Constantes compartilhadas do backend
 * Centraliza valores mágicos para evitar duplicação
 */

/**
 * Tipos de pagamento
 */
export const PAYMENT_TYPES = {
  DUPLICATA: 1,
  CHEQUE: 2,
  BOLETO: 3,
  DEPOSITO: 4,
  DINHEIRO: 5,
  CREDIT_CARD_VISA_POS: 6,
  CREDIT_CARD_MASTERCARD: 7,
  CREDIT_CARD_BNDES: 8,
  CREDIT_CARD_AMEX: 9,
  CREDIT_CARD_HIPERCARD: 10,
  DEBIT_CARD_VISA_POS: 11,
  CREDIT_CARD_VISA_WEB: 12,
  NO_PAYMENT: 13,
  PIX: 14,
  MERCADO_PAGO: 15,
  SPECIAL_PAYMENT: 16
};

export const PAYMENT_TYPE_LABELS = {
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
};

/**
 * Tipos de frete
 */
export const FREIGHT_TYPES = {
  CIF: 1,        // Cliente paga
  FOB: 2,        // Emitente paga
  THIRD_PARTY: 3 // Terceiros
};

export const FREIGHT_TYPE_LABELS = {
  1: 'CIF (Cliente paga)',
  2: 'FOB (Emitente paga)',
  3: 'Terceiros'
};

/**
 * Tipos de lead/cart
 */
export const LEAD_TYPES = {
  LEAD: 1,      // Lead/Consulta
  ORDER: 2,     // Pedido convertido
  DELETED: 99   // Deletado (soft delete)
};

export const LEAD_TYPE_LABELS = {
  1: 'Lead/Consulta',
  2: 'Pedido',
  99: 'Deletado'
};

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
};

/**
 * Segmentos de produtos
 */
export const PRODUCT_SEGMENTS = {
  MACHINES: 'machines',
  PARTS: 'parts',
  ACCESSORIES: 'accessories'
};

/**
 * Configuração de paginação padrão
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

/**
 * Naturezas de operação padrão
 */
export const NOP = {
  VENDA: 27,
  DEVOLUCAO: 28,
  REMESSA: 29
};

/**
 * Unidades emitentes padrão
 */
export const EMIT_UNITY = {
  MATRIZ: 1
};

/**
 * Transportadora padrão
 */
export const TRANSPORTER = {
  DEFAULT: 9
};

/**
 * Helper para obter label de tipo de pagamento
 */
export function getPaymentTypeLabel(type) {
  return PAYMENT_TYPE_LABELS[type] || 'Não especificado';
}

/**
 * Helper para obter label de tipo de frete
 */
export function getFreightTypeLabel(type) {
  return FREIGHT_TYPE_LABELS[type] || 'Não especificado';
}

/**
 * Helper para obter label de tipo de lead
 */
export function getLeadTypeLabel(type) {
  return LEAD_TYPE_LABELS[type] || 'Desconhecido';
}

export default {
  PAYMENT_TYPES,
  PAYMENT_TYPE_LABELS,
  FREIGHT_TYPES,
  FREIGHT_TYPE_LABELS,
  LEAD_TYPES,
  LEAD_TYPE_LABELS,
  ORDER_STATUS,
  PRODUCT_SEGMENTS,
  PAGINATION,
  NOP,
  EMIT_UNITY,
  TRANSPORTER,
  getPaymentTypeLabel,
  getFreightTypeLabel,
  getLeadTypeLabel
};
