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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as LocalShippingIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Payment as PaymentIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
  AccountBalance as AccountBalanceIcon,
  LocalShippingOutlined as ShippingOutlinedIcon,
  Note as NoteIcon,
  SupervisorAccount as SupervisorAccountIcon
} from '@mui/icons-material'
import { ordersService } from '../services/api'
import MakPrimeLogo from '../components/MakPrimeLogo'
import { formatDate, formatCurrency, getPaymentTypeLabel, getFreightTypeLabel } from '../utils'

function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Validar ID antes de carregar
    const orderId = parseInt(id)
    if (isNaN(orderId) || orderId <= 0) {
      setError('ID de pedido inválido')
      setLoading(false)
      return
    }
    loadOrder()
  }, [id])

  const loadOrder = async () => {
    try {
      setLoading(true)
      setError('')

      const orderId = parseInt(id)
      if (isNaN(orderId) || orderId <= 0) {
        setError('ID de pedido inválido')
        setLoading(false)
        return
      }

      const orderRes = await ordersService.getById(orderId)

      if (orderRes.data.success) {
        const orderData = orderRes.data.data
        setOrder(orderData)
        // Usar itens da resposta do pedido (pode estar em items, cartItems, ou outra propriedade)
        const orderItems = orderData.items || orderData.cartItems || orderData.orderItems || []
        setItems(orderItems)
      } else {
        setError('Pedido não encontrado')
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar pedido')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error && !order) {
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

  if (!order) {
    return (
      <Container maxWidth="lg">
        <Alert severity="info" sx={{ mt: 2 }}>
          Pedido não encontrado
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Voltar
        </Button>
      </Container>
    )
  }

  // Calcular totais dos itens
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0)
  const totalIPI = items.reduce((sum, item) => sum + (parseFloat(item.ipi) || 0), 0)
  const totalST = items.reduce((sum, item) => sum + (parseFloat(item.st) || 0), 0)
  const freight = parseFloat(order.freight) || 0
  const grandTotal = subtotal + totalIPI + totalST + freight

  // Filtrar observações não vazias
  const remarks = order.remarks || {}
  const hasRemarks = {
    finance: remarks.finance || remarks.xRemarksFinance,
    logistic: remarks.logistic || remarks.xRemarksLogistic,
    nfe: remarks.nfe || remarks.xRemarksNFE,
    obs: remarks.obs || remarks.xRemarksOBS,
    manager: remarks.manager || remarks.xRemarksManager
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header com Gradiente Verde */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
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
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon sx={{ fontSize: 32 }} />
                Pedido #{order.orderWeb || order.id}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Chip
                  label="Pedido Confirmado"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 600
                  }}
                />
                {order.customer?.nome && (
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    • {order.customer.nome}
                  </Typography>
                )}
                {order.createdAt && (
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    • {formatDate(order.createdAt)}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' }
              }}
            >
              Voltar
            </Button>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' }
              }}
            >
              Imprimir
            </Button>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Card 1 - Informações do Cliente */}
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PersonIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Informações do Cliente
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Nome
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {order.customer?.nome || '-'}
                  </Typography>
                </Box>
                {(order.customer?.cnpj || order.customer?.cpf) && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      CNPJ/CPF
                    </Typography>
                    <Typography variant="body1">
                      {order.customer.cnpj || order.customer.cpf || '-'}
                    </Typography>
                  </Box>
                )}
                {order.customer?.ender && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Endereço
                    </Typography>
                    <Typography variant="body1">
                      {order.customer.ender}
                    </Typography>
                    {(order.customer?.cidade || order.customer?.estado) && (
                      <Typography variant="body2" color="text.secondary">
                        {order.customer.cidade || ''}
                        {order.customer.cidade && order.customer.estado ? ' - ' : ''}
                        {order.customer.estado || ''}
                      </Typography>
                    )}
                  </Box>
                )}
                {order.customer?.email && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {order.customer.email}
                    </Typography>
                  </Box>
                )}
                {order.customer?.telefone && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Telefone
                    </Typography>
                    <Typography variant="body1">
                      {order.customer.telefone}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 2 - Dados do Pedido */}
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ReceiptIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Dados do Pedido
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Número do Pedido
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {order.orderWeb || order.id}
                  </Typography>
                </Box>
                {order.createdAt && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Data de Criação
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(order.createdAt)}
                    </Typography>
                  </Box>
                )}
                {order.deliveryDate && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Data de Entrega Prevista
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(order.deliveryDate)}
                    </Typography>
                  </Box>
                )}
                {order.buyer && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Vendedor
                    </Typography>
                    <Typography variant="body1">
                      {order.buyer}
                    </Typography>
                  </Box>
                )}
                {order.paymentType && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Forma de Pagamento
                    </Typography>
                    <Typography variant="body1">
                      {getPaymentTypeLabel(order.paymentType)}
                    </Typography>
                  </Box>
                )}
                {order.paymentTerms && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Condições de Pagamento
                    </Typography>
                    <Typography variant="body1">
                      {order.paymentTerms}
                    </Typography>
                  </Box>
                )}
                {order.nop && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Natureza da Operação
                    </Typography>
                    <Typography variant="body1">
                      {order.nop}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 3 - Logística */}
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocalShippingIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Logística
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {order.transporter?.name && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Transportadora
                    </Typography>
                    <Typography variant="body1">
                      {order.transporter.name}
                    </Typography>
                  </Box>
                )}
                {order.freightType && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Tipo de Frete
                    </Typography>
                    <Typography variant="body1">
                      {getFreightTypeLabel(order.freightType)}
                    </Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Valor do Frete
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {formatCurrency(freight)}
                  </Typography>
                </Box>
                {order.cEmitUnity && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Unidade Emissora
                    </Typography>
                    <Typography variant="body1">
                      {order.cEmitUnity}
                    </Typography>
                  </Box>
                )}
                {order.cLogUnity && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Unidade Logística
                    </Typography>
                    <Typography variant="body1">
                      {order.cLogUnity}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Seção de Totais */}
        <Grid item xs={12}>
          <Card
            elevation={4}
            sx={{
              bgcolor: 'success.main',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MoneyIcon sx={{ fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Totais do Pedido
                </Typography>
              </Box>
              <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.3)' }} />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Subtotal
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatCurrency(subtotal)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    IPI
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatCurrency(totalIPI)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    ST
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatCurrency(totalST)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Frete
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatCurrency(freight)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.3)' }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      Total Geral
                    </Typography>
                    <Chip
                      label={formatCurrency(grandTotal)}
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        height: 48,
                        '& .MuiChip-label': {
                          px: 3,
                          fontSize: '1.2rem'
                        }
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Tabela de Itens */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ReceiptIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Itens do Pedido
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {items.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Nenhum item encontrado
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Produto</TableCell>
                      <TableCell align="right">Quantidade</TableCell>
                      <TableCell align="right">Preço Unit.</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                      <TableCell align="right">IPI</TableCell>
                      <TableCell align="right">ST</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                {item.product?.model && (
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {item.product.model}
                                  </Typography>
                                )}
                                {item.product?.brand && (
                                  <MakPrimeLogo height={18} marca={item.product.brand} />
                                )}
                              </Box>
                              {item.product?.brand && (
                                <Typography variant="caption" color="text.secondary">
                                  Marca: {item.product.brand}
                                </Typography>
                              )}
                              <Typography variant="body2">
                                {item.product?.name || `Produto #${item.productId}`}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.subtotal)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.ipi)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.st)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Seção de Observações */}
        {(hasRemarks.finance || hasRemarks.logistic || hasRemarks.nfe || hasRemarks.obs || hasRemarks.manager) && (
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <DescriptionIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Observações
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {hasRemarks.finance && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      variant="outlined"
                      sx={{
                        bgcolor: 'rgba(76, 175, 80, 0.05)',
                        borderLeft: '4px solid',
                        borderLeftColor: 'success.main',
                        height: '100%'
                      }}
                    >
                      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.dark', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccountBalanceIcon fontSize="small" />
                          Financeiro
                        </Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                          {remarks.finance || remarks.xRemarksFinance}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                {hasRemarks.logistic && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      variant="outlined"
                      sx={{
                        bgcolor: 'rgba(33, 150, 243, 0.05)',
                        borderLeft: '4px solid',
                        borderLeftColor: 'primary.main',
                        height: '100%'
                      }}
                    >
                      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.dark', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ShippingOutlinedIcon fontSize="small" />
                          Logística
                        </Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                          {remarks.logistic || remarks.xRemarksLogistic}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                {hasRemarks.nfe && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      variant="outlined"
                      sx={{
                        bgcolor: 'rgba(255, 152, 0, 0.05)',
                        borderLeft: '4px solid',
                        borderLeftColor: 'warning.main',
                        height: '100%'
                      }}
                    >
                      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'warning.dark', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ReceiptIcon fontSize="small" />
                          NFE
                        </Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                          {remarks.nfe || remarks.xRemarksNFE}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                {hasRemarks.obs && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      variant="outlined"
                      sx={{
                        bgcolor: 'rgba(158, 158, 158, 0.05)',
                        borderLeft: '4px solid',
                        borderLeftColor: 'grey.500',
                        height: '100%'
                      }}
                    >
                      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <NoteIcon fontSize="small" />
                          Observações Gerais
                        </Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                          {remarks.obs || remarks.xRemarksOBS}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                {hasRemarks.manager && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      variant="outlined"
                      sx={{
                        bgcolor: 'rgba(156, 39, 176, 0.05)',
                        borderLeft: '4px solid',
                        borderLeftColor: 'secondary.main',
                        height: '100%'
                      }}
                    >
                      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'secondary.dark', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <SupervisorAccountIcon fontSize="small" />
                          Gerente
                        </Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                          {remarks.manager || remarks.xRemarksManager}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  )
}

export default OrderDetailPage
