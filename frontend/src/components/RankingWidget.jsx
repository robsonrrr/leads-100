import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Skeleton,
  Chip,
  Divider,
  FormControl,
  Select,
  MenuItem,
  Button,
  Collapse
} from '@mui/material'
import {
  EmojiEvents as TrophyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material'
import { goalsService } from '../services/api'
import { formatCurrency } from '../utils'

const medals = ['🥇', '🥈', '🥉']

function RankingWidget({ sellerSegmento }) {
  const { user } = useSelector((state) => state.auth)
  const isManager = (user?.level || 0) > 4

  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [expanded, setExpanded] = useState(false)

  const INITIAL_DISPLAY = 5 // Mostrar apenas top 5 inicialmente
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    if (!isManager) {
      return
    }
    loadRanking()
  }, [period, sellerSegmento, isManager])

  const loadRanking = async () => {
    try {
      if (!isManager) return

      setLoading(true)
      const params = { year: currentYear }
      if (period === 'month') params.month = currentMonth
      if (sellerSegmento) params.segmento = sellerSegmento

      const response = await goalsService.getTeamProgress(params)
      if (response.data.success) {
        const data = response.data.data || []

        const sorted = data.sort((a, b) => {
          if (period === 'month') {
            return b.monthly.achieved - a.monthly.achieved
          }
          return b.annual.achieved - a.annual.achieved
        })

        setRanking(sorted.slice(0, 10))
      }
    } catch (err) {
      console.error('Erro ao carregar ranking:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isManager) return null

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Skeleton variant="text" width="50%" />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} variant="rectangular" height={40} sx={{ mt: 1, borderRadius: 1 }} />
        ))}
      </Paper>
    )
  }

  if (ranking.length === 0) return null

  const displayedRanking = expanded ? ranking : ranking.slice(0, INITIAL_DISPLAY)
  const hasMore = ranking.length > INITIAL_DISPLAY

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrophyIcon sx={{ color: '#FFD700' }} />
          <Typography variant="h6">Ranking</Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: 80 }}>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            variant="outlined"
            sx={{ fontSize: '0.8rem', height: 32 }}
          >
            <MenuItem value="month">Mês</MenuItem>
            <MenuItem value="year">Ano</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <List dense disablePadding sx={{ maxHeight: expanded ? 'none' : 280, overflow: 'hidden' }}>
        {displayedRanking.map((seller, index) => {
          const isCurrentUser = seller.sellerId === user?.userId
          const sales = period === 'month' ? seller.monthly.achieved : seller.annual.achieved

          return (
            <Box key={seller.sellerId}>
              {index > 0 && <Divider sx={{ my: 0.5 }} />}
              <ListItem
                sx={{
                  px: 1,
                  py: 0.5,
                  bgcolor: isCurrentUser ? 'action.selected' : 'transparent',
                  borderRadius: 1,
                  minHeight: 44
                }}
              >
                <ListItemAvatar sx={{ minWidth: 36 }}>
                  {index < 3 ? (
                    <Typography variant="body1">{medals[index]}</Typography>
                  ) : (
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        fontSize: 12,
                        bgcolor: 'grey.300',
                        color: 'text.primary'
                      }}
                    >
                      {index + 1}
                    </Avatar>
                  )}
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      fontWeight={isCurrentUser ? 'bold' : 'medium'}
                      noWrap
                      sx={{ maxWidth: 110, fontSize: '0.85rem' }}
                    >
                      {seller.sellerName}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      {seller.segmento}
                    </Typography>
                  }
                  sx={{ my: 0 }}
                />

                <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.85rem' }}>
                  {formatCurrency(sales)}
                </Typography>
              </ListItem>
            </Box>
          )
        })}
      </List>

      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <Button
            size="small"
            onClick={() => setExpanded(!expanded)}
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ textTransform: 'none', color: 'text.secondary', fontSize: '0.8rem' }}
          >
            {expanded ? 'Ver menos' : `Ver mais (${ranking.length - INITIAL_DISPLAY})`}
          </Button>
        </Box>
      )}
    </Paper>
  )
}

export default RankingWidget
