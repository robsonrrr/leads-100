import { useState, useEffect } from 'react'
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    TextField,
    Alert,
    Divider,
    CircularProgress
} from '@mui/material'
import { authService } from '../services/api'
import { useSelector } from 'react-redux'
import NotificationSettings from '../components/NotificationSettings'

function SecurityPage() {
    const { user } = useSelector((state) => state.auth)
    const [loading, setLoading] = useState(false)
    const [fetchingStatus, setFetchingStatus] = useState(true)
    const [setupData, setSetupData] = useState(null)
    const [token, setToken] = useState('')
    const [message, setMessage] = useState({ type: '', text: '' })
    const [is2FAEnabled, setIs2FAEnabled] = useState(false)

    useEffect(() => {
        // Buscar status 2FA atual do backend
        const fetch2FAStatus = async () => {
            try {
                const response = await authService.getMe()
                if (response.data.success && response.data.data.user) {
                    setIs2FAEnabled(!!response.data.data.user.two_factor_enabled)
                }
            } catch (err) {
                console.error('Erro ao buscar status 2FA:', err)
                // Fallback para o estado do Redux
                if (user?.two_factor_enabled) {
                    setIs2FAEnabled(true)
                }
            } finally {
                setFetchingStatus(false)
            }
        }
        fetch2FAStatus()
    }, [user])

    const handleStartSetup = async () => {
        setLoading(true)
        setMessage({ type: '', text: '' })
        try {
            const response = await authService.setup2FA()
            if (response.data.success) {
                setSetupData(response.data.data)
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Erro ao iniciar setup de 2FA' })
        } finally {
            setLoading(false)
        }
    }

    const handleEnable = async () => {
        if (!token) return
        setLoading(true)
        try {
            const response = await authService.enable2FA(token)
            if (response.data.success) {
                setMessage({ type: 'success', text: '2FA habilitado com sucesso!' })
                setIs2FAEnabled(true)
                setSetupData(null)
                setToken('')
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error?.message || 'Token inválido' })
        } finally {
            setLoading(false)
        }
    }

    const handleDisable = async () => {
        if (!token) return
        setLoading(true)
        try {
            const response = await authService.disable2FA(token)
            if (response.data.success) {
                setMessage({ type: 'success', text: '2FA desabilitado com sucesso.' })
                setIs2FAEnabled(false)
                setToken('')
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Erro ao desabilitar 2FA. Verifique o token.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                Segurança da Conta
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                Gerencie as configurações de segurança da sua conta, como autenticação de dois fatores.
            </Typography>

            {message.text && (
                <Alert severity={message.type} sx={{ mb: 3 }}>
                    {message.text}
                </Alert>
            )}

            <Paper elevation={2} sx={{ p: 4, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Autenticação de Dois Fatores (2FA)
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    A autenticação de dois fatores adiciona uma camada extra de segurança à sua conta, exigindo um código do seu celular além da sua senha.
                </Typography>

                <Box sx={{ mt: 3 }}>
                    {is2FAEnabled ? (
                        <Box>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                O 2FA está ATIVADO na sua conta.
                            </Alert>
                            <Typography variant="body2" gutterBottom>
                                Para desativar, insira o código atual do seu aplicativo autenticador:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                <TextField
                                    label="Token 2FA"
                                    size="small"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                />
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={handleDisable}
                                    disabled={loading || !token}
                                >
                                    Desativar 2FA
                                </Button>
                            </Box>
                        </Box>
                    ) : (
                        <Box>
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                O 2FA está DESATIVADO. Recomendamos ativar para maior segurança.
                            </Alert>

                            {!setupData ? (
                                <Button variant="contained" onClick={handleStartSetup} disabled={loading}>
                                    Configurar 2FA
                                </Button>
                            ) : (
                                <Box>
                                    <Divider sx={{ my: 3 }} />
                                    <Typography variant="subtitle1" gutterBottom>
                                        1. Escaneie o código QR no seu aplicativo (Google Authenticator, Authy, etc.):
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2, bgcolor: 'white', p: 2, borderRadius: 1 }}>
                                        <img src={setupData.qrCode} alt="2FA QR Code" style={{ width: 200, height: 200 }} />
                                    </Box>
                                    <Typography variant="body2" gutterBottom>
                                        Ou insira a chave manualmente: <strong>{setupData.secret}</strong>
                                    </Typography>

                                    <Typography variant="subtitle1" sx={{ mt: 3 }} gutterBottom>
                                        2. Digite o código gerado para confirmar:
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                        <TextField
                                            label="Token 2FA"
                                            size="small"
                                            value={token}
                                            onChange={(e) => setToken(e.target.value)}
                                        />
                                        <Button
                                            variant="contained"
                                            onClick={handleEnable}
                                            disabled={loading || !token}
                                        >
                                            Ativar 2FA
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            </Paper>

            <Paper elevation={2} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Senha
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    No Plano 2026, todas as senhas migradas para Bcrypt automaticamente no próximo login.
                </Typography>
                <Button variant="outlined" disabled>
                    Alterar Senha (Em breve)
                </Button>
            </Paper>

            {/* Notificações Push - Q2 2026 */}
            <Box sx={{ mt: 3 }}>
                <NotificationSettings />
            </Box>
        </Container>
    )
}

export default SecurityPage
