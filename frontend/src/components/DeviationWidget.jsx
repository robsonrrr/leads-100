import { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    Chip,
    CircularProgress,
    LinearProgress,
    Tooltip,
    useTheme
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Warning as WarningIcon,
    CheckCircle as CheckIcon
} from '@mui/icons-material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    ResponsiveContainer,
    CartesianGrid,
    ReferenceLine,
    Cell
} from 'recharts';
import aiService from '../services/ai.service';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value);
};

function DeviationWidget() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                const response = await aiService.getDeviation({ days: 7 });
                if (response.success) {
                    setData(response.data);
                }
            } catch (err) {
                console.error('Erro ao carregar desvio:', err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) {
        return (
            <Paper sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <CircularProgress size={30} />
            </Paper>
        );
    }

    if (!data || data.daily_analysis.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Sem dados de comparação disponíveis.</Typography>
            </Paper>
        );
    }

    const deviation = data.overall_deviation_percent;
    const isPositive = deviation >= 0;
    const isAlert = Math.abs(deviation) > 20;

    // Preparar dados para o gráfico
    const chartData = data.daily_analysis.map(d => ({
        date: new Date(d.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
        actual: d.actual_value,
        expected: d.expected_value,
        deviation: d.deviation_percent
    }));

    return (
        <Paper
            sx={{
                p: 3,
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${isAlert ? '#1a0a0a' : '#0a1a15'} 100%)`,
                border: `1px solid ${isAlert ? theme.palette.error.dark : theme.palette.divider}`,
                borderRadius: 3
            }}
        >
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    📊 Previsto vs Realizado
                </Typography>
                <Chip
                    icon={isAlert ? <WarningIcon fontSize="small" /> : <CheckIcon fontSize="small" />}
                    label={isAlert ? 'Atenção' : 'Normal'}
                    size="small"
                    color={isAlert ? 'warning' : 'success'}
                    variant="outlined"
                />
            </Box>

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Previsto ({data.period_days}d)</Typography>
                    <Typography variant="h6" fontWeight="bold">{formatCurrency(data.total_expected)}</Typography>
                </Box>
                <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Realizado</Typography>
                    <Typography variant="h6" fontWeight="bold" color={isPositive ? 'success.main' : 'error.main'}>
                        {formatCurrency(data.total_actual)}
                    </Typography>
                </Box>
                <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Desvio</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        {isPositive ? <TrendingUpIcon color="success" fontSize="small" /> : <TrendingDownIcon color="error" fontSize="small" />}
                        <Typography
                            variant="h6"
                            fontWeight="bold"
                            color={isPositive ? 'success.main' : 'error.main'}
                        >
                            {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Chart */}
            <Box sx={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => formatCurrency(v)}
                        />
                        <Bar dataKey="actual" name="Realizado" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.deviation >= 0 ? theme.palette.success.main : theme.palette.error.main}
                                    opacity={0.8}
                                />
                            ))}
                        </Bar>
                        <ReferenceLine
                            y={data.total_expected / data.period_days}
                            stroke={theme.palette.warning.main}
                            strokeDasharray="5 5"
                            label={{ value: 'Meta', fill: theme.palette.warning.main, fontSize: 10 }}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </Box>

            {/* Progress Bar */}
            <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Progresso vs Meta</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {((data.total_actual / data.total_expected) * 100).toFixed(0)}%
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={Math.min((data.total_actual / data.total_expected) * 100, 100)}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '& .MuiLinearProgress-bar': {
                            bgcolor: isPositive ? theme.palette.success.main : theme.palette.warning.main,
                            borderRadius: 4
                        }
                    }}
                />
            </Box>
        </Paper>
    );
}

export default DeviationWidget;
