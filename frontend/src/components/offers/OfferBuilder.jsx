/**
 * OfferBuilder Component
 * 
 * Modal/component for building commercial offers using CSuite Offers Agent.
 * Can be triggered from customer details or lead creation.
 */

import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Chip,
    CircularProgress,
    Alert,
    IconButton,
    Collapse,
    Divider,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    TextField,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Tooltip
} from '@mui/material';
import {
    Build as BuildIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    ContentCopy as CopyIcon,
    WhatsApp as WhatsAppIcon,
    AttachMoney as MoneyIcon,
    CreditScore as CreditIcon,
    Refresh as RefreshIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
    LocalOffer as OfferIcon,
    Inventory as InventoryIcon
} from '@mui/icons-material';
import offersService from '../../services/offers.service';

// Segment options with icons
const SEGMENTS = [
    { code: 'machines', label: 'Máquinas', icon: '🔧' },
    { code: 'parts', label: 'Peças', icon: '⚙️' },
    { code: 'bearings', label: 'Rolamentos', icon: '🔩' },
    { code: 'autoparts', label: 'Autopeças', icon: '🚗' },
    { code: 'motoparts', label: 'Motopeças', icon: '🏍️' }
];

// Goal options with descriptions
const GOALS = [
    { code: 'giro', label: 'Alto Giro', description: 'Produtos com alta velocidade de venda', icon: '🔄', color: '#4CAF50' },
    { code: 'ruptura', label: 'Ruptura', description: 'Itens que o cliente costuma comprar', icon: '📦', color: '#FF9800' },
    { code: 'mix', label: 'Mix', description: 'Aumentar penetração de categorias', icon: '🎯', color: '#2196F3' },
    { code: 'margem', label: 'Margem', description: 'Produtos com maior margem', icon: '💰', color: '#9C27B0' },
    { code: 'campanha', label: 'Campanha', description: 'Itens em promoção', icon: '🏷️', color: '#F44336' },
    { code: 'geral', label: 'Geral', description: 'Mix de estratégias', icon: '📊', color: '#607D8B' }
];

const OfferBuilder = ({
    customerId,
    customerName = '',
    sellerId,
    segment: initialSegment = 'machines',
    onOfferBuilt,
    onClose,
    embedded = false // If true, renders as card instead of modal-style
}) => {
    const [loading, setLoading] = useState(false);
    const [pricingLoading, setPricingLoading] = useState(false);
    const [creditLoading, setCreditLoading] = useState(false);
    const [error, setError] = useState(null);
    const [offer, setOffer] = useState(null);

    // Form state
    const [segment, setSegment] = useState(initialSegment);
    const [goalCode, setGoalCode] = useState('geral');
    const [maxItems, setMaxItems] = useState(10);

    // UI state
    const [showBundles, setShowBundles] = useState(true);
    const [copiedText, setCopiedText] = useState(false);

    // Reset when customer changes
    useEffect(() => {
        setOffer(null);
        setError(null);
    }, [customerId]);

    const handleBuildOffer = async () => {
        if (!customerId) {
            setError('Cliente não selecionado');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await offersService.buildOffer({
                segment,
                customerId,
                sellerId,
                goalCode,
                constraints: { maxItems },
                context: {}
            });

            if (result.success) {
                setOffer(result);
                if (onOfferBuilt) {
                    onOfferBuilt(result);
                }
            } else {
                setError(result.error || 'Erro ao construir oferta');
            }
        } catch (err) {
            console.error('Error building offer:', err);
            setError(err.response?.data?.error || err.message || 'Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    const handlePriceOffer = async () => {
        if (!offer?.offerId) return;

        setPricingLoading(true);
        try {
            const result = await offersService.priceOffer(offer.offerId);
            if (result.success) {
                setOffer(prev => ({
                    ...prev,
                    pricingResult: result
                }));
            } else {
                setError(result.error || 'Erro ao calcular preços');
            }
        } catch (err) {
            setError(err.message || 'Erro ao calcular preços');
        } finally {
            setPricingLoading(false);
        }
    };

    const handleEvaluateCredit = async () => {
        if (!offer?.offerId) return;

        setCreditLoading(true);
        try {
            const result = await offersService.evaluateCredit(offer.offerId);
            if (result.success) {
                setOffer(prev => ({
                    ...prev,
                    creditResult: result
                }));
            } else {
                setError(result.error || 'Erro ao avaliar crédito');
            }
        } catch (err) {
            setError(err.message || 'Erro ao avaliar crédito');
        } finally {
            setCreditLoading(false);
        }
    };

    const handleCopyWhatsAppText = () => {
        if (offer?.whatsappText) {
            navigator.clipboard.writeText(offer.whatsappText);
            setCopiedText(true);
            setTimeout(() => setCopiedText(false), 2000);
        }
    };

    const handleOpenWhatsApp = () => {
        if (offer?.whatsappText) {
            const encodedText = encodeURIComponent(offer.whatsappText);
            window.open(`https://wa.me/?text=${encodedText}`, '_blank');
        }
    };

    const renderGoalSelector = () => (
        <Grid container spacing={1} sx={{ mb: 2 }}>
            {GOALS.map((goal) => (
                <Grid item xs={4} sm={2} key={goal.code}>
                    <Tooltip title={goal.description}>
                        <Paper
                            sx={{
                                p: 1,
                                cursor: 'pointer',
                                textAlign: 'center',
                                border: goalCode === goal.code ? `2px solid ${goal.color}` : '2px solid transparent',
                                backgroundColor: goalCode === goal.code ? `${goal.color}15` : 'transparent',
                                '&:hover': {
                                    backgroundColor: `${goal.color}10`
                                },
                                transition: 'all 0.2s'
                            }}
                            onClick={() => setGoalCode(goal.code)}
                        >
                            <Typography variant="h6">{goal.icon}</Typography>
                            <Typography variant="caption" display="block" fontWeight={goalCode === goal.code ? 600 : 400}>
                                {goal.label}
                            </Typography>
                        </Paper>
                    </Tooltip>
                </Grid>
            ))}
        </Grid>
    );

    const renderBundles = () => {
        if (!offer?.bundles?.length) return null;

        return (
            <Box sx={{ mt: 2 }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        mb: 1
                    }}
                    onClick={() => setShowBundles(!showBundles)}
                >
                    <Typography variant="subtitle1" fontWeight={600}>
                        <InventoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Bundles Sugeridos ({offer.bundles.length})
                    </Typography>
                    <IconButton size="small">
                        {showBundles ? <CollapseIcon /> : <ExpandIcon />}
                    </IconButton>
                </Box>

                <Collapse in={showBundles}>
                    {offer.bundles.map((bundle, idx) => (
                        <Card key={idx} variant="outlined" sx={{ mb: 1 }}>
                            <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                    {bundle.name}
                                </Typography>
                                <List dense disablePadding>
                                    {bundle.items?.map((item, itemIdx) => (
                                        <ListItem key={itemIdx} disablePadding sx={{ py: 0.25 }}>
                                            <ListItemIcon sx={{ minWidth: 32 }}>
                                                <Chip
                                                    size="small"
                                                    label={item.qty}
                                                    sx={{ width: 28, height: 20, fontSize: '0.75rem' }}
                                                />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={item.sku}
                                                secondary={item.why?.join(', ')}
                                                primaryTypographyProps={{ variant: 'body2' }}
                                                secondaryTypographyProps={{ variant: 'caption' }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    ))}
                </Collapse>
            </Box>
        );
    };

    const renderWhatsAppText = () => {
        if (!offer?.whatsappText) return null;

        return (
            <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    <WhatsAppIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#25D366' }} />
                    Mensagem WhatsApp
                </Typography>
                <Paper
                    variant="outlined"
                    sx={{
                        p: 2,
                        backgroundColor: '#f5f5f5',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        maxHeight: 200,
                        overflow: 'auto'
                    }}
                >
                    {offer.whatsappText}
                </Paper>
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={copiedText ? <CheckCircleIcon /> : <CopyIcon />}
                        onClick={handleCopyWhatsAppText}
                    >
                        {copiedText ? 'Copiado!' : 'Copiar'}
                    </Button>
                    <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<WhatsAppIcon />}
                        onClick={handleOpenWhatsApp}
                    >
                        Enviar WhatsApp
                    </Button>
                </Box>
            </Box>
        );
    };

    const renderActions = () => {
        if (!offer) return null;

        return (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                    variant="outlined"
                    startIcon={pricingLoading ? <CircularProgress size={16} /> : <MoneyIcon />}
                    onClick={handlePriceOffer}
                    disabled={pricingLoading || offer.pricingResult}
                >
                    {offer.pricingResult ? `R$ ${offer.pricingResult.pricingTotal?.toFixed(2)}` : 'Calcular Preços'}
                </Button>

                <Button
                    variant="outlined"
                    startIcon={creditLoading ? <CircularProgress size={16} /> : <CreditIcon />}
                    onClick={handleEvaluateCredit}
                    disabled={creditLoading || offer.creditResult}
                >
                    {offer.creditResult ? offer.creditResult.creditOutcome : 'Avaliar Crédito'}
                </Button>
            </Box>
        );
    };

    const cardContent = (
        <>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                    <OfferIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Construir Oferta
                    {customerName && (
                        <Typography component="span" variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                            para {customerName}
                        </Typography>
                    )}
                </Typography>
                {onClose && (
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                )}
            </Box>

            {/* Error */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Success */}
            {offer?.outcome === 'ALLOW' && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    Oferta criada com sucesso! ID: {offer.offerId}
                </Alert>
            )}

            {/* Form */}
            {!offer && (
                <>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Segmento</InputLabel>
                                <Select
                                    value={segment}
                                    label="Segmento"
                                    onChange={(e) => setSegment(e.target.value)}
                                >
                                    {SEGMENTS.map((seg) => (
                                        <MenuItem key={seg.code} value={seg.code}>
                                            {seg.icon} {seg.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="Máx. Itens"
                                value={maxItems}
                                onChange={(e) => setMaxItems(parseInt(e.target.value) || 10)}
                                inputProps={{ min: 1, max: 50 }}
                            />
                        </Grid>
                    </Grid>

                    <Typography variant="subtitle2" gutterBottom>
                        Objetivo da Oferta
                    </Typography>
                    {renderGoalSelector()}

                    <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <BuildIcon />}
                        onClick={handleBuildOffer}
                        disabled={loading || !customerId}
                    >
                        {loading ? 'Construindo...' : 'Construir Oferta'}
                    </Button>
                </>
            )}

            {/* Results */}
            {offer && (
                <>
                    {/* Status */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip
                            label={offer.segment?.toUpperCase()}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                        <Chip
                            label={offer.outcome}
                            size="small"
                            color={offer.outcome === 'ALLOW' ? 'success' : 'error'}
                            icon={offer.outcome === 'ALLOW' ? <CheckCircleIcon /> : <ErrorIcon />}
                        />
                        {offer.reasons?.map((reason, idx) => (
                            <Chip key={idx} label={reason} size="small" variant="outlined" />
                        ))}
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Bundles */}
                    {renderBundles()}

                    {/* WhatsApp Text */}
                    {renderWhatsAppText()}

                    {/* Actions */}
                    {renderActions()}

                    {/* New Offer Button */}
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Button
                            variant="text"
                            startIcon={<RefreshIcon />}
                            onClick={() => setOffer(null)}
                        >
                            Nova Oferta
                        </Button>
                    </Box>
                </>
            )}
        </>
    );

    if (embedded) {
        return <Box sx={{ p: 2 }}>{cardContent}</Box>;
    }

    return (
        <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
            <CardContent>
                {cardContent}
            </CardContent>
        </Card>
    );
};

export default OfferBuilder;
