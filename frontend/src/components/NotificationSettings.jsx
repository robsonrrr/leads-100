import { useState, useEffect, useCallback } from 'react';
import {
    Paper,
    Typography,
    Box,
    Switch,
    FormControlLabel,
    Button,
    Alert,
    Divider,
    CircularProgress,
    useTheme,
    Chip
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    NotificationsOff as NotificationsOffIcon,
    Send as SendIcon
} from '@mui/icons-material';
import notificationService from '../services/notification.service';
import { useToast } from '../contexts/ToastContext';

function NotificationSettings() {
    const [supported, setSupported] = useState(true);
    const [permission, setPermission] = useState('default');
    const [subscribed, setSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [preferences, setPreferences] = useState({
        follow_up_alerts: true,
        churn_alerts: true,
        goal_alerts: true,
        order_alerts: true,
        exception_alerts: true
    });
    const theme = useTheme();
    const toast = useToast();

    const checkStatus = useCallback(async () => {
        setLoading(true);
        try {
            setSupported(notificationService.isSupported());
            setPermission(notificationService.getPermissionStatus());
            const isSubbed = await notificationService.isSubscribed();
            setSubscribed(isSubbed);

            if (isSubbed) {
                const prefs = await notificationService.getPreferences();
                setPreferences(prefs);
            }
        } catch (err) {
            console.error('Error checking notification status:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkStatus();
    }, [checkStatus]);

    const handleSubscribe = async () => {
        try {
            setLoading(true);
            await notificationService.subscribe();
            setSubscribed(true);
            setPermission('granted');
            toast.success('Notificações ativadas com sucesso!');
        } catch (err) {
            toast.error(err.message || 'Erro ao ativar notificações');
        } finally {
            setLoading(false);
        }
    };

    const handleUnsubscribe = async () => {
        try {
            setLoading(true);
            await notificationService.unsubscribe();
            setSubscribed(false);
            toast.info('Notificações desativadas');
        } catch (err) {
            toast.error(err.message || 'Erro ao desativar notificações');
        } finally {
            setLoading(false);
        }
    };

    const handlePreferenceChange = async (key) => {
        const updated = { ...preferences, [key]: !preferences[key] };
        setPreferences(updated);
        try {
            await notificationService.updatePreferences(updated);
        } catch (err) {
            toast.error('Erro ao salvar preferência');
            setPreferences(preferences); // Reverter
        }
    };

    const handleTestNotification = async () => {
        try {
            await notificationService.sendTest();
            toast.success('Notificação de teste enviada!');
        } catch (err) {
            toast.error('Erro ao enviar notificação de teste');
        }
    };

    if (loading) {
        return (
            <Paper sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={30} />
            </Paper>
        );
    }

    if (!supported) {
        const isNotSecure = window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

        return (
            <Alert severity="warning" sx={{ borderRadius: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold">Recurso Indisponível</Typography>
                {isNotSecure ? (
                    <>
                        Notificações Push exigem uma conexão segura (HTTPS) ou acesso via localhost.
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" component="block">
                                Para testar via IP, habilite o IP em: <code>chrome://flags/#unsafely-treat-insecure-origin-as-secure</code>
                            </Typography>
                        </Box>
                    </>
                ) : (
                    "Seu navegador não suporta notificações push. Tente usar Chrome, Firefox ou Edge."
                )}
            </Alert>
        );
    }

    if (permission === 'denied') {
        return (
            <Alert severity="error">
                Notificações foram bloqueadas. Para habilitar, clique no ícone de cadeado na barra de endereço e permita notificações.
            </Alert>
        );
    }

    return (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {subscribed ? (
                    <NotificationsIcon color="primary" fontSize="large" />
                ) : (
                    <NotificationsOffIcon color="disabled" fontSize="large" />
                )}
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">Notificações Push</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Receba alertas importantes diretamente no seu dispositivo
                    </Typography>
                </Box>
                <Chip
                    label={subscribed ? 'Ativo' : 'Inativo'}
                    color={subscribed ? 'success' : 'default'}
                    size="small"
                />
            </Box>

            {!subscribed ? (
                <Button
                    variant="contained"
                    startIcon={<NotificationsIcon />}
                    onClick={handleSubscribe}
                    fullWidth
                    sx={{ mt: 2 }}
                >
                    Ativar Notificações
                </Button>
            ) : (
                <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Tipos de notificação:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <FormControlLabel
                            control={<Switch checked={preferences.follow_up_alerts} onChange={() => handlePreferenceChange('follow_up_alerts')} />}
                            label="📅 Follow-ups e lembretes"
                        />
                        <FormControlLabel
                            control={<Switch checked={preferences.churn_alerts} onChange={() => handlePreferenceChange('churn_alerts')} />}
                            label="🔴 Clientes em risco de churn"
                        />
                        <FormControlLabel
                            control={<Switch checked={preferences.goal_alerts} onChange={() => handlePreferenceChange('goal_alerts')} />}
                            label="🎯 Metas e performance"
                        />
                        <FormControlLabel
                            control={<Switch checked={preferences.order_alerts} onChange={() => handlePreferenceChange('order_alerts')} />}
                            label="📦 Novos pedidos"
                        />
                        <FormControlLabel
                            control={<Switch checked={preferences.exception_alerts} onChange={() => handlePreferenceChange('exception_alerts')} />}
                            label="⚠️ Exceções pendentes (gerentes)"
                        />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<SendIcon />}
                            onClick={handleTestNotification}
                            size="small"
                        >
                            Testar
                        </Button>
                        <Button
                            variant="text"
                            color="error"
                            startIcon={<NotificationsOffIcon />}
                            onClick={handleUnsubscribe}
                            size="small"
                        >
                            Desativar
                        </Button>
                    </Box>
                </>
            )}
        </Paper>
    );
}

export default NotificationSettings;
