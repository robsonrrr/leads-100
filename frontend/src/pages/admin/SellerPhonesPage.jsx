/**
 * Seller Phones Page - Admin
 * 
 * Gerenciamento de vinculação vendedor ↔ telefone
 * 
 * @version 1.0
 * @date 2026-01-18
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Chip,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    Autocomplete,
    FormControlLabel,
    Checkbox,
    Grid,
    Card,
    CardContent,
} from '@mui/material'
import {
    ArrowBack as ArrowBackIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Phone as PhoneIcon,
    Person as PersonIcon,
    Refresh as RefreshIcon,
    Star as StarIcon,
} from '@mui/icons-material'
import adminService from '../../services/admin.service'

const SellerPhonesPage = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)

    const [sellerPhones, setSellerPhones] = useState([])
    const [users, setUsers] = useState([])

    // Dialog de adicionar
    const [addDialog, setAddDialog] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [phoneNumber, setPhoneNumber] = useState('')
    const [isPrimary, setIsPrimary] = useState(false)
    const [saving, setSaving] = useState(false)

    // Dialog de confirmar remoção
    const [removeDialog, setRemoveDialog] = useState({ open: false, data: null })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            setError(null)

            const [phonesRes, usersRes] = await Promise.all([
                adminService.getSellerPhones(),
                adminService.getUsers({ limit: 500, active: true }),
            ])

            setSellerPhones(phonesRes.data?.data || [])
            setUsers(usersRes.data?.data || [])
        } catch (err) {
            console.error('Erro ao carregar dados:', err)
            setError('Erro ao carregar dados')
        } finally {
            setLoading(false)
        }
    }

    // Agrupar telefones por vendedor
    const groupedByUser = sellerPhones.reduce((acc, item) => {
        const userId = item.user_id
        if (!acc[userId]) {
            acc[userId] = {
                user_id: userId,
                seller_name: item.seller_name || 'Sem nome',
                seller_email: item.seller_email,
                phones: [],
            }
        }
        acc[userId].phones.push({
            phone_number: item.phone_number,
            is_primary: item.is_primary,
            created_at: item.created_at,
        })
        return acc
    }, {})

    const sellers = Object.values(groupedByUser)

    // Handlers
    const handleOpenAdd = () => {
        setSelectedUser(null)
        setPhoneNumber('')
        setIsPrimary(false)
        setAddDialog(true)
    }

    const handleAdd = async () => {
        if (!selectedUser || !phoneNumber) {
            setError('Selecione um vendedor e informe o telefone')
            return
        }

        // Normalizar telefone (remover caracteres não numéricos)
        const normalizedPhone = phoneNumber.replace(/\D/g, '')

        if (normalizedPhone.length < 10) {
            setError('Telefone inválido')
            return
        }

        try {
            setSaving(true)
            await adminService.addSellerPhone(selectedUser.id, normalizedPhone, isPrimary)
            setSuccess('Telefone vinculado com sucesso!')
            setAddDialog(false)
            loadData()
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao vincular telefone')
        } finally {
            setSaving(false)
        }
    }

    const handleRemove = async () => {
        const { userId, phoneNumber } = removeDialog.data

        try {
            await adminService.removeSellerPhone(userId, phoneNumber)
            setSuccess('Telefone removido com sucesso!')
            setRemoveDialog({ open: false, data: null })
            loadData()
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao remover telefone')
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
                        <ArrowBackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            📞 Vinculação de Telefones
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Associar números WhatsApp a vendedores ({sellerPhones.length} vinculações)
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={loadData}
                    >
                        Atualizar
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenAdd}
                    >
                        Vincular Telefone
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" variant="body2">
                                Vendedores com Telefone
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="primary">
                                {sellers.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" variant="body2">
                                Total de Telefones
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="success.main">
                                {sellerPhones.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" variant="body2">
                                Vendedores Cadastrados
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="info.main">
                                {users.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Lista de vendedores e telefones */}
            <Paper>
                {sellers.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <PhoneIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography color="text.secondary">
                            Nenhum telefone vinculado ainda
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            sx={{ mt: 2 }}
                            onClick={handleOpenAdd}
                        >
                            Vincular Primeiro Telefone
                        </Button>
                    </Box>
                ) : (
                    <List>
                        {sellers.map((seller, index) => (
                            <React.Fragment key={seller.user_id}>
                                <ListItem alignItems="flex-start">
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                                            {seller.seller_name?.charAt(0)?.toUpperCase() || '?'}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography variant="subtitle1" fontWeight="medium">
                                                {seller.seller_name}
                                            </Typography>
                                        }
                                        secondary={
                                            <Box sx={{ mt: 1 }}>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    {seller.seller_email || `ID: ${seller.user_id}`}
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                                    {seller.phones.map((phone, phoneIdx) => (
                                                        <Chip
                                                            key={phoneIdx}
                                                            icon={phone.is_primary ? <StarIcon /> : <PhoneIcon />}
                                                            label={phone.phone_number}
                                                            color={phone.is_primary ? 'primary' : 'default'}
                                                            variant={phone.is_primary ? 'filled' : 'outlined'}
                                                            onDelete={() => setRemoveDialog({
                                                                open: true,
                                                                data: {
                                                                    userId: seller.user_id,
                                                                    phoneNumber: phone.phone_number,
                                                                    nick: seller.seller_name,
                                                                },
                                                            })}
                                                            deleteIcon={<DeleteIcon />}
                                                        />
                                                    ))}
                                                </Box>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                {index < sellers.length - 1 && <Divider variant="inset" component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Paper>

            {/* Dialog de adicionar */}
            <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Vincular Telefone a Vendedor</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Autocomplete
                            options={users}
                            getOptionLabel={(option) => `${option.nick} (@${option.user})`}
                            value={selectedUser}
                            onChange={(_, newValue) => setSelectedUser(newValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Vendedor"
                                    placeholder="Buscar vendedor..."
                                />
                            )}
                            renderOption={(props, option) => (
                                <li {...props}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                                            {option.nick?.charAt(0)?.toUpperCase()}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2">{option.nick}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                @{option.user} • Level {option.level}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </li>
                            )}
                        />

                        <TextField
                            fullWidth
                            label="Número do Telefone"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="5511999999999"
                            helperText="Formato: código do país + DDD + número (apenas números)"
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={isPrimary}
                                    onChange={(e) => setIsPrimary(e.target.checked)}
                                />
                            }
                            label="Definir como telefone principal"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddDialog(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={handleAdd}
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={20} /> : <AddIcon />}
                    >
                        Vincular
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de confirmação de remoção */}
            <Dialog open={removeDialog.open} onClose={() => setRemoveDialog({ open: false, data: null })}>
                <DialogTitle>Remover Vinculação</DialogTitle>
                <DialogContent>
                    <Typography>
                        Tem certeza que deseja remover o telefone{' '}
                        <strong>{removeDialog.data?.phoneNumber}</strong>{' '}
                        do vendedor <strong>{removeDialog.data?.nick}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRemoveDialog({ open: false, data: null })}>
                        Cancelar
                    </Button>
                    <Button variant="contained" color="error" onClick={handleRemove}>
                        Remover
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default SellerPhonesPage
