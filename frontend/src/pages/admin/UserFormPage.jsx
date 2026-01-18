/**
 * User Form Page - Admin
 * 
 * Formulário para criar/editar usuários
 * 
 * @version 1.0
 * @date 2026-01-18
 */

import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Alert,
    CircularProgress,
    Divider,
    IconButton,
    Chip,
} from '@mui/material'
import {
    ArrowBack as ArrowBackIcon,
    Save as SaveIcon,
    Person as PersonIcon,
} from '@mui/icons-material'
import adminService from '../../services/admin.service'

const LEVEL_OPTIONS = [
    { value: 1, label: 'Vendedor Júnior', description: 'Acesso básico, leads próprios' },
    { value: 2, label: 'Vendedor Pleno', description: 'Acesso básico, leads próprios' },
    { value: 3, label: 'Vendedor Sênior', description: 'Leads próprios + equipe' },
    { value: 4, label: 'Supervisor', description: 'Todos leads, analytics básico' },
    { value: 5, label: 'Gerente', description: 'Acesso completo + admin básico' },
    { value: 6, label: 'Administrador', description: 'Acesso total ao sistema' },
]

const UserFormPage = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEditing = Boolean(id)

    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [departments, setDepartments] = useState([])

    const [formData, setFormData] = useState({
        user: '',
        nick: '',
        email: '',
        password: '',
        level: 1,
        depto: '',
        segmento: '',
        active: true,
    })

    const [phones, setPhones] = useState([])

    // Carregar usuário se editando
    useEffect(() => {
        if (isEditing) {
            loadUser()
        }
        loadDepartments()
    }, [id])

    const loadUser = async () => {
        try {
            setLoading(true)
            const response = await adminService.getUserById(id)
            const user = response.data?.data

            if (user) {
                setFormData({
                    user: user.user || '',
                    nick: user.nick || '',
                    email: user.email || '',
                    password: '', // Não preencher senha
                    level: user.level || 1,
                    depto: user.depto || '',
                    segmento: user.segmento || '',
                    active: Boolean(user.active),
                })
                setPhones(user.phones || [])
            }
        } catch (err) {
            setError('Erro ao carregar usuário')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const loadDepartments = async () => {
        try {
            const response = await adminService.getDepartments()
            setDepartments(response.data?.data || [])
        } catch (err) {
            console.error('Erro ao carregar departamentos:', err)
        }
    }

    const handleChange = (field) => (event) => {
        const value = event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value

        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        // Validações
        if (!formData.user || !formData.nick) {
            setError('Usuário e nome são obrigatórios')
            return
        }

        if (!isEditing && !formData.password) {
            setError('Senha é obrigatória para novos usuários')
            return
        }

        try {
            setSaving(true)

            if (isEditing) {
                await adminService.updateUser(id, {
                    nick: formData.nick,
                    email: formData.email,
                    level: formData.level,
                    depto: formData.depto,
                    segmento: formData.segmento,
                    active: formData.active,
                })
                setSuccess('Usuário atualizado com sucesso!')
            } else {
                await adminService.createUser(formData)
                setSuccess('Usuário criado com sucesso!')
                // Limpar formulário
                setFormData({
                    user: '',
                    nick: '',
                    email: '',
                    password: '',
                    level: 1,
                    depto: '',
                    segmento: '',
                    active: true,
                })
            }

            // Redirecionar após 1.5s
            setTimeout(() => {
                navigate('/admin/users')
            }, 1500)
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao salvar usuário')
        } finally {
            setSaving(false)
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
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={() => navigate('/admin/users')}>
                    <ArrowBackIcon />
                </IconButton>
                <Box>
                    <Typography variant="h5" fontWeight="bold">
                        {isEditing ? '✏️ Editar Usuário' : '➕ Novo Usuário'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {isEditing ? `Editando: ${formData.nick}` : 'Preencha os dados do novo usuário'}
                    </Typography>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <Paper sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                        {/* Dados de Acesso */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                🔐 Dados de Acesso
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Login (username)"
                                value={formData.user}
                                onChange={handleChange('user')}
                                disabled={isEditing}
                                required
                                helperText={isEditing ? 'Não pode ser alterado' : ''}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange('email')}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label={isEditing ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                                type="password"
                                value={formData.password}
                                onChange={handleChange('password')}
                                required={!isEditing}
                                helperText="Mínimo 6 caracteres"
                            />
                        </Grid>

                        {/* Dados Pessoais */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                                👤 Dados Pessoais
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Nome de Exibição"
                                value={formData.nick}
                                onChange={handleChange('nick')}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Departamento</InputLabel>
                                <Select
                                    value={formData.depto}
                                    onChange={handleChange('depto')}
                                    label="Departamento"
                                >
                                    <MenuItem value="">Nenhum</MenuItem>
                                    {departments.map(d => (
                                        <MenuItem key={d} value={d}>{d}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Segmento"
                                value={formData.segmento}
                                onChange={handleChange('segmento')}
                            />
                        </Grid>

                        {/* Permissões */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                                🔒 Permissões
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Nível de Acesso</InputLabel>
                                <Select
                                    value={formData.level}
                                    onChange={handleChange('level')}
                                    label="Nível de Acesso"
                                >
                                    {LEVEL_OPTIONS.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                            <Box>
                                                <Typography variant="body2">
                                                    Level {option.value} - {option.label}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {option.description}
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.active}
                                        onChange={handleChange('active')}
                                        color="primary"
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="body2">
                                            Usuário Ativo
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Usuários inativos não podem fazer login
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Grid>

                        {/* Telefones (apenas visualização) */}
                        {isEditing && phones.length > 0 && (
                            <>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                                        📞 Telefones Vinculados
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {phones.map((phone, index) => (
                                            <Chip
                                                key={index}
                                                label={phone.phone_number}
                                                variant={phone.is_primary ? 'filled' : 'outlined'}
                                                color={phone.is_primary ? 'primary' : 'default'}
                                            />
                                        ))}
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                        Para gerenciar telefones, use a página de Vinculação de Telefones
                                    </Typography>
                                </Grid>
                            </>
                        )}

                        {/* Ações */}
                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/admin/users')}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                                    disabled={saving}
                                >
                                    {isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </form>
        </Box>
    )
}

export default UserFormPage
