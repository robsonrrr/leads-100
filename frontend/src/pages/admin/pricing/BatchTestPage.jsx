import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    CircularProgress,
    Chip,
    Stepper,
    Step,
    StepLabel,
    Divider,
    LinearProgress,
    Card,
    CardContent,
    Tooltip,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    TextField,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    FileUpload as UploadIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Download as DownloadIcon,
    Refresh as ResetIcon,
    CloudUpload as ImportIcon,
    Science as TestIcon,
    Compare as CompareIcon,
} from '@mui/icons-material';
import * as pricingAdminService from '../../../services/pricingAdmin.service';

const STEPS = ['Upload do Arquivo', 'Configuração', 'Execução', 'Resultados'];

const SAMPLE_CSV = `customer_id,sku,quantity,payment_term
12345,ABC-001,10,a_vista
12345,ABC-002,5,30_dias
67890,XYZ-100,20,a_vista
11111,DEF-500,100,60_dias`;

const PAYMENT_TERMS = [
    { value: 'a_vista', label: 'À Vista' },
    { value: '7_dias', label: '7 Dias' },
    { value: '14_dias', label: '14 Dias' },
    { value: '21_dias', label: '21 Dias' },
    { value: '28_dias', label: '28 Dias' },
    { value: '30_dias', label: '30 Dias' },
    { value: '60_dias', label: '60 Dias' },
];

function BatchTestPage() {
    const navigate = useNavigate();

    // Stepper state
    const [activeStep, setActiveStep] = useState(0);

    // File state
    const [file, setFile] = useState(null);
    const [fileData, setFileData] = useState([]);
    const [parsing, setParsing] = useState(false);

    // Config state
    const [defaultPaymentTerm, setDefaultPaymentTerm] = useState('a_vista');
    const [scenarios, setScenarios] = useState([{ name: 'Cenário Atual', payment_term: 'a_vista' }]);

    // Execution state
    const [executing, setExecuting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState([]);

    // Comparison state
    const [compareMode, setCompareMode] = useState(false);

    // Error state
    const [error, setError] = useState(null);

    // Parse CSV file
    const parseCSV = useCallback((text) => {
        const lines = text.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index]?.trim() || null;
            });
            row._line = i + 1;
            data.push(row);
        }

        return data;
    }, []);

    // Handle file selection
    const handleFileChange = async (event) => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith('.csv')) {
            setError('Por favor, selecione um arquivo CSV');
            return;
        }

        setFile(selectedFile);
        setParsing(true);
        setError(null);

        try {
            const text = await selectedFile.text();
            const data = parseCSV(text);

            if (data.length === 0) {
                setError('O arquivo está vazio ou mal formatado');
                setParsing(false);
                return;
            }

            setFileData(data);
            setActiveStep(1);
        } catch (err) {
            setError('Erro ao ler o arquivo: ' + err.message);
        } finally {
            setParsing(false);
        }
    };

    // Add scenario
    const handleAddScenario = () => {
        setScenarios([...scenarios, { name: `Cenário ${scenarios.length + 1}`, payment_term: 'a_vista' }]);
    };

    // Remove scenario
    const handleRemoveScenario = (index) => {
        if (scenarios.length > 1) {
            setScenarios(scenarios.filter((_, i) => i !== index));
        }
    };

    // Update scenario
    const handleUpdateScenario = (index, field, value) => {
        const updated = [...scenarios];
        updated[index] = { ...updated[index], [field]: value };
        setScenarios(updated);
    };

    // Execute tests
    const handleExecute = async () => {
        setExecuting(true);
        setError(null);
        setProgress(0);
        setResults([]);

        const allResults = [];
        const totalTests = fileData.length * scenarios.length;
        let completed = 0;

        try {
            for (const row of fileData) {
                const rowResults = {
                    line: row._line,
                    customer_id: row.customer_id,
                    sku: row.sku,
                    quantity: row.quantity || 1,
                    scenarios: [],
                };

                for (const scenario of scenarios) {
                    try {
                        const response = await pricingAdminService.testPricing({
                            customer_id: parseInt(row.customer_id),
                            sku: row.sku,
                            quantity: parseInt(row.quantity) || 1,
                            payment_term: row.payment_term || scenario.payment_term || defaultPaymentTerm,
                        });

                        rowResults.scenarios.push({
                            name: scenario.name,
                            success: true,
                            base_price: response.data?.base_price || response.data?.preco_base,
                            final_price: response.data?.final_price || response.data?.preco_final,
                            discount: response.data?.total_discount || response.data?.desconto_total,
                            rules_count: (response.data?.rules_applied || response.data?.regras_aplicadas || []).length,
                        });
                    } catch (err) {
                        rowResults.scenarios.push({
                            name: scenario.name,
                            success: false,
                            error: err.message || 'Erro no teste',
                        });
                    }

                    completed++;
                    setProgress(Math.round((completed / totalTests) * 100));
                }

                allResults.push(rowResults);
            }

            setResults(allResults);
            setActiveStep(3);
            setCompareMode(scenarios.length > 1);
        } catch (err) {
            setError('Erro na execução: ' + err.message);
        } finally {
            setExecuting(false);
        }
    };

    // Export results
    const handleExportResults = () => {
        if (results.length === 0) return;

        // Build CSV headers
        let headers = ['Linha', 'Customer ID', 'SKU', 'Quantidade'];
        scenarios.forEach(s => {
            headers.push(`${s.name} - Preço Base`, `${s.name} - Preço Final`, `${s.name} - Desconto %`);
        });

        // Build CSV rows
        const csvRows = [headers.join(',')];

        results.forEach(row => {
            const values = [row.line, row.customer_id, row.sku, row.quantity];
            row.scenarios.forEach(s => {
                if (s.success) {
                    values.push(s.base_price?.toFixed(2) || '', s.final_price?.toFixed(2) || '', ((s.discount || 0) * 100).toFixed(2));
                } else {
                    values.push('ERRO', 'ERRO', 'ERRO');
                }
            });
            csvRows.push(values.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `teste_lote_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    // Reset the process
    const handleReset = () => {
        setActiveStep(0);
        setFile(null);
        setFileData([]);
        setResults([]);
        setProgress(0);
        setError(null);
        setScenarios([{ name: 'Cenário Atual', payment_term: 'a_vista' }]);
    };

    // Download sample CSV
    const handleDownloadSample = () => {
        const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'modelo_teste_lote.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const formatCurrency = (value) => {
        if (value === null || value === undefined) return '-';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatPercent = (value) => {
        if (value === null || value === undefined) return '-';
        return `${(value * 100).toFixed(2)}%`;
    };

    // Calculate summary
    const getSummary = () => {
        if (results.length === 0) return null;

        const summary = scenarios.map((scenario, idx) => {
            const scenarioResults = results.map(r => r.scenarios[idx]).filter(s => s && s.success);
            const totalBase = scenarioResults.reduce((sum, s) => sum + (s.base_price || 0), 0);
            const totalFinal = scenarioResults.reduce((sum, s) => sum + (s.final_price || 0), 0);
            const avgDiscount = scenarioResults.length > 0
                ? scenarioResults.reduce((sum, s) => sum + (s.discount || 0), 0) / scenarioResults.length
                : 0;
            const successCount = scenarioResults.length;
            const errorCount = results.length - successCount;

            return {
                name: scenario.name,
                totalBase,
                totalFinal,
                avgDiscount,
                successCount,
                errorCount,
            };
        });

        return summary;
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <Button
                    startIcon={<BackIcon />}
                    onClick={() => navigate('/admin/pricing/test')}
                    variant="outlined"
                    size="small"
                >
                    Voltar
                </Button>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TestIcon sx={{ fontSize: 32, color: '#6366f1' }} />
                        Teste de Precificação em Lote
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Execute testes de pricing em massa via arquivo CSV
                    </Typography>
                </Box>
                {activeStep > 0 && (
                    <Button
                        variant="outlined"
                        startIcon={<ResetIcon />}
                        onClick={handleReset}
                        color="warning"
                    >
                        Reiniciar
                    </Button>
                )}
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Stepper */}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {STEPS.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {/* Step 0: Upload */}
            {activeStep === 0 && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                        Selecione o arquivo CSV com os itens para teste
                    </Typography>

                    <Box
                        sx={{
                            border: '2px dashed #ccc',
                            borderRadius: 2,
                            p: 4,
                            my: 3,
                            cursor: 'pointer',
                            '&:hover': { borderColor: '#6366f1', bgcolor: 'rgba(99, 102, 241, 0.05)' }
                        }}
                        onClick={() => document.getElementById('csv-upload').click()}
                    >
                        <UploadIcon sx={{ fontSize: 64, color: '#666', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                            Clique aqui ou arraste um arquivo CSV
                        </Typography>
                        <input
                            id="csv-upload"
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </Box>

                    {parsing && <CircularProgress sx={{ my: 2 }} />}

                    <Divider sx={{ my: 3 }} />

                    <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Formato esperado do arquivo CSV:
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                                        <TableCell>customer_id</TableCell>
                                        <TableCell>sku</TableCell>
                                        <TableCell>quantity</TableCell>
                                        <TableCell>payment_term (opcional)</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>12345</TableCell>
                                        <TableCell>ABC-001</TableCell>
                                        <TableCell>10</TableCell>
                                        <TableCell>a_vista</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={handleDownloadSample}
                            size="small"
                        >
                            Baixar Modelo CSV
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* Step 1: Configuration */}
            {activeStep === 1 && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Configuração dos Testes ({fileData.length} itens)
                    </Typography>

                    <Alert severity="info" sx={{ mb: 3 }}>
                        Configure cenários diferentes para comparar resultados. Por exemplo, simule diferentes condições de pagamento.
                    </Alert>

                    <Typography variant="subtitle2" gutterBottom>Cenários para Teste:</Typography>

                    {scenarios.map((scenario, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                            <TextField
                                label="Nome do Cenário"
                                value={scenario.name}
                                onChange={(e) => handleUpdateScenario(idx, 'name', e.target.value)}
                                size="small"
                                sx={{ width: 200 }}
                            />
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Condição Pagamento Padrão</InputLabel>
                                <Select
                                    value={scenario.payment_term}
                                    onChange={(e) => handleUpdateScenario(idx, 'payment_term', e.target.value)}
                                    label="Condição Pagamento Padrão"
                                >
                                    {PAYMENT_TERMS.map((term) => (
                                        <MenuItem key={term.value} value={term.value}>{term.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {scenarios.length > 1 && (
                                <IconButton color="error" onClick={() => handleRemoveScenario(idx)}>
                                    <ErrorIcon />
                                </IconButton>
                            )}
                        </Box>
                    ))}

                    <Button
                        variant="outlined"
                        startIcon={<CompareIcon />}
                        onClick={handleAddScenario}
                        size="small"
                        sx={{ mb: 3 }}
                    >
                        Adicionar Cenário para Comparação
                    </Button>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="subtitle2" gutterBottom>Preview dos dados:</Typography>
                    <TableContainer sx={{ maxHeight: 300, mb: 3 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Linha</strong></TableCell>
                                    <TableCell><strong>Customer ID</strong></TableCell>
                                    <TableCell><strong>SKU</strong></TableCell>
                                    <TableCell><strong>Quantidade</strong></TableCell>
                                    <TableCell><strong>Cond. Pagamento</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {fileData.slice(0, 20).map((row, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{row._line}</TableCell>
                                        <TableCell>{row.customer_id}</TableCell>
                                        <TableCell>{row.sku}</TableCell>
                                        <TableCell>{row.quantity || 1}</TableCell>
                                        <TableCell>{row.payment_term || <Chip label="Padrão" size="small" />}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {fileData.length > 20 && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Mostrando apenas os primeiros 20 registros de {fileData.length}
                        </Alert>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button variant="outlined" onClick={handleReset}>Cancelar</Button>
                        <Button
                            variant="contained"
                            onClick={handleExecute}
                            disabled={executing}
                            sx={{ bgcolor: '#6366f1' }}
                        >
                            {executing ? <CircularProgress size={24} /> : `Executar ${fileData.length * scenarios.length} Testes`}
                        </Button>
                    </Box>

                    {executing && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Executando testes... {progress}%
                            </Typography>
                            <LinearProgress variant="determinate" value={progress} />
                        </Box>
                    )}
                </Paper>
            )}

            {/* Step 2: Execution (shown briefly during execution) */}
            {activeStep === 2 && executing && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <CircularProgress size={60} sx={{ mb: 3 }} />
                    <Typography variant="h6" gutterBottom>
                        Executando Testes de Precificação
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Progresso: {progress}%
                    </Typography>
                    <LinearProgress variant="determinate" value={progress} sx={{ mt: 2 }} />
                </Paper>
            )}

            {/* Step 3: Results */}
            {activeStep === 3 && results.length > 0 && (
                <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                        <Typography variant="h6" sx={{ flex: 1 }}>
                            Resultados dos Testes
                        </Typography>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={handleExportResults}
                        >
                            Exportar CSV
                        </Button>
                    </Box>

                    {/* Summary Cards */}
                    {getSummary() && (
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            {getSummary().map((summary, idx) => (
                                <Grid item xs={12} md={12 / scenarios.length} key={idx}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                                {summary.name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="caption" color="text.secondary">Total Base:</Typography>
                                                <Typography variant="body2">{formatCurrency(summary.totalBase)}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="caption" color="text.secondary">Total Final:</Typography>
                                                <Typography variant="body2" fontWeight="bold">{formatCurrency(summary.totalFinal)}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="caption" color="text.secondary">Desc. Médio:</Typography>
                                                <Typography variant="body2" color="success.main">{formatPercent(summary.avgDiscount)}</Typography>
                                            </Box>
                                            <Divider sx={{ my: 1 }} />
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Chip label={`${summary.successCount} OK`} color="success" size="small" />
                                                {summary.errorCount > 0 && (
                                                    <Chip label={`${summary.errorCount} Erros`} color="error" size="small" />
                                                )}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {/* Detailed Results Table */}
                    <TableContainer sx={{ maxHeight: 500 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.100' }}>
                                    <TableCell><strong>Linha</strong></TableCell>
                                    <TableCell><strong>Customer</strong></TableCell>
                                    <TableCell><strong>SKU</strong></TableCell>
                                    <TableCell><strong>Qtd</strong></TableCell>
                                    {scenarios.map((s, idx) => (
                                        <React.Fragment key={idx}>
                                            <TableCell align="right"><strong>{s.name} - Base</strong></TableCell>
                                            <TableCell align="right"><strong>{s.name} - Final</strong></TableCell>
                                            <TableCell align="right"><strong>{s.name} - Desc</strong></TableCell>
                                        </React.Fragment>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {results.map((row, idx) => (
                                    <TableRow key={idx} hover>
                                        <TableCell>{row.line}</TableCell>
                                        <TableCell>{row.customer_id}</TableCell>
                                        <TableCell>{row.sku}</TableCell>
                                        <TableCell>{row.quantity}</TableCell>
                                        {row.scenarios.map((s, sIdx) => (
                                            <React.Fragment key={sIdx}>
                                                {s.success ? (
                                                    <>
                                                        <TableCell align="right">{formatCurrency(s.base_price)}</TableCell>
                                                        <TableCell align="right">{formatCurrency(s.final_price)}</TableCell>
                                                        <TableCell align="right">
                                                            <Chip
                                                                label={formatPercent(s.discount)}
                                                                color="success"
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                    </>
                                                ) : (
                                                    <>
                                                        <TableCell colSpan={3} align="center">
                                                            <Chip label="Erro" color="error" size="small" />
                                                        </TableCell>
                                                    </>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
                        <Button
                            variant="outlined"
                            onClick={handleReset}
                            startIcon={<ResetIcon />}
                        >
                            Novo Teste em Lote
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/admin/pricing/test')}
                            sx={{ bgcolor: '#6366f1' }}
                        >
                            Teste Individual
                        </Button>
                    </Box>
                </Paper>
            )}
        </Box>
    );
}

export default BatchTestPage;
