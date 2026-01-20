/**
 * Daily Goals Admin Page
 * 
 * Página para gerenciar metas diárias de leads por vendedor
 * 
 * @version 1.0
 * @date 2026-01-20
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
    TextField,
    Button,
    IconButton,
    CircularProgress,
    Alert,
    Chip,
    LinearProgress,
    Tooltip,
    Snackbar,
} from '@mui/material'
import {
    ArrowBack as BackIcon,
    Save as SaveIcon,
    Edit as EditIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material'
import adminService from '../../services/admin.service'
import { userService } from '../../services/api'

const DailyGoalsPage = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [users, setUsers] = useState([])
    const [editingUserId, setEditingUserId] = useState(null)
    const [editValue, setEditValue] = useState(50)

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        try {
            setLoading(true)
            setError(null)

            // Buscar vendedores do departamento VENDAS (level 1-2)
            // Filtros aplicados diretamente na API para performance
            const response = await adminService.getUsers({
                depto: 'VENDAS',
                limit: 500  // Buscar todos
            })
            const allUsers = response.data?.data || []

            // Filtrar apenas level > 0 e < 3 (level 1 e 2)
            const sellers = allUsers.filter(u =>
                u.level > 0 &&
                u.level < 3 &&
                u.id !== 1
            )

            // Para cada vendedor, buscar sua meta atual
            const usersWithGoals = await Promise.all(
                sellers.map(async (user) => {
                    try {
                        // Buscar preferências do usuário
                        const prefsResponse = await adminService.getUserPreferences(user.id)
                        const prefs = prefsResponse.data?.data || {}
                        return {
                            ...user,
                            daily_lead_goal: prefs.daily_lead_goal || 50,
                        }
                    } catch {
                        return {
                            ...user,
                            daily_lead_goal: 50,
                        }
                    }
                })
            )

            setUsers(usersWithGoals)
        } catch (err) {
            console.error('Erro ao carregar usuários:', err)
            setError('Não foi possível carregar a lista de vendedores')
        } finally {
            setLoading(false)
        }
    }

    const handleStartEdit = (user) => {
        setEditingUserId(user.id)
        setEditValue(user.daily_lead_goal || 50)
    }

    const handleCancelEdit = () => {
        setEditingUserId(null)
        setEditValue(50)
    }

    const handleSaveGoal = async (userId) => {
        if (editValue < 1 || editValue > 500) {
            setError('A meta deve estar entre 1 e 500')
            return
        }

        try {
            setSaving(true)
            await adminService.updateUserDailyGoal(userId, editValue)

            // Atualizar na lista local
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, daily_lead_goal: editValue } : u
            ))

            setEditingUserId(null)
            setSuccess('Meta atualizada com sucesso!')
        } catch (err) {
            console.error('Erro ao salvar meta:', err)
            setError('Não foi possível salvar a meta')
        } finally {
            setSaving(false)
        }
    }

    const handleKeyDown = (e, userId) => {
        if (e.key === 'Enter') {
            handleSaveGoal(userId)
        } else if (e.key === 'Escape') {
            handleCancelEdit()
        }
    }

    if (loading) {
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
                        <BackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            🎯 Metas Diárias de Leads
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Configure quantos leads cada vendedor deve criar por dia
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadUsers}
                >
                    Atualizar
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Info Box */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.light' }}>
                <Typography variant="body2">
                    <strong>ℹ️ Como funciona:</strong> A meta diária é exibida no header da aplicação para cada vendedor
                    como um badge (ex: "12/50"). O vendedor também pode ajustar sua própria meta clicando no badge.
                </Typography>
            </Paper>

            {/* Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Vendedor</TableCell>
                            <TableCell>Nível</TableCell>
                            <TableCell align="center">Meta Diária</TableCell>
                            <TableCell align="center">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    <Typography color="text.secondary">
                                        Nenhum vendedor encontrado
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <Box>
                                            <Typography fontWeight="medium">
                                                {user.nick || user.username}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                ID: {user.id}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={`Level ${user.level}`}
                                            size="small"
                                            color={user.level >= 5 ? 'primary' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        {editingUserId === user.id ? (
                                            <TextField
                                                type="number"
                                                size="small"
                                                value={editValue}
                                                onChange={(e) => setEditValue(parseInt(e.target.value) || 1)}
                                                onKeyDown={(e) => handleKeyDown(e, user.id)}
                                                inputProps={{ min: 1, max: 500, style: { width: 80, textAlign: 'center' } }}
                                                autoFocus
                                                disabled={saving}
                                            />
                                        ) : (
                                            <Chip
                                                label={`${user.daily_lead_goal} leads/dia`}
                                                color="warning"
                                                variant="outlined"
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        {editingUserId === user.id ? (
                                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                <Tooltip title="Salvar">
                                                    <IconButton
                                                        size="small"
                                                        color="success"
                                                        onClick={() => handleSaveGoal(user.id)}
                                                        disabled={saving}
                                                    >
                                                        {saving ? <CircularProgress size={20} /> : <CheckIcon />}
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Cancelar">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={handleCancelEdit}
                                                        disabled={saving}
                                                    >
                                                        <CloseIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        ) : (
                                            <Tooltip title="Editar meta">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleStartEdit(user)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Success Snackbar */}
            <Snackbar
                open={!!success}
                autoHideDuration={3000}
                onClose={() => setSuccess(null)}
                message={success}
            />
        </Box>
    )
}

export default DailyGoalsPage
