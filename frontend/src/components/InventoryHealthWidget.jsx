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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Button
} from '@mui/material';
import {
    Inventory as InventoryIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
    Refresh as RefreshIcon,
    Warning as WarningIcon,
    Speed as SpeedIcon,
    TrendingDown as TrendingDownIcon,
    LocalOffer as BundleIcon,
    Add as AddIcon,
    ShoppingCart as CartIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { analyticsV2Service } from '../services/api';

const STATUS_COLORS = {
    'ON_TARGET': '#4caf50',
    'WARNING': '#ff9800',
    'CRITICAL': '#f44336'
};

const SEVERITY_COLORS = {
    'S1': '#90caf9',
    'S2': '#64b5f6',
    'S3': '#ffb74d',
    'S4': '#ff8a65',
    'S5': '#ef5350'
};

/**
 * Widget de Saúde do Inventário
 * Bloco 3 - Gestão de Estoque (COO)
 * 
 * KPIs:
 * - Giro >= 6x/ano
 * - BAIXO_GIRO < 15%
 * - Rupturas S4-S5 = 0
 */
export default function InventoryHealthWidget() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [bundles, setBundles] = useState([]);
    const [expanded, setExpanded] = useState(true);
    const [showAlerts, setShowAlerts] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [overviewResponse, bundlesResponse] = await Promise.all([
                analyticsV2Service.getInventoryOverview(),
                analyticsV2Service.getBundleSuggestions({ limit: 5 })
            ]);

            if (overviewResponse.data?.success) {
                setData(overviewResponse.data.data);
            } else {
                setError('Erro ao carregar dados');
            }

            if (bundlesResponse.data?.success) {
                setBundles(bundlesResponse.data.data?.bundles || []);
            }
        } catch (err) {
            setError(err.message || 'Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLeadWithBundle = (bundle) => {
        // Navigate to new lead page with bundle products pre-selected
        navigate('/leads/new', {
            state: {
                bundleProducts: [
                    { id: bundle.low_turn_product.id, sku: bundle.low_turn_product.sku, name: bundle.low_turn_product.name, price: bundle.low_turn_product.price },
                    { id: bundle.complement_product.id, sku: bundle.complement_product.sku, name: bundle.complement_product.name, price: bundle.complement_product.price }
                ],
                suggestedDiscount: bundle.suggested_discount_percent,
                bundleId: bundle.bundle_id
            }
        });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatNumber = (num) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
        return num?.toLocaleString('pt-BR') || '0';
    };

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
                <Alert severity="error">{error}</Alert>
            </Paper>
        );
    }

    const { kpis, overall_status, totals, by_status, by_action, low_turn } = data || {};

    return (
        <Paper
            sx={{
                p: 2,
                height: '100%',
                background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
                color: 'white'
            }}
        >
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InventoryIcon />
                    <Typography variant="h6">Saúde do Inventário</Typography>
                    <Chip
                        label="Máquinas"
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
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 2 }}>
                    {/* Giro Anual */}
                    <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.95)', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <SpeedIcon sx={{ color: STATUS_COLORS[kpis?.giro_anual?.status] || '#757575' }} />
                            <Typography variant="caption" color="text.secondary">
                                Giro Anual
                            </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ color: STATUS_COLORS[kpis?.giro_anual?.status] || '#333', fontWeight: 'bold' }}>
                            {kpis?.giro_anual?.current?.toFixed(1) || 0}x
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Meta: {kpis?.giro_anual?.target}x/ano
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(kpis?.giro_anual?.achievement_percent || 0, 100)}
                            sx={{
                                mt: 1,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: STATUS_COLORS[kpis?.giro_anual?.status] || '#757575'
                                }
                            }}
                        />
                    </Paper>

                    {/* Low Turn % */}
                    <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.95)', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <TrendingDownIcon sx={{ color: STATUS_COLORS[kpis?.low_turn_percent?.status] || '#757575' }} />
                            <Typography variant="caption" color="text.secondary">
                                Baixo Giro
                            </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ color: STATUS_COLORS[kpis?.low_turn_percent?.status] || '#333', fontWeight: 'bold' }}>
                            {kpis?.low_turn_percent?.current || 0}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Meta: &lt;{kpis?.low_turn_percent?.target}%
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(kpis?.low_turn_percent?.achievement_percent || 0, 100)}
                            sx={{
                                mt: 1,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: STATUS_COLORS[kpis?.low_turn_percent?.status] || '#757575'
                                }
                            }}
                        />
                    </Paper>

                    {/* Rupturas Críticas */}
                    <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.95)', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <WarningIcon sx={{ color: STATUS_COLORS[kpis?.critical_ruptures?.status] || '#757575' }} />
                            <Typography variant="caption" color="text.secondary">
                                Rupturas S4-S5
                            </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ color: STATUS_COLORS[kpis?.critical_ruptures?.status] || '#333', fontWeight: 'bold' }}>
                            {kpis?.critical_ruptures?.current || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Meta: 0 rupturas críticas
                        </Typography>
                        <Box sx={{
                            mt: 1,
                            height: 6,
                            borderRadius: 3,
                            bgcolor: kpis?.critical_ruptures?.current === 0 ? '#4caf50' : '#f44336'
                        }} />
                    </Paper>
                </Box>

                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', my: 2 }} />

                {/* Resumo do Estoque */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, mb: 2 }}>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                        <Typography variant="h5" fontWeight="bold">{totals?.skus || 0}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>SKUs</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                        <Typography variant="h5" fontWeight="bold">{formatNumber(totals?.units)}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Unidades</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                        <Typography variant="h5" fontWeight="bold">{formatCurrency(totals?.value_fob)}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Valor FOB</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                        <Typography variant="h5" fontWeight="bold">{totals?.coverage_days_avg || 0}d</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Cobertura Média</Typography>
                    </Box>
                </Box>

                {/* Status de Estoque */}
                <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.9 }}>
                    Distribuição por Status
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {by_status?.map((item, idx) => (
                        <Chip
                            key={idx}
                            label={`${item.status}: ${item.products}`}
                            size="small"
                            sx={{
                                bgcolor: item.status === 'Adequado' ? 'rgba(76,175,80,0.3)' :
                                    item.status === 'Excesso' ? 'rgba(255,152,0,0.3)' :
                                        item.status === 'Baixo' || item.status === 'Crítico' ? 'rgba(244,67,54,0.3)' :
                                            'rgba(255,255,255,0.2)',
                                color: 'white',
                                fontSize: '0.7rem'
                            }}
                        />
                    ))}
                </Box>

                {/* Low Turn Summary */}
                {low_turn && low_turn.products > 0 && (
                    <Alert
                        severity={low_turn.percent_of_stock > 15 ? 'error' : 'warning'}
                        icon={<TrendingDownIcon />}
                        sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.9)' }}
                    >
                        <Typography variant="body2">
                            <strong>{low_turn.products}</strong> produtos ({low_turn.percent_of_stock}%) com cobertura &gt;90 dias.
                            Valor: {formatCurrency(low_turn.value_fob)}
                        </Typography>
                    </Alert>
                )}

                {/* Ações Sugeridas */}
                <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.9 }}>
                    Top Ações Sugeridas
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {by_action?.filter(a => a.priority >= 3).slice(0, 5).map((action, idx) => (
                        <Tooltip key={idx} title={`${action.units} unidades - ${formatCurrency(action.value_fob)}`}>
                            <Chip
                                label={`${action.action}: ${action.products}`}
                                size="small"
                                icon={
                                    action.action?.includes('Ruptura') || action.action?.includes('Urgente')
                                        ? <WarningIcon sx={{ fontSize: 14, color: '#fff !important' }} />
                                        : undefined
                                }
                                sx={{
                                    bgcolor: action.priority >= 4 ? 'rgba(244,67,54,0.8)' :
                                        action.priority >= 3 ? 'rgba(255,152,0,0.8)' :
                                            'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    fontSize: '0.7rem'
                                }}
                            />
                        </Tooltip>
                    ))}
                </Box>

                {/* Bundles Sugeridos do Dia */}
                {bundles.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', my: 2 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <BundleIcon sx={{ fontSize: 18 }} />
                            <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                                Bundles Sugeridos ({bundles.length})
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {bundles.slice(0, 3).map((bundle, idx) => (
                                <Paper
                                    key={idx}
                                    sx={{
                                        p: 1.5,
                                        bgcolor: 'rgba(255,255,255,0.95)',
                                        borderRadius: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" fontWeight="bold" color="text.primary" noWrap>
                                            {bundle.low_turn_product?.sku} + {bundle.complement_product?.sku}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Economia: {formatCurrency(bundle.customer_savings)} ({bundle.suggested_discount_percent}% desc.)
                                        </Typography>
                                    </Box>
                                    <Tooltip title="Criar lead com este bundle">
                                        <Button
                                            size="small"
                                            variant="contained"
                                            color="success"
                                            startIcon={<CartIcon sx={{ fontSize: 16 }} />}
                                            onClick={() => handleCreateLeadWithBundle(bundle)}
                                            sx={{
                                                minWidth: 'auto',
                                                px: 1.5,
                                                fontSize: '0.7rem',
                                                textTransform: 'none'
                                            }}
                                        >
                                            Lead
                                        </Button>
                                    </Tooltip>
                                </Paper>
                            ))}
                        </Box>
                    </Box>
                )}
            </Collapse>
        </Paper>
    );
}
