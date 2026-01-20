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
    Tabs,
    Tab,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ArrowBack as BackIcon,
    Refresh as RefreshIcon,
    Layers as TiersIcon,
} from '@mui/icons-material';
import * as pricingAdminService from '../../../services/pricingAdmin.service';

// Configurações
const BRAND_ROLES = [
    { value: 'principal', label: 'Principal' },
    { value: 'secondary_target', label: 'Secondary Target' },
    { value: 'tertiary_flexible', label: 'Tertiary Flexible' },
];

// Estado inicial do formulário Volume Tier
const INITIAL_VOLUME_TIER_FORM = {
    tier_code: '',
    min_volume_12m: 0,
    max_volume_12m: 0,
    is_active: true,
};

// Estado inicial do formulário Brand Role Tier
const INITIAL_BRAND_ROLE_TIER_FORM = {
    tier_code: '',
    brand_role: 'principal',
    discount_pct: 0,
    is_active: true,
};

function VolumeTiersPage() {
    const navigate = useNavigate();

    // Tab state
    const [activeTab, setActiveTab] = useState(0);

    // Volume Tiers states
    const [volumeTiers, setVolumeTiers] = useState([]);
    const [loadingVolume, setLoadingVolume] = useState(true);
    const [volumePage, setVolumePage] = useState(0);
    const [volumeRowsPerPage, setVolumeRowsPerPage] = useState(25);
    const [volumeTotal, setVolumeTotal] = useState(0);

    // Brand Role Tiers states
    const [brandRoleTiers, setBrandRoleTiers] = useState([]);
    const [loadingBrandRole, setLoadingBrandRole] = useState(true);
    const [brandRolePage, setBrandRolePage] = useState(0);
    const [brandRoleRowsPerPage, setBrandRoleRowsPerPage] = useState(25);
    const [brandRoleTotal, setBrandRoleTotal] = useState(0);
    const [brandRoleFilter, setBrandRoleFilter] = useState('');

    // Common states
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Modal states - Volume Tier
    const [volumeModalOpen, setVolumeModalOpen] = useState(false);
    const [volumeModalMode, setVolumeModalMode] = useState('create');
    const [volumeFormData, setVolumeFormData] = useState(INITIAL_VOLUME_TIER_FORM);
    const [savingVolume, setSavingVolume] = useState(false);

    // Modal states - Brand Role Tier
    const [brandRoleModalOpen, setBrandRoleModalOpen] = useState(false);
    const [brandRoleModalMode, setBrandRoleModalMode] = useState('create');
    const [brandRoleFormData, setBrandRoleFormData] = useState(INITIAL_BRAND_ROLE_TIER_FORM);
    const [savingBrandRole, setSavingBrandRole] = useState(false);

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteType, setDeleteType] = useState('volume'); // 'volume' | 'brandRole'
    const [deleting, setDeleting] = useState(false);

    // Load Volume Tiers
    const loadVolumeTiers = useCallback(async () => {
        setLoadingVolume(true);
        setError(null);
        try {
            const response = await pricingAdminService.listVolumeTiers({
                skip: volumePage * volumeRowsPerPage,
                limit: volumeRowsPerPage,
            });
            setVolumeTiers(response.data?.items || response.data || []);
            setVolumeTotal(response.data?.total || response.data?.length || 0);
        } catch (err) {
            setError(err.message || 'Erro ao carregar Volume Tiers');
        } finally {
            setLoadingVolume(false);
        }
    }, [volumePage, volumeRowsPerPage]);

    // Load Brand Role Tiers
    const loadBrandRoleTiers = useCallback(async () => {
        setLoadingBrandRole(true);
        setError(null);
        try {
            const params = {
                skip: brandRolePage * brandRoleRowsPerPage,
                limit: brandRoleRowsPerPage,
                ...(brandRoleFilter && { brand_role: brandRoleFilter }),
            };
            const response = await pricingAdminService.listBrandRoleTiers(params);
            setBrandRoleTiers(response.data?.items || response.data || []);
            setBrandRoleTotal(response.data?.total || response.data?.length || 0);
        } catch (err) {
            setError(err.message || 'Erro ao carregar Brand Role Tiers');
        } finally {
            setLoadingBrandRole(false);
        }
    }, [brandRolePage, brandRoleRowsPerPage, brandRoleFilter]);

    useEffect(() => {
        if (activeTab === 0) {
            loadVolumeTiers();
        } else {
            loadBrandRoleTiers();
        }
    }, [activeTab, loadVolumeTiers, loadBrandRoleTiers]);

    // Handlers - Volume Tier
    const handleCreateVolumeTier = () => {
        setVolumeFormData(INITIAL_VOLUME_TIER_FORM);
        setVolumeModalMode('create');
        setVolumeModalOpen(true);
    };

    const handleEditVolumeTier = (tier) => {
        setVolumeFormData({
            tier_code: tier.tier_code,
            min_volume_12m: tier.min_volume_12m || 0,
            max_volume_12m: tier.max_volume_12m || 0,
            is_active: tier.is_active,
        });
        setVolumeModalMode('edit');
        setVolumeModalOpen(true);
    };

    const handleSaveVolumeTier = async () => {
        setSavingVolume(true);
        setError(null);
        try {
            if (volumeModalMode === 'create') {
                await pricingAdminService.createVolumeTier({
                    tier_code: volumeFormData.tier_code,
                    min_volume_12m: parseFloat(volumeFormData.min_volume_12m) || 0,
                    max_volume_12m: parseFloat(volumeFormData.max_volume_12m) || 0,
                    is_active: volumeFormData.is_active,
                });
                setSuccess('Volume Tier criado com sucesso!');
            } else {
                await pricingAdminService.updateVolumeTier(volumeFormData.tier_code, {
                    min_volume_12m: parseFloat(volumeFormData.min_volume_12m) || 0,
                    max_volume_12m: parseFloat(volumeFormData.max_volume_12m) || 0,
                    is_active: volumeFormData.is_active,
                });
                setSuccess('Volume Tier atualizado com sucesso!');
            }
            setVolumeModalOpen(false);
            loadVolumeTiers();
        } catch (err) {
            setError(err.message || 'Erro ao salvar Volume Tier');
        } finally {
            setSavingVolume(false);
        }
    };

    // Handlers - Brand Role Tier
    const handleCreateBrandRoleTier = () => {
        setBrandRoleFormData(INITIAL_BRAND_ROLE_TIER_FORM);
        setBrandRoleModalMode('create');
        setBrandRoleModalOpen(true);
    };

    const handleEditBrandRoleTier = (tier) => {
        setBrandRoleFormData({
            tier_code: tier.tier_code,
            brand_role: tier.brand_role,
            discount_pct: tier.discount_pct || 0,
            is_active: tier.is_active,
        });
        setBrandRoleModalMode('edit');
        setBrandRoleModalOpen(true);
    };

    const handleSaveBrandRoleTier = async () => {
        setSavingBrandRole(true);
        setError(null);
        try {
            if (brandRoleModalMode === 'create') {
                await pricingAdminService.createBrandRoleTier({
                    tier_code: brandRoleFormData.tier_code,
                    brand_role: brandRoleFormData.brand_role,
                    discount_pct: parseFloat(brandRoleFormData.discount_pct) || 0,
                    is_active: brandRoleFormData.is_active,
                });
                setSuccess('Brand Role Tier criado com sucesso!');
            } else {
                await pricingAdminService.updateBrandRoleTier(brandRoleFormData.tier_code, {
                    brand_role: brandRoleFormData.brand_role,
                    discount_pct: parseFloat(brandRoleFormData.discount_pct) || 0,
                    is_active: brandRoleFormData.is_active,
                });
                setSuccess('Brand Role Tier atualizado com sucesso!');
            }
            setBrandRoleModalOpen(false);
            loadBrandRoleTiers();
        } catch (err) {
            setError(err.message || 'Erro ao salvar Brand Role Tier');
        } finally {
            setSavingBrandRole(false);
        }
    };

    // Delete handlers
    const handleDeleteClick = (item, type) => {
        setItemToDelete(item);
        setDeleteType(type);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        setDeleting(true);
        setError(null);
        try {
            if (deleteType === 'volume') {
                await pricingAdminService.deleteVolumeTier(itemToDelete.tier_code);
                setSuccess('Volume Tier removido com sucesso!');
                loadVolumeTiers();
            } else {
                await pricingAdminService.deleteBrandRoleTier(itemToDelete.tier_code);
                setSuccess('Brand Role Tier removido com sucesso!');
                loadBrandRoleTiers();
            }
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        } catch (err) {
            setError(err.message || 'Erro ao remover item');
        } finally {
            setDeleting(false);
        }
    };

    // Clear messages after 5 seconds
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
                        <TiersIcon sx={{ fontSize: 32, color: '#06b6d4' }} />
                        Tiers de Volume
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gerenciar níveis de desconto baseados em volume de compras
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={activeTab === 0 ? handleCreateVolumeTier : handleCreateBrandRoleTier}
                    sx={{ bgcolor: '#06b6d4' }}
                >
                    {activeTab === 0 ? 'Novo Volume Tier' : 'Novo Brand Role Tier'}
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

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                    <Tab label="Volume Tiers (Global)" />
                    <Tab label="Brand Role Tiers" />
                </Tabs>
            </Paper>

            {/* Tab 0: Volume Tiers */}
            {activeTab === 0 && (
                <>
                    <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Tooltip title="Atualizar">
                            <IconButton onClick={loadVolumeTiers} disabled={loadingVolume}>
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Paper>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.100' }}>
                                    <TableCell><strong>Código do Tier</strong></TableCell>
                                    <TableCell align="right"><strong>Volume Mín (12m)</strong></TableCell>
                                    <TableCell align="right"><strong>Volume Máx (12m)</strong></TableCell>
                                    <TableCell><strong>Status</strong></TableCell>
                                    <TableCell align="right"><strong>Ações</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loadingVolume ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton /></TableCell>
                                            <TableCell><Skeleton /></TableCell>
                                            <TableCell><Skeleton /></TableCell>
                                            <TableCell><Skeleton /></TableCell>
                                            <TableCell><Skeleton /></TableCell>
                                        </TableRow>
                                    ))
                                ) : volumeTiers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">Nenhum Volume Tier encontrado</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    volumeTiers.map((tier) => (
                                        <TableRow key={tier.tier_code} hover>
                                            <TableCell>
                                                <Typography fontWeight="medium">{tier.tier_code}</Typography>
                                            </TableCell>
                                            <TableCell align="right">{formatNumber(tier.min_volume_12m)}</TableCell>
                                            <TableCell align="right">{formatNumber(tier.max_volume_12m)}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={tier.is_active ? 'Ativo' : 'Inativo'}
                                                    color={tier.is_active ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Editar">
                                                    <IconButton onClick={() => handleEditVolumeTier(tier)} color="primary">
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Excluir">
                                                    <IconButton onClick={() => handleDeleteClick(tier, 'volume')} color="error">
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
                            count={volumeTotal}
                            rowsPerPage={volumeRowsPerPage}
                            page={volumePage}
                            onPageChange={(e, p) => setVolumePage(p)}
                            onRowsPerPageChange={(e) => { setVolumeRowsPerPage(parseInt(e.target.value, 10)); setVolumePage(0); }}
                            labelRowsPerPage="Itens por página:"
                        />
                    </TableContainer>
                </>
            )}

            {/* Tab 1: Brand Role Tiers */}
            {activeTab === 1 && (
                <>
                    <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Filtrar por Papel</InputLabel>
                            <Select
                                value={brandRoleFilter}
                                onChange={(e) => { setBrandRoleFilter(e.target.value); setBrandRolePage(0); }}
                                label="Filtrar por Papel"
                            >
                                <MenuItem value="">Todos</MenuItem>
                                {BRAND_ROLES.map((role) => (
                                    <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Box sx={{ flex: 1 }} />
                        <Tooltip title="Atualizar">
                            <IconButton onClick={loadBrandRoleTiers} disabled={loadingBrandRole}>
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Paper>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.100' }}>
                                    <TableCell><strong>Código do Tier</strong></TableCell>
                                    <TableCell><strong>Papel da Marca</strong></TableCell>
                                    <TableCell align="right"><strong>Desconto (%)</strong></TableCell>
                                    <TableCell><strong>Status</strong></TableCell>
                                    <TableCell align="right"><strong>Ações</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loadingBrandRole ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton /></TableCell>
                                            <TableCell><Skeleton /></TableCell>
                                            <TableCell><Skeleton /></TableCell>
                                            <TableCell><Skeleton /></TableCell>
                                            <TableCell><Skeleton /></TableCell>
                                        </TableRow>
                                    ))
                                ) : brandRoleTiers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">Nenhum Brand Role Tier encontrado</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    brandRoleTiers.map((tier, idx) => (
                                        <TableRow key={`${tier.tier_code}-${tier.brand_role}-${idx}`} hover>
                                            <TableCell>
                                                <Typography fontWeight="medium">{tier.tier_code}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={BRAND_ROLES.find(r => r.value === tier.brand_role)?.label || tier.brand_role}
                                                    size="small"
                                                    color={tier.brand_role === 'principal' ? 'primary' : 'default'}
                                                />
                                            </TableCell>
                                            <TableCell align="right">{tier.discount_pct?.toFixed(2) || '0.00'}%</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={tier.is_active ? 'Ativo' : 'Inativo'}
                                                    color={tier.is_active ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Editar">
                                                    <IconButton onClick={() => handleEditBrandRoleTier(tier)} color="primary">
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Excluir">
                                                    <IconButton onClick={() => handleDeleteClick(tier, 'brandRole')} color="error">
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
                            count={brandRoleTotal}
                            rowsPerPage={brandRoleRowsPerPage}
                            page={brandRolePage}
                            onPageChange={(e, p) => setBrandRolePage(p)}
                            onRowsPerPageChange={(e) => { setBrandRoleRowsPerPage(parseInt(e.target.value, 10)); setBrandRolePage(0); }}
                            labelRowsPerPage="Itens por página:"
                        />
                    </TableContainer>
                </>
            )}

            {/* Modal Volume Tier */}
            <Dialog open={volumeModalOpen} onClose={() => setVolumeModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {volumeModalMode === 'create' ? 'Novo Volume Tier' : 'Editar Volume Tier'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Código do Tier"
                            value={volumeFormData.tier_code}
                            onChange={(e) => setVolumeFormData({ ...volumeFormData, tier_code: e.target.value })}
                            disabled={volumeModalMode === 'edit'}
                            required
                            fullWidth
                            helperText="Ex: T1, T2, GOLD, etc."
                        />
                        <TextField
                            label="Volume Mínimo (12 meses)"
                            type="number"
                            value={volumeFormData.min_volume_12m}
                            onChange={(e) => setVolumeFormData({ ...volumeFormData, min_volume_12m: e.target.value })}
                            inputProps={{ min: 0 }}
                            fullWidth
                        />
                        <TextField
                            label="Volume Máximo (12 meses)"
                            type="number"
                            value={volumeFormData.max_volume_12m}
                            onChange={(e) => setVolumeFormData({ ...volumeFormData, max_volume_12m: e.target.value })}
                            inputProps={{ min: 0 }}
                            fullWidth
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={volumeFormData.is_active}
                                    onChange={(e) => setVolumeFormData({ ...volumeFormData, is_active: e.target.checked })}
                                />
                            }
                            label="Ativo"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setVolumeModalOpen(false)} disabled={savingVolume}>Cancelar</Button>
                    <Button
                        onClick={handleSaveVolumeTier}
                        variant="contained"
                        disabled={savingVolume || !volumeFormData.tier_code}
                    >
                        {savingVolume ? <CircularProgress size={24} /> : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal Brand Role Tier */}
            <Dialog open={brandRoleModalOpen} onClose={() => setBrandRoleModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {brandRoleModalMode === 'create' ? 'Novo Brand Role Tier' : 'Editar Brand Role Tier'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Código do Tier"
                            value={brandRoleFormData.tier_code}
                            onChange={(e) => setBrandRoleFormData({ ...brandRoleFormData, tier_code: e.target.value })}
                            disabled={brandRoleModalMode === 'edit'}
                            required
                            fullWidth
                        />
                        <FormControl fullWidth required>
                            <InputLabel>Papel da Marca</InputLabel>
                            <Select
                                value={brandRoleFormData.brand_role}
                                onChange={(e) => setBrandRoleFormData({ ...brandRoleFormData, brand_role: e.target.value })}
                                label="Papel da Marca"
                                disabled={brandRoleModalMode === 'edit'}
                            >
                                {BRAND_ROLES.map((role) => (
                                    <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Desconto (%)"
                            type="number"
                            value={brandRoleFormData.discount_pct}
                            onChange={(e) => setBrandRoleFormData({ ...brandRoleFormData, discount_pct: e.target.value })}
                            inputProps={{ step: 0.01, min: 0, max: 100 }}
                            fullWidth
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={brandRoleFormData.is_active}
                                    onChange={(e) => setBrandRoleFormData({ ...brandRoleFormData, is_active: e.target.checked })}
                                />
                            }
                            label="Ativo"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBrandRoleModalOpen(false)} disabled={savingBrandRole}>Cancelar</Button>
                    <Button
                        onClick={handleSaveBrandRoleTier}
                        variant="contained"
                        disabled={savingBrandRole || !brandRoleFormData.tier_code || !brandRoleFormData.brand_role}
                    >
                        {savingBrandRole ? <CircularProgress size={24} /> : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <Typography>
                        Tem certeza que deseja excluir o tier <strong>{itemToDelete?.tier_code}</strong>?
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

export default VolumeTiersPage;
