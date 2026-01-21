import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    Grid,
    CircularProgress,
    Alert,
    Chip,
    IconButton,
    LinearProgress,
    Divider,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Tooltip
} from '@mui/material';
import {
    SmartToy as AIIcon,
    Refresh as RefreshIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Warning as WarningIcon,
    CheckCircle as CheckIcon,
    Analytics as AnalyticsIcon,
    Psychology as PsychologyIcon,
    Timeline as TimelineIcon,
    AutoGraph as AutoGraphIcon
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend,
    ReferenceLine,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { analyticsV2Service } from '../services/api';

const STATUS_COLORS = {
    'ON_TARGET': '#4caf50',
    'WARNING': '#ff9800',
    'CRITICAL': '#f44336'
};

const MODEL_ICONS = {
    recommendations: <AutoGraphIcon />,
    forecast: <TimelineIcon />,
    churn: <PsychologyIcon />
};

/**
 * AI Governance Page
 * Bloco 5 - Governança de IA (CAIO)
 * 
 * KPIs:
 * - Performance >= 90%
 * - Drift < 5%
 */
export default function AIGovernancePage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [performanceData, setPerformanceData] = useState(null);
    const [driftData, setDriftData] = useState(null);
    const [historyData, setHistoryData] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [perfResponse, driftResponse, historyResponse] = await Promise.all([
                analyticsV2Service.getAIModelPerformance({ days: 30 }),
                analyticsV2Service.getAIDriftDetection({ days: 7 }),
                analyticsV2Service.getAIPerformanceHistory({ days: 90, granularity: 'week' })
            ]);

            if (perfResponse.data?.success) {
                setPerformanceData(perfResponse.data.data);
            }
            if (driftResponse.data?.success) {
                setDriftData(driftResponse.data.data);
            }
            if (historyResponse.data?.success) {
                setHistoryData(historyResponse.data.data);
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

    if (loading) {
        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                    <CircularProgress size={60} />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Alert
                    severity="error"
                    action={
                        <IconButton color="inherit" size="small" onClick={fetchData}>
                            <RefreshIcon />
                        </IconButton>
                    }
                >
                    {error}
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AIIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            Governança de IA
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Monitoramento de Performance e Drift dos Modelos
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                        label={performanceData?.overall_status || 'N/A'}
                        sx={{
                            bgcolor: STATUS_COLORS[performanceData?.overall_status] || '#757575',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            px: 2
                        }}
                    />
                    <IconButton onClick={fetchData} color="primary">
                        <RefreshIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* Overall Score Card */}
            <Paper
                sx={{
                    p: 3,
                    mb: 4,
                    background: 'linear-gradient(135deg, #1a237e 0%, #311b92 100%)',
                    color: 'white'
                }}
            >
                <Grid container spacing={4} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="overline" sx={{ opacity: 0.8 }}>
                                Score Geral de Performance
                            </Typography>
                            <Box sx={{ position: 'relative', display: 'inline-flex', mt: 2 }}>
                                <CircularProgress
                                    variant="determinate"
                                    value={performanceData?.overall_score || 0}
                                    size={120}
                                    thickness={6}
                                    sx={{
                                        color: STATUS_COLORS[performanceData?.overall_status],
                                        '& .MuiCircularProgress-circle': {
                                            strokeLinecap: 'round',
                                        }
                                    }}
                                />
                                <Box
                                    sx={{
                                        top: 0, left: 0, bottom: 0, right: 0,
                                        position: 'absolute',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column'
                                    }}
                                >
                                    <Typography variant="h3" fontWeight="bold">
                                        {performanceData?.overall_score || 0}%
                                    </Typography>
                                </Box>
                            </Box>
                            <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 1 }}>
                                Meta: ≥90%
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="overline" sx={{ opacity: 0.8 }}>
                                Status de Drift
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" sx={{ mt: 2 }}>
                                {driftData?.recommendation === 'HEALTHY' ? '✅ Saudável' :
                                    driftData?.recommendation === 'MONITOR' ? '⚠️ Monitorar' :
                                        '🔴 Re-treino Necessário'}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                {driftData?.drift_count || 0} alertas de drift | Threshold: {driftData?.threshold}%
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" fontWeight="bold" color="success.light">
                                    {performanceData?.summary?.on_target || 0}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.7 }}>Na Meta</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" fontWeight="bold" color="warning.light">
                                    {performanceData?.summary?.warning || 0}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.7 }}>Atenção</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" fontWeight="bold" color="error.light">
                                    {performanceData?.summary?.critical || 0}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.7 }}>Crítico</Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Model Performance Cards */}
            <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AnalyticsIcon />
                Performance por Modelo
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {performanceData?.models && Object.entries(performanceData.models).map(([modelName, modelData]) => (
                    <Grid item xs={12} md={4} key={modelName}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {MODEL_ICONS[modelName] || <AIIcon />}
                                        <Typography variant="h6">{modelData.type}</Typography>
                                    </Box>
                                    <Chip
                                        label={modelData.status}
                                        size="small"
                                        sx={{
                                            bgcolor: STATUS_COLORS[modelData.status],
                                            color: 'white'
                                        }}
                                    />
                                </Box>

                                <Box sx={{ textAlign: 'center', my: 3 }}>
                                    <Typography variant="h2" fontWeight="bold" color={STATUS_COLORS[modelData.status]}>
                                        {modelData.score}%
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Score de Performance
                                    </Typography>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                {/* Metrics */}
                                {modelData.metrics && Object.entries(modelData.metrics).map(([metricName, metricData]) => (
                                    <Box key={metricName} sx={{ mb: 1.5 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="body2" textTransform="uppercase" color="text.secondary">
                                                {metricName.replace('_', ' ')}
                                            </Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                                {metricData.current}{metricData.unit || ''}
                                                {metricData.target && <span style={{ opacity: 0.6 }}> / {metricData.target}{metricData.unit || ''}</span>}
                                            </Typography>
                                        </Box>
                                        {metricData.target && (
                                            <LinearProgress
                                                variant="determinate"
                                                value={Math.min((metricData.current / metricData.target) * 100, 100)}
                                                sx={{
                                                    height: 6,
                                                    borderRadius: 3,
                                                    bgcolor: '#e0e0e0',
                                                    '& .MuiLinearProgress-bar': {
                                                        bgcolor: STATUS_COLORS[metricData.status] || '#2196f3'
                                                    }
                                                }}
                                            />
                                        )}
                                    </Box>
                                ))}

                                {modelData.simulated && (
                                    <Chip label="Dados Simulados" size="small" variant="outlined" sx={{ mt: 1 }} />
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Performance History Chart */}
            {historyData?.history && historyData.history.length > 0 && (
                <Paper sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TimelineIcon />
                        Histórico de Performance (últimos 90 dias)
                    </Typography>
                    <Box sx={{ height: 300, mt: 2 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={historyData.history}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                <YAxis domain={[60, 100]} tick={{ fontSize: 10 }} />
                                <RechartsTooltip />
                                <Legend />
                                <ReferenceLine y={90} stroke="#4caf50" strokeDasharray="5 5" label="Meta 90%" />
                                <Line
                                    type="monotone"
                                    dataKey="overall_score"
                                    name="Score Geral"
                                    stroke="#1976d2"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="recommendations_score"
                                    name="Recomendações"
                                    stroke="#9c27b0"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="forecast_score"
                                    name="Forecast"
                                    stroke="#ff9800"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="churn_score"
                                    name="Churn"
                                    stroke="#00bcd4"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>
            )}

            {/* Drift Alerts */}
            {driftData?.alerts && driftData.alerts.length > 0 && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningIcon color="warning" />
                        Alertas de Drift ({driftData.alerts.length})
                    </Typography>
                    <List>
                        {driftData.alerts.map((alert, idx) => (
                            <ListItem key={idx} sx={{ bgcolor: alert.severity === 'CRITICAL' ? 'error.light' : 'warning.light', borderRadius: 1, mb: 1 }}>
                                <ListItemIcon>
                                    {alert.severity === 'CRITICAL' ?
                                        <TrendingDownIcon color="error" /> :
                                        <WarningIcon color="warning" />
                                    }
                                </ListItemIcon>
                                <ListItemText
                                    primary={alert.message}
                                    secondary={
                                        alert.requires_retraining ?
                                            '⚠️ Re-treinamento sugerido' :
                                            'Monitorar de perto'
                                    }
                                />
                                <Chip
                                    label={`${Math.abs(alert.drift_percent)}% drift`}
                                    color={alert.severity === 'CRITICAL' ? 'error' : 'warning'}
                                    size="small"
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}

            {/* No Drift Alerts */}
            {driftData && (!driftData.alerts || driftData.alerts.length === 0) && (
                <Alert severity="success" icon={<CheckIcon />}>
                    Nenhum drift detectado. Todos os modelos estão dentro dos parâmetros esperados.
                </Alert>
            )}
        </Container>
    );
}
