import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Paper,
    TextField,
    Grid,
    Alert,
    CircularProgress,
    Autocomplete,
    Divider,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Card,
    CardContent,
    IconButton,
    Tooltip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Science as TestIcon,
    ExpandMore as ExpandMoreIcon,
    CheckCircle as AppliedIcon,
    Cancel as NotAppliedIcon,
    History as HistoryIcon,
    Delete as DeleteIcon,
    PlayArrow as RunIcon,
    Refresh as ClearIcon,
} from '@mui/icons-material';
import * as pricingAdminService from '../../../services/pricingAdmin.service';

const PAYMENT_TERMS = [
    { value: 'a_vista', label: 'À Vista' },
    { value: '7_dias', label: '7 Dias' },
    { value: '14_dias', label: '14 Dias' },
    { value: '21_dias', label: '21 Dias' },
    { value: '28_dias', label: '28 Dias' },
    { value: '30_dias', label: '30 Dias' },
    { value: '60_dias', label: '60 Dias' },
];

const HISTORY_KEY = 'pricing_test_history';

function PricingTestPage() {
    const navigate = useNavigate();

    // Form states
    const [customerId, setCustomerId] = useState(null);
    const [customerName, setCustomerName] = useState('');
    const [sku, setSku] = useState('');
    const [productName, setProductName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [paymentTerm, setPaymentTerm] = useState('a_vista');

    // Autocomplete options
    const [customerOptions, setCustomerOptions] = useState([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [productOptions, setProductOptions] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Result states
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // History
    const [history, setHistory] = useState([]);

    // Load history from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(HISTORY_KEY);
            if (saved) {
                setHistory(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Error loading history:', e);
        }
    }, []);

    // Save history to localStorage
    const saveHistory = (newHistory) => {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
            setHistory(newHistory);
        } catch (e) {
            console.error('Error saving history:', e);
        }
    };

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

    // Run pricing test
    const handleRunTest = async () => {
        if (!customerId || !sku) {
            setError('Selecione um cliente e um produto');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await pricingAdminService.testPricing({
                customer_id: customerId,
                sku: sku,
                quantity: parseInt(quantity) || 1,
                payment_term: paymentTerm,
            });

            const testResult = response.data;
            setResult(testResult);

            // Add to history
            const historyEntry = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                customer_id: customerId,
                customer_name: customerName,
                sku: sku,
                product_name: productName,
                quantity: quantity,
                payment_term: paymentTerm,
                final_price: testResult?.final_price || testResult?.preco_final,
                base_price: testResult?.base_price || testResult?.preco_base,
            };

            const newHistory = [historyEntry, ...history.slice(0, 19)]; // Keep last 20
            saveHistory(newHistory);
        } catch (err) {
            setError(err.message || 'Erro ao executar teste de precificação');
        } finally {
            setLoading(false);
        }
    };

    // Clear form
    const handleClear = () => {
        setCustomerId(null);
        setCustomerName('');
        setSku('');
        setProductName('');
        setQuantity(1);
        setPaymentTerm('a_vista');
        setResult(null);
        setError(null);
    };

    // Load from history
    const handleLoadFromHistory = (entry) => {
        setCustomerId(entry.customer_id);
        setCustomerName(entry.customer_name);
        setSku(entry.sku);
        setProductName(entry.product_name);
        setQuantity(entry.quantity);
        setPaymentTerm(entry.payment_term);
        setResult(null);
    };

    // Clear history
    const handleClearHistory = () => {
        saveHistory([]);
    };

    // Delete history entry
    const handleDeleteHistoryEntry = (id) => {
        const newHistory = history.filter(h => h.id !== id);
        saveHistory(newHistory);
    };

    const formatCurrency = (value) => {
        if (value === null || value === undefined) return '-';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatPercent = (value) => {
        if (value === null || value === undefined) return '-';
        return `${(value * 100).toFixed(2)}%`;
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
                        <TestIcon sx={{ fontSize: 32, color: '#6366f1' }} />
                        Teste de Precificação
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Simule o motor de pricing para diferentes cenários
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    onClick={() => navigate('/admin/pricing/test/batch')}
                    startIcon={<TestIcon />}
                >
                    Teste em Lote
                </Button>
            </Box>

            {/* Alert */}
            {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Left Column - Form */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            Parâmetros do Teste
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
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
                                        setCustomerId(newValue ? newValue.id : null);
                                        setCustomerName(newValue ? newValue.name : '');
                                    }}
                                    value={customerId ? { id: customerId, name: customerName } : null}
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

                            <Grid item xs={12}>
                                <Autocomplete
                                    freeSolo
                                    options={productOptions}
                                    getOptionLabel={(option) =>
                                        typeof option === 'string' ? option : `${option.sku} - ${option.name || option.model}`
                                    }
                                    loading={loadingProducts}
                                    onInputChange={(event, newInputValue) => {
                                        setSku(newInputValue);
                                        searchProducts(newInputValue);
                                    }}
                                    onChange={(event, newValue) => {
                                        if (newValue && typeof newValue === 'object') {
                                            setSku(newValue.sku);
                                            setProductName(newValue.name || newValue.model || '');
                                        }
                                    }}
                                    inputValue={sku}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Produto (SKU)"
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

                            <Grid item xs={6}>
                                <TextField
                                    label="Quantidade"
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    inputProps={{ min: 1 }}
                                    fullWidth
                                    required
                                />
                            </Grid>

                            <Grid item xs={6}>
                                <Autocomplete
                                    options={PAYMENT_TERMS}
                                    getOptionLabel={(option) => option.label}
                                    value={PAYMENT_TERMS.find(t => t.value === paymentTerm) || null}
                                    onChange={(event, newValue) => {
                                        setPaymentTerm(newValue ? newValue.value : 'a_vista');
                                    }}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Condição de Pagamento" />
                                    )}
                                />
                            </Grid>

                            <Grid item xs={12} sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                <Button
                                    variant="contained"
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RunIcon />}
                                    onClick={handleRunTest}
                                    disabled={loading || !customerId || !sku}
                                    sx={{ bgcolor: '#6366f1', flex: 1 }}
                                >
                                    {loading ? 'Processando...' : 'Executar Teste'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<ClearIcon />}
                                    onClick={handleClear}
                                >
                                    Limpar
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* History */}
                    <Paper sx={{ p: 3, mt: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <HistoryIcon /> Histórico de Testes
                            </Typography>
                            {history.length > 0 && (
                                <Button size="small" color="error" onClick={handleClearHistory}>
                                    Limpar Histórico
                                </Button>
                            )}
                        </Box>

                        {history.length === 0 ? (
                            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                Nenhum teste realizado ainda
                            </Typography>
                        ) : (
                            <List dense>
                                {history.slice(0, 5).map((entry) => (
                                    <ListItem
                                        key={entry.id}
                                        secondaryAction={
                                            <IconButton edge="end" onClick={() => handleDeleteHistoryEntry(entry.id)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        }
                                        sx={{
                                            cursor: 'pointer',
                                            borderRadius: 1,
                                            '&:hover': { bgcolor: 'grey.50' }
                                        }}
                                        onClick={() => handleLoadFromHistory(entry)}
                                    >
                                        <ListItemText
                                            primary={`${entry.sku} - ${entry.customer_name}`}
                                            secondary={`Qtd: ${entry.quantity} | ${formatCurrency(entry.final_price)} | ${new Date(entry.timestamp).toLocaleString('pt-BR')}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>

                {/* Right Column - Results */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, minHeight: 400 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            Resultado da Simulação
                        </Typography>

                        {!result ? (
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: 300,
                                color: 'text.secondary'
                            }}>
                                <Typography>Execute um teste para ver os resultados</Typography>
                            </Box>
                        ) : (
                            <Box>
                                {/* Summary Cards */}
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid item xs={4}>
                                        <Card variant="outlined">
                                            <CardContent sx={{ textAlign: 'center', py: 1 }}>
                                                <Typography variant="caption" color="text.secondary">Preço Base</Typography>
                                                <Typography variant="h6" fontWeight="bold">
                                                    {formatCurrency(result.base_price || result.preco_base)}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Card variant="outlined" sx={{ bgcolor: 'success.light' }}>
                                            <CardContent sx={{ textAlign: 'center', py: 1 }}>
                                                <Typography variant="caption" color="text.secondary">Desconto Total</Typography>
                                                <Typography variant="h6" fontWeight="bold" color="success.dark">
                                                    {formatPercent(result.total_discount || result.desconto_total)}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Card variant="outlined" sx={{ bgcolor: 'primary.light' }}>
                                            <CardContent sx={{ textAlign: 'center', py: 1 }}>
                                                <Typography variant="caption" color="text.secondary">Preço Final</Typography>
                                                <Typography variant="h6" fontWeight="bold" color="primary.dark">
                                                    {formatCurrency(result.final_price || result.preco_final)}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 2 }} />

                                {/* Applied Rules */}
                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                    Regras Aplicadas
                                </Typography>

                                {(result.rules_applied || result.regras_aplicadas || []).length === 0 ? (
                                    <Typography color="text.secondary" variant="body2">
                                        Nenhuma regra especial foi aplicada
                                    </Typography>
                                ) : (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Regra</TableCell>
                                                    <TableCell>Tipo</TableCell>
                                                    <TableCell align="right">Valor</TableCell>
                                                    <TableCell align="center">Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {(result.rules_applied || result.regras_aplicadas || []).map((rule, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell>{rule.name || rule.nome}</TableCell>
                                                        <TableCell>
                                                            <Chip label={rule.type || rule.tipo} size="small" />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {rule.discount_type === 'percentage' || rule.tipo_desconto === 'percentual'
                                                                ? formatPercent(rule.value || rule.valor)
                                                                : formatCurrency(rule.value || rule.valor)
                                                            }
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            {rule.applied || rule.aplicado ? (
                                                                <AppliedIcon color="success" fontSize="small" />
                                                            ) : (
                                                                <NotAppliedIcon color="error" fontSize="small" />
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}

                                {/* Breakdown Accordion */}
                                {(result.breakdown || result.detalhamento) && (
                                    <Accordion sx={{ mt: 2 }}>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography fontWeight="medium">Detalhamento do Cálculo</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <pre style={{
                                                fontSize: '12px',
                                                overflow: 'auto',
                                                backgroundColor: '#f5f5f5',
                                                padding: '8px',
                                                borderRadius: '4px'
                                            }}>
                                                {JSON.stringify(result.breakdown || result.detalhamento, null, 2)}
                                            </pre>
                                        </AccordionDetails>
                                    </Accordion>
                                )}

                                {/* Full Response Accordion */}
                                <Accordion sx={{ mt: 1 }}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography fontWeight="medium">Resposta Completa (JSON)</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <pre style={{
                                            fontSize: '11px',
                                            overflow: 'auto',
                                            backgroundColor: '#f5f5f5',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            maxHeight: '300px'
                                        }}>
                                            {JSON.stringify(result, null, 2)}
                                        </pre>
                                    </AccordionDetails>
                                </Accordion>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

export default PricingTestPage;
