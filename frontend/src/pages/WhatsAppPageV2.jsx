/**
 * WhatsApp Page v2.0
 * Nova página do WhatsApp com arquitetura refatorada
 * 
 * @version 2.0
 * @date 2026-01-20
 */

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Box, Container, Typography, Breadcrumbs, Link, Chip } from '@mui/material'
import { WhatsApp as WhatsAppIcon, Home as HomeIcon } from '@mui/icons-material'
import { WhatsAppLayout, WhatsAppProvider, useWhatsApp } from '../features/whatsapp'
import api from '../services/api'

/**
 * Componente interno que acessa o contexto
 */
function WhatsAppPageContent({ initialPhone, sellers }) {
    const { selectContact, loadContacts } = useWhatsApp()
    const navigate = useNavigate()

    // Carregar contato inicial via URL
    useEffect(() => {
        if (initialPhone) {
            // Buscar contato pelo telefone e selecionar
            const loadInitialContact = async () => {
                try {
                    const response = await api.get(`/superbot/customers/${initialPhone}`)
                    if (response.data?.data) {
                        selectContact(response.data.data)
                    }
                } catch (error) {
                    console.error('Erro ao carregar contato inicial:', error)
                }
            }
            loadInitialContact()
        }
    }, [initialPhone, selectContact])

    // Handler quando seleciona um contato
    const handleContactSelect = (contact) => {
        // O campo do telefone pode ter nomes diferentes dependendo da API
        const phoneNumber = contact.phone || contact.sender_phone || contact.phone_number
        if (phoneNumber) {
            // Atualizar URL sem recarregar - usar /whatsapp-v2/ para a v2
            navigate(`/whatsapp-v2/${phoneNumber}`, { replace: true })
        }
    }

    return (
        <WhatsAppLayout
            height="calc(100vh - 140px)"
            contactListWidth={380}
            showContactSearch={true}
            showContactFilters={true}
            showConversationHeader={true}
            showSessions={true}
            showAIBadges={true}
            sellers={sellers}
            onContactSelect={handleContactSelect}
        />
    )
}

/**
 * Página principal do WhatsApp v2
 */
function WhatsAppPageV2() {
    const { phone } = useParams()
    const { user } = useSelector((state) => state.auth)
    const [sellers, setSellers] = useState([])

    // Carregar lista de vendedores (para admins)
    useEffect(() => {
        const loadSellers = async () => {
            if (user?.level >= 80) { // Admin
                try {
                    const response = await api.get('/superbot/seller-phones')
                    const sellerList = response.data?.data || []
                    // Extrair usuários únicos
                    const uniqueSellers = sellerList.reduce((acc, item) => {
                        if (item.user_id && !acc.find(s => s.id === item.user_id)) {
                            acc.push({
                                id: item.user_id,
                                name: item.user_name || `Vendedor ${item.user_id}`,
                            })
                        }
                        return acc
                    }, [])
                    setSellers(uniqueSellers)
                } catch (error) {
                    console.error('Erro ao carregar vendedores:', error)
                }
            }
        }
        loadSellers()
    }, [user])

    return (
        <Container maxWidth="xl" sx={{ py: 2 }}>
            {/* Header */}
            <Box sx={{ mb: 2 }}>
                <Breadcrumbs sx={{ mb: 1 }}>
                    <Link
                        underline="hover"
                        color="inherit"
                        href="/"
                        sx={{ display: 'flex', alignItems: 'center' }}
                    >
                        <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
                        Início
                    </Link>
                    <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
                        <WhatsAppIcon sx={{ mr: 0.5, color: '#25D366' }} fontSize="small" />
                        WhatsApp
                    </Typography>
                </Breadcrumbs>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h5" fontWeight="bold">
                        Conversas WhatsApp
                    </Typography>
                    <Chip
                        label="v2.0"
                        size="small"
                        color="success"
                        variant="outlined"
                    />
                </Box>
            </Box>

            {/* Main Content */}
            <WhatsAppProvider>
                <WhatsAppPageContent
                    initialPhone={phone}
                    sellers={sellers}
                />
            </WhatsAppProvider>
        </Container>
    )
}

export default WhatsAppPageV2
