/**
 * Indicador de status de cache/sincronização
 */

import { useState, useEffect } from 'react'
import {
    Box,
    Chip,
    Tooltip,
    Badge,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Typography,
    Divider,
    LinearProgress,
    Button
} from '@mui/material'
import {
    CloudOff as OfflineIcon,
    CloudDone as OnlineIcon,
    Sync as SyncIcon,
    Storage as StorageIcon,
    Delete as DeleteIcon,
    Info as InfoIcon
} from '@mui/icons-material'
import { sqliteService } from '../services/sqliteService'
import { syncService } from '../services/syncService'

export default function CacheStatusIndicator() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine)
    const [stats, setStats] = useState({ products: 0, customers: 0, pendingSync: 0 })
    const [syncing, setSyncing] = useState(false)
    const [anchorEl, setAnchorEl] = useState(null)

    // Monitorar online/offline
    useEffect(() => {
        const handleOnline = () => setIsOffline(false)
        const handleOffline = () => setIsOffline(true)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    // Carregar estatísticas do cache
    useEffect(() => {
        const loadStats = async () => {
            try {
                const s = await sqliteService.getStats()
                setStats(s)
            } catch (err) {
                console.error('Erro ao carregar stats:', err)
            }
        }

        loadStats()
        const interval = setInterval(loadStats, 30000) // Atualizar a cada 30s

        // Listener de eventos de sync
        const unsubscribe = syncService.addListener((event, data) => {
            if (event === 'sync:start') {
                setSyncing(true)
            } else if (event === 'sync:complete' || event === 'sync:error') {
                setSyncing(false)
                loadStats()
            }
        })

        return () => {
            clearInterval(interval)
            unsubscribe()
        }
    }, [])

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleSync = async () => {
        setSyncing(true)
        try {
            await syncService.forceSync()
            const s = await sqliteService.getStats()
            setStats(s)
        } catch (err) {
            console.error('Erro no sync:', err)
        } finally {
            setSyncing(false)
        }
    }

    const handleClearCache = async () => {
        if (window.confirm('Limpar todo o cache local? Isso não afeta os dados no servidor.')) {
            await sqliteService.clearCache()
            const s = await sqliteService.getStats()
            setStats(s)
            handleClose()
        }
    }

    return (
        <>
            <Tooltip title={isOffline ? 'Modo Offline - Usando cache local' : 'Online - Dados sincronizados'}>
                <Badge
                    badgeContent={stats.pendingSync > 0 ? stats.pendingSync : null}
                    color="warning"
                    max={99}
                >
                    <Chip
                        icon={isOffline ? <OfflineIcon /> : <OnlineIcon />}
                        label={isOffline ? 'Offline' : 'Online'}
                        color={isOffline ? 'warning' : 'success'}
                        size="small"
                        variant={isOffline ? 'filled' : 'outlined'}
                        onClick={handleClick}
                        sx={{ cursor: 'pointer' }}
                    />
                </Badge>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                    sx: { minWidth: 280 }
                }}
            >
                <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Cache Local
                    </Typography>
                </Box>

                <Divider />

                <MenuItem disabled>
                    <ListItemIcon>
                        <StorageIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Produtos em cache"
                        secondary={stats.products.toLocaleString()}
                    />
                </MenuItem>

                <MenuItem disabled>
                    <ListItemIcon>
                        <StorageIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Clientes em cache"
                        secondary={stats.customers.toLocaleString()}
                    />
                </MenuItem>

                {stats.pendingSync > 0 && (
                    <MenuItem disabled>
                        <ListItemIcon>
                            <SyncIcon fontSize="small" color="warning" />
                        </ListItemIcon>
                        <ListItemText
                            primary="Pendentes de sync"
                            secondary={stats.pendingSync}
                        />
                    </MenuItem>
                )}

                <Divider />

                <MenuItem disabled>
                    <ListItemIcon>
                        <InfoIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Schema Version"
                        secondary={`v${stats.schemaVersion}`}
                    />
                </MenuItem>

                <Divider />

                {syncing ? (
                    <Box sx={{ px: 2, py: 1 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Sincronizando...
                        </Typography>
                        <LinearProgress />
                    </Box>
                ) : (
                    <>
                        <MenuItem onClick={handleSync} disabled={isOffline}>
                            <ListItemIcon>
                                <SyncIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Sincronizar agora" />
                        </MenuItem>

                        <MenuItem onClick={handleClearCache}>
                            <ListItemIcon>
                                <DeleteIcon fontSize="small" color="error" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Limpar cache"
                                primaryTypographyProps={{ color: 'error' }}
                            />
                        </MenuItem>
                    </>
                )}
            </Menu>
        </>
    )
}
