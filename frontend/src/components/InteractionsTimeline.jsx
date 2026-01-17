import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Skeleton,
  Alert,
  Tooltip
} from '@mui/material'
import {
  Add as AddIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Person as PersonIcon,
  Event as EventIcon,
  Note as NoteIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material'
import { interactionsService } from '../services/api'
import { formatDate } from '../utils'
import { useToast } from '../contexts/ToastContext'

const TYPE_CONFIG = {
  call: { icon: PhoneIcon, label: 'Ligação', color: 'primary' },
  visit: { icon: PersonIcon, label: 'Visita', color: 'success' },
  email: { icon: EmailIcon, label: 'Email', color: 'info' },
  whatsapp: { icon: WhatsAppIcon, label: 'WhatsApp', color: 'success' },
  meeting: { icon: EventIcon, label: 'Reunião', color: 'warning' },
  note: { icon: NoteIcon, label: 'Nota', color: 'default' }
}

function InteractionsTimeline({ customerId, currentUserId }) {
  const toast = useToast()
  const [interactions, setInteractions] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    type: 'call',
    description: '',
    nextActionDate: '',
    nextActionDescription: ''
  })

  useEffect(() => {
    if (customerId) {
      loadInteractions()
    }
  }, [customerId])

  const loadInteractions = async () => {
    try {
      setLoading(true)
      const response = await interactionsService.getByCustomer(customerId, { limit: 50 })
      if (response.data.success) {
        setInteractions(response.data.data || [])
      }
    } catch (err) {
      console.error('Erro ao carregar interações:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (interaction = null) => {
    if (interaction) {
      setEditingId(interaction.id)
      setFormData({
        type: interaction.type,
        description: interaction.description,
        nextActionDate: interaction.nextActionDate ? interaction.nextActionDate.split('T')[0] : '',
        nextActionDescription: interaction.nextActionDescription || ''
      })
    } else {
      setEditingId(null)
      setFormData({
        type: 'call',
        description: '',
        nextActionDate: '',
        nextActionDescription: ''
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingId(null)
  }

  const handleSubmit = async () => {
    try {
      if (!formData.description.trim()) {
        toast.error('Descrição é obrigatória')
        return
      }

      const data = {
        customerId: parseInt(customerId),
        type: formData.type,
        description: formData.description,
        nextActionDate: formData.nextActionDate || null,
        nextActionDescription: formData.nextActionDescription || null
      }

      if (editingId) {
        await interactionsService.update(editingId, data)
        toast.success('Interação atualizada')
      } else {
        await interactionsService.create(data)
        toast.success('Interação registrada')
      }

      handleCloseDialog()
      loadInteractions()
    } catch (err) {
      console.error('Erro ao salvar interação:', err)
      toast.error(err.response?.data?.error?.message || 'Erro ao salvar')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja excluir esta interação?')) return

    try {
      await interactionsService.delete(id)
      toast.success('Interação excluída')
      loadInteractions()
    } catch (err) {
      console.error('Erro ao excluir:', err)
      toast.error(err.response?.data?.error?.message || 'Erro ao excluir')
    }
  }

  if (loading) {
    return (
      <Box>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} variant="rounded" height={80} sx={{ mb: 2 }} />
        ))}
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Histórico de Interações</Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nova Interação
        </Button>
      </Box>

      {interactions.length === 0 ? (
        <Alert severity="info">
          Nenhuma interação registrada. Clique em "Nova Interação" para adicionar.
        </Alert>
      ) : (
        <Box sx={{ position: 'relative', pl: 3 }}>
          {/* Linha vertical da timeline */}
          <Box
            sx={{
              position: 'absolute',
              left: 12,
              top: 0,
              bottom: 0,
              width: 2,
              bgcolor: 'divider'
            }}
          />

          {interactions.map((interaction) => {
            const config = TYPE_CONFIG[interaction.type] || TYPE_CONFIG.note
            const Icon = config.icon

            return (
              <Box key={interaction.id} sx={{ position: 'relative', mb: 2 }}>
                {/* Círculo do ícone */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: -3,
                    top: 8,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: 'background.paper',
                    border: 2,
                    borderColor: `${config.color}.main`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Icon fontSize="small" color={config.color} />
                </Box>

                {/* Card da interação */}
                <Paper sx={{ ml: 4, p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Chip
                          label={config.label}
                          size="small"
                          color={config.color}
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(interaction.createdAt, { includeTime: true })}
                        </Typography>
                        {interaction.userName && (
                          <Typography variant="caption" color="text.secondary">
                            • {interaction.userName}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {interaction.description}
                      </Typography>
                      {interaction.nextActionDate && (
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ScheduleIcon fontSize="small" color="warning" />
                          <Typography variant="caption" color="warning.main">
                            Próxima ação: {formatDate(interaction.nextActionDate)}
                            {interaction.nextActionDescription && ` - ${interaction.nextActionDescription}`}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <Box>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleOpenDialog(interaction)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton size="small" color="error" onClick={() => handleDelete(interaction.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            )
          })}
        </Box>
      )}

      {/* Dialog para criar/editar */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Editar Interação' : 'Nova Interação'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select
                value={formData.type}
                label="Tipo"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <config.icon fontSize="small" />
                      {config.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Descrição"
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />

            <TextField
              label="Data da Próxima Ação"
              type="date"
              value={formData.nextActionDate}
              onChange={(e) => setFormData({ ...formData, nextActionDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="Opcional - para agendar follow-up"
            />

            {formData.nextActionDate && (
              <TextField
                label="Descrição da Próxima Ação"
                value={formData.nextActionDescription}
                onChange={(e) => setFormData({ ...formData, nextActionDescription: e.target.value })}
                placeholder="Ex: Ligar para confirmar pedido"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingId ? 'Salvar' : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default InteractionsTimeline
