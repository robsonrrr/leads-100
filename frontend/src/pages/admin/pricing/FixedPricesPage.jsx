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
    Grid,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    ArrowBack as BackIcon,
    Refresh as RefreshIcon,
    LocalOffer as FixedPriceIcon,
    FileUpload as ImportIcon,
    FileDownload as ExportIcon,
} from '@mui/icons-material';
import * as pricingAdminService from '../../../services/pricingAdmin.service';

const INITIAL_FORM_STATE = {
    customer_id: null,
    customer_name: '',
    sku: '',
    product_name: '',
    fixed_price: 0,
    start_date: '',
    end_date: '',
    is_active: true,
};

function FixedPricesPage() {
    const navigate = useNavigate();

    // States
    const [fixedPrices, setFixedPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Pagination and filters
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [saving, setSaving] = useState(false);

    // Autocomplete
    const [customerOptions, setCustomerOptions] = useState([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [productOptions, setProductOptions] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Import dialog
    const [importDialogOpen, setImportDialogOpen] = useState(false);

    // Load fixed prices
    const loadFixedPrices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                skip: page * rowsPerPage,
                limit: rowsPerPage,
                ...(search && { search }),
            };
            const response = await pricingAdminService.listFixedPrices(params);
            setFixedPrices(response.data?.items || response.data || []);
            setTotal(response.data?.total || response.data?.length || 0);
        } catch (err) {
            setError(err.message || 'Erro ao carregar preços fixos');
            setFixedPrices([]);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, search]);

    useEffect(() => {
        loadFixedPrices();
    }, [loadFixedPrices]);

    // Search customers
    const searchCustomers = async (query) => {
        if (!query || query.length < 2) return;
        setLoadingCustomers(true);
        try {
            const response = await pricingAdminService.searchCustomers(query);
            setCustomerOptions(response.data || []);
        } catch (err) {
            console.error('Erro ao buscar clientes:', err);
        } finally {
            setLoadingCustomers(false);
        }
    };

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

    const handleEdit = (item) => {
        setFormData({
            id: item.id,
            customer_id: item.customer_id,
            customer_name: item.customer_name || '',
            sku: item.sku || '',
            product_name: item.product_name || '',
            fixed_price: item.fixed_price || 0,
            start_date: item.start_date ? item.start_date.split('T')[0] : '',
            end_date: item.end_date ? item.end_date.split('T')[0] : '',
            is_active: item.is_active,
        });
        setModalMode('edit');
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setFormData(INITIAL_FORM_STATE);
        setCustomerOptions([]);
        setProductOptions([]);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const data = {
                customer_id: formData.customer_id,
                sku: formData.sku,
                fixed_price: parseFloat(formData.fixed_price) || 0,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null,
                is_active: formData.is_active,
            };

            if (modalMode === 'create') {
                await pricingAdminService.createFixedPrice(data);
                setSuccess('Preço fixo criado com sucesso!');
            } else {
                await pricingAdminService.updateFixedPrice(formData.id, data);
                setSuccess('Preço fixo atualizado com sucesso!');
            }
            handleCloseModal();
            loadFixedPrices();
        } catch (err) {
            setError(err.message || 'Erro ao salvar preço fixo');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        setDeleting(true);
        setError(null);
        try {
            await pricingAdminService.deleteFixedPrice(itemToDelete.id);
            setSuccess('Preço fixo removido com sucesso!');
            setDeleteDialogOpen(false);
            setItemToDelete(null);
            loadFixedPrices();
        } catch (err) {
            setError(err.message || 'Erro ao remover preço fixo');
        } finally {
            setDeleting(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await pricingAdminService.exportFixedPrices();
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `precos_fixos_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            setSuccess('Exportação realizada com sucesso!');
        } catch (err) {
            setError(err.message || 'Erro ao exportar dados');
        }
    };

    // Clear messages
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const formatCurrency = (value) => {
        if (value === null || value === undefined) return '-';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR');
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
                        <FixedPriceIcon sx={{ fontSize: 32, color: '#ef4444' }} />
                        Preços Fixos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gerenciar preços específicos por cliente e produto
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<ExportIcon />}
                    onClick={handleExport}
                    sx={{ mr: 1 }}
                >
                    Exportar CSV
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<ImportIcon />}
                    onClick={() => navigate('/admin/pricing/fixed-prices/batch')}
                    sx={{ mr: 1 }}
                >
                    Importar Lote
                </Button>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                    sx={{ bgcolor: '#ef4444' }}
                >
                    Novo Preço
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
                    placeholder="Buscar por cliente, SKU ou produto..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    size="small"
                    sx={{ width: 400 }}
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
                    <IconButton onClick={loadFixedPrices} disabled={loading}>
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
                            <TableCell><strong>Cliente</strong></TableCell>
                            <TableCell><strong>SKU / Produto</strong></TableCell>
                            <TableCell align="right"><strong>Preço Fixo</strong></TableCell>
                            <TableCell><strong>Vigência</strong></TableCell>
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
                        ) : fixedPrices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">Nenhum preço fixo encontrado</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            fixedPrices.map((item) => (
                                <TableRow key={item.id} hover>
                                    <TableCell>{item.id}</TableCell>
                                    <TableCell>
                                        <Typography fontWeight="medium">
                                            {item.customer_name || `Cliente #${item.customer_id}`}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            ID: {item.customer_id}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography fontWeight="medium">{item.sku}</Typography>
                                        {item.product_name && (
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                {item.product_name}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Chip
                                            label={formatCurrency(item.fixed_price)}
                                            color="error"
                                            size="small"
                                            sx={{ fontWeight: 'bold' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption">
                                            {formatDate(item.start_date)} - {formatDate(item.end_date)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={item.is_active ? 'Ativo' : 'Inativo'}
                                            color={item.is_active ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Editar">
                                            <IconButton onClick={() => handleEdit(item)} color="primary">
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Excluir">
                                            <IconButton onClick={() => handleDeleteClick(item)} color="error">
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

            {/* Create/Edit Modal */}
            <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
                <DialogTitle>
                    {modalMode === 'create' ? 'Novo Preço Fixo' : 'Editar Preço Fixo'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                options={customerOptions}
                                getOptionLabel={(option) =>
                                    typeof option === 'string' ? option : `${option.name} (ID: ${option.id})`
                                }
                                loading={loadingCustomers}
                                onInputChange={(event, newInputValue) => {
                                    searchCustomers(newInputValue);
                                }}
                                onChange={(event, newValue) => {
                                    setFormData({
                                        ...formData,
                                        customer_id: newValue ? newValue.id : null,
                                        customer_name: newValue ? newValue.name : ''
                                    });
                                }}
                                value={formData.customer_id ? { id: formData.customer_id, name: formData.customer_name } : null}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Cliente"
                                        required
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {loadingCustomers ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
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
                                        label="SKU do Produto"
                                        required
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
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="Preço Fixo (R$)"
                                type="number"
                                value={formData.fixed_price}
                                onChange={(e) => setFormData({ ...formData, fixed_price: e.target.value })}
                                inputProps={{ step: 0.01, min: 0 }}
                                fullWidth
                                required
                            />
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <TextField
                                label="Data Início"
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <TextField
                                label="Data Fim"
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    />
                                }
                                label="Ativo"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal} disabled={saving}>Cancelar</Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={saving || !formData.customer_id || !formData.sku}
                        sx={{ bgcolor: '#ef4444' }}
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
                        Tem certeza que deseja excluir o preço fixo de <strong>{itemToDelete?.sku}</strong> para o cliente <strong>{itemToDelete?.customer_name || itemToDelete?.customer_id}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancelar</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleting}>
                        {deleting ? <CircularProgress size={24} /> : 'Excluir'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Import Dialog */}
            <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Importar Preços Fixos</DialogTitle>
                <DialogContent>
                    <Box sx={{ py: 2 }}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            O arquivo CSV deve conter as colunas: <strong>customer_id, sku, fixed_price, start_date, end_date</strong>
                        </Alert>
                        <TextField
                            type="file"
                            fullWidth
                            inputProps={{ accept: '.csv' }}
                            helperText="Selecione um arquivo CSV para importar"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setImportDialogOpen(false)}>Cancelar</Button>
                    <Button variant="contained" color="primary">
                        Importar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default FixedPricesPage;
