import { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    CircularProgress,
    useTheme,
    Card,
    CardContent,
    Grid,
    Tooltip as MuiTooltip
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import aiService from '../services/ai.service';
import { formatCurrency } from '../utils';

function ForecastWidget({ sellerId, segment }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();

    useEffect(() => {
        const loadForecast = async () => {
            try {
                setLoading(true);
                const response = await aiService.getForecast({
                    sellerId,
                    segment,
                    days: 30
                });
                if (response.success) {
                    setData(response.data);
                }
            } catch (err) {
                console.error('Erro ao carregar forecast:', err);
            } finally {
                setLoading(false);
            }
        };

        loadForecast();
    }, [sellerId, segment]);

    if (loading) {
        return (
            <Paper sx={{ p: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={24} />
            </Paper>
        );
    }

    if (!data || !data.forecast || data.forecast.length === 0) {
        return null; // Ocultar se não houver dados
    }

    // Formatar dados para o gráfico
    const chartData = data.forecast.map(item => ({
        day: item.date.split('-')[2],
        fullDate: item.date,
        value: item.predicted_value
    }));

    const totalPredicted = data.forecast.reduce((sum, d) => sum + d.predicted_value, 0);

    return (
        <Card sx={{
            height: '100%',
            background: theme.palette.mode === 'dark'
                ? 'rgba(30, 30, 30, 0.6)'
                : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            borderRadius: 3,
            overflow: 'hidden'
        }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TrendingUpIcon color="primary" />
                            <Typography variant="h6" fontWeight="bold">Previsão de Vendas (30d)</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            Baseado em histórico e sazonalidade recente
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h5" color="primary" fontWeight="bold">
                            {formatCurrency(totalPredicted)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: data.growth_rate >= 1 ? 'success.main' : 'warning.main', fontWeight: 'bold' }}>
                            {data.growth_rate >= 1 ? '+' : ''}{((data.growth_rate - 1) * 100).toFixed(1)}% vs mês ant.
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ height: 200, width: '100%', mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                            />
                            <YAxis
                                hide
                            />
                            <RechartsTooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <Paper sx={{ p: 1, boxShadow: 2, border: `1px solid ${theme.palette.divider}` }}>
                                                <Typography variant="caption" display="block">{payload[0].payload.fullDate}</Typography>
                                                <Typography variant="body2" fontWeight="bold" color="primary">
                                                    {formatCurrency(payload[0].value)}
                                                </Typography>
                                            </Paper>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={theme.palette.primary.main}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </Box>
            </CardContent>
        </Card>
    );
}

export default ForecastWidget;
