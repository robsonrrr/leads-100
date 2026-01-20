import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Chip
} from '@mui/material'
import {
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material'
import { leadsService } from '../services/api'
import { offlineSyncService } from '../services/offlineSync.service'
import CustomerAutocomplete from '../components/CustomerAutocomplete'
import ClientOpportunities from '../components/ClientOpportunities'
import { formatCurrency } from '../utils'

function CreateLeadPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    customerId: null,
    cSegment: 1,
    cType: 1, // 1 = Ativo, 2 = Receptivo
    cNatOp: 27, // Natureza de operação padrão
    cEmitUnity: 8,
    cLogUnity: 8,
    cTransporter: 9, // Transportadora padrão
    paymentType: 1,
    paymentTerms: 204,
    freight: 0,
    freightType: 1,
    deliveryDate: '',
    buyer: '',
    purchaseOrder: '',
    remarks: {
      finance: '',
      logistic: '',
      nfe: '',
      obs: '',
      manager: ''
    }
  })

  const [metadata, setMetadata] = useState({
    nops: [],
    transporters: [],
    units: [],
    segments: [],
    paymentTerms: [],
    paymentTypes: []
  })

  const [validationErrors, setValidationErrors] = useState({})

  // Pré-selecionar cliente quando vier do CustomerCard
  useEffect(() => {
    if (location.state?.customer) {
      const customer = location.state.customer
      setFormData(prev => ({
        ...prev,
        customerId: {
          id: customer.id,
          name: customer.name,
          tradeName: customer.tradeName,
          cnpj: customer.cnpj,
          city: customer.city,
          state: customer.state,
          limite: customer.creditLimit || customer.limite || 0
        }
      }))

      // Buscar transportadora preferida do cliente
      const fetchTransporter = async () => {
        try {
          const response = await leadsService.getCustomerTransporter(customer.id)
          if (response.data.success && response.data.data) {
            setFormData(prev => ({ ...prev, cTransporter: response.data.data.id }))
          }
        } catch (err) {
          console.error('Erro ao buscar transportadora do cliente:', err)
        }
      }
      fetchTransporter()
    }
  }, [location.state])

  useEffect(() => {
    loadMetadata()
  }, [])

  // Default de condições de pagamento: 204
  useEffect(() => {
    if (!metadata.paymentTerms.length) return
    if (formData.paymentTerms) return
    const defaultTerm = metadata.paymentTerms.find(t => t.id == 204)
    if (defaultTerm) {
      setFormData(prev => ({ ...prev, paymentTerms: 204 }))
    }
  }, [metadata.paymentTerms, formData.paymentTerms])

  // Default de Unidade Logística (Barra Funda = 8) quando Segmento = Máquinas (1)
  useEffect(() => {
    if (formData.cSegment != 1) return
    // Só aplicar default se ainda não foi escolhido pelo usuário (vazio ou antigo padrão 1)
    if (formData.cLogUnity && formData.cLogUnity != 1) return
    setFormData(prev => ({ ...prev, cLogUnity: 8 }))
  }, [formData.cSegment, formData.cLogUnity])

  useEffect(() => {
    if (!formData.cLogUnity) return
    if (formData.cEmitUnity === formData.cLogUnity) return
    setFormData(prev => ({ ...prev, cEmitUnity: prev.cLogUnity }))
  }, [formData.cLogUnity, formData.cEmitUnity])

  // Atualizar cSegment string para ID quando metadados forem carregados
  useEffect(() => {
    if (metadata.segments.length > 0 && typeof formData.cSegment === 'string') {
      const segmentName = formData.cSegment.toLowerCase()
      const found = metadata.segments.find(s =>
        (s.name && s.name.toLowerCase() === segmentName) ||
        (s.segment && s.segment.toLowerCase() === segmentName)
      )
      if (found) {
        setFormData(prev => ({ ...prev, cSegment: found.id }))
      }
    }
  }, [metadata.segments, formData.cSegment])

  const loadMetadata = async () => {
    try {
      const [nopsRes, transRes, unitsRes, segmentsRes, paymentTermsRes, paymentTypesRes] = await Promise.all([
        leadsService.getNops(),
        leadsService.getTransporters(),
        leadsService.getUnits(),
        leadsService.getSegments(),
        leadsService.getPaymentTerms(),
        leadsService.getPaymentTypes()
      ])
      setMetadata({
        nops: nopsRes.data.data,
        transporters: transRes.data.data,
        units: unitsRes.data.data,
        segments: segmentsRes.data.data || [],
        paymentTerms: paymentTermsRes.data.data || [],
        paymentTypes: paymentTypesRes.data.data || []
      })
    } catch (err) {
      console.error('Erro ao carregar metadados:', err)
    }
  }

  const handleChange = (field, value) => {
    if (field.startsWith('remarks.')) {
      const remarkField = field.split('.')[1]
      setFormData(prev => ({
        ...prev,
        remarks: {
          ...prev.remarks,
          [remarkField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
    // Limpar erro de validação quando o campo é alterado
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.customerId) {
      errors.customerId = 'Cliente é obrigatório'
    }

    if (formData.freight < 0) {
      errors.freight = 'Frete não pode ser negativo'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      setError('Por favor, corrija os erros no formulário')
      return
    }

    try {
      setLoading(true)
      const leadData = {
        customerId: formData.customerId.id,
        userId: user.id,
        sellerId: user.id,
        cSegment: formData.cSegment || null,
        cType: formData.cType || 1,
        cNatOp: formData.cNatOp,
        cEmitUnity: formData.cEmitUnity,
        cLogUnity: formData.cLogUnity || formData.cEmitUnity,
        cTransporter: formData.cTransporter,
        paymentType: formData.paymentType,
        vPaymentTerms: formData.paymentTerms,
        freight: parseFloat(formData.freight) || 0,
        freightType: formData.freightType,
        deliveryDate: formData.deliveryDate || null,
        buyer: formData.buyer || null,
        purchaseOrder: formData.purchaseOrder || null,
        remarks: formData.remarks
      }

      const response = await leadsService.create(leadData)

      if (response.data.success) {
        const newLeadId = response.data.data.id

        // Adicionar itens pré-selecionados
        if (preSelectedItems.length > 0) {
          // Mostrar loading ou toast?
          // Como é rápido, vamos fazer async sem bloquear UI visualmente além do loading geral
          await Promise.all(preSelectedItems.map(item =>
            leadsService.addItem(newLeadId, {
              productId: item.id,
              quantity: 1,
              price: item.price
            }).catch(e => console.error('Falha ao adicionar item automático', e))
          ))
        }

        navigate(`/leads/${newLeadId}`)
      } else {
        setError(response.data.error?.message || 'Erro ao criar lead')
      }
    } catch (err) {
      // Tratar modo offline
      if (!navigator.onLine || err.message === 'Network Error' || !err.response) {
        offlineSyncService.enqueue('CREATE_LEAD', leadData);
        navigate('/');
        // Idealmente usar um Toast para informar o usuário
        alert('Você está offline. O lead foi salvo localmente e será sincronizado quando a conexão voltar.');
        return;
      }

      const errorMessage = err.response?.data?.error?.message ||
        err.response?.data?.error?.details?.join(', ') ||
        'Erro ao criar lead'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/')
  }

  const [preSelectedItems, setPreSelectedItems] = useState([])

  const handleAddOpportunity = (product) => {
    setPreSelectedItems(prev => {
      if (prev.find(p => p.id === product.id)) return prev
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const handleRemovePreSelected = (id) => {
    setPreSelectedItems(prev => prev.filter(p => p.id !== id))
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Novo Lead
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Cliente */}
            <Grid item xs={12}>
              <CustomerAutocomplete
                value={formData.customerId}
                onChange={async (value) => {
                  handleChange('customerId', value)
                  // Buscar transportadora mais usada pelo cliente
                  if (value?.id) {
                    try {
                      const response = await leadsService.getCustomerTransporter(value.id)
                      if (response.data.success && response.data.data) {
                        handleChange('cTransporter', response.data.data.id)
                      }
                    } catch (err) {
                      console.error('Erro ao buscar transportadora do cliente:', err)
                      // Não mostrar erro ao usuário, apenas manter o padrão
                    }
                  }
                }}
                error={!!validationErrors.customerId}
                helperText={validationErrors.customerId}
              />
            </Grid>

            {/* Crédito e Dados Financeiros */}
            {formData.customerId && (
              <Grid item xs={12}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: 'background.default',
                    borderColor: 'divider',
                    mb: 2
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">Limite de Crédito</Typography>
                    <Typography variant="h6" color={formData.customerId.limite > 0 ? 'success.main' : 'error.main'}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.customerId.limite || 0)}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">CNPJ</Typography>
                    <Typography variant="body2">{formData.customerId.cnpj || 'N/A'}</Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">Cidade/UF</Typography>
                    <Typography variant="body2">{formData.customerId.city}/{formData.customerId.state}</Typography>
                  </Box>
                </Paper>
              </Grid>
            )}

            {/* Oportunidades e Pré-seleção */}
            {formData.customerId && (
              <Grid item xs={12}>
                {preSelectedItems.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Itens adicionados ao pedido:</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {preSelectedItems.map(item => (
                        <Chip
                          key={item.id}
                          label={`${item.model} (${formatCurrency(item.price)})`}
                          onDelete={() => handleRemovePreSelected(item.id)}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                <ClientOpportunities
                  customerId={formData.customerId.id}
                  onAddProduct={handleAddOpportunity}
                />
              </Grid>
            )}

            {/* Segmento */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Segmento"
                value={formData.cSegment}
                onChange={(e) => handleChange('cSegment', parseInt(e.target.value))}
                helperText="Selecione o segmento"
              >
                {metadata.segments.map(seg => (
                  <MenuItem key={seg.id} value={seg.id}>
                    {seg.name || seg.segment}
                  </MenuItem>
                ))}
                {/* Fallback para mostrar valor atual se não estiver na lista (ex: "machines" string inicial) */}
                {formData.cSegment && typeof formData.cSegment === 'string' && (
                  <MenuItem value={formData.cSegment} disabled style={{ display: 'none' }}>
                    {formData.cSegment}
                  </MenuItem>
                )}
              </TextField>
            </Grid>

            {/* Tipo de Atendimento */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Tipo de Atendimento"
                value={formData.cType}
                onChange={(e) => handleChange('cType', parseInt(e.target.value))}
                helperText="Ativo = ligamos para o cliente | Receptivo = cliente nos procurou"
              >
                <MenuItem value={1}>Ativo</MenuItem>
                <MenuItem value={2}>Receptivo</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Unidade Logística"
                value={formData.cLogUnity}
                onChange={(e) => handleChange('cLogUnity', parseInt(e.target.value))}
              >
                {metadata.units.map(unit => (
                  <MenuItem key={unit.id} value={unit.id}>
                    {unit.name} ({unit.UF})
                  </MenuItem>
                ))}
                {formData.cLogUnity && !metadata.units.find(u => u.id === formData.cLogUnity) && (
                  <MenuItem key={formData.cLogUnity} value={formData.cLogUnity} sx={{ display: 'none' }}>
                    {formData.cLogUnity}
                  </MenuItem>
                )}
              </TextField>
            </Grid>

            {/* Natureza de Operação */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Natureza de Operação"
                value={formData.cNatOp}
                onChange={(e) => handleChange('cNatOp', parseInt(e.target.value))}
              >
                {metadata.nops.map(nop => (
                  <MenuItem key={nop.id} value={nop.id}>
                    {nop.id} - {nop.name}
                  </MenuItem>
                ))}
                {formData.cNatOp && !metadata.nops.find(n => n.id === formData.cNatOp) && (
                  <MenuItem key={formData.cNatOp} value={formData.cNatOp} sx={{ display: 'none' }}>
                    {formData.cNatOp}
                  </MenuItem>
                )}
              </TextField>
            </Grid>

            {/* Tipo de Pagamento */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Tipo de Pagamento"
                value={formData.paymentType}
                onChange={(e) => handleChange('paymentType', parseInt(e.target.value))}
              >
                {metadata.paymentTypes.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
                {formData.paymentType && !metadata.paymentTypes.some(t => t.id == formData.paymentType) && (
                  <MenuItem key={formData.paymentType} value={formData.paymentType} sx={{ display: 'none' }}>
                    {formData.paymentType}
                  </MenuItem>
                )}
              </TextField>
            </Grid>

            {/* Condições de Pagamento */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Condições de Pagamento"
                value={formData.paymentTerms}
                onChange={(e) => handleChange('paymentTerms', parseInt(e.target.value))}
              >
                <MenuItem value="">
                  <em>Selecione...</em>
                </MenuItem>
                {metadata.paymentTerms.map((term) => (
                  <MenuItem key={term.id} value={term.id}>
                    {term.terms} - {term.nat_op}
                  </MenuItem>
                ))}
                {/* Fallback for manually entered or old string values if any (though currently we expect IDs) */}
                {formData.paymentTerms && !metadata.paymentTerms.some(t => t.id == formData.paymentTerms) && (
                  <MenuItem value={formData.paymentTerms} disabled style={{ display: 'none' }}>
                    {formData.paymentTerms}
                  </MenuItem>
                )}
              </TextField>
            </Grid>

            {/* Frete */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Frete"
                value={formData.freight}
                onChange={(e) => handleChange('freight', e.target.value)}
                error={!!validationErrors.freight}
                helperText={validationErrors.freight}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            {/* Tipo de Frete */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Tipo de Frete"
                value={formData.freightType}
                onChange={(e) => handleChange('freightType', parseInt(e.target.value))}
              >
                <MenuItem value={1}>CIF (Cliente paga)</MenuItem>
                <MenuItem value={2}>FOB (Emitente paga)</MenuItem>
                <MenuItem value={3}>Terceiros</MenuItem>
              </TextField>
            </Grid>

            {/* Transportadora */}
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                select
                label="Transportadora"
                value={formData.cTransporter}
                onChange={(e) => handleChange('cTransporter', parseInt(e.target.value))}
              >
                {metadata.transporters.map(tr => (
                  <MenuItem key={tr.id} value={tr.id}>
                    {tr.name}
                  </MenuItem>
                ))}
                {formData.cTransporter && !metadata.transporters.find(t => t.id === formData.cTransporter) && (
                  <MenuItem key={formData.cTransporter} value={formData.cTransporter} sx={{ display: 'none' }}>
                    {formData.cTransporter}
                  </MenuItem>
                )}
              </TextField>
            </Grid>

            {/* Data de Entrega */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Data de Entrega"
                value={formData.deliveryDate}
                onChange={(e) => handleChange('deliveryDate', e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            {/* Comprador */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Comprador"
                value={formData.buyer}
                onChange={(e) => handleChange('buyer', e.target.value)}
              />
            </Grid>

            {/* Pedido de Compra */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Pedido de Compra"
                value={formData.purchaseOrder}
                onChange={(e) => handleChange('purchaseOrder', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Observações
              </Typography>
            </Grid>

            {/* Observações Financeiro */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Observações Financeiro"
                value={formData.remarks.finance}
                onChange={(e) => handleChange('remarks.finance', e.target.value)}
              />
            </Grid>

            {/* Observações Logística */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Observações Logística"
                value={formData.remarks.logistic}
                onChange={(e) => handleChange('remarks.logistic', e.target.value)}
              />
            </Grid>

            {/* Observações NFE */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Observações NFE"
                value={formData.remarks.nfe}
                onChange={(e) => handleChange('remarks.nfe', e.target.value)}
              />
            </Grid>

            {/* Observações Gerais */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observações Gerais"
                value={formData.remarks.obs}
                onChange={(e) => handleChange('remarks.obs', e.target.value)}
              />
            </Grid>

            {/* Observações Gerente */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Observações Gerente"
                value={formData.remarks.manager}
                onChange={(e) => handleChange('remarks.manager', e.target.value)}
              />
            </Grid>

            {/* Botões */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Salvar Lead'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  )
}

export default CreateLeadPage
