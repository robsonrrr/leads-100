/**
 * WhatsApp v2.0 - useStats Hook
 * Hook para gerenciar estatísticas do contato
 */

import { useCallback, useEffect } from 'react'
import { useWhatsAppContext, ACTIONS } from '../context'
import { whatsappApi } from '../services'

/**
 * Hook para gerenciar estatísticas do contato
 */
export function useStats() {
    const {
        state,
        dispatch,
        createAbortController,
        isRequestValid,
    } = useWhatsAppContext()

    /**
     * Carrega estatísticas de um contato
     * @param {string} phone - Telefone do contato
     */
    const loadStats = useCallback(async (phone) => {
        if (!phone) return

        const controller = createAbortController('stats')

        try {
            const response = await whatsappApi.getStats(phone, controller.signal)

            // Verificar se requisição ainda é válida
            if (!isRequestValid('stats', phone)) {
                return
            }

            dispatch({
                type: ACTIONS.SET_STATS,
                payload: response.data || response,
            })
        } catch (error) {
            if (error.name === 'AbortError' || error.name === 'CanceledError') {
                return
            }
            // Stats são opcionais, não precisa reportar erro
            console.warn('Erro ao carregar estatísticas:', error)
        }
    }, [dispatch, createAbortController, isRequestValid])

    // Carregar stats quando contato mudar
    useEffect(() => {
        if (state.selectedContact?.phone) {
            loadStats(state.selectedContact.phone)
        }
    }, [state.selectedContact?.phone, loadStats])

    return {
        stats: state.stats,

        // Actions
        loadStats,
    }
}

export default useStats
