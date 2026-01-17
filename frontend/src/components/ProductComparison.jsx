import { useState, useMemo } from 'react'
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Button,
    Chip,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material'
import {
    Close as CloseIcon,
    Compare as CompareIcon,
    Add as AddIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon
} from '@mui/icons-material'
import { formatCurrency } from '../utils'

const IMAGE_BASE_URL = 'https://img.rolemak.com.br/id/h180'
const MAX_PRODUCTS = 4 // 6.2.4 - Máximo 4 produtos

/**
 * Hook para gerenciar produtos no comparador
 */
export function useProductComparison() {
    const [products, setProducts] = useState([])

    const addProduct = (product) => {
        if (products.length >= MAX_PRODUCTS) {
            return false
        }
        if (products.find(p => p.id === product.id)) {
            return false
        }
        setProducts(prev => [...prev, product])
        return true
    }

    const removeProduct = (productId) => {
        setProducts(prev => prev.filter(p => p.id !== productId))
    }

    const clearProducts = () => {
        setProducts([])
    }

    const isInComparison = (productId) => {
        return products.some(p => p.id === productId)
    }

    return {
        products,
        addProduct,
        removeProduct,
        clearProducts,
        isInComparison,
        canAdd: products.length < MAX_PRODUCTS,
        count: products.length
    }
}

/**
 * Botão de Adicionar ao Comparador
 */
export function CompareButton({ product, comparison }) {
    const { addProduct, removeProduct, isInComparison, canAdd } = comparison
    const isIn = isInComparison(product.id)

    const handleClick = (e) => {
        e.stopPropagation()
        if (isIn) {
            removeProduct(product.id)
        } else if (canAdd) {
            addProduct(product)
        }
    }

    return (
        <Tooltip title={isIn ? 'Remover da comparação' : canAdd ? 'Comparar' : 'Máximo 4 produtos'}>
            <IconButton
                size="small"
                onClick={handleClick}
                color={isIn ? 'primary' : 'default'}
                disabled={!isIn && !canAdd}
            >
                <CompareIcon fontSize="small" />
            </IconButton>
        </Tooltip>
    )
}

/**
 * Barra flutuante de comparação
 */
export function CompareBar({ comparison, onOpenModal }) {
    const { products, clearProducts, count } = comparison

    if (count === 0) return null

    return (
        <Paper
            elevation={8}
            sx={{
                position: 'fixed',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1100,
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                borderRadius: 3,
                bgcolor: 'primary.main',
                color: 'white'
            }}
        >
            <CompareIcon />
            <Typography variant="body2">
                {count} produto{count > 1 ? 's' : ''} para comparar
            </Typography>

            <Box sx={{ display: 'flex', gap: 0.5 }}>
                {products.map(p => (
                    <Chip
                        key={p.id}
                        label={p.model}
                        size="small"
                        onDelete={() => comparison.removeProduct(p.id)}
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '& .MuiChip-deleteIcon': { color: 'white' } }}
                    />
                ))}
            </Box>

            <Button
                variant="contained"
                color="secondary"
                size="small"
                onClick={onOpenModal}
                disabled={count < 2}
            >
                Comparar
            </Button>

            <IconButton size="small" onClick={clearProducts} sx={{ color: 'white' }}>
                <CloseIcon fontSize="small" />
            </IconButton>
        </Paper>
    )
}

/**
 * Modal de Comparação de Produtos (6.2.2, 6.2.3)
 */
export function CompareModal({ open, onClose, products }) {
    // Definir atributos para comparação
    const attributes = useMemo(() => [
        { key: 'model', label: 'Modelo' },
        { key: 'brand', label: 'Marca' },
        { key: 'price', label: 'Preço', format: (v) => formatCurrency(v) },
        { key: 'stock', label: 'Estoque', format: (v) => v > 0 ? `${v} un.` : 'Sem estoque' },
        { key: 'category', label: 'Categoria' },
        { key: 'segment', label: 'Segmento' }
    ], [])

    // Identificar diferenças para destacar (6.2.3)
    const getDifferences = (attr) => {
        const values = products.map(p => p[attr.key])
        const unique = [...new Set(values.filter(v => v !== undefined && v !== null))]
        return unique.length > 1
    }

    if (products.length < 2) return null

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CompareIcon />
                    Comparação de Produtos
                </Box>
                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Atributo</TableCell>
                                {products.map(product => (
                                    <TableCell key={product.id} align="center">
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <img
                                                src={`${IMAGE_BASE_URL}/${product.id}.jpg`}
                                                alt={product.model}
                                                style={{ width: 80, height: 80, objectFit: 'contain' }}
                                                onError={(e) => { e.target.style.display = 'none' }}
                                            />
                                            <Typography variant="subtitle2" fontWeight="bold">
                                                {product.model}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {attributes.map(attr => {
                                const hasDiff = getDifferences(attr)
                                return (
                                    <TableRow
                                        key={attr.key}
                                        sx={{ bgcolor: hasDiff ? 'action.hover' : 'transparent' }}
                                    >
                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                            {attr.label}
                                            {hasDiff && (
                                                <Chip
                                                    label="Diferente"
                                                    size="small"
                                                    color="warning"
                                                    sx={{ ml: 1, height: 18, fontSize: '0.65rem' }}
                                                />
                                            )}
                                        </TableCell>
                                        {products.map(product => {
                                            const value = product[attr.key]
                                            const formatted = attr.format ? attr.format(value) : value

                                            // Destacar melhor valor para preço (menor) e estoque (maior)
                                            const isBest = (() => {
                                                if (attr.key === 'price') {
                                                    const min = Math.min(...products.map(p => p.price || Infinity))
                                                    return value === min
                                                }
                                                if (attr.key === 'stock') {
                                                    const max = Math.max(...products.map(p => p.stock || 0))
                                                    return value === max && value > 0
                                                }
                                                return false
                                            })()

                                            return (
                                                <TableCell key={product.id} align="center">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                        {formatted || '-'}
                                                        {isBest && <CheckIcon color="success" fontSize="small" />}
                                                    </Box>
                                                </TableCell>
                                            )
                                        })}
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Fechar</Button>
            </DialogActions>
        </Dialog>
    )
}
