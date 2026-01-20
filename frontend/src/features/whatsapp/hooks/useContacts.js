/**
 * WhatsApp v2.0 - useContacts Hook
 * Hook para gerenciar lista de contatos
 */

import { useCallback, useEffect } from 'react'
import { useWhatsAppContext, ACTIONS } from '../context'
import { whatsappApi } from '../services'

/**
 * Hook para gerenciar contatos do WhatsApp
 */
export function useContacts() {
    const {
        state,
        dispatch,
        createAbortController,
        isRequestValid,
    } = useWhatsAppContext()

    /**
     * Carrega lista de contatos
     * @param {Object} params - Parâmetros de busca
     */
    const loadContacts = useCallback(async (params = {}) => {
        const controller = createAbortController('contacts')

        dispatch({ type: ACTIONS.SET_CONTACTS_LOADING, payload: true })

        try {
            const response = await whatsappApi.getContacts(params, controller.signal)

            // Verificar se requisição ainda é válida
            if (!isRequestValid('contacts')) {
                return
            }

            dispatch({
                type: ACTIONS.SET_CONTACTS,
                payload: {
                    // API retorna { success, data, pagination }
                    // Dados estão em response.data (pós axios)
                    // Dentro: { data: [...customers], pagination: {...} }
                    contacts: (response.data || response || []).map(c => ({
                        ...c,
                        // Normalizar campo phone para facilitar acesso
                        phone: c.phone || c.phone_number || c.sender_phone,
                    })),
                    total: response.pagination?.total || response.data?.length || 0,
                },
            })
        } catch (error) {
            if (error.name === 'AbortError' || error.name === 'CanceledError') {
                console.log('Contacts request cancelled')
                return
            }

            dispatch({
                type: ACTIONS.SET_CONTACTS_ERROR,
                payload: error.message || 'Erro ao carregar contatos',
            })
        }
    }, [dispatch, createAbortController, isRequestValid])

    /**
     * Carrega contatos do vendedor logado
     */
    const loadMyContacts = useCallback(async (params = {}) => {
        const controller = createAbortController('contacts')

        dispatch({ type: ACTIONS.SET_CONTACTS_LOADING, payload: true })

        try {
            const response = await whatsappApi.getMyContacts(params, controller.signal)

            if (!isRequestValid('contacts')) {
                return
            }

            dispatch({
                type: ACTIONS.SET_CONTACTS,
                payload: {
                    contacts: (response.data || response || []).map(c => ({
                        ...c,
                        phone: c.phone || c.phone_number || c.sender_phone,
                    })),
                    total: response.pagination?.total || response.data?.length || 0,
                },
            })
        } catch (error) {
            if (error.name === 'AbortError' || error.name === 'CanceledError') {
                return
            }

            dispatch({
                type: ACTIONS.SET_CONTACTS_ERROR,
                payload: error.message || 'Erro ao carregar contatos',
            })
        }
    }, [dispatch, createAbortController, isRequestValid])

    /**
     * Seleciona um contato
     * @param {Object} contact - Contato a selecionar
     */
    const selectContact = useCallback((contact) => {
        dispatch({
            type: ACTIONS.SELECT_CONTACT,
            payload: contact,
        })
    }, [dispatch])

    /**
     * Limpa seleção de contato
     */
    const clearContact = useCallback(() => {
        dispatch({ type: ACTIONS.CLEAR_CONTACT })
    }, [dispatch])

    /**
     * Atualiza filtro de busca
     * @param {string} search - Termo de busca
     */
    const setSearchFilter = useCallback((search) => {
        dispatch({
            type: ACTIONS.SET_FILTER_SEARCH,
            payload: search,
        })
    }, [dispatch])

    /**
     * Atualiza filtro de vendedor
     * @param {number|null} sellerId - ID do vendedor
     */
    const setSellerFilter = useCallback((sellerId) => {
        dispatch({
            type: ACTIONS.SET_FILTER_SELLER,
            payload: sellerId,
        })
    }, [dispatch])

    return {
        contacts: state.contacts,
        loading: state.contactsLoading,
        error: state.contactsError,
        total: state.contactsTotal,
        selectedContact: state.selectedContact,
        filters: state.filters,

        // Actions
        loadContacts,
        loadMyContacts,
        selectContact,
        clearContact,
        setSearchFilter,
        setSellerFilter,
    }
}

export default useContacts
