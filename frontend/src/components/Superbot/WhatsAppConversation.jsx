/**
 * WhatsApp Conversation History
 * 
 * Componente para visualização de histórico de conversas do WhatsApp
 * Integração com Superbot
 * 
 * @version 1.0
 * @date 2026-01-18
 */

import React, { useState, useEffect, useRef } from 'react'
import {
    Box,
    Paper,
    Typography,
    Avatar,
    Chip,
    IconButton,
    TextField,
    InputAdornment,
    CircularProgress,
    Tooltip,
    Divider,
    Badge,
    Collapse,
    Alert,
} from '@mui/material'
import {
    WhatsApp as WhatsAppIcon,
    Search as SearchIcon,
    Person as PersonIcon,
    Send as SendIcon,
    Mic as MicIcon,
    Image as ImageIcon,
    VideoLibrary as VideoIcon,
    AttachFile as AttachFileIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Psychology as PsychologyIcon,
    TrendingUp as TrendingUpIcon,
    ShoppingCart as ShoppingCartIcon,
    SentimentSatisfied as SentimentSatisfiedIcon,
    SentimentDissatisfied as SentimentDissatisfiedIcon,
    SentimentNeutral as SentimentNeutralIcon,
    Refresh as RefreshIcon,
    Link as LinkIcon,
} from '@mui/icons-material'
import { superbotService } from '../../services/superbot.service'
import ConversationTimeline from './ConversationTimeline'

// Cores para estados e intenções
const INTENT_COLORS = {
    QUOTE_REQUEST: '#4CAF50',
    PURCHASE_INTENT: '#2196F3',
    PRICE_CHECK: '#FF9800',
    STOCK_CHECK: '#9C27B0',
    COMPLAINT: '#F44336',
    ORDER_STATUS: '#00BCD4',
    NEGOTIATION: '#FFC107',
    GREETING: '#8BC34A',
    THANKS: '#4CAF50',
    GENERAL_QUESTION: '#607D8B',
    UNKNOWN: '#9E9E9E',
}

const INTENT_LABELS = {
    QUOTE_REQUEST: 'Cotação',
    PURCHASE_INTENT: 'Intenção de Compra',
    PRICE_CHECK: 'Consulta de Preço',
    STOCK_CHECK: 'Consulta de Estoque',
    COMPLAINT: 'Reclamação',
    ORDER_STATUS: 'Status do Pedido',
    NEGOTIATION: 'Negociação',
    GREETING: 'Saudação',
    THANKS: 'Agradecimento',
    GENERAL_QUESTION: 'Pergunta Geral',
    UNKNOWN: 'Desconhecido',
}

// Componente de bolha de mensagem
const MessageBubble = ({ message, showAnalysis = false }) => {
    const isIncoming = message.direction === 'incoming'
    const [expanded, setExpanded] = useState(false)

    const getMessageIcon = () => {
        if (message.message_type === 'audio' || message.has_transcription) {
            return <MicIcon fontSize="small" />
        }
        if (message.message_type === 'image') {
            return <ImageIcon fontSize="small" />
        }
        if (message.message_type === 'video') {
            return <VideoIcon fontSize="small" />
        }
        if (message.message_type === 'document') {
            return <AttachFileIcon fontSize="small" />
        }
        return null
    }

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: isIncoming ? 'flex-start' : 'flex-end',
                mb: 1,
                px: 1,
            }}
        >
            <Paper
                elevation={1}
                sx={{
                    maxWidth: '75%',
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: isIncoming ? '#fff' : '#dcf8c6',
                    borderTopLeftRadius: isIncoming ? 0 : 16,
                    borderTopRightRadius: isIncoming ? 16 : 0,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    {getMessageIcon()}
                    <Typography
                        variant="body2"
                        sx={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                        }}
                    >
                        {message.message_text || message.transcription_text || '[Mídia]'}
                    </Typography>
                </Box>

                {message.transcription_text && message.message_text && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}
                    >
                        📝 {message.transcription_text}
                    </Typography>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                        {new Date(message.received_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Typography>

                    {message.ai_response && (
                        <Tooltip title="Resposta da IA">
                            <PsychologyIcon fontSize="small" color="primary" />
                        </Tooltip>
                    )}
                </Box>

                {showAnalysis && message.intent && (
                    <Box sx={{ mt: 1 }}>
                        <Chip
                            size="small"
                            label={INTENT_LABELS[message.intent] || message.intent}
                            sx={{
                                bgcolor: INTENT_COLORS[message.intent] || '#9E9E9E',
                                color: '#fff',
                                fontSize: '0.7rem',
                            }}
                        />
                    </Box>
                )}
            </Paper>
        </Box>
    )
}

// Componente de sessão de conversa
const ConversationSession = ({ session, onSelect, selected }) => {
    const lastMessageDate = new Date(session.last_message_at)
    const isToday = new Date().toDateString() === lastMessageDate.toDateString()

    return (
        <Paper
            elevation={selected ? 3 : 1}
            onClick={() => onSelect(session)}
            sx={{
                p: 2,
                mb: 1,
                cursor: 'pointer',
                borderLeft: selected ? '4px solid #25D366' : 'none',
                transition: 'all 0.2s',
                '&:hover': {
                    bgcolor: 'rgba(37, 211, 102, 0.05)',
                },
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="subtitle2" fontWeight="bold">
                    Sessão {session.session_id?.slice(-8)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {isToday
                        ? lastMessageDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        : lastMessageDate.toLocaleDateString('pt-BR')
                    }
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip
                    size="small"
                    label={`${session.messages_count} msgs`}
                    variant="outlined"
                />
                {session.media_count > 0 && (
                    <Chip
                        size="small"
                        icon={<ImageIcon fontSize="small" />}
                        label={session.media_count}
                        variant="outlined"
                    />
                )}
            </Box>
        </Paper>
    )
}

// Componente principal
const WhatsAppConversation = ({
    phone,
    customerId = null,
    showAnalysis = false,
    maxHeight = 700,
    onCreateLead = null,
}) => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [customer, setCustomer] = useState(null)
    const [conversations, setConversations] = useState([])
    const [selectedSession, setSelectedSession] = useState(null)
    const [messages, setMessages] = useState([])
    const [messagesLoading, setMessagesLoading] = useState(false)
    const [stats, setStats] = useState(null)
    const [showStats, setShowStats] = useState(false)

    const messagesEndRef = useRef(null)

    // Carregar dados iniciais
    useEffect(() => {
        if (phone) {
            loadData()
        }
    }, [phone])

    // Scroll para última mensagem
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    const loadData = async () => {
        setLoading(true)
        setError(null)
        // Limpar estados anteriores para evitar dados residuais
        setMessages([])
        setSelectedSession(null)
        setConversations([])

        try {
            // Carregar dados em paralelo
            const [customerRes, conversationsRes, statsRes] = await Promise.all([
                superbotService.getCustomerByPhone(phone).catch(() => ({ data: { data: null } })),
                superbotService.getConversations(phone, { limit: 20 }),
                superbotService.getStats(phone).catch(() => ({ data: { data: null } })),
            ])

            setCustomer(customerRes.data?.data)
            const newConversations = conversationsRes.data?.data?.conversations || []
            setConversations(newConversations)
            setStats(statsRes.data?.data)

            // Selecionar primeira sessão automaticamente
            if (newConversations.length > 0) {
                const firstSession = newConversations[0]
                setSelectedSession(firstSession)
                loadMessages(firstSession.session_id)
            } else {
                // Sem sessões = sem mensagens
                setMessages([])
            }
        } catch (err) {
            console.error('Erro ao carregar dados do WhatsApp:', err)
            setError('Não foi possível carregar o histórico de conversas')
        } finally {
            setLoading(false)
        }
    }

    const loadMessages = async (sessionId) => {
        setMessagesLoading(true)

        try {
            const response = await superbotService.getMessages(sessionId, { limit: 100 })
            setMessages(response.data?.data || [])
        } catch (err) {
            console.error('Erro ao carregar mensagens:', err)
        } finally {
            setMessagesLoading(false)
        }
    }

    const handleSessionSelect = (session) => {
        setMessages([]) // Limpar mensagens anteriores imediatamente
        setSelectedSession(session)
        loadMessages(session.session_id)
    }

    const getSentimentIcon = () => {
        if (!stats?.sentiment) return <SentimentNeutralIcon />

        switch (stats.sentiment.sentiment) {
            case 'positive':
                return <SentimentSatisfiedIcon color="success" />
            case 'negative':
                return <SentimentDissatisfiedIcon color="error" />
            default:
                return <SentimentNeutralIcon color="action" />
        }
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
                <CircularProgress color="success" />
            </Box>
        )
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ m: 2 }}>
                {error}
            </Alert>
        )
    }

    if (!customer && conversations.length === 0) {
        return (
            <Alert severity="info" sx={{ m: 2 }}>
                Nenhuma conversa encontrada para este telefone
            </Alert>
        )
    }

    return (
        <Paper elevation={2} sx={{ overflow: 'hidden' }}>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    bgcolor: '#075E54',
                    color: '#fff',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                            <WhatsAppIcon sx={{ width: 16, height: 16, color: '#25D366' }} />
                        }
                    >
                        <Avatar sx={{ bgcolor: '#25D366' }}>
                            <PersonIcon />
                        </Avatar>
                    </Badge>

                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                            {customer?.name || customer?.push_name || phone}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {phone}
                            {customer?.has_linked_customer && (
                                <Chip
                                    size="small"
                                    icon={<LinkIcon fontSize="small" />}
                                    label="Vinculado"
                                    sx={{ ml: 1, color: '#fff', bgcolor: 'rgba(255,255,255,0.2)' }}
                                />
                            )}
                        </Typography>
                    </Box>
                </Box>

                <Box>
                    <IconButton
                        size="small"
                        sx={{ color: '#fff' }}
                        onClick={() => setShowStats(!showStats)}
                    >
                        {showStats ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                    <IconButton
                        size="small"
                        sx={{ color: '#fff' }}
                        onClick={loadData}
                    >
                        <RefreshIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* Stats Panel */}
            <Collapse in={showStats}>
                <Box sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Chip
                            icon={getSentimentIcon()}
                            label={`Sentimento: ${stats?.sentiment?.sentiment || 'neutro'}`}
                            variant="outlined"
                        />
                        <Chip
                            icon={<TrendingUpIcon />}
                            label={`${stats?.stats?.total_messages || 0} mensagens`}
                            variant="outlined"
                        />
                        <Chip
                            label={`${stats?.stats?.total_sessions || 0} sessões`}
                            variant="outlined"
                        />
                        {stats?.engagement_level && (
                            <Chip
                                label={`Engajamento: ${stats.engagement_level.level}`}
                                color={stats.engagement_level.level === 'high' ? 'success' : 'default'}
                                variant="outlined"
                            />
                        )}
                    </Box>

                    {onCreateLead && (
                        <Box sx={{ mt: 2 }}>
                            <Chip
                                icon={<ShoppingCartIcon />}
                                label="Criar Lead a partir desta conversa"
                                onClick={onCreateLead}
                                color="primary"
                                clickable
                            />
                        </Box>
                    )}
                </Box>
            </Collapse>

            <Divider />

            {/* Content */}
            <Box sx={{ display: 'flex', height: maxHeight }}>
                {/* Sessions List */}
                <Box
                    sx={{
                        width: 200,
                        borderRight: '1px solid #e0e0e0',
                        overflowY: 'auto',
                        bgcolor: '#f9f9f9',
                    }}
                >
                    <Typography variant="caption" color="text.secondary" sx={{ p: 1, display: 'block' }}>
                        Conversas ({conversations.length})
                    </Typography>

                    {conversations.map((session) => (
                        <ConversationSession
                            key={session.session_id}
                            session={session}
                            selected={selectedSession?.session_id === session.session_id}
                            onSelect={handleSessionSelect}
                        />
                    ))}
                </Box>

                {/* Messages - usando o novo ConversationTimeline */}
                <Box
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <ConversationTimeline
                        key={`timeline-${selectedSession?.session_id || 'none'}`}
                        phone={phone}
                        sessionId={selectedSession?.session_id}
                        initialMessages={messages}
                        maxHeight={typeof maxHeight === 'string' ? `calc(${maxHeight} - 100px)` : maxHeight - 100}
                        showAIBadges={showAnalysis}
                        enableLazyLoading={true}
                        pageSize={50}
                    />

                    {/* Footer Info */}
                    <Box
                        sx={{
                            p: 1,
                            bgcolor: '#fff',
                            display: 'flex',
                            justifyContent: 'center',
                            borderTop: '1px solid #e0e0e0',
                        }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            Apenas visualização • Dados do Superbot •
                            {messages.length > 0 ? ` ${messages.length} mensagens carregadas` : ''}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Paper>
    )
}

export default WhatsAppConversation
