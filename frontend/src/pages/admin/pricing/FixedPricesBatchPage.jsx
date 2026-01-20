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
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    FileUpload as UploadIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Download as DownloadIcon,
    Refresh as ResetIcon,
    CloudUpload as ImportIcon,
} from '@mui/icons-material';
import * as pricingAdminService from '../../../services/pricingAdmin.service';

const STEPS = ['Upload do Arquivo', 'Validação', 'Importação', 'Resultado'];

const SAMPLE_CSV = `customer_id,sku,fixed_price,start_date,end_date
12345,ABC-001,150.50,2024-01-01,2024-12-31
12345,ABC-002,200.00,,
67890,XYZ-100,99.99,2024-06-01,`;

function FixedPricesBatchPage() {
    const navigate = useNavigate();

    // Stepper state
    const [activeStep, setActiveStep] = useState(0);

    // File state
    const [file, setFile] = useState(null);
    const [fileData, setFileData] = useState([]);
    const [parsing, setParsing] = useState(false);

    // Validation state
    const [validating, setValidating] = useState(false);
    const [validationResults, setValidationResults] = useState(null);

    // Import state
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importResults, setImportResults] = useState(null);

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

    // Validate data
    const handleValidate = async () => {
        setValidating(true);
        setError(null);

        try {
            const results = {
                total: fileData.length,
                valid: 0,
                invalid: 0,
                warnings: 0,
                errors: [],
                warnings_list: [],
            };

            for (const row of fileData) {
                const rowErrors = [];
                const rowWarnings = [];

                // Validate required fields
                if (!row.customer_id) {
                    rowErrors.push(`Linha ${row._line}: customer_id é obrigatório`);
                }
                if (!row.sku) {
                    rowErrors.push(`Linha ${row._line}: sku é obrigatório`);
                }
                if (!row.fixed_price || isNaN(parseFloat(row.fixed_price))) {
                    rowErrors.push(`Linha ${row._line}: fixed_price inválido`);
                }

                // Validate dates
                if (row.start_date && isNaN(Date.parse(row.start_date))) {
                    rowWarnings.push(`Linha ${row._line}: start_date inválida, será ignorada`);
                }
                if (row.end_date && isNaN(Date.parse(row.end_date))) {
                    rowWarnings.push(`Linha ${row._line}: end_date inválida, será ignorada`);
                }

                if (rowErrors.length > 0) {
                    results.invalid++;
                    results.errors.push(...rowErrors);
                } else {
                    results.valid++;
                }

                if (rowWarnings.length > 0) {
                    results.warnings++;
                    results.warnings_list.push(...rowWarnings);
                }
            }

            setValidationResults(results);

            if (results.valid > 0) {
                setActiveStep(2);
            }
        } catch (err) {
            setError('Erro na validação: ' + err.message);
        } finally {
            setValidating(false);
        }
    };

    // Import data
    const handleImport = async () => {
        setImporting(true);
        setError(null);
        setImportProgress(0);

        const results = {
            success: 0,
            failed: 0,
            errors: [],
        };

        try {
            // Filter only valid rows
            const validRows = fileData.filter(row =>
                row.customer_id && row.sku && row.fixed_price && !isNaN(parseFloat(row.fixed_price))
            );

            for (let i = 0; i < validRows.length; i++) {
                const row = validRows[i];

                try {
                    await pricingAdminService.createFixedPrice({
                        customer_id: parseInt(row.customer_id),
                        sku: row.sku,
                        fixed_price: parseFloat(row.fixed_price),
                        start_date: row.start_date || null,
                        end_date: row.end_date || null,
                        is_active: true,
                    });
                    results.success++;
                } catch (err) {
                    results.failed++;
                    results.errors.push(`Linha ${row._line}: ${err.message || 'Erro ao importar'}`);
                }

                setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
            }

            setImportResults(results);
            setActiveStep(3);
        } catch (err) {
            setError('Erro na importação: ' + err.message);
        } finally {
            setImporting(false);
        }
    };

    // Reset the process
    const handleReset = () => {
        setActiveStep(0);
        setFile(null);
        setFileData([]);
        setValidationResults(null);
        setImportResults(null);
        setImportProgress(0);
        setError(null);
    };

    // Download sample CSV
    const handleDownloadSample = () => {
        const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'modelo_precos_fixos.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <Button
                    startIcon={<BackIcon />}
                    onClick={() => navigate('/admin/pricing/fixed-prices')}
                    variant="outlined"
                    size="small"
                >
                    Voltar
                </Button>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ImportIcon sx={{ fontSize: 32, color: '#ef4444' }} />
                        Importação em Lote - Preços Fixos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Importe múltiplos preços fixos via arquivo CSV
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
                        Selecione o arquivo CSV para importação
                    </Typography>

                    <Box
                        sx={{
                            border: '2px dashed #ccc',
                            borderRadius: 2,
                            p: 4,
                            my: 3,
                            cursor: 'pointer',
                            '&:hover': { borderColor: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.05)' }
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
                                        <TableCell>fixed_price</TableCell>
                                        <TableCell>start_date</TableCell>
                                        <TableCell>end_date</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>12345</TableCell>
                                        <TableCell>ABC-001</TableCell>
                                        <TableCell>150.50</TableCell>
                                        <TableCell>2024-01-01</TableCell>
                                        <TableCell>2024-12-31</TableCell>
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

            {/* Step 1: Validation Preview */}
            {activeStep === 1 && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Preview dos Dados ({fileData.length} registros)
                    </Typography>

                    <TableContainer sx={{ maxHeight: 400, mb: 3 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Linha</strong></TableCell>
                                    <TableCell><strong>Customer ID</strong></TableCell>
                                    <TableCell><strong>SKU</strong></TableCell>
                                    <TableCell><strong>Preço Fixo</strong></TableCell>
                                    <TableCell><strong>Data Início</strong></TableCell>
                                    <TableCell><strong>Data Fim</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {fileData.slice(0, 50).map((row, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{row._line}</TableCell>
                                        <TableCell>{row.customer_id || <Chip label="Vazio" size="small" color="error" />}</TableCell>
                                        <TableCell>{row.sku || <Chip label="Vazio" size="small" color="error" />}</TableCell>
                                        <TableCell>{row.fixed_price || <Chip label="Vazio" size="small" color="error" />}</TableCell>
                                        <TableCell>{row.start_date || '-'}</TableCell>
                                        <TableCell>{row.end_date || '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {fileData.length > 50 && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Mostrando apenas os primeiros 50 registros de {fileData.length}
                        </Alert>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button variant="outlined" onClick={handleReset}>Cancelar</Button>
                        <Button
                            variant="contained"
                            onClick={handleValidate}
                            disabled={validating}
                            sx={{ bgcolor: '#ef4444' }}
                        >
                            {validating ? <CircularProgress size={24} /> : 'Validar Dados'}
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* Step 2: Validation Results & Import */}
            {activeStep === 2 && validationResults && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Resultado da Validação
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                        <Card sx={{ flex: 1 }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" color="success.main">{validationResults.valid}</Typography>
                                <Typography variant="body2" color="text.secondary">Válidos</Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ flex: 1 }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" color="error.main">{validationResults.invalid}</Typography>
                                <Typography variant="body2" color="text.secondary">Inválidos</Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ flex: 1 }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" color="warning.main">{validationResults.warnings}</Typography>
                                <Typography variant="body2" color="text.secondary">Avisos</Typography>
                            </CardContent>
                        </Card>
                    </Box>

                    {validationResults.errors.length > 0 && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>Erros encontrados:</Typography>
                            <List dense>
                                {validationResults.errors.slice(0, 10).map((err, idx) => (
                                    <ListItem key={idx} disablePadding>
                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                            <ErrorIcon color="error" fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary={err} />
                                    </ListItem>
                                ))}
                                {validationResults.errors.length > 10 && (
                                    <ListItem>
                                        <ListItemText
                                            primary={`... e mais ${validationResults.errors.length - 10} erros`}
                                            primaryTypographyProps={{ color: 'text.secondary' }}
                                        />
                                    </ListItem>
                                )}
                            </List>
                        </Alert>
                    )}

                    {validationResults.warnings_list.length > 0 && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>Avisos:</Typography>
                            <List dense>
                                {validationResults.warnings_list.slice(0, 5).map((warn, idx) => (
                                    <ListItem key={idx} disablePadding>
                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                            <WarningIcon color="warning" fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary={warn} />
                                    </ListItem>
                                ))}
                            </List>
                        </Alert>
                    )}

                    {validationResults.valid === 0 ? (
                        <Alert severity="error">
                            Nenhum registro válido para importar. Corrija os erros e tente novamente.
                        </Alert>
                    ) : (
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button variant="outlined" onClick={handleReset}>Cancelar</Button>
                            <Button
                                variant="contained"
                                onClick={handleImport}
                                disabled={importing}
                                sx={{ bgcolor: '#ef4444' }}
                            >
                                {importing ? <CircularProgress size={24} /> : `Importar ${validationResults.valid} Registros`}
                            </Button>
                        </Box>
                    )}

                    {importing && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Importando... {importProgress}%
                            </Typography>
                            <LinearProgress variant="determinate" value={importProgress} />
                        </Box>
                    )}
                </Paper>
            )}

            {/* Step 3: Import Results */}
            {activeStep === 3 && importResults && (
                <Paper sx={{ p: 3 }}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        {importResults.failed === 0 ? (
                            <SuccessIcon sx={{ fontSize: 80, color: 'success.main' }} />
                        ) : importResults.success === 0 ? (
                            <ErrorIcon sx={{ fontSize: 80, color: 'error.main' }} />
                        ) : (
                            <WarningIcon sx={{ fontSize: 80, color: 'warning.main' }} />
                        )}

                        <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
                            Importação Concluída
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 3, mb: 3, justifyContent: 'center' }}>
                        <Card sx={{ minWidth: 150 }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" color="success.main">{importResults.success}</Typography>
                                <Typography variant="body2" color="text.secondary">Importados</Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ minWidth: 150 }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" color="error.main">{importResults.failed}</Typography>
                                <Typography variant="body2" color="text.secondary">Falharam</Typography>
                            </CardContent>
                        </Card>
                    </Box>

                    {importResults.errors.length > 0 && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>Erros durante a importação:</Typography>
                            <List dense>
                                {importResults.errors.slice(0, 10).map((err, idx) => (
                                    <ListItem key={idx} disablePadding>
                                        <ListItemText primary={err} />
                                    </ListItem>
                                ))}
                            </List>
                        </Alert>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button
                            variant="outlined"
                            onClick={handleReset}
                            startIcon={<ResetIcon />}
                        >
                            Nova Importação
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/admin/pricing/fixed-prices')}
                            sx={{ bgcolor: '#ef4444' }}
                        >
                            Ver Preços Fixos
                        </Button>
                    </Box>
                </Paper>
            )}
        </Box>
    );
}

export default FixedPricesBatchPage;
