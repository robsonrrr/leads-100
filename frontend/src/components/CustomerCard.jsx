import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material'
import {
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatDate } from '../utils'

const STATUS_CONFIG = {
  active: {
    label: 'Ativo',
    color: 'success',
    icon: '🟢'
  },
  at_risk: {
    label: 'Em Risco',
    color: 'warning',
    icon: '🟡'
  },
  inactive: {
    label: 'Inativo',
    color: 'error',
    icon: '🔴'
  }
}

function CustomerCard({ customer, onNewLead }) {
  const navigate = useNavigate()
  const statusConfig = STATUS_CONFIG[customer.status] || STATUS_CONFIG.inactive

  const handleNewLead = () => {
    if (onNewLead) {
      onNewLead(customer)
    } else {
      // Navegar para criar lead com cliente pré-selecionado
      navigate('/leads/new', { state: { customer } })
    }
  }

  return (
    <Paper
      sx={{
        p: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <BusinessIcon color="action" />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight="bold" noWrap>
              {customer.tradeName || customer.name}
            </Typography>
            {customer.tradeName && customer.name !== customer.tradeName && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {customer.name}
              </Typography>
            )}
          </Box>
        </Box>
        <Chip
          label={statusConfig.label}
          color={statusConfig.color}
          size="small"
          icon={<span>{statusConfig.icon}</span>}
        />
      </Box>

      {/* Info */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <LocationIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {customer.city}/{customer.state}
          </Typography>
        </Box>
        {customer.phone && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PhoneIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {customer.phone}
            </Typography>
          </Box>
        )}
        {customer.sellerName && (
          <Typography variant="caption" color="primary.main" sx={{ mt: 0.5, display: 'block' }}>
            👤 {customer.sellerName}
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 1.5 }} />

      {/* Métricas */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Último Pedido
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {customer.lastOrder ? formatDate(customer.lastOrder.date) : 'Nunca'}
          </Typography>
          {customer.lastOrder && (
            <Typography variant="caption" color="text.secondary">
              {formatCurrency(customer.lastOrder.value)}
            </Typography>
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Total {new Date().getFullYear()}
          </Typography>
          <Typography variant="body2" fontWeight="bold" color="primary.main">
            {formatCurrency(customer.yearTotal)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {customer.yearOrdersCount} pedido{customer.yearOrdersCount !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </Box>

      {/* Alerta de dias sem compra */}
      {customer.daysSinceOrder !== null && customer.daysSinceOrder > 30 && (
        <Box
          sx={{
            bgcolor: customer.status === 'inactive' ? 'error.lighter' : 'warning.lighter',
            borderRadius: 1,
            p: 1,
            mb: 2
          }}
        >
          <Typography
            variant="caption"
            color={customer.status === 'inactive' ? 'error.dark' : 'warning.dark'}
            fontWeight="medium"
          >
            ⚠️ Sem compra há {customer.daysSinceOrder} dias
          </Typography>
        </Box>
      )}

      {/* Ações */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Tooltip title="Ver histórico">
          <IconButton
            size="small"
            onClick={() => navigate(`/customers/${customer.id}`)}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleNewLead}
        >
          Nova Cotação
        </Button>
      </Box>
    </Paper>
  )
}

export default CustomerCard
