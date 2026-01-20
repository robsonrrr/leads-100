import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Divider,
  TextField,
  CircularProgress
} from '@mui/material'
import {
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { formatCurrency, formatDate } from '../utils'
import { customersService } from '../services/api'
import EditGoalModal from './EditGoalModal'

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

function CustomerCard({ customer, onNewLead, onGoalUpdate, onTradeNameUpdate }) {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const statusConfig = STATUS_CONFIG[customer.status] || STATUS_CONFIG.inactive
  const [editGoalOpen, setEditGoalOpen] = useState(false)

  // Estado para edição inline do nome fantasia
  const [isEditingTradeName, setIsEditingTradeName] = useState(false)
  const [tradeNameValue, setTradeNameValue] = useState(customer.tradeName || '')
  const [savingTradeName, setSavingTradeName] = useState(false)

  // Verificar permissão para editar: level > 4 OU dono do cliente
  const canEdit = (user?.level || 0) > 4 || customer.sellerId === user?.userId
  const canEditGoal = canEdit

  const handleNewLead = () => {
    if (onNewLead) {
      onNewLead(customer)
    } else {
      // Navegar para criar lead com cliente pré-selecionado
      navigate('/leads/new', { state: { customer } })
    }
  }

  const handleGoalUpdate = (customerId, newGoal) => {
    if (onGoalUpdate) {
      onGoalUpdate(customerId, newGoal)
    }
  }

  // Handlers para edição inline do nome fantasia
  const handleStartEditTradeName = () => {
    setTradeNameValue(customer.tradeName || '')
    setIsEditingTradeName(true)
  }

  const handleCancelEditTradeName = () => {
    setTradeNameValue(customer.tradeName || '')
    setIsEditingTradeName(false)
  }

  const handleSaveTradeName = async () => {
    if (!tradeNameValue.trim()) return

    try {
      setSavingTradeName(true)
      await customersService.updateTradeName(customer.id, tradeNameValue.trim())
      setIsEditingTradeName(false)

      // Notificar o parent para atualizar os dados
      if (onTradeNameUpdate) {
        onTradeNameUpdate(customer.id, tradeNameValue.trim())
      }
    } catch (error) {
      console.error('Erro ao atualizar nome fantasia:', error)
      alert(error.response?.data?.error?.message || 'Erro ao atualizar nome fantasia')
    } finally {
      setSavingTradeName(false)
    }
  }

  const handleTradeNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveTradeName()
    } else if (e.key === 'Escape') {
      handleCancelEditTradeName()
    }
  }


  return (
    <>
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
              {/* Nome Fantasia - Edição Inline */}
              {isEditingTradeName ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TextField
                    size="small"
                    value={tradeNameValue}
                    onChange={(e) => setTradeNameValue(e.target.value)}
                    onKeyDown={handleTradeNameKeyDown}
                    autoFocus
                    disabled={savingTradeName}
                    sx={{
                      flex: 1,
                      '& .MuiInputBase-input': {
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        py: 0.5
                      }
                    }}
                  />
                  <IconButton
                    size="small"
                    color="success"
                    onClick={handleSaveTradeName}
                    disabled={savingTradeName || !tradeNameValue.trim()}
                  >
                    {savingTradeName ? <CircularProgress size={16} /> : <CheckIcon fontSize="small" />}
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={handleCancelEditTradeName}
                    disabled={savingTradeName}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    noWrap
                    sx={{
                      cursor: canEdit ? 'pointer' : 'default',
                      '&:hover': canEdit ? { color: 'primary.main' } : {}
                    }}
                    onClick={canEdit ? handleStartEditTradeName : undefined}
                    title={canEdit ? 'Clique para editar' : undefined}
                  >
                    {customer.tradeName || customer.name}
                  </Typography>
                  {canEdit && (
                    <Tooltip title="Editar nome fantasia">
                      <IconButton
                        size="small"
                        onClick={handleStartEditTradeName}
                        sx={{ p: 0.25, opacity: 0.6, '&:hover': { opacity: 1 } }}
                      >
                        <EditIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              )}
              {customer.tradeName && customer.name !== customer.tradeName && !isEditingTradeName && (
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

        {/* Metas de Máquinas */}
        {customer.goal && (
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'warning.main',
              borderRadius: 1,
              p: 1.5,
              mb: 2,
              bgcolor: 'background.paper'
            }}
          >
            {/* Header da Meta */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: customer.goal.progressYear >= 100 ? 'success.main' : 'primary.main'
                  }}
                />
                <Typography variant="caption" fontWeight="bold">
                  Meta {new Date().getFullYear()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip
                  label={`Classe ${customer.goal.classification}`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    bgcolor: customer.goal.classification === 'A' ? 'success.light' :
                      customer.goal.classification === 'B' ? 'info.light' :
                        customer.goal.classification === 'C' ? 'warning.light' : 'grey.300',
                    color: customer.goal.classification === 'A' ? 'success.dark' :
                      customer.goal.classification === 'B' ? 'info.dark' :
                        customer.goal.classification === 'C' ? 'warning.dark' : 'grey.700'
                  }}
                />
                {canEditGoal && (
                  <Tooltip title="Editar meta">
                    <IconButton
                      size="small"
                      onClick={() => setEditGoalOpen(true)}
                      sx={{
                        p: 0.25,
                        '&:hover': { bgcolor: 'warning.lighter' }
                      }}
                    >
                      <EditIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>

            {/* Barra de progresso anual */}
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  🎯 {customer.goal.soldYear} vendidas
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Meta: {customer.goal.year} un
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  color={customer.goal.progressYear >= 100 ? 'success.main' :
                    customer.goal.progressYear >= 50 ? 'warning.main' : 'error.main'}
                >
                  {customer.goal.progressYear}%
                </Typography>
              </Box>
              <Box
                sx={{
                  width: '100%',
                  height: 6,
                  bgcolor: 'grey.200',
                  borderRadius: 3,
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    width: `${Math.min(100, customer.goal.progressYear)}%`,
                    height: '100%',
                    bgcolor: customer.goal.progressYear >= 100 ? 'success.main' :
                      customer.goal.progressYear >= 50 ? 'warning.main' : 'error.main',
                    borderRadius: 3,
                    transition: 'width 0.3s ease'
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Faltam {customer.goal.gapYear} unidades para a meta anual
              </Typography>
            </Box>

            {/* Meta do Mês */}
            <Box sx={{ bgcolor: 'grey.50', borderRadius: 1, p: 1, mt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" fontWeight="medium">
                  📅 Meta do Mês
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  color={customer.goal.progressMonth >= 100 ? 'success.main' : 'warning.main'}
                >
                  {customer.goal.progressMonth}%
                </Typography>
              </Box>
              <Box
                sx={{
                  width: '100%',
                  height: 4,
                  bgcolor: 'grey.300',
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    width: `${Math.min(100, customer.goal.progressMonth)}%`,
                    height: '100%',
                    bgcolor: customer.goal.progressMonth >= 100 ? 'success.main' : 'warning.main',
                    borderRadius: 2
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {customer.goal.soldMonth} vendidas
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Meta: {customer.goal.month} un
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Faltam {customer.goal.gapMonth}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Botão para definir meta quando não existe */}
        {!customer.goal && canEditGoal && (
          <Box
            sx={{
              border: '1px dashed',
              borderColor: 'grey.400',
              borderRadius: 1,
              p: 1.5,
              mb: 2,
              bgcolor: 'grey.50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight="medium">
                📊 Meta de Máquinas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Este cliente não possui meta definida
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setEditGoalOpen(true)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Definir Meta
            </Button>
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

      {/* Modal de Edição/Criação de Meta */}
      <EditGoalModal
        open={editGoalOpen}
        onClose={() => setEditGoalOpen(false)}
        customer={customer}
        onSuccess={handleGoalUpdate}
      />
    </>
  )
}

export default CustomerCard

