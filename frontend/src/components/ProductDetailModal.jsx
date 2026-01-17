import { useState, useEffect } from 'react';
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
    Alert,
    Tabs,
    Tab,
    Link
} from '@mui/material';
import {
    Close as CloseIcon,
    Inventory as InventoryIcon,
    LocalOffer as PriceIcon,
    Category as CategoryIcon,
    Business as BrandIcon,
    ShoppingCart as CartIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    Public as OriginIcon,
    Scale as WeightIcon,
    Description as DescriptionIcon,
    PlayCircle as VideoIcon,
    PictureAsPdf as PdfIcon,
    Star as StarIcon,
    NewReleases as NewIcon,
    LocalMall as OutletIcon,
    Straighten as MeasureIcon
} from '@mui/icons-material';
import MakPrimeLogo from './MakPrimeLogo';
import { formatCurrency } from '../utils';
import { productsService } from '../services/api';

/**
 * ProductDetailModal - Modal para exibir detalhes completos do produto
 * Busca dados enriquecidos da view produtos_ecommerce
 */
function ProductDetailModal({
    open,
    onClose,
    product,
    onAddToCart,
    showAddButton = false
}) {
    const [imageZoom, setImageZoom] = useState(1);
    const [imageError, setImageError] = useState(false);
    const [enrichedData, setEnrichedData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(0);

    const productId = product?.id || product?.productId;

    // Buscar dados enriquecidos quando abrir o modal
    useEffect(() => {
        if (open && productId) {
            fetchEnrichedData();
        }
    }, [open, productId]);

    const fetchEnrichedData = async () => {
        setLoading(true);
        try {
            const response = await productsService.getDetails(productId);
            if (response.data.success) {
                setEnrichedData(response.data.data);
            }
        } catch (error) {
            console.error('Erro ao buscar detalhes:', error);
            // Usar dados básicos do product prop
            setEnrichedData(null);
        } finally {
            setLoading(false);
        }
    };

    // Dados a exibir (enriquecidos ou básicos)
    const data = enrichedData || product || {};

    if (!product && !loading) return null;

    const imageUrl = productId
        ? `https://img.rolemak.com.br/id/h800/${productId}.jpg?version=9.02`
        : null;

    const handleZoomIn = () => setImageZoom(prev => Math.min(prev + 0.25, 2));
    const handleZoomOut = () => setImageZoom(prev => Math.max(prev - 0.25, 0.5));
    const resetZoom = () => setImageZoom(1);

    const handleClose = () => {
        resetZoom();
        setImageError(false);
        setEnrichedData(null);
        setActiveTab(0);
        onClose();
    };

    // Status de estoque
    const getStockStatus = (stock) => {
        if (!stock && stock !== 0) return null;
        if (stock <= 0) return { label: 'Sem estoque', color: 'error' };
        if (stock < 5) return { label: `Baixo estoque (${stock})`, color: 'warning' };
        return { label: `Em estoque (${stock})`, color: 'success' };
    };

    const stockStatus = getStockStatus(data?.estoque || data?.stock || product?.stock);

    // Verificar se tem medidas
    const hasMeasures = data?.medidaD || data?.medidaD2 || data?.medidaB || data?.medidaDM || data?.medidaL;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
                        {loading ? <Skeleton width={200} /> : (data?.modelo || product?.model || 'Detalhes do Produto')}
                    </Typography>
                    {(data?.marca || product?.brand) && (
                        <MakPrimeLogo height={24} marca={data?.marca || product?.brand} />
                    )}
                    {/* Badges */}
                    {data?.destaque === 1 && (
                        <Chip icon={<StarIcon />} label="Destaque" size="small" color="warning" />
                    )}
                    {data?.lancamento === 1 && (
                        <Chip icon={<NewIcon />} label="Lançamento" size="small" color="success" />
                    )}
                    {data?.outlet === 1 && (
                        <Chip icon={<OutletIcon />} label="Outlet" size="small" color="error" />
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
                            <Grid item xs={12} md={5}>
                                <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 1 }} />
                            </Grid>
                            <Grid item xs={12} md={7}>
                                <Skeleton height={40} />
                                <Skeleton height={30} />
                                <Skeleton height={30} />
                                <Skeleton height={100} />
                            </Grid>
                        </Grid>
                    </Box>
                ) : (
                    <Grid container>
                        {/* Coluna da Imagem */}
                        <Grid item xs={12} md={5} sx={{
                            bgcolor: 'grey.50',
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 400
                        }}>
                            {imageUrl && !imageError ? (
                                <>
                                    <Box
                                        component="img"
                                        src={imageUrl}
                                        alt={data?.modelo || 'Produto'}
                                        onError={() => setImageError(true)}
                                        sx={{
                                            maxWidth: '100%',
                                            maxHeight: 350,
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
                                    height: 350,
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
                        <Grid item xs={12} md={7} sx={{ p: 0 }}>
                            {/* Tabs para organizar conteúdo */}
                            <Tabs
                                value={activeTab}
                                onChange={(e, v) => setActiveTab(v)}
                                sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
                            >
                                <Tab label="Geral" />
                                <Tab label="Descrição" />
                                {hasMeasures && <Tab label="Medidas" />}
                            </Tabs>

                            <Box sx={{ p: 3 }}>
                                {/* Tab Geral */}
                                {activeTab === 0 && (
                                    <>
                                        {/* Nome e Título */}
                                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                                            {data?.titulo || data?.nome || product?.name}
                                        </Typography>

                                        {data?.descricaoCurta && (
                                            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                                {data.descricaoCurta}
                                            </Typography>
                                        )}

                                        {/* Info Grid */}
                                        <Grid container spacing={2} sx={{ mb: 2 }}>
                                            {/* Marca */}
                                            {(data?.marca || product?.brand) && (
                                                <Grid item xs={6}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <BrandIcon fontSize="small" color="action" />
                                                        <Typography variant="body2">
                                                            Marca: <strong>{data?.marca || product?.brand}</strong>
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            )}

                                            {/* Origem */}
                                            {data?.origem && (
                                                <Grid item xs={6}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <OriginIcon fontSize="small" color="action" />
                                                        <Typography variant="body2">
                                                            Origem: <strong>{data.origem}</strong>
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            )}

                                            {/* Categoria */}
                                            {(data?.categoria || data?.segmento) && (
                                                <Grid item xs={6}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <CategoryIcon fontSize="small" color="action" />
                                                        <Typography variant="body2">
                                                            {data.segmento && <span>Segmento: <strong>{data.segmento}</strong></span>}
                                                            {data.segmento && data.categoria && ' / '}
                                                            {data.categoria && <span>Categoria: <strong>{data.categoria}</strong></span>}
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            )}

                                            {/* Peso */}
                                            {data?.peso && (
                                                <Grid item xs={6}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <WeightIcon fontSize="small" color="action" />
                                                        <Typography variant="body2">
                                                            Peso: <strong>{data.peso} kg</strong>
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            )}

                                            {/* Embalagem */}
                                            {data?.embalagem && (
                                                <Grid item xs={6}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <InventoryIcon fontSize="small" color="action" />
                                                        <Typography variant="body2">
                                                            Embalagem: <strong>{data.embalagem}</strong>
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            )}
                                        </Grid>

                                        <Divider sx={{ my: 2 }} />

                                        {/* Preço e Estoque */}
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <PriceIcon fontSize="small" color="primary" />
                                                    <Typography variant="body2" color="text.secondary">
                                                        Preço de Tabela
                                                    </Typography>
                                                </Box>
                                                <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                                                    {formatCurrency(data?.preco || product?.price || 0)}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                {stockStatus && (
                                                    <>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                            <InventoryIcon fontSize="small" color="action" />
                                                            <Typography variant="body2" color="text.secondary">
                                                                Disponibilidade
                                                            </Typography>
                                                        </Box>
                                                        <Chip
                                                            label={stockStatus.label}
                                                            color={stockStatus.color}
                                                            sx={{ fontWeight: 'bold' }}
                                                        />
                                                    </>
                                                )}
                                            </Grid>
                                        </Grid>

                                        {/* Links externos */}
                                        {(data?.urlVideo || data?.urlCatalogo) && (
                                            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                                {data?.urlVideo && (
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<VideoIcon />}
                                                        component={Link}
                                                        href={data.urlVideo}
                                                        target="_blank"
                                                    >
                                                        Ver Vídeo
                                                    </Button>
                                                )}
                                                {data?.urlCatalogo && (
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<PdfIcon />}
                                                        component={Link}
                                                        href={data.urlCatalogo}
                                                        target="_blank"
                                                    >
                                                        Ver Catálogo
                                                    </Button>
                                                )}
                                            </Box>
                                        )}

                                        {/* Informações Técnicas */}
                                        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mt: 3 }}>
                                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                                Informações Técnicas
                                            </Typography>
                                            <Grid container spacing={1}>
                                                {productId && (
                                                    <Grid item xs={6} sm={4}>
                                                        <Typography variant="caption" color="text.secondary">ID</Typography>
                                                        <Typography variant="body2">{productId}</Typography>
                                                    </Grid>
                                                )}
                                                {data?.ncm && (
                                                    <Grid item xs={6} sm={4}>
                                                        <Typography variant="caption" color="text.secondary">NCM</Typography>
                                                        <Typography variant="body2">{data.ncm}</Typography>
                                                    </Grid>
                                                )}
                                                {data?.modelo && (
                                                    <Grid item xs={6} sm={4}>
                                                        <Typography variant="caption" color="text.secondary">Modelo</Typography>
                                                        <Typography variant="body2">{data.modelo}</Typography>
                                                    </Grid>
                                                )}
                                            </Grid>
                                        </Box>
                                    </>
                                )}

                                {/* Tab Descrição */}
                                {activeTab === 1 && (
                                    <>
                                        {data?.textoRevendedor && (
                                            <Box sx={{ mb: 3 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                                                    📋 Para o Revendedor
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{ whiteSpace: 'pre-line' }}
                                                    dangerouslySetInnerHTML={{ __html: data.textoRevendedor }}
                                                />
                                            </Box>
                                        )}

                                        {data?.textoConsumidor && (
                                            <Box sx={{ mb: 3 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: 'secondary.main' }}>
                                                    👤 Para o Consumidor
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{ whiteSpace: 'pre-line' }}
                                                    dangerouslySetInnerHTML={{ __html: data.textoConsumidor }}
                                                />
                                            </Box>
                                        )}

                                        {data?.descricaoCompleta && (
                                            <Box sx={{ mb: 3 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                                    📝 Descrição Completa
                                                </Typography>
                                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                                    {data.descricaoCompleta}
                                                </Typography>
                                            </Box>
                                        )}

                                        {data?.complemento && (
                                            <Box sx={{ mb: 3 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                                    ➕ Complemento
                                                </Typography>
                                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                                    {data.complemento}
                                                </Typography>
                                            </Box>
                                        )}

                                        {data?.keywords && (
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Palavras-chave: {data.keywords}
                                                </Typography>
                                            </Box>
                                        )}

                                        {!data?.textoRevendedor && !data?.textoConsumidor && !data?.descricaoCompleta && (
                                            <Alert severity="info">
                                                Descrição detalhada não disponível para este produto.
                                            </Alert>
                                        )}
                                    </>
                                )}

                                {/* Tab Medidas */}
                                {activeTab === 2 && hasMeasures && (
                                    <>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                                            <MeasureIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                            Especificações Dimensionais
                                        </Typography>
                                        <Grid container spacing={2}>
                                            {data?.medidaD && (
                                                <Grid item xs={6} sm={4}>
                                                    <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                                                        <Typography variant="h6" color="primary">{data.medidaD}</Typography>
                                                        <Typography variant="caption" color="text.secondary">D (mm)</Typography>
                                                    </Box>
                                                </Grid>
                                            )}
                                            {data?.medidaD2 && (
                                                <Grid item xs={6} sm={4}>
                                                    <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                                                        <Typography variant="h6" color="primary">{data.medidaD2}</Typography>
                                                        <Typography variant="caption" color="text.secondary">d (mm)</Typography>
                                                    </Box>
                                                </Grid>
                                            )}
                                            {data?.medidaB && (
                                                <Grid item xs={6} sm={4}>
                                                    <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                                                        <Typography variant="h6" color="primary">{data.medidaB}</Typography>
                                                        <Typography variant="caption" color="text.secondary">B (mm)</Typography>
                                                    </Box>
                                                </Grid>
                                            )}
                                            {data?.medidaDM && (
                                                <Grid item xs={6} sm={4}>
                                                    <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                                                        <Typography variant="h6" color="primary">{data.medidaDM}</Typography>
                                                        <Typography variant="caption" color="text.secondary">DM (mm)</Typography>
                                                    </Box>
                                                </Grid>
                                            )}
                                            {data?.medidaL && (
                                                <Grid item xs={6} sm={4}>
                                                    <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                                                        <Typography variant="h6" color="primary">{data.medidaL}</Typography>
                                                        <Typography variant="caption" color="text.secondary">L (mm)</Typography>
                                                    </Box>
                                                </Grid>
                                            )}
                                            {data?.medidaFW && (
                                                <Grid item xs={6} sm={4}>
                                                    <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                                                        <Typography variant="h6" color="primary">{data.medidaFW}</Typography>
                                                        <Typography variant="caption" color="text.secondary">FW</Typography>
                                                    </Box>
                                                </Grid>
                                            )}
                                        </Grid>

                                        {data?.medidaLayout && (
                                            <Box sx={{ mt: 3, textAlign: 'center' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Layout: {data.medidaLayout}
                                                </Typography>
                                            </Box>
                                        )}
                                    </>
                                )}
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
