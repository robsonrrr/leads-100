import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Skeleton,
  Chip
} from '@mui/material'
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material'
import { alertsService } from '../services/api'

function AlertsWidget({ sellerId, sellerSegmento }) {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlerts()
  }, [sellerId, sellerSegmento])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const params = {}
      if (sellerId) params.sellerId = sellerId
      else if (sellerSegmento) params.sellerSegmento = sellerSegmento
      
      const response = await alertsService.getMyAlerts(params)
      if (response.data.success) {
        setAlerts(response.data.data.alerts || [])
      }
    } catch (err) {
      console.error('Erro ao carregar alertas:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="text" width={150} height={28} />
          <Skeleton variant="rounded" width={80} height={24} />
        </Box>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} variant="text" width="100%" height={40} sx={{ mb: 1 }} />
        ))}
      </Paper>
    )
  }

  if (alerts.length === 0) {
    return null // Não mostrar widget se não houver alertas
  }

  return (
    <Paper sx={{ p: 2, mb: 3, borderLeft: 4, borderColor: 'warning.main' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          <Typography variant="h6" fontWeight="bold">
            Alertas
          </Typography>
          <Chip 
            label={alerts.length} 
            size="small" 
            color="warning"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
      </Box>

      <List dense disablePadding>
        {alerts.map((alert) => (
          <ListItem
            key={alert.id}
            sx={{
              px: 1,
              py: 0.5,
              borderRadius: 1,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' }
            }}
            onClick={() => navigate(alert.action)}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {alert.type === 'danger' ? (
                <ErrorIcon color="error" fontSize="small" />
              ) : (
                <WarningIcon color="warning" fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" fontWeight="medium">
                  {alert.icon} {alert.title}
                </Typography>
              }
              secondary={alert.description}
            />
            <ChevronRightIcon color="action" fontSize="small" />
          </ListItem>
        ))}
      </List>
    </Paper>
  )
}

export default AlertsWidget
