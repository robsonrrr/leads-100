import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
  InputAdornment,
  CircularProgress,
  Skeleton,
  Chip,
  Alert
} from '@mui/material'
import {
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { analyticsService, customersService } from '../services/api'
import { formatCurrency } from '../utils'

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f']

function AnalyticsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useSelector((state) => state.auth)
  const isManager = (user?.level || 0) > 4

  // Estados de filtro para gerentes
  const [sellerSegments, setSellerSegments] = useState([])
  const [selectedSellerSegment, setSelectedSellerSegment] = useState(searchParams.get('sellerSegmento') || '')
  const [sellers, setSellers] = useState([])
  const [loadingSellers, setLoadingSellers] = useState(false)
  const [selectedSeller, setSelectedSeller] = useState(null)
  const [pendingSellerId, setPendingSellerId] = useState(searchParams.get('sellerId') || null)

  // Estados de dados
  const [dashboard, setDashboard] = useState(null)
  const [topCustomers, setTopCustomers] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  // Carregar segmentos de vendedores
  useEffect(() => {
    if (isManager) {
      customersService.getSellerSegments()
        .then(response => {
          if (response.data.success) {
            setSellerSegments(response.data.data || [])
          }
        })
        .catch(err => console.error('Erro ao carregar segmentos:', err))
    }
  }, [isManager])

  // Carregar vendedores
  useEffect(() => {
    if (isManager) {
      setLoadingSellers(true)
      const params = selectedSellerSegment ? { segmento: selectedSellerSegment } : {}
      customersService.getSellers(params)
        .then(response => {
          if (response.data.success) {
            const sellersList = response.data.data || []
            setSellers(sellersList)
            // Restaurar vendedor da URL
            if (pendingSellerId && !selectedSeller) {
              const seller = sellersList.find(s => s.id === parseInt(pendingSellerId))
              if (seller) setSelectedSeller(seller)
              setPendingSellerId(null)
            } else if (selectedSeller && !sellersList.find(s => s.id === selectedSeller.id)) {
              setSelectedSeller(null)
            }
          }
        })
        .catch(err => console.error('Erro ao carregar vendedores:', err))
        .finally(() => setLoadingSellers(false))
    }
  }, [isManager, selectedSellerSegment, pendingSellerId])

  // Sincronizar estado com URL quando navegar de volta
  useEffect(() => {
    const urlSellerSegmento = searchParams.get('sellerSegmento') || ''
    const urlSellerId = searchParams.get('sellerId') || null

    if (urlSellerSegmento !== selectedSellerSegment) setSelectedSellerSegment(urlSellerSegmento)
    if (urlSellerId !== pendingSellerId) setPendingSellerId(urlSellerId)
  }, [searchParams])

  // Atualizar URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedSellerSegment) params.set('sellerSegmento', selectedSellerSegment)
    if (selectedSeller) params.set('sellerId', selectedSeller.id.toString())
    const next = params.toString()
    const current = searchParams.toString()
    if (next !== current) {
      setSearchParams(params, { replace: true })
    }
  }, [selectedSellerSegment, selectedSeller, setSearchParams, searchParams])

  // Carregar dados
  useEffect(() => {
    if (!isManager) return
    loadData()
  }, [selectedSeller, selectedSellerSegment, isManager])

  const loadData = async () => {
    try {
      setLoading(true)
      const params = {}
      if (selectedSeller) {
        params.sellerId = selectedSeller.id
      } else if (selectedSellerSegment) {
        params.sellerSegmento = selectedSellerSegment
      }

      const [dashboardRes, topCustomersRes, summaryRes] = await Promise.all([
        analyticsService.getDashboard(params),
        analyticsService.getTopCustomers({ ...params, limit: 5, period: 'year' }),
        analyticsService.getSellerSummary(params)
      ])

      if (dashboardRes.data.success) setDashboard(dashboardRes.data.data)
      if (topCustomersRes.data.success) setTopCustomers(topCustomersRes.data.data)
      if (summaryRes.data.success) setSummary(summaryRes.data.data)
    } catch (err) {
      console.error('Erro ao carregar analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isManager) {
    return (
      <Box>
        <Alert severity="warning">
          Esta página é restrita a gerentes.
        </Alert>
      </Box>
    )
  }

  const formatYAxis = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return value
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5 }}>
          <Typography variant="body2" fontWeight="bold">{label}</Typography>
          <Typography variant="body2" color="primary">
            {formatCurrency(payload[0].value)}
          </Typography>
          {payload[0].payload.ordersCount && (
            <Typography variant="caption" color="text.secondary">
              {payload[0].payload.ordersCount} pedidos
            </Typography>
          )}
        </Paper>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 3 }}>Analytics</Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={12} md={6} key={i}>
              <Skeleton variant="rounded" height={300} />
            </Grid>
          ))}
        </Grid>
      </Box>
    )
  }

  const yearComparison = dashboard?.yearComparison || {}

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Analytics</Typography>
        
        {isManager && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {sellerSegments.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Seg. Vendedor</InputLabel>
                <Select
                  value={selectedSellerSegment}
                  label="Seg. Vendedor"
                  onChange={(e) => {
                    setSelectedSellerSegment(e.target.value)
                    setSelectedSeller(null)
                  }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {sellerSegments.map(seg => (
                    <MenuItem key={seg} value={seg}>{seg}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Autocomplete
              size="small"
              options={sellers}
              getOptionLabel={(option) => option.name}
              value={selectedSeller}
              onChange={(e, newValue) => setSelectedSeller(newValue)}
              loading={loadingSellers}
              sx={{ minWidth: 220 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Vendedor"
                  placeholder="Todos"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <PeopleIcon color="action" fontSize="small" />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                    endAdornment: (
                      <>
                        {loadingSellers ? <CircularProgress color="inherit" size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Box>
        )}
      </Box>

      {/* Cards de Resumo */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Vendas {new Date().getFullYear()}</Typography>
            <Typography variant="h5" fontWeight="bold" color="primary">
              {formatCurrency(yearComparison.current?.totalValue || 0)}
            </Typography>
            {yearComparison.variation !== 0 && (
              <Chip
                size="small"
                icon={yearComparison.variation > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                label={`${yearComparison.variation > 0 ? '+' : ''}${yearComparison.variation}%`}
                color={yearComparison.variation > 0 ? 'success' : 'error'}
                sx={{ mt: 1 }}
              />
            )}
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Pedidos {new Date().getFullYear()}</Typography>
            <Typography variant="h5" fontWeight="bold">
              {yearComparison.current?.ordersCount || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Ticket Médio</Typography>
            <Typography variant="h5" fontWeight="bold" color="warning.main">
              {formatCurrency(yearComparison.current?.avgTicket || 0)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Clientes Ativos</Typography>
            <Typography variant="h5" fontWeight="bold" color="success.main">
              {summary?.customers?.activeCount || 0}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Gráfico de Vendas por Mês */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Vendas por Mês</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboard?.salesByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={formatYAxis} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalValue" fill="#1976d2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top Clientes */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Top 5 Clientes</Typography>
            {topCustomers.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                Nenhum dado disponível
              </Typography>
            ) : (
              <Box>
                {topCustomers.map((customer, index) => {
                  const maxValue = topCustomers[0]?.totalValue || 1
                  const percentage = (customer.totalValue / maxValue) * 100
                  return (
                    <Box
                      key={customer.id}
                      sx={{
                        mb: 2,
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.8 }
                      }}
                      onClick={() => navigate(`/customers/${customer.id}`)}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: '60%' }}>
                          {index + 1}. {customer.tradeName || customer.name}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(customer.totalValue)}
                        </Typography>
                      </Box>
                      <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
                        <Box
                          sx={{
                            width: `${percentage}%`,
                            bgcolor: COLORS[index % COLORS.length],
                            borderRadius: 1,
                            height: '100%'
                          }}
                        />
                      </Box>
                      {customer.sellerName && (
                        <Typography variant="caption" color="text.secondary">
                          {customer.sellerName}
                        </Typography>
                      )}
                    </Box>
                  )
                })}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Vendas por Dia da Semana */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Vendas por Dia da Semana</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dashboard?.salesByDay || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatYAxis} />
                <YAxis type="category" dataKey="day" width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalValue" fill="#2e7d32" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Comparação Anual */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Comparação Anual</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.lighter' }}>
                  <Typography variant="body2" color="text.secondary">
                    {yearComparison.current?.year || new Date().getFullYear()}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {formatCurrency(yearComparison.current?.totalValue || 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {yearComparison.current?.ordersCount || 0} pedidos
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {yearComparison.previous?.year || new Date().getFullYear() - 1}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatCurrency(yearComparison.previous?.totalValue || 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {yearComparison.previous?.ordersCount || 0} pedidos
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              {yearComparison.variation !== 0 && (
                <Chip
                  icon={yearComparison.variation > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  label={`${yearComparison.variation > 0 ? '+' : ''}${yearComparison.variation}% vs ano anterior`}
                  color={yearComparison.variation > 0 ? 'success' : 'error'}
                />
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default AnalyticsPage
