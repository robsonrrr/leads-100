/**
 * Utilitários de formatação para o frontend
 * Centraliza funções de formatação para evitar duplicação
 */

/**
 * Formata uma data para o padrão brasileiro (DD/MM/YYYY)
 * @param {string|Date} dateString - Data a ser formatada
 * @param {Object} options - Opções de formatação
 * @param {boolean} options.includeTime - Se deve incluir horário
 * @returns {string} Data formatada ou '-' se inválida
 */
export function formatDate(dateString, options = {}) {
  if (!dateString) return '-'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'
    
    const formatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...(options.includeTime && {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    return date.toLocaleDateString('pt-BR', formatOptions)
  } catch {
    return '-'
  }
}

/**
 * Formata um valor para moeda brasileira (R$)
 * @param {number|string} value - Valor a ser formatado
 * @param {Object} options - Opções de formatação
 * @param {boolean} options.showSymbol - Se deve mostrar o símbolo R$ (default: true)
 * @returns {string} Valor formatado
 */
export function formatCurrency(value, options = {}) {
  const { showSymbol = true } = options
  
  if (value === null || value === undefined || value === '') {
    return showSymbol ? 'R$ 0,00' : '0,00'
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue)) {
    return showSymbol ? 'R$ 0,00' : '0,00'
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue)
}

/**
 * Formata um número com separador de milhar brasileiro
 * @param {number|string} value - Valor a ser formatado
 * @param {number} decimals - Casas decimais (default: 0)
 * @returns {string} Número formatado
 */
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || value === '') return '0'
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue)) return '0'
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numValue)
}

/**
 * Formata uma porcentagem
 * @param {number|string} value - Valor a ser formatado (0-100)
 * @param {number} decimals - Casas decimais (default: 2)
 * @returns {string} Porcentagem formatada
 */
export function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined || value === '') return '0%'
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue)) return '0%'
  
  return `${formatNumber(numValue, decimals)}%`
}

/**
 * Formata CNPJ: 00.000.000/0000-00
 * @param {string} cnpj - CNPJ sem formatação
 * @returns {string} CNPJ formatado
 */
export function formatCNPJ(cnpj) {
  if (!cnpj) return '-'
  const cleaned = cnpj.replace(/\D/g, '')
  if (cleaned.length !== 14) return cnpj
  return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

/**
 * Formata CPF: 000.000.000-00
 * @param {string} cpf - CPF sem formatação
 * @returns {string} CPF formatado
 */
export function formatCPF(cpf) {
  if (!cpf) return '-'
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11) return cpf
  return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
}

/**
 * Formata telefone brasileiro
 * @param {string} phone - Telefone sem formatação
 * @returns {string} Telefone formatado
 */
export function formatPhone(phone) {
  if (!phone) return '-'
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
  }
  return phone
}

/**
 * Formata CEP: 00000-000
 * @param {string} cep - CEP sem formatação
 * @returns {string} CEP formatado
 */
export function formatCEP(cep) {
  if (!cep) return '-'
  const cleaned = cep.replace(/\D/g, '')
  if (cleaned.length !== 8) return cep
  return cleaned.replace(/^(\d{5})(\d{3})$/, '$1-$2')
}

/**
 * Trunca texto com reticências
 * @param {string} text - Texto a ser truncado
 * @param {number} maxLength - Tamanho máximo
 * @returns {string} Texto truncado
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

export default {
  formatDate,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatCNPJ,
  formatCPF,
  formatPhone,
  formatCEP,
  truncateText
}
