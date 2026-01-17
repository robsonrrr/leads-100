import { useState, useEffect } from 'react'
import {
    Box,
    Paper,
    Typography,
    Grid,
    Chip,
    Skeleton,
    Tooltip,
    LinearProgress,
    Divider,
    useTheme,
    alpha
} from '@mui/material'
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Assignment as LeadIcon,
    CheckCircle as ConvertedIcon,
    HourglassEmpty as PendingIcon,
    Cancel as CancelledIcon,
    AttachMoney as MoneyIcon,
    Percent as PercentIcon
} from '@mui/icons-material'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    Legend
} from 'recharts'
import { analyticsService } from '../services/api'
import { formatCurrency } from '../utils'

// Cores do funil
const FUNNEL_COLORS = {
    'Total Leads': '#1976d2',
    'Em Aberto': '#ff9800',
    'Convertidos': '#2e7d32',
    'Cancelados': '#d32f2f'
}

// Card de métrica individual
function MetricCard({ icon: Icon, title, value, subtitle, color, variation, loading }) {
    const theme = useTheme()

    if (loading) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 2.5,
                    height: '100%',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.grey[100], 0.8)} 0%, ${theme.palette.background.paper} 100%)`,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3
                }}
            >
                <Skeleton variant="circular" width={40} height={40} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" height={32} />
            </Paper>
        )
    }

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(color || theme.palette.primary.main, 0.08)} 0%, ${theme.palette.background.paper} 100%)`,
                border: `1px solid ${alpha(color || theme.palette.primary.main, 0.2)}`,
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 25px ${alpha(color || theme.palette.primary.main, 0.15)}`
                }
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box
                    sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: alpha(color || theme.palette.primary.main, 0.12),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Icon sx={{ color: color || theme.palette.primary.main, fontSize: 24 }} />
                </Box>
                {variation !== undefined && variation !== 0 && (
                    <Chip
                        size="small"
                        icon={variation > 0 ? <TrendingUpIcon sx={{ fontSize: 14 }} /> : <TrendingDownIcon sx={{ fontSize: 14 }} />}
                        label={`${variation > 0 ? '+' : ''}${variation}%`}
                        color={variation > 0 ? 'success' : 'error'}
                        sx={{
                            height: 24,
                            '& .MuiChip-label': { px: 1, fontSize: '0.75rem' },
                            '& .MuiChip-icon': { ml: 0.5 }
                        }}
                    />
                )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 0.5 }}>
                {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ color: color || 'text.primary' }}>
                {value}
            </Typography>
            {subtitle && (
                <Typography variant="caption" color="text.secondary">
                    {subtitle}
                </Typography>
            )}
        </Paper>
    )
}

// Tooltip customizado para gráficos
function CustomTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
        return (
            <Paper sx={{ p: 1.5, boxShadow: 3 }}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>{label}</Typography>
                {payload.map((entry, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
                        <Typography variant="caption" color="text.secondary">
                            {entry.name}: <strong>{entry.value}</strong>
                        </Typography>
                    </Box>
                ))}
            </Paper>
        )
    }
    return null
}

export default function LeadsAnalyticsWidget({ sellerId, sellerSegmento }) {
    const theme = useTheme()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        loadData()
    }, [sellerId, sellerSegmento])

    const loadData = async () => {
        try {
            setLoading(true)
            setError(null)
            const params = {}
            if (sellerId) params.sellerId = sellerId
            else if (sellerSegmento) params.sellerSegmento = sellerSegmento

            const response = await analyticsService.getLeadsMetrics(params)
            if (response.data.success) {
                setData(response.data.data)
            }
        } catch (err) {
            console.error('Erro ao carregar métricas de leads:', err)
            setError('Não foi possível carregar as métricas')
        } finally {
            setLoading(false)
        }
    }

    if (error) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error">{error}</Typography>
            </Paper>
        )
    }

    const summary = data?.summary || {}
    const comparison = data?.comparison || {}
    const trend = data?.trend || []
    const funnel = data?.funnel || []
    const period = data?.period || {}

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 4,
                background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${theme.palette.background.paper} 100%)`,
                border: `1px solid ${theme.palette.divider}`
            }}
        >
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LeadIcon color="primary" />
                        Métricas de Leads
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {period.monthName} {period.year} • Comparação com mês anterior
                    </Typography>
                </Box>
                {!loading && (
                    <Chip
                        label={`${summary.conversionRate || 0}% conversão`}
                        color={summary.conversionRate >= 30 ? 'success' : summary.conversionRate >= 15 ? 'warning' : 'error'}
                        icon={<PercentIcon />}
                    />
                )}
            </Box>

            {/* Cards de Métricas */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                    <MetricCard
                        icon={LeadIcon}
                        title="Total de Leads"
                        value={summary.total || 0}
                        variation={comparison.totalVariation}
                        color={theme.palette.primary.main}
                        loading={loading}
                    />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <MetricCard
                        icon={PendingIcon}
                        title="Em Aberto"
                        value={summary.openLeads || 0}
                        subtitle={summary.openValue ? formatCurrency(summary.openValue) : null}
                        color={theme.palette.warning.main}
                        loading={loading}
                    />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <MetricCard
                        icon={ConvertedIcon}
                        title="Convertidos"
                        value={summary.converted || 0}
                        variation={comparison.conversionVariation}
                        subtitle={summary.convertedValue ? formatCurrency(summary.convertedValue) : null}
                        color={theme.palette.success.main}
                        loading={loading}
                    />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <MetricCard
                        icon={MoneyIcon}
                        title="Ticket Médio"
                        value={formatCurrency(summary.avgTicket || 0)}
                        color="#9c27b0"
                        loading={loading}
                    />
                </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={3}>
                {/* Gráfico de Tendência */}
                <Grid item xs={12} md={7}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Tendência (Últimos 6 meses)
                    </Typography>
                    {loading ? (
                        <Skeleton variant="rounded" height={250} />
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={trend}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorConverted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                                <XAxis
                                    dataKey="period"
                                    tick={{ fontSize: 12 }}
                                    stroke={theme.palette.text.secondary}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    stroke={theme.palette.text.secondary}
                                />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    name="Total Leads"
                                    stroke={theme.palette.primary.main}
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="converted"
                                    name="Convertidos"
                                    stroke={theme.palette.success.main}
                                    fillOpacity={1}
                                    fill="url(#colorConverted)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </Grid>

                {/* Funil de Conversão */}
                <Grid item xs={12} md={5}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Funil de Conversão
                    </Typography>
                    {loading ? (
                        <Box>
                            {[1, 2, 3, 4].map(i => (
                                <Skeleton key={i} variant="rounded" height={40} sx={{ mb: 1 }} />
                            ))}
                        </Box>
                    ) : (
                        <Box sx={{ mt: 2 }}>
                            {funnel.map((stage, index) => {
                                const color = FUNNEL_COLORS[stage.stage] || theme.palette.grey[500]
                                const widthPercent = stage.percentage || 0

                                return (
                                    <Tooltip
                                        key={stage.stage}
                                        title={`${stage.count} leads • ${stage.value ? formatCurrency(stage.value) : 'R$ 0'}`}
                                        arrow
                                    >
                                        <Box
                                            sx={{
                                                mb: 1.5,
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s',
                                                '&:hover': { transform: 'scale(1.02)' }
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {stage.stage}
                                                </Typography>
                                                <Typography variant="body2" fontWeight="bold" sx={{ color }}>
                                                    {stage.count} ({stage.percentage}%)
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={widthPercent}
                                                sx={{
                                                    height: 12,
                                                    borderRadius: 2,
                                                    bgcolor: alpha(color, 0.15),
                                                    '& .MuiLinearProgress-bar': {
                                                        bgcolor: color,
                                                        borderRadius: 2
                                                    }
                                                }}
                                            />
                                        </Box>
                                    </Tooltip>
                                )
                            })}
                        </Box>
                    )}

                    {/* Taxa de Conversão Destacada */}
                    {!loading && (
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2,
                                mt: 3,
                                textAlign: 'center',
                                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)} 0%, ${theme.palette.background.paper} 100%)`,
                                borderColor: alpha(theme.palette.success.main, 0.3),
                                borderRadius: 2
                            }}
                        >
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Taxa de Conversão
                            </Typography>
                            <Typography variant="h3" fontWeight="bold" color="success.main">
                                {summary.conversionRate || 0}%
                            </Typography>
                            {comparison.conversionVariation !== 0 && (
                                <Chip
                                    size="small"
                                    icon={comparison.conversionVariation > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                                    label={`${comparison.conversionVariation > 0 ? '+' : ''}${comparison.conversionVariation}pp vs mês anterior`}
                                    color={comparison.conversionVariation > 0 ? 'success' : 'error'}
                                    sx={{ mt: 1 }}
                                />
                            )}
                        </Paper>
                    )}
                </Grid>
            </Grid>
        </Paper>
    )
}
