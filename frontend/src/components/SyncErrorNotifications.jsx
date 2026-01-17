/**
 * Componente para exibir notificações de erros de sincronização
 * Escuta eventos do syncService e mostra alertas ao usuário
 */

import { useState, useEffect, useCallback } from 'react'
import {
    Snackbar,
    Alert,
    AlertTitle,
    IconButton,
    Button,
    Box,
    Typography,
    Collapse,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper
} from '@mui/material'
import {
    Close as CloseIcon,
    ErrorOutline as ErrorIcon,
    Warning as WarningIcon,
    Sync as SyncIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
    Refresh as RetryIcon
} from '@mui/icons-material'
import { syncService } from '../services/syncService'
import { sqliteService } from '../services/sqliteService'

const MAX_VISIBLE_ERRORS = 5

export default function SyncErrorNotifications() {
    const [errors, setErrors] = useState([])
    const [showDetails, setShowDetails] = useState(false)
    const [failedItems, setFailedItems] = useState([])

    // Adicionar erro à lista
    const addError = useCallback((error) => {
        const newError = {
            id: Date.now(),
            message: error.message || error,
            timestamp: new Date(),
            type: error.type || 'sync'
        }
        setErrors(prev => [newError, ...prev].slice(0, 10)) // Manter últimos 10
    }, [])

    // Remover erro da lista
    const removeError = useCallback((id) => {
        setErrors(prev => prev.filter(e => e.id !== id))
    }, [])

    // Limpar todos os erros
    const clearAllErrors = useCallback(() => {
        setErrors([])
    }, [])

    // Carregar itens com erro de sync do SQLite
    const loadFailedItems = useCallback(async () => {
        try {
            const logs = await sqliteService.getErrorLogs()
            setFailedItems(logs.slice(0, 10))
        } catch (err) {
            console.error('Erro ao carregar logs:', err)
        }
    }, [])

    // Escutar eventos de sync
    useEffect(() => {
        const unsubscribe = syncService.addListener((event, data) => {
            switch (event) {
                case 'sync:error':
                    addError({
                        message: data.error || 'Erro na sincronização',
                        type: 'sync'
                    })
                    loadFailedItems()
                    break
                case 'queue:error':
                    addError({
                        message: `Falha ao sincronizar: ${data.entity} ${data.action}`,
                        type: 'queue'
                    })
                    loadFailedItems()
                    break
                case 'sync:complete':
                    // Limpar erros após sync bem sucedida
                    if (data.hasErrors === false) {
                        clearAllErrors()
                    }
                    break
            }
        })

        // Carregar erros existentes
        loadFailedItems()

        return () => unsubscribe()
    }, [addError, clearAllErrors, loadFailedItems])

    // Tentar novamente os itens com erro
    const handleRetry = async () => {
        try {
            await syncService.forceSync()
            loadFailedItems()
        } catch (err) {
            addError({ message: 'Falha ao tentar novamente' })
        }
    }

    // Se não há erros, não renderiza nada
    if (errors.length === 0 && failedItems.length === 0) {
        return null
    }

    // Mostrar primeiro erro como Snackbar
    const currentError = errors[0]

    return (
        <>
            {/* Snackbar para erro atual */}
            {currentError && (
                <Snackbar
                    open={true}
                    autoHideDuration={10000}
                    onClose={() => removeError(currentError.id)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                >
                    <Alert
                        severity="error"
                        variant="filled"
                        onClose={() => removeError(currentError.id)}
                        action={
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Button
                                    color="inherit"
                                    size="small"
                                    onClick={handleRetry}
                                    startIcon={<RetryIcon />}
                                >
                                    Tentar novamente
                                </Button>
                                <IconButton
                                    size="small"
                                    color="inherit"
                                    onClick={() => removeError(currentError.id)}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        }
                        sx={{ minWidth: 350 }}
                    >
                        <AlertTitle>Erro de Sincronização</AlertTitle>
                        {currentError.message}
                        {errors.length > 1 && (
                            <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.8 }}>
                                + {errors.length - 1} outros erros
                            </Typography>
                        )}
                    </Alert>
                </Snackbar>
            )}

            {/* Banner persistente para itens pendentes com erro */}
            {failedItems.length > 0 && (
                <Paper
                    elevation={3}
                    sx={{
                        position: 'fixed',
                        bottom: 16,
                        right: 16,
                        maxWidth: 400,
                        zIndex: 1000,
                        overflow: 'hidden'
                    }}
                >
                    <Box
                        sx={{
                            bgcolor: 'warning.main',
                            color: 'warning.contrastText',
                            px: 2,
                            py: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                        }}
                        onClick={() => setShowDetails(!showDetails)}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WarningIcon />
                            <Typography variant="subtitle2" fontWeight={700}>
                                {failedItems.length} itens com erro de sync
                            </Typography>
                        </Box>
                        <IconButton size="small" color="inherit">
                            {showDetails ? <CollapseIcon /> : <ExpandIcon />}
                        </IconButton>
                    </Box>

                    <Collapse in={showDetails}>
                        <Box sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                            <List dense>
                                {failedItems.slice(0, MAX_VISIBLE_ERRORS).map((item, index) => (
                                    <ListItem key={index} sx={{ px: 0 }}>
                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                            <ErrorIcon color="error" fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.message || item.error}
                                            secondary={new Date(item.timestamp).toLocaleString('pt-BR')}
                                            primaryTypographyProps={{ variant: 'body2' }}
                                            secondaryTypographyProps={{ variant: 'caption' }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                            {failedItems.length > MAX_VISIBLE_ERRORS && (
                                <Typography variant="caption" color="text.secondary">
                                    + {failedItems.length - MAX_VISIBLE_ERRORS} mais erros
                                </Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={<RetryIcon />}
                                    onClick={handleRetry}
                                >
                                    Tentar Novamente
                                </Button>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={async () => {
                                        await sqliteService.clearErrorLogs()
                                        setFailedItems([])
                                    }}
                                >
                                    Limpar
                                </Button>
                            </Box>
                        </Box>
                    </Collapse>
                </Paper>
            )}
        </>
    )
}
