import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Skeleton,
  Tooltip
} from '@mui/material'
import {
  Description as LeadsIcon,
  CheckCircle as ConvertedIcon,
  AttachMoney as MoneyIcon,
  People as CustomersIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material'
import { analyticsService } from '../services/api'
import { formatCurrency } from '../utils'

function MetricCard({ title, value, subtitle, icon: Icon, color, trend, loading }) {
  if (loading) {
    return (
      <Paper
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          minWidth: 200,
          flex: 1
        }}
      >
        <Skeleton variant="circular" width={48} height={48} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="80%" height={32} />
          <Skeleton variant="text" width="40%" height={16} />
        </Box>
      </Paper>
    )
  }

  return (
    <Paper
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        minWidth: 200,
        flex: 1,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${color}.light`,
          color: `${color}.dark`
        }}
      >
        <Icon fontSize="medium" />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" color="text.secondary" noWrap>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" fontWeight="bold">
            {value}
          </Typography>
          {trend !== undefined && trend !== 0 && (
            <Tooltip title={`${trend > 0 ? '+' : ''}${trend}% vs mês anterior`}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: trend > 0 ? 'success.main' : 'error.main',
                  fontSize: '0.75rem'
                }}
              >
                {trend > 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                <Typography variant="caption" fontWeight="bold">
                  {Math.abs(trend)}%
                </Typography>
              </Box>
            </Tooltip>
          )}
        </Box>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Paper>
  )
}

function MetricsCards({ sellerId, sellerSegmento }) {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadMetrics()
  }, [sellerId, sellerSegmento])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      const params = {}
      if (sellerId) {
        params.sellerId = sellerId
      } else if (sellerSegmento) {
        params.sellerSegmento = sellerSegmento
      }
      const response = await analyticsService.getSellerSummary(params)
      if (response.data.success) {
        setMetrics(response.data.data)
      }
    } catch (err) {
      console.error('Erro ao carregar métricas:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return null // Não mostrar nada se houver erro
  }

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        mb: 3,
        flexWrap: 'wrap'
      }}
    >
      <MetricCard
        title="Leads Abertos"
        value={loading ? '-' : metrics?.leads?.open || 0}
        subtitle={loading ? '' : `${metrics?.leads?.conversionRate || 0}% conversão`}
        icon={LeadsIcon}
        color="primary"
        loading={loading}
      />
      <MetricCard
        title="Convertidos"
        value={loading ? '-' : metrics?.leads?.converted || 0}
        subtitle={loading ? '' : `de ${metrics?.leads?.total || 0} leads`}
        icon={ConvertedIcon}
        color="success"
        loading={loading}
      />
      <MetricCard
        title="Vendas no Mês"
        value={loading ? '-' : formatCurrency(metrics?.orders?.month?.totalValue || 0)}
        subtitle={loading ? '' : `${metrics?.orders?.month?.ordersCount || 0} pedidos`}
        icon={MoneyIcon}
        color="warning"
        trend={metrics?.orders?.month?.variation}
        loading={loading}
      />
      <MetricCard
        title="Clientes"
        value={loading ? '-' : metrics?.customers?.activeCount || 0}
        subtitle={loading ? '' : `${metrics?.customers?.atRiskCount || 0} em risco`}
        icon={CustomersIcon}
        color="info"
        loading={loading}
      />
    </Box>
  )
}

export default MetricsCards
