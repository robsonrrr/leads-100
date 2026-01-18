/**
 * Intent Analysis Panel
 * 
 * Painel para análise de intenção de mensagens com IA
 * 
 * @version 1.0
 * @date 2026-01-18
 */

import React, { useState } from 'react'
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Chip,
    CircularProgress,
    Alert,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    LinearProgress,
    Collapse,
    IconButton,
} from '@mui/material'
import {
    Psychology as PsychologyIcon,
    Send as SendIcon,
    ShoppingCart as ShoppingCartIcon,
    LocalOffer as LocalOfferIcon,
    Inventory as InventoryIcon,
    QuestionMark as QuestionIcon,
    SentimentSatisfied as SentimentSatisfiedIcon,
    SentimentDissatisfied as SentimentDissatisfiedIcon,
    SentimentNeutral as SentimentNeutralIcon,
    Warning as WarningIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    ContentCopy as ContentCopyIcon,
} from '@mui/icons-material'
import { superbotService } from '../../services/superbot.service'

// Configuração de intenções
const INTENT_CONFIG = {
    QUOTE_REQUEST: {
        label: 'Pedido de Cotação',
        color: '#4CAF50',
        icon: <ShoppingCartIcon />
    },
    PURCHASE_INTENT: {
        label: 'Intenção de Compra',
        color: '#2196F3',
        icon: <ShoppingCartIcon />
    },
    PRICE_CHECK: {
        label: 'Consulta de Preço',
        color: '#FF9800',
        icon: <LocalOfferIcon />
    },
    STOCK_CHECK: {
        label: 'Consulta de Estoque',
        color: '#9C27B0',
        icon: <InventoryIcon />
    },
    COMPLAINT: {
        label: 'Reclamação',
        color: '#F44336',
        icon: <WarningIcon />
    },
    ORDER_STATUS: {
        label: 'Status do Pedido',
        color: '#00BCD4',
        icon: <InventoryIcon />
    },
    NEGOTIATION: {
        label: 'Negociação',
        color: '#FFC107',
        icon: <LocalOfferIcon />
    },
    GENERAL_QUESTION: {
        label: 'Pergunta Geral',
        color: '#607D8B',
        icon: <QuestionIcon />
    },
    UNKNOWN: {
        label: 'Desconhecido',
        color: '#9E9E9E',
        icon: <QuestionIcon />
    },
}

const IntentAnalysisPanel = ({
    initialMessage = '',
    phone = null,
    onAnalysisComplete = null,
    compact = false,
}) => {
    const [message, setMessage] = useState(initialMessage)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [showDetails, setShowDetails] = useState(true)

    const analyze = async () => {
        if (!message.trim()) return

        setLoading(true)
        setError(null)

        try {
            const response = await superbotService.analyzeIntentAI(message, phone)
            const analysisResult = response.data?.data
            setResult(analysisResult)
            onAnalysisComplete?.(analysisResult)
        } catch (err) {
            console.error('Erro na análise:', err)
            setError(err.response?.data?.error || 'Erro ao analisar mensagem')
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            analyze()
        }
    }

    const getSentimentIcon = (sentiment) => {
        switch (sentiment) {
            case 'positive':
                return <SentimentSatisfiedIcon color="success" />
            case 'negative':
                return <SentimentDissatisfiedIcon color="error" />
            default:
                return <SentimentNeutralIcon />
        }
    }

    const getIntentConfig = (intent) => {
        return INTENT_CONFIG[intent] || INTENT_CONFIG.UNKNOWN
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
    }

    return (
        <Paper elevation={compact ? 1 : 2} sx={{ p: compact ? 2 : 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PsychologyIcon color="primary" />
                <Typography variant={compact ? 'subtitle1' : 'h6'}>
                    Análise de Intenção com IA
                </Typography>
            </Box>

            {/* Input */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                    fullWidth
                    multiline={!compact}
                    rows={compact ? 1 : 3}
                    placeholder="Digite uma mensagem para analisar..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    size={compact ? 'small' : 'medium'}
                />
                <Button
                    variant="contained"
                    onClick={analyze}
                    disabled={loading || !message.trim()}
                    sx={{ minWidth: 100 }}
                >
                    {loading ? <CircularProgress size={20} /> : <SendIcon />}
                </Button>
            </Box>

            {/* Error */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Results */}
            {result && (
                <Box>
                    <Divider sx={{ my: 2 }} />

                    {/* Main Intent */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                bgcolor: getIntentConfig(result.intent).color,
                                color: '#fff',
                            }}
                        >
                            {getIntentConfig(result.intent).icon}
                        </Box>

                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6">
                                {getIntentConfig(result.intent).label}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={result.confidence * 100}
                                    sx={{
                                        flex: 1,
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: 'rgba(0,0,0,0.1)',
                                        '& .MuiLinearProgress-bar': {
                                            bgcolor: getIntentConfig(result.intent).color,
                                        }
                                    }}
                                />
                                <Typography variant="body2" fontWeight="bold">
                                    {Math.round(result.confidence * 100)}%
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Quick Info */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Chip
                            icon={getSentimentIcon(result.sentiment)}
                            label={`Sentimento: ${result.sentiment || 'neutro'}`}
                            variant="outlined"
                        />
                        {result.urgency && (
                            <Chip
                                label={`Urgência: ${result.urgency}`}
                                color={result.urgency === 'high' ? 'error' : 'default'}
                                variant="outlined"
                            />
                        )}
                        {result.should_create_lead && (
                            <Chip
                                icon={<ShoppingCartIcon />}
                                label="Criar Lead"
                                color="success"
                            />
                        )}
                    </Box>

                    {/* Details */}
                    <Box sx={{ mt: 2 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer'
                            }}
                            onClick={() => setShowDetails(!showDetails)}
                        >
                            <Typography variant="subtitle2" color="text.secondary">
                                Detalhes da Análise
                            </Typography>
                            <IconButton size="small">
                                {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        </Box>

                        <Collapse in={showDetails}>
                            {/* Summary */}
                            {result.summary && (
                                <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: '#f5f5f5' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Resumo
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={() => copyToClipboard(result.summary)}
                                        >
                                            <ContentCopyIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                    <Typography variant="body2">
                                        {result.summary}
                                    </Typography>
                                </Paper>
                            )}

                            {/* Entities */}
                            {result.entities && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Entidades Extraídas
                                    </Typography>

                                    {/* Products */}
                                    {result.entities.products?.length > 0 && (
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Produtos:
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                                {result.entities.products.map((product, i) => (
                                                    <Chip
                                                        key={i}
                                                        size="small"
                                                        label={`${product.query || product.name}${product.quantity ? ` (${product.quantity})` : ''}`}
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    )}

                                    {/* Values */}
                                    {result.entities.values?.length > 0 && (
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Valores:
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                                {result.entities.values.map((value, i) => (
                                                    <Chip
                                                        key={i}
                                                        size="small"
                                                        label={typeof value === 'object' ? `R$ ${value.amount}` : value}
                                                        color="success"
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    )}

                                    {/* Dates */}
                                    {result.entities.dates?.length > 0 && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Datas/Prazos:
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                                {result.entities.dates.map((date, i) => (
                                                    <Chip
                                                        key={i}
                                                        size="small"
                                                        label={date}
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            )}

                            {/* Raw Response */}
                            {result.raw_response && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Modelo: {result.model || 'gpt-3.5-turbo'} |
                                        Tokens: {result.usage?.total_tokens || '-'}
                                    </Typography>
                                </Box>
                            )}
                        </Collapse>
                    </Box>
                </Box>
            )}
        </Paper>
    )
}

export default IntentAnalysisPanel
