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
    Grid,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    ArrowBack as BackIcon,
    Refresh as RefreshIcon,
    LocationOn as RegionIcon,
} from '@mui/icons-material';
import * as pricingAdminService from '../../../services/pricingAdmin.service';

// Estados brasileiros
const BRAZILIAN_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const INITIAL_FORM_STATE = {
    customer_id: null,
    customer_name: '',
    sku: '',
    product_name: '',
    region: '',
    state: '',
    min_price: 0,
    max_discount_pct: 0,
    is_active: true,
};

function RegionalProtectionPage() {
    const navigate = useNavigate();

    // States
    const [protections, setProtections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [stateFilter, setStateFilter] = useState('');

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

    // Load protections
    const loadProtections = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                skip: page * rowsPerPage,
                limit: rowsPerPage,
                ...(search && { search }),
                ...(stateFilter && { state: stateFilter }),
            };
            const response = await pricingAdminService.listRegionalProtections(params);
            setProtections(response.data?.items || response.data || []);
            setTotal(response.data?.total || response.data?.length || 0);
        } catch (err) {
            setError(err.message || 'Erro ao carregar proteções regionais');
            setProtections([]);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, search, stateFilter]);

    useEffect(() => {
        loadProtections();
    }, [loadProtections]);

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
            region: item.region || '',
            state: item.state || '',
            min_price: item.min_price || 0,
            max_discount_pct: item.max_discount_pct || 0,
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
                sku: formData.sku || null,
                region: formData.region || null,
                state: formData.state || null,
                min_price: parseFloat(formData.min_price) || 0,
                max_discount_pct: parseFloat(formData.max_discount_pct) || 0,
                is_active: formData.is_active,
            };

            if (modalMode === 'create') {
                await pricingAdminService.createRegionalProtection(data);
                setSuccess('Proteção regional criada com sucesso!');
            } else {
                await pricingAdminService.updateRegionalProtection(formData.id, data);
                setSuccess('Proteção regional atualizada com sucesso!');
            }
            handleCloseModal();
            loadProtections();
        } catch (err) {
            setError(err.message || 'Erro ao salvar proteção regional');
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
            await pricingAdminService.deleteRegionalProtection(itemToDelete.id);
            setSuccess('Proteção regional removida com sucesso!');
            setDeleteDialogOpen(false);
            setItemToDelete(null);
            loadProtections();
        } catch (err) {
            setError(err.message || 'Erro ao remover proteção');
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

    const formatCurrency = (value) => {
        if (value === null || value === undefined) return '-';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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
                        <RegionIcon sx={{ fontSize: 32, color: '#0ea5e9' }} />
                        Proteção Regional
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gerenciar regras de preço por região ou estado
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                    sx={{ bgcolor: '#0ea5e9' }}
                >
                    Nova Proteção
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
                    placeholder="Buscar por cliente ou produto..."
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
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Estado</InputLabel>
                    <Select
                        value={stateFilter}
                        onChange={(e) => { setStateFilter(e.target.value); setPage(0); }}
                        label="Estado"
                    >
                        <MenuItem value="">Todos</MenuItem>
                        {BRAZILIAN_STATES.map((state) => (
                            <MenuItem key={state} value={state}>{state}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Box sx={{ flex: 1 }} />
                <Tooltip title="Atualizar">
                    <IconButton onClick={loadProtections} disabled={loading}>
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
                            <TableCell><strong>Produto</strong></TableCell>
                            <TableCell><strong>Estado</strong></TableCell>
                            <TableCell align="right"><strong>Preço Mín</strong></TableCell>
                            <TableCell align="right"><strong>Desc Máx %</strong></TableCell>
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
                        ) : protections.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">Nenhuma proteção regional encontrada</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            protections.map((item) => (
                                <TableRow key={item.id} hover>
                                    <TableCell>{item.id}</TableCell>
                                    <TableCell>
                                        {item.customer_name || item.customer_id || (
                                            <Chip label="Todos" size="small" variant="outlined" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {item.sku || (
                                            <Chip label="Todos" size="small" variant="outlined" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={item.state || item.region || 'Todos'}
                                            color="primary"
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell align="right">{formatCurrency(item.min_price)}</TableCell>
                                    <TableCell align="right">
                                        <Chip
                                            label={`${item.max_discount_pct?.toFixed(2) || '0.00'}%`}
                                            color="warning"
                                            size="small"
                                        />
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

            {/* Modal */}
            <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
                <DialogTitle>
                    {modalMode === 'create' ? 'Nova Proteção Regional' : 'Editar Proteção'}
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
                                        label="Cliente (opcional)"
                                        helperText="Deixe em branco para todos os clientes"
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
                                        label="SKU do Produto (opcional)"
                                        helperText="Deixe em branco para todos os produtos"
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Estado</InputLabel>
                                <Select
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    label="Estado"
                                >
                                    <MenuItem value="">Todos</MenuItem>
                                    {BRAZILIAN_STATES.map((state) => (
                                        <MenuItem key={state} value={state}>{state}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <TextField
                                label="Preço Mínimo (R$)"
                                type="number"
                                value={formData.min_price}
                                onChange={(e) => setFormData({ ...formData, min_price: e.target.value })}
                                inputProps={{ step: 0.01, min: 0 }}
                                fullWidth
                                helperText="Preço mínimo permitido"
                            />
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <TextField
                                label="Desconto Máximo (%)"
                                type="number"
                                value={formData.max_discount_pct}
                                onChange={(e) => setFormData({ ...formData, max_discount_pct: e.target.value })}
                                inputProps={{ step: 0.01, min: 0, max: 100 }}
                                fullWidth
                                helperText="Percentual máximo de desconto"
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
                        disabled={saving}
                        sx={{ bgcolor: '#0ea5e9' }}
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
                        Tem certeza que deseja excluir esta proteção regional?
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

export default RegionalProtectionPage;
