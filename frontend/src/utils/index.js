/**
 * Utilitários do frontend
 * 
 * Uso:
 * import { formatCurrency, formatDate, getPaymentTypeLabel } from '../utils'
 */

export {
  formatDate,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatCNPJ,
  formatCPF,
  formatPhone,
  formatCEP,
  truncateText
} from './formatters'

export {
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
} from './constants'
