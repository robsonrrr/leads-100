/**
 * WhatsApp v2.0 - EmptyState Component
 * Estado vazio consistente
 */

import React from 'react'
import { Box, Typography } from '@mui/material'
import {
    WhatsApp as WhatsAppIcon,
    Chat as ChatIcon,
    Person as PersonIcon,
} from '@mui/icons-material'
import { CHAT_BACKGROUND } from '../../utils/constants'

const ICONS = {
    whatsapp: WhatsAppIcon,
    chat: ChatIcon,
    person: PersonIcon,
}

/**
 * Componente de estado vazio
 */
export function EmptyState({
    title = 'Nenhum item encontrado',
    subtitle = null,
    icon = 'whatsapp',
    height = 400,
    showBackground = true,
}) {
    const IconComponent = ICONS[icon] || WhatsAppIcon

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height,
                bgcolor: showBackground ? CHAT_BACKGROUND.bg : 'transparent',
                backgroundImage: showBackground ? CHAT_BACKGROUND.pattern : 'none',
            }}
        >
            <IconComponent
                sx={{
                    fontSize: 64,
                    color: '#ccc',
                    mb: 2,
                }}
            />
            <Typography variant="body1" color="text.secondary" fontWeight="medium">
                {title}
            </Typography>
            {subtitle && (
                <Typography variant="caption" color="text.secondary" mt={0.5}>
                    {subtitle}
                </Typography>
            )}
        </Box>
    )
}

export default EmptyState
