import { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Button,
    Skeleton,
    IconButton,
    Tooltip,
    useTheme,
    Chip,
    Divider
} from '@mui/material';
import {
    AddShoppingCart as AddIcon,
    AutoGraph as TrendIcon,
    Star as StarIcon,
    Loop as RepeatIcon
} from '@mui/icons-material';
import aiService from '../services/ai.service';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

function RecommendationsWidget({ customerId, onAddProduct }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();

    useEffect(() => {
        async function loadRecommendations() {
            try {
                setLoading(true);
                const response = await aiService.getRecommendations({ customerId });
                if (response.success) {
                    setData(response.data);
                }
            } catch (err) {
                console.error('Erro ao carregar recomendações:', err);
            } finally {
                setLoading(false);
            }
        }
        if (customerId) loadRecommendations();
    }, [customerId]);

    const renderProduct = (product, type = 'cross_sell') => (
        <Card
            key={product.id || product.productId}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[4] },
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2
            }}
        >
            <Box sx={{ p: 2, pb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Chip
                    label={type === 'replenishment' ? 'Reposição' : 'Sugestão'}
                    size="small"
                    color={type === 'replenishment' ? 'primary' : 'secondary'}
                    variant="outlined"
                    sx={{ fontSize: '0.65rem', height: 20 }}
                />
                {type === 'replenishment' && (
                    <Tooltip title={`Comprado ${product.orders_count} vezes`}>
                        <RepeatIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                    </Tooltip>
                )}
            </Box>
            <CardContent sx={{ flexGrow: 1, pt: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    {product.productCode || product.codigo}
                </Typography>
                <Typography variant="body2" fontWeight="bold" sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    minHeight: 40
                }}>
                    {product.productName || product.descricao}
                </Typography>
                <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                    {formatCurrency(product.preco_venda || 0)}
                </Typography>
            </CardContent>
            <Box sx={{ p: 1.5, pt: 0 }}>
                <Button
                    variant="contained"
                    fullWidth
                    size="small"
                    startIcon={<AddIcon fontSize="small" />}
                    onClick={() => onAddProduct && onAddProduct(product)}
                >
                    Adicionar
                </Button>
            </Box>
        </Card>
    );

    if (loading) {
        return (
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>Gerando recomendações IA...</Typography>
                <Grid container spacing={2}>
                    {[1, 2, 3].map(i => (
                        <Grid item xs={12} sm={4} key={i}>
                            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    if (!data || (data.replenishment.length === 0 && data.cross_sell.length === 0 && !data.ai_next_best_action)) return null;

    return (
        <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                    Recomendações Inteligentes
                </Typography>
            </Box>

            {/* AI Next Best Action - Feature 4C */}
            {data.ai_next_best_action && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        mb: 4,
                        background: theme.palette.mode === 'dark'
                            ? 'linear-gradient(135deg, rgba(25, 118, 210, 0.2) 0%, rgba(0, 0, 0, 0.4) 100%)'
                            : 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(255, 255, 255, 1) 100%)',
                        border: `1px solid ${theme.palette.primary.main}44`,
                        borderRadius: 4,
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <Box sx={{ position: 'absolute', top: 0, right: 0, p: 2, opacity: 0.1 }}>
                        <StarIcon sx={{ fontSize: 80, color: theme.palette.primary.main }} />
                    </Box>

                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={8}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Chip
                                    label="NEXT BEST ACTION"
                                    color="primary"
                                    size="small"
                                    fontWeight="bold"
                                    sx={{ borderRadius: 1, height: 20, fontSize: '0.65rem' }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    powered by <strong>4C Intelligence</strong>
                                </Typography>
                            </Box>

                            <Typography variant="h5" fontWeight="bold" gutterBottom>
                                {data.ai_next_best_action.offer_name || data.ai_next_best_action.name}
                            </Typography>

                            <Typography variant="body1" sx={{ color: 'text.secondary', fontStyle: 'italic', mb: 2 }}>
                                "{data.ai_next_best_action.justification}"
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Typography variant="h4" color="primary" fontWeight="bold">
                                    {formatCurrency(data.ai_next_best_action.suggested_price || data.ai_next_best_action.price)}
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => onAddProduct && onAddProduct(data.ai_next_best_action)}
                                    sx={{ borderRadius: 2, px: 4 }}
                                >
                                    Fazer Oferta Agora
                                </Button>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                    CANAL SUGERIDO
                                </Typography>
                                <Chip
                                    label={data.ai_next_best_action.suggested_channel || "WhatsApp"}
                                    variant="outlined"
                                    color="success"
                                    sx={{ fontWeight: 'bold' }}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {data.replenishment.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <RepeatIcon fontSize="inherit" /> PRODUTOS PARA REPOSIÇÃO
                    </Typography>
                    <Grid container spacing={2}>
                        {data.replenishment.map(p => (
                            <Grid item xs={12} sm={4} md={2.4} key={p.productId}>
                                {renderProduct(p, 'replenishment')}
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {data.cross_sell.length > 0 && (
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <StarIcon fontSize="inherit" /> TALVEZ O CLIENTE TENHA INTERESSE
                    </Typography>
                    <Grid container spacing={2}>
                        {data.cross_sell.map(p => (
                            <Grid item xs={12} sm={4} md={2.4} key={p.id}>
                                {renderProduct(p, 'cross_sell')}
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
        </Box>
    );
}

export default RecommendationsWidget;
