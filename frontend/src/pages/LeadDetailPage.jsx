import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  ShoppingCart as ShoppingCartIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Payment as PaymentIcon,
  LocalShipping as ShippingIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Print as PrintIcon,
  Email as EmailIcon
} from '@mui/icons-material'
import { leadsService } from '../services/api'
import CartItems from '../components/CartItems'
import CartRecommendations from '../components/CartRecommendations'
import MakPrimeLogo from '../components/MakPrimeLogo'
import CustomerGoalCard from '../components/CustomerGoalCard'
import { formatDate, formatCurrency, getPaymentTypeLabel, getFreightTypeLabel } from '../utils'
import { LeadDetailSkeleton } from '../components/skeletons'
import { useToast } from '../contexts/ToastContext'

function LeadDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [lead, setLead] = useState(null)
  const [totals, setTotals] = useState(null)
  const [items, setItems] = useState([])

  const [logUnits, setLogUnits] = useState([])
  const [transporters, setTransporters] = useState([])
  const [segments, setSegments] = useState([])
  const [paymentTypesList, setPaymentTypesList] = useState([])
  const [paymentTermsList, setPaymentTermsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [converting, setConverting] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')

  const [conversionFormData, setConversionFormData] = useState({
    cTransporter: '',
    remarks: {
      finance: '',
      logistic: '',
      nfe: '',
      obs: '',
      manager: ''
    }
  })

  useEffect(() => {
    // Validar ID antes de carregar
    const leadId = parseInt(id)
    if (isNaN(leadId) || leadId <= 0) {
      setError('ID de lead inválido')
      setLoading(false)
      return
    }
    loadLead()
  }, [id])

  // Normalize cSegment if it's a string (compatibility with older records)
  useEffect(() => {
    if (lead && segments.length > 0 && typeof lead.cSegment === 'string') {
      const segmentName = lead.cSegment.toLowerCase()
      const found = segments.find(s =>
        (s.name && s.name.toLowerCase() === segmentName) ||
        (s.segment && s.segment.toLowerCase() === segmentName)
      )
      if (found) {
        handleFieldUpdate('cSegment', found.id)
      }
    }
  }, [lead?.cSegment, segments])

  // Effect to suggest payment term when segment is Machines (1)
  useEffect(() => {
    // Check if we have the payment terms loaded and lead data
    if (lead && paymentTermsList.length > 0) {
      if (lead.orderWeb) return
      const defaultTerm = paymentTermsList.find(t => t.id === 204)
      if (!lead.vPaymentTerms && defaultTerm) {
        handleFieldUpdate('vPaymentTerms', 204)
      }
    }
  }, [lead?.cSegment, paymentTermsList, lead?.vPaymentTerms]) // depend on cPaymentTerms to avoid loop if we check incorrectly, but here we check !lead.cPaymentTerms

  // Default Segmento: Máquinas (id=1)
  useEffect(() => {
    if (!lead) return
    if (lead.orderWeb) return
    if (lead.cSegment) return
    handleFieldUpdate('cSegment', 1)
  }, [lead?.cSegment, lead?.orderWeb])

  const loadLead = async () => {
    try {
      setLoading(true)
      setError('')

      const leadId = parseInt(id)
      if (isNaN(leadId) || leadId <= 0) {
        setError('ID de lead inválido')
        setLoading(false)
        return
      }

      const [leadRes, totalsRes, itemsRes, unitsRes, transportersRes, segmentsRes, paymentTermsRes, paymentTypesRes] = await Promise.all([
        leadsService.getById(leadId),
        leadsService.calculateTotals(leadId),
        leadsService.getItems(leadId),
        leadsService.getUnits(),
        leadsService.getTransporters(),
        leadsService.getSegments(),
        leadsService.getPaymentTerms(),
        leadsService.getPaymentTypes()
      ])

      if (leadRes.data.success) {
        setLead(leadRes.data.data)
        setTotals(totalsRes.data.data)
        if (leadRes.data.data.customer?.email) {
          setEmailAddress(leadRes.data.data.customer.email)
        }
      } else {
        setError('Lead não encontrado')
      }

      if (itemsRes.data.success) {
        setItems(itemsRes.data.data || [])
      }

      if (unitsRes.data.success) {
        setLogUnits(unitsRes.data.data)
      }

      if (transportersRes.data.success) {
        setTransporters(transportersRes.data.data)
      }

      if (segmentsRes.data.success) {
        setSegments(segmentsRes.data.data || [])
      }
      if (paymentTermsRes.data.success) {
        setPaymentTermsList(paymentTermsRes.data.data || [])
      }
      if (paymentTypesRes.data.success) {
        setPaymentTypesList(paymentTypesRes.data.data || [])
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar lead')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenConvertDialog = () => {
    // Inicializa o formulário com os valores atuais do lead
    setConversionFormData({
      cTransporter: lead.cTransporter || '',
      remarks: {
        finance: lead.remarks?.finance || '',
        logistic: lead.remarks?.logistic || '',
        nfe: lead.remarks?.nfe || '',
        obs: lead.remarks?.obs || '',
        manager: lead.remarks?.manager || ''
      }
    })
    setConvertDialogOpen(true)
  }

  const handleConfirmConversion = async () => {
    // Validação: transportadora obrigatória
    if (!conversionFormData.cTransporter) {
      setError('Selecione uma transportadora para continuar')
      toast.warning('Selecione uma transportadora para continuar')
      return
    }

    try {
      setConverting(true)
      toast.info('Convertendo lead em pedido...')
      const response = await leadsService.convert(id, {
        cTransporter: conversionFormData.cTransporter,
        remarks: conversionFormData.remarks
      })
      if (response.data.success) {
        const orderId = response.data.data.orderId || response.data.data.id
        // Verificar se orderId é válido antes de navegar
        if (orderId && orderId > 0) {
          setConvertDialogOpen(false)
          toast.success(`Lead convertido em pedido #${orderId} com sucesso!`)
          // Redirecionar para página do pedido criado
          navigate(`/orders/${orderId}`)
        } else {
          // Se orderId não for válido, manter dialog aberto e mostrar erro
          setError('ID do pedido não retornado na conversão')
          toast.error('ID do pedido não retornado na conversão')
          // Não fechar o dialog para que o usuário possa tentar novamente
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || 'Erro ao converter lead'
      setError(errorMsg)
      toast.error(errorMsg)
      // Mantém o dialog aberto para correção
    } finally {
      setConverting(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const response = await leadsService.delete(id)
      if (response.data.success) {
        setDeleteDialogOpen(false)
        toast.success('Lead excluído com sucesso!')
        navigate('/') // Voltar para o dashboard
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || 'Erro ao excluir lead'
      setError(errorMsg)
      toast.error(errorMsg)
      setDeleteDialogOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  const handleLogUnityChange = async (event) => {
    try {
      const newLogUnityValue = event.target.value

      // Se for string vazia, não fazer nada (ou definir como null/undefined)
      if (newLogUnityValue === '') {
        return
      }

      // Converter para número inteiro (backend espera number.integer)
      const newLogUnity = parseInt(newLogUnityValue, 10)

      // Validar se é um número válido
      if (isNaN(newLogUnity) || newLogUnity <= 0) {
        setError('Unidade logística inválida')
        return
      }

      // Atualizar localmente primeiro para UI responsiva
      setLead(prev => ({ ...prev, cLogUnity: newLogUnity }))

      // Enviar atualização para o backend
      const response = await leadsService.update(id, { cLogUnity: newLogUnity })

      if (response.data.success) {
        // Atualizar lead com dados retornados do servidor para garantir sincronização
        if (response.data.data) {
          setLead(prev => ({
            ...prev,
            cLogUnity: response.data.data.cLogUnity !== undefined ? response.data.data.cLogUnity : newLogUnity
          }))
        }
        // Limpar qualquer erro anterior
        setError('')
      } else {
        // Reverter em caso de erro
        loadLead()
        setError(response.data.error?.message || 'Erro ao atualizar unidade logística')
      }
    } catch (err) {
      // Reverter em caso de erro
      loadLead()
      setError(err.response?.data?.error?.message || 'Erro ao atualizar unidade logística')
    }
  }

  const handleFieldUpdate = async (field, value) => {
    try {
      // Atualizar localmente
      setLead(prev => ({ ...prev, [field]: value }))

      const updateData = { [field]: value }

      // Validações específicas
      if (field === 'freight') {
        updateData[field] = parseFloat(value) || 0
      }

      const response = await leadsService.update(id, updateData)

      if (response.data.success) {
        if (response.data.data) {
          setLead(prev => ({
            ...prev,
            [field]: response.data.data[field] !== undefined ? response.data.data[field] : value
          }))
        }
        setError('')
        // Se mudou o segmento, pode ser que afete o cálculo de paymentTerms, então recarregue ou force update
        if (field === 'cSegment') {
          // Opcional: recarregar itens se necessário, mas por enquanto ok
        }
      } else {
        loadLead()
        setError(response.data.error?.message || `Erro ao atualizar ${field}`)
      }
    } catch (err) {
      loadLead()
      setError(err.response?.data?.error?.message || `Erro ao atualizar ${field}`)
    }
  }

  const formatPaymentTerms = () => {
    // Verificar se algum item é do segmento "machines"
    const hasMachinesSegment = items.some(item => {
      const productSegment = item.product?.segment?.code ||
        item.product?.segment ||
        item.product?.product_segment ||
        ''
      const segmentStr = typeof productSegment === 'string' ? productSegment : ''
      return segmentStr?.toLowerCase() === 'machines' ||
        segmentStr?.toLowerCase() === 'máquinas' ||
        segmentStr?.toLowerCase() === 'maquinas'
    })

    if (hasMachinesSegment) {
      // Para máquinas, usar times (tProduct) dos itens (default 5 se não especificado)
      // Pegar o times do primeiro item de máquinas encontrado
      const machineItem = items.find(item => {
        const productSegment = item.product?.segment?.code ||
          item.product?.segment ||
          item.product?.product_segment ||
          ''
        const segmentStr = typeof productSegment === 'string' ? productSegment : ''
        return segmentStr?.toLowerCase() === 'machines' ||
          segmentStr?.toLowerCase() === 'máquinas' ||
          segmentStr?.toLowerCase() === 'maquinas'
      })

      // times vem do toJSON() do CartItem (mapeado de tProduct)
      const times = machineItem?.times || 5

      // Calcular as datas: 5x = 30/60/90/120/150 dias (intervalos de 30 dias)
      const intervals = []
      for (let i = 1; i <= times; i++) {
        intervals.push(i * 30)
      }

      return `${times}x (${intervals.join('/')} dias)`
    }

    // Para outros segmentos, usar o formato padrão
    return lead.paymentTerms || '-'
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <LeadDetailSkeleton />
      </Container>
    )
  }

  if (error && !lead) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Voltar
        </Button>
      </Container>
    )
  }

  if (!lead) {
    return null
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header melhorado */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2,
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <IconButton
              onClick={() => navigate(-1)}
              sx={{
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
                Lead #{lead.id}
                {lead.orderWeb && (
                  <Typography component="span" variant="h4" sx={{ ml: 1, fontWeight: 700, opacity: 0.95 }}>
                    - Pedido #{lead.orderWeb}
                  </Typography>
                )}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Chip
                  label={lead.type === 1 ? 'Lead' : 'Pedido'}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 600
                  }}
                />
                {lead.customer?.nome && (
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    • {lead.customer.nome}
                  </Typography>
                )}
                {totals?.v2Evaluation && (
                  <Chip
                    label={totals.v2Evaluation.is_within_policy ? 'COMPLIANT' : 'VIOLATION'}
                    size="small"
                    color={totals.v2Evaluation.is_within_policy ? 'success' : 'error'}
                    sx={{ fontWeight: 700, ml: 1, border: '1px solid rgba(255,255,255,0.3)' }}
                    title={totals.v2Evaluation.compliance_status}
                  />
                )}
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/leads/${id}/edit`)}
              disabled={!!lead.orderWeb}
              title={lead.orderWeb ? 'Este lead não pode ser editado pois já possui número de pedido' : 'Editar lead'}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
                '&.Mui-disabled': { bgcolor: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.5)' }
              }}
            >
              Editar
            </Button>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={() => window.open(`/leads/${id}/mail`, '_blank')}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' }
              }}
            >
              Imprimir
            </Button>
            <Button
              variant="contained"
              startIcon={<EmailIcon />}
              onClick={() => window.open(`/leads/${id}/mail`, '_blank')}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' }
              }}
            >
              Enviar
            </Button>
            <Button
              variant="contained"
              startIcon={<ShoppingCartIcon />}
              onClick={handleOpenConvertDialog}
              disabled={!!lead.orderWeb || lead.type === 2}
              title={lead.orderWeb ? 'Este lead já foi convertido' : 'Converter em pedido real'}
              sx={{
                bgcolor: 'success.main',
                color: 'white',
                '&:hover': { bgcolor: 'success.dark' },
                '&.Mui-disabled': { bgcolor: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.5)' }
              }}
            >
              Converter
            </Button>
            <Button
              variant="contained"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
              disabled={!!lead.orderWeb || lead.type === 2}
              title={lead.orderWeb ? 'Este lead não pode ser excluído pois já possui número de pedido' : 'Excluir lead'}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255, 87, 87, 0.3)' },
                '&.Mui-disabled': { bgcolor: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.5)' }
              }}
            >
              Excluir
            </Button>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {lead.orderWeb && (
        <Alert
          severity="info"
          sx={{
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-icon': { fontSize: 28 }
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Este lead possui número de pedido ({lead.orderWeb}) e não pode ser editado.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Informações Principais */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 2,
              transition: 'all 0.3s ease',
              '&:hover': { boxShadow: 4 }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <DescriptionIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Informações do Lead
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <ReceiptIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    ID
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 600, ml: 4 }}>
                  {lead.id}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <PersonIcon fontSize="small" color="primary" />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Cliente
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 600, ml: 4 }}>
                  {lead.customer?.nome || (lead.customerId ? `Cliente #${lead.customerId}` : '-')}
                </Typography>
                {lead.customer?.ender && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ml: 4 }}>
                    {lead.customer.ender}
                  </Typography>
                )}
                {(lead.customer?.cidade || lead.customer?.estado) && (
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    {lead.customer.cidade || ''}
                    {lead.customer.cidade && lead.customer.estado ? ' - ' : ''}
                    {lead.customer.estado || ''}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <CalendarIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Data de Criação
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ ml: 4 }}>
                  {formatDate(lead.createdAt)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <TrendingUpIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Segmento
                  </Typography>
                </Box>
                {lead.orderWeb ? (
                  <Typography variant="body1" sx={{ ml: 4 }}>
                    {(() => {
                      const seg = segments.find(s => s.id === lead.cSegment)
                      if (seg) return seg.name || seg.segment
                      // Fallback pro mapa estático se não achar
                      const map = { 1: 'Machines', 2: 'Bearings', 3: 'Parts', 5: 'Auto', 6: 'Moto' }
                      return map[lead.cSegment] || lead.cSegment || '-'
                    })()}
                  </Typography>
                ) : (
                  <FormControl fullWidth size="small" variant="standard" sx={{ ml: 4, maxWidth: 300 }}>
                    <Select
                      value={lead.cSegment || ''}
                      onChange={(e) => handleFieldUpdate('cSegment', parseInt(e.target.value))}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>Selecione</em>
                      </MenuItem>
                      {segments.map((seg) => (
                        <MenuItem key={seg.id || seg} value={seg.id || seg}>
                          {seg.name || seg.segment || seg}
                        </MenuItem>
                      ))}
                      {/* Fallback to show current value if detached or string-based */}
                      {lead.cSegment && !segments.find(s => s.id == lead.cSegment) && (
                        <MenuItem value={lead.cSegment} disabled style={{ display: 'none' }}>
                          {lead.cSegment}
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
                )}
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <BusinessIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Unidade Logística
                  </Typography>
                </Box>
                {lead.orderWeb ? (
                  <Typography variant="body1" sx={{ ml: 4 }}>
                    {logUnits.find(u => u.id === lead.cLogUnity)?.name || lead.cLogUnity}
                  </Typography>
                ) : (
                  <FormControl fullWidth size="small" variant="standard" sx={{ ml: 4, maxWidth: 300 }}>
                    <Select
                      value={lead.cLogUnity || ''}
                      onChange={handleLogUnityChange}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>Selecione uma unidade</em>
                      </MenuItem>
                      {logUnits.map((unit) => (
                        <MenuItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <PaymentIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Tipo de Pagamento
                  </Typography>
                </Box>
                {lead.orderWeb ? (
                  <Typography variant="body1" sx={{ ml: 4 }}>
                    {getPaymentTypeLabel(lead.paymentType)}
                  </Typography>
                ) : (
                  <FormControl fullWidth size="small" variant="standard" sx={{ ml: 4, maxWidth: 300 }}>
                    <Select
                      value={lead.paymentType || 1}
                      onChange={(e) => handleFieldUpdate('paymentType', parseInt(e.target.value))}
                    >
                      {paymentTypesList.map((t) => (
                        <MenuItem key={t.id} value={t.id}>
                          {t.name}
                        </MenuItem>
                      ))}
                      {lead.paymentType && !paymentTypesList.some(t => t.id == lead.paymentType) && (
                        <MenuItem value={lead.paymentType} disabled style={{ display: 'none' }}>
                          {lead.paymentType}
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <PaymentIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Condições de Pagamento
                  </Typography>
                </Box>
                {lead.orderWeb ? (
                  <Typography variant="body1" sx={{ ml: 4 }}>
                    {formatPaymentTerms()}
                  </Typography>
                ) : (

                  <FormControl fullWidth size="small" variant="standard" sx={{ ml: 4, maxWidth: 300 }}>
                    <Select
                      value={lead.vPaymentTerms || ''}
                      onChange={(e) => handleFieldUpdate('vPaymentTerms', e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>Selecione...</em>
                      </MenuItem>
                      {paymentTermsList.map((term) => (
                        <MenuItem key={term.id} value={term.id}>
                          {term.terms} - {term.nat_op}
                        </MenuItem>
                      ))}
                      {/* Fallback for unmapped values */}
                      {lead.vPaymentTerms && !paymentTermsList.find(t => t.id == lead.vPaymentTerms) && (
                        <MenuItem value={lead.vPaymentTerms} disabled style={{ display: 'none' }}>
                          {lead.vPaymentTerms}
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <MoneyIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Frete
                  </Typography>
                </Box>
                {lead.orderWeb ? (
                  <Typography variant="body1" sx={{ ml: 4, fontWeight: 600, color: 'primary.main' }}>
                    {formatCurrency(lead.freight)}
                  </Typography>
                ) : (
                  <TextField
                    type="number"
                    variant="standard"
                    fullWidth
                    size="small"
                    value={lead.freight}
                    onChange={(e) => handleFieldUpdate('freight', e.target.value)}
                    sx={{ ml: 4, maxWidth: 300 }}
                    InputProps={{
                      startAdornment: <Typography variant="caption" sx={{ mr: 1 }}>R$</Typography>
                    }}
                  />
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <ShippingIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Tipo de Frete
                  </Typography>
                </Box>
                {lead.orderWeb ? (
                  <Typography variant="body1" sx={{ ml: 4 }}>
                    {getFreightTypeLabel(lead.freightType)}
                  </Typography>
                ) : (
                  <FormControl fullWidth size="small" variant="standard" sx={{ ml: 4, maxWidth: 300 }}>
                    <Select
                      value={lead.freightType || 1}
                      onChange={(e) => handleFieldUpdate('freightType', parseInt(e.target.value))}
                    >
                      <MenuItem value={1}>CIF (Cliente paga)</MenuItem>
                      <MenuItem value={2}>FOB (Emitente paga)</MenuItem>
                      <MenuItem value={3}>Terceiros</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Grid>
              {lead.buyer && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Comprador
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ ml: 4 }}>
                    {lead.buyer}
                  </Typography>
                </Grid>
              )}
              {lead.purchaseOrder && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <BusinessIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Pedido de Compra
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ ml: 4 }}>
                    {lead.purchaseOrder}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Observações e Lucratividade */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Card de Meta do Cliente (se tiver customerId) */}
            {lead.customerId && (
              <CustomerGoalCard customerId={lead.customerId} />
            )}

            {/* Card de Lucratividade (apenas se houver comissão) */}
            {totals?.profitability && (
              <Paper
                elevation={4}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: 'success.main',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <TrendingUpIcon
                  sx={{
                    position: 'absolute',
                    right: -10,
                    top: -10,
                    fontSize: 100,
                    opacity: 0.1
                  }}
                />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MoneyIcon /> Lucratividade do Lead
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Comissão Líquida:</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {formatCurrency(totals.profitability.commission)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Margem: {totals.profitability.marginPercent}%
                  </Typography>
                </Box>

                <Box sx={{ pt: 2, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                  <Grid container spacing={1}>
                    <Grid item xs={8}>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>Margem Bruta:</Typography>
                    </Grid>
                    <Grid item xs={4} sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {formatCurrency(totals.profitability.margin)}
                      </Typography>
                    </Grid>

                    <Grid item xs={8}>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>Desc. Forma Pgto:</Typography>
                    </Grid>
                    <Grid item xs={4} sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        -{formatCurrency(totals.profitability.descFP)}
                      </Typography>
                    </Grid>

                    <Grid item xs={8}>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>Impostos (Est/Fed):</Typography>
                    </Grid>
                    <Grid item xs={4} sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        -{formatCurrency(totals.profitability.descFed + totals.profitability.descIcms)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            )}

            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': { boxShadow: 4 }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <DescriptionIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Observações
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {lead.remarks && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {lead.remarks.finance && (
                    <Card
                      variant="outlined"
                      sx={{
                        bgcolor: 'rgba(76, 175, 80, 0.05)',
                        borderLeft: '4px solid',
                        borderLeftColor: 'success.main',
                        transition: 'all 0.2s ease',
                        '&:hover': { boxShadow: 2, transform: 'translateX(4px)' }
                      }}
                    >
                      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.dark', mb: 1 }}>
                          💰 Financeiro
                        </Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                          {lead.remarks.finance}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                  {lead.remarks.logistic && (
                    <Card
                      variant="outlined"
                      sx={{
                        bgcolor: 'rgba(33, 150, 243, 0.05)',
                        borderLeft: '4px solid',
                        borderLeftColor: 'primary.main',
                        transition: 'all 0.2s ease',
                        '&:hover': { boxShadow: 2, transform: 'translateX(4px)' }
                      }}
                    >
                      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.dark', mb: 1 }}>
                          🚚 Logística
                        </Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                          {lead.remarks.logistic}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                  {lead.remarks.nfe && (
                    <Card
                      variant="outlined"
                      sx={{
                        bgcolor: 'rgba(255, 152, 0, 0.05)',
                        borderLeft: '4px solid',
                        borderLeftColor: 'warning.main',
                        transition: 'all 0.2s ease',
                        '&:hover': { boxShadow: 2, transform: 'translateX(4px)' }
                      }}
                    >
                      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'warning.dark', mb: 1 }}>
                          📄 NFE
                        </Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                          {lead.remarks.nfe}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                  {lead.remarks.obs && (
                    <Card
                      variant="outlined"
                      sx={{
                        bgcolor: 'rgba(158, 158, 158, 0.05)',
                        borderLeft: '4px solid',
                        borderLeftColor: 'grey.500',
                        transition: 'all 0.2s ease',
                        '&:hover': { boxShadow: 2, transform: 'translateX(4px)' }
                      }}
                    >
                      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}>
                          📝 Gerais
                        </Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                          {lead.remarks.obs}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                  {lead.remarks.manager && (
                    <Card
                      variant="outlined"
                      sx={{
                        bgcolor: 'rgba(156, 39, 176, 0.05)',
                        borderLeft: '4px solid',
                        borderLeftColor: 'secondary.main',
                        transition: 'all 0.2s ease',
                        '&:hover': { boxShadow: 2, transform: 'translateX(4px)' }
                      }}
                    >
                      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'secondary.dark', mb: 1 }}>
                          👤 Gerente
                        </Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                          {lead.remarks.manager}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                  {!lead.remarks.finance && !lead.remarks.logistic && !lead.remarks.nfe &&
                    !lead.remarks.obs && !lead.remarks.manager && (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        Nenhuma observação cadastrada
                      </Typography>
                    )}
                </Box>
              )}
            </Paper>
          </Box>
        </Grid>

        {/* Carrinho de Produtos */}
        <Grid item xs={12}>
          <CartItems leadId={parseInt(id)} lead={lead} readOnly={!!lead.orderWeb} />
        </Grid>
      </Grid >

      {/* Dialog de Confirmação de Exclusão */}
      < Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)
      }>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o lead #{lead.id}? Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog >
      {/* Dialog de Confirmação de Conversão */}
      < Dialog
        open={convertDialogOpen}
        onClose={() => !converting && setConvertDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Confirmar Conversão para Pedido
        </DialogTitle>
        <DialogContent>
          {/* Seção 1 - Resumo do Lead (read-only) */}
          <Box sx={{ bgcolor: 'grey.50', borderRadius: 1, p: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              📋 Resumo do Lead
            </Typography>
            {(() => {
              // Verificar se algum item é do segmento "machines" para ocultar IPI e ST
              const hasMachinesSegment = items.some(item => {
                const productSegment = item.product?.segment?.code ||
                  item.product?.segment ||
                  item.product?.product_segment ||
                  ''
                const segmentStr = typeof productSegment === 'string' ? productSegment : ''
                return segmentStr?.toLowerCase() === 'machines' ||
                  segmentStr?.toLowerCase() === 'máquinas' ||
                  segmentStr?.toLowerCase() === 'maquinas'
              })

              return (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Cliente</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {lead.customer?.nome || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Data</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatDate(lead.createdAt)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Unidade Logística</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {logUnits.find(u => u.id === lead.cLogUnity)?.name || lead.cLogUnity || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Data de Entrega</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {lead.deliveryDate ? formatDate(lead.deliveryDate) : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Quantidade de Itens</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {items.length} itens
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatCurrency(totals?.subtotal)}
                    </Typography>
                  </Grid>
                  {!hasMachinesSegment && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">IPI</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {formatCurrency(totals?.totalIPI)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">ST</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {formatCurrency(totals?.totalST)}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Frete</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatCurrency(totals?.freight)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ bgcolor: 'primary.light', p: 1.5, borderRadius: 1, mt: 1 }}>
                      <Typography variant="body2" color="white">Total Geral</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
                        {formatCurrency(totals?.grandTotal || totals?.total)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              )
            })()}
          </Box>

          {/* Seção de Produtos */}
          {items.length > 0 && (
            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                🛒 Produtos do Pedido
              </Typography>
              {(() => {
                // Verificar se algum item é do segmento "machines" para ocultar IPI e ST
                const hasMachinesSegment = items.some(item => {
                  const productSegment = item.product?.segment?.code ||
                    item.product?.segment ||
                    item.product?.product_segment ||
                    ''
                  const segmentStr = typeof productSegment === 'string' ? productSegment : ''
                  return segmentStr?.toLowerCase() === 'machines' ||
                    segmentStr?.toLowerCase() === 'máquinas' ||
                    segmentStr?.toLowerCase() === 'maquinas'
                })

                return (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Produto</TableCell>
                          <TableCell align="right">Quantidade</TableCell>
                          <TableCell align="center">Vezes</TableCell>
                          <TableCell align="right">Preço Unit.</TableCell>
                          <TableCell align="right">Subtotal</TableCell>
                          {!hasMachinesSegment && (
                            <>
                              <TableCell align="right">IPI</TableCell>
                              <TableCell align="right">ST</TableCell>
                            </>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {items.map((item) => {
                          const itemSubtotal = (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0)
                          const itemIPI = parseFloat(item.ipi) || 0
                          const itemST = parseFloat(item.st) || 0
                          const itemTotal = itemSubtotal + itemIPI + itemST

                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    {item.product?.model && (
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {item.product.model}
                                      </Typography>
                                    )}
                                    {item.product?.brand && (
                                      <MakPrimeLogo height={18} marca={item.product.brand} />
                                    )}
                                  </Box>
                                  {item.product?.brand && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                      Marca: {item.product.brand}
                                    </Typography>
                                  )}
                                  <Typography variant="body2" color="text.secondary">
                                    {item.product?.name || `Produto #${item.productId}`}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="right">{item.quantity}</TableCell>
                              <TableCell align="center">{item.times || 1}</TableCell>
                              <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                              <TableCell align="right">{formatCurrency(itemSubtotal)}</TableCell>
                              {!hasMachinesSegment && (
                                <>
                                  <TableCell align="right">{formatCurrency(itemIPI)}</TableCell>
                                  <TableCell align="right">{formatCurrency(itemST)}</TableCell>
                                </>
                              )}
                            </TableRow>
                          )
                        })}
                        <TableRow sx={{ bgcolor: 'grey.50', fontWeight: 600 }}>
                          <TableCell colSpan={4} align="right" sx={{ fontWeight: 600 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Totais:</Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {formatCurrency(items.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0), 0))}
                          </TableCell>
                          {!hasMachinesSegment && (
                            <>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>
                                {formatCurrency(items.reduce((sum, item) => sum + (parseFloat(item.ipi) || 0), 0))}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>
                                {formatCurrency(items.reduce((sum, item) => sum + (parseFloat(item.st) || 0), 0))}
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                )
              })()}

              {/* Validação do Total */}
              {(() => {
                const calculatedSubtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0), 0)
                const calculatedIPI = items.reduce((sum, item) => sum + (parseFloat(item.ipi) || 0), 0)
                const calculatedST = items.reduce((sum, item) => sum + (parseFloat(item.st) || 0), 0)
                const calculatedFreight = parseFloat(totals?.freight) || 0
                const calculatedTotal = calculatedSubtotal + calculatedIPI + calculatedST + calculatedFreight
                const expectedTotal = parseFloat(totals?.grandTotal || totals?.total) || 0
                const difference = Math.abs(calculatedTotal - expectedTotal)
                const tolerance = 0.01 // Tolerância de 1 centavo para diferenças de arredondamento

                if (difference > tolerance) {
                  return (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        ⚠️ Diferença encontrada nos valores:
                      </Typography>
                      <Typography variant="body2">
                        Total calculado dos produtos: <strong>{formatCurrency(calculatedTotal)}</strong>
                      </Typography>
                      <Typography variant="body2">
                        Total geral esperado: <strong>{formatCurrency(expectedTotal)}</strong>
                      </Typography>
                      <Typography variant="body2" color="error.main" sx={{ mt: 0.5 }}>
                        Diferença: <strong>{formatCurrency(difference)}</strong>
                      </Typography>
                    </Alert>
                  )
                }
                return (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      ✅ Valores conferem: Total calculado ({formatCurrency(calculatedTotal)}) = Total geral ({formatCurrency(expectedTotal)})
                    </Typography>
                  </Alert>
                )
              })()}
            </Box>
          )}

          {items.length === 0 && (
            <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
              ⚠️ Nenhum produto adicionado ao lead. Adicione produtos antes de converter.
            </Alert>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Seção 2 - Dados Editáveis */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              📝 Dados para Conversão
            </Typography>

            <FormControl fullWidth size="small" sx={{ mb: 3 }}>
              <InputLabel>Transportadora *</InputLabel>
              <Select
                value={conversionFormData.cTransporter}
                onChange={(e) => setConversionFormData(prev => ({
                  ...prev,
                  cTransporter: e.target.value
                }))}
                label="Transportadora *"
                disabled={converting}
              >
                {transporters.map((transporter) => (
                  <MenuItem key={transporter.id} value={transporter.id}>
                    {transporter.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
              Observações
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Financeiro"
                  value={conversionFormData.remarks.finance}
                  onChange={(e) => setConversionFormData(prev => ({
                    ...prev,
                    remarks: { ...prev.remarks, finance: e.target.value }
                  }))}
                  multiline
                  rows={2}
                  variant="outlined"
                  size="small"
                  disabled={converting}
                  placeholder="Observações financeiras para o pedido"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Logística"
                  value={conversionFormData.remarks.logistic}
                  onChange={(e) => setConversionFormData(prev => ({
                    ...prev,
                    remarks: { ...prev.remarks, logistic: e.target.value }
                  }))}
                  multiline
                  rows={2}
                  variant="outlined"
                  size="small"
                  disabled={converting}
                  placeholder="Observações sobre entrega e logística"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="NFE"
                  value={conversionFormData.remarks.nfe}
                  onChange={(e) => setConversionFormData(prev => ({
                    ...prev,
                    remarks: { ...prev.remarks, nfe: e.target.value }
                  }))}
                  multiline
                  rows={2}
                  variant="outlined"
                  size="small"
                  disabled={converting}
                  placeholder="Observações para nota fiscal eletrônica"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observações Gerais"
                  value={conversionFormData.remarks.obs}
                  onChange={(e) => setConversionFormData(prev => ({
                    ...prev,
                    remarks: { ...prev.remarks, obs: e.target.value }
                  }))}
                  multiline
                  rows={2}
                  variant="outlined"
                  size="small"
                  disabled={converting}
                  placeholder="Outras observações gerais"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Gerente"
                  value={conversionFormData.remarks.manager}
                  onChange={(e) => setConversionFormData(prev => ({
                    ...prev,
                    remarks: { ...prev.remarks, manager: e.target.value }
                  }))}
                  multiline
                  rows={2}
                  variant="outlined"
                  size="small"
                  disabled={converting}
                  placeholder="Observações do gerente"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConvertDialogOpen(false)}
            disabled={converting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmConversion}
            color="success"
            variant="contained"
            disabled={converting}
            startIcon={converting ? <CircularProgress size={16} color="inherit" /> : <ShoppingCartIcon />}
          >
            {converting ? 'Convertendo...' : 'Confirmar Conversão'}
          </Button>
        </DialogActions>
      </Dialog >
      {/* Dialog de Envio de Email */}
      < Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)}>
        <DialogTitle>Enviar Cotação por Email</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            A cotação do lead #{lead?.id} será enviada para o seguinte endereço:
          </Typography>
          <TextField
            fullWidth
            label="Email do Cliente"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            disabled={sendingEmail}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)} disabled={sendingEmail}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              setSendingEmail(true)
              toast.info('Enviando email...')
              // Simulando envio de email por enquanto
              setTimeout(() => {
                setSendingEmail(false)
                setEmailDialogOpen(false)
                toast.success(`Email enviado para ${emailAddress}!`)
              }, 1500)
            }}
            color="primary"
            variant="contained"
            disabled={sendingEmail || !emailAddress}
          >
            {sendingEmail ? <CircularProgress size={20} /> : 'Enviar Agora'}
          </Button>
        </DialogActions>
      </Dialog >
    </Container >
  )
}

export default LeadDetailPage
