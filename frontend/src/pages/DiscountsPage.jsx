import { useState, useEffect } from 'react'
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon
} from '@mui/icons-material'
import { pricingService } from '../services/api'
import { formatCurrency } from '../utils'

function DiscountsPage() {
  const [discounts, setDiscounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingCell, setEditingCell] = useState(null) // { rowIndex, field }

  useEffect(() => {
    loadDiscounts()
  }, [])

  const loadDiscounts = async () => {
    try {
      setLoading(true)
      setError('')
      // TODO: Implementar endpoint no backend para buscar descontos
      // Por enquanto, usando dados mockados
      const mockDiscounts = [
        { id: 1, minValue: 0, maxValue: 1000, discount: 0 },
        { id: 2, minValue: 1000, maxValue: 5000, discount: 0.02 },
        { id: 3, minValue: 5000, maxValue: 10000, discount: 0.05 },
        { id: 4, minValue: 10000, maxValue: 50000, discount: 0.08 },
        { id: 5, minValue: 50000, maxValue: null, discount: 0.10 }
      ]
      setDiscounts(mockDiscounts)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar descontos')
    } finally {
      setLoading(false)
    }
  }

  const handleCellEdit = (rowIndex, field, value) => {
    const updated = [...discounts]
    updated[rowIndex] = {
      ...updated[rowIndex],
      [field]: field === 'discount' ? parseFloat(value) || 0 : parseFloat(value) || 0
    }
    setDiscounts(updated)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      
      // TODO: Implementar endpoint no backend para salvar descontos
      // await pricingService.saveDiscounts(discounts)
      
      // Simulação de salvamento
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setSuccess('Descontos salvos com sucesso!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao salvar descontos')
    } finally {
      setSaving(false)
    }
  }

  const handleAddRow = () => {
    const newId = Math.max(...discounts.map(d => d.id), 0) + 1
    setDiscounts([
      ...discounts,
      {
        id: newId,
        minValue: discounts.length > 0 ? discounts[discounts.length - 1].maxValue || 0 : 0,
        maxValue: null,
        discount: 0
      }
    ])
  }

  const handleDeleteRow = (id) => {
    if (discounts.length <= 1) {
      setError('É necessário manter pelo menos uma faixa de desconto')
      return
    }
    setDiscounts(discounts.filter(d => d.id !== id))
  }

  const formatPercent = (value) => {
    return `${(value * 100).toFixed(2)}%`
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Descontos por Valor do Pedido
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddRow}
          >
            Adicionar Faixa
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : 'Salvar'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Valor Mínimo</TableCell>
                <TableCell>Valor Máximo</TableCell>
                <TableCell align="right">Desconto (%)</TableCell>
                <TableCell align="center" width={100}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {discounts.map((discount, index) => (
                <TableRow key={discount.id}>
                  <TableCell>
                    <TextField
                      type="number"
                      value={discount.minValue || ''}
                      onChange={(e) => handleCellEdit(index, 'minValue', e.target.value)}
                      inputProps={{ min: 0, step: 0.01 }}
                      size="small"
                      fullWidth
                      onFocus={() => setEditingCell({ rowIndex: index, field: 'minValue' })}
                      onBlur={() => setEditingCell(null)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={discount.maxValue === null ? '' : discount.maxValue}
                      onChange={(e) => handleCellEdit(index, 'maxValue', e.target.value === '' ? null : e.target.value)}
                      inputProps={{ min: 0, step: 0.01 }}
                      size="small"
                      fullWidth
                      placeholder="Sem limite"
                      onFocus={() => setEditingCell({ rowIndex: index, field: 'maxValue' })}
                      onBlur={() => setEditingCell(null)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      value={((discount.discount || 0) * 100).toFixed(2)}
                      onChange={(e) => {
                        const percentValue = parseFloat(e.target.value) || 0
                        handleCellEdit(index, 'discount', percentValue / 100)
                      }}
                      inputProps={{ min: 0, max: 100, step: 0.01 }}
                      size="small"
                      sx={{ width: 120 }}
                      InputProps={{
                        endAdornment: <Typography variant="body2" sx={{ ml: 1 }}>%</Typography>
                      }}
                      onFocus={() => setEditingCell({ rowIndex: index, field: 'discount' })}
                      onBlur={() => setEditingCell(null)}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteRow(discount.id)}
                      disabled={discounts.length <= 1}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Instruções:</strong> Configure as faixas de desconto baseadas no valor total do pedido.
          O desconto é aplicado como percentual (ex: 0.05 = 5%). Deixe o valor máximo vazio para indicar "sem limite".
        </Typography>
      </Box>
    </Container>
  )
}

export default DiscountsPage
