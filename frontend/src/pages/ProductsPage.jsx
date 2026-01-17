import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
    Box,
    Paper,
    Typography,
    TextField,
    InputAdornment,
    Grid,
    Card,
    CardMedia,
    CardContent,
    CardActions,
    Button,
    Chip,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    Switch,
    FormControlLabel,
    Pagination,
    Skeleton,
    Tooltip,
    ToggleButton,
    ToggleButtonGroup,
    Drawer,
    useMediaQuery,
    useTheme,
    Divider,
    Badge,
    Alert
} from '@mui/material'
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    ViewModule as GridViewIcon,
    ViewList as ListViewIcon,
    Favorite as FavoriteIcon,
    FavoriteBorder as FavoriteBorderIcon,
    AddShoppingCart as AddCartIcon,
    Inventory as InventoryIcon,
    Close as CloseIcon,
    LocalOffer as PromoIcon,
    NewReleases as LaunchIcon,
    Clear as ClearIcon
} from '@mui/icons-material'
import { productsService, pricingService } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import ProductDetailModal from '../components/ProductDetailModal'
import AddToLeadModal from '../components/AddToLeadModal'
import { formatCurrency } from '../utils'

const ITEMS_PER_PAGE = 24
const IMAGE_BASE_URL = 'https://img.rolemak.com.br/id/h180'

function ProductsPage() {
    const navigate = useNavigate()
    const toast = useToast()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))
    const [searchParams, setSearchParams] = useSearchParams()

    // Estados principais
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [totalProducts, setTotalProducts] = useState(0)
    const [page, setPage] = useState(1)

    // Filtros
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
    const [selectedSegment, setSelectedSegment] = useState(searchParams.get('segment') || '')
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
    const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '')
    const [priceRange, setPriceRange] = useState([0, 50000])
    const [inStockOnly, setInStockOnly] = useState(searchParams.get('inStock') === 'true')
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'name')
    const [viewMode, setViewMode] = useState('grid')
    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

    // Dados de referência
    const [segments, setSegments] = useState([])
    const [categories, setCategories] = useState([])
    const [favorites, setFavorites] = useState(new Set())
    const [promotions, setPromotions] = useState([])
    const [launchProducts, setLaunchProducts] = useState([])

    // Modal de detalhes
    const [detailModal, setDetailModal] = useState({ open: false, product: null })

    // Modal de adicionar ao lead
    const [addToLeadModal, setAddToLeadModal] = useState({ open: false, product: null })

    // Carregar segmentos e categorias
    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const [segRes, catRes, favRes, promoRes, launchRes] = await Promise.all([
                    productsService.getSegments(),
                    productsService.getCategories(),
                    productsService.getFavorites(),
                    pricingService.getPromotions().catch(() => ({ data: { data: [] } })),
                    pricingService.getLaunchProducts().catch(() => ({ data: { data: [] } }))
                ])

                if (segRes.data.success) setSegments(segRes.data.data || [])
                if (catRes.data.success) setCategories(catRes.data.data || [])
                if (favRes.data.success) {
                    const favIds = new Set((favRes.data.data || []).map(p => p.id))
                    setFavorites(favIds)
                }
                if (promoRes.data.success) setPromotions(promoRes.data.data || [])
                if (launchRes.data.success) setLaunchProducts(launchRes.data.data || [])
            } catch (err) {
                console.error('Erro ao carregar metadados:', err)
            }
        }
        loadMetadata()
    }, [])

    // Mapas para lookup rápido
    const promotionMap = useMemo(() => {
        const map = new Map()
        if (Array.isArray(promotions)) {
            promotions.forEach(p => map.set(p.product_id, p))
        }
        return map
    }, [promotions])

    const launchMap = useMemo(() => {
        const map = new Map()
        if (Array.isArray(launchProducts)) {
            launchProducts.forEach(lp => map.set(lp.product_id, lp))
        }
        return map
    }, [launchProducts])

    // Buscar produtos
    const loadProducts = useCallback(async () => {
        try {
            setLoading(true)
            setError('')

            // Só enviar parâmetros que não estão vazios
            const params = {
                page,
                limit: ITEMS_PER_PAGE
            }
            if (searchTerm) params.search = searchTerm
            if (selectedSegment) params.segment = selectedSegment
            if (selectedCategory) params.category = selectedCategory

            const response = await productsService.search(params)

            if (response.data.success) {
                let prods = response.data.data || []

                // Filtrar por estoque (frontend - idealmente seria no backend)
                if (inStockOnly) {
                    prods = prods.filter(p => p.stock > 0)
                }

                // Filtrar por marca
                if (selectedBrand) {
                    prods = prods.filter(p => p.brand === selectedBrand)
                }

                // Filtrar por faixa de preço
                prods = prods.filter(p => {
                    const price = p.price || p.preco_tabela || 0
                    return price >= priceRange[0] && price <= priceRange[1]
                })

                // Ordenar
                prods.sort((a, b) => {
                    switch (sortBy) {
                        case 'price_asc':
                            return (a.price || 0) - (b.price || 0)
                        case 'price_desc':
                            return (b.price || 0) - (a.price || 0)
                        case 'stock':
                            return (b.stock || 0) - (a.stock || 0)
                        case 'name':
                        default:
                            return (a.model || '').localeCompare(b.model || '')
                    }
                })

                setProducts(prods)
                setTotalProducts(response.data.pagination?.total || prods.length)
            }
        } catch (err) {
            setError('Erro ao carregar produtos')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [page, searchTerm, selectedSegment, selectedCategory, selectedBrand, inStockOnly, priceRange, sortBy])

    useEffect(() => {
        loadProducts()
    }, [loadProducts])

    // Atualizar URL com filtros
    useEffect(() => {
        const params = new URLSearchParams()
        if (searchTerm) params.set('search', searchTerm)
        if (selectedSegment) params.set('segment', selectedSegment)
        if (selectedCategory) params.set('category', selectedCategory)
        if (selectedBrand) params.set('brand', selectedBrand)
        if (inStockOnly) params.set('inStock', 'true')
        if (sortBy !== 'name') params.set('sort', sortBy)
        setSearchParams(params, { replace: true })
    }, [searchTerm, selectedSegment, selectedCategory, inStockOnly, sortBy, setSearchParams])

    // Toggle favorito
    const toggleFavorite = async (productId) => {
        try {
            const isFav = favorites.has(productId)
            if (isFav) {
                await productsService.removeFavorite(productId)
                setFavorites(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(productId)
                    return newSet
                })
                toast.info('Removido dos favoritos')
            } else {
                await productsService.addFavorite(productId)
                setFavorites(prev => new Set([...prev, productId]))
                toast.success('Adicionado aos favoritos ❤️')
            }
        } catch (err) {
            toast.error('Erro ao atualizar favoritos')
        }
    }

    // Limpar filtros
    const clearFilters = () => {
        setSearchTerm('')
        setSelectedSegment('')
        setSelectedCategory('')
        setSelectedBrand('')
        setPriceRange([0, 50000])
        setInStockOnly(false)
        setSortBy('name')
        setPage(1)
    }

    const hasActiveFilters = searchTerm || selectedSegment || selectedCategory || selectedBrand || inStockOnly || priceRange[0] > 0 || priceRange[1] < 50000

    // Componente de filtros
    const FiltersContent = () => (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Filtros
                {hasActiveFilters && (
                    <IconButton size="small" onClick={clearFilters} sx={{ ml: 1 }}>
                        <ClearIcon fontSize="small" />
                    </IconButton>
                )}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Segmento */}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Segmento</InputLabel>
                <Select
                    value={selectedSegment}
                    onChange={(e) => { setSelectedSegment(e.target.value); setPage(1) }}
                    label="Segmento"
                >
                    <MenuItem value="">Todos</MenuItem>
                    {[...new Set(segments.map(s => s.segmento || s.name))].filter(Boolean).sort().map(seg => (
                        <MenuItem key={seg} value={seg}>
                            {seg}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Categoria */}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Categoria</InputLabel>
                <Select
                    value={selectedCategory}
                    onChange={(e) => { setSelectedCategory(e.target.value); setPage(1) }}
                    label="Categoria"
                >
                    <MenuItem value="">Todas</MenuItem>
                    {[...new Set(categories.map(c => c.categoria || c.name))].filter(Boolean).sort().map(cat => (
                        <MenuItem key={cat} value={cat}>
                            {cat}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Marca */}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Marca</InputLabel>
                <Select
                    value={selectedBrand}
                    onChange={(e) => { setSelectedBrand(e.target.value); setPage(1) }}
                    label="Marca"
                >
                    <MenuItem value="">Todas</MenuItem>
                    {[...new Set(products.map(p => p.brand).filter(Boolean))].sort().map(brand => (
                        <MenuItem key={brand} value={brand}>
                            {brand}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Faixa de Preço */}
            <Typography gutterBottom>
                Faixa de Preço
            </Typography>
            <Slider
                value={priceRange}
                onChange={(e, newValue) => setPriceRange(newValue)}
                onChangeCommitted={() => setPage(1)}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => formatCurrency(value)}
                min={0}
                max={50000}
                step={100}
                sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="caption">{formatCurrency(priceRange[0])}</Typography>
                <Typography variant="caption">{formatCurrency(priceRange[1])}</Typography>
            </Box>

            {/* Em Estoque */}
            <FormControlLabel
                control={
                    <Switch
                        checked={inStockOnly}
                        onChange={(e) => { setInStockOnly(e.target.checked); setPage(1) }}
                    />
                }
                label="Apenas em estoque"
            />

            <Divider sx={{ my: 2 }} />

            {/* Ordenação */}
            <FormControl fullWidth size="small">
                <InputLabel>Ordenar por</InputLabel>
                <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    label="Ordenar por"
                >
                    <MenuItem value="name">Nome (A-Z)</MenuItem>
                    <MenuItem value="price_asc">Preço (menor)</MenuItem>
                    <MenuItem value="price_desc">Preço (maior)</MenuItem>
                    <MenuItem value="stock">Estoque (maior)</MenuItem>
                </Select>
            </FormControl>
        </Box>
    )

    // Card de produto
    const ProductCard = ({ product }) => {
        const isPromo = promotionMap.has(product.id)
        const isLaunch = launchMap.has(product.id)
        const isFavorite = favorites.has(product.id)
        const stock = product.stock || 0

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
                            label="Promoção"
                            size="small"
                            color="error"
                            sx={{ height: 20, '& .MuiChip-label': { px: 0.5, fontSize: '0.65rem' } }}
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
                <CardMedia
                    component="img"
                    height="160"
                    image={`${IMAGE_BASE_URL}/${product.id}.jpg`}
                    alt={product.model}
                    sx={{ objectFit: 'contain', p: 2, cursor: 'pointer', bgcolor: '#f5f5f5' }}
                    onClick={() => setDetailModal({ open: true, product })}
                    onError={(e) => {
                        e.target.src = '/placeholder-product.png'
                        e.target.onerror = null
                    }}
                />

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
                    <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddCartIcon />}
                        disabled={stock <= 0}
                        onClick={() => setAddToLeadModal({ open: true, product })}
                    >
                        Adicionar
                    </Button>
                </CardActions>
            </Card>
        )
    }

    // Item de lista
    const ProductListItem = ({ product }) => {
        const isPromo = promotionMap.has(product.id)
        const isLaunch = launchMap.has(product.id)
        const isFavorite = favorites.has(product.id)
        const stock = product.stock || 0

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
                <Box
                    component="img"
                    src={`${IMAGE_BASE_URL}/${product.id}.jpg`}
                    alt={product.model}
                    sx={{ width: 80, height: 80, objectFit: 'contain', cursor: 'pointer' }}
                    onClick={() => setDetailModal({ open: true, product })}
                    onError={(e) => {
                        e.target.src = '/placeholder-product.png'
                        e.target.onerror = null
                    }}
                />

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
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddCartIcon />}
                        disabled={stock <= 0}
                        onClick={() => setAddToLeadModal({ open: true, product })}
                    >
                        Adicionar
                    </Button>
                </Box>
            </Paper>
        )
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 3,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 2,
                    color: 'white'
                }}
            >
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Catálogo de Produtos
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    {totalProducts.toLocaleString()} produtos disponíveis
                </Typography>
            </Paper>

            {/* Barra de busca e controles */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField
                        placeholder="Buscar por modelo, marca, descrição..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
                        size="small"
                        sx={{ flexGrow: 1, minWidth: 250 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                            endAdornment: searchTerm && (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />

                    <Badge badgeContent={hasActiveFilters ? '!' : 0} color="error">
                        <Button
                            variant="outlined"
                            startIcon={<FilterIcon />}
                            onClick={() => setFilterDrawerOpen(true)}
                        >
                            Filtros
                        </Button>
                    </Badge>

                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(e, newMode) => newMode && setViewMode(newMode)}
                        size="small"
                    >
                        <ToggleButton value="grid">
                            <GridViewIcon />
                        </ToggleButton>
                        <ToggleButton value="list">
                            <ListViewIcon />
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Paper>

            {/* Conteúdo */}
            <Box sx={{ display: 'flex', gap: 3 }}>
                {/* Sidebar de filtros (desktop) */}
                {!isMobile && (
                    <Paper sx={{ width: 280, flexShrink: 0, alignSelf: 'flex-start', position: 'sticky', top: 80 }}>
                        <FiltersContent />
                    </Paper>
                )}

                {/* Grid de produtos */}
                <Box sx={{ flexGrow: 1 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                    )}

                    {loading ? (
                        <Grid container spacing={2}>
                            {[...Array(8)].map((_, i) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                                    <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
                                </Grid>
                            ))}
                        </Grid>
                    ) : products.length === 0 ? (
                        <Paper sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="h6" color="text.secondary">
                                Nenhum produto encontrado
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Tente ajustar os filtros ou pesquisar por outros termos
                            </Typography>
                            {hasActiveFilters && (
                                <Button onClick={clearFilters} sx={{ mt: 2 }}>
                                    Limpar filtros
                                </Button>
                            )}
                        </Paper>
                    ) : viewMode === 'grid' ? (
                        <Grid container spacing={2}>
                            {products.map(product => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                                    <ProductCard product={product} />
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {products.map(product => (
                                <ProductListItem key={product.id} product={product} />
                            ))}
                        </Box>
                    )}

                    {/* Paginação */}
                    {!loading && products.length > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <Pagination
                                count={Math.ceil(totalProducts / ITEMS_PER_PAGE)}
                                page={page}
                                onChange={(e, newPage) => setPage(newPage)}
                                color="primary"
                                showFirstButton
                                showLastButton
                            />
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Drawer de filtros (mobile) */}
            <Drawer
                anchor="right"
                open={filterDrawerOpen}
                onClose={() => setFilterDrawerOpen(false)}
            >
                <Box sx={{ width: 300 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                        <Typography variant="h6">Filtros</Typography>
                        <IconButton onClick={() => setFilterDrawerOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <FiltersContent />
                </Box>
            </Drawer>

            {/* Modal de detalhes */}
            <ProductDetailModal
                open={detailModal.open}
                onClose={() => setDetailModal({ open: false, product: null })}
                product={detailModal.product}
            />

            {/* Modal de adicionar ao lead */}
            <AddToLeadModal
                open={addToLeadModal.open}
                onClose={() => setAddToLeadModal({ open: false, product: null })}
                product={addToLeadModal.product}
                onSuccess={() => toast.success('Produto adicionado ao lead!')}
            />
        </Box>
    )
}

export default ProductsPage
