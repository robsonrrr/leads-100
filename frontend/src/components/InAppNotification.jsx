import { useState, useEffect, useCallback } from 'react';
import { Snackbar, Alert, AlertTitle, IconButton, Box, Typography } from '@mui/material';
import { Close as CloseIcon, OpenInNew as OpenIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * Componente para exibir notificações push in-app quando o app está em foco
 * Usa comunicação com o Service Worker via postMessage
 */
function InAppNotification() {
    const [notification, setNotification] = useState(null);
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    // Handler para mensagens do Service Worker
    const handleServiceWorkerMessage = useCallback((event) => {
        if (event.data && event.data.type === 'PUSH_RECEIVED') {
            const { title, body, url, category } = event.data.payload;
            setNotification({ title, body, url, category });
            setOpen(true);
        }
    }, []);

    // Registrar listener para mensagens do Service Worker
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

            return () => {
                navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
            };
        }
    }, [handleServiceWorkerMessage]);

    // Fechar notificação
    const handleClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setOpen(false);
    };

    // Navegar para URL da notificação
    const handleNavigate = () => {
        if (notification?.url && notification.url !== '/') {
            navigate(notification.url);
        }
        setOpen(false);
    };

    // Mapear categoria para cor do alerta
    const getSeverity = (category) => {
        switch (category) {
            case 'FOLLOW_UP':
            case 'CHURN':
                return 'warning';
            case 'GOAL':
                return 'success';
            case 'ORDER':
                return 'info';
            case 'EXCEPTION':
                return 'error';
            default:
                return 'info';
        }
    };

    if (!notification) return null;

    return (
        <Snackbar
            open={open}
            autoHideDuration={10000}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{
                mt: 7,
                maxWidth: 400,
                '& .MuiAlert-root': {
                    width: '100%',
                    boxShadow: 3
                }
            }}
        >
            <Alert
                severity={getSeverity(notification.category)}
                onClose={handleClose}
                sx={{
                    cursor: notification.url ? 'pointer' : 'default',
                    '&:hover': notification.url ? { opacity: 0.9 } : {}
                }}
                onClick={notification.url ? handleNavigate : undefined}
                action={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {notification.url && notification.url !== '/' && (
                            <IconButton
                                size="small"
                                color="inherit"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNavigate();
                                }}
                            >
                                <OpenIcon fontSize="small" />
                            </IconButton>
                        )}
                        <IconButton
                            size="small"
                            color="inherit"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClose(e, 'close');
                            }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                }
            >
                <AlertTitle sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {notification.title}
                </AlertTitle>
                <Typography variant="body2">
                    {notification.body}
                </Typography>
            </Alert>
        </Snackbar>
    );
}

export default InAppNotification;
