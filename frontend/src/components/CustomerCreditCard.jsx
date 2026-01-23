/**
 * CustomerCreditCard - Exibe o status de crédito do cliente e avaliação do pedido
 * Integrado com Credit Agent via /api/v2/analytics/credit
 * 
 * Suporta:
 * 1. Perfil de crédito básico (GET /credit/:customerId)
 * 2. Avaliação completa via Policy Engine (POST /credit/evaluate)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    Skeleton,
    Tooltip,
    IconButton,
    Collapse,
    Alert,
    LinearProgress
} from '@mui/material'
import {
    AccountBalance as CreditIcon,
    Warning as WarningIcon,
    CheckCircle as CheckIcon,
    Block as BlockIcon,
    Refresh as RefreshIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    ShoppingCart as CartIcon,
    Policy as PolicyIcon
} from '@mui/icons-material'
import { analyticsV2Service } from '../services/api'

const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value)
}

/**
 * CustomerCreditCard
 * @param {number} customerId - ID do cliente
 * @param {number} orderTotal - Valor total do pedido (opcional)
 * @param {number} leadId - ID do lead para avaliação completa (opcional)
 * @param {number} termsDays - Prazo de pagamento em dias (opcional, default 30)
 * @param {number} installments - Número de parcelas (opcional, default 1)
 * @param {boolean} marginOk - Se margem está ok (opcional, default true)
 * @param {function} onCreditEvaluated - Callback com resultado da avaliação (opcional)
 */
export default function CustomerCreditCard({
    customerId,
    orderTotal = 0,
    leadId = null,
    termsDays = 30,
    installments = 1,
    marginOk = true,
    onCreditEvaluated
}) {
    const [creditData, setCreditData] = useState(null)
    const [fullEvaluation, setFullEvaluation] = useState(null)
    const [loading, setLoading] = useState(true)
    const [evaluating, setEvaluating] = useState(false)
    const [error, setError] = useState(null)
    const [expanded, setExpanded] = useState(false)

    // Refs para evitar loops infinitos
    const callbackRef = useRef(onCreditEvaluated)
    const lastEvalKeyRef = useRef('')

    // Manter callback ref atualizado
    useEffect(() => {
        callbackRef.current = onCreditEvaluated
    })

    // Carregar status de crédito básico
    const loadCreditStatus = useCallback(async () => {
        if (!customerId) return

        setLoading(true)
        setError(null)

        try {
            const response = await analyticsV2Service.getCreditStatus(customerId)
            if (response.data.success) {
                setCreditData(response.data.data)
            } else {
                setError('Erro ao carregar crédito')
            }
        } catch (err) {
            console.error('Error loading credit status:', err)
            setError(err.response?.data?.error?.message || 'Erro ao carregar crédito')
        } finally {
            setLoading(false)
        }
    }, [customerId])

    // Fazer avaliação completa via Credit Agent
    const evaluateFullCredit = useCallback(async () => {
        if (!customerId || !leadId || orderTotal <= 0) return

        setEvaluating(true)

        try {
            const response = await analyticsV2Service.evaluateCredit({
                customer_id: customerId,
                order_id: leadId,
                order_total: orderTotal,
                terms_days: termsDays,
                installments: installments,
                down_payment_pct: 0,
                pricing_status: 'OK',
                margin_ok: marginOk,
                policy_refs: []
            })

            if (response.data.success) {
                setFullEvaluation(response.data.data)
                console.log('Full Credit Evaluation:', response.data.data)
            }
        } catch (err) {
            console.error('Error in full credit evaluation:', err)
            // Não setar erro aqui - fallback para avaliação básica
        } finally {
            setEvaluating(false)
        }
    }, [customerId, leadId, orderTotal, termsDays, installments, marginOk])

    // Carregar quando customerId mudar
    useEffect(() => {
        if (customerId) {
            loadCreditStatus()
        }
    }, [customerId, loadCreditStatus])

    // Fazer avaliação completa quando tiver leadId e orderTotal
    useEffect(() => {
        if (creditData && leadId && orderTotal > 0) {
            evaluateFullCredit()
        }
    }, [creditData, leadId, orderTotal, evaluateFullCredit])

    // Notificar parent quando creditData ou orderTotal mudar
    useEffect(() => {
        if (!creditData) return

        // Usar resultado da avaliação completa se disponível
        let canConvert = evaluateConversion(creditData, orderTotal)
        let reason = getConversionReason(creditData, orderTotal)

        // Se tiver avaliação completa, usar essa
        if (fullEvaluation) {
            const outcome = fullEvaluation.outcome
            canConvert = outcome === 'ALLOW' || outcome === 'RECOMMEND'
            reason = outcome === 'ALLOW' ? 'Aprovado' :
                outcome === 'RECOMMEND' ? 'Aprovado com ressalvas' :
                    outcome === 'ESCALATE' ? 'Requer aprovação gerencial' :
                        fullEvaluation.reasons?.join(', ') || 'Negado pelo Credit Agent'
        }

        const evalKey = `${creditData.customer_id}-${orderTotal}-${canConvert}-${fullEvaluation?.outcome || ''}`

        // Só notificar se realmente mudou
        if (evalKey !== lastEvalKeyRef.current && callbackRef.current) {
            lastEvalKeyRef.current = evalKey
            callbackRef.current({
                creditData,
                fullEvaluation,
                orderTotal,
                canConvert,
                reason
            })
        }
    }, [creditData, orderTotal, fullEvaluation])

    // Avaliar se pode converter o pedido (avaliação básica)
    const evaluateConversion = (data, total) => {
        if (!data) return false
        if (data.is_blocked || data.status === 'BLOCKED') return false
        if (total > 0 && data.credit_available < total) return false
        if (data.can_convert === false) return false
        return true
    }

    // Obter razão para conversão negada
    const getConversionReason = (data, total) => {
        if (!data) return 'Dados de crédito não disponíveis'
        if (data.is_blocked || data.status === 'BLOCKED') return 'Cliente bloqueado'
        if (total > 0 && data.credit_available < total) {
            const falta = total - data.credit_available
            return `Crédito insuficiente (faltam ${formatCurrency(falta)})`
        }
        if (data.can_convert === false) return data.message || 'Conversão não permitida'
        return 'OK'
    }

    const getStatusConfig = (status) => {
        const configs = {
            OK: { color: 'success', icon: <CheckIcon />, label: 'Crédito OK', bgColor: '#e8f5e9' },
            LOW_CREDIT: { color: 'warning', icon: <WarningIcon />, label: 'Crédito Baixo', bgColor: '#fff3e0' },
            LIMIT_EXCEEDED: { color: 'error', icon: <WarningIcon />, label: 'Limite Excedido', bgColor: '#ffebee' },
            BLOCKED: { color: 'error', icon: <BlockIcon />, label: 'Bloqueado', bgColor: '#ffebee' },
            OVERDUE: { color: 'error', icon: <WarningIcon />, label: 'Inadimplente', bgColor: '#ffebee' },
            PENDING: { color: 'warning', icon: <WarningIcon />, label: 'Sem Limite', bgColor: '#fff3e0' }
        }
        return configs[status] || configs.OK
    }

    const getOutcomeConfig = (outcome) => {
        const configs = {
            ALLOW: { color: 'success', label: 'Aprovado', icon: <CheckIcon /> },
            RECOMMEND: { color: 'info', label: 'Recomendado', icon: <CheckIcon /> },
            ESCALATE: { color: 'warning', label: 'Escalar', icon: <WarningIcon /> },
            DENY: { color: 'error', label: 'Negado', icon: <BlockIcon /> }
        }
        return configs[outcome] || configs.DENY
    }

    const getRiskGradeColor = (grade) => {
        const colors = { A: '#4caf50', B: '#8bc34a', C: '#ffc107', D: '#ff9800', E: '#f44336', NA: '#9e9e9e' }
        return colors[grade] || colors.NA
    }

    if (!customerId) return null

    if (loading) {
        return (
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CreditIcon color="primary" />
                        <Typography variant="subtitle1" fontWeight={600}>Crédito</Typography>
                    </Box>
                    <Skeleton variant="rectangular" height={60} />
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CreditIcon color="disabled" />
                            <Typography variant="subtitle1" fontWeight={600}>Crédito</Typography>
                        </Box>
                        <IconButton size="small" onClick={loadCreditStatus}>
                            <RefreshIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <Alert severity="warning" sx={{ mt: 1 }}>{error}</Alert>
                </CardContent>
            </Card>
        )
    }

    if (!creditData) return null

    const statusConfig = getStatusConfig(creditData.status)
    const utilizationPercent = creditData.credit_limit > 0
        ? ((creditData.credit_used / creditData.credit_limit) * 100).toFixed(0)
        : 0

    const orderExceedsCredit = orderTotal > 0 && orderTotal > creditData.credit_available
    const basicCanConvert = evaluateConversion(creditData, orderTotal)

    // Usar avaliação completa se disponível
    const hasFullEval = fullEvaluation && fullEvaluation.outcome
    const finalCanConvert = hasFullEval
        ? (fullEvaluation.outcome === 'ALLOW' || fullEvaluation.outcome === 'RECOMMEND')
        : basicCanConvert

    const orderCreditPercent = creditData.credit_available > 0 && orderTotal > 0
        ? Math.min((orderTotal / creditData.credit_available) * 100, 100)
        : 0

    return (
        <Card
            sx={{
                mb: 2,
                bgcolor: !finalCanConvert ? '#ffebee' : statusConfig.bgColor,
                border: !finalCanConvert ? '2px solid #f44336' : `1px solid ${statusConfig.bgColor}`,
                transition: 'all 0.3s ease'
            }}
        >
            <CardContent sx={{ py: 2 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CreditIcon color={!finalCanConvert ? 'error' : statusConfig.color} />
                        <Typography variant="subtitle1" fontWeight={600}>Crédito</Typography>
                        {creditData.source && creditData.source !== 'fallback' && (
                            <Chip
                                label={creditData.source === 'credit_agent' ? 'Credit Agent' : 'local_db'}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.65rem' }}
                            />
                        )}
                        {hasFullEval && (
                            <Tooltip title="Avaliação via Policy Engine">
                                <Chip
                                    icon={<PolicyIcon sx={{ fontSize: 14 }} />}
                                    label={getOutcomeConfig(fullEvaluation.outcome).label}
                                    color={getOutcomeConfig(fullEvaluation.outcome).color}
                                    size="small"
                                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                                />
                            </Tooltip>
                        )}
                        {evaluating && (
                            <Typography variant="caption" color="text.secondary">
                                avaliando...
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip
                            icon={!finalCanConvert ? <WarningIcon /> : statusConfig.icon}
                            label={!finalCanConvert ? 'Bloqueado' : statusConfig.label}
                            color={!finalCanConvert ? 'error' : statusConfig.color}
                            size="small"
                            sx={{ fontWeight: 600 }}
                        />
                        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                        <IconButton size="small" onClick={() => { loadCreditStatus(); if (leadId) evaluateFullCredit(); }}>
                            <RefreshIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>

                {/* Main Info */}
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 1 }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Limite</Typography>
                        <Typography variant="h6" fontWeight={700}>
                            {formatCurrency(creditData.credit_limit)}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="caption" color="text.secondary">Disponível</Typography>
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            color={creditData.credit_available >= orderTotal ? 'success.main' : 'error.main'}
                        >
                            {formatCurrency(creditData.credit_available)}
                        </Typography>
                    </Box>

                    {orderTotal > 0 && (
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                <CartIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                                Pedido
                            </Typography>
                            <Typography
                                variant="h6"
                                fontWeight={700}
                                color={orderExceedsCredit ? 'error.main' : 'text.primary'}
                            >
                                {formatCurrency(orderTotal)}
                            </Typography>
                        </Box>
                    )}

                    {creditData.risk_grade && creditData.risk_grade !== 'NA' && (
                        <Box>
                            <Typography variant="caption" color="text.secondary">Risco</Typography>
                            <Chip
                                label={`Grau ${creditData.risk_grade}`}
                                size="small"
                                sx={{
                                    bgcolor: getRiskGradeColor(creditData.risk_grade),
                                    color: 'white',
                                    fontWeight: 700,
                                    mt: 0.5
                                }}
                            />
                        </Box>
                    )}
                </Box>

                {/* Progress bar */}
                {orderTotal > 0 && creditData.credit_available > 0 && (
                    <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                                Uso do crédito
                            </Typography>
                            <Typography variant="caption" fontWeight={600}>
                                {orderCreditPercent > 100 ? '>100' : orderCreditPercent.toFixed(0)}%
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(orderCreditPercent, 100)}
                            color={orderCreditPercent > 100 ? 'error' : orderCreditPercent > 80 ? 'warning' : 'success'}
                            sx={{ height: 8, borderRadius: 1 }}
                        />
                    </Box>
                )}

                {/* Alert if can't convert */}
                {!finalCanConvert && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        <strong>Conversão bloqueada:</strong> {
                            hasFullEval
                                ? fullEvaluation.reasons?.join(', ') || 'Negado pelo Policy Engine'
                                : getConversionReason(creditData, orderTotal)
                        }
                    </Alert>
                )}

                {/* Expanded Details */}
                <Collapse in={expanded}>
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Utilização</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography variant="body2" fontWeight={600}>{utilizationPercent}%</Typography>
                                    {utilizationPercent > 80 ? (
                                        <TrendingUpIcon color="error" fontSize="small" />
                                    ) : (
                                        <TrendingDownIcon color="success" fontSize="small" />
                                    )}
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">Em Uso</Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {formatCurrency(creditData.credit_used)}
                                </Typography>
                            </Box>

                            {creditData.overdue_days > 0 && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Dias em Atraso</Typography>
                                    <Typography variant="body2" fontWeight={600} color="error.main">
                                        {creditData.overdue_days} dias
                                    </Typography>
                                </Box>
                            )}

                            {creditData.customer_name && (
                                <Box sx={{ flex: 1, minWidth: 200 }}>
                                    <Typography variant="caption" color="text.secondary">Cliente</Typography>
                                    <Typography variant="body2" noWrap title={creditData.customer_name}>
                                        {creditData.customer_name}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Full Evaluation Details */}
                        {hasFullEval && (
                            <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                    <PolicyIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                                    Avaliação Policy Engine
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <Typography variant="body2">
                                        <strong>Decisão:</strong> {fullEvaluation.outcome}
                                    </Typography>
                                    {fullEvaluation.approved_amount && (
                                        <Typography variant="body2">
                                            <strong>Valor Aprovado:</strong> {formatCurrency(fullEvaluation.approved_amount)}
                                        </Typography>
                                    )}
                                    {fullEvaluation.conditions?.length > 0 && (
                                        <Typography variant="body2">
                                            <strong>Condições:</strong> {fullEvaluation.conditions.join(', ')}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        )}

                        {creditData.message && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                {creditData.message}
                            </Typography>
                        )}
                    </Box>
                </Collapse>
            </CardContent>
        </Card>
    )
}
