import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Fab, Drawer, Typography, TextField, IconButton,
    Paper, Avatar, CircularProgress, useTheme, Chip
} from '@mui/material';
import {
    Chat as ChatIcon,
    Send as SendIcon,
    Close as CloseIcon,
    SmartToy as RobotIcon,
    ThumbUp as ThumbUpIcon,
    ThumbDown as ThumbDownIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import aiService from '../../services/ai.service';

const ChatBot = () => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Olá! Sou o assistente Rolemak. Como posso te ajudar hoje? Você pode me perguntar sobre seus clientes, leads, pedidos ou suas vendas.' }
    ]);
    const [loading, setLoading] = useState(false);
    const [conversationId, setConversationId] = useState(null);
    const messagesEndRef = useRef(null);
    const theme = useTheme();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (open) {
            scrollToBottom();
        }
    }, [messages, open]);

    const handleSend = async (customMessage) => {
        const text = typeof customMessage === 'string' ? customMessage : message;
        if (!text.trim() || loading) return;

        const userMessage = text.trim();
        setMessage('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await aiService.sendMessage(userMessage, conversationId);
            if (response.success) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: response.data.message
                }]);
                if (response.data.conversationId) {
                    setConversationId(response.data.conversationId);
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Desculpe, tive um problema técnico verificando as ferramentas de IA. Verifique se o backend está online e a API Key configurada.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Fab
                color="primary"
                aria-label="chat"
                onClick={() => setOpen(true)}
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                    zIndex: 1000
                }}
            >
                <ChatIcon />
            </Fab>

            <Drawer
                anchor="right"
                open={open}
                onClose={() => setOpen(false)}
                PaperProps={{
                    sx: { width: { xs: '100vw', sm: 400 }, background: 'transparent', boxShadow: 'none' }
                }}
            >
                <Paper
                    elevation={10}
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: { xs: 0, sm: '20px 0 0 20px' },
                        overflow: 'hidden',
                        background: theme.palette.mode === 'dark'
                            ? 'rgba(30, 30, 30, 0.95)'
                            : 'rgba(255, 255, 255, 0.98)',
                        backdropFilter: 'blur(10px)',
                        borderLeft: `1px solid ${theme.palette.divider}`
                    }}
                >
                    {/* Header */}
                    <Box sx={{
                        p: 2,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}>
                                <RobotIcon />
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold" lineHeight={1}>Rolemak AI</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>Assistente Virtual V2</Typography>
                            </Box>
                        </Box>
                        <IconButton onClick={() => setOpen(false)} color="inherit" size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* Messages Area */}
                    <Box sx={{
                        flexGrow: 1,
                        overflowY: 'auto',
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        /* Scrollbar styling */
                        '&::-webkit-scrollbar': { width: '4px' },
                        '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.1)', borderRadius: '10px' }
                    }}>
                        <AnimatePresence initial={false}>
                            {messages.map((m, i) => (
                                <Box
                                    key={i}
                                    component={motion.div}
                                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    sx={{
                                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                        maxWidth: '85%'
                                    }}
                                >
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 1.5,
                                            borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                            bgcolor: m.role === 'user' ? 'primary.main' : theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                                            color: m.role === 'user' ? 'white' : 'text.primary',
                                            boxShadow: m.role === 'user' ? '0 4px 12px rgba(25, 118, 210, 0.3)' : 'none',
                                            position: 'relative'
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                            {m.content}
                                        </Typography>

                                        {/* Feedback Buttons for Assistant Messages */}
                                        {m.role === 'assistant' && i > 0 && (
                                            <Box sx={{
                                                display: 'flex',
                                                justifyContent: 'flex-end',
                                                mt: 0.5,
                                                gap: 0.5,
                                                opacity: 0.6,
                                                '&:hover': { opacity: 1 }
                                            }}>
                                                <IconButton size="small" sx={{ p: 0.2 }} title="Útil">
                                                    <ThumbUpIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                                <IconButton size="small" sx={{ p: 0.2 }} title="Não foi útil">
                                                    <ThumbDownIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Box>
                                        )}
                                    </Paper>
                                </Box>
                            ))}
                        </AnimatePresence>
                        {loading && (
                            <Box sx={{ alignSelf: 'flex-start', display: 'flex', gap: 1, alignItems: 'center' }}>
                                <CircularProgress size={16} />
                                <Typography variant="caption" color="text.secondary">Pensando...</Typography>
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Question Suggestions */}
                    <AnimatePresence>
                        {!loading && messages.length < 5 && (
                            <Box
                                component={motion.div}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                sx={{
                                    px: 2,
                                    pb: 1,
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 1
                                }}
                            >
                                {[
                                    "Minhas vendas hoje",
                                    "Resumo do cliente MAKSTAR",
                                    "Estoque da B9000",
                                    "Simular B9000 em 5x",
                                    "Leads abertos"
                                ].map((suggestion, idx) => (
                                    <Chip
                                        key={idx}
                                        label={suggestion}
                                        size="small"
                                        onClick={() => {
                                            handleSend(suggestion);
                                        }}
                                        sx={{
                                            fontSize: '0.75rem',
                                            bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                bgcolor: 'primary.light',
                                                color: 'white'
                                            }
                                        }}
                                    />
                                ))}
                            </Box>
                        )}
                    </AnimatePresence>

                    {/* Input Area */}
                    <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
                        <Box sx={{
                            display: 'flex',
                            gap: 1,
                            bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
                            p: 0.5,
                            borderRadius: '25px',
                            border: `1px solid ${theme.palette.divider}`
                        }}>
                            <TextField
                                fullWidth
                                placeholder="Como posso te ajudar?"
                                size="small"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                disabled={loading}
                                variant="standard"
                                InputProps={{
                                    disableUnderline: true,
                                    sx: { px: 2, fontSize: '0.9rem' }
                                }}
                            />
                            <IconButton
                                color="primary"
                                onClick={handleSend}
                                disabled={!message.trim() || loading}
                                sx={{
                                    bgcolor: message.trim() ? 'primary.main' : 'transparent',
                                    color: message.trim() ? 'white' : 'inherit',
                                    '&:hover': { bgcolor: message.trim() ? 'primary.dark' : 'transparent' },
                                    transition: 'all 0.3s'
                                }}
                            >
                                <SendIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>
                </Paper>
            </Drawer>
        </>
    );
};

export default ChatBot;
