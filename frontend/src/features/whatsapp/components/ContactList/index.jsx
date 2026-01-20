/**
 * WhatsApp v2.0 - ContactList Component
 * Lista principal de contatos
 */

import React, { useEffect, useCallback, useRef } from 'react'
import { Box, Divider } from '@mui/material'
import ContactItem from './ContactItem'
import ContactSearch from './ContactSearch'
import ContactFilters from './ContactFilters'
import { LoadingState, EmptyState, ErrorState } from '../common'
import { useContacts } from '../../hooks'

/**
 * Lista de contatos do WhatsApp
 */
function ContactList({
    height = '100%',
    showSearch = true,
    showFilters = true,
    sellers = [],
    onContactSelect,
}) {
    const {
        contacts,
        loading,
        error,
        total,
        selectedContact,
        filters,
        loadContacts,
        loadMyContacts,
        selectContact,
        setSearchFilter,
        setSellerFilter,
    } = useContacts()

    const listRef = useRef(null)
    const isInitialMount = useRef(true)

    // Carregar contatos na montagem
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false
            loadContacts({
                search: filters.search,
                sellerId: filters.sellerId,
            })
        }
    }, [])

    // Recarregar quando filtros mudarem
    useEffect(() => {
        if (!isInitialMount.current) {
            loadContacts({
                search: filters.search,
                sellerId: filters.sellerId,
            })
        }
    }, [filters.search, filters.sellerId, loadContacts])

    // Handler de seleção de contato
    const handleContactClick = useCallback((contact) => {
        selectContact(contact)
        onContactSelect?.(contact)
    }, [selectContact, onContactSelect])

    // Handler de busca
    const handleSearch = useCallback((search) => {
        setSearchFilter(search)
    }, [setSearchFilter])

    // Handler de filtro por vendedor
    const handleSellerChange = useCallback((sellerId) => {
        setSellerFilter(sellerId)
    }, [setSellerFilter])

    // Retry
    const handleRetry = useCallback(() => {
        loadContacts({
            search: filters.search,
            sellerId: filters.sellerId,
        })
    }, [loadContacts, filters])

    return (
        <Box
            sx={{
                height,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#fff',
                borderRight: '1px solid #e0e0e0',
            }}
        >
            {/* Header com busca */}
            {showSearch && (
                <ContactSearch
                    value={filters.search}
                    onChange={handleSearch}
                    loading={loading}
                    placeholder="Buscar por nome ou telefone..."
                />
            )}

            {/* Filtros */}
            {showFilters && (
                <ContactFilters
                    sellers={sellers}
                    selectedSellerId={filters.sellerId}
                    onSellerChange={handleSellerChange}
                    totalContacts={total}
                />
            )}

            <Divider />

            {/* Lista de contatos */}
            <Box
                ref={listRef}
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                }}
            >
                {/* Estado de carregamento inicial */}
                {loading && contacts.length === 0 && (
                    <LoadingState
                        message="Carregando contatos..."
                        height={300}
                        showBackground={false}
                    />
                )}

                {/* Estado de erro */}
                {error && contacts.length === 0 && (
                    <ErrorState
                        message="Erro ao carregar contatos"
                        details={error}
                        onRetry={handleRetry}
                        height={300}
                    />
                )}

                {/* Estado vazio */}
                {!loading && !error && contacts.length === 0 && (
                    <EmptyState
                        title={filters.search ? 'Nenhum contato encontrado' : 'Sem contatos'}
                        subtitle={filters.search ? `Nenhum resultado para "${filters.search}"` : 'Os contatos aparecerão aqui'}
                        icon="person"
                        height={300}
                        showBackground={false}
                    />
                )}

                {/* Lista de contatos */}
                {contacts.map((contact) => (
                    <ContactItem
                        key={contact.id || contact.phone}
                        contact={contact}
                        selected={selectedContact?.phone === contact.phone}
                        onClick={handleContactClick}
                    />
                ))}

                {/* Loading inline ao buscar mais */}
                {loading && contacts.length > 0 && (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <LoadingState
                            message="Carregando..."
                            height={60}
                            showBackground={false}
                        />
                    </Box>
                )}
            </Box>
        </Box>
    )
}

export default ContactList
