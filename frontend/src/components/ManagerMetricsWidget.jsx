import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Skeleton,
  Chip
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as OrdersIcon,
  People as PeopleIcon,
  Warning as WarningIcon,
  Assignment as LeadsIcon
} from '@mui/icons-material'
import { analyticsService } from '../services/api'
import { formatCurrency } from '../utils'

function MetricCard({ title, value, subValue, icon, change, color = 'primary' }) {
  const Icon = icon
  
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5 }}>
            {value}
          </Typography>
          {subValue && (
            <Typography variant="caption" color="text.secondary">
              {subValue}
            </Typography>
          )}
        </Box>
        <Box 
          sx={{ 
            p: 1, 
            borderRadius: 2, 
            bgcolor: `${color}.light`,
            color: `${color}.dark`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon />
        </Box>
      </Box>
      
      {change !== undefined && change !== 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
          {change > 0 ? (
            <TrendingUpIcon fontSize="small" color="success" />
          ) : (
            <TrendingDownIcon fontSize="small" color="error" />
          )}
          <Typography 
            variant="caption" 
            color={change > 0 ? 'success.main' : 'error.main'}
            fontWeight="medium"
          >
            {change > 0 ? '+' : ''}{change}% vs mês anterior
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

function ManagerMetricsWidget({ sellerSegmento }) {
  const { user } = useSelector((state) => state.auth)
  const isManager = (user?.level || 0) > 4
  
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isManager) {
      loadMetrics()
    }
  }, [isManager, sellerSegmento])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      const params = {}
      if (sellerSegmento) params.segmento = sellerSegmento

      const response = await analyticsService.getTeamMetrics(params)
      if (response.data.success) {
        setMetrics(response.data.data)
      }
    } catch (err) {
      console.error('Erro ao carregar métricas:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isManager) {
    return null
  }

  if (loading) {
    return (
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    )
  }

  if (!metrics) {
    return null
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="h6" color="text.secondary">
          Visão Geral da Equipe
        </Typography>
        <Chip 
          label={`${monthNames[metrics.period.month - 1]} ${metrics.period.year}`}
          size="small"
          variant="outlined"
        />
      </Box>
      
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <MetricCard
            title="Vendas do Mês"
            value={formatCurrency(metrics.sales.total)}
            subValue={`${metrics.sales.orders} pedidos`}
            icon={MoneyIcon}
            change={metrics.sales.change}
            color="success"
          />
        </Grid>
        
        <Grid item xs={6} md={3}>
          <MetricCard
            title="Clientes Atendidos"
            value={metrics.sales.uniqueCustomers}
            subValue="clientes únicos"
            icon={PeopleIcon}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={6} md={3}>
          <MetricCard
            title="Leads Abertos"
            value={metrics.leads.open}
            subValue={formatCurrency(metrics.leads.value)}
            icon={LeadsIcon}
            color="warning"
          />
        </Grid>
        
        <Grid item xs={6} md={3}>
          <MetricCard
            title="Clientes em Risco"
            value={metrics.team.atRiskCustomers}
            subValue={`${metrics.team.activeSellers} vendedores ativos`}
            icon={WarningIcon}
            color="error"
          />
        </Grid>
      </Grid>
    </Box>
  )
}

export default ManagerMetricsWidget
