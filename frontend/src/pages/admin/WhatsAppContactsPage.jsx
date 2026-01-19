/**
 * WhatsApp Contacts Page
 * 
 * Lista contatos do SuperBot para vinculação manual com clientes
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
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Alert,
    CircularProgress,
    InputAdornment,
    Grid,
    Card,
    CardContent,
    Autocomplete,
    Divider,
} from '@mui/material'
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Link as LinkIcon,
    WhatsApp as WhatsAppIcon,
    Person as PersonIcon,
    Check as CheckIcon,
    Business as BusinessIcon,
} from '@mui/icons-material'
import { adminService } from '../../services/admin.service'

const WhatsAppContactsPage = () => {
    // State
    const [contacts, setContacts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(25)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState('')
    const [stats, setStats] = useState(null)

    // Link dialog
    const [linkDialogOpen, setLinkDialogOpen] = useState(false)
    const [selectedContact, setSelectedContact] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searching, setSearching] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [linking, setLinking] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    // Load unlinked contacts
    const loadContacts = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await adminService.getUnlinkedSuperbotCustomers({
                page: page + 1,
                limit: rowsPerPage,
                search: search || undefined
            })
            setContacts(response.data?.data || [])
            setTotal(response.data?.pagination?.total || 0)
        } catch (err) {
            console.error('Erro ao carregar contatos:', err)
            setError('Erro ao carregar contatos do WhatsApp')
        } finally {
            setLoading(false)
        }
    }, [page, rowsPerPage, search])

    const loadStats = useCallback(async () => {
        try {
            const response = await adminService.getCustomerLinksStats()
            setStats(response.data?.data)
        } catch (err) {
            console.error('Erro ao carregar stats:', err)
        }
    }, [])

    useEffect(() => {
        loadContacts()
        loadStats()
    }, [loadContacts, loadStats])

    // Search customers
    const handleSearchCustomers = async (query) => {
        if (!query || query.length < 2) {
            setSearchResults([])
            return
        }

        setSearching(true)
        try {
            const response = await adminService.searchLeadsCustomers(query, 20)
            setSearchResults(response.data?.data || [])
        } catch (err) {
            console.error('Erro ao buscar clientes:', err)
        } finally {
            setSearching(false)
        }
    }

    // Link contact
    const handleLink = async () => {
        if (!selectedContact || !selectedCustomer) return

        setLinking(true)
        try {
            await adminService.createCustomerLink({
                superbot_customer_id: selectedContact.id,
                leads_customer_id: selectedCustomer.id,
                confidence_score: 100,
                verified: true
            })
            setSuccessMessage(`Contato ${selectedContact.phone_number} vinculado a ${selectedCustomer.nome}`)
            setLinkDialogOpen(false)
            setSelectedContact(null)
            setSelectedCustomer(null)
            setSearchResults([])
            setSearchQuery('')
            loadContacts()
            loadStats()
        } catch (err) {
            console.error('Erro ao vincular:', err)
            setError(err.response?.data?.error || 'Erro ao criar vinculação')
        } finally {
            setLinking(false)
        }
    }

    // Handlers
    const handlePageChange = (event, newPage) => {
        setPage(newPage)
    }

    const handleRowsPerPageChange = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10))
        setPage(0)
    }

    const handleOpenLink = (contact) => {
        setSelectedContact(contact)
        setSelectedCustomer(null)
        setSearchResults([])
        setSearchQuery('')
        setLinkDialogOpen(true)
    }

    const formatPhone = (phone) => {
        if (!phone) return '-'
        // Format: +55 11 99999-9999
        const clean = phone.replace(/\D/g, '')
        if (clean.length === 13) {
            return `+${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 9)}-${clean.slice(9)}`
        }
        return phone
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <WhatsAppIcon sx={{ fontSize: 32, color: '#25D366' }} />
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            Contatos WhatsApp
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Vincular contatos do WhatsApp a clientes do sistema
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => { loadContacts(); loadStats(); }}
                >
                    Atualizar
                </Button>
            </Box>

            {/* Success Message */}
            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
                    {successMessage}
                </Alert>
            )}

            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography color="text.secondary" variant="caption">
                                        Não Vinculados
                                    </Typography>
                                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                                        {total}
                                    </Typography>
                                </Box>
                                <WhatsAppIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.5 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography color="text.secondary" variant="caption">
                                        Já Vinculados
                                    </Typography>
                                    <Typography variant="h4" fontWeight="bold" color="success.main">
                                        {stats?.summary?.total || 0}
                                    </Typography>
                                </Box>
                                <LinkIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.5 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography color="text.secondary" variant="caption">
                                        Verificados
                                    </Typography>
                                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                                        {stats?.summary?.verified || 0}
                                    </Typography>
                                </Box>
                                <CheckIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.5 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Search */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <TextField
                    size="small"
                    placeholder="Buscar por telefone ou nome..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    sx={{ minWidth: 350 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        )
                    }}
                />
            </Paper>

            {/* Error */}
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
                                    <TableCell>Telefone</TableCell>
                                    <TableCell>Nome WhatsApp</TableCell>
                                    <TableCell>Push Name</TableCell>
                                    <TableCell align="center">Mensagens</TableCell>
                                    <TableCell>Desde</TableCell>
                                    <TableCell align="center">Ação</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {contacts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            <Typography color="text.secondary" sx={{ py: 4 }}>
                                                {search ? 'Nenhum contato encontrado' : 'Todos os contatos já estão vinculados! 🎉'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    contacts.map((contact) => (
                                        <TableRow key={contact.id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <WhatsAppIcon sx={{ color: '#25D366', fontSize: 20 }} />
                                                    <Typography variant="body2" fontFamily="monospace">
                                                        {formatPhone(contact.phone_number)}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {contact.name || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {contact.push_name || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    size="small"
                                                    label={contact.message_count || 0}
                                                    color={contact.message_count > 10 ? 'primary' : 'default'}
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" color="text.secondary">
                                                    {contact.created_at ? new Date(contact.created_at).toLocaleDateString('pt-BR') : '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="primary"
                                                    startIcon={<LinkIcon />}
                                                    onClick={() => handleOpenLink(contact)}
                                                >
                                                    Vincular
                                                </Button>
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
                            labelRowsPerPage="Por página:"
                            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                        />
                    </>
                )}
            </TableContainer>

            {/* Link Dialog */}
            <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinkIcon color="primary" />
                    Vincular Contato
                </DialogTitle>
                <DialogContent>
                    {selectedContact && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Contato WhatsApp:
                            </Typography>
                            <Card variant="outlined" sx={{ p: 2, bgcolor: '#E8F5E9' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <WhatsAppIcon sx={{ color: '#25D366', fontSize: 32 }} />
                                    <Box>
                                        <Typography variant="body1" fontWeight="bold">
                                            {formatPhone(selectedContact.phone_number)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {selectedContact.name || selectedContact.push_name || 'Sem nome'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Card>
                        </Box>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Buscar cliente no sistema:
                    </Typography>

                    <Autocomplete
                        fullWidth
                        options={searchResults}
                        getOptionLabel={(option) => `${option.nome} ${option.cnpj ? `(${option.cnpj})` : ''}`}
                        loading={searching}
                        value={selectedCustomer}
                        onChange={(event, newValue) => setSelectedCustomer(newValue)}
                        onInputChange={(event, newInputValue) => {
                            setSearchQuery(newInputValue)
                            handleSearchCustomers(newInputValue)
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Digite o nome, CNPJ ou telefone do cliente"
                                placeholder="Buscar cliente..."
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {searching && <CircularProgress size={20} />}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                        renderOption={(props, option) => (
                            <li {...props}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                    <BusinessIcon color="action" />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" fontWeight="medium">
                                            {option.nome}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {option.fantasia && `${option.fantasia} • `}
                                            {option.cnpj || 'Sem CNPJ'} • {option.cidade}-{option.estado}
                                        </Typography>
                                        {option.fone && (
                                            <Typography variant="caption" color="primary.main" sx={{ display: 'block' }}>
                                                📞 {option.fone}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </li>
                        )}
                        noOptionsText={searchQuery.length < 2 ? "Digite pelo menos 2 caracteres" : "Nenhum cliente encontrado"}
                    />

                    {selectedCustomer && (
                        <Card variant="outlined" sx={{ mt: 2, p: 2, bgcolor: '#E3F2FD' }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                Cliente selecionado:
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <PersonIcon color="primary" />
                                <Box>
                                    <Typography variant="body1" fontWeight="bold">
                                        {selectedCustomer.nome}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {selectedCustomer.cnpj} • {selectedCustomer.cidade}-{selectedCustomer.estado}
                                    </Typography>
                                </Box>
                            </Box>
                        </Card>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLinkDialogOpen(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={handleLink}
                        disabled={linking || !selectedCustomer}
                        startIcon={linking ? <CircularProgress size={18} /> : <LinkIcon />}
                    >
                        {linking ? 'Vinculando...' : 'Confirmar Vinculação'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default WhatsAppContactsPage
