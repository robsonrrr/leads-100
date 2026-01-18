/**
 * NotificationBell Component
 * 
 * Componente de sino de notificações com dropdown
 * Polling em tempo real para novas notificações
 * 
 * @version 1.0
 * @date 2026-01-18
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
    Badge,
    IconButton,
    Popover,
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    Button,
    Divider,
    CircularProgress,
    Chip,
    Avatar,
} from '@mui/material'
import {
    Notifications as NotificationsIcon,
    WhatsApp as WhatsAppIcon,
    ShoppingCart as ShoppingCartIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    MarkEmailRead as MarkReadIcon,
    Psychology as PsychologyIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

// Cores por tipo de notificação
const NOTIFICATION_COLORS = {
    whatsapp_message: '#25D366',
    whatsapp_purchase_intent: '#FF9800',
    whatsapp_complaint: '#F44336',
    whatsapp_urgent: '#D32F2F',
    lead_created: '#4CAF50',
    lead_converted: '#2196F3',
    system: '#607D8B',
}

// Ícones por tipo de notificação
const NOTIFICATION_ICONS = {
    whatsapp_message: <WhatsAppIcon />,
    whatsapp_purchase_intent: <ShoppingCartIcon />,
    whatsapp_complaint: <WarningIcon />,
    whatsapp_urgent: <WarningIcon />,
    lead_created: <ShoppingCartIcon />,
    lead_converted: <CheckIcon />,
    system: <InfoIcon />,
}

// Intervalo de polling (10 segundos)
const POLL_INTERVAL = 10000

const NotificationBell = () => {
    const navigate = useNavigate()
    const [anchorEl, setAnchorEl] = useState(null)
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const [lastCheck, setLastCheck] = useState(null)
    const pollingRef = useRef(null)

    // Polling para novas notificações
    const pollNotifications = useCallback(async () => {
        try {
            const params = lastCheck ? { last_check: lastCheck } : {}
            const response = await api.get('/notifications/poll', { params })

            if (response.data?.success) {
                const newNotifications = response.data.data || []
                setUnreadCount(response.data.unreadCount || 0)
                setLastCheck(response.data.timestamp)

                // Se recebeu novas notificações, atualizar lista
                if (newNotifications.length > 0) {
                    setNotifications(prev => {
                        const existingIds = new Set(prev.map(n => n.id))
                        const unique = newNotifications.filter(n => !existingIds.has(n.id))
                        return [...unique, ...prev].slice(0, 50)
                    })

                    // Tocar som de notificação (opcional)
                    playNotificationSound()
                }
            }
        } catch (error) {
            // Falha silenciosa para polling
            console.debug('Polling error:', error.message)
        }
    }, [lastCheck])

    // Carregar notificações iniciais
    const loadNotifications = async () => {
        setLoading(true)
        try {
            const response = await api.get('/notifications/list', {
                params: { limit: 20, unread_only: false }
            })

            if (response.data?.success) {
                setNotifications(response.data.data || [])
                setUnreadCount(response.data.unreadCount || 0)
            }
        } catch (error) {
            console.error('Erro ao carregar notificações:', error)
        } finally {
            setLoading(false)
        }
    }

    // Iniciar polling
    useEffect(() => {
        // Carregar inicial
        loadNotifications()

        // Iniciar polling
        pollingRef.current = setInterval(pollNotifications, POLL_INTERVAL)

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current)
            }
        }
    }, [pollNotifications])

    // Marcar como lida
    const markAsRead = async (id) => {
        try {
            await api.post(`/notifications/${id}/read`)
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error('Erro ao marcar como lida:', error)
        }
    }

    // Marcar todas como lidas
    const markAllAsRead = async () => {
        try {
            await api.post('/notifications/read-all')
            setNotifications(prev =>
                prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
            )
            setUnreadCount(0)
        } catch (error) {
            console.error('Erro ao marcar todas como lidas:', error)
        }
    }

    // Tocar som de notificação
    const playNotificationSound = () => {
        try {
            const audio = new Audio('/notification.mp3')
            audio.volume = 0.5
            audio.play().catch(() => { }) // Ignora erro se não puder tocar
        } catch (e) {
            // Ignora
        }
    }

    // Formatar tempo relativo
    const formatTime = (dateStr) => {
        if (!dateStr) return ''

        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'agora'
        if (diffMins < 60) return `${diffMins}min`
        if (diffHours < 24) return `${diffHours}h`
        if (diffDays < 7) return `${diffDays}d`

        return date.toLocaleDateString('pt-BR')
    }

    // Navegar para detalhe
    const handleNotificationClick = (notification) => {
        // Marcar como lida
        if (!notification.read_at) {
            markAsRead(notification.id)
        }

        // Navegar baseado no tipo
        const { data } = notification
        if (data?.phone) {
            navigate(`/whatsapp/${data.phone}`)
        } else if (data?.leadId) {
            navigate(`/leads/${data.leadId}`)
        }

        // Fechar popover
        setAnchorEl(null)
    }

    const open = Boolean(anchorEl)

    return (
        <>
            <IconButton
                color="inherit"
                onClick={(e) => {
                    setAnchorEl(e.currentTarget)
                    if (!notifications.length) loadNotifications()
                }}
                sx={{ mr: 1 }}
            >
                <Badge
                    badgeContent={unreadCount}
                    color="error"
                    max={99}
                >
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        width: 380,
                        maxHeight: 500,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }
                }}
            >
                {/* Header */}
                <Box sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #e0e0e0',
                    bgcolor: '#fafafa'
                }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        Notificações
                    </Typography>
                    {unreadCount > 0 && (
                        <Button
                            size="small"
                            startIcon={<MarkReadIcon />}
                            onClick={markAllAsRead}
                        >
                            Marcar todas como lidas
                        </Button>
                    )}
                </Box>

                {/* Lista de notificações */}
                <Box sx={{ flex: 1, overflowY: 'auto' }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress size={32} />
                        </Box>
                    ) : notifications.length === 0 ? (
                        <Box sx={{ textAlign: 'center', p: 4 }}>
                            <NotificationsIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                            <Typography color="text.secondary">
                                Nenhuma notificação
                            </Typography>
                        </Box>
                    ) : (
                        <List dense disablePadding>
                            {notifications.map((notification, index) => (
                                <React.Fragment key={notification.id}>
                                    <ListItem
                                        button
                                        onClick={() => handleNotificationClick(notification)}
                                        sx={{
                                            bgcolor: notification.read_at ? 'transparent' : 'rgba(25, 118, 210, 0.04)',
                                            '&:hover': {
                                                bgcolor: 'rgba(0,0,0,0.04)'
                                            },
                                            borderLeft: `4px solid ${NOTIFICATION_COLORS[notification.type] || '#607D8B'}`,
                                            py: 1.5
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                            <Avatar
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    bgcolor: `${NOTIFICATION_COLORS[notification.type] || '#607D8B'}20`,
                                                    color: NOTIFICATION_COLORS[notification.type] || '#607D8B'
                                                }}
                                            >
                                                {NOTIFICATION_ICONS[notification.type] || <InfoIcon />}
                                            </Avatar>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={notification.read_at ? 'normal' : 'bold'}
                                                    noWrap
                                                >
                                                    {notification.title}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    {notification.message}
                                                </Typography>
                                            }
                                        />
                                        <ListItemSecondaryAction>
                                            <Typography variant="caption" color="text.secondary">
                                                {formatTime(notification.created_at)}
                                            </Typography>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                    {index < notifications.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </Box>

                {/* Footer */}
                {notifications.length > 0 && (
                    <Box sx={{
                        p: 1,
                        borderTop: '1px solid #e0e0e0',
                        textAlign: 'center'
                    }}>
                        <Button
                            size="small"
                            onClick={() => {
                                navigate('/notifications')
                                setAnchorEl(null)
                            }}
                        >
                            Ver todas
                        </Button>
                    </Box>
                )}
            </Popover>
        </>
    )
}

export default NotificationBell
