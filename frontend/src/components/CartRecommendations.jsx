import { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    Button,
    Skeleton,
    useTheme,
    Chip
} from '@mui/material';
import {
    AddShoppingCart as AddIcon,
    AutoAwesome as RecommendationIcon
} from '@mui/icons-material';
import aiService from '../services/ai.service';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

function CartRecommendations({ items, onAddProduct }) {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const theme = useTheme();

    useEffect(() => {
        async function loadCartRecommendations() {
            if (!items || items.length === 0) return;

            try {
                setLoading(true);
                const productIds = items.map(item => item.productId || item.id_produto).join(',');
                const response = await aiService.getRecommendations({ cartItems: productIds });

                if (response.success) {
                    setRecommendations(response.data);
                }
            } catch (err) {
                console.error('Erro ao carregar recomendações do carrinho:', err);
            } finally {
                setLoading(false);
            }
        }

        loadCartRecommendations();
    }, [items]);

    if (!loading && recommendations.length === 0) return null;

    return (
        <Paper sx={{ p: 3, mt: 3, borderRadius: 3, bgcolor: '#0a1a1f' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <RecommendationIcon sx={{ color: '#4fc3f7' }} />
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff' }}>
                    Comprados Frequentemente Juntos
                </Typography>
                <Chip label="IA sugere" size="small" color="secondary" variant="outlined" />
            </Box>

            {loading ? (
                <Grid container spacing={2}>
                    {[1, 2, 3].map(i => (
                        <Grid item xs={12} sm={4} key={i}>
                            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Grid container spacing={2}>
                    {recommendations.map(product => (
                        <Grid item xs={12} sm={4} key={product.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    bgcolor: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' }
                                }}
                            >
                                <CardContent sx={{ p: 2 }}>
                                    <Typography variant="caption" sx={{ color: '#4fc3f7' }} fontWeight="bold">
                                        {product.codigo}
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold" noWrap title={product.descricao} sx={{ color: '#fff' }}>
                                        {product.descricao}
                                    </Typography>
                                    <Typography variant="h6" sx={{ mt: 1, color: '#fff' }}>
                                        {formatCurrency(product.preco_venda)}
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        size="small"
                                        startIcon={<AddIcon fontSize="small" />}
                                        onClick={() => onAddProduct && onAddProduct(product)}
                                        sx={{ mt: 1, color: '#4fc3f7', borderColor: '#4fc3f7' }}
                                    >
                                        Adicionar
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Paper>
    );
}

export default CartRecommendations;
