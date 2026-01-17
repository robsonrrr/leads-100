import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
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
    Divider
} from '@mui/material'
import {
    Save as SaveIcon,
    Cancel as CancelIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material'
import { leadsService } from '../services/api'
import CustomerAutocomplete from '../components/CustomerAutocomplete'

function EditLeadPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useSelector((state) => state.auth)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        customerId: null,
        cSegment: user?.segmento || '',
        cNatOp: 27,
        cEmitUnity: 1,
        cLogUnity: 1,
        cTransporter: 9,
        paymentType: 1,
        paymentTerms: 'n:30:30',
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
        segments: []
    })

    const [validationErrors, setValidationErrors] = useState({})

    useEffect(() => {
        loadData()
    }, [id])

    // Atualizar cSegment string para ID quando metadados forem carregados (mesma lógica do CreateLeadPage)
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

    const loadData = async () => {
        try {
            setLoading(true)
            const [leadRes, nopsRes, transRes, unitsRes, segmentsRes] = await Promise.all([
                leadsService.getById(id),
                leadsService.getNops(),
                leadsService.getTransporters(),
                leadsService.getUnits(),
                leadsService.getSegments()
            ])

            const lead = leadRes.data.data

            // Mapear dados do lead para o formulário
            setFormData({
                customerId: lead.customer ? { id: lead.customerId, nome: lead.customer.nome } : null,
                cSegment: lead.cSegment || '',
                cNatOp: lead.cNatOp || 27,
                cEmitUnity: lead.cEmitUnity || 1,
                cLogUnity: lead.cLogUnity || 1,
                cTransporter: lead.cTransporter || 9,
                paymentType: lead.paymentType || 1,
                paymentTerms: lead.paymentTerms || 'n:30:30',
                freight: lead.freight || 0,
                freightType: lead.freightType || 1,
                deliveryDate: lead.deliveryDate ? lead.deliveryDate.split('T')[0] : '',
                buyer: lead.buyer || '',
                purchaseOrder: lead.purchaseOrder || '',
                remarks: {
                    finance: lead.remarks?.finance || '',
                    logistic: lead.remarks?.logistic || '',
                    nfe: lead.remarks?.nfe || '',
                    obs: lead.remarks?.obs || '',
                    manager: lead.remarks?.manager || ''
                }
            })

            setMetadata({
                nops: nopsRes.data.data,
                transporters: transRes.data.data,
                units: unitsRes.data.data,
                segments: segmentsRes.data.data || []
            })
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Erro ao carregar dados')
        } finally {
            setLoading(false)
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
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.customerId) {
            setValidationErrors({ customerId: 'Cliente é obrigatório' })
            return
        }

        try {
            setSaving(true)
            const leadData = {
                customerId: formData.customerId.id,
                cSegment: formData.cSegment || null,
                cNatOp: formData.cNatOp,
                cEmitUnity: formData.cEmitUnity,
                cLogUnity: formData.cLogUnity,
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

            await leadsService.update(id, leadData)
            navigate(`/leads/${id}`)
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Erro ao salvar alterações')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Container maxWidth="md">
            <Paper sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Voltar</Button>
                    <Typography variant="h4" component="h1">
                        Editar Lead #{id}
                    </Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* Reutilizando os mesmos campos do CreateLeadPage */}
                        <Grid item xs={12}>
                            <CustomerAutocomplete
                                value={formData.customerId}
                                onChange={(value) => handleChange('customerId', value)}
                                error={!!validationErrors.customerId}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Segmento"
                                value={formData.cSegment}
                                onChange={(e) => handleChange('cSegment', parseInt(e.target.value))}
                                helperText="Selecione o segmento"
                            >
                                <MenuItem value="">
                                    <em>Nenhum</em>
                                </MenuItem>
                                {metadata.segments.map((seg) => (
                                    <MenuItem key={seg.id || seg} value={seg.id || seg}>
                                        {seg.name || seg.segment || seg}
                                    </MenuItem>
                                ))}
                                {/* Fallback para mostrar valor atual se não estiver na lista */}
                                {formData.cSegment && typeof formData.cSegment === 'string' && (
                                    <MenuItem value={formData.cSegment} disabled style={{ display: 'none' }}>
                                        {formData.cSegment}
                                    </MenuItem>
                                )}
                            </TextField>
                        </Grid>

                        {/* Unidade e NOP */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth select label="Unidade Emitente"
                                value={formData.cEmitUnity}
                                onChange={(e) => handleChange('cEmitUnity', parseInt(e.target.value))}
                            >
                                {metadata.units.map(u => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
                                {formData.cEmitUnity && !metadata.units.find(u => u.id === formData.cEmitUnity) && (
                                    <MenuItem key={formData.cEmitUnity} value={formData.cEmitUnity} sx={{ display: 'none' }}>
                                        {formData.cEmitUnity}
                                    </MenuItem>
                                )}
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth select label="Natureza de Operação"
                                value={formData.cNatOp}
                                onChange={(e) => handleChange('cNatOp', parseInt(e.target.value))}
                            >
                                {metadata.nops.map(n => <MenuItem key={n.id} value={n.id}>{n.id} - {n.name}</MenuItem>)}
                                {formData.cNatOp && !metadata.nops.find(n => n.id === formData.cNatOp) && (
                                    <MenuItem key={formData.cNatOp} value={formData.cNatOp} sx={{ display: 'none' }}>
                                        {formData.cNatOp}
                                    </MenuItem>
                                )}
                            </TextField>
                        </Grid>

                        {/* Pagamento */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth select label="Tipo de Pagamento"
                                value={formData.paymentType}
                                onChange={(e) => handleChange('paymentType', parseInt(e.target.value))}
                            >
                                <MenuItem value={1}>À Vista</MenuItem>
                                <MenuItem value={2}>Boleto</MenuItem>
                                <MenuItem value={3}>Cartão de Crédito</MenuItem>
                                <MenuItem value={4}>Cartão de Débito</MenuItem>
                                <MenuItem value={5}>PIX</MenuItem>
                                <MenuItem value={6}>Transferência</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth label="Condições de Pagamento"
                                value={formData.paymentTerms}
                                onChange={(e) => handleChange('paymentTerms', e.target.value)}
                            />
                        </Grid>

                        {/* Frete */}
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth type="number" label="Vlr Frete"
                                value={formData.freight}
                                onChange={(e) => handleChange('freight', e.target.value)}
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
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth select label="Transportadora"
                                value={formData.cTransporter}
                                onChange={(e) => handleChange('cTransporter', parseInt(e.target.value))}
                            >
                                {metadata.transporters.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                                {formData.cTransporter && !metadata.transporters.find(t => t.id === formData.cTransporter) && (
                                    <MenuItem key={formData.cTransporter} value={formData.cTransporter} sx={{ display: 'none' }}>
                                        {formData.cTransporter}
                                    </MenuItem>
                                )}
                            </TextField>
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="h6">Observações</Typography>
                        </Grid>

                        {/* Remarks */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth multiline rows={2} label="Financeiro"
                                value={formData.remarks.finance}
                                onChange={(e) => handleChange('remarks.finance', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth multiline rows={2} label="Logística"
                                value={formData.remarks.logistic}
                                onChange={(e) => handleChange('remarks.logistic', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth multiline rows={2} label="Geral"
                                value={formData.remarks.obs}
                                onChange={(e) => handleChange('remarks.obs', e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                <Button variant="outlined" onClick={() => navigate(-1)}>Cancelar</Button>
                                <Button
                                    type="submit" variant="contained"
                                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                                    disabled={saving}
                                >
                                    Salvar Alterações
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Container >
    )
}

export default EditLeadPage
