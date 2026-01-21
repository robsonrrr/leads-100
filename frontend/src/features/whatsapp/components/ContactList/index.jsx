/**
 * WhatsApp v2.0 - ContactList Component
 * 
 * Novo fluxo:
 * 1. Mostrar lista de vendedores (seller_phones)
 * 2. Ao selecionar vendedor, mostrar seus contatos
 * 3. Ao selecionar contato, mostrar conversa
 */

import React, { useEffect, useCallback, useRef, useState } from 'react'
import { Box, Divider, IconButton, Typography, Chip, Avatar, Tooltip } from '@mui/material'
import { ArrowBack as ArrowBackIcon, Person as PersonIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import ContactItem from './ContactItem'
import ContactSearch from './ContactSearch'
import SellerSelector from './SellerSelector'
import { LoadingState, EmptyState, ErrorState } from '../common'
import { useContacts } from '../../hooks'
import api from '../../../../services/api'

/**
 * Lista de contatos do WhatsApp
 * Agora com seleção de vendedor primeiro
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

    // Estado local para vendedor selecionado
    const [selectedSeller, setSelectedSeller] = useState(null)
    const [loadingContacts, setLoadingContacts] = useState(false)
    const [sellerContacts, setSellerContacts] = useState([])
    const [searchTerm, setSearchTerm] = useState('')

    // Quando selecionar um vendedor, buscar seus contatos
    const handleSellerSelect = useCallback(async (seller) => {
        setSelectedSeller(seller)
        setLoadingContacts(true)
        setSellerContacts([])

        try {
            // Buscar contatos desse vendedor (pessoas que conversaram com os telefones do vendedor)
            const sellerPhones = seller.phones.map(p => p.phone_number)

            // Usar a API existente com filtro pelo vendedor
            const response = await api.get('/superbot/customers', {
                params: {
                    sellerPhones: sellerPhones.join(','),
                    limit: 100,
                }
            })

            const customers = response.data?.data || []
            setSellerContacts(customers)
        } catch (err) {
            console.error('Erro ao carregar contatos do vendedor:', err)
            setSellerContacts([])
        } finally {
            setLoadingContacts(false)
        }
    }, [])

    // Voltar para lista de vendedores
    const handleBackToSellers = useCallback(() => {
        setSelectedSeller(null)
        setSellerContacts([])
        setSearchTerm('')
    }, [])

    // Handler de seleção de contato - passa também o vendedor
    const handleContactClick = useCallback((contact) => {
        // Incluir informações do vendedor no contato para filtrar mensagens
        // Nota: adicionamos 'phone' porque o hook useConversations usa state.selectedContact.phone
        const contactWithSeller = {
            ...contact,
            phone: contact.phone_number, // ← Campo usado pelo useConversations
            seller_phones: selectedSeller?.phones?.map(p => p.phone_number) || [],
            seller_name: selectedSeller?.user_name,
        }
        selectContact(contactWithSeller)
        onContactSelect?.(contactWithSeller)
    }, [selectContact, onContactSelect, selectedSeller])

    // Handler de busca
    const handleSearch = useCallback((search) => {
        setSearchTerm(search)
    }, [])

    // Filtrar contatos localmente pela busca
    const filteredContacts = sellerContacts.filter(contact => {
        if (!searchTerm) return true
        const term = searchTerm.toLowerCase()
        return (
            contact.name?.toLowerCase().includes(term) ||
            contact.push_name?.toLowerCase().includes(term) ||
            contact.phone_number?.includes(term)
        )
    })

    // Refresh contatos
    const handleRefresh = useCallback(() => {
        if (selectedSeller) {
            handleSellerSelect(selectedSeller)
        }
    }, [selectedSeller, handleSellerSelect])

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
            {/* Se NÃO tem vendedor selecionado, mostrar lista de vendedores */}
            {!selectedSeller ? (
                <SellerSelector
                    onSellerSelect={handleSellerSelect}
                    selectedSeller={selectedSeller}
                />
            ) : (
                <>
                    {/* Header com vendedor selecionado */}
                    <Box
                        sx={{
                            p: 1.5,
                            bgcolor: '#f0f2f5',
                            borderBottom: '1px solid #e0e0e0',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Tooltip title="Voltar aos vendedores">
                                <IconButton size="small" onClick={handleBackToSellers}>
                                    <ArrowBackIcon />
                                </IconButton>
                            </Tooltip>

                            <Avatar sx={{ bgcolor: '#25D366', width: 32, height: 32 }}>
                                <PersonIcon sx={{ fontSize: 18 }} />
                            </Avatar>

                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" fontWeight="bold">
                                    {selectedSeller.user_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {selectedSeller.phones[0]?.phone_number}
                                </Typography>
                            </Box>

                            <Chip
                                size="small"
                                label={`${filteredContacts.length} contatos`}
                                variant="outlined"
                            />

                            <IconButton size="small" onClick={handleRefresh} disabled={loadingContacts}>
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* Busca de contatos */}
                    {showSearch && (
                        <ContactSearch
                            value={searchTerm}
                            onChange={handleSearch}
                            loading={loadingContacts}
                            placeholder="Buscar contato..."
                        />
                    )}

                    <Divider />

                    {/* Lista de contatos do vendedor */}
                    <Box
                        ref={listRef}
                        sx={{
                            flex: 1,
                            overflowY: 'auto',
                            overflowX: 'hidden',
                        }}
                    >
                        {/* Estado de carregamento */}
                        {loadingContacts && (
                            <LoadingState
                                message={`Carregando contatos de ${selectedSeller.user_name}...`}
                                height={300}
                                showBackground={false}
                            />
                        )}

                        {/* Estado vazio */}
                        {!loadingContacts && filteredContacts.length === 0 && (
                            <EmptyState
                                title={searchTerm ? 'Nenhum contato encontrado' : 'Sem contatos'}
                                subtitle={searchTerm
                                    ? `Nenhum resultado para "${searchTerm}"`
                                    : `${selectedSeller.user_name} não possui conversas`
                                }
                                icon="person"
                                height={300}
                                showBackground={false}
                            />
                        )}

                        {/* Lista de contatos */}
                        {!loadingContacts && filteredContacts.map((contact) => (
                            <ContactItem
                                key={contact.id || contact.phone_number}
                                contact={contact}
                                selected={selectedContact?.phone_number === contact.phone_number}
                                onClick={handleContactClick}
                            />
                        ))}
                    </Box>
                </>
            )}
        </Box>
    )
}

export default ContactList
