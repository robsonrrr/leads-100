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
    Alert,
    CircularProgress,
    Tooltip,
    TablePagination,
    Skeleton,
    Autocomplete,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    ArrowBack as BackIcon,
    Refresh as RefreshIcon,
    People as ProfilesIcon,
} from '@mui/icons-material';
import * as pricingAdminService from '../../../services/pricingAdmin.service';

const INITIAL_FORM_STATE = {
    customer_id: null,
    brand_id: null,
    customer_name: '', // Auxiliar para autocomplete
    brand_name: '',    // Auxiliar para autocomplete
    org_id: 1, // Default por compatibilidade
    // Campos adicionais que podem vir da API
};

function CustomerProfilesPage() {
    const navigate = useNavigate();

    // Estados
    const [profiles, setProfiles] = useState([]);
    const [brands, setBrands] = useState([]); // Para o select de marcas
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Paginação e filtros
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [brandFilter, setBrandFilter] = useState('');

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [saving, setSaving] = useState(false);

    // Autocomplete
    const [customerOptions, setCustomerOptions] = useState([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [profileToDelete, setProfileToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Carregar perfis e marcas
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                skip: page * rowsPerPage,
                limit: rowsPerPage,
                ...(search && { customer_name: search }),
                ...(brandFilter && { brand_id: brandFilter }),
            };

            const [profilesResponse, brandsResponse] = await Promise.all([
                pricingAdminService.listCustomerBrandProfiles(params),
                pricingAdminService.listBrands({ limit: 1000 })
            ]);

            setProfiles(profilesResponse.data?.items || profilesResponse.data || []);
            setTotal(profilesResponse.data?.total || profilesResponse.data?.length || 0);
            setBrands(brandsResponse.data?.items || brandsResponse.data || []);
        } catch (err) {
            setError(err.message || 'Erro ao carregar dados');
            setProfiles([]);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, search, brandFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Buscar clientes para autocomplete
    const searchCustomers = async (query) => {
        if (!query || query.length < 3) return;
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
    const handleEdit = (profile) => {
        // Ao editar, não permitimos mudar cliente ou marca (são chaves primárias compostas)
        // Se fosse necessário, teria que deletar e criar outro.
        // Aqui assumimos que edição seria apenas para outros campos se existissem.
        // Como a tabela customer_brand_profile é basicamente uma tabela de ligação (N:N),
        // editar pode não fazer sentido se não houver campos adicionais.
        // Mas vamos manter a estrutura caso existam campos extras no futuro.

        // NOTA: Se a tabela for apenas customer_id e brand_id, editar não faz sentido.
        // Verificar se há necessidade de edição ou apenas Criar/Deletar.
        // Pelo checklist, "Modal de edição de perfil" está listado, então assumo que possa haver.

        setFormData({
            customer_id: profile.customer_id,
            brand_id: profile.brand_id,
            customer_name: profile.customer_name,
            brand_name: brands.find(b => b.brand_id === profile.brand_id)?.brand_name || '',
            org_id: profile.org_id || 1,
        });
        setModalMode('edit');
        setModalOpen(true);
    };

    // Fechar modal
    const handleCloseModal = () => {
        setModalOpen(false);
        setFormData(INITIAL_FORM_STATE);
        setCustomerOptions([]);
    };

    // Salvar (criar)
    // Edição removida da UI se for apenas chave primária, mas mantida no código
    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            if (modalMode === 'create') {
                await pricingAdminService.createCustomerBrandProfile({
                    customer_id: formData.customer_id,
                    brand_id: formData.brand_id,
                    org_id: formData.org_id,
                });
                setSuccess('Perfil criado com sucesso!');
            } else {
                // Update logic se houver campos adicionais
                await pricingAdminService.updateCustomerBrandProfile(
                    formData.org_id,
                    formData.customer_id,
                    formData.brand_id,
                    formData // Passa tudo, endpoint filtra
                );
                setSuccess('Perfil atualizado com sucesso!');
            }
            handleCloseModal();
            loadData();
        } catch (err) {
            setError(err.message || 'Erro ao salvar perfil');
        } finally {
            setSaving(false);
        }
    };

    // Abrir dialog de delete
    const handleDeleteClick = (profile) => {
        setProfileToDelete(profile);
        setDeleteDialogOpen(true);
    };

    // Confirmar delete
    const handleConfirmDelete = async () => {
        if (!profileToDelete) return;
        setDeleting(true);
        setError(null);
        try {
            await pricingAdminService.deleteCustomerBrandProfile(
                profileToDelete.org_id || 1,
                profileToDelete.customer_id,
                profileToDelete.brand_id
            );
            setSuccess('Perfil removido com sucesso!');
            setDeleteDialogOpen(false);
            setProfileToDelete(null);
            loadData();
        } catch (err) {
            setError(err.message || 'Erro ao remover perfil');
        } finally {
            setDeleting(false);
        }
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
                        <ProfilesIcon sx={{ fontSize: 32, color: '#8b5cf6' }} />
                        Perfis Cliente-Marca
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Associação de clientes a marcas específicas
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                    sx={{ bgcolor: '#8b5cf6' }}
                >
                    Novo Perfil
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
                    placeholder="Buscar por cliente..."
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
                    <IconButton onClick={loadData} disabled={loading}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Paper>

            {/* Tabela */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                            <TableCell><strong>Cliente ID</strong></TableCell>
                            <TableCell><strong>Nome do Cliente</strong></TableCell>
                            <TableCell><strong>Marca</strong></TableCell>
                            <TableCell><strong>Papel da Marca</strong></TableCell>
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
                                    <TableCell><Skeleton /></TableCell>
                                    <TableCell><Skeleton /></TableCell>
                                    <TableCell><Skeleton /></TableCell>
                                </TableRow>
                            ))
                        ) : profiles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        Nenhum perfil encontrado
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            profiles.map((profile, index) => {
                                const brand = brands.find(b => b.brand_id === profile.brand_id);
                                const key = `${profile.customer_id}-${profile.brand_id}-${index}`;

                                return (
                                    <TableRow key={key} hover>
                                        <TableCell>{profile.customer_id}</TableCell>
                                        <TableCell>
                                            <Typography fontWeight="medium">{profile.customer_name || `Cliente #${profile.customer_id}`}</Typography>
                                        </TableCell>
                                        <TableCell>{brand?.brand_name || profile.brand_id}</TableCell>
                                        <TableCell>{brand?.brand_role || '-'}</TableCell>
                                        <TableCell align="right">
                                            {/* Edição desabilitada pois é tabela associativa pura geralmente */}
                                            {/* <IconButton onClick={() => handleEdit(profile)} color="primary"><EditIcon /></IconButton> */}
                                            <Tooltip title="Remover Associação">
                                                <IconButton onClick={() => handleDeleteClick(profile)} color="error">
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
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Itens por página:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
            </TableContainer>

            {/* Modal de Criar */}
            <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle>Novo Perfil Cliente-Marca</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>

                        <Autocomplete
                            options={customerOptions}
                            getOptionLabel={(option) => `${option.name} (${option.id})`}
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
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Buscar Cliente"
                                    variant="outlined"
                                    fullWidth
                                    required
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <React.Fragment>
                                                {loadingCustomers ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </React.Fragment>
                                        ),
                                    }}
                                />
                            )}
                        />

                        <FormControl fullWidth required>
                            <InputLabel>Marca</InputLabel>
                            <Select
                                value={formData.brand_id || ''}
                                onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                                label="Marca"
                            >
                                {brands.map((brand) => (
                                    <MenuItem key={brand.brand_id} value={brand.brand_id}>
                                        {brand.brand_name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={saving || !formData.customer_id || !formData.brand_id}
                        sx={{ bgcolor: '#8b5cf6' }}
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
                        Tem certeza que deseja remover a associação entre o cliente{' '}
                        <strong>{profileToDelete?.customer_name || profileToDelete?.customer_id}</strong> e a marca{' '}
                        <strong>{brands.find(b => b.brand_id === profileToDelete?.brand_id)?.brand_name || profileToDelete?.brand_id}</strong>?
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

export default CustomerProfilesPage;
