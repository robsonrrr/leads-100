import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Chip,
    IconButton,
    Collapse,
    LinearProgress,
    Divider,
    Tooltip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon
} from '@mui/material';
import {
    AttachMoney as MoneyIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
    Refresh as RefreshIcon,
    Warning as WarningIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    AccountBalance as BalanceIcon,
    Block as BlockIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { analyticsV2Service } from '../services/api';

const STATUS_COLORS = {
    'ON_TARGET': '#4caf50',
    'WARNING': '#ff9800',
    'CRITICAL': '#f44336'
};

const RISK_COLORS = {
    'LOW': '#4caf50',
    'MEDIUM': '#2196f3',
    'HIGH': '#ff9800',
    'CRITICAL': '#f44336'
};

/**
 * Widget de Saúde Financeira
 * Bloco 4 - Gestão Financeira (CFO)
 * 
 * KPIs:
 * - Margem >= 25%
 * - DSO <= 45 dias
 */
export default function FinancialHealthWidget() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [blockedCredits, setBlockedCredits] = useState([]);
    const [expanded, setExpanded] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [financialResponse, blockedResponse] = await Promise.all([
                analyticsV2Service.getFinancialOverview(),
                analyticsV2Service.getBlockedCredits({ limit: 5 }).catch(() => ({ data: { success: true, data: { customers: [] } } }))
            ]);

            if (financialResponse.data?.success) {
                setData(financialResponse.data.data);
            } else {
                setError('Erro ao carregar dados');
            }

            if (blockedResponse.data?.success) {
                setBlockedCredits(blockedResponse.data.data?.customers || []);
            }
        } catch (err) {
            setError(err.message || 'Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatCurrency = (num) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num || 0);
    };

    if (loading) {
        return (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper sx={{ p: 3, height: '100%' }}>
                <Alert severity="error" action={
                    <IconButton size="small" onClick={fetchData}>
                        <RefreshIcon />
                    </IconButton>
                }>{error}</Alert>
            </Paper>
        );
    }

    const { kpis, summary, risk_distribution, alerts, overall_status } = data || {};

    // Prepare pie chart data
    const pieData = risk_distribution ? [
        { name: 'Baixo Risco', value: risk_distribution.LOW || 0, color: RISK_COLORS.LOW },
        { name: 'Médio', value: risk_distribution.MEDIUM || 0, color: RISK_COLORS.MEDIUM },
        { name: 'Alto', value: risk_distribution.HIGH || 0, color: RISK_COLORS.HIGH },
        { name: 'Crítico', value: risk_distribution.CRITICAL || 0, color: RISK_COLORS.CRITICAL }
    ].filter(d => d.value > 0) : [];

    return (
        <Paper
            sx={{
                p: 2,
                height: '100%',
                background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
                color: 'white'
            }}
        >
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MoneyIcon />
                    <Typography variant="h6">Saúde Financeira</Typography>
                    <Chip
                        label="CFO"
                        size="small"
                        sx={{
                            ml: 1,
                            bgcolor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontSize: '0.7rem'
                        }}
                    />
                </Box>
                <Box>
                    <Chip
                        label={overall_status || 'N/A'}
                        size="small"
                        sx={{
                            bgcolor: STATUS_COLORS[overall_status] || '#757575',
                            color: 'white',
                            fontWeight: 'bold',
                            mr: 1
                        }}
                    />
                    <IconButton size="small" onClick={() => setExpanded(!expanded)} sx={{ color: 'white' }}>
                        {expanded ? <CollapseIcon /> : <ExpandIcon />}
                    </IconButton>
                    <IconButton size="small" onClick={fetchData} sx={{ color: 'white' }}>
                        <RefreshIcon />
                    </IconButton>
                </Box>
            </Box>

            <Collapse in={expanded}>
                {/* KPIs Grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                    {/* Margem Bruta */}
                    <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.95)', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            {kpis?.margin?.status === 'ON_TARGET' ?
                                <TrendingUpIcon sx={{ color: STATUS_COLORS[kpis?.margin?.status] }} /> :
                                <TrendingDownIcon sx={{ color: STATUS_COLORS[kpis?.margin?.status] }} />
                            }
                            <Typography variant="caption" color="text.secondary">
                                Margem Bruta
                            </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ color: STATUS_COLORS[kpis?.margin?.status] || '#333', fontWeight: 'bold' }}>
                            {kpis?.margin?.current || 0}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Meta: {kpis?.margin?.target}%
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(kpis?.margin?.achievement_percent || 0, 100)}
                            sx={{
                                mt: 1,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: STATUS_COLORS[kpis?.margin?.status] || '#757575'
                                }
                            }}
                        />
                    </Paper>

                    {/* DSO */}
                    <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.95)', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <ScheduleIcon sx={{ color: STATUS_COLORS[kpis?.dso?.status] || '#757575' }} />
                            <Typography variant="caption" color="text.secondary">
                                DSO (Dias p/ Receber)
                            </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ color: STATUS_COLORS[kpis?.dso?.status] || '#333', fontWeight: 'bold' }}>
                            {kpis?.dso?.current || 0}d
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Meta: ≤{kpis?.dso?.target} dias
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(kpis?.dso?.achievement_percent || 0, 100)}
                            sx={{
                                mt: 1,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: STATUS_COLORS[kpis?.dso?.status] || '#757575'
                                }
                            }}
                        />
                    </Paper>
                </Box>

                {/* Summary Row */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 2 }}>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                        <Typography variant="h6" fontWeight="bold">{formatCurrency(summary?.total_revenue)}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Receita</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                        <Typography variant="h6" fontWeight="bold">{formatCurrency(summary?.gross_margin)}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Margem</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                        <Typography variant="h6" fontWeight="bold">{summary?.avg_discount_percent || 0}%</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Desc. Médio</Typography>
                    </Box>
                </Box>

                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', my: 2 }} />

                {/* Risk Distribution Pie Chart */}
                {pieData.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.9 }}>
                            Distribuição de Risco (Vendedores)
                        </Typography>
                        <Box sx={{ height: 150, bgcolor: 'rgba(255,255,255,0.95)', borderRadius: 2, p: 1 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={30}
                                        outerRadius={50}
                                        dataKey="value"
                                        label={({ name, value }) => `${value}`}
                                        labelLine={false}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend
                                        wrapperStyle={{ fontSize: '10px' }}
                                        formatter={(value) => <span style={{ color: '#333' }}>{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </Box>
                )}

                {/* Blocked Credits */}
                {blockedCredits.length > 0 && (
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.9, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BlockIcon sx={{ fontSize: 16 }} />
                            Créditos Bloqueados ({blockedCredits.length})
                        </Typography>
                        <Paper sx={{ bgcolor: 'rgba(255,255,255,0.95)', borderRadius: 2 }}>
                            <List dense disablePadding>
                                {blockedCredits.slice(0, 3).map((customer, idx) => (
                                    <ListItem key={idx} sx={{ py: 0.5 }}>
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <WarningIcon sx={{ color: customer.overdue_days > 30 ? '#f44336' : '#ff9800', fontSize: 18 }} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={customer.customer_name}
                                            secondary={
                                                customer.overdue_days > 0
                                                    ? `${customer.overdue_days} dias de atraso`
                                                    : 'Limite excedido'
                                            }
                                            primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                                            secondaryTypographyProps={{ variant: 'caption' }}
                                        />
                                        <Chip
                                            label={formatCurrency(customer.credit_used)}
                                            size="small"
                                            sx={{ fontSize: '0.65rem' }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Box>
                )}

                {/* Alerts */}
                {alerts && alerts.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                        {alerts.slice(0, 2).map((alert, idx) => (
                            <Alert
                                key={idx}
                                severity={alert.severity === 'CRITICAL' ? 'error' : 'warning'}
                                sx={{ mb: 1, py: 0 }}
                                icon={<WarningIcon sx={{ fontSize: 18 }} />}
                            >
                                <Typography variant="caption">{alert.message}</Typography>
                            </Alert>
                        ))}
                    </Box>
                )}
            </Collapse>
        </Paper>
    );
}
