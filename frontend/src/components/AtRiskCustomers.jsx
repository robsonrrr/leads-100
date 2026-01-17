import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Skeleton,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  Warning as WarningIcon,
  Phone as PhoneIcon,
  Add as AddIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material'
import { alertsService } from '../services/api'
import { formatCurrency } from '../utils'

function AtRiskCustomers({ sellerId, sellerSegmento, limit = 5 }) {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCustomers()
  }, [sellerId, sellerSegmento, limit])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const params = { limit }
      if (sellerId) params.sellerId = sellerId
      else if (sellerSegmento) params.sellerSegmento = sellerSegmento
      
      const response = await alertsService.getAtRiskCustomers(params)
      if (response.data.success) {
        setCustomers(response.data.data || [])
      }
    } catch (err) {
      console.error('Erro ao carregar clientes em risco:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="text" width={180} height={28} />
          <Skeleton variant="rounded" width={80} height={32} />
        </Box>
        {[1, 2, 3].map(i => (
          <Box key={i} sx={{ display: 'flex', gap: 2, mb: 1 }}>
            <Skeleton variant="text" width="60%" height={40} />
            <Skeleton variant="text" width="30%" height={40} />
          </Box>
        ))}
      </Paper>
    )
  }

  if (customers.length === 0) {
    return null // Não mostrar widget se não houver clientes em risco
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          <Typography variant="h6" fontWeight="bold">
            Clientes em Risco
          </Typography>
          <Chip 
            label={customers.length} 
            size="small" 
            color="warning"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
        <Button
          size="small"
          endIcon={<ChevronRightIcon />}
          onClick={() => navigate('/customers?status=at_risk')}
        >
          Ver Todos
        </Button>
      </Box>

      <List dense disablePadding>
        {customers.map((customer) => (
          <ListItem
            key={customer.id}
            sx={{
              px: 1,
              py: 1,
              borderRadius: 1,
              mb: 0.5,
              bgcolor: 'warning.lighter',
              '&:hover': { bgcolor: 'warning.light' }
            }}
            secondaryAction={
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {customer.phone && (
                  <Tooltip title={`Ligar: ${customer.phone}`}>
                    <IconButton
                      size="small"
                      color="primary"
                      href={`tel:${customer.phone.replace(/\D/g, '')}`}
                    >
                      <PhoneIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Nova Cotação">
                  <IconButton
                    size="small"
                    color="success"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/leads/new?customerId=${customer.id}`)
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            }
          >
            <ListItemText
              primary={
                <Box 
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
                  onClick={() => navigate(`/customers/${customer.id}`)}
                >
                  <Typography variant="body2" fontWeight="medium" noWrap sx={{ maxWidth: 200 }}>
                    {customer.tradeName || customer.name}
                  </Typography>
                  <Chip
                    label={`${customer.daysSinceOrder} dias`}
                    size="small"
                    color="warning"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                </Box>
              }
              secondary={
                <Typography variant="caption" color="text.secondary">
                  Último: {formatCurrency(customer.lastOrderValue)}
                  {customer.sellerName && ` • ${customer.sellerName}`}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  )
}

export default AtRiskCustomers
