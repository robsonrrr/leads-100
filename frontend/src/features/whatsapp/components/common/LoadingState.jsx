/**
 * WhatsApp v2.0 - LoadingState Component
 * Estado de carregamento consistente
 */

import React from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import { CHAT_BACKGROUND } from '../../utils/constants'

/**
 * Componente de estado de carregamento
 */
export function LoadingState({
    message = 'Carregando...',
    height = 400,
    showBackground = true,
}) {
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
            <CircularProgress
                size={32}
                sx={{ color: '#25D366', mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary">
                {message}
            </Typography>
        </Box>
    )
}

export default LoadingState
