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
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    ArrowBack as BackIcon,
    Refresh as RefreshIcon,
    Storefront as BrandsIcon,
} from '@mui/icons-material';
import * as pricingAdminService from '../../../services/pricingAdmin.service';

// Constantes
const BRAND_ROLES = [
    { value: 'principal', label: 'Principal', color: 'primary' },
    { value: 'secondary_target', label: 'Secondary Target', color: 'secondary' },
    { value: 'tertiary_flexible', label: 'Tertiary Flexible', color: 'default' },
];

const SUPPLIER_TERM_PROFILES = [
    { value: 'short', label: 'Curto' },
    { value: 'medium', label: 'Médio' },
    { value: 'long', label: 'Longo' },
];

const INITIAL_FORM_STATE = {
    brand_id: '',
    brand_name: '',
    brand_role: 'principal',
    supplier_term_profile: 'medium',
    anchor_ref_pct: 0,
    is_active: true,
};

function BrandsPage() {
    const navigate = useNavigate();

    // Estados
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Paginação e filtros
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [saving, setSaving] = useState(false);

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [brandToDelete, setBrandToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Carregar marcas
    const loadBrands = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                skip: page * rowsPerPage,
                limit: rowsPerPage,
                ...(search && { search }),
                ...(roleFilter && { brand_role: roleFilter }),
            };
            const response = await pricingAdminService.listBrands(params);
            setBrands(response.data?.items || response.data || []);
            setTotal(response.data?.total || response.data?.length || 0);
        } catch (err) {
            setError(err.message || 'Erro ao carregar marcas');
            setBrands([]);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, search, roleFilter]);

    useEffect(() => {
        loadBrands();
    }, [loadBrands]);

    // Handlers de paginação
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Handler de busca
    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(0);
    };

    // Abrir modal para criar
    const handleCreate = () => {
        setFormData(INITIAL_FORM_STATE);
        setModalMode('create');
        setModalOpen(true);
    };

    // Abrir modal para editar
    const handleEdit = (brand) => {
        setFormData({
            brand_id: brand.brand_id,
            brand_name: brand.brand_name,
            brand_role: brand.brand_role,
            supplier_term_profile: brand.supplier_term_profile,
            anchor_ref_pct: brand.anchor_ref_pct || 0,
            is_active: brand.is_active,
        });
        setModalMode('edit');
        setModalOpen(true);
    };

    // Fechar modal
    const handleCloseModal = () => {
        setModalOpen(false);
        setFormData(INITIAL_FORM_STATE);
    };

    // Salvar (criar ou editar)
    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            if (modalMode === 'create') {
                await pricingAdminService.createBrand({
                    ...formData,
                    brand_id: parseInt(formData.brand_id),
                    anchor_ref_pct: parseFloat(formData.anchor_ref_pct) || 0,
                });
                setSuccess('Marca criada com sucesso!');
            } else {
                await pricingAdminService.updateBrand(formData.brand_id, {
                    brand_name: formData.brand_name,
                    brand_role: formData.brand_role,
                    supplier_term_profile: formData.supplier_term_profile,
                    anchor_ref_pct: parseFloat(formData.anchor_ref_pct) || 0,
                    is_active: formData.is_active,
                });
                setSuccess('Marca atualizada com sucesso!');
            }
            handleCloseModal();
            loadBrands();
        } catch (err) {
            setError(err.message || 'Erro ao salvar marca');
        } finally {
            setSaving(false);
        }
    };

    // Abrir dialog de delete
    const handleDeleteClick = (brand) => {
        setBrandToDelete(brand);
        setDeleteDialogOpen(true);
    };

    // Confirmar delete
    const handleConfirmDelete = async () => {
        if (!brandToDelete) return;
        setDeleting(true);
        setError(null);
        try {
            await pricingAdminService.deleteBrand(brandToDelete.brand_id);
            setSuccess('Marca removida com sucesso!');
            setDeleteDialogOpen(false);
            setBrandToDelete(null);
            loadBrands();
        } catch (err) {
            setError(err.message || 'Erro ao remover marca');
        } finally {
            setDeleting(false);
        }
    };

    // Obter label e cor do role
    const getRoleChip = (role) => {
        const roleConfig = BRAND_ROLES.find((r) => r.value === role) || { label: role, color: 'default' };
        return <Chip label={roleConfig.label} color={roleConfig.color} size="small" />;
    };

    // Limpar mensagens após 5 segundos
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
                        <BrandsIcon sx={{ fontSize: 32, color: '#3b82f6' }} />
                        Marcas
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gerenciar marcas e seus papéis no sistema de precificação
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                    sx={{ bgcolor: '#3b82f6' }}
                >
                    Nova Marca
                </Button>
            </Box>

            {/* Alertas */}
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

            {/* Filtros */}
            <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                    placeholder="Buscar por nome ou ID..."
                    value={search}
                    onChange={handleSearch}
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
                    <InputLabel>Filtrar por Papel</InputLabel>
                    <Select
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
                        label="Filtrar por Papel"
                    >
                        <MenuItem value="">Todos</MenuItem>
                        {BRAND_ROLES.map((role) => (
                            <MenuItem key={role.value} value={role.value}>
                                {role.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Box sx={{ flex: 1 }} />
                <Tooltip title="Atualizar">
                    <IconButton onClick={loadBrands} disabled={loading}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Paper>

            {/* Tabela */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                            <TableCell><strong>ID</strong></TableCell>
                            <TableCell><strong>Nome</strong></TableCell>
                            <TableCell><strong>Papel</strong></TableCell>
                            <TableCell><strong>Perfil de Prazo</strong></TableCell>
                            <TableCell><strong>Âncora Ref %</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell align="right"><strong>Ações</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            // Skeleton loading
                            [...Array(5)].map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton /></TableCell>
                                    <TableCell><Skeleton /></TableCell>
                                    <TableCell><Skeleton width={100} /></TableCell>
                                    <TableCell><Skeleton width={80} /></TableCell>
                                    <TableCell><Skeleton width={60} /></TableCell>
                                    <TableCell><Skeleton width={60} /></TableCell>
                                    <TableCell><Skeleton width={100} /></TableCell>
                                </TableRow>
                            ))
                        ) : brands.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        Nenhuma marca encontrada
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            brands.map((brand) => (
                                <TableRow key={brand.brand_id} hover>
                                    <TableCell>{brand.brand_id}</TableCell>
                                    <TableCell>
                                        <Typography fontWeight="medium">{brand.brand_name}</Typography>
                                    </TableCell>
                                    <TableCell>{getRoleChip(brand.brand_role)}</TableCell>
                                    <TableCell>
                                        {SUPPLIER_TERM_PROFILES.find((t) => t.value === brand.supplier_term_profile)?.label || brand.supplier_term_profile}
                                    </TableCell>
                                    <TableCell>{brand.anchor_ref_pct?.toFixed(2)}%</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={brand.is_active ? 'Ativo' : 'Inativo'}
                                            color={brand.is_active ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Editar">
                                            <IconButton onClick={() => handleEdit(brand)} color="primary">
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Excluir">
                                            <IconButton onClick={() => handleDeleteClick(brand)} color="error">
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
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Itens por página:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
            </TableContainer>

            {/* Modal de Criar/Editar */}
            <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {modalMode === 'create' ? 'Nova Marca' : 'Editar Marca'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="ID da Marca"
                            type="number"
                            value={formData.brand_id}
                            onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                            disabled={modalMode === 'edit'}
                            required
                            fullWidth
                        />
                        <TextField
                            label="Nome da Marca"
                            value={formData.brand_name}
                            onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                            required
                            fullWidth
                        />
                        <FormControl fullWidth>
                            <InputLabel>Papel da Marca</InputLabel>
                            <Select
                                value={formData.brand_role}
                                onChange={(e) => setFormData({ ...formData, brand_role: e.target.value })}
                                label="Papel da Marca"
                            >
                                {BRAND_ROLES.map((role) => (
                                    <MenuItem key={role.value} value={role.value}>
                                        {role.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Perfil de Prazo do Fornecedor</InputLabel>
                            <Select
                                value={formData.supplier_term_profile}
                                onChange={(e) => setFormData({ ...formData, supplier_term_profile: e.target.value })}
                                label="Perfil de Prazo do Fornecedor"
                            >
                                {SUPPLIER_TERM_PROFILES.map((profile) => (
                                    <MenuItem key={profile.value} value={profile.value}>
                                        {profile.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Âncora de Referência (%)"
                            type="number"
                            value={formData.anchor_ref_pct}
                            onChange={(e) => setFormData({ ...formData, anchor_ref_pct: e.target.value })}
                            inputProps={{ step: 0.01, min: 0, max: 100 }}
                            fullWidth
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                            }
                            label="Marca Ativa"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={saving || !formData.brand_id || !formData.brand_name}
                    >
                        {saving ? <CircularProgress size={24} /> : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de Confirmação de Delete */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <Typography>
                        Tem certeza que deseja excluir a marca{' '}
                        <strong>{brandToDelete?.brand_name}</strong>?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Esta ação irá desativar a marca (soft delete). Os dados não serão perdidos.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        color="error"
                        variant="contained"
                        disabled={deleting}
                    >
                        {deleting ? <CircularProgress size={24} /> : 'Excluir'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default BrandsPage;
