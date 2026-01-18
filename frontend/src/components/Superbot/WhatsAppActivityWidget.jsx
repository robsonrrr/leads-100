/**
 * WhatsApp Activity Widget
 * 
 * Widget para exibir atividade recente do WhatsApp no dashboard
 * 
 * @version 1.0
 * @date 2026-01-18
 */

import React, { useState, useEffect } from 'react'
import {
    Box,
    Paper,
    Typography,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
    Chip,
    IconButton,
    Skeleton,
    Tooltip,
    Badge,
    Button,
} from '@mui/material'
import {
    WhatsApp as WhatsAppIcon,
    Person as PersonIcon,
    ArrowForward as ArrowForwardIcon,
    ShoppingCart as ShoppingCartIcon,
    Warning as WarningIcon,
    TrendingUp as TrendingUpIcon,
    Message as MessageIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material'
import { superbotService } from '../../services/superbot.service'

// Cores para intenções
const INTENT_COLORS = {
    QUOTE_REQUEST: 'success',
    PURCHASE_INTENT: 'primary',
    PRICE_CHECK: 'warning',
    COMPLAINT: 'error',
    default: 'default',
}

const INTENT_ICONS = {
    QUOTE_REQUEST: <ShoppingCartIcon fontSize="small" />,
    PURCHASE_INTENT: <TrendingUpIcon fontSize="small" />,
    COMPLAINT: <WarningIcon fontSize="small" />,
    default: <MessageIcon fontSize="small" />,
}

const WhatsAppActivityWidget = ({
    limit = 5,
    onViewConversation = null,
    onCreateLead = null,
}) => {
    const [loading, setLoading] = useState(true)
    const [customers, setCustomers] = useState([])
    const [webhookStatus, setWebhookStatus] = useState(null)

    useEffect(() => {
        loadData()
    }, [limit])

    const loadData = async () => {
        setLoading(true)
        try {
            const [customersRes, statusRes] = await Promise.all([
                superbotService.getCustomers({ limit, page: 1 }),
                superbotService.getWebhookStatus().catch(() => null),
            ])

            setCustomers(customersRes.data?.data || [])
            setWebhookStatus(statusRes?.data?.data)
        } catch (err) {
            console.error('Erro ao carregar atividade WhatsApp:', err)
        } finally {
            setLoading(false)
        }
    }

    const formatLastContact = (date) => {
        if (!date) return 'Nunca'

        const now = new Date()
        const lastContact = new Date(date)
        const diffHours = Math.floor((now - lastContact) / (1000 * 60 * 60))

        if (diffHours < 1) return 'Agora'
        if (diffHours < 24) return `${diffHours}h atrás`

        const diffDays = Math.floor(diffHours / 24)
        if (diffDays === 1) return 'Ontem'
        if (diffDays < 7) return `${diffDays} dias`

        return lastContact.toLocaleDateString('pt-BR')
    }

    const renderSkeleton = () => (
        <List dense>
            {[1, 2, 3, 4, 5].map((i) => (
                <ListItem key={i}>
                    <ListItemAvatar>
                        <Skeleton variant="circular" width={40} height={40} />
                    </ListItemAvatar>
                    <ListItemText
                        primary={<Skeleton width="60%" />}
                        secondary={<Skeleton width="40%" />}
                    />
                </ListItem>
            ))}
        </List>
    )

    return (
        <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Badge
                        overlap="circular"
                        badgeContent={
                            webhookStatus?.status === 'active' ? (
                                <Box
                                    sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        bgcolor: '#4CAF50',
                                    }}
                                />
                            ) : null
                        }
                    >
                        <Avatar sx={{ bgcolor: '#25D366', width: 32, height: 32 }}>
                            <WhatsAppIcon fontSize="small" />
                        </Avatar>
                    </Badge>
                    <Typography variant="h6">WhatsApp</Typography>
                </Box>

                <Tooltip title="Atualizar">
                    <IconButton size="small" onClick={loadData}>
                        <RefreshIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Status */}
            {webhookStatus && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                        size="small"
                        label={webhookStatus.ai_configured ? 'IA Ativa' : 'IA Desativada'}
                        color={webhookStatus.ai_configured ? 'success' : 'default'}
                        variant="outlined"
                    />
                    {webhookStatus.auto_create_leads && (
                        <Chip
                            size="small"
                            label="Auto-Lead"
                            color="primary"
                            variant="outlined"
                            icon={<ShoppingCartIcon fontSize="small" />}
                        />
                    )}
                </Box>
            )}

            {/* Lista de clientes */}
            {loading ? (
                renderSkeleton()
            ) : customers.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                        Nenhuma conversa recente
                    </Typography>
                </Box>
            ) : (
                <List dense sx={{ maxHeight: 300, overflowY: 'auto' }}>
                    {customers.map((customer) => (
                        <ListItem
                            key={customer.id}
                            sx={{
                                borderRadius: 1,
                                mb: 0.5,
                                '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.08)' },
                            }}
                        >
                            <ListItemAvatar>
                                <Badge
                                    overlap="circular"
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    badgeContent={
                                        customer.has_linked_customer ? (
                                            <Box
                                                sx={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: '50%',
                                                    bgcolor: '#2196F3',
                                                    border: '2px solid #fff',
                                                }}
                                            />
                                        ) : null
                                    }
                                >
                                    <Avatar sx={{ bgcolor: '#e0e0e0' }}>
                                        <PersonIcon />
                                    </Avatar>
                                </Badge>
                            </ListItemAvatar>

                            <ListItemText
                                primary={
                                    <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                        {customer.name || customer.push_name || customer.phone_number}
                                    </Typography>
                                }
                                secondary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatLastContact(customer.stats?.last_message_at)}
                                        </Typography>
                                        {customer.stats?.total_messages && (
                                            <Chip
                                                size="small"
                                                label={customer.stats.total_messages}
                                                sx={{ height: 16, fontSize: '0.65rem' }}
                                            />
                                        )}
                                    </Box>
                                }
                            />

                            <ListItemSecondaryAction>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {customer.last_intent && (
                                        <Chip
                                            size="small"
                                            icon={INTENT_ICONS[customer.last_intent] || INTENT_ICONS.default}
                                            color={INTENT_COLORS[customer.last_intent] || INTENT_COLORS.default}
                                            sx={{ height: 20 }}
                                        />
                                    )}

                                    {onViewConversation && (
                                        <IconButton
                                            size="small"
                                            onClick={() => onViewConversation(customer.phone_number)}
                                        >
                                            <ArrowForwardIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            )}

            {/* Footer */}
            {customers.length > 0 && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button
                        size="small"
                        startIcon={<WhatsAppIcon />}
                        onClick={() => onViewConversation?.()}
                    >
                        Ver todas as conversas
                    </Button>
                </Box>
            )}
        </Paper>
    )
}

export default WhatsAppActivityWidget
