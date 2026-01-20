/**
 * WhatsApp v2.0 - ErrorState Component
 * Estado de erro consistente
 */

import React from 'react'
import { Box, Typography, Button, Alert } from '@mui/material'
import { Refresh as RefreshIcon, Error as ErrorIcon } from '@mui/icons-material'

/**
 * Componente de estado de erro
 */
export function ErrorState({
    message = 'Ocorreu um erro',
    details = null,
    onRetry = null,
    height = 400,
    severity = 'error',
}) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height,
                p: 3,
            }}
        >
            <Alert
                severity={severity}
                icon={<ErrorIcon />}
                sx={{ mb: 2, maxWidth: 400 }}
            >
                <Typography variant="body2" fontWeight="medium">
                    {message}
                </Typography>
                {details && (
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                        {details}
                    </Typography>
                )}
            </Alert>

            {onRetry && (
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={onRetry}
                    size="small"
                >
                    Tentar novamente
                </Button>
            )}
        </Box>
    )
}

export default ErrorState
