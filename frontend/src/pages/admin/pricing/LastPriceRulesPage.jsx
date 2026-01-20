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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    ArrowBack as BackIcon,
    Refresh as RefreshIcon,
    History as AnchorIcon,
} from '@mui/icons-material';
import * as pricingAdminService from '../../../services/pricingAdmin.service';

const ANCHOR_TYPES = [
    { value: 'last_sale', label: 'Última Venda' },
    { value: 'avg_last_3', label: 'Média Últimas 3 Vendas' },
    { value: 'avg_last_6', label: 'Média Últimas 6 Vendas' },
    { value: 'min_last_6', label: 'Mínimo Últimas 6 Vendas' },
    { value: 'max_last_6', label: 'Máximo Últimas 6 Vendas' },
];

const INITIAL_FORM_STATE = {
    customer_id: null,
    customer_name: '',
    sku: '',
    product_name: '',
    anchor_type: 'last_sale',
    max_increase_pct: 10,
    max_decrease_pct: 10,
    lookback_days: 90,
    is_active: true,
};

function LastPriceRulesPage() {
    const navigate = useNavigate();

    // States
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Pagination
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

    // Load rules
    const loadRules = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                skip: page * rowsPerPage,
                limit: rowsPerPage,
                ...(search && { search }),
            };
            const response = await pricingAdminService.listLastPriceRules(params);
            setRules(response.data?.items || response.data || []);
            setTotal(response.data?.total || response.data?.length || 0);
        } catch (err) {
            setError(err.message || 'Erro ao carregar regras de ancoragem');
            setRules([]);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, search]);

    useEffect(() => {
        loadRules();
    }, [loadRules]);

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
            anchor_type: item.anchor_type || 'last_sale',
            max_increase_pct: item.max_increase_pct || 10,
            max_decrease_pct: item.max_decrease_pct || 10,
            lookback_days: item.lookback_days || 90,
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
                anchor_type: formData.anchor_type,
                max_increase_pct: parseFloat(formData.max_increase_pct) || 10,
                max_decrease_pct: parseFloat(formData.max_decrease_pct) || 10,
                lookback_days: parseInt(formData.lookback_days) || 90,
                is_active: formData.is_active,
            };

            if (modalMode === 'create') {
                await pricingAdminService.createLastPriceRule(data);
                setSuccess('Regra de ancoragem criada com sucesso!');
            } else {
                await pricingAdminService.updateLastPriceRule(formData.id, data);
                setSuccess('Regra de ancoragem atualizada com sucesso!');
            }
            handleCloseModal();
            loadRules();
        } catch (err) {
            setError(err.message || 'Erro ao salvar regra');
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
            await pricingAdminService.deleteLastPriceRule(itemToDelete.id);
            setSuccess('Regra de ancoragem removida com sucesso!');
            setDeleteDialogOpen(false);
            setItemToDelete(null);
            loadRules();
        } catch (err) {
            setError(err.message || 'Erro ao remover regra');
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

    const getAnchorTypeLabel = (type) => {
        const found = ANCHOR_TYPES.find(t => t.value === type);
        return found ? found.label : type;
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
                        <AnchorIcon sx={{ fontSize: 32, color: '#a855f7' }} />
                        Ancoragem de Preço
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gerenciar regras baseadas no último preço praticado
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                    sx={{ bgcolor: '#a855f7' }}
                >
                    Nova Regra
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

            {/* Info Box */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.light' }}>
                <Typography variant="body2">
                    <strong>Ancoragem de Preço:</strong> Define limites de variação de preço baseados nas vendas anteriores.
                    Isso evita grandes oscilações de preço para o mesmo cliente/produto.
                </Typography>
            </Paper>

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
                <Box sx={{ flex: 1 }} />
                <Tooltip title="Atualizar">
                    <IconButton onClick={loadRules} disabled={loading}>
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
                            <TableCell><strong>Tipo Âncora</strong></TableCell>
                            <TableCell align="right"><strong>Aum Máx %</strong></TableCell>
                            <TableCell align="right"><strong>Red Máx %</strong></TableCell>
                            <TableCell align="right"><strong>Período</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell align="right"><strong>Ações</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    {[...Array(9)].map((_, j) => (
                                        <TableCell key={j}><Skeleton /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : rules.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">Nenhuma regra de ancoragem encontrada</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            rules.map((item) => (
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
                                            label={getAnchorTypeLabel(item.anchor_type)}
                                            color="secondary"
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Chip
                                            label={`+${item.max_increase_pct?.toFixed(1) || '0'}%`}
                                            color="error"
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Chip
                                            label={`-${item.max_decrease_pct?.toFixed(1) || '0'}%`}
                                            color="success"
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">{item.lookback_days || 90} dias</TableCell>
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
                    {modalMode === 'create' ? 'Nova Regra de Ancoragem' : 'Editar Regra'}
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
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Tipo de Âncora</InputLabel>
                                <Select
                                    value={formData.anchor_type}
                                    onChange={(e) => setFormData({ ...formData, anchor_type: e.target.value })}
                                    label="Tipo de Âncora"
                                >
                                    {ANCHOR_TYPES.map((type) => (
                                        <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <TextField
                                label="Período (dias)"
                                type="number"
                                value={formData.lookback_days}
                                onChange={(e) => setFormData({ ...formData, lookback_days: e.target.value })}
                                inputProps={{ min: 1 }}
                                fullWidth
                                helperText="Dias a considerar"
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            {/* Empty for alignment */}
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Aumento Máximo (%)"
                                type="number"
                                value={formData.max_increase_pct}
                                onChange={(e) => setFormData({ ...formData, max_increase_pct: e.target.value })}
                                inputProps={{ step: 0.1, min: 0 }}
                                fullWidth
                                helperText="Quanto pode aumentar em relação à âncora"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Redução Máxima (%)"
                                type="number"
                                value={formData.max_decrease_pct}
                                onChange={(e) => setFormData({ ...formData, max_decrease_pct: e.target.value })}
                                inputProps={{ step: 0.1, min: 0 }}
                                fullWidth
                                helperText="Quanto pode reduzir em relação à âncora"
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
                        sx={{ bgcolor: '#a855f7' }}
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
                        Tem certeza que deseja excluir esta regra de ancoragem?
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

export default LastPriceRulesPage;
