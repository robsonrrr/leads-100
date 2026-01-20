import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Chip,
    TextField,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Alert,
    CircularProgress,
    Tooltip,
    TablePagination,
    Skeleton,
    Autocomplete,
    Divider,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    ArrowBack as BackIcon,
    Refresh as RefreshIcon,
    Percent as DiscountIcon,
} from '@mui/icons-material';
import * as pricingAdminService from '../../../services/pricingAdmin.service';

const INITIAL_FORM_STATE = {
    brand_id: null,
    brand_name: '',
    sku: '',
    product_name: '',
    min_qty: 1,
    max_qty: 999999,
    discount_pct: 0,
    is_active: true,
};

function QuantityDiscountsPage() {
    const navigate = useNavigate();

    // States
    const [discounts, setDiscounts] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Pagination and filters
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [brandFilter, setBrandFilter] = useState('');

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [saving, setSaving] = useState(false);

    // Product search
    const [productOptions, setProductOptions] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Load discounts
    const loadDiscounts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                skip: page * rowsPerPage,
                limit: rowsPerPage,
                ...(search && { search }),
                ...(brandFilter && { brand_id: brandFilter }),
            };

            const [discountsResponse, brandsResponse] = await Promise.all([
                pricingAdminService.listQuantityDiscounts(params),
                pricingAdminService.listBrands({ limit: 500 })
            ]);

            setDiscounts(discountsResponse.data?.items || discountsResponse.data || []);
            setTotal(discountsResponse.data?.total || discountsResponse.data?.length || 0);
            setBrands(brandsResponse.data?.items || brandsResponse.data || []);
        } catch (err) {
            setError(err.message || 'Erro ao carregar descontos');
            setDiscounts([]);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, search, brandFilter]);

    useEffect(() => {
        loadDiscounts();
    }, [loadDiscounts]);

    // Search products
    const searchProducts = async (query) => {
        if (!query || query.length < 2) return;
        setLoadingProducts(true);
        try {
            const response = await pricingAdminService.searchProducts(query);
            setProductOptions(response.data || []);
        } catch (err) {
            console.error('Erro ao buscar produtos:', err);
        } finally {
            setLoadingProducts(false);
        }
    };

    // Handlers
    const handleCreate = () => {
        setFormData(INITIAL_FORM_STATE);
        setModalMode('create');
        setModalOpen(true);
    };

    const handleEdit = (discount) => {
        setFormData({
            id: discount.id,
            brand_id: discount.brand_id,
            brand_name: brands.find(b => b.brand_id === discount.brand_id)?.brand_name || '',
            sku: discount.sku || '',
            product_name: discount.product_name || '',
            min_qty: discount.min_qty || 1,
            max_qty: discount.max_qty || 999999,
            discount_pct: discount.discount_pct || 0,
            is_active: discount.is_active,
        });
        setModalMode('edit');
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setFormData(INITIAL_FORM_STATE);
        setProductOptions([]);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const data = {
                brand_id: formData.brand_id,
                sku: formData.sku || null,
                min_qty: parseInt(formData.min_qty) || 1,
                max_qty: parseInt(formData.max_qty) || 999999,
                discount_pct: parseFloat(formData.discount_pct) || 0,
                is_active: formData.is_active,
            };

            if (modalMode === 'create') {
                await pricingAdminService.createQuantityDiscount(data);
                setSuccess('Desconto criado com sucesso!');
            } else {
                await pricingAdminService.updateQuantityDiscount(formData.id, data);
                setSuccess('Desconto atualizado com sucesso!');
            }
            handleCloseModal();
            loadDiscounts();
        } catch (err) {
            setError(err.message || 'Erro ao salvar desconto');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (discount) => {
        setItemToDelete(discount);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        setDeleting(true);
        setError(null);
        try {
            await pricingAdminService.deleteQuantityDiscount(itemToDelete.id);
            setSuccess('Desconto removido com sucesso!');
            setDeleteDialogOpen(false);
            setItemToDelete(null);
            loadDiscounts();
        } catch (err) {
            setError(err.message || 'Erro ao remover desconto');
        } finally {
            setDeleting(false);
        }
    };

    // Clear messages
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const formatNumber = (num) => {
        if (num === null || num === undefined) return '-';
        return new Intl.NumberFormat('pt-BR').format(num);
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <Button
                    startIcon={<BackIcon />}
                    onClick={() => navigate('/admin/pricing')}
                    variant="outlined"
                    size="small"
                >
                    Voltar
                </Button>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DiscountIcon sx={{ fontSize: 32, color: '#10b981' }} />
                        Descontos por Quantidade (D4Q)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gerenciar descontos escalonados por quantidade comprada
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                    sx={{ bgcolor: '#10b981' }}
                >
                    Novo Desconto
                </Button>
            </Box>

            {/* Alerts */}
            {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                    placeholder="Buscar por SKU ou produto..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    size="small"
                    sx={{ width: 300 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Filtrar por Marca</InputLabel>
                    <Select
                        value={brandFilter}
                        onChange={(e) => { setBrandFilter(e.target.value); setPage(0); }}
                        label="Filtrar por Marca"
                    >
                        <MenuItem value="">Todas</MenuItem>
                        {brands.map((brand) => (
                            <MenuItem key={brand.brand_id} value={brand.brand_id}>
                                {brand.brand_name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Box sx={{ flex: 1 }} />
                <Tooltip title="Atualizar">
                    <IconButton onClick={loadDiscounts} disabled={loading}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Paper>

            {/* Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                            <TableCell><strong>ID</strong></TableCell>
                            <TableCell><strong>Marca</strong></TableCell>
                            <TableCell><strong>SKU / Produto</strong></TableCell>
                            <TableCell align="right"><strong>Qtd Mín</strong></TableCell>
                            <TableCell align="right"><strong>Qtd Máx</strong></TableCell>
                            <TableCell align="right"><strong>Desconto %</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell align="right"><strong>Ações</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    {[...Array(8)].map((_, j) => (
                                        <TableCell key={j}><Skeleton /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : discounts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">Nenhum desconto encontrado</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            discounts.map((discount) => {
                                const brand = brands.find(b => b.brand_id === discount.brand_id);
                                return (
                                    <TableRow key={discount.id} hover>
                                        <TableCell>{discount.id}</TableCell>
                                        <TableCell>{brand?.brand_name || discount.brand_id || 'Todas'}</TableCell>
                                        <TableCell>
                                            {discount.sku ? (
                                                <Box>
                                                    <Typography variant="body2" fontWeight="medium">{discount.sku}</Typography>
                                                    {discount.product_name && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {discount.product_name}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            ) : (
                                                <Chip label="Todos os produtos" size="small" variant="outlined" />
                                            )}
                                        </TableCell>
                                        <TableCell align="right">{formatNumber(discount.min_qty)}</TableCell>
                                        <TableCell align="right">{formatNumber(discount.max_qty)}</TableCell>
                                        <TableCell align="right">
                                            <Chip
                                                label={`${discount.discount_pct?.toFixed(2) || '0.00'}%`}
                                                color="success"
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={discount.is_active ? 'Ativo' : 'Inativo'}
                                                color={discount.is_active ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Editar">
                                                <IconButton onClick={() => handleEdit(discount)} color="primary">
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Excluir">
                                                <IconButton onClick={() => handleDeleteClick(discount)} color="error">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    component="div"
                    count={total}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, p) => setPage(p)}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    labelRowsPerPage="Itens por página:"
                />
            </TableContainer>

            {/* Modal */}
            <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {modalMode === 'create' ? 'Novo Desconto por Quantidade' : 'Editar Desconto'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Marca (opcional)</InputLabel>
                            <Select
                                value={formData.brand_id || ''}
                                onChange={(e) => setFormData({ ...formData, brand_id: e.target.value || null })}
                                label="Marca (opcional)"
                            >
                                <MenuItem value="">Todas as marcas</MenuItem>
                                {brands.map((brand) => (
                                    <MenuItem key={brand.brand_id} value={brand.brand_id}>
                                        {brand.brand_name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Autocomplete
                            freeSolo
                            options={productOptions}
                            getOptionLabel={(option) =>
                                typeof option === 'string' ? option : `${option.sku} - ${option.name || option.model}`
                            }
                            loading={loadingProducts}
                            onInputChange={(event, newInputValue) => {
                                setFormData({ ...formData, sku: newInputValue });
                                searchProducts(newInputValue);
                            }}
                            onChange={(event, newValue) => {
                                if (newValue && typeof newValue === 'object') {
                                    setFormData({
                                        ...formData,
                                        sku: newValue.sku,
                                        product_name: newValue.name || newValue.model || ''
                                    });
                                }
                            }}
                            inputValue={formData.sku}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="SKU do Produto (opcional)"
                                    helperText="Deixe em branco para aplicar a todos os produtos"
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {loadingProducts ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                        />

                        <Divider sx={{ my: 1 }} />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Quantidade Mínima"
                                type="number"
                                value={formData.min_qty}
                                onChange={(e) => setFormData({ ...formData, min_qty: e.target.value })}
                                inputProps={{ min: 1 }}
                                fullWidth
                                required
                            />
                            <TextField
                                label="Quantidade Máxima"
                                type="number"
                                value={formData.max_qty}
                                onChange={(e) => setFormData({ ...formData, max_qty: e.target.value })}
                                inputProps={{ min: 1 }}
                                fullWidth
                                required
                            />
                        </Box>

                        <TextField
                            label="Desconto (%)"
                            type="number"
                            value={formData.discount_pct}
                            onChange={(e) => setFormData({ ...formData, discount_pct: e.target.value })}
                            inputProps={{ step: 0.01, min: 0, max: 100 }}
                            fullWidth
                            required
                            helperText="Ex: 5 para 5% de desconto"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                            }
                            label="Ativo"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal} disabled={saving}>Cancelar</Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={saving || formData.min_qty < 1 || formData.discount_pct < 0}
                        sx={{ bgcolor: '#10b981' }}
                    >
                        {saving ? <CircularProgress size={24} /> : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <Typography>
                        Tem certeza que deseja excluir este desconto?
                    </Typography>
                    {itemToDelete && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                            <Typography variant="body2">
                                <strong>SKU:</strong> {itemToDelete.sku || 'Todos'}<br />
                                <strong>Faixa:</strong> {formatNumber(itemToDelete.min_qty)} - {formatNumber(itemToDelete.max_qty)}<br />
                                <strong>Desconto:</strong> {itemToDelete.discount_pct?.toFixed(2)}%
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancelar</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleting}>
                        {deleting ? <CircularProgress size={24} /> : 'Excluir'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default QuantityDiscountsPage;
