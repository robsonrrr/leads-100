/**
 * WhatsAppChatWidget Component
 * 
 * Widget de chat WhatsApp integrado para páginas de Lead/Customer
 * Permite visualizar histórico e enviar mensagens diretamente
 * AGORA COM SUPORTE A CONEXÃO EM TEMPO REAL (SSE)
 * 
 * @version 2.0
 * @date 2026-01-24
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    TextField,
    CircularProgress,
    Collapse,
    Tooltip,
    Badge,
    Chip,
    Avatar,
    Divider,
    Button,
    Snackbar,
    Alert
} from '@mui/material';
import {
    WhatsApp as WhatsAppIcon,
    Send as SendIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
    OpenInNew as OpenInNewIcon,
    Refresh as RefreshIcon,
    AttachFile as AttachFileIcon,
    Close as CloseIcon,
    Person as PersonIcon,
    SmartToy as BotIcon,
    AutoAwesome as AIIcon,
    FiberManualRecord as DotIcon,
    Wifi as WifiIcon,
    WifiOff as WifiOffIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { superbotService } from '../../services/superbot.service';
import { whatsappSendService } from '../../services/whatsapp-send.service';
import { useSendMessage } from '../../hooks/useSendMessage';
import { MediaUploadDialog } from './MediaUploader';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import { AISuggestions } from './AISuggestions';
import { useWhatsAppLive } from '../../hooks/useWhatsAppLive';

/**
 * Formata telefone para exibição
 */
function formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('55') && cleaned.length >= 12) {
        const ddd = cleaned.slice(2, 4);
        const number = cleaned.slice(4);
        if (number.length === 9) {
            return `(${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`;
        }
        return `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
    }
    return phone;
}

/**
 * Formata hora da mensagem
 */
function formatMessageTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Componente de bolha de mensagem simplificado
 */
function SimpleBubble({ message, isFromMe }) {
    // Extrair texto da mensagem (vários campos possíveis)
    const messageText = message.message_text || message.transcription_text || message.content || message.text || message.body || '';

    // Verificar se é mídia sem texto
    const isMedia = message.media_type || message.message_type === 'media';
    const mediaLabel = isMedia && !messageText ? `[${message.media_type || 'Mídia'}]` : null;

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: isFromMe ? 'flex-end' : 'flex-start',
                mb: 1,
                px: 1
            }}
        >
            <Paper
                elevation={1}
                sx={{
                    maxWidth: '85%',
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: isFromMe ? '#dcf8c6' : '#ffffff',
                    borderTopRightRadius: isFromMe ? 0 : 2,
                    borderTopLeftRadius: isFromMe ? 2 : 0
                }}
            >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {messageText || mediaLabel || '[Mensagem]'}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                        {formatMessageTime(message.received_at || message.timestamp || message.created_at)}
                    </Typography>
                    {message.transcription_text && (
                        <Typography variant="caption" sx={{ color: 'info.main', fontSize: '0.6rem' }}>🎤</Typography>
                    )}
                    {message.ai_response && (
                        <BotIcon sx={{ fontSize: 12, color: 'primary.main' }} />
                    )}
                </Box>
            </Paper>
        </Box>
    );
}

/**
 * Widget principal de chat WhatsApp
 */
export function WhatsAppChatWidget({
    phone,
    customerName,
    leadId,
    customerId,
    defaultExpanded = false,
    maxHeight = 400,
    showFullPageLink = true,
    onMessageSent,
    compact = false
}) {
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    // Estado
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [message, setMessage] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
    const [showAISuggestions, setShowAISuggestions] = useState(false);
    const [useLiveConnection, setUseLiveConnection] = useState(true);

    // Hook de conexão live (SSE)
    const {
        messages,
        isConnected: liveConnected,
        isLoading: liveLoading,
        error: liveError,
        presence,
        isTyping,
        connectionStatus,
        loadHistoryMessages,
        addMessage: addLiveMessage,
        supportsLive
    } = useWhatsAppLive({
        phone: phone,
        autoConnect: expanded && useLiveConnection,
        loadHistory: expanded
    });

    // Estado derivado
    const loading = liveLoading;
    const error = liveError;

    // Hooks de envio
    const { sendMessage, sending } = useSendMessage({
        leadId,
        customerId,
        onSuccess: (sentMessage) => {
            setSnackbar({ open: true, message: 'Mensagem enviada!', severity: 'success' });
            loadMessages();
            onMessageSent?.(sentMessage);
        },
        onError: (err) => {
            setSnackbar({ open: true, message: err.message || 'Erro ao enviar', severity: 'error' });
        }
    });

    const { sendMedia, uploading, progress } = useMediaUpload({
        leadId,
        customerId,
        onSuccess: () => {
            setMediaDialogOpen(false);
            setSnackbar({ open: true, message: 'Mídia enviada!', severity: 'success' });
            loadMessages();
        },
        onError: (err) => {
            setSnackbar({ open: true, message: err.message || 'Erro ao enviar mídia', severity: 'error' });
        }
    });

    /**
     * Carrega mensagens do histórico (via hook live)
     */
    const loadMessages = useCallback(() => {
        loadHistoryMessages();
    }, [loadHistoryMessages]);

    // Scroll para o final quando novas mensagens chegam
    useEffect(() => {
        if (messagesEndRef.current && expanded) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length, expanded]);

    /**
     * Handler de envio de mensagem
     */
    const handleSend = useCallback(async () => {
        if (!message.trim() || sending || !phone) return;

        const result = await sendMessage(phone, message.trim());
        if (result.success) {
            setMessage('');
        }
    }, [message, phone, sending, sendMessage]);

    /**
     * Handler de tecla pressionada
     */
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    /**
     * Handler de upload de mídia
     */
    const handleMediaUpload = useCallback(async (media) => {
        if (!phone) return;
        await sendMedia(phone, media);
    }, [phone, sendMedia]);

    /**
     * Handler para seleção de sugestão de IA
     */
    const handleAISuggestionSelect = useCallback((text) => {
        setMessage(text);
        setShowAISuggestions(false);
    }, []);

    /**
     * Navega para a página completa do WhatsApp
     */
    const handleOpenFullPage = useCallback(() => {
        const formattedPhone = phone?.replace(/\D/g, '');
        navigate(`/whatsapp-v2/${formattedPhone}`);
    }, [navigate, phone]);

    // Se não tem telefone, não renderizar
    if (!phone) {
        return null;
    }

    return (
        <Paper
            elevation={2}
            sx={{
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: expanded ? 'primary.light' : 'divider'
            }}
        >
            {/* Header */}
            <Box
                onClick={() => setExpanded(!expanded)}
                sx={{
                    p: compact ? 1.5 : 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    backgroundColor: expanded ? 'primary.main' : 'background.paper',
                    color: expanded ? 'white' : 'text.primary',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        backgroundColor: expanded ? 'primary.dark' : 'action.hover'
                    }
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Badge
                        badgeContent={messages.length > 0 ? messages.length : null}
                        color="error"
                        max={99}
                    >
                        <Avatar
                            sx={{
                                width: compact ? 32 : 40,
                                height: compact ? 32 : 40,
                                bgcolor: expanded ? 'rgba(255,255,255,0.2)' : '#25D366'
                            }}
                        >
                            <WhatsAppIcon sx={{ color: 'white' }} />
                        </Avatar>
                    </Badge>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant={compact ? 'body2' : 'subtitle1'} sx={{ fontWeight: 600 }}>
                                WhatsApp
                            </Typography>
                            {/* Indicador de conexão live */}
                            {expanded && supportsLive && (
                                <Tooltip title={liveConnected ? 'Conectado em tempo real' : 'Conexão offline'}>
                                    <DotIcon
                                        sx={{
                                            fontSize: 10,
                                            color: liveConnected ? '#4caf50' : '#9e9e9e',
                                            animation: liveConnected ? 'pulse 2s infinite' : 'none',
                                            '@keyframes pulse': {
                                                '0%': { opacity: 1 },
                                                '50%': { opacity: 0.5 },
                                                '100%': { opacity: 1 }
                                            }
                                        }}
                                    />
                                </Tooltip>
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                {formatPhone(phone)}
                            </Typography>
                            {/* Status de presença */}
                            {expanded && presence?.status === 'online' && (
                                <Chip
                                    label="Online"
                                    size="small"
                                    sx={{
                                        height: 16,
                                        fontSize: '0.6rem',
                                        backgroundColor: 'rgba(76, 175, 80, 0.2)',
                                        color: expanded ? 'white' : 'success.main'
                                    }}
                                />
                            )}
                        </Box>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {showFullPageLink && expanded && (
                        <Tooltip title="Abrir página completa">
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenFullPage();
                                }}
                                sx={{ color: 'inherit' }}
                            >
                                <OpenInNewIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    <IconButton size="small" sx={{ color: 'inherit' }}>
                        {expanded ? <CollapseIcon /> : <ExpandIcon />}
                    </IconButton>
                </Box>
            </Box>

            {/* Content (colapsável) */}
            <Collapse in={expanded}>
                {/* Mensagens */}
                <Box
                    sx={{
                        height: maxHeight,
                        overflowY: 'auto',
                        backgroundColor: '#e5ddd5',
                        backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAABTUlEQVRIibWWwQ2DMAxFPwfBCB2BI3CEjtARukJHYISM0BE6QkfoCB2BEcoI/+CUpHWdNBR+SZQo9rON7QD+Ah3wAFawTQ+sgA4YAQv0gALWwALYAvGPwD8H8gLEewL0QAJywBJoawLIgQGQwj3gBOj6wm8J9BnQ4fmLQMJSoF0RYB/CUoAloL22AJYmTe8JcMPP4wJYmjT+YT3gAs52QJQ2mBQ30S4OJL9cYyEQGPxP1c8WSw==")',
                        py: 1
                    }}
                >
                    {/* Loading */}
                    {loading && messages.length === 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <CircularProgress size={32} />
                        </Box>
                    )}

                    {/* Error */}
                    {error && (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Typography color="error" variant="body2">{error}</Typography>
                            <Button size="small" onClick={loadMessages} sx={{ mt: 1 }}>
                                Tentar novamente
                            </Button>
                        </Box>
                    )}

                    {/* Empty state */}
                    {!loading && !error && messages.length === 0 && (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <WhatsAppIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                            <Typography color="text.secondary" variant="body2">
                                Nenhuma mensagem encontrada
                            </Typography>
                            <Typography color="text.secondary" variant="caption">
                                Envie a primeira mensagem abaixo
                            </Typography>
                        </Box>
                    )}

                    {/* Messages list */}
                    {messages.map((msg, index) => (
                        <SimpleBubble
                            key={msg.id || index}
                            message={msg}
                            isFromMe={msg.is_from_me || msg.from_me || msg.direction === 'outgoing'}
                        />
                    ))}

                    {/* Typing indicator */}
                    {isTyping && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 2,
                                py: 1,
                                ml: 1,
                                mb: 1,
                                backgroundColor: '#ffffff',
                                borderRadius: 2,
                                maxWidth: 'fit-content',
                                boxShadow: 1
                            }}
                        >
                            <Box sx={{ display: 'flex', gap: '3px' }}>
                                {[1, 2, 3].map((i) => (
                                    <Box
                                        key={i}
                                        sx={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            backgroundColor: '#25D366',
                                            animation: 'typingBounce 1.4s infinite ease-in-out both',
                                            animationDelay: `${(i - 1) * 0.16}s`,
                                            '@keyframes typingBounce': {
                                                '0%, 80%, 100%': { transform: 'scale(0)' },
                                                '40%': { transform: 'scale(1)' }
                                            }
                                        }}
                                    />
                                ))}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                                Digitando...
                            </Typography>
                        </Box>
                    )}

                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                </Box>

                {/* Input area */}
                <Box
                    sx={{
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: 1,
                        backgroundColor: 'background.paper',
                        borderTop: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    {/* AI Suggestions button */}
                    <Tooltip title={showAISuggestions ? 'Fechar sugestões' : 'Sugestões de IA'}>
                        <IconButton
                            size="small"
                            onClick={() => setShowAISuggestions(!showAISuggestions)}
                            disabled={sending || uploading}
                            sx={{
                                color: showAISuggestions ? 'primary.main' : 'text.secondary',
                                backgroundColor: showAISuggestions ? 'primary.light' : 'transparent'
                            }}
                        >
                            <AIIcon />
                        </IconButton>
                    </Tooltip>

                    {/* Attachment button */}
                    <Tooltip title="Anexar arquivo">
                        <IconButton
                            size="small"
                            onClick={() => setMediaDialogOpen(true)}
                            disabled={sending || uploading}
                        >
                            <AttachFileIcon />
                        </IconButton>
                    </Tooltip>

                    {/* Text input */}
                    <TextField
                        fullWidth
                        size="small"
                        multiline
                        maxRows={3}
                        placeholder="Digite uma mensagem..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={sending || uploading}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 3
                            }
                        }}
                    />

                    {/* Send button */}
                    <Tooltip title="Enviar (Enter)">
                        <span>
                            <IconButton
                                color="primary"
                                onClick={handleSend}
                                disabled={!message.trim() || sending || uploading}
                                sx={{
                                    backgroundColor: message.trim() ? 'primary.main' : 'action.disabledBackground',
                                    color: message.trim() ? 'white' : 'action.disabled',
                                    '&:hover': {
                                        backgroundColor: message.trim() ? 'primary.dark' : 'action.disabledBackground'
                                    },
                                    '&.Mui-disabled': {
                                        backgroundColor: 'action.disabledBackground'
                                    }
                                }}
                            >
                                {sending ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>

                {/* AI Suggestions Panel */}
                <Collapse in={showAISuggestions}>
                    <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                        <AISuggestions
                            phone={phone}
                            leadId={leadId}
                            customerId={customerId}
                            onSelect={handleAISuggestionSelect}
                            autoLoad={true}
                            collapsible={false}
                            maxSuggestions={3}
                            compact
                        />
                    </Box>
                </Collapse>

                {/* Status bar and Refresh button */}
                <Box sx={{ p: 1, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                    {/* Live connection status */}
                    {supportsLive && (
                        <Chip
                            size="small"
                            icon={liveConnected ? <WifiIcon sx={{ fontSize: 14 }} /> : <WifiOffIcon sx={{ fontSize: 14 }} />}
                            label={liveConnected ? 'Ao vivo' : 'Offline'}
                            color={liveConnected ? 'success' : 'default'}
                            variant="outlined"
                            sx={{ height: 24, fontSize: '0.7rem' }}
                        />
                    )}
                    <Button
                        size="small"
                        startIcon={loading ? <CircularProgress size={14} /> : <RefreshIcon />}
                        onClick={loadMessages}
                        disabled={loading}
                    >
                        {loading ? 'Atualizando...' : 'Atualizar'}
                    </Button>
                </Box>
            </Collapse>

            {/* Media Upload Dialog */}
            <MediaUploadDialog
                open={mediaDialogOpen}
                onClose={() => setMediaDialogOpen(false)}
                onUpload={handleMediaUpload}
                phone={phone}
                uploading={uploading}
                uploadProgress={progress}
            />

            {/* Snackbar for feedback */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Paper>
    );
}

export default WhatsAppChatWidget;
