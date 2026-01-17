import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert
} from '@mui/material'
import { pricingService } from '../services/api'

function QuantityDiscountsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await pricingService.getQuantityDiscounts()
        if (response.data.success) {
          setRows(response.data.data || [])
        } else {
          setError(response.data.error?.message || 'Erro ao carregar descontos por quantidade')
        }
      } catch (err) {
        setError(err.response?.data?.error?.message || err.message || 'Erro ao carregar descontos por quantidade')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const columns = useMemo(() => {
    const first = rows?.[0]
    if (!first) return []

    const hidden = [
      'created_by',
      'created_at',
      'updated_at'
    ]
    const preferred = [
      'id',
      'sku_id',
      'product_brand',
      'product_model',
      'brand_id',
      'min_quantity',
      'max_quantity',
      'price',
      'discount_pct',
      'description',
      'is_active',
      'priority'
    ]

    const keys = Object.keys(first).filter((k) => !hidden.includes(k))
    const rest = keys.filter((k) => !preferred.includes(k))
    return [...preferred.filter((k) => keys.includes(k)), ...rest]
  }, [rows])

  const headerLabel = (key) => {
    if (key === 'id') return 'ID'
    if (key === 'sku_id') return 'SKU'
    if (key === 'product_brand') return 'Marca'
    if (key === 'product_model') return 'Modelo'
    if (key === 'brand_id') return 'ID da Marca'
    if (key === 'min_quantity') return 'Qtd. mín.'
    if (key === 'max_quantity') return 'Qtd. máx.'
    if (key === 'price') return 'Preço'
    if (key === 'discount_pct') return 'Desconto (%)'
    if (key === 'description') return 'Descrição'
    if (key === 'is_active') return 'Ativo'
    if (key === 'priority') return 'Prioridade'
    return key
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Desconto por Quantidade
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper>
          {rows.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Nenhum registro encontrado.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {columns.map((col) => (
                      <TableCell key={col} sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {headerLabel(col)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={row.id ?? idx} hover>
                      {columns.map((col) => (
                        <TableCell key={`${idx}-${col}`}>
                          {row?.[col] === null || row?.[col] === undefined ? '' : String(row[col])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}
    </Box>
  )
}

export default QuantityDiscountsPage
