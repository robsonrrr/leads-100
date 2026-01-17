import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Skeleton,
  Button,
  Divider,
  Badge
} from '@mui/material'
import {
  Schedule as ScheduleIcon,
  Phone as PhoneIcon,
  DirectionsWalk as VisitIcon,
  Email as EmailIcon,
  Chat as WhatsAppIcon,
  Groups as MeetingIcon,
  Note as NoteIcon,
  ChevronRight as ChevronRightIcon,
  Warning as WarningIcon
} from '@mui/icons-material'
import { interactionsService } from '../services/api'
import { formatDate } from '../utils'

const typeConfig = {
  call: { icon: PhoneIcon, label: 'Ligação', color: '#2196f3' },
  visit: { icon: VisitIcon, label: 'Visita', color: '#4caf50' },
  email: { icon: EmailIcon, label: 'Email', color: '#ff9800' },
  whatsapp: { icon: WhatsAppIcon, label: 'WhatsApp', color: '#25D366' },
  meeting: { icon: MeetingIcon, label: 'Reunião', color: '#9c27b0' },
  note: { icon: NoteIcon, label: 'Nota', color: '#607d8b' }
}

function FollowUpsWidget({ sellerId, sellerSegmento }) {
  const navigate = useNavigate()
  const [followUps, setFollowUps] = useState([])
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState({ today: 0, overdue: 0, upcoming: 0 })

  useEffect(() => {
    loadFollowUps()
  }, [sellerId, sellerSegmento])

  const loadFollowUps = async () => {
    try {
      setLoading(true)
      const response = await interactionsService.getFollowUps({ limit: 5 })
      if (response.data.success) {
        const data = response.data.data || []
        setFollowUps(data)
        
        // Contar por status
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        let overdueCount = 0
        let todayCount = 0
        let upcomingCount = 0
        
        data.forEach(item => {
          const actionDate = new Date(item.nextActionDate)
          actionDate.setHours(0, 0, 0, 0)
          
          if (actionDate < today) overdueCount++
          else if (actionDate.getTime() === today.getTime()) todayCount++
          else upcomingCount++
        })
        
        setCount({ today: todayCount, overdue: overdueCount, upcoming: upcomingCount })
      }
    } catch (err) {
      console.error('Erro ao carregar follow-ups:', err)
    } finally {
      setLoading(false)
    }
  }

  const getDateStatus = (dateStr) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const actionDate = new Date(dateStr)
    actionDate.setHours(0, 0, 0, 0)
    
    const diffDays = Math.floor((actionDate - today) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return { label: 'Atrasado', color: 'error' }
    if (diffDays === 0) return { label: 'Hoje', color: 'warning' }
    if (diffDays === 1) return { label: 'Amanhã', color: 'info' }
    return { label: formatDate(dateStr), color: 'default' }
  }

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Skeleton variant="text" width="50%" />
        <Skeleton variant="rectangular" height={100} sx={{ mt: 1 }} />
      </Paper>
    )
  }

  if (followUps.length === 0) {
    return null // Não mostra widget se não houver follow-ups
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge badgeContent={count.overdue} color="error" max={9}>
            <ScheduleIcon color="primary" />
          </Badge>
          <Typography variant="h6">Próximas Ações</Typography>
        </Box>
        
        {count.overdue > 0 && (
          <Chip 
            icon={<WarningIcon />}
            label={`${count.overdue} atrasada${count.overdue > 1 ? 's' : ''}`}
            color="error"
            size="small"
          />
        )}
      </Box>

      <List dense disablePadding>
        {followUps.map((item, index) => {
          const config = typeConfig[item.type] || typeConfig.note
          const IconComponent = config.icon
          const dateStatus = getDateStatus(item.nextActionDate)
          
          return (
            <Box key={item.id}>
              {index > 0 && <Divider />}
              <ListItem 
                sx={{ px: 0, cursor: 'pointer' }}
                onClick={() => navigate(`/customers/${item.customerId}`)}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <IconComponent sx={{ color: config.color, fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="medium" noWrap sx={{ maxWidth: 150 }}>
                        {item.customerName}
                      </Typography>
                      <Chip 
                        label={dateStatus.label}
                        color={dateStatus.color}
                        size="small"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {item.nextActionDescription || config.label}
                    </Typography>
                  }
                />
                <ChevronRightIcon color="action" fontSize="small" />
              </ListItem>
            </Box>
          )
        })}
      </List>

      {followUps.length >= 5 && (
        <Button 
          size="small" 
          fullWidth 
          sx={{ mt: 1 }}
          onClick={() => navigate('/customers')}
        >
          Ver todos os clientes
        </Button>
      )}
    </Paper>
  )
}

export default FollowUpsWidget
