import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActionArea,
    Button,
    Alert,
    CircularProgress,
    Chip,
    Divider,
    Paper,
} from '@mui/material';
import {
    Storefront as BrandsIcon,
    People as ProfilesIcon,
    Layers as TiersIcon,
    Percent as DiscountIcon,
    Inventory as BundlesIcon,
    LocalOffer as FixedPriceIcon,
    Campaign as PromotionsIcon,
    Science as TestIcon,
    CheckCircle as HealthyIcon,
    Error as UnhealthyIcon,
    ArrowBack as BackIcon,
    Dashboard as DashboardIcon,
} from '@mui/icons-material';
import * as pricingAdminService from '../../../services/pricingAdmin.service';

// Configuração dos cards do dashboard
const DASHBOARD_SECTIONS = [
    {
        title: 'Configurações de Estrutura',
        items: [
            {
                id: 'brands',
                title: 'Marcas',
                description: 'Gerenciar marcas e seus papéis no pricing',
                icon: BrandsIcon,
                path: '/admin/pricing/brands',
                color: '#3b82f6',
            },
            {
                id: 'profiles',
                title: 'Perfis Cliente-Marca',
                description: 'Associação de comportamentos de preço por perfil',
                icon: ProfilesIcon,
                path: '/admin/pricing/profiles',
                color: '#8b5cf6',
            },
            {
                id: 'tiers',
                title: 'Tiers de Volume',
                description: 'Níveis de desconto baseados em volume',
                icon: TiersIcon,
                path: '/admin/pricing/tiers',
                color: '#06b6d4',
            },
            {
                id: 'factors',
                title: 'Fatores de Ajuste',
                description: 'Curva ABC e Níveis de Estoque',
                icon: TiersIcon, // Using TiersIcon, could import a different one
                path: '/admin/pricing/factors',
                color: '#f59e0b',
            },
        ],
    },
    {
        title: 'Regras de Desconto',
        items: [
            {
                id: 'quantity-discounts',
                title: 'Descontos por Quantidade (D4Q)',
                description: 'Descontos escalonados por quantidade comprada',
                icon: DiscountIcon,
                path: '/admin/pricing/quantity-discounts',
                color: '#10b981',
            },
            {
                id: 'value-discounts',
                title: 'Descontos por Valor (D4P)',
                description: 'Descontos escalonados por valor do pedido',
                icon: DiscountIcon,
                path: '/admin/pricing/value-discounts',
                color: '#8b5cf6',
            },
            {
                id: 'bundles',
                title: 'Combos / Bundles',
                description: 'Configurar kits de produtos com preços especiais',
                icon: BundlesIcon,
                path: '/admin/pricing/bundles',
                color: '#f59e0b',
            },
        ],
    },
    {
        title: 'Acordos e Promoções',
        items: [
            {
                id: 'fixed-prices',
                title: 'Preços Fixos',
                description: 'Gerenciar preços específicos por cliente/produto',
                icon: FixedPriceIcon,
                path: '/admin/pricing/fixed-prices',
                color: '#ef4444',
            },
            {
                id: 'promotions',
                title: 'Promoções',
                description: 'Gerenciar promoções por segmento',
                icon: PromotionsIcon,
                path: '/admin/pricing/promotions',
                color: '#ec4899',
            },
            {
                id: 'launch-products',
                title: 'Produtos em Lançamento',
                description: 'Proteção de margem para novos produtos',
                icon: PromotionsIcon,
                path: '/admin/pricing/launch-products',
                color: '#14b8a6',
            },
            {
                id: 'regional-protection',
                title: 'Proteção Regional',
                description: 'Regras de preço por região/estado',
                icon: PromotionsIcon,
                path: '/admin/pricing/regional-protection',
                color: '#0ea5e9',
            },
            {
                id: 'last-price-rules',
                title: 'Ancoragem de Preço',
                description: 'Limites baseados no último preço praticado',
                icon: PromotionsIcon,
                path: '/admin/pricing/last-price-rules',
                color: '#a855f7',
            },
        ],
    },
    {
        title: 'Ferramentas',
        items: [
            {
                id: 'test',
                title: 'Teste de Precificação',
                description: 'Simular o motor de pricing em diferentes cenários',
                icon: TestIcon,
                path: '/admin/pricing/test',
                color: '#6366f1',
            },
        ],
    },
];

function PricingDashboard() {
    const navigate = useNavigate();
    const [apiHealth, setApiHealth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkApiHealth();
    }, []);

    const checkApiHealth = async () => {
        try {
            const response = await pricingAdminService.checkHealth();
            setApiHealth(response.data);
        } catch (error) {
            setApiHealth({ pricingApi: 'unhealthy', error: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (path) => {
        navigate(path);
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <Button
                    startIcon={<BackIcon />}
                    onClick={() => navigate('/admin')}
                    variant="outlined"
                    size="small"
                >
                    Voltar ao Admin
                </Button>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DashboardIcon sx={{ fontSize: 32 }} />
                        Pricing Admin
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gerenciamento de regras de precificação e promoções
                    </Typography>
                </Box>
                {/* API Health Status */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 1.5,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        bgcolor: apiHealth?.pricingApi === 'healthy' ? 'success.light' : 'error.light',
                    }}
                >
                    {loading ? (
                        <CircularProgress size={20} />
                    ) : apiHealth?.pricingApi === 'healthy' ? (
                        <>
                            <HealthyIcon sx={{ color: 'success.dark' }} />
                            <Typography variant="body2" fontWeight="medium" sx={{ color: 'success.dark' }}>
                                API Conectada
                            </Typography>
                        </>
                    ) : (
                        <>
                            <UnhealthyIcon sx={{ color: 'error.dark' }} />
                            <Typography variant="body2" fontWeight="medium" sx={{ color: 'error.dark' }}>
                                API Offline
                            </Typography>
                        </>
                    )}
                </Paper>
            </Box>

            {/* Alert se API offline */}
            {!loading && apiHealth?.pricingApi !== 'healthy' && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                        <strong>Atenção:</strong> A API do Pricing Agent não está disponível.
                        Algumas funcionalidades podem não funcionar corretamente.
                        {apiHealth?.error && ` (${apiHealth.error})`}
                    </Typography>
                </Alert>
            )}

            {/* Dashboard Sections */}
            {DASHBOARD_SECTIONS.map((section, sectionIndex) => (
                <Box key={section.title} sx={{ mb: 4 }}>
                    <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{ mb: 2, color: 'text.secondary' }}
                    >
                        {section.title}
                    </Typography>
                    <Grid container spacing={2}>
                        {section.items.map((item) => {
                            const IconComponent = item.icon;
                            return (
                                <Grid item xs={12} sm={6} md={4} key={item.id}>
                                    <Card
                                        elevation={2}
                                        sx={{
                                            height: '100%',
                                            transition: 'all 0.2s ease-in-out',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: 6,
                                            },
                                        }}
                                    >
                                        <CardActionArea
                                            onClick={() => handleCardClick(item.path)}
                                            sx={{ height: '100%' }}
                                        >
                                            <CardContent sx={{ height: '100%' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                                    <Box
                                                        sx={{
                                                            p: 1.5,
                                                            borderRadius: 2,
                                                            bgcolor: `${item.color}20`,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        <IconComponent sx={{ fontSize: 32, color: item.color }} />
                                                    </Box>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                                                            {item.title}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {item.description}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </CardActionArea>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                    {sectionIndex < DASHBOARD_SECTIONS.length - 1 && (
                        <Divider sx={{ mt: 4 }} />
                    )}
                </Box>
            ))}

            {/* Quick Actions */}
            <Paper elevation={1} sx={{ p: 3, mt: 4, borderRadius: 2, bgcolor: 'grey.50' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Ações Rápidas
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        startIcon={<TestIcon />}
                        onClick={() => navigate('/admin/pricing/test')}
                        sx={{ bgcolor: '#6366f1' }}
                    >
                        Testar Precificação
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<BrandsIcon />}
                        onClick={() => navigate('/admin/pricing/brands')}
                    >
                        Gerenciar Marcas
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<BundlesIcon />}
                        onClick={() => navigate('/admin/pricing/bundles')}
                    >
                        Configurar Bundles
                    </Button>
                </Box>
            </Paper>

            {/* Info Footer */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    Este painel é integrado com o Pricing Agent externo.
                    Alterações são sincronizadas em tempo real.
                </Typography>
            </Box>
        </Box>
    );
}

export default PricingDashboard;
