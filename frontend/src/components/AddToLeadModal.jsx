import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography,
    TextField,
    InputAdornment,
    Box,
    Chip,
    CircularProgress,
    Alert,
    Divider
} from '@mui/material'
import {
    Search as SearchIcon,
    Person as PersonIcon,
    ShoppingCart as CartIcon,
    Add as AddIcon
} from '@mui/icons-material'
import { leadsService } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { formatCurrency } from '../utils'

export default function AddToLeadModal({
    open,
    onClose,
    product,
    onSuccess
}) {
    const toast = useToast()
    const [leads, setLeads] = useState([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [selectedLead, setSelectedLead] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [quantity, setQuantity] = useState(1)
    const [error, setError] = useState('')

    // Carregar leads ativos do usuário
    useEffect(() => {
        if (open) {
            loadLeads()
            setSelectedLead(null)
            setQuantity(1)
            setSearchTerm('')
            setError('')
        }
    }, [open])

    const loadLeads = async () => {
        try {
            setLoading(true)
            const response = await leadsService.getAll({
                type: 1, // Apenas leads (não pedidos)
                limit: 50
            })
            if (response.data.success) {
                setLeads(response.data.data || [])
            }
        } catch (err) {
            console.error('Erro ao carregar leads:', err)
            setError('Erro ao carregar leads')
        } finally {
            setLoading(false)
        }
    }

    // Filtrar leads por busca
    const filteredLeads = leads.filter(lead => {
        if (!searchTerm) return true
        const search = searchTerm.toLowerCase()
        const customerName = (lead.customerName || lead.customer_name || '').toLowerCase()
        const leadId = String(lead.id || lead.cSCart || '')
        return customerName.includes(search) || leadId.includes(search)
    })

    // Adicionar produto ao lead
    const handleAddToLead = async () => {
        if (!selectedLead || !product) return

        try {
            setAdding(true)
            setError('')

            const response = await leadsService.addItem(selectedLead.id || selectedLead.cSCart, {
                productId: product.id,
                quantity: quantity,
                price: product.price || product.preco_tabela || 0
            })

            if (response.data.success) {
                toast.success(`${product.model} adicionado ao lead de ${selectedLead.customerName || selectedLead.customer_name}!`)
                onSuccess?.()
                onClose()
            } else {
                setError(response.data.error?.message || 'Erro ao adicionar produto')
            }
        } catch (err) {
            console.error('Erro ao adicionar ao lead:', err)
            setError(err.response?.data?.error?.message || 'Erro ao adicionar produto ao lead')
        } finally {
            setAdding(false)
        }
    }

    if (!product) return null

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2 }
            }}
        >
            <DialogTitle sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AddIcon />
                    <Typography variant="h6">Adicionar ao Lead</Typography>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                    {product.model} - {product.brand}
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                {/* Produto selecionado */}
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Box
                            component="img"
                            src={`https://img.rolemak.com.br/id/h80/${product.id}.jpg`}
                            alt={product.model}
                            sx={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 1, bgcolor: 'white' }}
                            onError={(e) => { e.target.src = '/placeholder-product.png'; e.target.onerror = null }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                                {product.model}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {product.name || product.description}
                            </Typography>
                            <Typography variant="h6" color="primary">
                                {formatCurrency(product.price || product.preco_tabela || 0)}
                            </Typography>
                        </Box>
                        <TextField
                            label="Qtd"
                            type="number"
                            size="small"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            inputProps={{ min: 1, style: { width: 50, textAlign: 'center' } }}
                            sx={{ width: 80 }}
                        />
                    </Box>
                </Box>

                {/* Busca de lead */}
                <Box sx={{ p: 2 }}>
                    <TextField
                        placeholder="Buscar lead por cliente ou ID..."
                        fullWidth
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            )
                        }}
                    />
                </Box>

                <Divider />

                {/* Lista de leads */}
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : error && leads.length === 0 ? (
                        <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
                    ) : filteredLeads.length === 0 ? (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography color="text.secondary">
                                {searchTerm ? 'Nenhum lead encontrado' : 'Você não tem leads ativos'}
                            </Typography>
                            <Button
                                href="/leads/new"
                                variant="outlined"
                                sx={{ mt: 2 }}
                                startIcon={<AddIcon />}
                            >
                                Criar novo lead
                            </Button>
                        </Box>
                    ) : (
                        <List disablePadding>
                            {filteredLeads.map((lead) => (
                                <ListItem
                                    key={lead.id || lead.cSCart}
                                    disablePadding
                                    secondaryAction={
                                        lead.itemCount > 0 && (
                                            <Chip
                                                icon={<CartIcon sx={{ fontSize: 14 }} />}
                                                label={`${lead.itemCount} itens`}
                                                size="small"
                                                sx={{ mr: 1 }}
                                            />
                                        )
                                    }
                                >
                                    <ListItemButton
                                        selected={selectedLead?.id === lead.id || selectedLead?.cSCart === lead.cSCart}
                                        onClick={() => setSelectedLead(lead)}
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: selectedLead?.id === lead.id ? 'primary.main' : 'grey.300' }}>
                                                <PersonIcon />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body1" fontWeight={500}>
                                                        {lead.customerName || lead.customer_name || 'Cliente não informado'}
                                                    </Typography>
                                                    <Chip
                                                        label={`#${lead.id || lead.cSCart}`}
                                                        size="small"
                                                        sx={{ height: 18, fontSize: '0.7rem' }}
                                                    />
                                                </Box>
                                            }
                                            secondary={
                                                <Typography variant="caption" color="text.secondary">
                                                    {lead.sellerName || lead.seller_name} • {new Date(lead.createdAt || lead.created_at || lead.dInquiry).toLocaleDateString('pt-BR')}
                                                </Typography>
                                            }
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>

                {error && leads.length > 0 && (
                    <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button onClick={onClose} disabled={adding}>
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    onClick={handleAddToLead}
                    disabled={!selectedLead || adding}
                    startIcon={adding ? <CircularProgress size={16} /> : <AddIcon />}
                >
                    {adding ? 'Adicionando...' : `Adicionar ao Lead`}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
