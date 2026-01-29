/**
 * MessageComposer Component
 * 
 * Componente para composição e envio de mensagens WhatsApp
 * 
 * @version 1.0
 * @date 2026-01-23
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Box,
    TextField,
    IconButton,
    CircularProgress,
    Typography,
    Tooltip,
    Paper,
    Collapse,
    Alert
} from '@mui/material';
import {
    Send as SendIcon,
    AttachFile as AttachFileIcon,
    EmojiEmotions as EmojiIcon,
    Mic as MicIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon
} from '@mui/icons-material';

/**
 * Componente de composição de mensagens WhatsApp
 * @param {Object} props - Propriedades do componente
 */
export function MessageComposer({
    phone,
    onSend,
    onMediaUpload,
    placeholder = "Digite uma mensagem...",
    disabled = false,
    sending = false,
    maxLength = 4096,
    showAttachment = true,
    showEmoji = false,
    showVoice = false,
    autoFocus = false,
    onFocus,
    onBlur,
    successMessage = null,
    errorMessage = null
}) {
    const [message, setMessage] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const inputRef = useRef(null);

    // Mostrar feedback de sucesso
    useEffect(() => {
        if (successMessage) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // Mostrar feedback de erro
    useEffect(() => {
        if (errorMessage) {
            setShowError(true);
            const timer = setTimeout(() => setShowError(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage]);

    /**
     * Handler de envio de mensagem
     */
    const handleSend = useCallback(async () => {
        if (!message.trim() || sending || disabled) return;

        const trimmedMessage = message.trim();

        if (onSend) {
            const result = await onSend(trimmedMessage);

            // Se o envio foi bem sucedido, limpar o campo
            if (result?.success !== false) {
                setMessage('');
            }
        }
    }, [message, sending, disabled, onSend]);

    /**
     * Handler de tecla pressionada
     */
    const handleKeyDown = useCallback((e) => {
        // Enter sem shift envia a mensagem
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    /**
     * Handler de mudança de texto
     */
    const handleChange = useCallback((e) => {
        const value = e.target.value;
        if (value.length <= maxLength) {
            setMessage(value);
        }
    }, [maxLength]);

    const isOverLimit = message.length > maxLength * 0.9;
    const charsRemaining = maxLength - message.length;

    return (
        <Box sx={{ width: '100%' }}>
            {/* Feedback de sucesso */}
            <Collapse in={showSuccess && !!successMessage}>
                <Alert
                    severity="success"
                    icon={<CheckCircleIcon />}
                    sx={{ mb: 1 }}
                    onClose={() => setShowSuccess(false)}
                >
                    {successMessage}
                </Alert>
            </Collapse>

            {/* Feedback de erro */}
            <Collapse in={showError && !!errorMessage}>
                <Alert
                    severity="error"
                    icon={<ErrorIcon />}
                    sx={{ mb: 1 }}
                    onClose={() => setShowError(false)}
                >
                    {errorMessage}
                </Alert>
            </Collapse>

            <Paper
                elevation={2}
                sx={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    p: 1,
                    gap: 1,
                    borderRadius: 3,
                    backgroundColor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                {/* Botão de anexo */}
                {showAttachment && (
                    <Tooltip title="Anexar arquivo">
                        <IconButton
                            onClick={() => onMediaUpload?.()}
                            disabled={disabled || sending || !onMediaUpload}
                            size="small"
                            sx={{ color: 'action.active' }}
                        >
                            <AttachFileIcon />
                        </IconButton>
                    </Tooltip>
                )}

                {/* Botão de emoji */}
                {showEmoji && (
                    <Tooltip title="Emoji">
                        <IconButton
                            disabled={disabled || sending}
                            size="small"
                            sx={{ color: 'action.active' }}
                        >
                            <EmojiIcon />
                        </IconButton>
                    </Tooltip>
                )}

                {/* Campo de texto */}
                <TextField
                    ref={inputRef}
                    fullWidth
                    multiline
                    maxRows={4}
                    value={message}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    placeholder={disabled ? "Selecione um contato" : placeholder}
                    disabled={disabled || sending}
                    autoFocus={autoFocus}
                    variant="standard"
                    InputProps={{
                        disableUnderline: true,
                        sx: {
                            fontSize: '0.95rem',
                            py: 0.5,
                            px: 1
                        }
                    }}
                    sx={{
                        '& .MuiInputBase-root': {
                            backgroundColor: 'transparent'
                        }
                    }}
                />

                {/* Contador de caracteres */}
                {message.length > 0 && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: isOverLimit ? 'error.main' : 'text.secondary',
                            minWidth: 50,
                            textAlign: 'right',
                            mr: 1
                        }}
                    >
                        {charsRemaining}
                    </Typography>
                )}

                {/* Botão de voz */}
                {showVoice && !message && (
                    <Tooltip title="Mensagem de voz">
                        <IconButton
                            disabled={disabled || sending}
                            size="small"
                            sx={{ color: 'action.active' }}
                        >
                            <MicIcon />
                        </IconButton>
                    </Tooltip>
                )}

                {/* Botão de envio */}
                <Tooltip title={message.trim() ? "Enviar (Enter)" : "Digite uma mensagem"}>
                    <span>
                        <IconButton
                            onClick={handleSend}
                            disabled={!message.trim() || disabled || sending}
                            sx={{
                                backgroundColor: message.trim() ? 'primary.main' : 'action.disabledBackground',
                                color: message.trim() ? 'primary.contrastText' : 'action.disabled',
                                '&:hover': {
                                    backgroundColor: message.trim() ? 'primary.dark' : 'action.disabledBackground'
                                },
                                '&.Mui-disabled': {
                                    backgroundColor: 'action.disabledBackground',
                                    color: 'action.disabled'
                                }
                            }}
                        >
                            {sending ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                <SendIcon />
                            )}
                        </IconButton>
                    </span>
                </Tooltip>
            </Paper>

            {/* Info do telefone (opcional) */}
            {phone && (
                <Typography
                    variant="caption"
                    sx={{
                        display: 'block',
                        mt: 0.5,
                        color: 'text.secondary',
                        textAlign: 'right'
                    }}
                >
                    Enviando para: {phone}
                </Typography>
            )}
        </Box>
    );
}

export default MessageComposer;
