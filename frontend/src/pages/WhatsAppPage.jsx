/**
 * WhatsApp Page
 * 
 * Página dedicada para visualização de conversas do WhatsApp
 * Integração com Superbot
 * 
 * @version 1.0
 * @date 2026-01-18
 */

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    InputAdornment,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
    Avatar,
    Chip,
    IconButton,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    Badge,
    Button,
    Tooltip,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material'
import {
    WhatsApp as WhatsAppIcon,
    Search as SearchIcon,
    Person as PersonIcon,
    ArrowBack as ArrowBackIcon,
    Refresh as RefreshIcon,
    Link as LinkIcon,
    LinkOff as LinkOffIcon,
    ShoppingCart as ShoppingCartIcon,
    Psychology as PsychologyIcon,
    FilterList as FilterListIcon,
    Settings as SettingsIcon,
    BarChart as BarChartIcon,
} from '@mui/icons-material'
import {
    WhatsAppConversation,
    WhatsAppActivityWidget,
    IntentAnalysisPanel,
    WhatsAppDashboard
} from '../components/Superbot'
import { superbotService } from '../services/superbot.service'

// Tab Panel Component
const TabPanel = ({ children, value, index, ...other }) => (
    <Box
        role="tabpanel"
        hidden={value !== index}
        {...other}
        sx={{ pt: 2 }}
    >
        {value === index && children}
    </Box>
)

const WhatsAppPage = () => {
    const { phone } = useParams()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    const [loading, setLoading] = useState(true)
    const [customers, setCustomers] = useState([])
    const [filteredCustomers, setFilteredCustomers] = useState([])
    const [selectedPhone, setSelectedPhone] = useState(phone || null)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState(0)
    const [webhookStatus, setWebhookStatus] = useState(null)
    const [showAnalysis, setShowAnalysis] = useState(false)
    const [linkDialogOpen, setLinkDialogOpen] = useState(false)
    const [viewMode, setViewMode] = useState('conversations') // 'conversations' | 'dashboard'
    const [isFilteredBySeller, setIsFilteredBySeller] = useState(false)
    const [currentUser, setCurrentUser] = useState(null)

    // Carregar usuário do localStorage
    useEffect(() => {
        try {
            const userStr = localStorage.getItem('user')
            if (userStr) {
                setCurrentUser(JSON.parse(userStr))
            }
        } catch (e) {
            console.error('Erro ao carregar usuário:', e)
        }
    }, [])

    // Carregar dados iniciais
    useEffect(() => {
        if (currentUser !== null) {
            loadCustomers()
        }
        loadWebhookStatus()
    }, [currentUser])

    // Atualizar URL quando selecionar cliente
    useEffect(() => {
        if (selectedPhone && selectedPhone !== phone) {
            navigate(`/whatsapp/${selectedPhone}`, { replace: true })
        }
    }, [selectedPhone])

    // Filtrar clientes
    useEffect(() => {
        if (!searchTerm) {
            setFilteredCustomers(customers)
            return
        }

        const term = searchTerm.toLowerCase()
        const filtered = customers.filter(c =>
            c.name?.toLowerCase().includes(term) ||
            c.push_name?.toLowerCase().includes(term) ||
            c.phone_number?.includes(term)
        )
        setFilteredCustomers(filtered)
    }, [searchTerm, customers])

    const loadCustomers = async () => {
        setLoading(true)
        try {
            let response
            let filtered = false

            // Se level < 4, usar endpoint filtrado por vendedor
            if (currentUser && currentUser.level < 4) {
                response = await superbotService.getMyCustomers({ limit: 100 })
                filtered = response.data?.filtered_by_seller || false

                // Se não tem telefone vinculado, tentar o endpoint normal
                if (response.data?.sellerPhones?.length === 0) {
                    console.warn('Vendedor sem telefones vinculados, tentando endpoint geral...')
                    response = await superbotService.getCustomers({ limit: 100 })
                    filtered = false
                }
            } else {
                // Admin/gerente vê todos
                response = await superbotService.getCustomers({ limit: 100 })
            }

            const data = response.data?.customers || response.data?.data || []
            setCustomers(data)
            setFilteredCustomers(data)
            setIsFilteredBySeller(filtered)

            // Se não tiver telefone selecionado, seleciona o primeiro
            if (!selectedPhone && data.length > 0) {
                setSelectedPhone(data[0].phone_number)
            }
        } catch (err) {
            console.error('Erro ao carregar clientes:', err)
        } finally {
            setLoading(false)
        }
    }

    const loadWebhookStatus = async () => {
        try {
            const response = await superbotService.getWebhookStatus()
            setWebhookStatus(response.data?.data)
        } catch (err) {
            console.error('Erro ao carregar status:', err)
        }
    }

    const handleCustomerSelect = (customer) => {
        setSelectedPhone(customer.phone_number)
    }

    const formatLastContact = (date) => {
        if (!date) return 'Nunca'

        const now = new Date()
        const lastContact = new Date(date)
        const diffHours = Math.floor((now - lastContact) / (1000 * 60 * 60))

        if (diffHours < 1) return 'Agora'
        if (diffHours < 24) return `${diffHours}h`

        const diffDays = Math.floor(diffHours / 24)
        if (diffDays === 1) return 'Ontem'
        if (diffDays < 7) return `${diffDays}d`

        return lastContact.toLocaleDateString('pt-BR')
    }

    const handleCreateLead = () => {
        // Redirecionar para criar lead com cliente pré-selecionado
        navigate(`/leads/new?phone=${selectedPhone}`)
    }

    return (
        <Box sx={{ height: 'calc(100vh - 100px)' }}>
            {/* Header */}
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            badgeContent={
                                webhookStatus?.status === 'active' ? (
                                    <Box
                                        sx={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            bgcolor: '#4CAF50',
                                            border: '2px solid #fff',
                                        }}
                                    />
                                ) : null
                            }
                        >
                            <Avatar sx={{ bgcolor: '#25D366', width: 48, height: 48 }}>
                                <WhatsAppIcon />
                            </Avatar>
                        </Badge>

                        <Box>
                            <Typography variant="h5" fontWeight="bold">
                                WhatsApp Business
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {customers.length} contatos {isFilteredBySeller && '(meus clientes)'} • Superbot Integration
                            </Typography>
                        </Box>

                        {isFilteredBySeller && (
                            <Chip
                                size="small"
                                icon={<FilterListIcon fontSize="small" />}
                                label="Filtrado por vendedor"
                                color="info"
                                variant="outlined"
                            />
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {webhookStatus && (
                            <>
                                <Chip
                                    size="small"
                                    label={webhookStatus.ai_configured ? 'IA Ativa' : 'IA Desativada'}
                                    color={webhookStatus.ai_configured ? 'success' : 'default'}
                                />
                                {webhookStatus.auto_create_leads && (
                                    <Chip
                                        size="small"
                                        icon={<ShoppingCartIcon fontSize="small" />}
                                        label="Auto-Lead"
                                        color="primary"
                                    />
                                )}
                            </>
                        )}
                        <Chip
                            size="small"
                            icon={<BarChartIcon fontSize="small" />}
                            label={viewMode === 'dashboard' ? 'Conversas' : 'Dashboard'}
                            onClick={() => setViewMode(viewMode === 'dashboard' ? 'conversations' : 'dashboard')}
                            variant="outlined"
                            sx={{ cursor: 'pointer' }}
                        />
                        <IconButton onClick={loadCustomers}>
                            <RefreshIcon />
                        </IconButton>
                    </Box>
                </Box>
            </Paper>

            {/* Content - Dashboard ou Conversas */}
            {viewMode === 'dashboard' ? (
                <WhatsAppDashboard />
            ) : (
                <Grid container spacing={2} sx={{ height: 'calc(100% - 100px)' }}>
                    {/* Sidebar - Lista de Contatos */}
                    <Grid item xs={12} md={3}>
                        <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            {/* Search */}
                            <Box sx={{ p: 2 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Buscar contato..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Box>

                            <Divider />

                            {/* Customer List */}
                            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                                {loading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : filteredCustomers.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', p: 4 }}>
                                        <Typography color="text.secondary">
                                            Nenhum contato encontrado
                                        </Typography>
                                    </Box>
                                ) : (
                                    <List dense>
                                        {filteredCustomers.map((customer) => (
                                            <ListItem
                                                key={customer.id}
                                                button
                                                selected={selectedPhone === customer.phone_number}
                                                onClick={() => handleCustomerSelect(customer)}
                                                sx={{
                                                    borderLeft: selectedPhone === customer.phone_number
                                                        ? '4px solid #25D366'
                                                        : '4px solid transparent',
                                                }}
                                            >
                                                <ListItemAvatar>
                                                    <Badge
                                                        overlap="circular"
                                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                        badgeContent={
                                                            customer.has_linked_customer ? (
                                                                <LinkIcon
                                                                    fontSize="small"
                                                                    sx={{
                                                                        width: 14,
                                                                        height: 14,
                                                                        bgcolor: '#2196F3',
                                                                        borderRadius: '50%',
                                                                        color: '#fff',
                                                                        p: 0.2,
                                                                    }}
                                                                />
                                                            ) : null
                                                        }
                                                    >
                                                        <Avatar sx={{ bgcolor: '#e0e0e0' }}>
                                                            <PersonIcon />
                                                        </Avatar>
                                                    </Badge>
                                                </ListItemAvatar>

                                                <ListItemText
                                                    primary={
                                                        <Typography variant="body2" noWrap fontWeight="medium">
                                                            {customer.name || customer.push_name || 'Sem nome'}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Typography variant="caption" color="text.secondary">
                                                            {customer.phone_number}
                                                        </Typography>
                                                    }
                                                />

                                                <ListItemSecondaryAction>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatLastContact(customer.stats?.last_message_at)}
                                                    </Typography>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Main Content */}
                    <Grid item xs={12} md={9}>
                        <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            {selectedPhone ? (
                                <>
                                    {/* Tabs */}
                                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                        <Tabs
                                            value={activeTab}
                                            onChange={(e, v) => setActiveTab(v)}
                                            variant="scrollable"
                                            scrollButtons="auto"
                                        >
                                            <Tab
                                                icon={<WhatsAppIcon />}
                                                label="Conversas"
                                                iconPosition="start"
                                            />
                                            <Tab
                                                icon={<PsychologyIcon />}
                                                label="Análise IA"
                                                iconPosition="start"
                                            />
                                            <Tab
                                                icon={<LinkIcon />}
                                                label="Vinculação"
                                                iconPosition="start"
                                            />
                                        </Tabs>
                                    </Box>

                                    {/* Tab: Conversas */}
                                    <TabPanel value={activeTab} index={0} sx={{ flex: 1, overflow: 'hidden' }}>
                                        <WhatsAppConversation
                                            phone={selectedPhone}
                                            showAnalysis={showAnalysis}
                                            maxHeight="calc(100vh - 280px)"
                                            onCreateLead={handleCreateLead}
                                        />
                                    </TabPanel>

                                    {/* Tab: Análise IA */}
                                    <TabPanel value={activeTab} index={1}>
                                        <IntentAnalysisPanel
                                            phone={selectedPhone}
                                            onAnalysisComplete={(result) => {
                                                console.log('Análise completa:', result)
                                            }}
                                        />
                                    </TabPanel>

                                    {/* Tab: Vinculação */}
                                    <TabPanel value={activeTab} index={2}>
                                        <CustomerLinkPanel phone={selectedPhone} />
                                    </TabPanel>
                                </>
                            ) : (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100%',
                                        gap: 2,
                                    }}
                                >
                                    <WhatsAppIcon sx={{ fontSize: 80, color: '#25D366', opacity: 0.5 }} />
                                    <Typography variant="h6" color="text.secondary">
                                        Selecione um contato para visualizar conversas
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    )
}

// Componente auxiliar para vinculação de clientes
const CustomerLinkPanel = ({ phone }) => {
    const [loading, setLoading] = useState(true)
    const [linkedCustomer, setLinkedCustomer] = useState(null)
    const [suggestions, setSuggestions] = useState([])

    useEffect(() => {
        loadLinkData()
    }, [phone])

    const loadLinkData = async () => {
        setLoading(true)
        try {
            const [linkedRes, suggestionsRes] = await Promise.all([
                superbotService.getLinkedCustomer(phone).catch(() => ({ data: { data: null } })),
                superbotService.getSuggestedLinks({ phone, limit: 5 }).catch(() => ({ data: { data: [] } })),
            ])

            setLinkedCustomer(linkedRes.data?.data)
            setSuggestions(suggestionsRes.data?.data || [])
        } catch (err) {
            console.error('Erro ao carregar dados de vinculação:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleLink = async (leadsCustomerId) => {
        try {
            await superbotService.createLink(null, leadsCustomerId, {
                phone,
                verified: true
            })
            loadLinkData()
        } catch (err) {
            console.error('Erro ao vincular:', err)
        }
    }

    const handleUnlink = async () => {
        if (!linkedCustomer) return

        try {
            await superbotService.removeLink(linkedCustomer.superbot_customer_id, linkedCustomer.leads_customer_id)
            loadLinkData()
        } catch (err) {
            console.error('Erro ao desvincular:', err)
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
        <Box sx={{ p: 2 }}>
            {linkedCustomer ? (
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: '#2196F3' }}>
                                <LinkIcon />
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    {linkedCustomer.leads_customer_name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    CNPJ: {linkedCustomer.cnpj || 'N/A'} •
                                    Vendedor: {linkedCustomer.seller_name || 'N/A'}
                                </Typography>
                            </Box>
                        </Box>

                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<LinkOffIcon />}
                            onClick={handleUnlink}
                        >
                            Desvincular
                        </Button>
                    </Box>
                </Paper>
            ) : (
                <Box>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Este contato do WhatsApp não está vinculado a nenhum cliente cadastrado.
                    </Alert>

                    {suggestions.length > 0 && (
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Sugestões de vinculação:
                            </Typography>

                            <List>
                                {suggestions.map((suggestion) => (
                                    <ListItem
                                        key={suggestion.leads_customer_id}
                                        sx={{
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 1,
                                            mb: 1
                                        }}
                                    >
                                        <ListItemText
                                            primary={suggestion.customer_name}
                                            secondary={`CNPJ: ${suggestion.cnpj || 'N/A'} • Score: ${suggestion.confidence_score}%`}
                                        />
                                        <ListItemSecondaryAction>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<LinkIcon />}
                                                onClick={() => handleLink(suggestion.leads_customer_id)}
                                            >
                                                Vincular
                                            </Button>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    )
}

export default WhatsAppPage
