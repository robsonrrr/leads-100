import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip
} from '@mui/material'
import TargetIcon from '@mui/icons-material/GpsFixed'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { analyticsV2Service } from '../services/api'

function CustomerGoalsPage() {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const now = useMemo(() => new Date(), [])

  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [classification, setClassification] = useState('all')
  const [monthStatus, setMonthStatus] = useState('all')
  const [gapFilter, setGapFilter] = useState('all')
  const [orderBy, setOrderBy] = useState('penetration_priority')
  const [search, setSearch] = useState('')

  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [items, setItems] = useState([])
  const [offset, setOffset] = useState(0)

  // AbortController ref for cancelling previous requests
  const abortControllerRef = useRef(null)

  const limit = 50

  const sellerId = user?.id

  const fetchData = useCallback(async ({ append } = { append: false }) => {
    if (!sellerId) return

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    const controller = new AbortController()
    abortControllerRef.current = controller

    if (append) setLoadingMore(true)
    else setLoading(true)

    setError(null)
    try {
      const response = await analyticsV2Service.getCustomerGoalsBySeller(sellerId, {
        year,
        month,
        classification: classification !== 'all' ? classification : null,
        limit,
        offset: append ? offset : 0,
        order_by: orderBy
      }, { signal: controller.signal })

      if (response.data?.success) {
        const payload = response.data.data
        setData(payload)
        const nextCustomers = Array.isArray(payload?.customers) ? payload.customers : []
        setItems((prev) => (append ? [...prev, ...nextCustomers] : nextCustomers))
        setOffset((prev) => (append ? prev + limit : limit))
      } else {
        setError('Erro ao carregar metas')
      }
    } catch (e) {
      // Ignore abort errors
      if (e?.name === 'AbortError' || e?.name === 'CanceledError') return
      setError(e?.message || 'Erro ao carregar metas')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [sellerId, year, month, classification, orderBy, offset, limit])

  useEffect(() => {
    setOffset(0)
    setItems([])
    if (!sellerId) return
    fetchData({ append: false })

    // Cleanup: cancel request on unmount or dependency change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [sellerId, year, month, classification, orderBy])

  // Handle follow-up action - navigate to customer page with follow-up tab
  const handleFollowUp = useCallback((customerId, customerName) => {
    navigate(`/customers/${customerId}?tab=followup`, {
      state: { action: 'new-followup', customerName }
    })
  }, [navigate])

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items
      .filter((c) => {
        if (!q) return true
        return (
          (c.customer_name || '').toLowerCase().includes(q) ||
          (c.city || '').toLowerCase().includes(q)
        )
      })
      .filter((c) => {
        if (monthStatus === 'active') return (c.sold_month || 0) > 0
        if (monthStatus === 'inactive') return (c.sold_month || 0) <= 0
        return true
      })
      .filter((c) => {
        if (gapFilter === 'gap') return (c.gap || 0) > 0
        if (gapFilter === 'hit') return (c.gap || 0) <= 0
        return true
      })
  }, [items, search, monthStatus, gapFilter])

  const totals = data?.totals || {}
  const totalCustomers = totals.total_customers || 0
  const activeCustomersMonth = totals.active_customers_month || 0
  const penetrationMonthPct = totals.penetration_month_pct || 0
  const inactiveCustomersMonth = Math.max(totalCustomers - activeCustomersMonth, 0)

  const monthlyTargetFactor = 11.5
  const monthlyGoal = totals.total_goal ? Math.round(totals.total_goal / monthlyTargetFactor) : 0
  const soldMonthTotal = totals.total_sold_month || 0
  const monthlyAchievementPct = monthlyGoal > 0 ? Math.round((soldMonthTotal / monthlyGoal) * 100) : 0

  const formatDate = (value) => {
    if (!value) return '-'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('pt-BR')
  }

  const formatInt = (value) => {
    const n = Number(value || 0)
    return n.toLocaleString('pt-BR')
  }

  if (!sellerId) {
    return (
      <Box>
        <Alert severity="warning">Usuário não identificado.</Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <TargetIcon color="primary" fontSize="large" />
        <Typography variant="h4">Metas por Cliente</Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Ano</InputLabel>
              <Select value={year} label="Ano" onChange={(e) => setYear(e.target.value)}>
                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Mês</InputLabel>
              <Select value={month} label="Mês" onChange={(e) => setMonth(e.target.value)}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <MenuItem key={m} value={m}>{String(m).padStart(2, '0')}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Classe</InputLabel>
              <Select value={classification} label="Classe" onChange={(e) => setClassification(e.target.value)}>
                <MenuItem value="all">Todas</MenuItem>
                <MenuItem value="A">A</MenuItem>
                <MenuItem value="B">B</MenuItem>
                <MenuItem value="C">C</MenuItem>
                <MenuItem value="I">I</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status mês</InputLabel>
              <Select value={monthStatus} label="Status mês" onChange={(e) => setMonthStatus(e.target.value)}>
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="inactive">Sem compra no mês</MenuItem>
                <MenuItem value="active">Comprou no mês</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Gap</InputLabel>
              <Select value={gapFilter} label="Gap" onChange={(e) => setGapFilter(e.target.value)}>
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="gap">Gap &gt; 0</MenuItem>
                <MenuItem value="hit">Meta atingida</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Ordenar</InputLabel>
              <Select value={orderBy} label="Ordenar" onChange={(e) => setOrderBy(e.target.value)}>
                <MenuItem value="penetration_priority">Prioridade penetração</MenuItem>
                <MenuItem value="gap">Maior gap</MenuItem>
                <MenuItem value="goal">Maior meta</MenuItem>
                <MenuItem value="achievement">Maior atingimento</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Buscar cliente"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Button variant="outlined" onClick={() => fetchData({ append: false })} disabled={loading || loadingMore}>
              Atualizar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">Penetração do mês</Typography>
            <Typography variant="h4" fontWeight="bold">{penetrationMonthPct}%</Typography>
            <Typography variant="caption" color="text.secondary">
              {formatInt(activeCustomersMonth)} / {formatInt(totalCustomers)} clientes
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">Sem compra no mês</Typography>
            <Typography variant="h4" fontWeight="bold">{formatInt(inactiveCustomersMonth)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">Compraram no mês</Typography>
            <Typography variant="h4" fontWeight="bold">{formatInt(activeCustomersMonth)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">Meta mês vs Comprou mês</Typography>
            <Typography variant="h6" fontWeight="bold">
              {formatInt(soldMonthTotal)} / {formatInt(monthlyGoal)}
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                label={`${monthlyAchievementPct}%`}
                color={monthlyAchievementPct >= 80 ? 'success' : monthlyAchievementPct >= 50 ? 'info' : monthlyAchievementPct >= 25 ? 'warning' : 'error'}
              />
              <Chip size="small" variant="outlined" label={`Meta anual: ${formatInt(totals.total_goal || 0)}`} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" action={<Button onClick={() => fetchData({ append: false })}>Tentar novamente</Button>}>
            {error}
          </Alert>
        ) : filteredItems.length === 0 ? (
          <Alert severity="info">Nenhum cliente encontrado para os filtros atuais.</Alert>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell align="center">Classe</TableCell>
                    <TableCell align="right">Comprou mês</TableCell>
                    <TableCell align="right">Última compra</TableCell>
                    <TableCell align="right">Meta mês</TableCell>
                    <TableCell align="right">Meta</TableCell>
                    <TableCell align="right">Gap</TableCell>
                    <TableCell align="center">%</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.map((c) => {
                    const active = (c.sold_month || 0) > 0
                    const customerMonthlyGoal = c.goal_2026 ? Math.round(c.goal_2026 / monthlyTargetFactor) : 0
                    const monthlyGap = Math.max(customerMonthlyGoal - (c.sold_month || 0), 0)
                    const monthlyAchievementPct = customerMonthlyGoal > 0 ? Math.round(((c.sold_month || 0) / customerMonthlyGoal) * 100) : 0
                    return (
                      <TableRow key={c.customer_id} hover>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 260 }}>
                            {c.customer_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {c.city}{c.state ? `/${c.state}` : ''}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={c.classification}
                            color={c.classification === 'A' ? 'success' : c.classification === 'B' ? 'info' : c.classification === 'C' ? 'warning' : c.classification === 'I' ? 'error' : 'default'}
                            variant={active ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={formatInt(c.sold_month || 0)}
                            color={active ? 'success' : 'default'}
                            variant={active ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell align="right">{formatDate(c.last_purchase_date)}</TableCell>
                        <TableCell align="right">{formatInt(customerMonthlyGoal)}</TableCell>
                        <TableCell align="right">{formatInt(c.goal_2026)}</TableCell>
                        <TableCell align="right">{formatInt(monthlyGap)}</TableCell>
                        <TableCell align="center">{monthlyAchievementPct}%</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <Tooltip title="Abrir cliente">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => navigate(`/customers/${c.customer_id}`)}
                              >
                                <OpenInNewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Iniciar follow-up">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleFollowUp(c.customer_id, c.customer_name)}
                              >
                                <PlayArrowIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => fetchData({ append: true })}
                disabled={loadingMore}
              >
                {loadingMore ? <CircularProgress size={18} /> : 'Carregar mais'}
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  )
}

export default CustomerGoalsPage
