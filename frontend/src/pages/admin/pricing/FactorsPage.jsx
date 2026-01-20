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
    FormControlLabel,
    Switch,
    Alert,
    CircularProgress,
    Tooltip,
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
    TrendingUp as FactorsIcon,
} from '@mui/icons-material';
import * as pricingAdminService from '../../../services/pricingAdmin.service';

// Estado inicial do formulário Curve Factor
const INITIAL_CURVE_FORM = {
    curve: '',
    factor: 1.0,
    is_active: true,
};

// Estado inicial do formulário Stock Level Factor
const INITIAL_STOCK_LEVEL_FORM = {
    stock_level: '',
    factor: 1.0,
    is_active: true,
};

function FactorsPage() {
    const navigate = useNavigate();

    // Tab state
    const [activeTab, setActiveTab] = useState(0);

    // Curve Factors states
    const [curveFactors, setCurveFactors] = useState([]);
    const [loadingCurve, setLoadingCurve] = useState(true);

    // Stock Level Factors states  
    const [stockLevelFactors, setStockLevelFactors] = useState([]);
    const [loadingStock, setLoadingStock] = useState(true);

    // Common states
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Modal states - Curve Factor
    const [curveModalOpen, setCurveModalOpen] = useState(false);
    const [curveModalMode, setCurveModalMode] = useState('create');
    const [curveFormData, setCurveFormData] = useState(INITIAL_CURVE_FORM);
    const [savingCurve, setSavingCurve] = useState(false);

    // Modal states - Stock Level Factor
    const [stockModalOpen, setStockModalOpen] = useState(false);
    const [stockModalMode, setStockModalMode] = useState('create');
    const [stockFormData, setStockFormData] = useState(INITIAL_STOCK_LEVEL_FORM);
    const [savingStock, setSavingStock] = useState(false);

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteType, setDeleteType] = useState('curve');
    const [deleting, setDeleting] = useState(false);

    // Load Curve Factors
    const loadCurveFactors = useCallback(async () => {
        setLoadingCurve(true);
        try {
            const response = await pricingAdminService.listCurveFactors();
            setCurveFactors(response.data?.items || response.data || []);
        } catch (err) {
            setError(err.message || 'Erro ao carregar Curve Factors');
        } finally {
            setLoadingCurve(false);
        }
    }, []);

    // Load Stock Level Factors
    const loadStockLevelFactors = useCallback(async () => {
        setLoadingStock(true);
        try {
            const response = await pricingAdminService.listStockLevelFactors();
            setStockLevelFactors(response.data?.items || response.data || []);
        } catch (err) {
            setError(err.message || 'Erro ao carregar Stock Level Factors');
        } finally {
            setLoadingStock(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 0) {
            loadCurveFactors();
        } else {
            loadStockLevelFactors();
        }
    }, [activeTab, loadCurveFactors, loadStockLevelFactors]);

    // Handlers - Curve Factor
    const handleCreateCurve = () => {
        setCurveFormData(INITIAL_CURVE_FORM);
        setCurveModalMode('create');
        setCurveModalOpen(true);
    };

    const handleEditCurve = (factor) => {
        setCurveFormData({
            curve: factor.curve,
            factor: factor.factor || 1.0,
            is_active: factor.is_active,
        });
        setCurveModalMode('edit');
        setCurveModalOpen(true);
    };

    const handleSaveCurve = async () => {
        setSavingCurve(true);
        setError(null);
        try {
            if (curveModalMode === 'create') {
                await pricingAdminService.createCurveFactor({
                    curve: curveFormData.curve,
                    factor: parseFloat(curveFormData.factor) || 1.0,
                    is_active: curveFormData.is_active,
                });
                setSuccess('Curve Factor criado com sucesso!');
            } else {
                await pricingAdminService.updateCurveFactor(curveFormData.curve, {
                    factor: parseFloat(curveFormData.factor) || 1.0,
                    is_active: curveFormData.is_active,
                });
                setSuccess('Curve Factor atualizado com sucesso!');
            }
            setCurveModalOpen(false);
            loadCurveFactors();
        } catch (err) {
            setError(err.message || 'Erro ao salvar Curve Factor');
        } finally {
            setSavingCurve(false);
        }
    };

    // Handlers - Stock Level Factor
    const handleCreateStock = () => {
        setStockFormData(INITIAL_STOCK_LEVEL_FORM);
        setStockModalMode('create');
        setStockModalOpen(true);
    };

    const handleEditStock = (factor) => {
        setStockFormData({
            stock_level: factor.stock_level,
            factor: factor.factor || 1.0,
            is_active: factor.is_active,
        });
        setStockModalMode('edit');
        setStockModalOpen(true);
    };

    const handleSaveStock = async () => {
        setSavingStock(true);
        setError(null);
        try {
            if (stockModalMode === 'create') {
                await pricingAdminService.createStockLevelFactor({
                    stock_level: stockFormData.stock_level,
                    factor: parseFloat(stockFormData.factor) || 1.0,
                    is_active: stockFormData.is_active,
                });
                setSuccess('Stock Level Factor criado com sucesso!');
            } else {
                await pricingAdminService.updateStockLevelFactor(stockFormData.stock_level, {
                    factor: parseFloat(stockFormData.factor) || 1.0,
                    is_active: stockFormData.is_active,
                });
                setSuccess('Stock Level Factor atualizado com sucesso!');
            }
            setStockModalOpen(false);
            loadStockLevelFactors();
        } catch (err) {
            setError(err.message || 'Erro ao salvar Stock Level Factor');
        } finally {
            setSavingStock(false);
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
            if (deleteType === 'curve') {
                await pricingAdminService.deleteCurveFactor(itemToDelete.curve);
                setSuccess('Curve Factor removido com sucesso!');
                loadCurveFactors();
            } else {
                await pricingAdminService.deleteStockLevelFactor(itemToDelete.stock_level);
                setSuccess('Stock Level Factor removido com sucesso!');
                loadStockLevelFactors();
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
                        <FactorsIcon sx={{ fontSize: 32, color: '#f59e0b' }} />
                        Fatores de Ajuste
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gerenciar fatores de curva ABC e níveis de estoque
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={activeTab === 0 ? handleCreateCurve : handleCreateStock}
                    sx={{ bgcolor: '#f59e0b' }}
                >
                    {activeTab === 0 ? 'Novo Curve Factor' : 'Novo Stock Level'}
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
                    <Tab label="Fatores de Curva ABC" />
                    <Tab label="Fatores de Nível de Estoque" />
                </Tabs>
            </Paper>

            {/* Tab 0: Curve Factors */}
            {activeTab === 0 && (
                <>
                    <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Fatores aplicados baseados na classificação ABC do produto (curva de Pareto)
                        </Typography>
                        <Tooltip title="Atualizar">
                            <IconButton onClick={loadCurveFactors} disabled={loadingCurve}>
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Paper>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.100' }}>
                                    <TableCell><strong>Curva</strong></TableCell>
                                    <TableCell align="right"><strong>Fator</strong></TableCell>
                                    <TableCell><strong>Status</strong></TableCell>
                                    <TableCell align="right"><strong>Ações</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loadingCurve ? (
                                    [...Array(3)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton /></TableCell>
                                            <TableCell><Skeleton /></TableCell>
                                            <TableCell><Skeleton /></TableCell>
                                            <TableCell><Skeleton /></TableCell>
                                        </TableRow>
                                    ))
                                ) : curveFactors.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">Nenhum Curve Factor encontrado</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    curveFactors.map((factor) => (
                                        <TableRow key={factor.curve} hover>
                                            <TableCell>
                                                <Chip
                                                    label={factor.curve}
                                                    color={factor.curve === 'A' ? 'success' : factor.curve === 'B' ? 'warning' : 'default'}
                                                    sx={{ fontWeight: 'bold', minWidth: 40 }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography fontWeight="medium">{factor.factor?.toFixed(4) || '1.0000'}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={factor.is_active ? 'Ativo' : 'Inativo'}
                                                    color={factor.is_active ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Editar">
                                                    <IconButton onClick={() => handleEditCurve(factor)} color="primary">
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Excluir">
                                                    <IconButton onClick={() => handleDeleteClick(factor, 'curve')} color="error">
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}

            {/* Tab 1: Stock Level Factors */}
            {activeTab === 1 && (
                <>
                    <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Fatores aplicados baseados no nível de estoque do produto
                        </Typography>
                        <Tooltip title="Atualizar">
                            <IconButton onClick={loadStockLevelFactors} disabled={loadingStock}>
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Paper>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.100' }}>
                                    <TableCell><strong>Nível de Estoque</strong></TableCell>
                                    <TableCell align="right"><strong>Fator</strong></TableCell>
                                    <TableCell><strong>Status</strong></TableCell>
                                    <TableCell align="right"><strong>Ações</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loadingStock ? (
                                    [...Array(3)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton /></TableCell>
                                            <TableCell><Skeleton /></TableCell>
                                            <TableCell><Skeleton /></TableCell>
                                            <TableCell><Skeleton /></TableCell>
                                        </TableRow>
                                    ))
                                ) : stockLevelFactors.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">Nenhum Stock Level Factor encontrado</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    stockLevelFactors.map((factor) => (
                                        <TableRow key={factor.stock_level} hover>
                                            <TableCell>
                                                <Typography fontWeight="medium">{factor.stock_level}</Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography fontWeight="medium">{factor.factor?.toFixed(4) || '1.0000'}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={factor.is_active ? 'Ativo' : 'Inativo'}
                                                    color={factor.is_active ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Editar">
                                                    <IconButton onClick={() => handleEditStock(factor)} color="primary">
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Excluir">
                                                    <IconButton onClick={() => handleDeleteClick(factor, 'stock')} color="error">
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}

            {/* Modal Curve Factor */}
            <Dialog open={curveModalOpen} onClose={() => setCurveModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {curveModalMode === 'create' ? 'Novo Curve Factor' : 'Editar Curve Factor'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Curva"
                            value={curveFormData.curve}
                            onChange={(e) => setCurveFormData({ ...curveFormData, curve: e.target.value.toUpperCase() })}
                            disabled={curveModalMode === 'edit'}
                            required
                            fullWidth
                            helperText="Ex: A, B, C"
                            inputProps={{ maxLength: 10 }}
                        />
                        <TextField
                            label="Fator"
                            type="number"
                            value={curveFormData.factor}
                            onChange={(e) => setCurveFormData({ ...curveFormData, factor: e.target.value })}
                            inputProps={{ step: 0.0001, min: 0 }}
                            fullWidth
                            helperText="Multiplicador aplicado ao preço. Ex: 1.0 = sem alteração, 0.95 = 5% desconto"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={curveFormData.is_active}
                                    onChange={(e) => setCurveFormData({ ...curveFormData, is_active: e.target.checked })}
                                />
                            }
                            label="Ativo"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCurveModalOpen(false)} disabled={savingCurve}>Cancelar</Button>
                    <Button
                        onClick={handleSaveCurve}
                        variant="contained"
                        disabled={savingCurve || !curveFormData.curve}
                    >
                        {savingCurve ? <CircularProgress size={24} /> : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal Stock Level Factor */}
            <Dialog open={stockModalOpen} onClose={() => setStockModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {stockModalMode === 'create' ? 'Novo Stock Level Factor' : 'Editar Stock Level Factor'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Nível de Estoque"
                            value={stockFormData.stock_level}
                            onChange={(e) => setStockFormData({ ...stockFormData, stock_level: e.target.value })}
                            disabled={stockModalMode === 'edit'}
                            required
                            fullWidth
                            helperText="Ex: LOW, MEDIUM, HIGH, CRITICAL"
                        />
                        <TextField
                            label="Fator"
                            type="number"
                            value={stockFormData.factor}
                            onChange={(e) => setStockFormData({ ...stockFormData, factor: e.target.value })}
                            inputProps={{ step: 0.0001, min: 0 }}
                            fullWidth
                            helperText="Multiplicador aplicado ao preço"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={stockFormData.is_active}
                                    onChange={(e) => setStockFormData({ ...stockFormData, is_active: e.target.checked })}
                                />
                            }
                            label="Ativo"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStockModalOpen(false)} disabled={savingStock}>Cancelar</Button>
                    <Button
                        onClick={handleSaveStock}
                        variant="contained"
                        disabled={savingStock || !stockFormData.stock_level}
                    >
                        {savingStock ? <CircularProgress size={24} /> : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <Typography>
                        Tem certeza que deseja excluir o fator{' '}
                        <strong>{deleteType === 'curve' ? itemToDelete?.curve : itemToDelete?.stock_level}</strong>?
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

export default FactorsPage;
