import { useState, useEffect } from 'react'
import {
    Box,
    Paper,
    Typography,
    Skeleton,
    Chip,
    Collapse,
    IconButton,
    Avatar,
    useTheme,
    alpha,
    Tooltip
} from '@mui/material'
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
    TimelineOppositeContent
} from '@mui/lab'
import {
    AddCircle as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CheckCircle as ConvertIcon,
    ShoppingCart as CartIcon,
    AddShoppingCart as AddCartIcon,
    RemoveShoppingCart as RemoveCartIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    History as HistoryIcon,
    ArrowForward as ArrowIcon
} from '@mui/icons-material'
import { leadsService } from '../services/api'
import { formatDate } from '../utils'

// Mapeamento de ícones
const iconMap = {
    'add_circle': AddIcon,
    'edit': EditIcon,
    'delete': DeleteIcon,
    'check_circle': ConvertIcon,
    'shopping_cart': CartIcon,
    'add_shopping_cart': AddCartIcon,
    'remove_shopping_cart': RemoveCartIcon,
    'info': HistoryIcon
}

// Cores por tipo de ação
const colorMap = {
    'success': 'success',
    'primary': 'primary',
    'error': 'error',
    'warning': 'warning',
    'info': 'info',
    'default': 'grey'
}

export default function LeadHistoryTimeline({ leadId }) {
    const theme = useTheme()
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [expandedItems, setExpandedItems] = useState({})

    useEffect(() => {
        if (leadId) loadHistory()
    }, [leadId])

    const loadHistory = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await leadsService.getHistory(leadId)
            if (response.data.success) {
                setHistory(response.data.data)
            }
        } catch (err) {
            console.error('Erro ao carregar histórico:', err)
            setError('Não foi possível carregar o histórico')
        } finally {
            setLoading(false)
        }
    }

    const toggleExpand = (id) => {
        setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const formatTime = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

    const formatDateTime = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatValue = (value) => {
        if (value === null || value === undefined) return '-'
        if (typeof value === 'object') return JSON.stringify(value)
        return String(value)
    }

    if (loading) {
        return (
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon /> Histórico
                </Typography>
                {[1, 2, 3].map(i => (
                    <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Skeleton variant="circular" width={40} height={40} />
                        <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width="60%" />
                            <Skeleton variant="text" width="40%" />
                        </Box>
                    </Box>
                ))}
            </Paper>
        )
    }

    if (error) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error">{error}</Typography>
            </Paper>
        )
    }

    if (history.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography color="text.secondary">
                    Nenhum registro de histórico encontrado
                </Typography>
            </Paper>
        )
    }

    return (
        <Paper
            sx={{
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${theme.palette.background.paper} 100%)`
            }}
        >
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <HistoryIcon color="primary" />
                Histórico de Alterações
                <Chip label={`${history.length} registros`} size="small" sx={{ ml: 1 }} />
            </Typography>

            <Timeline position="right" sx={{ p: 0, m: 0 }}>
                {history.map((item, index) => {
                    const IconComponent = iconMap[item.icon] || HistoryIcon
                    const isExpanded = expandedItems[item.id]
                    const isLast = index === history.length - 1

                    return (
                        <TimelineItem key={item.id}>
                            <TimelineOppositeContent
                                sx={{
                                    flex: 0.2,
                                    minWidth: 100,
                                    display: { xs: 'none', sm: 'block' }
                                }}
                            >
                                <Typography variant="caption" color="text.secondary">
                                    {formatDate(item.createdAt)}
                                </Typography>
                                <Typography variant="caption" display="block" color="text.secondary">
                                    {formatTime(item.createdAt)}
                                </Typography>
                            </TimelineOppositeContent>

                            <TimelineSeparator>
                                <TimelineDot color={colorMap[item.color] || 'grey'} sx={{ boxShadow: 2 }}>
                                    <IconComponent fontSize="small" />
                                </TimelineDot>
                                {!isLast && <TimelineConnector sx={{ bgcolor: alpha(theme.palette.primary.main, 0.2) }} />}
                            </TimelineSeparator>

                            <TimelineContent sx={{ py: 1.5, px: 2 }}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        borderColor: alpha(theme.palette[colorMap[item.color] || 'grey'].main, 0.3),
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: theme.palette[colorMap[item.color] || 'grey'].main,
                                            boxShadow: 1
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight="bold">
                                                {item.label}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                <Tooltip title={item.userName || 'Sistema'}>
                                                    <Avatar
                                                        sx={{
                                                            width: 20,
                                                            height: 20,
                                                            fontSize: '0.7rem',
                                                            bgcolor: theme.palette.primary.main
                                                        }}
                                                    >
                                                        {(item.userName || 'S')[0].toUpperCase()}
                                                    </Avatar>
                                                </Tooltip>
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.userName || 'Sistema'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'block', sm: 'none' } }}>
                                                    • {formatDateTime(item.createdAt)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        {item.hasDetails && (
                                            <IconButton
                                                size="small"
                                                onClick={() => toggleExpand(item.id)}
                                                sx={{ ml: 1 }}
                                            >
                                                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            </IconButton>
                                        )}
                                    </Box>

                                    {/* Detalhes expandidos */}
                                    <Collapse in={isExpanded}>
                                        <Box sx={{ mt: 2, pt: 2, borderTop: `1px dashed ${theme.palette.divider}` }}>
                                            {item.changes && item.changes.length > 0 && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" fontWeight="bold" gutterBottom display="block">
                                                        Alterações:
                                                    </Typography>
                                                    {item.changes.map((change, idx) => (
                                                        <Box
                                                            key={idx}
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 1,
                                                                mb: 0.5,
                                                                p: 1,
                                                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                                                borderRadius: 1
                                                            }}
                                                        >
                                                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 100 }}>
                                                                {change.field}:
                                                            </Typography>
                                                            <Chip
                                                                label={formatValue(change.oldValue)}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ textDecoration: 'line-through', opacity: 0.6 }}
                                                            />
                                                            <ArrowIcon fontSize="small" color="primary" />
                                                            <Chip
                                                                label={formatValue(change.newValue)}
                                                                size="small"
                                                                color="primary"
                                                            />
                                                        </Box>
                                                    ))}
                                                </Box>
                                            )}
                                            {item.metadata && (
                                                <Box sx={{ mt: 1 }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                                        Detalhes adicionais:
                                                    </Typography>
                                                    <Typography variant="caption" display="block" sx={{ fontFamily: 'monospace' }}>
                                                        {JSON.stringify(item.metadata, null, 2)}
                                                    </Typography>
                                                </Box>
                                            )}
                                            {item.ipAddress && (
                                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                                    IP: {item.ipAddress}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Collapse>
                                </Paper>
                            </TimelineContent>
                        </TimelineItem>
                    )
                })}
            </Timeline>
        </Paper>
    )
}
