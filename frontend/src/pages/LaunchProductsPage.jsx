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

function LaunchProductsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await pricingService.getLaunchProducts()
        if (response.data.success) {
          setRows(response.data.data || [])
        } else {
          setError(response.data.error?.message || 'Erro ao carregar lançamentos')
        }
      } catch (err) {
        setError(err.response?.data?.error?.message || err.message || 'Erro ao carregar lançamentos')
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
      'id',
      'sku_id',
      'brand_id',
      'price_floor',
      'created_by',
      'is_active',
      'created_at',
      'updated_at'
    ]

    const preferred = [
      'product_brand',
      'product_model',
      'product_name',
      'launch_price',
      'regular_price',
      'price_pt',
      'launch_start',
      'launch_end',
      'ignore_lpp_until',
      'max_discount_pct',
      'notes',
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
    if (key === 'product_name') return 'Nome'
    if (key === 'brand_id') return 'brand_id'
    if (key === 'launch_price') return 'Preço de Lançamento'
    if (key === 'regular_price') return 'Preço Regular'
    if (key === 'price_pt') return 'Preço de Tela'
    if (key === 'price_floor') return 'price_floor'
    if (key === 'launch_start') return 'Inicio Lançamento'
    if (key === 'launch_end') return 'Fim Lançamento'
    if (key === 'ignore_lpp_until') return 'Ignorasr Ultimo Preço'
    if (key === 'max_discount_pct') return 'Max Discount Pct'
    if (key === 'notes') return 'notes'
    if (key === 'created_by') return 'created_by'
    if (key === 'is_active') return 'is_active'
    if (key === 'created_at') return 'created_at'
    if (key === 'updated_at') return 'updated_at'
    return key
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Lançamentos
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

export default LaunchProductsPage
