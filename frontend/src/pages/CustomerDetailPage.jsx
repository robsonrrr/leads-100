import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Tabs,
  Tab,
  Chip,
  Button,
  Skeleton,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  List,
  ListItem,
  ListItemText
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  LocalShipping as ShippingIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShoppingCart as CartIcon,
  OpenInNew as OpenInNewIcon,
  LocalOffer as OfferIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  WhatsApp as WhatsAppIcon
} from '@mui/icons-material'
import { customersService, offersService } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import InteractionsTimeline from '../components/InteractionsTimeline'
import ChurnRiskWidget from '../components/ChurnRiskWidget'
import RecommendationsWidget from '../components/RecommendationsWidget'
import { OfferBuilder } from '../components/offers'

// Helper para extrair level do JWT
const getJwtLevel = (token) => {
  if (!token) return 0
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return 0
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4 || 4)) % 4, '=')
    const payload = JSON.parse(atob(padded))
    return payload?.level ?? 0
  } catch {
    return 0
  }
}

// Utilitários de formatação
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('pt-BR')
}

const formatCNPJ = (cnpj) => {
  if (!cnpj) return '-'
  const cleaned = cnpj.replace(/\D/g, '')
  if (cleaned.length === 14) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return cnpj
}

// Componente de Status
function StatusChip({ status, daysSinceOrder }) {
  const statusConfig = {
    active: { label: 'Ativo', color: 'success', icon: '🟢' },
    at_risk: { label: 'Em Risco', color: 'warning', icon: '🟡' },
    inactive: { label: 'Inativo', color: 'error', icon: '🔴' }
  }
  const config = statusConfig[status] || statusConfig.inactive

  return (
    <Chip
      label={`${config.icon} ${config.label}${daysSinceOrder ? ` (${daysSinceOrder}d)` : ''}`}
      color={config.color}
      size="small"
    />
  )
}

// Componente de Métricas
function MetricsSection({ metrics, loading }) {
  if (loading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3, 4].map(i => (
          <Grid item xs={6} md={3} key={i}>
            <Paper sx={{ p: 2 }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="80%" height={40} />
            </Paper>
          </Grid>
        ))}
      </Grid>
    )
  }

  if (!metrics) return null

  const cards = [
    { label: 'Total no Ano', value: formatCurrency(metrics.year?.total), sub: `${metrics.year?.ordersCount || 0} pedidos` },
    { label: 'Total no Mês', value: formatCurrency(metrics.month?.total), sub: `${metrics.month?.ordersCount || 0} pedidos` },
    { label: 'Ticket Médio', value: formatCurrency(metrics.lifetime?.avgTicket), sub: 'histórico' },
    { label: 'Frequência', value: metrics.lifetime?.avgFrequency ? `${metrics.lifetime.avgFrequency} dias` : '-', sub: 'entre pedidos' }
  ]

  return (
    <Grid container spacing={2}>
      {cards.map((card, i) => (
        <Grid item xs={6} md={3} key={i}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">{card.label}</Typography>
            <Typography variant="h5" fontWeight="bold">{card.value}</Typography>
            <Typography variant="caption" color="text.secondary">{card.sub}</Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  )
}

// Tab Panel
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

function CustomerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  // User level para controle de visibilidade
  const { user, token } = useSelector((state) => state.auth)
  const userLevel = user?.level ?? user?.nivel ?? getJwtLevel(token) ?? 0
  const isRestricted = userLevel < 4

  // Estados
  const [customer, setCustomer] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [orders, setOrders] = useState([])
  const [leads, setLeads] = useState([])
  const [products, setProducts] = useState([])
  const [customerOffers, setCustomerOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tabValue, setTabValue] = useState(0)
  const [showOfferBuilder, setShowOfferBuilder] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [offerDetailLoading, setOfferDetailLoading] = useState(false)

  // Paginação
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersTotalPages, setOrdersTotalPages] = useState(1)
  const [leadsPage, setLeadsPage] = useState(1)
  const [leadsTotalPages, setLeadsTotalPages] = useState(1)

  // Carregar dados do cliente
  useEffect(() => {
    async function loadCustomer() {
      try {
        setLoading(true)
        setError('')

        const [customerRes, metricsRes] = await Promise.all([
          customersService.getById(id),
          customersService.getMetrics(id)
        ])

        if (customerRes.data.success) {
          setCustomer(customerRes.data.data)
        }
        if (metricsRes.data.success) {
          setMetrics(metricsRes.data.data)
        }
      } catch (err) {
        console.error('Erro ao carregar cliente:', err)
        setError(err.response?.data?.error?.message || 'Erro ao carregar cliente')
        toast.error('Erro ao carregar dados do cliente')
      } finally {
        setLoading(false)
      }
    }

    loadCustomer()
  }, [id, toast])

  // Carregar pedidos quando tab muda ou página muda
  useEffect(() => {
    if (tabValue === 0) {
      loadOrders()
    }
  }, [tabValue, ordersPage])

  // Carregar leads quando tab muda ou página muda
  useEffect(() => {
    if (tabValue === 1) {
      loadLeads()
    }
  }, [tabValue, leadsPage])

  // Carregar produtos quando tab muda
  useEffect(() => {
    if (tabValue === 2) {
      loadProducts()
    }
  }, [tabValue])

  // Carregar ofertas quando tab muda
  useEffect(() => {
    if (tabValue === 4) {
      loadOffers()
    }
  }, [tabValue])

  async function loadOrders() {
    try {
      const res = await customersService.getOrders(id, { page: ordersPage, limit: 10 })
      if (res.data.success) {
        setOrders(res.data.data)
        setOrdersTotalPages(res.data.pagination?.totalPages || 1)
      }
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err)
    }
  }

  async function loadLeads() {
    try {
      const res = await customersService.getLeads(id, { page: leadsPage, limit: 10 })
      if (res.data.success) {
        setLeads(res.data.data)
        setLeadsTotalPages(res.data.pagination?.totalPages || 1)
      }
    } catch (err) {
      console.error('Erro ao carregar leads:', err)
    }
  }

  async function loadProducts() {
    try {
      const res = await customersService.getTopProducts(id, 10)
      if (res.data.success) {
        setProducts(res.data.data)
      }
    } catch (err) {
      console.error('Erro ao carregar produtos:', err)
    }
  }

  async function loadOffers() {
    try {
      const res = await offersService.getByCustomer(id, 20)
      if (res.data.success) {
        setCustomerOffers(res.data.offers || [])
      }
    } catch (err) {
      console.error('Erro ao carregar ofertas:', err)
    }
  }

  const handleOfferBuilt = (offer) => {
    toast.success(`Oferta ${offer.offerId} criada com sucesso!`)
    loadOffers()
    setShowOfferBuilder(false)
  }

  const handleNewLead = () => {
    navigate('/leads/new', { state: { customer } })
  }

  const handleViewOrder = (orderId) => {
    navigate(`/orders/${orderId}`)
  }

  const handleViewLead = (leadId) => {
    navigate(`/leads/${leadId}`)
  }

  const handleEditLead = (leadId) => {
    navigate(`/leads/${leadId}/edit`)
  }

  const handleViewOfferDetails = async (offer) => {
    setOfferDetailLoading(true)
    try {
      const res = await offersService.getById(offer.offer_id)
      if (res.data?.success && res.data.offer) {
        setSelectedOffer(res.data.offer)
      } else {
        // Use the offer from the list if API call doesn't return full details
        setSelectedOffer(offer)
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes da oferta:', err)
      setSelectedOffer(offer)
    } finally {
      setOfferDetailLoading(false)
    }
  }

  const handleCloseOfferDetails = () => {
    setSelectedOffer(null)
  }

  const handleCopyWhatsApp = (text) => {
    if (text) {
      navigator.clipboard.writeText(text)
      toast.success('Texto copiado!')
    }
  }

  const handleOpenWhatsApp = (text) => {
    if (text) {
      const encodedText = encodeURIComponent(text)
      window.open(`https://wa.me/?text=${encodedText}`, '_blank')
    }
  }

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={100} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Voltar
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!customer) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Voltar
        </Button>
        <Alert severity="warning">Cliente não encontrado</Alert>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h4" component="h1">
                {customer.tradeName || customer.name}
              </Typography>
              {metrics && <StatusChip status={metrics.status} daysSinceOrder={metrics.daysSinceOrder} />}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {customer.name} • {formatCNPJ(customer.cnpj)}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<OfferIcon />}
          onClick={() => setShowOfferBuilder(true)}
          sx={{ mr: 1 }}
        >
          Construir Oferta
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewLead}
        >
          Nova Cotação
        </Button>
      </Box>

      {/* Dados do Cliente */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Dados do Cliente
          </Typography>
          <Tooltip title="Abrir no CRM Vallery">
            <Button
              variant="outlined"
              size="small"
              startIcon={<OpenInNewIcon />}
              href={`https://office.vallery.com.br/crm/v504/vendedores/show/${id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver no CRM
            </Button>
          </Tooltip>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Endereço</Typography>
            <Typography>
              {customer.address?.street
                ? `${customer.address.street}${customer.address.number ? ', ' + customer.address.number : ''}${customer.address.complement ? ' - ' + customer.address.complement : ''}`
                : (typeof customer.address === 'string' ? customer.address : '-')}
              {(customer.address?.city || customer.city) && (customer.address?.state || customer.state) &&
                ` - ${customer.address?.city || customer.city}/${customer.address?.state || customer.state}`}
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Telefone</Typography>
            <Typography>
              {customer.phone ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon fontSize="small" color="action" />
                  {customer.phone}
                </Box>
              ) : '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Email</Typography>
            <Typography>
              {customer.email ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon fontSize="small" color="action" />
                  {customer.email}
                </Box>
              ) : '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Limite de Crédito</Typography>
            <Typography fontWeight="bold">{formatCurrency(customer.creditLimit)}</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Crédito Disponível</Typography>
            <Typography fontWeight="bold" color={customer.creditAvailable > 0 ? 'success.main' : 'error.main'}>
              {formatCurrency(customer.creditAvailable)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Primeiro Pedido</Typography>
            <Typography>{formatDate(metrics?.lifetime?.firstOrderDate)}</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Último Pedido</Typography>
            <Typography>{formatDate(metrics?.lifetime?.lastOrderDate)}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Análise Inteligente e Métricas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <ChurnRiskWidget customerId={id} />
        </Grid>
        <Grid item xs={12} md={8}>
          <MetricsSection metrics={metrics} loading={loading} />
        </Grid>
      </Grid>

      {/* Leads em Aberto */}
      {metrics?.leads?.openCount > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>{metrics.leads.openCount} cotações em aberto</strong> totalizando {formatCurrency(metrics.leads.openValue)}
        </Alert>
      )}

      {/* Recomendações de IA - oculto para level < 4 */}
      {!isRestricted && (
        <RecommendationsWidget
          customerId={id}
          onAddProduct={(p) => navigate('/leads/new', { state: { customer, initialProduct: p } })}
        />
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label={`Pedidos (${metrics?.lifetime?.ordersCount || 0})`} />
          <Tab label={`Cotações (${metrics?.leads?.openCount || 0} abertas)`} />
          <Tab label="Produtos Frequentes" />
          <Tab label="Interações" />
          <Tab label="Ofertas" icon={<OfferIcon />} iconPosition="start" />
        </Tabs>

        {/* Tab: Pedidos */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Pedido</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell align="right">Valor</TableCell>
                  <TableCell align="center">Itens</TableCell>
                  <TableCell>Pagamento</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">Nenhum pedido encontrado</Typography>
                    </TableCell>
                  </TableRow>
                ) : orders.map(order => (
                  <TableRow key={order.id} hover>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell>{formatDate(order.date)}</TableCell>
                    <TableCell align="right">{formatCurrency(order.total)}</TableCell>
                    <TableCell align="center">{order.itemsCount}</TableCell>
                    <TableCell>{order.paymentTerms || order.paymentType || '-'}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver pedido">
                        <IconButton size="small" onClick={() => handleViewOrder(order.id)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {ordersTotalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Pagination
                count={ordersTotalPages}
                page={ordersPage}
                onChange={(e, p) => setOrdersPage(p)}
                color="primary"
              />
            </Box>
          )}
        </TabPanel>

        {/* Tab: Leads */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Lead</TableCell>
                  <TableCell>Criado em</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Valor</TableCell>
                  <TableCell align="center">Itens</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">Nenhuma cotação encontrada</Typography>
                    </TableCell>
                  </TableRow>
                ) : leads.map(lead => (
                  <TableRow key={lead.id} hover>
                    <TableCell>#{lead.id}</TableCell>
                    <TableCell>{formatDate(lead.createdAt)}</TableCell>
                    <TableCell>
                      <Chip
                        label={lead.status === 'open' ? 'Aberto' : lead.status === 'converted' ? 'Convertido' : 'Cancelado'}
                        color={lead.status === 'open' ? 'primary' : lead.status === 'converted' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">{formatCurrency(lead.total)}</TableCell>
                    <TableCell align="center">{lead.itemsCount}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver">
                        <IconButton size="small" onClick={() => handleViewLead(lead.id)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {lead.status === 'open' && (
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => handleEditLead(lead.id)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {leadsTotalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Pagination
                count={leadsTotalPages}
                page={leadsPage}
                onChange={(e, p) => setLeadsPage(p)}
                color="primary"
              />
            </Box>
          )}
        </TabPanel>

        {/* Tab: Produtos */}
        <TabPanel value={tabValue} index={2}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>SKU</TableCell>
                  <TableCell>Produto</TableCell>
                  <TableCell align="right">Qtd Total</TableCell>
                  <TableCell align="right">Valor Total</TableCell>
                  <TableCell align="center">Pedidos</TableCell>
                  <TableCell>Última Compra</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary">Nenhum produto encontrado</Typography>
                    </TableCell>
                  </TableRow>
                ) : products.map(product => (
                  <TableRow key={product.productId} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{product.productCode}</Typography>
                      <Typography variant="caption" color="text.secondary">{product.productName}</Typography>
                    </TableCell>
                    <TableCell align="right">{product.totalQuantity}</TableCell>
                    <TableCell align="right">{formatCurrency(product.totalValue)}</TableCell>
                    <TableCell align="center">{product.ordersCount}</TableCell>
                    <TableCell>{formatDate(product.lastOrderDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab: Interações */}
        <TabPanel value={tabValue} index={3}>
          <InteractionsTimeline customerId={id} />
        </TabPanel>

        {/* Tab: Ofertas */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              <OfferIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Ofertas Comerciais
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowOfferBuilder(true)}
            >
              Nova Oferta
            </Button>
          </Box>

          {showOfferBuilder && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
              <OfferBuilder
                customerId={parseInt(id)}
                customerName={customer?.tradeName || customer?.name}
                sellerId={user?.sellerId || user?.id}
                segment="machines"
                onOfferBuilt={handleOfferBuilt}
                onClose={() => setShowOfferBuilder(false)}
                embedded
              />
            </Paper>
          )}

          {customerOffers.length === 0 && !showOfferBuilder ? (
            <Alert severity="info">
              Nenhuma oferta encontrada. Clique em "Nova Oferta" para construir uma oferta comercial usando IA.
            </Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Segmento</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell align="center">Itens</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customerOffers.map(offer => (
                    <TableRow key={offer.offer_id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {offer.offer_id?.slice(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(offer.created_at)}</TableCell>
                      <TableCell>
                        <Chip label={offer.segment} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={offer.outcome}
                          size="small"
                          color={offer.outcome === 'ALLOW' ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {offer.pricing_total ? formatCurrency(offer.pricing_total) : '-'}
                      </TableCell>
                      <TableCell align="center">
                        {offer.item_count || offer.items_count || '-'}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver detalhes">
                          <IconButton
                            size="small"
                            onClick={() => handleViewOfferDetails(offer)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>

      {/* Offer Details Dialog */}
      <Dialog
        open={!!selectedOffer}
        onClose={handleCloseOfferDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <OfferIcon color="primary" />
            <Typography variant="h6">
              Detalhes da Oferta
            </Typography>
          </Box>
          <IconButton onClick={handleCloseOfferDetails} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {offerDetailLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : selectedOffer && (
            <Box>
              {/* Offer ID and Status */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  ID da Oferta
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {selectedOffer.offer_id}
                </Typography>
              </Box>

              {/* Status Chips */}
              <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                <Chip
                  label={selectedOffer.segment?.toUpperCase()}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={selectedOffer.outcome || 'GOVERNED'}
                  size="small"
                  color={selectedOffer.outcome === 'ALLOW' ? 'success' : 'warning'}
                />
                {selectedOffer.goal_code && (
                  <Chip label={`Meta: ${selectedOffer.goal_code}`} size="small" variant="outlined" />
                )}
              </Box>

              {/* Dates */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Criado em</Typography>
                  <Typography>{formatDate(selectedOffer.created_at)}</Typography>
                </Grid>
                {selectedOffer.pricing_total && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Valor Total</Typography>
                    <Typography fontWeight="bold" color="primary.main">
                      {formatCurrency(selectedOffer.pricing_total)}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {/* Reasons */}
              {selectedOffer.reasons?.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>Razões</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {selectedOffer.reasons.map((reason, idx) => (
                      <Chip key={idx} label={reason} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Bundles */}
              {selectedOffer.bundles?.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Bundles Sugeridos ({selectedOffer.bundles.length})
                  </Typography>
                  {selectedOffer.bundles.map((bundle, idx) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold" gutterBottom>
                        {bundle.name}
                      </Typography>
                      <List dense disablePadding>
                        {bundle.items?.map((item, itemIdx) => (
                          <ListItem key={itemIdx} disablePadding sx={{ py: 0.25 }}>
                            <ListItemText
                              primary={`${item.qty}x ${item.sku}`}
                              secondary={item.why?.join(', ')}
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  ))}
                </Box>
              )}

              {/* WhatsApp Text */}
              {selectedOffer.whatsapp_text && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WhatsAppIcon sx={{ color: '#25D366' }} />
                    Mensagem WhatsApp
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      backgroundColor: '#f5f5f5',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      maxHeight: 200,
                      overflow: 'auto'
                    }}
                  >
                    {selectedOffer.whatsapp_text}
                  </Paper>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CopyIcon />}
                      onClick={() => handleCopyWhatsApp(selectedOffer.whatsapp_text)}
                    >
                      Copiar
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<WhatsAppIcon />}
                      onClick={() => handleOpenWhatsApp(selectedOffer.whatsapp_text)}
                    >
                      Enviar WhatsApp
                    </Button>
                  </Box>
                </Box>
              )}

              {/* No data message */}
              {!selectedOffer.bundles?.length && !selectedOffer.whatsapp_text && (
                <Alert severity="info">
                  Esta oferta está em processamento. Os bundles e a mensagem WhatsApp serão gerados em breve.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOfferDetails}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CustomerDetailPage
