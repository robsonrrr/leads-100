import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
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
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  Alert,
  Autocomplete,
  CircularProgress,
  Tooltip,
  Grid
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Flag as FlagIcon,
  People as PeopleIcon
} from '@mui/icons-material'
import { goalsService, customersService } from '../services/api'
import { formatCurrency } from '../utils'
import { useToast } from '../contexts/ToastContext'

const MONTHS = [
  { value: null, label: 'Anual' },
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' }
]

function GoalsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()
  const { user } = useSelector((state) => state.auth)
  const isManager = (user?.level || 0) > 4

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  // Estados
  const [teamProgress, setTeamProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(parseInt(searchParams.get('year')) || currentYear)
  const [month, setMonth] = useState(parseInt(searchParams.get('month')) || currentMonth)
  const [segments, setSegments] = useState([])
  const [selectedSegment, setSelectedSegment] = useState(searchParams.get('segmento') || '')
  const [sellers, setSellers] = useState([])
  const [loadingSellers, setLoadingSellers] = useState(false)

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [formData, setFormData] = useState({
    sellerId: null,
    year: currentYear,
    month: null,
    targetValue: '',
    targetOrders: '',
    notes: ''
  })

  // Carregar segmentos
  useEffect(() => {
    if (isManager) {
      customersService.getSellerSegments()
        .then(response => {
          if (response.data.success) {
            setSegments(response.data.data || [])
          }
        })
        .catch(err => console.error('Erro ao carregar segmentos:', err))
    }
  }, [isManager])

  // Carregar vendedores
  useEffect(() => {
    if (isManager) {
      setLoadingSellers(true)
      const params = selectedSegment ? { segmento: selectedSegment } : {}
      customersService.getSellers(params)
        .then(response => {
          if (response.data.success) {
            setSellers(response.data.data || [])
          }
        })
        .catch(err => console.error('Erro ao carregar vendedores:', err))
        .finally(() => setLoadingSellers(false))
    }
  }, [isManager, selectedSegment])

  // Carregar progresso da equipe
  useEffect(() => {
    if (!isManager) {
      return
    }

    loadTeamProgress()
  }, [year, month, selectedSegment, isManager])

  // Atualizar URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (year !== currentYear) params.set('year', year.toString())
    if (month !== currentMonth) params.set('month', month.toString())
    if (selectedSegment) params.set('segmento', selectedSegment)
    setSearchParams(params, { replace: true })
  }, [year, month, selectedSegment, setSearchParams])

  const loadTeamProgress = async () => {
    try {
      if (!isManager) {
        return
      }

      setLoading(true)
      const params = { year, month }
      if (selectedSegment) params.segmento = selectedSegment

      const response = await goalsService.getTeamProgress(params)
      if (response.data.success) {
        setTeamProgress(response.data.data || [])
      }
    } catch (err) {
      console.error('Erro ao carregar progresso:', err)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (seller = null) => {
    if (seller) {
      // Editar meta existente do vendedor
      setFormData({
        sellerId: { id: seller.sellerId, nick: seller.sellerName },
        year,
        month,
        targetValue: seller.monthly.target || '',
        targetOrders: '',
        notes: ''
      })
      setEditingGoal(seller)
    } else {
      // Nova meta
      setFormData({
        sellerId: null,
        year,
        month,
        targetValue: '',
        targetOrders: '',
        notes: ''
      })
      setEditingGoal(null)
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingGoal(null)
  }

  const handleSubmit = async () => {
    try {
      if (!formData.sellerId || !formData.targetValue) {
        toast.error('Preencha vendedor e valor da meta')
        return
      }

      const data = {
        sellerId: formData.sellerId.id,
        year: formData.year,
        month: formData.month,
        targetValue: parseFloat(formData.targetValue),
        targetOrders: formData.targetOrders ? parseInt(formData.targetOrders) : null,
        notes: formData.notes || null
      }

      await goalsService.create(data)
      toast.success('Meta salva com sucesso')
      handleCloseDialog()
      loadTeamProgress()
    } catch (err) {
      console.error('Erro ao salvar meta:', err)
      toast.error(err.response?.data?.error?.message || 'Erro ao salvar')
    }
  }

  const getProgressColor = (percent) => {
    if (percent >= 100) return 'success'
    if (percent >= 70) return 'primary'
    if (percent >= 40) return 'warning'
    return 'error'
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

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FlagIcon color="primary" fontSize="large" />
          <Typography variant="h4">Metas</Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Ano</InputLabel>
            <Select
              value={year}
              label="Ano"
              onChange={(e) => setYear(e.target.value)}
            >
              {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Mês</InputLabel>
            <Select
              value={month}
              label="Mês"
              onChange={(e) => setMonth(e.target.value)}
            >
              {MONTHS.filter(m => m.value !== null).map(m => (
                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {segments.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Segmento</InputLabel>
              <Select
                value={selectedSegment}
                label="Segmento"
                onChange={(e) => setSelectedSegment(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {segments.map(seg => (
                  <MenuItem key={seg} value={seg}>{seg}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nova Meta
          </Button>
        </Box>
      </Box>

      {/* Tabela de Progresso */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vendedor</TableCell>
                <TableCell>Segmento</TableCell>
                <TableCell align="right">Meta Mês</TableCell>
                <TableCell align="right">Realizado</TableCell>
                <TableCell align="center" sx={{ minWidth: 200 }}>Progresso</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : teamProgress.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    Nenhum vendedor encontrado
                  </TableCell>
                </TableRow>
              ) : (
                teamProgress.map((seller) => (
                  <TableRow key={seller.sellerId} hover>
                    <TableCell>
                      <Typography fontWeight="medium">{seller.sellerName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={seller.segmento || '-'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      {seller.monthly.target > 0 
                        ? formatCurrency(seller.monthly.target)
                        : <Typography color="text.secondary" variant="body2">Não definida</Typography>
                      }
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(seller.monthly.achieved)}
                    </TableCell>
                    <TableCell>
                      {seller.monthly.target > 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min(seller.monthly.progress, 100)}
                            color={getProgressColor(seller.monthly.progress)}
                            sx={{ flex: 1, height: 8, borderRadius: 1 }}
                          />
                          <Chip 
                            label={`${seller.monthly.progress}%`}
                            size="small"
                            color={getProgressColor(seller.monthly.progress)}
                          />
                        </Box>
                      ) : (
                        <Typography color="text.secondary" variant="body2" textAlign="center">-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Definir/Editar Meta">
                        <IconButton size="small" onClick={() => handleOpenDialog(seller)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog para criar/editar meta */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingGoal ? `Meta - ${editingGoal.sellerName}` : 'Nova Meta'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {!editingGoal && (
              <Autocomplete
                options={sellers}
                getOptionLabel={(option) => option.nick || option.user || ''}
                value={formData.sellerId}
                onChange={(_, value) => setFormData({ ...formData, sellerId: value })}
                loading={loadingSellers}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Vendedor"
                    required
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <PeopleIcon color="action" sx={{ mr: 1 }} />
                    }}
                  />
                )}
              />
            )}

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Ano</InputLabel>
                  <Select
                    value={formData.year}
                    label="Ano"
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  >
                    {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                      <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Período</InputLabel>
                  <Select
                    value={formData.month}
                    label="Período"
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  >
                    {MONTHS.map(m => (
                      <MenuItem key={m.value || 'annual'} value={m.value}>{m.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              label="Meta de Vendas (R$)"
              type="number"
              value={formData.targetValue}
              onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
              required
              InputProps={{ inputProps: { min: 0 } }}
            />

            <TextField
              label="Meta de Pedidos (opcional)"
              type="number"
              value={formData.targetOrders}
              onChange={(e) => setFormData({ ...formData, targetOrders: e.target.value })}
              InputProps={{ inputProps: { min: 0 } }}
            />

            <TextField
              label="Observações"
              multiline
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default GoalsPage
