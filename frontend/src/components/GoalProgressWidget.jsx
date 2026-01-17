import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Skeleton,
  Chip
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  Flag as FlagIcon
} from '@mui/icons-material'
import { goalsService } from '../services/api'
import { formatCurrency } from '../utils'

function GoalProgressWidget({ sellerId, sellerSegmento }) {
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProgress()
  }, [sellerId, sellerSegmento])

  const loadProgress = async () => {
    try {
      setLoading(true)
      const params = {}
      if (sellerId) params.sellerId = sellerId
      
      const response = await goalsService.getMyProgress(params)
      if (response.data.success) {
        setProgress(response.data.data)
      }
    } catch (err) {
      console.error('Erro ao carregar progresso:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="rectangular" height={20} sx={{ my: 1 }} />
        <Skeleton variant="text" width="40%" />
      </Paper>
    )
  }

  if (!progress || (progress.monthly.target === 0 && progress.annual.target === 0)) {
    return null // Não mostra widget se não houver metas
  }

  const getProgressColor = (percent) => {
    if (percent >= 100) return 'success'
    if (percent >= 70) return 'primary'
    if (percent >= 40) return 'warning'
    return 'error'
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <FlagIcon color="primary" />
        <Typography variant="h6">Metas</Typography>
      </Box>

      {/* Meta Mensal */}
      {progress.monthly.target > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {monthNames[progress.month - 1]} {progress.year}
            </Typography>
            <Chip 
              label={`${progress.monthly.progress}%`}
              size="small"
              color={getProgressColor(progress.monthly.progress)}
            />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(progress.monthly.progress, 100)}
            color={getProgressColor(progress.monthly.progress)}
            sx={{ height: 10, borderRadius: 1 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {formatCurrency(progress.monthly.achieved)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Meta: {formatCurrency(progress.monthly.target)}
            </Typography>
          </Box>
          {progress.monthly.remaining > 0 && (
            <Typography variant="caption" color="warning.main">
              Faltam {formatCurrency(progress.monthly.remaining)}
            </Typography>
          )}
          {progress.monthly.progress >= 100 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <TrendingUpIcon fontSize="small" color="success" />
              <Typography variant="caption" color="success.main" fontWeight="bold">
                Meta atingida! 🎉
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Meta Anual */}
      {progress.annual.target > 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Ano {progress.year}
            </Typography>
            <Chip 
              label={`${progress.annual.progress}%`}
              size="small"
              color={getProgressColor(progress.annual.progress)}
              variant="outlined"
            />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(progress.annual.progress, 100)}
            color={getProgressColor(progress.annual.progress)}
            sx={{ height: 8, borderRadius: 1, opacity: 0.7 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {formatCurrency(progress.annual.achieved)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Meta: {formatCurrency(progress.annual.target)}
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  )
}

export default GoalProgressWidget
