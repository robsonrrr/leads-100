import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Pagination,
  Chip,
  Skeleton,
  Alert,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Autocomplete,
  CircularProgress
} from '@mui/material'
import {
  Search as SearchIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  Download as DownloadIcon
} from '@mui/icons-material'
import CustomerCard from '../components/CustomerCard'
import EmptyState from '../components/EmptyState'
import { customersService } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { formatCurrency, formatDate } from '../utils'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'active', label: '🟢 Ativos' },
  { value: 'at_risk', label: '🟡 Em Risco' },
  { value: 'inactive', label: '🔴 Inativos' }
]

const SORT_OPTIONS = [
  { value: 'last_order_date', label: 'Último Pedido' },
  { value: 'year_total', label: 'Total no Ano' },
  { value: 'month_total', label: 'Total no Mês' },
  { value: 'nome', label: 'Nome' },
  { value: 'limite', label: 'Limite de Crédito' }
]

function MyCustomersPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()
  const { user } = useSelector((state) => state.auth)

  // Verificar se é gerente (level > 4)
  const isManager = (user?.level || 0) > 4

  // Estados
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)
  const [viewMode, setViewMode] = useState('grid')

  // Estados para gerentes
  const [sellers, setSellers] = useState([])
  const [loadingSellers, setLoadingSellers] = useState(false)
  const [selectedSeller, setSelectedSeller] = useState(null)
  const [pendingSellerId, setPendingSellerId] = useState(searchParams.get('sellerId') || null)
  const [segments, setSegments] = useState([])
  const [selectedSegment, setSelectedSegment] = useState(searchParams.get('segmento') || '')

  // Filtros e paginação
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'last_order_date')
  const [sortDir, setSortDir] = useState(searchParams.get('sortDir') || 'DESC')
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Debounce para busca
  const [searchDebounce, setSearchDebounce] = useState(search)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Sincronizar estado com URL quando navegar de volta
  useEffect(() => {
    const urlSearch = searchParams.get('search') || ''
    const urlStatus = searchParams.get('status') || ''
    const urlSort = searchParams.get('sort') || 'last_order_date'
    const urlSortDir = searchParams.get('sortDir') || 'DESC'
    const urlPage = parseInt(searchParams.get('page')) || 1
    const urlSegmento = searchParams.get('segmento') || ''
    const urlSellerId = searchParams.get('sellerId') || null

    if (urlSearch !== search) setSearch(urlSearch)
    if (urlStatus !== status) setStatus(urlStatus)
    if (urlSort !== sort) setSort(urlSort)
    if (urlSortDir !== sortDir) setSortDir(urlSortDir)
    if (urlPage !== page) setPage(urlPage)
    if (urlSegmento !== selectedSegment) setSelectedSegment(urlSegmento)
    if (urlSellerId !== pendingSellerId) setPendingSellerId(urlSellerId)
  }, [searchParams])

  // Carregar segmentos (apenas para gerentes)
  useEffect(() => {
    if (isManager) {
      customersService.getSellerSegments()
        .then(response => {
          if (response.data.success) {
            setSegments(response.data.data || [])
          }
        })
        .catch(err => {
          console.error('Erro ao carregar segmentos:', err)
        })
    }
  }, [isManager])

  // Carregar vendedores (apenas para gerentes)
  useEffect(() => {
    if (isManager) {
      setLoadingSellers(true)
      const params = selectedSegment ? { segmento: selectedSegment } : {}
      customersService.getSellers(params)
        .then(response => {
          if (response.data.success) {
            const sellersList = response.data.data || []
            setSellers(sellersList)
            // Restaurar vendedor da URL se existir
            if (pendingSellerId && !selectedSeller) {
              const seller = sellersList.find(s => s.id === parseInt(pendingSellerId))
              if (seller) {
                setSelectedSeller(seller)
              }
              setPendingSellerId(null)
            }
            // Limpar vendedor selecionado se não estiver mais na lista
            else if (selectedSeller && !sellersList.find(s => s.id === selectedSeller.id)) {
              setSelectedSeller(null)
            }
          }
        })
        .catch(err => {
          console.error('Erro ao carregar vendedores:', err)
        })
        .finally(() => {
          setLoadingSellers(false)
        })
    }
  }, [isManager, selectedSegment, pendingSellerId])

  // Atualizar URL com parâmetros
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchDebounce) params.set('search', searchDebounce)
    if (status) params.set('status', status)
    if (sort !== 'last_order_date') params.set('sort', sort)
    if (sortDir !== 'DESC') params.set('sortDir', sortDir)
    if (page > 1) params.set('page', page.toString())
    if (selectedSeller) params.set('sellerId', selectedSeller.id.toString())
    if (selectedSegment) params.set('segmento', selectedSegment)
    setSearchParams(params, { replace: true })
  }, [searchDebounce, status, sort, sortDir, page, selectedSeller, selectedSegment, setSearchParams])

  // Carregar dados
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const params = {
        page,
        limit: 12,
        sort,
        sortDir
      }
      if (searchDebounce) params.search = searchDebounce
      if (status) params.status = status

      // Se for gerente
      if (isManager) {
        if (selectedSeller) {
          // Ver carteira de um vendedor específico
          params.sellerId = selectedSeller.id
        } else if (selectedSegment) {
          // Ver todos os clientes do segmento
          params.segmento = selectedSegment
        }
      }

      const summaryParams = {}
      if (isManager && selectedSeller) {
        summaryParams.sellerId = selectedSeller.id
      } else if (isManager && selectedSegment) {
        summaryParams.segmento = selectedSegment
      }

      const [portfolioResponse, summaryResponse] = await Promise.all([
        customersService.getMyPortfolio(params),
        customersService.getMyPortfolioSummary(summaryParams)
      ])

      if (portfolioResponse.data.success) {
        setCustomers(portfolioResponse.data.data || [])
        setTotalPages(portfolioResponse.data.pagination?.totalPages || 1)
        setTotal(portfolioResponse.data.pagination?.total || 0)
      }

      if (summaryResponse.data.success) {
        setSummary(summaryResponse.data.data)
      }
    } catch (err) {
      console.error('Erro ao carregar carteira:', err)
      setError(err.response?.data?.error?.message || err.message || 'Erro ao carregar carteira')
      toast.error('Erro ao carregar carteira de clientes')
    } finally {
      setLoading(false)
    }
  }, [page, sort, sortDir, searchDebounce, status, isManager, selectedSeller, selectedSegment, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Resetar para página 1 quando filtros mudam
  useEffect(() => {
    setPage(1)
  }, [searchDebounce, status, sort, sortDir, selectedSeller])

  const handleNewLead = (customer) => {
    navigate('/leads/new', { state: { customer } })
  }

  const handleRefresh = () => {
    loadData()
    toast.info('Carteira atualizada')
  }

  const handleExport = async () => {
    try {
      toast.info('Gerando arquivo...')
      const params = {}
      if (searchDebounce) params.search = searchDebounce
      if (status) params.status = status
      if (isManager && selectedSeller) params.sellerId = selectedSeller.id
      else if (isManager && selectedSegment) params.segmento = selectedSegment

      const response = await customersService.exportPortfolio(params)

      // Criar link de download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'carteira.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success('Arquivo exportado!')
    } catch (err) {
      console.error('Erro ao exportar:', err)
      toast.error('Erro ao exportar carteira')
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">
            {isManager && selectedSeller
              ? `Carteira: ${selectedSeller.name}`
              : isManager && selectedSegment && !selectedSeller
                ? `Segmento: ${selectedSegment}`
                : 'Minha Carteira'}
          </Typography>
          {summary && (
            <Typography variant="body2" color="text.secondary">
              {summary.totalCustomers} clientes • {summary.activeCount} ativos • {summary.atRiskCount} em risco • {summary.inactiveCount} inativos
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Filtro de segmento para gerentes */}
          {isManager && segments.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Segmento</InputLabel>
              <Select
                value={selectedSegment}
                label="Segmento"
                onChange={(e) => {
                  setSelectedSegment(e.target.value)
                  setSelectedSeller(null) // Limpar vendedor ao mudar segmento
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                {segments.map(seg => (
                  <MenuItem key={seg} value={seg}>{seg}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {/* Seletor de vendedor para gerentes */}
          {isManager && (
            <Autocomplete
              size="small"
              options={sellers}
              getOptionLabel={(option) => `${option.name} (${option.customersCount} clientes)`}
              value={selectedSeller}
              onChange={(e, newValue) => setSelectedSeller(newValue)}
              loading={loadingSellers}
              sx={{ minWidth: 280 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Ver carteira de"
                  placeholder="Selecione um vendedor"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <PeopleIcon color="action" />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                    endAdornment: (
                      <>
                        {loadingSellers ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...optionProps } = props
                return (
                  <li key={key} {...optionProps}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.customersCount} clientes • {formatCurrency(option.yearTotal)} no ano
                      </Typography>
                    </Box>
                  </li>
                )
              }}
            />
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Atualizar
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            color="success"
          >
            Exportar
          </Button>
        </Box>
      </Box>

      {/* Alerta informativo para gerentes */}
      {isManager && !selectedSeller && !selectedSegment && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Modo Gerente:</strong> Você está vendo sua própria carteira. Selecione um segmento ou vendedor acima para ver outras carteiras.
        </Alert>
      )}
      {isManager && selectedSegment && !selectedSeller && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <strong>Visualizando Segmento {selectedSegment}:</strong> Mostrando todos os clientes de todos os vendedores deste segmento.
        </Alert>
      )}

      {/* Resumo em Cards */}
      {summary && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Paper
            sx={{
              p: 2,
              flex: 1,
              minWidth: 150,
              cursor: 'pointer',
              bgcolor: status === '' ? 'action.selected' : 'background.paper'
            }}
            onClick={() => setStatus('')}
          >
            <Typography variant="h4" fontWeight="bold">{summary.totalCustomers}</Typography>
            <Typography variant="body2" color="text.secondary">Total</Typography>
          </Paper>
          <Paper
            sx={{
              p: 2,
              flex: 1,
              minWidth: 150,
              cursor: 'pointer',
              bgcolor: status === 'active' ? 'success.lighter' : 'background.paper',
              borderLeft: '4px solid',
              borderColor: 'success.main'
            }}
            onClick={() => setStatus(status === 'active' ? '' : 'active')}
          >
            <Typography variant="h4" fontWeight="bold" color="success.main">{summary.activeCount}</Typography>
            <Typography variant="body2" color="text.secondary">🟢 Ativos</Typography>
          </Paper>
          <Paper
            sx={{
              p: 2,
              flex: 1,
              minWidth: 150,
              cursor: 'pointer',
              bgcolor: status === 'at_risk' ? 'warning.lighter' : 'background.paper',
              borderLeft: '4px solid',
              borderColor: 'warning.main'
            }}
            onClick={() => setStatus(status === 'at_risk' ? '' : 'at_risk')}
          >
            <Typography variant="h4" fontWeight="bold" color="warning.main">{summary.atRiskCount}</Typography>
            <Typography variant="body2" color="text.secondary">🟡 Em Risco</Typography>
          </Paper>
          <Paper
            sx={{
              p: 2,
              flex: 1,
              minWidth: 150,
              cursor: 'pointer',
              bgcolor: status === 'inactive' ? 'error.lighter' : 'background.paper',
              borderLeft: '4px solid',
              borderColor: 'error.main'
            }}
            onClick={() => setStatus(status === 'inactive' ? '' : 'inactive')}
          >
            <Typography variant="h4" fontWeight="bold" color="error.main">{summary.inactiveCount}</Typography>
            <Typography variant="body2" color="text.secondary">🔴 Inativos</Typography>
          </Paper>
        </Box>
      )}

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Buscar cliente..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 250, flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              )
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              label="Status"
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Ordenar por</InputLabel>
            <Select
              value={sort}
              label="Ordenar por"
              onChange={(e) => setSort(e.target.value)}
            >
              {SORT_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <ToggleButtonGroup
            value={sortDir}
            exclusive
            onChange={(e, val) => val && setSortDir(val)}
            size="small"
          >
            <ToggleButton value="DESC">↓</ToggleButton>
            <ToggleButton value="ASC">↑</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, val) => val && setViewMode(val)}
            size="small"
          >
            <ToggleButton value="grid"><GridViewIcon /></ToggleButton>
            <ToggleButton value="list"><ListViewIcon /></ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>

      {/* Erro */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Lista de Clientes */}
      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Paper sx={{ p: 2 }}>
                <Skeleton variant="text" width="60%" height={28} />
                <Skeleton variant="text" width="40%" height={20} />
                <Skeleton variant="text" width="80%" height={20} sx={{ mt: 2 }} />
                <Skeleton variant="rectangular" height={60} sx={{ mt: 2 }} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : customers.length === 0 ? (
        <EmptyState
          icon="search"
          title="Nenhum cliente encontrado"
          description={
            search || status
              ? "Tente ajustar os filtros de busca"
              : "Sua carteira de clientes está vazia"
          }
          size="large"
        />
      ) : (
        <>
          <Grid container spacing={2}>
            {customers.map(customer => (
              <Grid
                item
                xs={12}
                sm={viewMode === 'grid' ? 6 : 12}
                md={viewMode === 'grid' ? 4 : 12}
                key={customer.id}
              >
                <CustomerCard customer={customer} onNewLead={handleNewLead} />
              </Grid>
            ))}
          </Grid>

          {/* Paginação */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, newPage) => setPage(newPage)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}

          {/* Info de resultados */}
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
            Mostrando {customers.length} de {total} clientes
          </Typography>
        </>
      )}
    </Box>
  )
}

export default MyCustomersPage
