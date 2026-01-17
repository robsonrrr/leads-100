import { useState, useEffect } from 'react'
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
  Chip,
  CircularProgress,
  Alert
} from '@mui/material'
import { promotionsService } from '../services/api'
import { formatCurrency, formatDate } from '../utils'

function ActivePromotions({ selectedSegment = null }) {
  const [promotions, setPromotions] = useState([])
  const [waveInfo, setWaveInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPromotions()
  }, [selectedSegment])

  const loadPromotions = async () => {
    try {
      setLoading(true)
      setError('')
      // Passar segmento para filtrar promoções
      const segment = selectedSegment && selectedSegment !== '' ? selectedSegment : null
      const response = await promotionsService.getActive(segment)
      if (response.data.success) {
        setPromotions(response.data.data.promotions || [])
        setWaveInfo(response.data.data.waveInfo || null)
      }
    } catch (err) {
      console.error('Erro ao carregar promoções:', err)
      setError(err.response?.data?.error?.message || 'Erro ao carregar promoções ativas')
    } finally {
      setLoading(false)
    }
  }

  // Usar formatDate com opção de horário para último update
  const formatDateTime = (dateString) => formatDate(dateString, { includeTime: true })

  const formatTime = (timeValue) => {
    if (!timeValue) return '-'
    // Se já estiver formatado como "40h", retornar como está
    if (typeof timeValue === 'string' && timeValue.includes('h')) {
      return timeValue
    }
    // Se for um número, assumir que são horas
    if (typeof timeValue === 'number') {
      return `${timeValue}h`
    }
    return timeValue
  }

  const getStockBadgeColor = (stockStatus) => {
    if (!stockStatus) return 'default'
    const status = String(stockStatus).toLowerCase()
    if (status === 'very_high' || status === 'high') return 'error'
    if (status === 'medium') return 'warning'
    if (status === 'low') return 'info'
    return 'default'
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  if (promotions.length === 0) {
    return null // Não mostrar nada se não houver promoções
  }

  return (
    <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
      {/* Informações da última onda */}
      {waveInfo && (
        <Box sx={{ mb: 2, display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Última onda:</strong> {formatDateTime(waveInfo.last_updated)}
          </Typography>
          {waveInfo.wave_id && (
            <Typography variant="body2" color="text.secondary">
              <strong>Wave ID:</strong> {waveInfo.wave_id}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            <strong>Produtos:</strong> {waveInfo.product_count || promotions.length}
          </Typography>
        </Box>
      )}

      {/* Título da seção */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        🔥 Promoções Ativas
      </Typography>

      {/* Tabela de promoções */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>SKU</strong></TableCell>
              <TableCell><strong>MARCA</strong></TableCell>
              <TableCell><strong>MODELO</strong></TableCell>
              <TableCell><strong>SEGMENTO</strong></TableCell>
              <TableCell align="right"><strong>PREÇO ORIGINAL</strong></TableCell>
              <TableCell align="right"><strong>PREÇO PROMO</strong></TableCell>
              <TableCell align="center"><strong>DESCONTO</strong></TableCell>
              <TableCell align="center"><strong>ESTOQUE</strong></TableCell>
              <TableCell align="center"><strong>TEMPO</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {promotions.map((promo, index) => (
              <TableRow key={promo.sku || index} hover>
                <TableCell>{promo.sku || '-'}</TableCell>
                <TableCell>{promo.marca || '-'}</TableCell>
                <TableCell>{promo.modelo || '-'}</TableCell>
                <TableCell>
                  <Chip 
                    label={promo.segmento || 'Sem segmento'} 
                    size="small" 
                    color={promo.segmento ? 'primary' : 'default'}
                    variant={promo.segmento ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(promo.preco_original)}
                </TableCell>
                <TableCell align="right">
                  <Typography sx={{ color: 'success.main', fontWeight: 600 }}>
                    {formatCurrency(promo.preco_promo)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${promo.desconto || 0}% OFF`}
                    color="error"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={promo.estoque || '-'}
                    color={getStockBadgeColor(promo.estoque)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  {formatTime(promo.tempo)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

export default ActivePromotions
