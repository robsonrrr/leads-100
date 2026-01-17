import { useState, useEffect } from 'react'
import {
    Box,
    Paper,
    Typography,
    Skeleton,
    Chip,
    IconButton,
    Tooltip,
    Grid,
    Divider,
    Alert,
    AlertTitle,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material'
import {
    Dashboard as DashboardIcon,
    Refresh as RefreshIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Lightbulb as InsightIcon,
    Group as GroupIcon,
    Timeline as PipelineIcon,
    Speed as SpeedIcon,
    Inventory as InventoryIcon
} from '@mui/icons-material'
import { analyticsV2Service } from '../services/api'
import { useManagerFilter } from '../contexts/ManagerFilterContext'

/**
 * ExecutiveSummaryWidget - Resumo Executivo com todos os KPIs
 * Meta 30.000 Máquinas/Ano
 * 
 * Consolida: Penetração, Pipeline, Máquinas, Conversão
 */
function ExecutiveSummaryWidget({ period = null }) {
    const { isManager } = useManagerFilter()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        loadData()
    }, [period])

    const loadData = async () => {
        try {
            setLoading(true)
            setError(null)
            const params = period ? { period } : {}
            const response = await analyticsV2Service.getSummary(params)

            if (response.data.success) {
                setData(response.data.data)
            }
        } catch (err) {
            console.error('Erro ao carregar resumo executivo:', err)
            setError('Erro ao carregar resumo executivo')
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
            case 'ON_TARGET': return <CheckCircleIcon color="success" />
            case 'WARNING': return <WarningIcon color="warning" />
            case 'CRITICAL': return <ErrorIcon color="error" />
            default: return null
        }
    }

    const formatNumber = (value) => {
        if (!value && value !== 0) return '-'
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}k`
        }
        return value.toString()
    }

    if (loading) {
        return (
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton variant="text" width="50%" height={40} />
                </Box>
                <Grid container spacing={2}>
                    {[1, 2, 3, 4].map((i) => (
                        <Grid item xs={6} md={3} key={i}>
                            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
                        </Grid>
                    ))}
                </Grid>
            </Paper>
        )
    }

    if (error) {
        return (
            <Paper sx={{ p: 3 }}>
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

    const { kpis, overall_status, insights, sellers_summary, forecast } = data

    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DashboardIcon color="primary" sx={{ fontSize: 32 }} />
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            Resumo Executivo
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Meta 30.000 Máquinas/Ano | Período: {data.period}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label={overall_status}
                        color={getStatusColor(overall_status)}
                        icon={getStatusIcon(overall_status)}
                        sx={{ fontWeight: 'bold' }}
                    />
                    <Tooltip title="Atualizar">
                        <IconButton onClick={loadData}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* KPI Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* Penetração */}
                <Grid item xs={6} md={3}>
                    <Box sx={{
                        p: 2,
                        bgcolor: getStatusColor(kpis.penetration.status) + '.light',
                        borderRadius: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <GroupIcon sx={{ fontSize: 20 }} />
                            <Typography variant="subtitle2">Penetração</Typography>
                            <Chip label="KPI-mãe" size="small" variant="outlined" sx={{ ml: 'auto', fontSize: '0.6rem' }} />
                        </Box>
                        <Typography variant="h4" fontWeight="bold">
                            {kpis.penetration.current?.toFixed(2) || '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Meta: {kpis.penetration.target}
                        </Typography>
                        <Box sx={{ mt: 'auto', pt: 1 }}>
                            <Chip
                                label={`${kpis.penetration.achievement_percent}%`}
                                size="small"
                                color={getStatusColor(kpis.penetration.status)}
                            />
                        </Box>
                    </Box>
                </Grid>

                {/* Máquinas Vendidas */}
                <Grid item xs={6} md={3}>
                    <Box sx={{
                        p: 2,
                        bgcolor: getStatusColor(kpis.machines_sold.status) + '.light',
                        borderRadius: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <InventoryIcon sx={{ fontSize: 20 }} />
                            <Typography variant="subtitle2">Máquinas</Typography>
                        </Box>
                        <Typography variant="h4" fontWeight="bold">
                            {formatNumber(kpis.machines_sold.current)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Meta: {formatNumber(kpis.machines_sold.target)}
                        </Typography>
                        {kpis.machines_sold.gap > 0 && (
                            <Typography variant="caption" color="error.main">
                                Gap: {formatNumber(kpis.machines_sold.gap)}
                            </Typography>
                        )}
                        <Box sx={{ mt: 'auto', pt: 1 }}>
                            <Chip
                                label={`${kpis.machines_sold.achievement_percent}%`}
                                size="small"
                                color={getStatusColor(kpis.machines_sold.status)}
                            />
                        </Box>
                    </Box>
                </Grid>

                {/* Pipeline */}
                <Grid item xs={6} md={3}>
                    <Box sx={{
                        p: 2,
                        bgcolor: getStatusColor(kpis.pipeline.status) + '.light',
                        borderRadius: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <PipelineIcon sx={{ fontSize: 20 }} />
                            <Typography variant="subtitle2">Pipeline</Typography>
                        </Box>
                        <Typography variant="h4" fontWeight="bold">
                            {formatNumber(kpis.pipeline.current)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Mínimo: {formatNumber(kpis.pipeline.target)}
                        </Typography>
                        <Box sx={{ mt: 'auto', pt: 1 }}>
                            <Chip
                                label={`${kpis.pipeline.achievement_percent}%`}
                                size="small"
                                color={getStatusColor(kpis.pipeline.status)}
                            />
                        </Box>
                    </Box>
                </Grid>

                {/* Conversão */}
                <Grid item xs={6} md={3}>
                    <Box sx={{
                        p: 2,
                        bgcolor: getStatusColor(kpis.conversion.status) + '.light',
                        borderRadius: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <SpeedIcon sx={{ fontSize: 20 }} />
                            <Typography variant="subtitle2">Conversão</Typography>
                        </Box>
                        <Typography variant="h4" fontWeight="bold">
                            {kpis.conversion.current}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Meta: {kpis.conversion.target}%
                        </Typography>
                        <Box sx={{ mt: 'auto', pt: 1 }}>
                            <Chip
                                label={`${kpis.conversion.achievement_percent}%`}
                                size="small"
                                color={getStatusColor(kpis.conversion.status)}
                            />
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Insights e Status de Vendedores */}
            <Grid container spacing={3}>
                {/* Insights */}
                <Grid item xs={12} md={7}>
                    {insights && insights.length > 0 ? (
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <InsightIcon color="primary" />
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Insights
                                </Typography>
                            </Box>
                            <List dense>
                                {insights.map((insight, index) => (
                                    <ListItem key={index} sx={{ py: 0.5 }}>
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            {insight.severity === 'CRITICAL' ? (
                                                <ErrorIcon color="error" fontSize="small" />
                                            ) : (
                                                <WarningIcon color="warning" fontSize="small" />
                                            )}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={insight.message}
                                            secondary={insight.type}
                                            primaryTypographyProps={{ variant: 'body2' }}
                                            secondaryTypographyProps={{ variant: 'caption' }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    ) : (
                        <Alert severity="success" icon={<CheckCircleIcon />}>
                            <AlertTitle>Tudo certo!</AlertTitle>
                            Todos os KPIs estão dentro da meta.
                        </Alert>
                    )}
                </Grid>

                {/* Status de Vendedores (Apenas Gerentes) */}
                {isManager && sellers_summary && (
                    <Grid item xs={12} md={5}>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <GroupIcon color="primary" />
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Equipe de Vendas
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                    icon={<CheckCircleIcon />}
                                    label={`${sellers_summary.on_target} na meta`}
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                />
                                <Chip
                                    icon={<WarningIcon />}
                                    label={`${sellers_summary.warning} atenção`}
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                />
                                <Chip
                                    icon={<ErrorIcon />}
                                    label={`${sellers_summary.critical} críticos`}
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                />
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Total: {sellers_summary.total} vendedores
                            </Typography>
                        </Box>
                    </Grid>
                )}
            </Grid>

            {/* Forecast */}
            {forecast && (
                <>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TrendingUpIcon color={forecast.on_track ? 'success' : 'warning'} />
                        <Box>
                            <Typography variant="body2" component="div">
                                <strong>Projeção:</strong> {formatNumber(kpis.machines_sold.projected)} máquinas
                                {forecast.on_track ? (
                                    <Chip label="No caminho ✓" size="small" color="success" sx={{ ml: 1 }} />
                                ) : (
                                    <Chip label="Atenção" size="small" color="warning" sx={{ ml: 1 }} />
                                )}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {forecast.days_remaining} dias restantes | Ritmo necessário: {forecast.required_daily_rate}/dia
                            </Typography>
                        </Box>
                    </Box>
                </>
            )}
        </Paper>
    )
}

export default ExecutiveSummaryWidget
