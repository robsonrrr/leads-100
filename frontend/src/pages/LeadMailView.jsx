import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Container,
    Paper,
    Typography,
    Box,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Divider,
    Button,
    IconButton,
    CircularProgress
} from '@mui/material'
import {
    Print as PrintIcon,
    ArrowBack as ArrowBackIcon,
    Email as EmailIcon
} from '@mui/icons-material'
import { leadsService } from '../services/api'
import { formatDate, formatCurrency, getPaymentTypeLabel, getFreightTypeLabel } from '../utils'
import MakPrimeLogo from '../components/MakPrimeLogo'

function LeadMailView() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [lead, setLead] = useState(null)
    const [items, setItems] = useState([])
    const [totals, setTotals] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        loadData()
    }, [id])

    const loadData = async () => {
        try {
            setLoading(true)
            const [leadRes, itemsRes, totalsRes] = await Promise.all([
                leadsService.getById(id),
                leadsService.getItems(id),
                leadsService.calculateTotals(id)
            ])

            if (leadRes.data.success) setLead(leadRes.data.data)
            if (itemsRes.data.success) {
                const filteredAndSorted = (itemsRes.data.data || [])
                    .filter(item => (parseFloat(item.price) || 0) > 0)
                    .sort((a, b) => {
                        const modelA = a.product?.model || ''
                        const modelB = b.product?.model || ''
                        return modelA.localeCompare(modelB, undefined, { numeric: true, sensitivity: 'base' })
                    })
                setItems(filteredAndSorted)
            }
            if (totalsRes.data.success) setTotals(totalsRes.data.data)
        } catch (err) {
            setError('Erro ao carregar dados do lead')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>
    if (error) return <Box sx={{ p: 4 }}><Typography color="error">{error}</Typography></Box>
    if (!lead) return null

    return (
        <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 4, '@media print': { bgcolor: 'white', py: 0 } }}>
            {/* Toolbar - Oculta na impressão */}
            <Container maxWidth="md" sx={{ mb: 2, '@media print': { display: 'none' } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Voltar</Button>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button variant="outlined" startIcon={<EmailIcon />}>Enviar Email</Button>
                        <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>Imprimir</Button>
                    </Box>
                </Box>
            </Container>

            {/* Documento */}
            <Container maxWidth="md">
                <Paper
                    elevation={3}
                    sx={{
                        p: 6,
                        borderRadius: 0,
                        minHeight: '29.7cm',
                        '@media print': {
                            boxShadow: 'none',
                            p: 0,
                            m: 0,
                            minHeight: 'auto'
                        }
                    }}
                >
                    {/* Header: Logo e Document Type */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'flex-start' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <img src="https://cdn.rolemak.com.br/media/rolemak-preto.svg" alt="Rolemak" style={{ height: 40 }} />
                            </Box>
                            <Typography variant="body2" sx={{ mt: 1, fontSize: '0.75rem', color: 'text.secondary', fontWeight: 500 }}>
                                Rolemak - Peças e Acessórios<br />
                                Rua Atílio Piffer, 477 - Casa Verde - São Paulo/SP<br />
                                Tel: (11) 3345-2722 | www.rolemak.com.br
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', letterSpacing: -1 }}>COTAÇÃO</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, mt: -1 }}>#{lead.id}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>EMITIDO EM: {formatDate(lead.createdAt)}</Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 4, borderBottomWidth: 2 }} />

                    {/* Customer and Vendor Info */}
                    <Grid container spacing={4} sx={{ mb: 4 }}>
                        <Grid item xs={7}>
                            <Typography variant="overline" color="primary" sx={{ fontWeight: 700 }}>CLIENTE</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5 }}>{lead.customer?.nome || 'CLIENTE NÃO IDENTIFICADO'}</Typography>
                            {lead.customer?.ender && <Typography variant="body2">{lead.customer.ender}</Typography>}
                            <Typography variant="body2">{lead.customer?.cidade || ''} - {lead.customer?.estado || ''}</Typography>
                            {lead.customerPhone && <Typography variant="body2">Tel: {lead.customerPhone}</Typography>}
                            {lead.buyer && <Typography variant="body2">A/C: {lead.buyer}</Typography>}
                        </Grid>
                        <Grid item xs={5} sx={{ textAlign: 'right' }}>
                            <Typography variant="overline" color="primary" sx={{ fontWeight: 700 }}>VENDEDOR</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700 }}>{lead.sellerNick || '-'}</Typography>
                            <Typography variant="body2">Validade da proposta: 7 dias</Typography>
                        </Grid>
                    </Grid>

                    {/* Items Table */}
                    <TableContainer component={Box} sx={{ mb: 4 }}>
                        <Table size="small" sx={{
                            '& .MuiTableCell-head': {
                                bgcolor: 'grey.50',
                                fontWeight: 800,
                                borderBottom: '2px solid black',
                                textTransform: 'uppercase',
                                fontSize: '0.7rem'
                            },
                            '& .MuiTableCell-body': {
                                py: 1.5,
                                borderBottom: '1px solid #eee',
                                fontSize: '0.85rem'
                            }
                        }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell width="15%">Código</TableCell>
                                    <TableCell>Descrição do Item</TableCell>
                                    <TableCell align="center" width="10%">Qtd</TableCell>
                                    <TableCell align="right" width="15%">P. Unit</TableCell>
                                    <TableCell align="right" width="15%">Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map((item, idx) => (
                                    <TableRow key={item.id} sx={idx % 2 === 0 ? {} : { bgcolor: 'rgba(0,0,0,0.01)' }}>
                                        <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{item.product?.model || '-'}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.2 }}>{item.product?.name || '-'}</Typography>
                                            {item.product?.brand && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <MakPrimeLogo height={12} marca={item.product.brand} />
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>{item.product.brand}</Typography>
                                                </Box>
                                            )}
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 500 }}>{item.quantity}</TableCell>
                                        <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800 }}>
                                            {formatCurrency((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0))}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Totals Section */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'flex-start' }}>
                        <Box sx={{ width: '55%' }}>
                            <Typography variant="overline" color="primary" sx={{ fontWeight: 800, display: 'block', mb: 1 }}>Observações e Condições</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.6, color: 'text.secondary', pr: 4 }}>
                                • Preços expressos em Reais (BRL).<br />
                                • Impostos inclusos conforme legislação vigente.<br />
                                • Frete: {getFreightTypeLabel(lead.freightType)} via {lead.cTransporter?.name || lead.cTransporter || 'a combinar'}.<br />
                                • Prazo de entrega estimado: {lead.deliveryDate ? formatDate(lead.deliveryDate) : 'Sob consulta'}.<br />
                                • Forma de Pagamento: {getPaymentTypeLabel(lead.paymentType)} - {lead.paymentTerms || 'À vista'}.
                            </Typography>
                        </Box>
                        <Box sx={{ width: '300px' }}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600 }}>SUBTOTAL:</Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{formatCurrency(totals?.subtotal)}</Typography>
                                </Box>
                                {totals?.totalIPI > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 600 }}>IPI:</Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 700 }}>{formatCurrency(totals.totalIPI)}</Typography>
                                    </Box>
                                )}
                                {totals?.totalST > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 600 }}>ST:</Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 700 }}>{formatCurrency(totals.totalST)}</Typography>
                                    </Box>
                                )}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600 }}>FRETE:</Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{formatCurrency(lead.freight)}</Typography>
                                </Box>
                                <Divider sx={{ my: 1.5 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, color: 'primary.main' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 800 }}>TOTAL GERAL:</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1 }}>{formatCurrency(totals?.grandTotal || totals?.total)}</Typography>
                                </Box>
                            </Paper>
                        </Box>
                    </Box>

                    {/* Footer Info */}
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                        <Grid item xs={12}>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 1 }}>PAGAMENTO E ENTREGA</Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2"><strong>Forma:</strong> {getPaymentTypeLabel(lead.paymentType)}</Typography>
                                        <Typography variant="body2"><strong>Condição:</strong> {lead.paymentTerms || '-'}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2"><strong>Transportadora:</strong> {lead.cTransporter || '-'}</Typography>
                                        <Typography variant="body2"><strong>Previsão:</strong> {formatDate(lead.deliveryDate)}</Typography>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                        {lead.remarks?.obs && (
                            <Grid item xs={12}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 0.5 }}>OBSERVAÇÕES</Typography>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{lead.remarks.obs}</Typography>
                            </Grid>
                        )}
                    </Grid>

                    {/* Legal Footer */}
                    <Divider sx={{ mt: 'auto', mb: 2 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
                        Este documento é apenas uma cotação e não garante a reserva de estoque. Preços sujeitos a alteração sem aviso prévio.<br />
                        © 2026 Rolemak - Gerado via Mak Intelligence Agent
                    </Typography>
                </Paper>
            </Container>
        </Box>
    )
}

export default LeadMailView
