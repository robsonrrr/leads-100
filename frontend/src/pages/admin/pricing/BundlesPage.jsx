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
    FormControlLabel,
    Switch,
    Alert,
    CircularProgress,
    Tooltip,
    TablePagination,
    Skeleton,
    Autocomplete,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Card,
    CardContent,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    ArrowBack as BackIcon,
    Refresh as RefreshIcon,
    Inventory as BundlesIcon,
    RemoveCircle as RemoveIcon,
    AddCircle as AddItemIcon,
} from '@mui/icons-material';
import * as pricingAdminService from '../../../services/pricingAdmin.service';

const INITIAL_BUNDLE_FORM = {
    name: '',
    description: '',
    discount_pct: 0,
    is_active: true,
};

function BundlesPage() {
    const navigate = useNavigate();

    // States
    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');

    // Bundle Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [formData, setFormData] = useState(INITIAL_BUNDLE_FORM);
    const [savingBundle, setSavingBundle] = useState(false);

    // Items Modal
    const [itemsModalOpen, setItemsModalOpen] = useState(false);
    const [selectedBundle, setSelectedBundle] = useState(null);
    const [bundleItems, setBundleItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [savingItems, setSavingItems] = useState(false);

    // Product search for adding items
    const [productSearch, setProductSearch] = useState('');
    const [productOptions, setProductOptions] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [newItemQty, setNewItemQty] = useState(1);

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bundleToDelete, setBundleToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Load bundles
    const loadBundles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                skip: page * rowsPerPage,
                limit: rowsPerPage,
                ...(search && { search }),
            };
            const response = await pricingAdminService.listBundles(params);
            setBundles(response.data?.items || response.data || []);
            setTotal(response.data?.total || response.data?.length || 0);
        } catch (err) {
            setError(err.message || 'Erro ao carregar bundles');
            setBundles([]);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, search]);

    useEffect(() => {
        loadBundles();
    }, [loadBundles]);

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

    // Bundle CRUD handlers
    const handleCreate = () => {
        setFormData(INITIAL_BUNDLE_FORM);
        setModalMode('create');
        setModalOpen(true);
    };

    const handleEdit = (bundle) => {
        setFormData({
            id: bundle.id,
            name: bundle.name || '',
            description: bundle.description || '',
            discount_pct: bundle.discount_pct || 0,
            is_active: bundle.is_active,
        });
        setModalMode('edit');
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setFormData(INITIAL_BUNDLE_FORM);
    };

    const handleSaveBundle = async () => {
        setSavingBundle(true);
        setError(null);
        try {
            const data = {
                name: formData.name,
                description: formData.description,
                discount_pct: parseFloat(formData.discount_pct) || 0,
                is_active: formData.is_active,
            };

            if (modalMode === 'create') {
                await pricingAdminService.createBundle(data);
                setSuccess('Bundle criado com sucesso!');
            } else {
                await pricingAdminService.updateBundle(formData.id, data);
                setSuccess('Bundle atualizado com sucesso!');
            }
            handleCloseModal();
            loadBundles();
        } catch (err) {
            setError(err.message || 'Erro ao salvar bundle');
        } finally {
            setSavingBundle(false);
        }
    };

    // Delete handlers
    const handleDeleteClick = (bundle) => {
        setBundleToDelete(bundle);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!bundleToDelete) return;
        setDeleting(true);
        setError(null);
        try {
            await pricingAdminService.deleteBundle(bundleToDelete.id);
            setSuccess('Bundle removido com sucesso!');
            setDeleteDialogOpen(false);
            setBundleToDelete(null);
            loadBundles();
        } catch (err) {
            setError(err.message || 'Erro ao remover bundle');
        } finally {
            setDeleting(false);
        }
    };

    // Items management
    const handleManageItems = async (bundle) => {
        setSelectedBundle(bundle);
        setItemsModalOpen(true);
        setLoadingItems(true);
        try {
            const response = await pricingAdminService.getBundle(bundle.id);
            setBundleItems(response.data?.items || response.data?.bundle?.items || []);
        } catch (err) {
            setError(err.message || 'Erro ao carregar itens do bundle');
            setBundleItems([]);
        } finally {
            setLoadingItems(false);
        }
    };

    const handleAddItem = (product) => {
        if (!product) return;

        // Check if item already exists
        const exists = bundleItems.some(item => item.sku === product.sku);
        if (exists) {
            setError('Este produto já está no bundle');
            return;
        }

        setBundleItems([...bundleItems, {
            sku: product.sku,
            product_name: product.name || product.model || product.sku,
            quantity: newItemQty,
        }]);
        setProductSearch('');
        setNewItemQty(1);
        setProductOptions([]);
    };

    const handleRemoveItem = (sku) => {
        setBundleItems(bundleItems.filter(item => item.sku !== sku));
    };

    const handleUpdateItemQty = (sku, qty) => {
        setBundleItems(bundleItems.map(item =>
            item.sku === sku ? { ...item, quantity: parseInt(qty) || 1 } : item
        ));
    };

    const handleSaveItems = async () => {
        if (!selectedBundle) return;
        setSavingItems(true);
        setError(null);
        try {
            await pricingAdminService.manageBundleItems(selectedBundle.id, {
                items: bundleItems.map(item => ({
                    sku: item.sku,
                    quantity: item.quantity,
                }))
            });
            setSuccess('Itens do bundle atualizados com sucesso!');
            setItemsModalOpen(false);
            loadBundles();
        } catch (err) {
            setError(err.message || 'Erro ao salvar itens do bundle');
        } finally {
            setSavingItems(false);
        }
    };

    // Clear messages
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

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
                        <BundlesIcon sx={{ fontSize: 32, color: '#f59e0b' }} />
                        Combos / Bundles
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gerenciar kits de produtos com preços especiais
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                    sx={{ bgcolor: '#f59e0b' }}
                >
                    Novo Bundle
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
                    placeholder="Buscar bundles..."
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
                <Box sx={{ flex: 1 }} />
                <Tooltip title="Atualizar">
                    <IconButton onClick={loadBundles} disabled={loading}>
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
                            <TableCell><strong>Nome</strong></TableCell>
                            <TableCell><strong>Descrição</strong></TableCell>
                            <TableCell align="center"><strong>Itens</strong></TableCell>
                            <TableCell align="right"><strong>Desconto %</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell align="right"><strong>Ações</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    {[...Array(7)].map((_, j) => (
                                        <TableCell key={j}><Skeleton /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : bundles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">Nenhum bundle encontrado</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            bundles.map((bundle) => (
                                <TableRow key={bundle.id} hover>
                                    <TableCell>{bundle.id}</TableCell>
                                    <TableCell>
                                        <Typography fontWeight="medium">{bundle.name}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {bundle.description || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={bundle.items_count || bundle.items?.length || 0}
                                            size="small"
                                            color="primary"
                                            onClick={() => handleManageItems(bundle)}
                                            sx={{ cursor: 'pointer' }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Chip
                                            label={`${bundle.discount_pct?.toFixed(2) || '0.00'}%`}
                                            color="success"
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={bundle.is_active ? 'Ativo' : 'Inativo'}
                                            color={bundle.is_active ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Gerenciar Itens">
                                            <IconButton onClick={() => handleManageItems(bundle)} color="primary">
                                                <AddItemIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Editar">
                                            <IconButton onClick={() => handleEdit(bundle)} color="primary">
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Excluir">
                                            <IconButton onClick={() => handleDeleteClick(bundle)} color="error">
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={total}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, p) => setPage(p)}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    labelRowsPerPage="Itens por página:"
                />
            </TableContainer>

            {/* Bundle Modal */}
            <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {modalMode === 'create' ? 'Novo Bundle' : 'Editar Bundle'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Nome do Bundle"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            fullWidth
                            helperText="Ex: Kit Rolamentos Premium"
                        />
                        <TextField
                            label="Descrição"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            fullWidth
                            multiline
                            rows={2}
                        />
                        <TextField
                            label="Desconto Global (%)"
                            type="number"
                            value={formData.discount_pct}
                            onChange={(e) => setFormData({ ...formData, discount_pct: e.target.value })}
                            inputProps={{ step: 0.01, min: 0, max: 100 }}
                            fullWidth
                            helperText="Desconto aplicado ao valor total do bundle"
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
                    <Button onClick={handleCloseModal} disabled={savingBundle}>Cancelar</Button>
                    <Button
                        onClick={handleSaveBundle}
                        variant="contained"
                        disabled={savingBundle || !formData.name}
                        sx={{ bgcolor: '#f59e0b' }}
                    >
                        {savingBundle ? <CircularProgress size={24} /> : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Items Modal */}
            <Dialog open={itemsModalOpen} onClose={() => setItemsModalOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Gerenciar Itens - {selectedBundle?.name}
                </DialogTitle>
                <DialogContent>
                    {loadingItems ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            {/* Add item section */}
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="subtitle2" gutterBottom>Adicionar Produto</Typography>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                        <Autocomplete
                                            sx={{ flex: 1 }}
                                            options={productOptions}
                                            getOptionLabel={(option) =>
                                                typeof option === 'string' ? option : `${option.sku} - ${option.name || option.model}`
                                            }
                                            loading={loadingProducts}
                                            onInputChange={(event, newInputValue) => {
                                                setProductSearch(newInputValue);
                                                searchProducts(newInputValue);
                                            }}
                                            onChange={(event, newValue) => handleAddItem(newValue)}
                                            inputValue={productSearch}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Buscar produto por SKU ou nome"
                                                    size="small"
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
                                        <TextField
                                            label="Qtd"
                                            type="number"
                                            value={newItemQty}
                                            onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                                            size="small"
                                            sx={{ width: 80 }}
                                            inputProps={{ min: 1 }}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>

                            <Divider />

                            {/* Items list */}
                            <Typography variant="subtitle2">
                                Itens do Bundle ({bundleItems.length})
                            </Typography>

                            {bundleItems.length === 0 ? (
                                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                    Nenhum item adicionado. Use a busca acima para adicionar produtos.
                                </Typography>
                            ) : (
                                <List>
                                    {bundleItems.map((item, index) => (
                                        <ListItem
                                            key={item.sku}
                                            sx={{ bgcolor: index % 2 === 0 ? 'grey.50' : 'white', borderRadius: 1 }}
                                        >
                                            <ListItemText
                                                primary={item.product_name || item.sku}
                                                secondary={`SKU: ${item.sku}`}
                                            />
                                            <TextField
                                                label="Qtd"
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleUpdateItemQty(item.sku, e.target.value)}
                                                size="small"
                                                sx={{ width: 80, mr: 1 }}
                                                inputProps={{ min: 1 }}
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton edge="end" onClick={() => handleRemoveItem(item.sku)} color="error">
                                                    <RemoveIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setItemsModalOpen(false)} disabled={savingItems}>Cancelar</Button>
                    <Button
                        onClick={handleSaveItems}
                        variant="contained"
                        disabled={savingItems}
                        sx={{ bgcolor: '#f59e0b' }}
                    >
                        {savingItems ? <CircularProgress size={24} /> : 'Salvar Itens'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <Typography>
                        Tem certeza que deseja excluir o bundle <strong>{bundleToDelete?.name}</strong>?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Todos os itens associados também serão removidos.
                    </Typography>
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

export default BundlesPage;
