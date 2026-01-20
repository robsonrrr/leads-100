/**
 * WhatsApp v2.0 - Context Provider
 * Provedor de contexto com estado centralizado
 */

import React, { createContext, useContext, useReducer, useRef, useCallback, useMemo } from 'react'
import { whatsappReducer, initialState, ACTIONS } from './whatsappReducer'

// Criar contexto
const WhatsAppContext = createContext(null)

/**
 * Provider do WhatsApp
 * Envolve a aplicação e fornece estado + dispatch
 */
export function WhatsAppProvider({ children }) {
    const [state, dispatch] = useReducer(whatsappReducer, initialState)

    // Refs para controle de requisições (evitar race conditions)
    const abortControllersRef = useRef({
        contacts: null,
        conversations: null,
        messages: null,
        stats: null,
    })

    // Rastrear IDs atuais para evitar stale closures
    const currentIdsRef = useRef({
        contactPhone: null,
        sessionId: null,
    })

    /**
     * Cancela uma requisição específica
     */
    const cancelRequest = useCallback((key) => {
        if (abortControllersRef.current[key]) {
            abortControllersRef.current[key].abort()
            abortControllersRef.current[key] = null
        }
    }, [])

    /**
     * Cria um novo AbortController para uma requisição
     * Cancela automaticamente a requisição anterior do mesmo tipo
     */
    const createAbortController = useCallback((key) => {
        cancelRequest(key)
        const controller = new AbortController()
        abortControllersRef.current[key] = controller
        return controller
    }, [cancelRequest])

    /**
     * Verifica se a requisição ainda é válida (não foi cancelada e ID ainda é atual)
     */
    const isRequestValid = useCallback((key, expectedId) => {
        const controller = abortControllersRef.current[key]
        if (!controller || controller.signal.aborted) return false

        // Verificar se o ID esperado ainda é o atual
        switch (key) {
            case 'conversations':
            case 'stats':
                return expectedId === currentIdsRef.current.contactPhone
            case 'messages':
                return expectedId === currentIdsRef.current.sessionId
            default:
                return true
        }
    }, [])

    /**
     * Atualiza os IDs atuais (chamado quando seleção muda)
     */
    const setCurrentIds = useCallback((ids) => {
        currentIdsRef.current = {
            ...currentIdsRef.current,
            ...ids,
        }
    }, [])

    /**
     * Cancela todas as requisições pendentes
     */
    const cancelAllRequests = useCallback(() => {
        Object.keys(abortControllersRef.current).forEach(key => {
            cancelRequest(key)
        })
    }, [cancelRequest])

    // Memoizar o valor do contexto para evitar re-renders desnecessários
    const contextValue = useMemo(() => ({
        state,
        dispatch,
        // Helpers para controle de requisições
        createAbortController,
        cancelRequest,
        cancelAllRequests,
        isRequestValid,
        setCurrentIds,
        currentIdsRef,
        abortControllersRef,
    }), [
        state,
        createAbortController,
        cancelRequest,
        cancelAllRequests,
        isRequestValid,
        setCurrentIds,
    ])

    return (
        <WhatsAppContext.Provider value={contextValue}>
            {children}
        </WhatsAppContext.Provider>
    )
}

/**
 * Hook para consumir o contexto do WhatsApp
 * @throws {Error} Se usado fora do WhatsAppProvider
 */
export function useWhatsAppContext() {
    const context = useContext(WhatsAppContext)
    if (!context) {
        throw new Error('useWhatsAppContext must be used within a WhatsAppProvider')
    }
    return context
}

// Exportar ACTIONS para uso nos hooks
export { ACTIONS }
