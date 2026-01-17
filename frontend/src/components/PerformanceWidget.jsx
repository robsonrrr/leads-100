import React, { useState, useEffect } from 'react'
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    LinearProgress,
    Chip,
    IconButton,
    Tooltip,
    Divider,
    Alert,
    CircularProgress
} from '@mui/material'
import {
    Speed as SpeedIcon,
    Storage as StorageIcon,
    Memory as MemoryIcon,
    Refresh as RefreshIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon
} from '@mui/icons-material'
import { analyticsService } from '../services/api'

/**
 * Widget de Métricas de Performance - Q3.1
 * Exibe métricas de performance do sistema em tempo real
 */
export default function PerformanceWidget({ refreshInterval = 30000 }) {
    const [metrics, setMetrics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [lastUpdate, setLastUpdate] = useState(null)

    const fetchMetrics = async () => {
        try {
            setLoading(true)
            setError(null)

            // Buscar métricas da API
            const response = await fetch('/api/metrics/performance', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (!response.ok) throw new Error('Falha ao buscar métricas')

            const data = await response.json()
            setMetrics(data.data)
            setLastUpdate(new Date())
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMetrics()

        if (refreshInterval > 0) {
            const interval = setInterval(fetchMetrics, refreshInterval)
            return () => clearInterval(interval)
        }
    }, [refreshInterval])

    if (loading && !metrics) {
        return (
            <Card>
                <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </CardContent>
            </Card>
        )
    }

    if (error && !metrics) {
        return (
            <Card>
                <CardContent>
                    <Alert severity="error">{error}</Alert>
                </CardContent>
            </Card>
        )
    }

    const getStatusColor = (value, target, inverted = false) => {
        const isGood = inverted ? value < target : value >= target
        return isGood ? 'success' : 'warning'
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'ok':
            case 'connected':
                return <CheckCircleIcon color="success" fontSize="small" />
            case 'degraded':
            case 'unavailable':
                return <WarningIcon color="warning" fontSize="small" />
            case 'error':
            case 'disconnected':
                return <ErrorIcon color="error" fontSize="small" />
            default:
                return null
        }
    }

    const parsePercentage = (value) => {
        if (typeof value === 'string') {
            return parseFloat(value.replace('%', '')) || 0
        }
        return value || 0
    }

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SpeedIcon color="primary" />
                        <Typography variant="h6" fontWeight="bold">
                            Performance do Sistema
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {lastUpdate && (
                            <Typography variant="caption" color="text.secondary">
                                Atualizado: {lastUpdate.toLocaleTimeString()}
                            </Typography>
                        )}
                        <Tooltip title="Atualizar">
                            <IconButton size="small" onClick={fetchMetrics} disabled={loading}>
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Status Geral */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStatusIcon(metrics?.database?.status)}
                            <Typography variant="body2">
                                Database: <strong>{metrics?.database?.status || 'N/A'}</strong>
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStatusIcon(metrics?.cache?.status)}
                            <Typography variant="body2">
                                Cache: <strong>{metrics?.cache?.status || 'N/A'}</strong>
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography variant="body2">
                            Uptime: <strong>{metrics?.system?.uptimeFormatted || 'N/A'}</strong>
                        </Typography>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Métricas de Request */}
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Requisições
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6} md={3}>
                        <MetricCard
                            label="Total"
                            value={metrics?.requests?.total?.toLocaleString() || '0'}
                            icon={<TrendingUpIcon />}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <MetricCard
                            label="Tempo Médio"
                            value={metrics?.requests?.avgResponseTime || '0ms'}
                            target="< 300ms"
                            status={parseInt(metrics?.requests?.avgResponseTime) < 300 ? 'good' : 'warning'}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <MetricCard
                            label="Queries Lentas"
                            value={metrics?.requests?.slowQueries || 0}
                            status={metrics?.requests?.slowQueries < 10 ? 'good' : 'warning'}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <MetricCard
                            label="Taxa de Erro"
                            value={metrics?.requests?.errorRate || '0%'}
                            target="< 1%"
                            status={parsePercentage(metrics?.requests?.errorRate) < 1 ? 'good' : 'bad'}
                        />
                    </Grid>
                </Grid>

                {/* Métricas de Cache */}
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Cache Redis
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6} md={3}>
                        <MetricCard
                            label="Hits"
                            value={metrics?.cache?.hits?.toLocaleString() || '0'}
                            icon={<CheckCircleIcon color="success" />}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <MetricCard
                            label="Misses"
                            value={metrics?.cache?.misses?.toLocaleString() || '0'}
                            icon={<TrendingDownIcon color="warning" />}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2">Hit Rate</Typography>
                                <Typography variant="body2" fontWeight="bold">
                                    {metrics?.cache?.hitRate || '0%'}
                                    <Typography component="span" variant="caption" color="text.secondary">
                                        {' '}(meta: > 70%)
                                    </Typography>
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={parsePercentage(metrics?.cache?.hitRate)}
                                color={parsePercentage(metrics?.cache?.hitRate) >= 70 ? 'success' : 'warning'}
                                sx={{ height: 8, borderRadius: 1 }}
                            />
                        </Box>
                    </Grid>
                </Grid>

                {/* Memória */}
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Memória
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                        <MetricCard
                            label="Heap Usado"
                            value={metrics?.system?.memoryUsage?.heapUsed || 'N/A'}
                            icon={<MemoryIcon />}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <MetricCard
                            label="Heap Total"
                            value={metrics?.system?.memoryUsage?.heapTotal || 'N/A'}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <MetricCard
                            label="RSS"
                            value={metrics?.system?.memoryUsage?.rss || 'N/A'}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <MetricCard
                            label="Node Version"
                            value={metrics?.system?.nodeVersion || 'N/A'}
                        />
                    </Grid>
                </Grid>

                {/* Targets */}
                {metrics?.targets && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Metas Q3.1
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                                size="small"
                                label={`Response Time ${metrics.targets.avgResponseTime}`}
                                color={parseInt(metrics?.requests?.avgResponseTime) < 300 ? 'success' : 'warning'}
                            />
                            <Chip
                                size="small"
                                label={`Hit Rate ${metrics.targets.hitRate}`}
                                color={parsePercentage(metrics?.cache?.hitRate) >= 70 ? 'success' : 'warning'}
                            />
                            <Chip
                                size="small"
                                label={`Error Rate ${metrics.targets.errorRate}`}
                                color={parsePercentage(metrics?.requests?.errorRate) < 1 ? 'success' : 'error'}
                            />
                        </Box>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

// Sub-componente para cards de métrica
function MetricCard({ label, value, target, status, icon }) {
    const getColor = () => {
        switch (status) {
            case 'good': return 'success.main'
            case 'warning': return 'warning.main'
            case 'bad': return 'error.main'
            default: return 'text.primary'
        }
    }

    return (
        <Box sx={{ textAlign: 'center', p: 1 }}>
            {icon && <Box sx={{ mb: 0.5 }}>{icon}</Box>}
            <Typography variant="h6" fontWeight="bold" color={getColor()}>
                {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                {label}
            </Typography>
            {target && (
                <Typography variant="caption" display="block" color="text.secondary">
                    Meta: {target}
                </Typography>
            )}
        </Box>
    )
}
