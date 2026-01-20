/**
 * WhatsApp v2.0 - ConversationHeader Component
 * Cabeçalho da conversa com info do contato
 */

import React, { memo } from 'react'
import {
    Box,
    Avatar,
    Typography,
    IconButton,
    Badge,
    Chip,
} from '@mui/material'
import {
    WhatsApp as WhatsAppIcon,
    Person as PersonIcon,
    Refresh as RefreshIcon,
    Info as InfoIcon,
    Link as LinkIcon,
} from '@mui/icons-material'
import { formatPhone } from '../../utils/formatters'

/**
 * Cabeçalho da conversa (memoizado)
 */
const ConversationHeader = memo(({
    contact,
    onRefresh,
    onInfoClick,
    loading = false,
}) => {
    if (!contact) return null

    const displayName = contact.name || contact.push_name || formatPhone(contact.phone)
    const hasLinked = contact.has_linked_customer || contact.linked_customer_id

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.5,
                bgcolor: '#075E54',
                color: '#fff',
            }}
        >
            {/* Contact info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                        <WhatsAppIcon sx={{ width: 16, height: 16, color: '#25D366' }} />
                    }
                >
                    <Avatar
                        sx={{ bgcolor: '#25D366', width: 40, height: 40 }}
                        src={contact.profile_picture || contact.avatar}
                    >
                        {displayName?.charAt(0)?.toUpperCase() || <PersonIcon />}
                    </Avatar>
                </Badge>

                <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                        {displayName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {formatPhone(contact.phone)}
                        </Typography>
                        {hasLinked && (
                            <Chip
                                size="small"
                                icon={<LinkIcon fontSize="small" />}
                                label="Vinculado"
                                sx={{
                                    height: 18,
                                    color: '#fff',
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    fontSize: '0.65rem',
                                    '& .MuiChip-icon': {
                                        color: '#fff',
                                        fontSize: 12,
                                    },
                                }}
                            />
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Actions */}
            <Box>
                {onInfoClick && (
                    <IconButton
                        size="small"
                        sx={{ color: '#fff' }}
                        onClick={onInfoClick}
                    >
                        <InfoIcon fontSize="small" />
                    </IconButton>
                )}
                {onRefresh && (
                    <IconButton
                        size="small"
                        sx={{ color: '#fff' }}
                        onClick={onRefresh}
                        disabled={loading}
                    >
                        <RefreshIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>
        </Box>
    )
})

ConversationHeader.displayName = 'ConversationHeader'

export default ConversationHeader
