/**
 * WhatsApp v2.0 - Main Layout
 * Layout principal que combina ContactList + Conversation
 */

import React, { useCallback } from 'react'
import { Box, Paper } from '@mui/material'
import { WhatsAppProvider } from '../context'
import { ContactList } from '../components/ContactList/exports'
import { Conversation } from '../components/Conversation/exports'
import { useWhatsApp } from '../hooks'

/**
 * Conteúdo interno (usa o context)
 */
function WhatsAppLayoutInner({
    height = 'calc(100vh - 120px)',
    contactListWidth = 350,
    showContactSearch = true,
    showContactFilters = true,
    showConversationHeader = true,
    showSessions = true,
    showAIBadges = true,
    sellers = [],
    onContactSelect,
    onInfoClick,
}) {
    const { selectedContact, selectContact } = useWhatsApp()

    const handleContactSelect = useCallback((contact) => {
        selectContact(contact)
        onContactSelect?.(contact)
    }, [selectContact, onContactSelect])

    return (
        <Paper
            elevation={3}
            sx={{
                height,
                display: 'flex',
                overflow: 'hidden',
                borderRadius: 2,
            }}
        >
            {/* Contact List */}
            <Box sx={{ width: contactListWidth, flexShrink: 0 }}>
                <ContactList
                    height="100%"
                    showSearch={showContactSearch}
                    showFilters={showContactFilters}
                    sellers={sellers}
                    onContactSelect={handleContactSelect}
                />
            </Box>

            {/* Conversation */}
            <Box sx={{ flex: 1 }}>
                <Conversation
                    contact={selectedContact}
                    height="100%"
                    showHeader={showConversationHeader}
                    showSessions={showSessions}
                    showAIBadges={showAIBadges}
                    onInfoClick={onInfoClick}
                />
            </Box>
        </Paper>
    )
}

/**
 * Layout principal do WhatsApp v2
 * Inclui o Provider automaticamente
 */
function WhatsAppLayout(props) {
    return (
        <WhatsAppProvider>
            <WhatsAppLayoutInner {...props} />
        </WhatsAppProvider>
    )
}

export default WhatsAppLayout
