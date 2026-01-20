/**
 * WhatsApp v2.0 - Formatters
 * Funções utilitárias de formatação
 */

/**
 * Formata timestamp para exibição no chat
 * @param {string|Date} dateStr - Data a formatar
 * @returns {string} Data formatada
 */
export function formatTimestamp(dateStr) {
    if (!dateStr) return ''

    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / 86400000)

    // Hoje - só hora
    if (diffDays === 0) {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

    // Ontem
    if (diffDays === 1) {
        return `Ontem ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    }

    // Esta semana
    if (diffDays < 7) {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
        return `${days[date.getDay()]} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    }

    // Mais antigo
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

/**
 * Formata data para separador de chat
 * @param {string|Date} dateStr - Data a formatar
 * @returns {string} Data formatada por extenso
 */
export function formatDateSeparator(dateStr) {
    if (!dateStr) return ''

    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffDays === 0) return 'Hoje'
    if (diffDays === 1) return 'Ontem'

    return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
}

/**
 * Formata telefone para exibição (BR)
 * @param {string} phone - Telefone (só números)
 * @returns {string} Telefone formatado
 */
export function formatPhone(phone) {
    if (!phone) return ''

    // Remove não-numéricos
    const clean = phone.replace(/\D/g, '')

    // Formato brasileiro
    if (clean.length === 13) {
        // +55 11 99999-9999
        return `+${clean.slice(0, 2)} (${clean.slice(2, 4)}) ${clean.slice(4, 9)}-${clean.slice(9)}`
    }

    if (clean.length === 11) {
        // (11) 99999-9999
        return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`
    }

    return phone
}

/**
 * Formata duração de áudio em MM:SS
 * @param {number} seconds - Duração em segundos
 * @returns {string} Duração formatada
 */
export function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Formata tempo relativo (há X minutos)
 * @param {string|Date} dateStr - Data
 * @returns {string} Tempo relativo
 */
export function formatRelativeTime(dateStr) {
    if (!dateStr) return ''

    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMinutes < 1) return 'Agora'
    if (diffMinutes < 60) return `Há ${diffMinutes} min`
    if (diffHours < 24) return `Há ${diffHours}h`
    if (diffDays < 7) return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`

    return date.toLocaleDateString('pt-BR')
}

/**
 * Trunca texto com ellipsis
 * @param {string} text - Texto original
 * @param {number} maxLength - Tamanho máximo
 * @returns {string} Texto truncado
 */
export function truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text
    return text.slice(0, maxLength - 3) + '...'
}
