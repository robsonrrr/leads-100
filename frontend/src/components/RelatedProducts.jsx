import { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardMedia,
    Chip,
    Skeleton,
    IconButton,
    Tooltip
} from '@mui/material'
import {
    AddShoppingCart as AddCartIcon,
    LocalOffer as PromoIcon
} from '@mui/icons-material'
import { productsService } from '../services/api'
import { formatCurrency } from '../utils'

const IMAGE_BASE_URL = 'https://img.rolemak.com.br/id/h180'

/**
 * Componente de Produtos Relacionados
 * Exibe seções: Relacionados, Acessórios e Comprados Juntos
 */
export default function RelatedProducts({ productId, onSelectProduct }) {
    const [related, setRelated] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!productId) return

        const fetchRelated = async () => {
            setLoading(true)
            try {
                const response = await productsService.getRelated(productId)
                if (response.data.success) {
                    setRelated(response.data.data)
                }
            } catch (err) {
                console.debug('Erro ao carregar relacionados:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchRelated()
    }, [productId])

    if (loading) {
        return (
            <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>Você também pode gostar</Typography>
                <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} variant="rectangular" width={150} height={180} sx={{ borderRadius: 1 }} />
                    ))}
                </Box>
            </Box>
        )
    }

    if (!related || related.totalSuggestions === 0) {
        return null
    }

    const ProductCard = ({ product, label }) => (
        <Card
            sx={{
                minWidth: 140,
                maxWidth: 160,
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.03)' }
            }}
            onClick={() => onSelectProduct?.(product)}
        >
            <CardMedia
                component="img"
                height="100"
                image={`${IMAGE_BASE_URL}/${product.id}.jpg`}
                alt={product.model}
                sx={{ objectFit: 'contain', bgcolor: '#f5f5f5' }}
                onError={(e) => { e.target.src = '/placeholder-product.png' }}
            />
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" fontWeight="bold" noWrap display="block">
                    {product.model}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                    {product.brand}
                </Typography>
                <Typography variant="body2" color="primary" fontWeight="bold" sx={{ mt: 0.5 }}>
                    {formatCurrency(product.price)}
                </Typography>
                {label && (
                    <Chip label={label} size="small" sx={{ height: 16, fontSize: '0.6rem', mt: 0.5 }} />
                )}
            </CardContent>
        </Card>
    )

    const Section = ({ title, products, label, icon }) => {
        if (!products || products.length === 0) return null

        return (
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    {icon}
                    <Typography variant="subtitle1" fontWeight="bold">{title}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} label={label} />
                    ))}
                </Box>
            </Box>
        )
    }

    return (
        <Box sx={{ mt: 3 }}>
            <Section
                title="Você também pode gostar"
                products={related.related}
                icon={<PromoIcon sx={{ color: 'text.secondary' }} />}
            />

            <Section
                title="Acessórios e Complementos"
                products={related.accessories}
                label="Acessório"
            />

            <Section
                title="Comprados Juntos"
                products={related.boughtTogether}
                label={related.boughtTogether?.[0]?.frequency > 1 ? '🔥 Popular' : null}
            />
        </Box>
    )
}
