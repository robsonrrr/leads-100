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
  Tooltip
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
  ShoppingCart as CartIcon
} from '@mui/icons-material'
import { customersService } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import InteractionsTimeline from '../components/InteractionsTimeline'
import ChurnRiskWidget from '../components/ChurnRiskWidget'
import RecommendationsWidget from '../components/RecommendationsWidget'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tabValue, setTabValue] = useState(0)

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
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewLead}
        >
          Nova Cotação
        </Button>
      </Box>

      {/* Dados do Cliente */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Dados do Cliente
        </Typography>
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
      </Paper>
    </Box>
  )
}

export default CustomerDetailPage
