/**
 * Logs Page - Admin
 * 
 * Visualização de logs de auditoria
 * 
 * @version 1.0
 * @date 2026-01-18
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    TextField,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Collapse,
    Tooltip,
} from '@mui/material'
import {
    ArrowBack as ArrowBackIcon,
    Refresh as RefreshIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    FilterList as FilterIcon,
    Info as InfoIcon,
    Person as PersonIcon,
    Event as EventIcon,
    Storage as StorageIcon,
    TrendingUp as TrendingIcon,
} from '@mui/icons-material'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import adminService from '../../services/admin.service'

// Cores por tipo de ação
const ACTION_COLORS = {
    LOGIN: 'success',
    LOGOUT: 'default',
    LOGIN_FAILED: 'error',
    LEAD_CREATE: 'primary',
    LEAD_UPDATE: 'info',
    LEAD_DELETE: 'error',
    LEAD_CONVERT: 'success',
    USER_CREATE: 'primary',
    USER_UPDATE: 'info',
    USER_DELETE: 'error',
    ORDER_CREATE: 'success',
    PASSWORD_CHANGE: 'warning',
}

const LogsPage = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [logs, setLogs] = useState([])
    const [stats, setStats] = useState(null)
    const [actions, setActions] = useState([])
    const [hasMore, setHasMore] = useState(false)
    const [page, setPage] = useState(1)

    // Filtros
    const [showFilters, setShowFilters] = useState(false)
    const [actionFilter, setActionFilter] = useState('')
    const [userIdFilter, setUserIdFilter] = useState('')
    const [resourceTypeFilter, setResourceTypeFilter] = useState('')

    // Detalhes expandidos
    const [expandedRow, setExpandedRow] = useState(null)
    const [detailDialog, setDetailDialog] = useState({ open: false, log: null })

    const loadLogs = useCallback(async (reset = false) => {
        try {
            setLoading(true)
            setError(null)

            const currentPage = reset ? 1 : page

            const params = {
                page: currentPage,
                limit: 50,
            }

            if (actionFilter) params.action = actionFilter
            if (userIdFilter) params.userId = userIdFilter
            if (resourceTypeFilter) params.resourceType = resourceTypeFilter

            const response = await adminService.getLogs(params)

            if (reset) {
                setLogs(response.data?.data || [])
                setPage(1)
            } else {
                setLogs(prev => [...prev, ...(response.data?.data || [])])
            }

            setHasMore(response.data?.pagination?.hasMore || false)
        } catch (err) {
            console.error('Erro ao carregar logs:', err)
            setError('Erro ao carregar logs de auditoria')
        } finally {
            setLoading(false)
        }
    }, [page, actionFilter, userIdFilter, resourceTypeFilter])

    const loadStats = async () => {
        try {
            const response = await adminService.getLogStats()
            setStats(response.data?.data)
        } catch (err) {
            console.error('Erro ao carregar estatísticas:', err)
        }
    }

    const loadActions = async () => {
        try {
            const response = await adminService.getLogActions()
            setActions(response.data?.data || [])
        } catch (err) {
            console.error('Erro ao carregar ações:', err)
        }
    }

    useEffect(() => {
        loadLogs(true)
        loadStats()
        loadActions()
    }, [])

    useEffect(() => {
        if (page > 1) {
            loadLogs()
        }
    }, [page])

    const handleFilter = () => {
        loadLogs(true)
    }

    const handleClearFilters = () => {
        setActionFilter('')
        setUserIdFilter('')
        setResourceTypeFilter('')
        loadLogs(true)
    }

    const handleLoadMore = () => {
        setPage(prev => prev + 1)
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '-'
        try {
            return format(parseISO(dateStr), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
        } catch {
            return dateStr
        }
    }

    const getActionColor = (action) => {
        return ACTION_COLORS[action] || 'default'
    }

    if (loading && logs.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => navigate('/admin')}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            📋 Logs de Auditoria
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Histórico de ações do sistema
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<FilterIcon />}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        Filtros
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={() => loadLogs(true)}
                    >
                        Atualizar
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Stats Cards */}
            {stats && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <StorageIcon color="primary" />
                                    <Typography color="text.secondary" variant="body2">
                                        Total de Logs
                                    </Typography>
                                </Box>
                                <Typography variant="h4" fontWeight="bold" color="primary">
                                    {parseInt(stats.summary?.total || 0).toLocaleString()}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PersonIcon color="success" />
                                    <Typography color="text.secondary" variant="body2">
                                        Usuários Únicos
                                    </Typography>
                                </Box>
                                <Typography variant="h4" fontWeight="bold" color="success.main">
                                    {stats.summary?.unique_users || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TrendingIcon color="info" />
                                    <Typography color="text.secondary" variant="body2">
                                        Tipos de Ação
                                    </Typography>
                                </Box>
                                <Typography variant="h4" fontWeight="bold" color="info.main">
                                    {stats.summary?.unique_actions || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <EventIcon color="warning" />
                                    <Typography color="text.secondary" variant="body2">
                                        Último Log
                                    </Typography>
                                </Box>
                                <Typography variant="body1" fontWeight="bold" color="warning.main">
                                    {stats.summary?.last_log ? formatDate(stats.summary.last_log) : '-'}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Filtros */}
            <Collapse in={showFilters}>
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Ação</InputLabel>
                                <Select
                                    value={actionFilter}
                                    onChange={(e) => setActionFilter(e.target.value)}
                                    label="Ação"
                                >
                                    <MenuItem value="">Todas</MenuItem>
                                    {actions.map(a => (
                                        <MenuItem key={a.value} value={a.value}>
                                            {a.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                size="small"
                                label="ID do Usuário"
                                value={userIdFilter}
                                onChange={(e) => setUserIdFilter(e.target.value)}
                                type="number"
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Tipo de Recurso</InputLabel>
                                <Select
                                    value={resourceTypeFilter}
                                    onChange={(e) => setResourceTypeFilter(e.target.value)}
                                    label="Tipo de Recurso"
                                >
                                    <MenuItem value="">Todos</MenuItem>
                                    <MenuItem value="auth">Autenticação</MenuItem>
                                    <MenuItem value="lead">Lead</MenuItem>
                                    <MenuItem value="order">Pedido</MenuItem>
                                    <MenuItem value="user">Usuário</MenuItem>
                                    <MenuItem value="system_event">Sistema</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button variant="contained" onClick={handleFilter}>
                                    Aplicar
                                </Button>
                                <Button variant="outlined" onClick={handleClearFilters}>
                                    Limpar
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Collapse>

            {/* Tabela de Logs */}
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                            <TableCell width={40}></TableCell>
                            <TableCell>Data/Hora</TableCell>
                            <TableCell>Ação</TableCell>
                            <TableCell>Usuário</TableCell>
                            <TableCell>Recurso</TableCell>
                            <TableCell>IP</TableCell>
                            <TableCell width={60}>Detalhes</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        Nenhum log encontrado
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log, index) => (
                                <React.Fragment key={log.id || index}>
                                    <TableRow
                                        hover
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                                    >
                                        <TableCell>
                                            <IconButton size="small">
                                                {expandedRow === log.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            </IconButton>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {formatDate(log.createdAt)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={log.action}
                                                color={getActionColor(log.action)}
                                                variant="filled"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {log.userName || `ID: ${log.userId || '-'}`}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {log.resourceType ? `${log.resourceType}${log.resourceId ? ` #${log.resourceId}` : ''}` : '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" color="text.secondary">
                                                {log.ipAddress || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title="Ver detalhes">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setDetailDialog({ open: true, log })
                                                    }}
                                                >
                                                    <InfoIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={7} sx={{ py: 0, border: 0 }}>
                                            <Collapse in={expandedRow === log.id}>
                                                <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                                                    <Grid container spacing={2}>
                                                        {log.oldValue && (
                                                            <Grid item xs={6}>
                                                                <Typography variant="caption" color="text.secondary" gutterBottom>
                                                                    Valor Anterior:
                                                                </Typography>
                                                                <Paper sx={{ p: 1, bgcolor: 'error.50' }}>
                                                                    <pre style={{ margin: 0, fontSize: '0.75rem', overflow: 'auto' }}>
                                                                        {JSON.stringify(log.oldValue, null, 2)}
                                                                    </pre>
                                                                </Paper>
                                                            </Grid>
                                                        )}
                                                        {log.newValue && (
                                                            <Grid item xs={6}>
                                                                <Typography variant="caption" color="text.secondary" gutterBottom>
                                                                    Valor Novo:
                                                                </Typography>
                                                                <Paper sx={{ p: 1, bgcolor: 'success.50' }}>
                                                                    <pre style={{ margin: 0, fontSize: '0.75rem', overflow: 'auto' }}>
                                                                        {JSON.stringify(log.newValue, null, 2)}
                                                                    </pre>
                                                                </Paper>
                                                            </Grid>
                                                        )}
                                                        {log.metadata && (
                                                            <Grid item xs={12}>
                                                                <Typography variant="caption" color="text.secondary" gutterBottom>
                                                                    Metadados:
                                                                </Typography>
                                                                <Paper sx={{ p: 1, bgcolor: 'info.50' }}>
                                                                    <pre style={{ margin: 0, fontSize: '0.75rem', overflow: 'auto' }}>
                                                                        {JSON.stringify(log.metadata, null, 2)}
                                                                    </pre>
                                                                </Paper>
                                                            </Grid>
                                                        )}
                                                        {log.userAgent && (
                                                            <Grid item xs={12}>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    User Agent: {log.userAgent}
                                                                </Typography>
                                                            </Grid>
                                                        )}
                                                    </Grid>
                                                </Box>
                                            </Collapse>
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Load More */}
            {hasMore && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={handleLoadMore}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={20} /> : 'Carregar mais'}
                    </Button>
                </Box>
            )}

            {/* Dialog de Detalhes */}
            <Dialog
                open={detailDialog.open}
                onClose={() => setDetailDialog({ open: false, log: null })}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Detalhes do Log #{detailDialog.log?.id}
                </DialogTitle>
                <DialogContent dividers>
                    {detailDialog.log && (
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Ação</Typography>
                                <Typography variant="body1">
                                    <Chip
                                        size="small"
                                        label={detailDialog.log.action}
                                        color={getActionColor(detailDialog.log.action)}
                                    />
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Data/Hora</Typography>
                                <Typography variant="body1">{formatDate(detailDialog.log.createdAt)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Usuário</Typography>
                                <Typography variant="body1">
                                    {detailDialog.log.userName || '-'} (ID: {detailDialog.log.userId || '-'})
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Recurso</Typography>
                                <Typography variant="body1">
                                    {detailDialog.log.resourceType} {detailDialog.log.resourceId ? `#${detailDialog.log.resourceId}` : ''}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">IP</Typography>
                                <Typography variant="body1">{detailDialog.log.ipAddress || '-'}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary">User Agent</Typography>
                                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                    {detailDialog.log.userAgent || '-'}
                                </Typography>
                            </Grid>
                            {detailDialog.log.oldValue && (
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">Valor Anterior</Typography>
                                    <Paper sx={{ p: 1, bgcolor: 'grey.100', mt: 0.5 }}>
                                        <pre style={{ margin: 0, fontSize: '0.8rem', overflow: 'auto' }}>
                                            {JSON.stringify(detailDialog.log.oldValue, null, 2)}
                                        </pre>
                                    </Paper>
                                </Grid>
                            )}
                            {detailDialog.log.newValue && (
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">Valor Novo</Typography>
                                    <Paper sx={{ p: 1, bgcolor: 'grey.100', mt: 0.5 }}>
                                        <pre style={{ margin: 0, fontSize: '0.8rem', overflow: 'auto' }}>
                                            {JSON.stringify(detailDialog.log.newValue, null, 2)}
                                        </pre>
                                    </Paper>
                                </Grid>
                            )}
                            {detailDialog.log.metadata && (
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">Metadados</Typography>
                                    <Paper sx={{ p: 1, bgcolor: 'grey.100', mt: 0.5 }}>
                                        <pre style={{ margin: 0, fontSize: '0.8rem', overflow: 'auto' }}>
                                            {JSON.stringify(detailDialog.log.metadata, null, 2)}
                                        </pre>
                                    </Paper>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailDialog({ open: false, log: null })}>
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default LogsPage
