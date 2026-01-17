import { useState, useEffect } from 'react'
import {
    Box,
    Paper,
    Typography,
    Skeleton,
    Chip,
    IconButton,
    Tooltip,
    LinearProgress,
    Collapse,
    Alert,
    Grid,
    Divider
} from '@mui/material'
import {
    Timeline as PipelineIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Warning as WarningIcon,
    Refresh as RefreshIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Speed as SpeedIcon,
    CalendarToday as CalendarIcon,
    Inventory as InventoryIcon
} from '@mui/icons-material'
import { analyticsV2Service } from '../services/api'

/**
 * PipelineWidget - Widget de Pipeline de Vendas
 * Meta 30.000 Máquinas/Ano
 * 
 * Pipeline >= 3.000 máquinas/mês
 * Conversão >= 60%
 * Meta: 2.500 máquinas/mês
 */
function PipelineWidget({ sellerId = null, showForecast = true, compact = false }) {
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
            const response = await analyticsV2Service.getPipeline(params)

            if (response.data.success) {
                setData(response.data.data)
            }
        } catch (err) {
            console.error('Erro ao carregar pipeline:', err)
            setError('Erro ao carregar métricas de pipeline')
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
            case 'WARNING': return <WarningIcon fontSize="small" />
            case 'CRITICAL': return <TrendingDownIcon fontSize="small" />
            default: return null
        }
    }

    const formatNumber = (value) => {
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}k`
        }
        return value?.toString() || '0'
    }

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value || 0)
    }

    if (loading) {
        return (
            <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton variant="text" width="40%" />
                </Box>
                <Skeleton variant="rectangular" height={80} sx={{ mb: 1 }} />
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

    const { metrics, targets, gaps, status, achievement, forecast } = data

    return (
        <Paper sx={{ p: 2, mb: 2 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PipelineIcon color="primary" />
                    <Typography variant="h6">Pipeline de Vendas</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label={status.overall}
                        size="small"
                        color={getStatusColor(status.overall)}
                        icon={getStatusIcon(status.overall)}
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

            {/* Cards de Métricas Principais */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                {/* Máquinas Vendidas */}
                <Grid item xs={6} md={3}>
                    <Box sx={{
                        p: 1.5,
                        bgcolor: status.machines === 'ON_TARGET' ? 'success.light' :
                            status.machines === 'WARNING' ? 'warning.light' : 'error.light',
                        borderRadius: 2,
                        textAlign: 'center'
                    }}>
                        <InventoryIcon sx={{ fontSize: 28, opacity: 0.7 }} />
                        <Typography variant="h4" fontWeight="bold">
                            {formatNumber(metrics.machines_sold)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Máquinas Vendidas
                        </Typography>
                        <Typography variant="caption" display="block">
                            Meta: {formatNumber(targets.machines_monthly)}
                        </Typography>
                    </Box>
                </Grid>

                {/* Pipeline */}
                <Grid item xs={6} md={3}>
                    <Box sx={{
                        p: 1.5,
                        bgcolor: status.pipeline === 'ON_TARGET' ? 'success.light' :
                            status.pipeline === 'WARNING' ? 'warning.light' : 'error.light',
                        borderRadius: 2,
                        textAlign: 'center'
                    }}>
                        <PipelineIcon sx={{ fontSize: 28, opacity: 0.7 }} />
                        <Typography variant="h4" fontWeight="bold">
                            {formatNumber(metrics.machines_in_pipeline)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            No Pipeline
                        </Typography>
                        <Typography variant="caption" display="block">
                            Mínimo: {formatNumber(targets.pipeline_minimum)}
                        </Typography>
                    </Box>
                </Grid>

                {/* Conversão */}
                <Grid item xs={6} md={3}>
                    <Box sx={{
                        p: 1.5,
                        bgcolor: status.conversion === 'ON_TARGET' ? 'success.light' :
                            status.conversion === 'WARNING' ? 'warning.light' : 'error.light',
                        borderRadius: 2,
                        textAlign: 'center'
                    }}>
                        <SpeedIcon sx={{ fontSize: 28, opacity: 0.7 }} />
                        <Typography variant="h4" fontWeight="bold">
                            {metrics.conversion_rate}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Conversão
                        </Typography>
                        <Typography variant="caption" display="block">
                            Meta: {targets.conversion_rate}%
                        </Typography>
                    </Box>
                </Grid>

                {/* Leads */}
                <Grid item xs={6} md={3}>
                    <Box sx={{
                        p: 1.5,
                        bgcolor: 'grey.100',
                        borderRadius: 2,
                        textAlign: 'center'
                    }}>
                        <CalendarIcon sx={{ fontSize: 28, opacity: 0.7 }} />
                        <Typography variant="h4" fontWeight="bold">
                            {metrics.leads_converted}/{metrics.leads_created}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Convertidos/Criados
                        </Typography>
                        <Typography variant="caption" display="block">
                            {metrics.leads_open} em aberto
                        </Typography>
                    </Box>
                </Grid>
            </Grid>

            {/* Barra de Progresso - Máquinas */}
            <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                        Progresso Meta Mensal ({formatNumber(metrics.machines_sold)} / {formatNumber(targets.machines_monthly)})
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color={getStatusColor(status.machines) + '.main'}>
                        {achievement.machines_percent}%
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={Math.min(achievement.machines_percent, 100)}
                    color={getStatusColor(status.machines)}
                    sx={{ height: 10, borderRadius: 1 }}
                />
                {gaps.machines > 0 && (
                    <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
                        Faltam {formatNumber(gaps.machines)} máquinas para a meta
                    </Typography>
                )}
                {gaps.machines <= 0 && (
                    <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block' }}>
                        🎉 Meta atingida! {formatNumber(Math.abs(gaps.machines))} acima da meta
                    </Typography>
                )}
            </Box>

            {/* Detalhes Expandidos */}
            <Collapse in={expanded}>
                <Divider sx={{ my: 2 }} />

                {/* Forecast */}
                {showForecast && forecast && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            📈 Projeção
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Box sx={{
                                    p: 1,
                                    bgcolor: forecast.on_track ? 'success.light' : 'warning.light',
                                    borderRadius: 1
                                }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Projeção do Mês
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold">
                                        {formatNumber(forecast.projected_machines || metrics.machines_sold)}
                                    </Typography>
                                    <Chip
                                        label={forecast.on_track ? 'No caminho' : 'Atenção'}
                                        size="small"
                                        color={forecast.on_track ? 'success' : 'warning'}
                                        sx={{ mt: 0.5 }}
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={6}>
                                <Box sx={{ p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Ritmo Necessário
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold">
                                        {forecast.required_daily_rate}/dia
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Atual: {forecast.daily_rate}/dia
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {forecast.days_elapsed} dias passados | {forecast.days_remaining} dias restantes
                        </Typography>
                    </Box>
                )}

                {/* Receita Total */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        💰 Receita do Período
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                        {formatCurrency(metrics.total_revenue)}
                    </Typography>
                </Box>

                {/* Alertas */}
                {status.overall !== 'ON_TARGET' && (
                    <Alert
                        severity={status.overall === 'CRITICAL' ? 'error' : 'warning'}
                        sx={{ mb: 1 }}
                    >
                        {status.machines !== 'ON_TARGET' && (
                            <Typography variant="body2">
                                ⚠️ Máquinas: {gaps.machines > 0 ? `${formatNumber(gaps.machines)} abaixo` : 'OK'}
                            </Typography>
                        )}
                        {status.pipeline !== 'ON_TARGET' && (
                            <Typography variant="body2">
                                ⚠️ Pipeline: {gaps.pipeline > 0 ? `${formatNumber(gaps.pipeline)} abaixo do mínimo` : 'OK'}
                            </Typography>
                        )}
                        {status.conversion !== 'ON_TARGET' && (
                            <Typography variant="body2">
                                ⚠️ Conversão: {gaps.conversion}% abaixo da meta
                            </Typography>
                        )}
                    </Alert>
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

export default PipelineWidget
