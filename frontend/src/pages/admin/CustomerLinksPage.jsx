/**
 * Customer Links Management Page
 * 
 * CRUD para gerenciar vinculações superbot_customer_links
 * 
 * @version 1.0
 * @date 2026-01-19
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Button,
    IconButton,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Alert,
    CircularProgress,
    InputAdornment,
    FormControlLabel,
    Switch,
    Grid,
    Card,
    CardContent,
    Tooltip,
} from '@mui/material'
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Link as LinkIcon,
    LinkOff as LinkOffIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    WhatsApp as WhatsAppIcon,
    People as PeopleIcon,
} from '@mui/icons-material'
import { adminService } from '../../services/admin.service'

const CustomerLinksPage = () => {
    // State
    const [links, setLinks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(25)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState('')
    const [verifiedFilter, setVerifiedFilter] = useState('')
    const [stats, setStats] = useState(null)

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogMode, setDialogMode] = useState('create') // 'create' or 'edit'
    const [selectedLink, setSelectedLink] = useState(null)
    const [formData, setFormData] = useState({
        superbot_customer_id: '',
        leads_customer_id: '',
        confidence_score: 100,
        verified: true
    })
    const [saving, setSaving] = useState(false)

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [linkToDelete, setLinkToDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)

    // Auto-link dialog
    const [autoLinkDialogOpen, setAutoLinkDialogOpen] = useState(false)
    const [autoLinkResult, setAutoLinkResult] = useState(null)
    const [autoLinking, setAutoLinking] = useState(false)

    // Load data
    const loadLinks = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await adminService.getCustomerLinks({
                page: page + 1,
                limit: rowsPerPage,
                search: search || undefined,
                verified: verifiedFilter || undefined
            })
            setLinks(response.data?.data || [])
            setTotal(response.data?.pagination?.total || 0)
        } catch (err) {
            console.error('Erro ao carregar links:', err)
            setError('Erro ao carregar vinculações')
        } finally {
            setLoading(false)
        }
    }, [page, rowsPerPage, search, verifiedFilter])

    const loadStats = useCallback(async () => {
        try {
            const response = await adminService.getCustomerLinksStats()
            setStats(response.data?.data)
        } catch (err) {
            console.error('Erro ao carregar stats:', err)
        }
    }, [])

    useEffect(() => {
        loadLinks()
        loadStats()
    }, [loadLinks, loadStats])

    // Handlers
    const handlePageChange = (event, newPage) => {
        setPage(newPage)
    }

    const handleRowsPerPageChange = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10))
        setPage(0)
    }

    const handleSearchChange = (event) => {
        setSearch(event.target.value)
        setPage(0)
    }

    const handleOpenCreate = () => {
        setDialogMode('create')
        setFormData({
            superbot_customer_id: '',
            leads_customer_id: '',
            confidence_score: 100,
            verified: true
        })
        setDialogOpen(true)
    }

    const handleOpenEdit = (link) => {
        setDialogMode('edit')
        setSelectedLink(link)
        setFormData({
            superbot_customer_id: link.superbot_customer_id,
            leads_customer_id: link.leads_customer_id,
            confidence_score: link.confidence_score,
            verified: link.verified === 1
        })
        setDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setDialogOpen(false)
        setSelectedLink(null)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            if (dialogMode === 'create') {
                await adminService.createCustomerLink(formData)
            } else {
                await adminService.updateCustomerLink(selectedLink.id, formData)
            }
            handleCloseDialog()
            loadLinks()
            loadStats()
        } catch (err) {
            console.error('Erro ao salvar:', err)
            setError(err.response?.data?.error || 'Erro ao salvar')
        } finally {
            setSaving(false)
        }
    }

    const handleOpenDelete = (link) => {
        setLinkToDelete(link)
        setDeleteDialogOpen(true)
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            await adminService.deleteCustomerLink(linkToDelete.id)
            setDeleteDialogOpen(false)
            setLinkToDelete(null)
            loadLinks()
            loadStats()
        } catch (err) {
            console.error('Erro ao deletar:', err)
            setError(err.response?.data?.error || 'Erro ao deletar')
        } finally {
            setDeleting(false)
        }
    }

    // Auto-link functions
    const handleAutoLinkPreview = async () => {
        setAutoLinking(true)
        setAutoLinkResult(null)
        try {
            const response = await adminService.autoLinkCustomers(true) // dryRun = true
            setAutoLinkResult(response.data)
            setAutoLinkDialogOpen(true)
        } catch (err) {
            console.error('Erro no preview:', err)
            setError(err.response?.data?.error || 'Erro ao verificar vinculações automáticas')
        } finally {
            setAutoLinking(false)
        }
    }

    const handleAutoLinkExecute = async () => {
        setAutoLinking(true)
        try {
            const response = await adminService.autoLinkCustomers(false) // dryRun = false
            setAutoLinkResult(response.data)
            loadLinks()
            loadStats()
        } catch (err) {
            console.error('Erro no auto-link:', err)
            setError(err.response?.data?.error || 'Erro na vinculação automática')
        } finally {
            setAutoLinking(false)
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LinkIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            Vinculações de Clientes
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Gerenciar vinculações Superbot ↔ Leads-Agent
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={() => { loadLinks(); loadStats(); }}
                    >
                        Atualizar
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={autoLinking ? <CircularProgress size={18} /> : <LinkIcon />}
                        onClick={handleAutoLinkPreview}
                        disabled={autoLinking}
                    >
                        Auto-Link por Telefone
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenCreate}
                    >
                        Nova Vinculação
                    </Button>
                </Box>
            </Box>

            {/* Stats Cards */}
            {stats && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography color="text.secondary" variant="caption">
                                            Total de Vinculações
                                        </Typography>
                                        <Typography variant="h4" fontWeight="bold">
                                            {stats.summary?.total || 0}
                                        </Typography>
                                    </Box>
                                    <LinkIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.5 }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography color="text.secondary" variant="caption">
                                            Verificadas
                                        </Typography>
                                        <Typography variant="h4" fontWeight="bold" color="success.main">
                                            {stats.summary?.verified || 0}
                                        </Typography>
                                    </Box>
                                    <CheckIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.5 }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography color="text.secondary" variant="caption">
                                            Pendentes
                                        </Typography>
                                        <Typography variant="h4" fontWeight="bold" color="warning.main">
                                            {stats.summary?.pending || 0}
                                        </Typography>
                                    </Box>
                                    <CloseIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.5 }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography color="text.secondary" variant="caption">
                                            Confiança Média
                                        </Typography>
                                        <Typography variant="h4" fontWeight="bold">
                                            {Math.round(stats.summary?.avg_confidence || 0)}%
                                        </Typography>
                                    </Box>
                                    <PeopleIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.5 }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField
                        size="small"
                        placeholder="Buscar por telefone, nome..."
                        value={search}
                        onChange={handleSearchChange}
                        sx={{ minWidth: 300 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            )
                        }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                            label="Todas"
                            variant={verifiedFilter === '' ? 'filled' : 'outlined'}
                            onClick={() => setVerifiedFilter('')}
                            color={verifiedFilter === '' ? 'primary' : 'default'}
                        />
                        <Chip
                            label="Verificadas"
                            variant={verifiedFilter === 'true' ? 'filled' : 'outlined'}
                            onClick={() => setVerifiedFilter('true')}
                            color={verifiedFilter === 'true' ? 'success' : 'default'}
                            icon={<CheckIcon />}
                        />
                        <Chip
                            label="Pendentes"
                            variant={verifiedFilter === 'false' ? 'filled' : 'outlined'}
                            onClick={() => setVerifiedFilter('false')}
                            color={verifiedFilter === 'false' ? 'warning' : 'default'}
                            icon={<CloseIcon />}
                        />
                    </Box>
                </Box>
            </Paper>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Table */}
            <TableContainer component={Paper}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Telefone</TableCell>
                                    <TableCell>Cliente Superbot</TableCell>
                                    <TableCell>Cliente Leads</TableCell>
                                    <TableCell>CNPJ</TableCell>
                                    <TableCell align="center">Confiança</TableCell>
                                    <TableCell align="center">Verificado</TableCell>
                                    <TableCell>Vinculado Por</TableCell>
                                    <TableCell>Data</TableCell>
                                    <TableCell align="center">Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {links.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} align="center">
                                            <Typography color="text.secondary" sx={{ py: 4 }}>
                                                Nenhuma vinculação encontrada
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    links.map((link) => (
                                        <TableRow key={link.id} hover>
                                            <TableCell>{link.id}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <WhatsAppIcon sx={{ color: '#25D366', fontSize: 18 }} />
                                                    {link.phone_number || '-'}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {link.superbot_name || link.push_name || '-'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    ID: {link.superbot_customer_id}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {link.leads_customer_name || '-'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    ID: {link.leads_customer_id}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" fontFamily="monospace">
                                                    {link.cnpj || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    size="small"
                                                    label={`${link.confidence_score}%`}
                                                    color={link.confidence_score >= 80 ? 'success' : link.confidence_score >= 50 ? 'warning' : 'error'}
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                {link.verified ? (
                                                    <Chip size="small" label="Sim" color="success" icon={<CheckIcon />} />
                                                ) : (
                                                    <Chip size="small" label="Não" color="warning" icon={<CloseIcon />} />
                                                )}
                                            </TableCell>
                                            <TableCell>{link.linked_by_name || '-'}</TableCell>
                                            <TableCell>{formatDate(link.linked_at)}</TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="Editar">
                                                    <IconButton size="small" onClick={() => handleOpenEdit(link)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Excluir">
                                                    <IconButton size="small" color="error" onClick={() => handleOpenDelete(link)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <TablePagination
                            component="div"
                            count={total}
                            page={page}
                            onPageChange={handlePageChange}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleRowsPerPageChange}
                            rowsPerPageOptions={[10, 25, 50, 100]}
                            labelRowsPerPage="Linhas por página:"
                            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                        />
                    </>
                )}
            </TableContainer>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {dialogMode === 'create' ? 'Nova Vinculação' : 'Editar Vinculação'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <TextField
                            label="ID Cliente Superbot"
                            type="number"
                            value={formData.superbot_customer_id}
                            onChange={(e) => setFormData({ ...formData, superbot_customer_id: e.target.value })}
                            fullWidth
                            required
                        />
                        <TextField
                            label="ID Cliente Leads"
                            type="number"
                            value={formData.leads_customer_id}
                            onChange={(e) => setFormData({ ...formData, leads_customer_id: e.target.value })}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Score de Confiança (%)"
                            type="number"
                            value={formData.confidence_score}
                            onChange={(e) => setFormData({ ...formData, confidence_score: Math.min(100, Math.max(0, e.target.value)) })}
                            fullWidth
                            inputProps={{ min: 0, max: 100 }}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.verified}
                                    onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                                    color="success"
                                />
                            }
                            label="Verificado manualmente"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving || !formData.superbot_customer_id || !formData.leads_customer_id}
                    >
                        {saving ? <CircularProgress size={20} /> : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <Typography>
                        Tem certeza que deseja excluir a vinculação #{linkToDelete?.id}?
                    </Typography>
                    {linkToDelete && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                            <Typography variant="body2">
                                <strong>Telefone:</strong> {linkToDelete.phone_number}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Cliente Leads:</strong> {linkToDelete.leads_customer_name}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDelete}
                        disabled={deleting}
                        startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
                    >
                        Excluir
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Auto-Link Dialog */}
            <Dialog open={autoLinkDialogOpen} onClose={() => setAutoLinkDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinkIcon color="secondary" />
                    Vinculação Automática por Telefone
                </DialogTitle>
                <DialogContent>
                    {autoLinkResult?.dryRun ? (
                        <>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <strong>{autoLinkResult.message}</strong>
                            </Alert>
                            {autoLinkResult.data && autoLinkResult.data.length > 0 ? (
                                <>
                                    <Typography variant="body2" sx={{ mb: 2 }}>
                                        Prévia das primeiras {Math.min(autoLinkResult.data.length, 100)} vinculações:
                                    </Typography>
                                    <TableContainer sx={{ maxHeight: 400 }}>
                                        <Table size="small" stickyHeader>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Telefone SuperBot</TableCell>
                                                    <TableCell>Nome SuperBot</TableCell>
                                                    <TableCell>→</TableCell>
                                                    <TableCell>Cliente Leads</TableCell>
                                                    <TableCell>CNPJ</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {autoLinkResult.data.slice(0, 50).map((item, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <WhatsAppIcon sx={{ color: '#25D366', fontSize: 16 }} />
                                                                {item.superbot_phone}
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>{item.superbot_name || item.push_name || '-'}</TableCell>
                                                        <TableCell><LinkIcon fontSize="small" /></TableCell>
                                                        <TableCell>{item.leads_customer_name}</TableCell>
                                                        <TableCell>
                                                            <Typography variant="caption" fontFamily="monospace">
                                                                {item.cnpj || '-'}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </>
                            ) : (
                                <Alert severity="warning">
                                    Nenhuma vinculação automática disponível. Todos os contatos já estão vinculados ou não há correspondência de telefone.
                                </Alert>
                            )}
                        </>
                    ) : autoLinkResult?.data ? (
                        <Alert severity={autoLinkResult.data.created > 0 ? 'success' : 'warning'} sx={{ mb: 2 }}>
                            <strong>Resultado:</strong><br />
                            • Candidatos encontrados: {autoLinkResult.data.candidates}<br />
                            • Vinculações criadas: {autoLinkResult.data.created}<br />
                            • Erros: {autoLinkResult.data.errors}
                        </Alert>
                    ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAutoLinkDialogOpen(false)}>Fechar</Button>
                    {autoLinkResult?.dryRun && autoLinkResult?.data?.length > 0 && (
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={handleAutoLinkExecute}
                            disabled={autoLinking}
                            startIcon={autoLinking ? <CircularProgress size={18} /> : <LinkIcon />}
                        >
                            {autoLinking ? 'Vinculando...' : `Vincular ${autoLinkResult.data.length} Contatos`}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default CustomerLinksPage
