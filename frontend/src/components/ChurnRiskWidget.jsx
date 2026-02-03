import { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    LinearProgress,
    Tooltip,
    IconButton,
    useTheme,
    Chip,
    CircularProgress
} from '@mui/material';
import {
    HelpOutline as HelpIcon,
    Warning as WarningIcon,
    Error as CriticalIcon,
    CheckCircle as LowIcon,
    TrendingDown as DownIcon,
    TrendingUp as UpIcon
} from '@mui/icons-material';
import aiService from '../services/ai.service';

function ChurnRiskWidget({ customerId }) {
    const [risk, setRisk] = useState(null);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();

    useEffect(() => {
        async function loadRisk() {
            try {
                setLoading(true);
                const response = await aiService.getChurnRisk(customerId);
                if (response.success && response.data) {
                    setRisk(response.data);
                }
            } catch (err) {
                console.error('Erro ao carregar risco de churn:', err);
            } finally {
                setLoading(false);
            }
        }
        if (customerId) loadRisk();
    }, [customerId]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={20} /></Box>;
    if (!risk || typeof risk.score === 'undefined') return null;

    const getRiskConfig = (level) => {
        switch (level) {
            case 'CRITICAL': return { color: theme.palette.error.main, label: 'CRÍTICO', icon: <CriticalIcon color="error" /> };
            case 'HIGH': return { color: theme.palette.warning.dark, label: 'ALTO', icon: <WarningIcon sx={{ color: theme.palette.warning.dark }} /> };
            case 'MEDIUM': return { color: theme.palette.warning.main, label: 'MÉDIO', icon: <WarningIcon color="warning" /> };
            default: return { color: theme.palette.success.main, label: 'BAIXO', icon: <LowIcon color="success" /> };
        }
    };

    const config = getRiskConfig(risk.risk_level);
    const trendIcon = risk.avg_ticket_variation < 0 ? <DownIcon color="error" fontSize="small" /> : <UpIcon color="success" fontSize="small" />;

    return (
        <Paper sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                        RISCO DE CHURN (IA)
                    </Typography>
                    <Tooltip title="Baseado em recência, variação de faturamento e engajamento.">
                        <HelpIcon sx={{ fontSize: 16, color: 'text.disabled', cursor: 'pointer' }} />
                    </Tooltip>
                </Box>
                <Chip
                    label={config.label}
                    size="small"
                    sx={{
                        bgcolor: `${config.color}20`,
                        color: config.color,
                        fontWeight: 'bold',
                        border: `1px solid ${config.color}40`
                    }}
                />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 1 }}>
                <Typography variant="h4" fontWeight="bold">
                    {Math.round(risk.score)}%
                </Typography>
                <Box sx={{ flex: 1 }}>
                    <LinearProgress
                        variant="determinate"
                        value={Number(risk.score) || 0}
                        sx={{
                            height: 8,
                            borderRadius: 5,
                            bgcolor: theme.palette.action.hover,
                            '& .MuiLinearProgress-bar': {
                                bgcolor: config.color
                            }
                        }}
                    />
                </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Última compra: <strong>{risk.days_since_last_order} dias</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Tendência: {trendIcon} <strong>{risk.avg_ticket_variation < 0 ? '' : '+'}{(risk.avg_ticket_variation * 100).toFixed(0)}%</strong>
                </Typography>
            </Box>
        </Paper>
    );
}

export default ChurnRiskWidget;
