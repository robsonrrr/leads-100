/**
 * ConversationTimeline Component
 * 
 * Timeline de conversas WhatsApp completa com:
 * - Mensagens estilo chat (bolhas)
 * - Diferenciação incoming/outgoing
 * - Mídia inline (imagens, vídeos)
 * - Player de áudio com transcrição
 * - Indicador de resposta da IA
 * - Timestamps formatados
 * - Lazy loading de mensagens antigas
 * 
 * @version 1.0
 * @date 2026-01-18
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
    Box,
    Paper,
    Typography,
    Avatar,
    Chip,
    IconButton,
    CircularProgress,
    Tooltip,
    Skeleton,
    Button,
    Dialog,
    DialogContent,
    Collapse,
} from '@mui/material'
import {
    WhatsApp as WhatsAppIcon,
    Mic as MicIcon,
    Image as ImageIcon,
    VideoLibrary as VideoIcon,
    AttachFile as AttachFileIcon,
    Psychology as PsychologyIcon,
    SmartToy as SmartToyIcon,
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    VolumeUp as VolumeIcon,
    KeyboardArrowUp as LoadMoreIcon,
    Check as CheckIcon,
    DoneAll as DoneAllIcon,
    Schedule as ScheduleIcon,
    ExpandMore as ExpandMoreIcon,
    Close as CloseIcon,
    Download as DownloadIcon,
    Fullscreen as FullscreenIcon,
} from '@mui/icons-material'
import { superbotService } from '../../services/superbot.service'

// Cores e estilos
const COLORS = {
    incoming: {
        bg: '#ffffff',
        border: '#e0e0e0',
        shadow: '0 1px 0.5px rgba(0,0,0,0.1)',
    },
    outgoing: {
        bg: '#dcf8c6',
        border: '#a8d5a2',
        shadow: '0 1px 0.5px rgba(0,0,0,0.1)',
    },
    ai: {
        bg: '#e3f2fd',
        border: '#90caf9',
        icon: '#1976d2',
    },
    chat: {
        bg: '#e5ddd5',
        pattern: 'url("data:image/svg+xml,%3Csvg width=\'64\' height=\'64\' viewBox=\'0 0 64 64\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M8 16c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm0-2c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6zm33.414-6l5.95-5.95L45.95.636 40 6.586 34.05.636 32.636 2.05 38.586 8l-5.95 5.95 1.414 1.414L40 9.414l5.95 5.95 1.414-1.414L41.414 8zM40 48c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm0-2c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6zM9.414 40l5.95-5.95-1.414-1.414L8 38.586l-5.95-5.95L.636 34.05 6.586 40l-5.95 5.95 1.414 1.414L8 41.414l5.95 5.95 1.414-1.414L9.414 40z\' fill=\'%23d7ccc8\' fill-opacity=\'0.3\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
    }
}

const INTENT_COLORS = {
    QUOTE_REQUEST: '#4CAF50',
    PURCHASE_INTENT: '#2196F3',
    PRICE_CHECK: '#FF9800',
    STOCK_CHECK: '#9C27B0',
    COMPLAINT: '#F44336',
    ORDER_STATUS: '#00BCD4',
    NEGOTIATION: '#FFC107',
    UNKNOWN: '#9E9E9E',
}

// Formatar timestamp
const formatTimestamp = (dateStr) => {
    if (!dateStr) return ''

    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / 86400000)

    // Hoje
    if (diffDays === 0) {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

    // Ontem
    if (diffDays === 1) {
        return `Ontem ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    }

    // Esta semana
    if (diffDays < 7) {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
        return `${days[date.getDay()]} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    }

    // Mais antigo
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Separador de data
const DateSeparator = ({ date }) => (
    <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        my: 2
    }}>
        <Chip
            size="small"
            label={new Date(date).toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })}
            sx={{
                bgcolor: 'rgba(225, 245, 254, 0.9)',
                fontWeight: 500,
                textTransform: 'capitalize',
            }}
        />
    </Box>
)

// Player de áudio com transcrição
const AudioPlayer = ({ src, transcription, duration }) => {
    const audioRef = useRef(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [showTranscription, setShowTranscription] = useState(false)

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause()
            } else {
                audioRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const percent = (audioRef.current.currentTime / audioRef.current.duration) * 100
            setProgress(percent)
            setCurrentTime(audioRef.current.currentTime)
        }
    }

    const handleEnded = () => {
        setIsPlaying(false)
        setProgress(0)
    }

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <Box sx={{ width: '100%' }}>
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                    size="small"
                    onClick={togglePlay}
                    sx={{ bgcolor: '#00a884', color: '#fff', '&:hover': { bgcolor: '#008f72' } }}
                >
                    {isPlaying ? <PauseIcon fontSize="small" /> : <PlayIcon fontSize="small" />}
                </IconButton>

                {/* Barra de progresso */}
                <Box sx={{ flex: 1, position: 'relative', height: 24 }}>
                    <Box sx={{
                        height: 4,
                        bgcolor: 'rgba(0,0,0,0.2)',
                        borderRadius: 2,
                        position: 'absolute',
                        top: 10,
                        left: 0,
                        right: 0,
                    }}>
                        <Box sx={{
                            height: '100%',
                            bgcolor: '#00a884',
                            borderRadius: 2,
                            width: `${progress}%`,
                            transition: 'width 0.1s'
                        }} />
                    </Box>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 35 }}>
                    {formatDuration(currentTime || duration || 0)}
                </Typography>

                {transcription && (
                    <IconButton
                        size="small"
                        onClick={() => setShowTranscription(!showTranscription)}
                        color={showTranscription ? 'primary' : 'default'}
                    >
                        <VolumeIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>

            {/* Transcrição */}
            <Collapse in={showTranscription}>
                <Box sx={{
                    mt: 1,
                    p: 1,
                    bgcolor: 'rgba(0,0,0,0.05)',
                    borderRadius: 1,
                    borderLeft: '3px solid #00a884',
                }}>
                    <Typography variant="caption" color="text.secondary">
                        📝 Transcrição:
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        {transcription}
                    </Typography>
                </Box>
            </Collapse>
        </Box>
    )
}

// Visualizador de mídia inline
const MediaViewer = ({ type, url, thumbnail, caption }) => {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(true)

    if (type === 'image') {
        return (
            <>
                <Box
                    onClick={() => setOpen(true)}
                    sx={{
                        position: 'relative',
                        borderRadius: 2,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        maxWidth: 250,
                        '&:hover': {
                            '& .overlay': { opacity: 1 }
                        }
                    }}
                >
                    {loading && (
                        <Skeleton
                            variant="rectangular"
                            width={200}
                            height={150}
                            animation="wave"
                        />
                    )}
                    <img
                        src={thumbnail || url}
                        alt={caption || 'Imagem'}
                        onLoad={() => setLoading(false)}
                        style={{
                            width: '100%',
                            display: loading ? 'none' : 'block',
                            borderRadius: 8,
                        }}
                    />
                    <Box
                        className="overlay"
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            bgcolor: 'rgba(0,0,0,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                        }}
                    >
                        <FullscreenIcon sx={{ color: '#fff', fontSize: 32 }} />
                    </Box>
                </Box>

                <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg">
                    <DialogContent sx={{ p: 0, position: 'relative' }}>
                        <IconButton
                            onClick={() => setOpen(false)}
                            sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', zIndex: 1 }}
                        >
                            <CloseIcon />
                        </IconButton>
                        <img
                            src={url}
                            alt={caption || 'Imagem'}
                            style={{ maxWidth: '90vw', maxHeight: '90vh' }}
                        />
                    </DialogContent>
                </Dialog>
            </>
        )
    }

    if (type === 'video') {
        return (
            <Box sx={{ maxWidth: 300 }}>
                <video
                    src={url}
                    controls
                    style={{
                        width: '100%',
                        borderRadius: 8,
                    }}
                    poster={thumbnail}
                />
            </Box>
        )
    }

    if (type === 'document') {
        return (
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                bgcolor: 'rgba(0,0,0,0.05)',
                borderRadius: 1,
            }}>
                <AttachFileIcon color="action" />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" noWrap>
                        {caption || 'Documento'}
                    </Typography>
                </Box>
                <IconButton size="small" href={url} target="_blank">
                    <DownloadIcon fontSize="small" />
                </IconButton>
            </Box>
        )
    }

    return null
}

// Bolha de mensagem
const MessageBubble = ({ message, showAIBadge = true }) => {
    const isIncoming = message.direction === 'incoming'
    const isAI = message.ai_response || message.is_bot_message

    const getBubbleStyle = () => {
        const base = isIncoming ? COLORS.incoming : COLORS.outgoing
        if (isAI) {
            return { ...base, ...COLORS.ai }
        }
        return base
    }

    const style = getBubbleStyle()

    // Determinar tipo de conteúdo - considera campos do backend
    const mediaType = message.media_type || message.message_type
    const hasMedia = mediaType && ['image', 'video', 'audio', 'document'].includes(mediaType)
    const hasAudio = mediaType === 'audio' || message.is_voice_note || message.has_transcription
    const mediaUrl = message.media_url || message.s3_url || message.url
    const mediaDuration = message.media_duration || message.duration

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: isIncoming ? 'flex-start' : 'flex-end',
                mb: 0.5,
                mx: 1,
            }}
        >
            {/* Indicador de IA */}
            {isAI && isIncoming && showAIBadge && (
                <Tooltip title="Resposta da IA">
                    <Avatar
                        sx={{
                            width: 24,
                            height: 24,
                            mr: 0.5,
                            bgcolor: COLORS.ai.icon,
                        }}
                    >
                        <SmartToyIcon sx={{ fontSize: 14 }} />
                    </Avatar>
                </Tooltip>
            )}

            <Paper
                elevation={0}
                sx={{
                    maxWidth: '70%',
                    minWidth: 80,
                    p: 1,
                    px: 1.5,
                    bgcolor: style.bg,
                    border: `1px solid ${style.border}`,
                    boxShadow: style.shadow,
                    borderRadius: 2,
                    borderTopLeftRadius: isIncoming ? 4 : 16,
                    borderTopRightRadius: isIncoming ? 16 : 4,
                    position: 'relative',

                    // Tail (cauda da bolha)
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        [isIncoming ? 'left' : 'right']: -6,
                        width: 12,
                        height: 12,
                        bgcolor: style.bg,
                        clipPath: isIncoming
                            ? 'polygon(100% 0, 0 0, 100% 100%)'
                            : 'polygon(0 0, 100% 0, 0 100%)',
                    }
                }}
            >
                {/* Conteúdo de mídia */}
                {hasMedia && mediaUrl && (
                    <Box sx={{ mb: 1 }}>
                        {hasAudio ? (
                            <AudioPlayer
                                src={mediaUrl}
                                transcription={message.transcription_text}
                                duration={mediaDuration}
                            />
                        ) : (
                            <MediaViewer
                                type={mediaType}
                                url={mediaUrl}
                                thumbnail={message.thumbnail_url}
                                caption={message.caption}
                            />
                        )}
                    </Box>
                )}

                {/* Texto da mensagem */}
                {message.message_text && (
                    <Typography
                        variant="body2"
                        sx={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            color: '#303030',
                        }}
                    >
                        {message.message_text}
                    </Typography>
                )}

                {/* Transcrição se for áudio sem player */}
                {!mediaUrl && message.transcription_text && (
                    <Box sx={{
                        mt: 0.5,
                        p: 0.5,
                        bgcolor: 'rgba(0,0,0,0.05)',
                        borderRadius: 1,
                    }}>
                        <Typography variant="caption" color="text.secondary">
                            📝 {message.transcription_text}
                        </Typography>
                    </Box>
                )}

                {/* Footer: timestamp + status */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 0.5,
                    mt: 0.5,
                }}>
                    {/* Intent badge */}
                    {message.intent && (
                        <Chip
                            size="small"
                            label={message.intent.replace(/_/g, ' ')}
                            sx={{
                                height: 16,
                                fontSize: '0.65rem',
                                bgcolor: `${INTENT_COLORS[message.intent] || '#9E9E9E'}20`,
                                color: INTENT_COLORS[message.intent] || '#9E9E9E',
                                borderColor: INTENT_COLORS[message.intent] || '#9E9E9E',
                            }}
                            variant="outlined"
                        />
                    )}

                    <Typography
                        variant="caption"
                        sx={{ color: '#667781', fontSize: '0.7rem' }}
                    >
                        {formatTimestamp(message.received_at)}
                    </Typography>

                    {/* Status indicator (outgoing) */}
                    {!isIncoming && (
                        <Box sx={{ display: 'flex', color: '#53bdeb' }}>
                            {message.status === 'read' ? (
                                <DoneAllIcon sx={{ fontSize: 14, color: '#53bdeb' }} />
                            ) : message.status === 'delivered' ? (
                                <DoneAllIcon sx={{ fontSize: 14, color: '#8696a0' }} />
                            ) : message.status === 'sent' ? (
                                <CheckIcon sx={{ fontSize: 14, color: '#8696a0' }} />
                            ) : (
                                <ScheduleIcon sx={{ fontSize: 12, color: '#8696a0' }} />
                            )}
                        </Box>
                    )}

                    {/* AI indicator */}
                    {isAI && !isIncoming && showAIBadge && (
                        <Tooltip title="Resposta da IA">
                            <PsychologyIcon sx={{ fontSize: 14, color: COLORS.ai.icon }} />
                        </Tooltip>
                    )}
                </Box>
            </Paper>
        </Box>
    )
}

// Componente principal: ConversationTimeline
const ConversationTimeline = ({
    phone,
    sessionId = null,
    maxHeight = 700,
    showAIBadges = true,
    enableLazyLoading = true,
    pageSize = 50,
    onMessageClick = null,
}) => {
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [offset, setOffset] = useState(0)
    const [error, setError] = useState(null)

    const containerRef = useRef(null)
    const messagesEndRef = useRef(null)
    const previousScrollHeight = useRef(0)

    // Refs para evitar race conditions e stale closures
    const currentSessionRef = useRef(sessionId)
    const currentPhoneRef = useRef(phone)
    const abortControllerRef = useRef(null)

    // Carregar mensagens iniciais - SEMPRE recarregar quando sessionId ou phone mudar
    useEffect(() => {
        // Atualizar refs com valores atuais
        currentSessionRef.current = sessionId
        currentPhoneRef.current = phone

        // Cancelar qualquer requisição pendente anterior
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        // Limpar mensagens IMEDIATAMENTE ao mudar de conversa
        setMessages([])
        setOffset(0)
        setHasMore(true)
        setError(null)
        setLoading(false)
        setLoadingMore(false)

        // Carregar apenas se houver sessão válida
        if (sessionId) {
            loadMessages(true, sessionId)
        }

        // Cleanup: cancelar requisições ao desmontar ou mudar
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [sessionId, phone])

    // Scroll para o final em novas mensagens
    useEffect(() => {
        if (messagesEndRef.current && !loadingMore) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages.length])

    // Manter posição de scroll ao carregar mais
    useEffect(() => {
        if (loadingMore && containerRef.current) {
            const newScrollHeight = containerRef.current.scrollHeight
            containerRef.current.scrollTop = newScrollHeight - previousScrollHeight.current
        }
    }, [loadingMore])

    const loadMessages = async (reset = false, targetSessionId = null) => {
        // Usar sessionId passado ou o atual
        const activeSessionId = targetSessionId || currentSessionRef.current

        // Criar novo AbortController para esta requisição
        abortControllerRef.current = new AbortController()
        const currentAbortController = abortControllerRef.current

        if (reset) {
            setLoading(true)
            setOffset(0)
        } else {
            setLoadingMore(true)
            if (containerRef.current) {
                previousScrollHeight.current = containerRef.current.scrollHeight
            }
        }

        try {
            const params = {
                limit: pageSize,
                offset: reset ? 0 : offset,
                phone: currentPhoneRef.current, // ← PASSAR O TELEFONE DO CLIENTE PARA FILTRAR
            }

            let response
            if (activeSessionId) {
                response = await superbotService.getMessages(activeSessionId, params)
            } else {
                // Se não há sessionId, não carregar nada
                setLoading(false)
                return
            }

            // Verificar se a requisição foi abortada ou se a sessão mudou
            if (currentAbortController.signal.aborted) {
                console.log('Requisição abortada - sessão mudou')
                return
            }

            // Verificar se ainda estamos na mesma sessão
            if (activeSessionId !== currentSessionRef.current) {
                console.log('Sessão mudou durante carregamento, descartando resultado')
                return
            }

            const newMessages = response.data?.data || []

            if (newMessages.length < pageSize) {
                setHasMore(false)
            }

            if (reset) {
                setMessages(newMessages)
                setOffset(newMessages.length)
            } else {
                // Prepend para lazy loading (mensagens mais antigas no topo)
                setMessages(prev => [...newMessages.reverse(), ...prev])
                setOffset(prev => prev + newMessages.length)
            }
        } catch (err) {
            // Ignorar erros de abort
            if (err.name === 'AbortError' || currentAbortController.signal.aborted) {
                console.log('Requisição cancelada')
                return
            }
            console.error('Erro ao carregar mensagens:', err)
            setError('Erro ao carregar mensagens')
        } finally {
            // Só atualizar loading se ainda estivermos na mesma sessão
            if (activeSessionId === currentSessionRef.current) {
                setLoading(false)
                setLoadingMore(false)
            }
        }
    }

    const loadMore = useCallback(() => {
        if (!loadingMore && hasMore && enableLazyLoading && currentSessionRef.current) {
            loadMessages(false, currentSessionRef.current)
        }
    }, [loadingMore, hasMore, enableLazyLoading, offset, pageSize])

    // Agrupar mensagens por data (com verificação de array)
    const safeMessages = Array.isArray(messages) ? messages : []
    const groupedMessages = safeMessages.reduce((groups, message) => {
        const date = new Date(message.received_at).toDateString()
        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(message)
        return groups
    }, {})

    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: maxHeight,
                bgcolor: COLORS.chat.bg,
                backgroundImage: COLORS.chat.pattern,
            }}>
                <CircularProgress size={32} sx={{ color: '#25D366' }} />
            </Box>
        )
    }

    if (error) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: maxHeight,
                bgcolor: COLORS.chat.bg,
            }}>
                <Typography color="error">{error}</Typography>
            </Box>
        )
    }

    if (safeMessages.length === 0) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: maxHeight,
                bgcolor: COLORS.chat.bg,
                backgroundImage: COLORS.chat.pattern,
            }}>
                <Box sx={{ textAlign: 'center' }}>
                    <WhatsAppIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                    <Typography color="text.secondary">
                        Nenhuma mensagem nesta conversa
                    </Typography>
                </Box>
            </Box>
        )
    }

    return (
        <Box
            ref={containerRef}
            sx={{
                height: maxHeight,
                overflowY: 'auto',
                bgcolor: COLORS.chat.bg,
                backgroundImage: COLORS.chat.pattern,
                py: 1,
            }}
        >
            {/* Load More Button */}
            {enableLazyLoading && hasMore && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                    <Button
                        size="small"
                        startIcon={loadingMore ? <CircularProgress size={14} /> : <LoadMoreIcon />}
                        onClick={loadMore}
                        disabled={loadingMore}
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.9)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
                        }}
                    >
                        {loadingMore ? 'Carregando...' : 'Carregar mensagens anteriores'}
                    </Button>
                </Box>
            )}

            {/* Messages grouped by date */}
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                <React.Fragment key={date}>
                    <DateSeparator date={date} />
                    {dateMessages.map((message) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            showAIBadge={showAIBadges}
                        />
                    ))}
                </React.Fragment>
            ))}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
        </Box>
    )
}

export default ConversationTimeline
