import { useState, useEffect } from 'react'
import {
    IconButton,
    Badge,
    Menu,
    MenuItem,
    Box,
    Typography,
    Divider,
    Button,
    ListItemIcon,
    ListItemText,
    useTheme,
    alpha,
    Avatar,
    Tooltip
} from '@mui/material'
import {
    Notifications as NotificationsIcon,
    NotificationsActive as ActiveIcon,
    NotificationsOff as OffIcon,
    ShoppingCart as OrderIcon,
    TrendingUp as GoalIcon,
    AccessTime as FollowUpIcon,
    Warning as WarningIcon,
    Settings as SettingsIcon,
    DoneAll as DoneAllIcon,
    Close as CloseIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import notificationService from '../services/notification.service'
import { useToast } from '../contexts/ToastContext'

const ICON_MAP = {
    'ORDER': OrderIcon,
    'GOAL': GoalIcon,
    'FOLLOW_UP': FollowUpIcon,
    'EXCEPTION': WarningIcon,
    'GENERAL': NotificationsIcon
}

const COLOR_MAP = {
    'ORDER': 'info',
    'GOAL': 'success',
    'FOLLOW_UP': 'primary',
    'EXCEPTION': 'error',
    'GENERAL': 'default'
}

export default function NotificationBell() {
    const theme = useTheme()
    const navigate = useNavigate()
    const toast = useToast()

    const [anchorEl, setAnchorEl] = useState(null)
    const [notifications, setNotifications] = useState([])
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [loading, setLoading] = useState(false)

    // Verificar status de inscrição
    useEffect(() => {
        const checkSubscription = async () => {
            if (notificationService.isSupported()) {
                const subscribed = await notificationService.isSubscribed()
                setIsSubscribed(subscribed)
            }
        }
        checkSubscription()
    }, [])

    // Escutar mensagens do service worker
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return

        const handleMessage = (event) => {
            if (event.data && event.data.type === 'PUSH_RECEIVED') {
                // Adicionar notificação à lista
                const newNotification = {
                    id: Date.now(),
                    title: event.data.payload.title,
                    body: event.data.payload.body,
                    url: event.data.payload.url,
                    category: event.data.payload.category || 'GENERAL',
                    timestamp: new Date(),
                    read: false
                }
                setNotifications(prev => [newNotification, ...prev].slice(0, 20))

                // Mostrar toast
                toast.showInfo(newNotification.title, { autoHideDuration: 5000 })
            }
        }

        navigator.serviceWorker.addEventListener('message', handleMessage)
        return () => {
            navigator.serviceWorker.removeEventListener('message', handleMessage)
        }
    }, [])

    const unreadCount = notifications.filter(n => !n.read).length

    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleClickNotification = (notification) => {
        // Marcar como lida
        setNotifications(prev =>
            prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        )

        // Navegar se tiver URL
        if (notification.url && notification.url !== '/') {
            navigate(notification.url)
        }

        handleClose()
    }

    const handleMarkAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }

    const handleClearAll = () => {
        setNotifications([])
    }

    const handleEnableNotifications = async () => {
        setLoading(true)
        try {
            await notificationService.subscribe()
            setIsSubscribed(true)
            toast.showSuccess('Notificações ativadas!')
        } catch (error) {
            toast.showError(error.message || 'Erro ao ativar notificações')
        } finally {
            setLoading(false)
        }
    }

    const formatTime = (date) => {
        const now = new Date()
        const diff = now - date
        const mins = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (mins < 1) return 'Agora'
        if (mins < 60) return `${mins}min`
        if (hours < 24) return `${hours}h`
        return `${days}d`
    }

    return (
        <>
            <Tooltip title={isSubscribed ? 'Notificações' : 'Ativar notificações'}>
                <IconButton
                    onClick={handleOpen}
                    sx={{
                        color: isSubscribed ? 'inherit' : 'text.secondary'
                    }}
                >
                    <Badge
                        badgeContent={unreadCount}
                        color="error"
                        max={9}
                    >
                        {isSubscribed ? <ActiveIcon /> : <NotificationsIcon />}
                    </Badge>
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        width: 360,
                        maxHeight: 480,
                        borderRadius: 2,
                        overflow: 'hidden'
                    }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {/* Header */}
                <Box
                    sx={{
                        p: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        borderBottom: `1px solid ${theme.palette.divider}`
                    }}
                >
                    <Typography variant="h6" fontWeight="bold">
                        Notificações
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {unreadCount > 0 && (
                            <Tooltip title="Marcar todas como lidas">
                                <IconButton size="small" onClick={handleMarkAllRead}>
                                    <DoneAllIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title="Configurações">
                            <IconButton size="small" onClick={() => { handleClose(); navigate('/settings'); }}>
                                <SettingsIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Content */}
                {!isSubscribed ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <OffIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                        <Typography gutterBottom>
                            Notificações desativadas
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                            Ative para receber alertas importantes
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={handleEnableNotifications}
                            disabled={loading}
                            startIcon={<ActiveIcon />}
                        >
                            {loading ? 'Ativando...' : 'Ativar Notificações'}
                        </Button>
                    </Box>
                ) : notifications.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                        <Typography color="text.secondary">
                            Nenhuma notificação
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {notifications.map((notification, idx) => {
                            const Icon = ICON_MAP[notification.category] || NotificationsIcon
                            const color = COLOR_MAP[notification.category] || 'default'

                            return (
                                <Box key={notification.id}>
                                    <MenuItem
                                        onClick={() => handleClickNotification(notification)}
                                        sx={{
                                            py: 1.5,
                                            bgcolor: notification.read ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.primary.main, 0.1)
                                            }
                                        }}
                                    >
                                        <ListItemIcon>
                                            <Avatar
                                                sx={{
                                                    width: 36,
                                                    height: 36,
                                                    bgcolor: alpha(theme.palette[color]?.main || theme.palette.grey[500], 0.2)
                                                }}
                                            >
                                                <Icon color={color} fontSize="small" />
                                            </Avatar>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={notification.read ? 'normal' : 'bold'}
                                                    noWrap
                                                >
                                                    {notification.title}
                                                </Typography>
                                            }
                                            secondary={
                                                <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption" noWrap sx={{ maxWidth: 200 }}>
                                                        {notification.body}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatTime(notification.timestamp)}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </MenuItem>
                                    {idx < notifications.length - 1 && <Divider />}
                                </Box>
                            )
                        })}

                        {/* Footer */}
                        <Box sx={{ p: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
                            <Button
                                fullWidth
                                size="small"
                                onClick={handleClearAll}
                                startIcon={<CloseIcon />}
                            >
                                Limpar Todas
                            </Button>
                        </Box>
                    </>
                )}
            </Menu>
        </>
    )
}
