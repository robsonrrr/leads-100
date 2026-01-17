import React, { memo } from 'react'
import {
    Card,
    CardMedia,
    CardContent,
    CardActions,
    Typography,
    Box,
    Chip,
    IconButton,
    Button,
    Paper
} from '@mui/material'
import {
    Favorite as FavoriteIcon,
    FavoriteBorder as FavoriteBorderIcon,
    AddShoppingCart as AddCartIcon,
    Inventory as InventoryIcon,
    LocalOffer as PromoIcon,
    NewReleases as LaunchIcon
} from '@mui/icons-material'
import { formatCurrency } from '../utils'
import { OnlineButton } from '../hooks/useOnlineAction'
import OptimizedImage from './OptimizedImage'

const IMAGE_BASE_URL = 'https://img.rolemak.com.br/id/h180'

export const ProductGridItem = memo(({
    product,
    isPromo,
    isLaunch,
    promoExpiry, // Data de expiração da promoção
    isFavorite,
    toggleFavorite,
    setDetailModal,
    setAddToLeadModal
}) => {
    const stock = product.estoque || product.stock || 0

    // Verificar se promoção está expirando (5.2.5)
    const isPromoExpiring = (() => {
        if (!isPromo || !promoExpiry) return false
        const expiryDate = new Date(promoExpiry)
        const now = new Date()
        const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
        return daysLeft > 0 && daysLeft <= 3
    })()

    const promoExpiryDays = promoExpiry ? Math.ceil((new Date(promoExpiry) - new Date()) / (1000 * 60 * 60 * 24)) : null

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                }
            }}
        >
            {/* Badges */}
            <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 0.5, flexWrap: 'wrap', zIndex: 1 }}>
                {isPromo && (
                    <Chip
                        icon={<PromoIcon sx={{ fontSize: 14 }} />}
                        label={isPromoExpiring ? `Expira em ${promoExpiryDays}d!` : 'Promoção'}
                        size="small"
                        color="error"
                        sx={{
                            height: 20,
                            '& .MuiChip-label': { px: 0.5, fontSize: '0.65rem' },
                            animation: isPromoExpiring ? 'pulse 1s infinite' : 'none',
                            '@keyframes pulse': {
                                '0%, 100%': { opacity: 1 },
                                '50%': { opacity: 0.7 }
                            }
                        }}
                    />
                )}
                {isLaunch && (
                    <Chip
                        icon={<LaunchIcon sx={{ fontSize: 14 }} />}
                        label="Lançamento"
                        size="small"
                        sx={{ height: 20, bgcolor: '#9c27b0', color: 'white', '& .MuiChip-label': { px: 0.5, fontSize: '0.65rem' } }}
                    />
                )}
            </Box>

            {/* Botão Favorito */}
            <IconButton
                sx={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }}
                onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id) }}
            >
                {isFavorite ? (
                    <FavoriteIcon color="error" />
                ) : (
                    <FavoriteBorderIcon />
                )}
            </IconButton>

            {/* Imagem */}
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', display: 'flex', justifyContent: 'center' }}>
                <OptimizedImage
                    src={`${IMAGE_BASE_URL}/${product.id}.jpg`}
                    alt={product.model}
                    sx={{ maxHeight: 160, width: '100%', objectFit: 'contain', cursor: 'pointer' }}
                    onClick={() => setDetailModal({ open: true, product })}
                />
            </Box>

            <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                {/* Modelo e Marca */}
                <Typography variant="subtitle2" component="div" fontWeight="bold" noWrap>
                    {product.model}
                </Typography>
                <Typography variant="caption" color="text.secondary" component="div" noWrap>
                    {product.brand}
                </Typography>

                {/* Nome do produto */}
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        minHeight: '2.5em',
                        mt: 0.5
                    }}
                >
                    {product.name || product.description}
                </Typography>

                {/* Preço */}
                <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                    {formatCurrency(product.price || product.preco_tabela || 0)}
                </Typography>

                {/* Estoque */}
                <Chip
                    icon={<InventoryIcon sx={{ fontSize: 14 }} />}
                    label={stock <= 0 ? 'Sem estoque' : stock < 5 ? `Baixo: ${stock}` : `${stock} un.`}
                    size="small"
                    color={stock <= 0 ? 'error' : stock < 5 ? 'warning' : 'success'}
                    sx={{ mt: 1, height: 20, '& .MuiChip-label': { px: 0.5, fontSize: '0.65rem' } }}
                />
            </CardContent>

            <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
                <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setDetailModal({ open: true, product })}
                >
                    Detalhes
                </Button>
                <OnlineButton
                    size="small"
                    variant="contained"
                    startIcon={<AddCartIcon />}
                    disabled={stock <= 0}
                    onClick={() => setAddToLeadModal({ open: true, product })}
                    offlineMessage="Adicionar ao lead requer conexão"
                >
                    Adicionar
                </OnlineButton>
            </CardActions>
        </Card>
    )
})

export const ProductListItem = memo(({
    product,
    isPromo,
    isLaunch,
    isFavorite,
    toggleFavorite,
    setDetailModal,
    setAddToLeadModal
}) => {
    const stock = product.estoque || product.stock || 0

    return (
        <Paper
            sx={{
                p: 2,
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    boxShadow: 4
                }
            }}
        >
            {/* Imagem */}
            <Box sx={{ width: 80, height: 80, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <OptimizedImage
                    src={`${IMAGE_BASE_URL}/${product.id}.jpg`}
                    alt={product.model}
                    sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', cursor: 'pointer' }}
                    onClick={() => setDetailModal({ open: true, product })}
                />
            </Box>

            {/* Info */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle1" fontWeight="bold" noWrap>
                        {product.model}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {product.brand}
                    </Typography>
                    {isPromo && <Chip label="Promoção" size="small" color="error" sx={{ height: 18 }} />}
                    {isLaunch && <Chip label="Lançamento" size="small" sx={{ height: 18, bgcolor: '#9c27b0', color: 'white' }} />}
                </Box>
                <Typography variant="body2" color="text.secondary" noWrap>
                    {product.name || product.description}
                </Typography>
            </Box>

            {/* Preço e Estoque */}
            <Box sx={{ textAlign: 'right', minWidth: 120 }}>
                <Typography variant="h6" color="primary">
                    {formatCurrency(product.price || product.preco_tabela || 0)}
                </Typography>
                <Chip
                    icon={<InventoryIcon sx={{ fontSize: 12 }} />}
                    label={stock <= 0 ? 'Sem estoque' : `${stock} un.`}
                    size="small"
                    color={stock <= 0 ? 'error' : stock < 5 ? 'warning' : 'success'}
                    sx={{ height: 18 }}
                />
            </Box>

            {/* Ações */}
            <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton onClick={() => toggleFavorite(product.id)}>
                    {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                </IconButton>
                <OnlineButton
                    variant="contained"
                    size="small"
                    startIcon={<AddCartIcon />}
                    disabled={stock <= 0}
                    onClick={() => setAddToLeadModal({ open: true, product })}
                    offlineMessage="Adicionar ao lead requer conexão"
                >
                    Adicionar
                </OnlineButton>
            </Box>
        </Paper>
    )
})
