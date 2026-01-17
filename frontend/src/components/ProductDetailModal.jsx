import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Grid,
    Chip,
    Divider,
    IconButton,
    Skeleton,
    Alert
} from '@mui/material';
import {
    Close as CloseIcon,
    Inventory as InventoryIcon,
    LocalOffer as PriceIcon,
    Category as CategoryIcon,
    Business as BrandIcon,
    BarChart as ChartIcon,
    ShoppingCart as CartIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon
} from '@mui/icons-material';
import MakPrimeLogo from './MakPrimeLogo';
import { formatCurrency } from '../utils';

/**
 * ProductDetailModal - Modal para exibir detalhes completos do produto
 * Inclui imagem ampliada, especificações e informações de estoque/preço
 */
function ProductDetailModal({
    open,
    onClose,
    product,
    onAddToCart,
    showAddButton = false,
    loading = false
}) {
    const [imageZoom, setImageZoom] = useState(1);
    const [imageError, setImageError] = useState(false);

    if (!product && !loading) return null;

    const productId = product?.id || product?.productId;
    const imageUrl = productId
        ? `https://img.rolemak.com.br/id/h800/${productId}.jpg?version=9.02`
        : null;

    const handleZoomIn = () => {
        setImageZoom(prev => Math.min(prev + 0.25, 2));
    };

    const handleZoomOut = () => {
        setImageZoom(prev => Math.max(prev - 0.25, 0.5));
    };

    const resetZoom = () => {
        setImageZoom(1);
    };

    const handleClose = () => {
        resetZoom();
        setImageError(false);
        onClose();
    };

    // Determinar status de estoque
    const getStockStatus = (stock) => {
        if (!stock && stock !== 0) return null;
        if (stock <= 0) return { label: 'Sem estoque', color: 'error' };
        if (stock < 5) return { label: `Baixo estoque (${stock})`, color: 'warning' };
        return { label: `Em estoque (${stock})`, color: 'success' };
    };

    const stockStatus = getStockStatus(product?.stock || product?.estoque);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pb: 1
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
                        {loading ? <Skeleton width={200} /> : (product?.model || product?.codigo || 'Detalhes do Produto')}
                    </Typography>
                    {product?.brand && (
                        <MakPrimeLogo height={24} marca={product.brand} />
                    )}
                </Box>
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ p: 0 }}>
                {loading ? (
                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Skeleton height={40} />
                                <Skeleton height={30} />
                                <Skeleton height={30} />
                                <Skeleton height={30} />
                            </Grid>
                        </Grid>
                    </Box>
                ) : (
                    <Grid container>
                        {/* Coluna da Imagem */}
                        <Grid item xs={12} md={6} sx={{
                            bgcolor: 'grey.50',
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 350
                        }}>
                            {imageUrl && !imageError ? (
                                <>
                                    <Box
                                        component="img"
                                        src={imageUrl}
                                        alt={product?.model || 'Produto'}
                                        onError={() => setImageError(true)}
                                        sx={{
                                            maxWidth: '100%',
                                            maxHeight: 300,
                                            objectFit: 'contain',
                                            transform: `scale(${imageZoom})`,
                                            transition: 'transform 0.2s ease',
                                            cursor: imageZoom < 2 ? 'zoom-in' : 'zoom-out'
                                        }}
                                        onClick={() => imageZoom < 2 ? handleZoomIn() : handleZoomOut()}
                                    />
                                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                        <IconButton size="small" onClick={handleZoomOut} disabled={imageZoom <= 0.5}>
                                            <ZoomOutIcon />
                                        </IconButton>
                                        <Typography variant="caption" sx={{ alignSelf: 'center' }}>
                                            {Math.round(imageZoom * 100)}%
                                        </Typography>
                                        <IconButton size="small" onClick={handleZoomIn} disabled={imageZoom >= 2}>
                                            <ZoomInIcon />
                                        </IconButton>
                                    </Box>
                                </>
                            ) : (
                                <Box sx={{
                                    width: '100%',
                                    height: 300,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'grey.200',
                                    borderRadius: 1
                                }}>
                                    <Typography color="text.secondary">
                                        Imagem não disponível
                                    </Typography>
                                </Box>
                            )}
                        </Grid>

                        {/* Coluna de Informações */}
                        <Grid item xs={12} md={6} sx={{ p: 3 }}>
                            {/* Modelo e Descrição */}
                            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                                {product?.model || product?.codigo}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                {product?.name || product?.descricao}
                            </Typography>

                            {/* Marca */}
                            {product?.brand && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <BrandIcon fontSize="small" color="action" />
                                    <Typography variant="body2">
                                        Marca: <strong>{product.brand}</strong>
                                    </Typography>
                                </Box>
                            )}

                            {/* Categoria/Segmento */}
                            {(product?.segment || product?.category) && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <CategoryIcon fontSize="small" color="action" />
                                    <Typography variant="body2">
                                        Categoria: <strong>{product.segment || product.category}</strong>
                                    </Typography>
                                </Box>
                            )}

                            <Divider sx={{ my: 2 }} />

                            {/* Preço */}
                            <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <PriceIcon fontSize="small" color="primary" />
                                    <Typography variant="body2" color="text.secondary">
                                        Preço de Tabela
                                    </Typography>
                                </Box>
                                <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                                    {formatCurrency(product?.preco_venda || product?.price || 0)}
                                </Typography>
                            </Box>

                            {/* Estoque */}
                            {stockStatus && (
                                <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <InventoryIcon fontSize="small" color="action" />
                                        <Chip
                                            label={stockStatus.label}
                                            color={stockStatus.color}
                                            size="small"
                                        />
                                    </Box>
                                </Box>
                            )}

                            {/* Informações adicionais */}
                            <Box sx={{
                                bgcolor: 'grey.50',
                                p: 2,
                                borderRadius: 1,
                                mt: 2
                            }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    Informações Adicionais
                                </Typography>
                                <Grid container spacing={1}>
                                    {productId && (
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">
                                                ID do Produto
                                            </Typography>
                                            <Typography variant="body2">
                                                {productId}
                                            </Typography>
                                        </Grid>
                                    )}
                                    {product?.ncm && (
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">
                                                NCM
                                            </Typography>
                                            <Typography variant="body2">
                                                {product.ncm}
                                            </Typography>
                                        </Grid>
                                    )}
                                    {product?.unidade && (
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">
                                                Unidade
                                            </Typography>
                                            <Typography variant="body2">
                                                {product.unidade}
                                            </Typography>
                                        </Grid>
                                    )}
                                    {product?.peso && (
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">
                                                Peso
                                            </Typography>
                                            <Typography variant="body2">
                                                {product.peso} kg
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </Box>
                        </Grid>
                    </Grid>
                )}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={handleClose} color="inherit">
                    Fechar
                </Button>
                {showAddButton && onAddToCart && (
                    <Button
                        variant="contained"
                        startIcon={<CartIcon />}
                        onClick={() => {
                            onAddToCart(product);
                            handleClose();
                        }}
                    >
                        Adicionar ao Lead
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

export default ProductDetailModal;
