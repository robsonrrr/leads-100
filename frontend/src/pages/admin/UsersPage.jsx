/**
 * Users Page - Admin
 * 
 * Listagem e gestão de usuários
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
    InputAdornment,
    Chip,
    Avatar,
    Tooltip,
    Menu,
    MenuItem,
    ListItemIcon,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    Grid,
} from '@mui/material'
import { DataGrid, ptBR } from '@mui/x-data-grid'
import {
    Search as SearchIcon,
    Add as AddIcon,
    Edit as EditIcon,
    MoreVert as MoreVertIcon,
    Person as PersonIcon,
    Block as BlockIcon,
    CheckCircle as CheckCircleIcon,
    Key as KeyIcon,
    History as HistoryIcon,
    Phone as PhoneIcon,
    Refresh as RefreshIcon,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material'
import adminService from '../../services/admin.service'

// Cores por nível
const LEVEL_COLORS = {
    1: 'default',
    2: 'default',
    3: 'info',
    4: 'warning',
    5: 'primary',
    6: 'secondary',
}

const LEVEL_LABELS = {
    1: 'Vendedor Jr',
    2: 'Vendedor',
    3: 'Vendedor Sr',
    4: 'Supervisor',
    5: 'Gerente',
    6: 'Admin',
}

const UsersPage = () => {
    const navigate = useNavigate()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [search, setSearch] = useState('')
    const [levelFilter, setLevelFilter] = useState('')
    const [activeFilter, setActiveFilter] = useState('')
    const [deptoFilter, setDeptoFilter] = useState('')
    const [departments, setDepartments] = useState([])
    const [pagination, setPagination] = useState({
        page: 0,
        pageSize: 20,
        total: 0,
    })

    // Menu de ações
    const [anchorEl, setAnchorEl] = useState(null)
    const [selectedUser, setSelectedUser] = useState(null)

    // Dialog de senha
    const [passwordDialog, setPasswordDialog] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [passwordLoading, setPasswordLoading] = useState(false)

    // Dialog de confirmação
    const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null })

    // Carregar usuários
    const loadUsers = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const params = {
                page: pagination.page + 1,
                limit: pagination.pageSize,
                orderBy: 'nick',
                orderDir: 'ASC',
            }

            if (search) params.search = search
            if (levelFilter) params.level = levelFilter
            if (activeFilter !== '') params.active = activeFilter
            if (deptoFilter) params.depto = deptoFilter

            const response = await adminService.getUsers(params)

            setUsers(response.data?.data || [])
            setPagination(prev => ({
                ...prev,
                total: response.data?.pagination?.total || 0,
            }))
        } catch (err) {
            console.error('Erro ao carregar usuários:', err)
            setError('Erro ao carregar usuários')
        } finally {
            setLoading(false)
        }
    }, [pagination.page, pagination.pageSize, search, levelFilter, activeFilter, deptoFilter])

    // Carregar departamentos
    const loadDepartments = async () => {
        try {
            const response = await adminService.getDepartments()
            setDepartments(response.data?.data || [])
        } catch (err) {
            console.error('Erro ao carregar departamentos:', err)
        }
    }

    useEffect(() => {
        loadUsers()
    }, [loadUsers])

    useEffect(() => {
        loadDepartments()
    }, [])

    // Handlers
    const handleMenuOpen = (event, user) => {
        setAnchorEl(event.currentTarget)
        setSelectedUser(user)
    }

    const handleMenuClose = () => {
        setAnchorEl(null)
    }

    const handleEdit = () => {
        navigate(`/admin/users/${selectedUser.id}/edit`)
        handleMenuClose()
    }

    const handleToggleActive = async () => {
        handleMenuClose()
        setConfirmDialog({
            open: true,
            action: selectedUser.active ? 'deactivate' : 'activate',
            title: selectedUser.active ? 'Desativar usuário' : 'Reativar usuário',
            message: selectedUser.active
                ? `Tem certeza que deseja desativar o usuário ${selectedUser.nick}?`
                : `Tem certeza que deseja reativar o usuário ${selectedUser.nick}?`,
        })
    }

    const handleConfirmAction = async () => {
        try {
            if (confirmDialog.action === 'deactivate') {
                await adminService.deactivateUser(selectedUser.id)
            } else {
                await adminService.activateUser(selectedUser.id)
            }
            loadUsers()
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao executar ação')
        } finally {
            setConfirmDialog({ open: false })
        }
    }

    const handleResetPassword = () => {
        handleMenuClose()
        setNewPassword('')
        setPasswordDialog(true)
    }

    const handleSavePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres')
            return
        }

        try {
            setPasswordLoading(true)
            await adminService.updatePassword(selectedUser.id, newPassword)
            setPasswordDialog(false)
            setNewPassword('')
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao alterar senha')
        } finally {
            setPasswordLoading(false)
        }
    }

    // Colunas do DataGrid
    const columns = [
        {
            field: 'nick',
            headerName: 'Nome',
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: params.row.active ? 'primary.main' : 'grey.400' }}>
                        {params.row.nick?.charAt(0)?.toUpperCase() || '?'}
                    </Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight="medium">
                            {params.row.nick}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {params.row.user}
                        </Typography>
                    </Box>
                </Box>
            ),
        },
        {
            field: 'email',
            headerName: 'Email',
            flex: 1,
            minWidth: 180,
        },
        {
            field: 'level',
            headerName: 'Nível',
            width: 120,
            renderCell: (params) => (
                <Chip
                    size="small"
                    label={LEVEL_LABELS[params.value] || params.value}
                    color={LEVEL_COLORS[params.value] || 'default'}
                />
            ),
        },
        {
            field: 'depto',
            headerName: 'Depto',
            width: 100,
        },
        {
            field: 'active',
            headerName: 'Status',
            width: 100,
            renderCell: (params) => (
                <Chip
                    size="small"
                    icon={params.value ? <CheckCircleIcon /> : <BlockIcon />}
                    label={params.value ? 'Ativo' : 'Inativo'}
                    color={params.value ? 'success' : 'default'}
                    variant={params.value ? 'filled' : 'outlined'}
                />
            ),
        },
        {
            field: 'phones',
            headerName: 'Telefones',
            width: 120,
            renderCell: (params) => {
                const phones = params.value || []
                return phones.length > 0 ? (
                    <Tooltip title={phones.join(', ')}>
                        <Chip
                            size="small"
                            icon={<PhoneIcon />}
                            label={phones.length}
                            variant="outlined"
                        />
                    </Tooltip>
                ) : (
                    <Typography variant="caption" color="text.secondary">
                        -
                    </Typography>
                )
            },
        },
        {
            field: 'leads_count',
            headerName: 'Leads',
            width: 80,
            align: 'center',
        },
        {
            field: 'actions',
            headerName: 'Ações',
            width: 80,
            sortable: false,
            renderCell: (params) => (
                <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, params.row)}
                >
                    <MoreVertIcon />
                </IconButton>
            ),
        },
    ]

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
                            👥 Gestão de Usuários
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {pagination.total} usuários cadastrados
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={loadUsers}
                    >
                        Atualizar
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/admin/users/new')}
                    >
                        Novo Usuário
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Filtros */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Buscar por nome, email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Nível</InputLabel>
                            <Select
                                value={levelFilter}
                                onChange={(e) => setLevelFilter(e.target.value)}
                                label="Nível"
                            >
                                <MenuItem value="">Todos</MenuItem>
                                {[1, 2, 3, 4, 5, 6].map(level => (
                                    <MenuItem key={level} value={level}>
                                        {LEVEL_LABELS[level]}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={activeFilter}
                                onChange={(e) => setActiveFilter(e.target.value)}
                                label="Status"
                            >
                                <MenuItem value="">Todos</MenuItem>
                                <MenuItem value="true">Ativos</MenuItem>
                                <MenuItem value="false">Inativos</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Departamento</InputLabel>
                            <Select
                                value={deptoFilter}
                                onChange={(e) => setDeptoFilter(e.target.value)}
                                label="Departamento"
                            >
                                <MenuItem value="">Todos</MenuItem>
                                {departments.map(d => (
                                    <MenuItem key={d} value={d}>{d}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {/* DataGrid */}
            <Paper sx={{ height: 'calc(100vh - 320px)' }}>
                <DataGrid
                    rows={users}
                    columns={columns}
                    loading={loading}
                    paginationMode="server"
                    rowCount={pagination.total}
                    pageSizeOptions={[10, 20, 50]}
                    paginationModel={{
                        page: pagination.page,
                        pageSize: pagination.pageSize,
                    }}
                    onPaginationModelChange={(model) => {
                        setPagination(prev => ({
                            ...prev,
                            page: model.page,
                            pageSize: model.pageSize,
                        }))
                    }}
                    disableRowSelectionOnClick
                    localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
                    sx={{
                        '& .MuiDataGrid-cell': {
                            py: 1,
                        },
                    }}
                />
            </Paper>

            {/* Menu de ações */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleEdit}>
                    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                    Editar
                </MenuItem>
                <MenuItem onClick={handleResetPassword}>
                    <ListItemIcon><KeyIcon fontSize="small" /></ListItemIcon>
                    Alterar Senha
                </MenuItem>
                <MenuItem onClick={handleToggleActive}>
                    <ListItemIcon>
                        {selectedUser?.active ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                    </ListItemIcon>
                    {selectedUser?.active ? 'Desativar' : 'Reativar'}
                </MenuItem>
            </Menu>

            {/* Dialog de senha */}
            <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)}>
                <DialogTitle>Alterar Senha - {selectedUser?.nick}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        margin="dense"
                        label="Nova Senha"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        helperText="Mínimo 6 caracteres"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPasswordDialog(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={handleSavePassword}
                        disabled={passwordLoading}
                    >
                        {passwordLoading ? <CircularProgress size={20} /> : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de confirmação */}
            <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false })}>
                <DialogTitle>{confirmDialog.title}</DialogTitle>
                <DialogContent>
                    <Typography>{confirmDialog.message}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog({ open: false })}>Cancelar</Button>
                    <Button variant="contained" color="error" onClick={handleConfirmAction}>
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default UsersPage
