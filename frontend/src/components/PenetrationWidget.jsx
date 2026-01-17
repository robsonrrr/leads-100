import { useState, useEffect } from 'react'
import {
    Box,
    Paper,
    Typography,
    CircularProgress,
    Skeleton,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
    IconButton,
    Tooltip,
    LinearProgress,
    Collapse,
    Alert
} from '@mui/material'
import {
    Group as GroupIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    PersonOff as PersonOffIcon,
    Refresh as RefreshIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    EmojiEvents as TrophyIcon
} from '@mui/icons-material'
import { analyticsV2Service } from '../services/api'
import { useManagerFilter } from '../contexts/ManagerFilterContext'

/**
 * PenetrationWidget - Widget de Métricas de Penetração (KPI-mãe)
 * Meta 30.000 Máquinas/Ano
 * 
 * Penetração = Revendas que Compraram no Mês / Total de Revendas na Carteira
 * Meta: >= 2.5 revendas/vendedor/mês
 */
function PenetrationWidget({ sellerId = null, showRanking = true, compact = false }) {
    const { isManager } = useManagerFilter()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [expanded, setExpanded] = useState(!compact)

    useEffect(() => {
        loadData()
    }, [sellerId])

    const loadData = async () => {
        try {
            setLoading(true)
            setError(null)
            const params = sellerId ? { seller_id: sellerId } : {}
            const response = await analyticsV2Service.getPenetration(params)

            if (response.data.success) {
                setData(response.data.data)
            }
        } catch (err) {
            console.error('Erro ao carregar penetração:', err)
            setError('Erro ao carregar métricas de penetração')
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'ON_TARGET': return 'success'
            case 'WARNING': return 'warning'
            case 'CRITICAL': return 'error'
            default: return 'default'
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'ON_TARGET': return <TrendingUpIcon fontSize="small" />
            case 'WARNING': return <TrendingDownIcon fontSize="small" />
            case 'CRITICAL': return <PersonOffIcon fontSize="small" />
            default: return null
        }
    }

    const formatPercent = (value) => {
        return `${(value * 100).toFixed(1)}%`
    }

    if (loading) {
        return (
            <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton variant="text" width="40%" />
                </Box>
                <Skeleton variant="rectangular" height={60} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="60%" />
            </Paper>
        )
    }

    if (error) {
        return (
            <Paper sx={{ p: 2 }}>
                <Alert severity="error" action={
                    <IconButton size="small" onClick={loadData}>
                        <RefreshIcon />
                    </IconButton>
                }>
                    {error}
                </Alert>
            </Paper>
        )
    }

    if (!data) return null

    // Dados para exibição
    const isSingleSeller = !!sellerId || !!data.seller
    const metrics = isSingleSeller ? data.metrics : data.summary
    const penetrationRate = isSingleSeller ? metrics.penetration_rate : metrics.overall_penetration
    const target = metrics.target || 2.5
    const achievementPercent = metrics.achievement_percent || 0

    return (
        <Paper sx={{ p: 2, mb: 2 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupIcon color="primary" />
                    <Typography variant="h6">Penetração Mensal</Typography>
                    <Chip
                        label="KPI-mãe"
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ ml: 1 }}
                    />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label={data.status}
                        size="small"
                        color={getStatusColor(data.status)}
                        icon={getStatusIcon(data.status)}
                    />
                    {!compact && (
                        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    )}
                    <Tooltip title="Atualizar">
                        <IconButton size="small" onClick={loadData}>
                            <RefreshIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Gauge Principal */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, mb: 2 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress
                        variant="determinate"
                        value={Math.min(achievementPercent, 100)}
                        size={100}
                        thickness={8}
                        color={getStatusColor(data.status)}
                    />
                    <Box
                        sx={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            position: 'absolute',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column'
                        }}
                    >
                        <Typography variant="h5" component="div" fontWeight="bold">
                            {penetrationRate.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            meta: {target}
                        </Typography>
                    </Box>
                </Box>

                <Box>
                    <Typography variant="body2" color="text.secondary">
                        Clientes Ativos
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                        {isSingleSeller ? metrics.active_customers : metrics.total_active}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        de {isSingleSeller ? metrics.total_customers : metrics.total_portfolio} na carteira
                    </Typography>

                    {!isSingleSeller && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                {metrics.total_sellers} vendedores
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Barra de Progresso */}
            <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                        Progresso para meta
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                        {achievementPercent}%
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={Math.min(achievementPercent, 100)}
                    color={getStatusColor(data.status)}
                    sx={{ height: 8, borderRadius: 1 }}
                />
            </Box>

            {/* Detalhes Expandidos */}
            <Collapse in={expanded}>
                <Divider sx={{ my: 2 }} />

                {/* Status dos Vendedores (para visão consolidada - apenas gerentes) */}
                {isManager && !isSingleSeller && metrics && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Status dos Vendedores
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Chip
                                label={`${metrics.sellers_on_target} na meta`}
                                size="small"
                                color="success"
                                variant="outlined"
                            />
                            <Chip
                                label={`${metrics.sellers_warning} em atenção`}
                                size="small"
                                color="warning"
                                variant="outlined"
                            />
                            <Chip
                                label={`${metrics.sellers_critical} críticos`}
                                size="small"
                                color="error"
                                variant="outlined"
                            />
                        </Box>
                    </Box>
                )}

                {isManager && showRanking && !isSingleSeller && data.ranking && (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <TrophyIcon color="warning" fontSize="small" />
                            <Typography variant="subtitle2">
                                Top 5 Vendedores
                            </Typography>
                        </Box>
                        <List dense disablePadding>
                            {data.ranking.slice(0, 5).map((seller, index) => (
                                <ListItem
                                    key={seller.seller_id}
                                    sx={{
                                        py: 0.5,
                                        bgcolor: index === 0 ? 'warning.light' : 'transparent',
                                        borderRadius: 1,
                                        mb: 0.5
                                    }}
                                >
                                    <ListItemAvatar sx={{ minWidth: 36 }}>
                                        <Avatar
                                            sx={{
                                                width: 28,
                                                height: 28,
                                                fontSize: '0.875rem',
                                                bgcolor: index === 0 ? 'warning.main' : 'grey.400'
                                            }}
                                        >
                                            {seller.rank}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={seller.seller_name}
                                        secondary={`Taxa: ${seller.penetration_rate.toFixed(2)}`}
                                        primaryTypographyProps={{ variant: 'body2' }}
                                        secondaryTypographyProps={{ variant: 'caption' }}
                                    />
                                    <Chip
                                        label={seller.status}
                                        size="small"
                                        color={getStatusColor(seller.status)}
                                        sx={{ ml: 1 }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}

                {/* Vendedores Abaixo da Meta (apenas gerentes) */}
                {isManager && !isSingleSeller && data.below_target && data.below_target.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                        <Alert severity="warning" sx={{ mb: 1 }}>
                            {data.below_target.length} vendedor(es) abaixo da meta
                        </Alert>
                        <List dense disablePadding>
                            {data.below_target.slice(0, 3).map((seller) => (
                                <ListItem key={seller.seller_id} sx={{ py: 0.5 }}>
                                    <ListItemText
                                        primary={seller.seller_name}
                                        secondary={`Gap: ${seller.gap.toFixed(2)} | ${seller.inactive_customers} inativos`}
                                        primaryTypographyProps={{ variant: 'body2' }}
                                        secondaryTypographyProps={{ variant: 'caption', color: 'error' }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}

                {/* Período */}
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        Período: {data.period}
                    </Typography>
                </Box>
            </Collapse>
        </Paper>
    )
}

export default PenetrationWidget
