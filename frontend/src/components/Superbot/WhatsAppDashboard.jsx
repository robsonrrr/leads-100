/**
 * WhatsApp Analytics Dashboard
 * 
 * Dashboard com métricas e gráficos de WhatsApp
 * 
 * @version 1.0
 * @date 2026-01-18
 */

import React, { useState, useEffect } from 'react'
import {
    Box,
    Paper,
    Typography,
    Grid,
    CircularProgress,
    Alert,
    Chip,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Tooltip,
    LinearProgress,
} from '@mui/material'
import {
    WhatsApp as WhatsAppIcon,
    Message as MessageIcon,
    Person as PersonIcon,
    TrendingUp as TrendingUpIcon,
    AccessTime as AccessTimeIcon,
    ShoppingCart as ShoppingCartIcon,
    Refresh as RefreshIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
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
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts'
import { superbotService } from '../../services/superbot.service'

// Cores para gráficos
const COLORS = {
    primary: '#25D366',
    secondary: '#128C7E',
    incoming: '#4CAF50',
    outgoing: '#2196F3',
    leads: '#FF9800',
    chart: ['#25D366', '#128C7E', '#075E54', '#34B7F1', '#00A884', '#667781'],
    intents: {
        QUOTE_REQUEST: '#4CAF50',
        PURCHASE_INTENT: '#2196F3',
        PRICE_CHECK: '#FF9800',
        STOCK_CHECK: '#9C27B0',
        COMPLAINT: '#F44336',
        ORDER_STATUS: '#00BCD4',
        GENERAL_QUESTION: '#607D8B',
    }
}

// Componente de Card de Métrica
const MetricCard = ({ title, value, subtitle, icon, color = '#25D366', trend = null }) => (
    <Paper
        elevation={2}
        sx={{
            p: 2,
            height: '100%',
            background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
            borderLeft: `4px solid ${color}`,
        }}
    >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                    {title}
                </Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ color }}>
                    {value}
                </Typography>
                {subtitle && (
                    <Typography variant="body2" color="text.secondary">
                        {subtitle}
                    </Typography>
                )}
                {trend !== null && (
                    <Chip
                        size="small"
                        icon={trend >= 0 ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                        label={`${trend >= 0 ? '+' : ''}${trend}%`}
                        color={trend >= 0 ? 'success' : 'error'}
                        sx={{ mt: 1 }}
                    />
                )}
            </Box>
            <Avatar sx={{ bgcolor: `${color}20`, color }}>
                {icon}
            </Avatar>
        </Box>
    </Paper>
)

// Componente principal
const WhatsAppDashboard = ({ defaultDays = 30, compact = false }) => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [days, setDays] = useState(defaultDays)
    const [data, setData] = useState(null)

    useEffect(() => {
        loadDashboard()
    }, [days])

    const loadDashboard = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await superbotService.getDashboard(days)
            setData(response.data?.data)
        } catch (err) {
            console.error('Erro ao carregar dashboard:', err)
            setError('Erro ao carregar dados do dashboard')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateStr) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }

    const formatHour = (hour) => {
        return `${String(hour).padStart(2, '0')}h`
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, minHeight: 400 }}>
                <CircularProgress color="success" />
            </Box>
        )
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ m: 2 }}>
                {error}
            </Alert>
        )
    }

    if (!data) {
        return (
            <Alert severity="info" sx={{ m: 2 }}>
                Nenhum dado disponível
            </Alert>
        )
    }

    const { summary, messagesByDay, messagesByHour, topCustomers, intents, conversion, response } = data

    // Preparar dados para gráficos
    const chartData = messagesByDay?.map(d => ({
        date: formatDate(d.date),
        total: d.total,
        incoming: d.incoming,
        outgoing: d.outgoing,
    })) || []

    const hourData = messagesByHour?.map(h => ({
        hour: formatHour(h.hour),
        total: h.total,
        avg: h.avg_per_day,
    })) || []

    const intentData = intents?.map(i => ({
        name: i.intent?.replace(/_/g, ' ') || 'Outro',
        value: i.count,
        color: COLORS.intents[i.intent] || '#607D8B',
    })) || []

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: COLORS.primary, width: 48, height: 48 }}>
                        <WhatsAppIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            Dashboard WhatsApp
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Analytics e métricas de conversas
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Período</InputLabel>
                        <Select
                            value={days}
                            label="Período"
                            onChange={(e) => setDays(e.target.value)}
                        >
                            <MenuItem value={7}>7 dias</MenuItem>
                            <MenuItem value={15}>15 dias</MenuItem>
                            <MenuItem value={30}>30 dias</MenuItem>
                            <MenuItem value={60}>60 dias</MenuItem>
                            <MenuItem value={90}>90 dias</MenuItem>
                        </Select>
                    </FormControl>

                    <Tooltip title="Atualizar">
                        <IconButton onClick={loadDashboard}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Cards de Métricas */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Total de Mensagens"
                        value={summary?.total_messages?.toLocaleString() || 0}
                        subtitle={`${summary?.avg_messages_per_day || 0} por dia`}
                        icon={<MessageIcon />}
                        color={COLORS.primary}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Contatos Únicos"
                        value={summary?.unique_contacts?.toLocaleString() || 0}
                        subtitle={`${summary?.total_sessions || 0} sessões`}
                        icon={<PersonIcon />}
                        color={COLORS.secondary}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Leads Criados"
                        value={conversion?.leads_created || 0}
                        subtitle={`${conversion?.contact_to_lead_rate || 0}% conversão`}
                        icon={<ShoppingCartIcon />}
                        color={COLORS.leads}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Tempo de Resposta"
                        value={response?.avg_response_time_formatted || 'N/A'}
                        subtitle={`${response?.total_responses || 0} respostas`}
                        icon={<AccessTimeIcon />}
                        color="#2196F3"
                    />
                </Grid>
            </Grid>

            {/* Gráficos */}
            <Grid container spacing={3}>
                {/* Gráfico de Mensagens por Dia */}
                <Grid item xs={12} md={8}>
                    <Paper elevation={2} sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Mensagens por Dia
                        </Typography>
                        <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorIncoming" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.incoming} stopOpacity={0.8} />
                                            <stop offset="95%" stopColor={COLORS.incoming} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorOutgoing" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.outgoing} stopOpacity={0.8} />
                                            <stop offset="95%" stopColor={COLORS.outgoing} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <RechartsTooltip />
                                    <Area
                                        type="monotone"
                                        dataKey="incoming"
                                        name="Recebidas"
                                        stroke={COLORS.incoming}
                                        fillOpacity={1}
                                        fill="url(#colorIncoming)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="outgoing"
                                        name="Enviadas"
                                        stroke={COLORS.outgoing}
                                        fillOpacity={1}
                                        fill="url(#colorOutgoing)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>

                {/* Distribuição de Intenções */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Intenções Detectadas
                        </Typography>
                        <Box sx={{ height: 280 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={intentData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {intentData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Legend
                                        layout="vertical"
                                        verticalAlign="bottom"
                                        align="center"
                                        wrapperStyle={{ fontSize: '11px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>

                {/* Horários de Pico */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Horários de Pico
                        </Typography>
                        <Box sx={{ height: 250 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hourData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <RechartsTooltip />
                                    <Bar
                                        dataKey="avg"
                                        name="Média/dia"
                                        fill={COLORS.primary}
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>

                {/* Top Clientes */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Top Clientes
                        </Typography>
                        <List dense>
                            {topCustomers?.map((customer, index) => (
                                <ListItem key={customer.phone}>
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: COLORS.chart[index % COLORS.chart.length] }}>
                                            {index + 1}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={customer.name || customer.push_name || customer.phone}
                                        secondary={`${customer.total_messages} mensagens • ${customer.total_sessions} sessões`}
                                    />
                                    <Chip
                                        size="small"
                                        label={customer.total_messages}
                                        color="success"
                                        variant="outlined"
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>

                {/* Funil de Conversão */}
                <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Funil de Conversão
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Box sx={{ flex: 1, minWidth: 200 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Contatos WhatsApp
                                </Typography>
                                <Typography variant="h4" fontWeight="bold" color={COLORS.primary}>
                                    {conversion?.total_contacts || 0}
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={100}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: '#e0e0e0',
                                        '& .MuiLinearProgress-bar': { bgcolor: COLORS.primary }
                                    }}
                                />
                            </Box>

                            <TrendingUpIcon sx={{ color: 'text.secondary' }} />

                            <Box sx={{ flex: 1, minWidth: 200 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Leads Criados
                                </Typography>
                                <Typography variant="h4" fontWeight="bold" color={COLORS.leads}>
                                    {conversion?.leads_created || 0}
                                </Typography>
                                <Typography variant="caption" color="success.main">
                                    {conversion?.contact_to_lead_rate || 0}% conversão
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={parseFloat(conversion?.contact_to_lead_rate) || 0}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: '#e0e0e0',
                                        '& .MuiLinearProgress-bar': { bgcolor: COLORS.leads }
                                    }}
                                />
                            </Box>

                            <TrendingUpIcon sx={{ color: 'text.secondary' }} />

                            <Box sx={{ flex: 1, minWidth: 200 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Pedidos Gerados
                                </Typography>
                                <Typography variant="h4" fontWeight="bold" color="#2196F3">
                                    {conversion?.leads_converted || 0}
                                </Typography>
                                <Typography variant="caption" color="success.main">
                                    {conversion?.lead_to_order_rate || 0}% conversão
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={parseFloat(conversion?.lead_to_order_rate) || 0}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: '#e0e0e0',
                                        '& .MuiLinearProgress-bar': { bgcolor: '#2196F3' }
                                    }}
                                />
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    )
}

export default WhatsAppDashboard
