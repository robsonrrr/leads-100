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
    Tabs,
    Tab,
    Grid,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    ArrowBack as BackIcon,
    Refresh as RefreshIcon,
    Campaign as PromotionsIcon,
    ContentCopy as DuplicateIcon,
    PlayArrow as ActivateIcon,
    Stop as DeactivateIcon,
} from '@mui/icons-material';
import * as pricingAdminService from '../../../services/pricingAdmin.service';

// Segmentos disponíveis
const SEGMENTS = [
    { id: 0, name: 'Todos' },
    { id: 1, name: 'Máquinas' },
    { id: 2, name: 'Rolamentos' },
    { id: 3, name: 'Peças Têxteis' },
    { id: 5, name: 'Autopeças' },
    { id: 6, name: 'Motopeças' },
];

const DISCOUNT_TYPES = [
    { value: 'percentage', label: 'Percentual (%)' },
    { value: 'fixed', label: 'Valor Fixo (R$)' },
];

const INITIAL_FORM_STATE = {
    name: '',
    description: '',
    segment_id: null,
    sku: '',
    discount_type: 'percentage',
    discount_value: 0,
    start_date: '',
    end_date: '',
    max_uses: null,
    customer_id: null,
    is_active: true,
};

function PromotionsPage() {
    const navigate = useNavigate();

    // Tab state (segment filter)
    const [activeTab, setActiveTab] = useState(0);

    // States
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

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

    // Get current segment ID from tab
    const getCurrentSegmentId = () => {
        if (activeTab === 0) return null; // All
        return SEGMENTS[activeTab]?.id || null;
    };

    // Load promotions
    const loadPromotions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const segmentId = getCurrentSegmentId();
            const params = {
                skip: page * rowsPerPage,
                limit: rowsPerPage,
                ...(search && { search }),
                ...(segmentId && { segment_id: segmentId }),
                ...(statusFilter && { is_active: statusFilter === 'active' }),
            };
            const response = await pricingAdminService.listPromotions(params);
            setPromotions(response.data?.items || response.data || []);
            setTotal(response.data?.total || response.data?.length || 0);
        } catch (err) {
            setError(err.message || 'Erro ao carregar promoções');
            setPromotions([]);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, search, statusFilter, activeTab]);

    useEffect(() => {
        loadPromotions();
    }, [loadPromotions]);

    // Search products
    const searchProducts = async (query) => {
        if (!query || query.length < 2) {
            setProductOptions([]);
            return;
        }
        setLoadingProducts(true);
        try {
            const response = await pricingAdminService.searchProducts(query);
            // The API returns: { success: true, data: { status: 'success', count: N, products: [...] } }
            // After apiRequest processing, we get: { status: 'success', count: N, products: [...] }
            let products = [];
            if (response?.products) {
                // Direct response with products array
                products = response.products;
            } else if (response?.data?.products) {
                // Nested in data
                products = response.data.products;
            } else if (response?.data?.items) {
                products = response.data.items;
            } else if (Array.isArray(response?.data)) {
                products = response.data;
            } else if (Array.isArray(response)) {
                products = response;
            }
            console.log('searchProducts response:', response, 'parsed products:', products);
            setProductOptions(Array.isArray(products) ? products : []);
        } catch (err) {
            console.error('Erro ao buscar produtos:', err);
            setProductOptions([]);
        } finally {
            setLoadingProducts(false);
        }
    };

    // Determine promotion status
    const getPromotionStatus = (promotion) => {
        if (!promotion.is_active) return { label: 'Inativa', color: 'default' };

        const now = new Date();
        const start = promotion.start_date ? new Date(promotion.start_date) : null;
        const end = promotion.end_date ? new Date(promotion.end_date) : null;

        if (end && now > end) return { label: 'Expirada', color: 'error' };
        if (start && now < start) return { label: 'Agendada', color: 'warning' };
        return { label: 'Ativa', color: 'success' };
    };

    // Handlers
    const handleCreate = () => {
        setFormData({
            ...INITIAL_FORM_STATE,
            segment_id: getCurrentSegmentId(),
        });
        setModalMode('create');
        setModalOpen(true);
    };

    const handleEdit = (promotion) => {
        setFormData({
            id: promotion.id,
            name: promotion.name || '',
            description: promotion.description || '',
            segment_id: promotion.segment_id,
            sku: promotion.sku || '',
            discount_type: promotion.discount_type || 'percentage',
            discount_value: promotion.discount_value || 0,
            start_date: promotion.start_date ? promotion.start_date.split('T')[0] : '',
            end_date: promotion.end_date ? promotion.end_date.split('T')[0] : '',
            max_uses: promotion.max_uses || null,
            customer_id: promotion.customer_id || null,
            is_active: promotion.is_active,
        });
        setModalMode('edit');
        setModalOpen(true);
    };

    const handleDuplicate = (promotion) => {
        setFormData({
            ...INITIAL_FORM_STATE,
            name: `${promotion.name} (Cópia)`,
            description: promotion.description || '',
            segment_id: promotion.segment_id,
            sku: promotion.sku || '',
            discount_type: promotion.discount_type || 'percentage',
            discount_value: promotion.discount_value || 0,
            max_uses: promotion.max_uses || null,
            is_active: false, // Starts as inactive
        });
        setModalMode('create');
        setModalOpen(true);
    };

    const handleToggleActive = async (promotion) => {
        try {
            await pricingAdminService.updatePromotion(promotion.id, {
                is_active: !promotion.is_active,
            });
            setSuccess(`Promoção ${promotion.is_active ? 'desativada' : 'ativada'} com sucesso!`);
            loadPromotions();
        } catch (err) {
            setError(err.message || 'Erro ao alterar status da promoção');
        }
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
                name: formData.name,
                description: formData.description,
                segment_id: formData.segment_id,
                sku: formData.sku || null,
                discount_type: formData.discount_type,
                discount_value: parseFloat(formData.discount_value) || 0,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null,
                max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
                customer_id: formData.customer_id,
                is_active: formData.is_active,
            };

            if (modalMode === 'create') {
                await pricingAdminService.createPromotion(data);
                setSuccess('Promoção criada com sucesso!');
            } else {
                await pricingAdminService.updatePromotion(formData.id, data);
                setSuccess('Promoção atualizada com sucesso!');
            }
            handleCloseModal();
            loadPromotions();
        } catch (err) {
            setError(err.message || 'Erro ao salvar promoção');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (promotion) => {
        setItemToDelete(promotion);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        setDeleting(true);
        setError(null);
        try {
            await pricingAdminService.deletePromotion(itemToDelete.id);
            setSuccess('Promoção removida com sucesso!');
            setDeleteDialogOpen(false);
            setItemToDelete(null);
            loadPromotions();
        } catch (err) {
            setError(err.message || 'Erro ao remover promoção');
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

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const formatDiscount = (type, value) => {
        if (type === 'percentage') return `${value?.toFixed(2) || 0}%`;
        return `R$ ${value?.toFixed(2) || 0}`;
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
                        <PromotionsIcon sx={{ fontSize: 32, color: '#ec4899' }} />
                        Promoções
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gerenciar promoções por segmento e produto
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                    sx={{ bgcolor: '#ec4899' }}
                >
                    Nova Promoção
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

            {/* Segment Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, v) => { setActiveTab(v); setPage(0); }}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {SEGMENTS.map((seg, idx) => (
                        <Tab key={seg.id} label={seg.name} />
                    ))}
                </Tabs>
            </Paper>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                    placeholder="Buscar por nome ou SKU..."
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
                    <InputLabel>Status</InputLabel>
                    <Select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                        label="Status"
                    >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="active">Ativas</MenuItem>
                        <MenuItem value="inactive">Inativas</MenuItem>
                    </Select>
                </FormControl>
                <Box sx={{ flex: 1 }} />
                <Tooltip title="Atualizar">
                    <IconButton onClick={loadPromotions} disabled={loading}>
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
                            <TableCell><strong>Segmento</strong></TableCell>
                            <TableCell><strong>SKU</strong></TableCell>
                            <TableCell align="right"><strong>Desconto</strong></TableCell>
                            <TableCell><strong>Vigência</strong></TableCell>
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
                        ) : promotions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">Nenhuma promoção encontrada</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            promotions.map((promotion) => {
                                const status = getPromotionStatus(promotion);
                                const segment = SEGMENTS.find(s => s.id === promotion.segment_id);
                                return (
                                    <TableRow key={promotion.id} hover>
                                        <TableCell>{promotion.id}</TableCell>
                                        <TableCell>
                                            <Typography fontWeight="medium">{promotion.name}</Typography>
                                            {promotion.description && (
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    {promotion.description}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {segment ? (
                                                <Chip label={segment.name} size="small" variant="outlined" />
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {promotion.sku || <Chip label="Todos" size="small" variant="outlined" />}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Chip
                                                label={formatDiscount(promotion.discount_type, promotion.discount_value)}
                                                color="success"
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption">
                                                {formatDate(promotion.start_date)} - {formatDate(promotion.end_date)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={status.label}
                                                color={status.color}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title={promotion.is_active ? 'Desativar' : 'Ativar'}>
                                                <IconButton
                                                    onClick={() => handleToggleActive(promotion)}
                                                    color={promotion.is_active ? 'warning' : 'success'}
                                                    size="small"
                                                >
                                                    {promotion.is_active ? <DeactivateIcon /> : <ActivateIcon />}
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Duplicar">
                                                <IconButton onClick={() => handleDuplicate(promotion)} color="info" size="small">
                                                    <DuplicateIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Editar">
                                                <IconButton onClick={() => handleEdit(promotion)} color="primary" size="small">
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Excluir">
                                                <IconButton onClick={() => handleDeleteClick(promotion)} color="error" size="small">
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
                    {modalMode === 'create' ? 'Nova Promoção' : 'Editar Promoção'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={8}>
                            <TextField
                                label="Nome da Promoção"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Segmento</InputLabel>
                                <Select
                                    value={formData.segment_id || ''}
                                    onChange={(e) => setFormData({ ...formData, segment_id: e.target.value || null })}
                                    label="Segmento"
                                >
                                    <MenuItem value="">Todos</MenuItem>
                                    {SEGMENTS.filter(s => s.id !== 0).map((seg) => (
                                        <MenuItem key={seg.id} value={seg.id}>{seg.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Descrição"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                fullWidth
                                multiline
                                rows={2}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                freeSolo
                                options={productOptions}
                                getOptionLabel={(option) =>
                                    typeof option === 'string' ? option : option.sku || ''
                                }
                                isOptionEqualToValue={(option, value) =>
                                    option.sku === value || option.sku === value?.sku
                                }
                                loading={loadingProducts}
                                onInputChange={(event, newInputValue, reason) => {
                                    if (reason === 'input') {
                                        setFormData({ ...formData, sku: newInputValue });
                                        searchProducts(newInputValue);
                                    }
                                }}
                                onChange={(event, newValue) => {
                                    if (newValue && typeof newValue === 'object') {
                                        setFormData({ ...formData, sku: newValue.sku });
                                    } else if (newValue === null) {
                                        setFormData({ ...formData, sku: '' });
                                    }
                                }}
                                inputValue={formData.sku}
                                slotProps={{
                                    popper: {
                                        sx: { zIndex: 1500 }
                                    },
                                    paper: {
                                        sx: { maxHeight: 300 }
                                    }
                                }}
                                renderOption={(props, option) => {
                                    const { key, ...restProps } = props;
                                    return (
                                        <Box component="li" key={option?.sku || key} {...restProps}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {option?.model || option?.name || 'Sem modelo'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    SKU: {option?.sku || 'N/A'} {(option?.brand || option?.brand_name) ? `• ${option.brand || option.brand_name}` : ''}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    );
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Buscar Produto (SKU ou Modelo)"
                                        placeholder="Digite SKU ou modelo do produto..."
                                        helperText="Deixe em branco para todos os produtos"
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
                                noOptionsText="Nenhum produto encontrado"
                                loadingText="Buscando produtos..."
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Tipo de Desconto</InputLabel>
                                <Select
                                    value={formData.discount_type}
                                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                                    label="Tipo de Desconto"
                                >
                                    {DISCOUNT_TYPES.map((type) => (
                                        <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <TextField
                                label={formData.discount_type === 'percentage' ? 'Desconto (%)' : 'Desconto (R$)'}
                                type="number"
                                value={formData.discount_value}
                                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
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
                        <Grid item xs={6} md={4}>
                            <TextField
                                label="Limite de Uso"
                                type="number"
                                value={formData.max_uses || ''}
                                onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                                inputProps={{ min: 1 }}
                                fullWidth
                                helperText="Deixe em branco para ilimitado"
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
                                label="Ativa"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal} disabled={saving}>Cancelar</Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={saving || !formData.name}
                        sx={{ bgcolor: '#ec4899' }}
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
                        Tem certeza que deseja excluir a promoção <strong>{itemToDelete?.name}</strong>?
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

export default PromotionsPage;
