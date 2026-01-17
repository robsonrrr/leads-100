import { useState } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Alert,
    Chip,
    CircularProgress,
    InputAdornment,
    FormControlLabel,
    Checkbox,
    useTheme,
    alpha
} from '@mui/material'
import {
    Email as EmailIcon,
    Send as SendIcon,
    PersonAdd as CcIcon,
    Close as CloseIcon
} from '@mui/icons-material'
import { leadsService } from '../services/api'
import { useToast } from '../contexts/ToastContext'

export default function SendEmailDialog({
    open,
    onClose,
    lead,
    defaultEmail = ''
}) {
    const theme = useTheme()
    const toast = useToast()

    const [email, setEmail] = useState(defaultEmail)
    const [ccEmails, setCcEmails] = useState('')
    const [ccInput, setCcInput] = useState('')
    const [customMessage, setCustomMessage] = useState('')
    const [senderName, setSenderName] = useState('')
    const [sending, setSending] = useState(false)
    const [error, setError] = useState('')
    const [includeCC, setIncludeCC] = useState(false)

    const handleAddCC = () => {
        if (ccInput && ccInput.includes('@')) {
            const currentCCs = ccEmails ? ccEmails.split(',').map(e => e.trim()) : []
            if (!currentCCs.includes(ccInput.trim())) {
                setCcEmails(currentCCs.length > 0 ? `${ccEmails}, ${ccInput.trim()}` : ccInput.trim())
            }
            setCcInput('')
        }
    }

    const handleSend = async () => {
        // Validar email
        if (!email) {
            setError('Por favor, informe o email do destinatário')
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setError('Formato de email inválido')
            return
        }

        try {
            setSending(true)
            setError('')

            const data = {
                email,
                customMessage,
                senderName
            }

            if (includeCC && ccEmails) {
                data.cc = ccEmails.split(',').map(e => e.trim()).filter(e => e)
            }

            const response = await leadsService.sendEmail(lead.id, data)

            if (response.data.success) {
                toast.showSuccess(response.data.message || 'Email enviado com sucesso!')
                onClose(true)
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error?.message || 'Erro ao enviar email'
            setError(errorMsg)
            toast.showError(errorMsg)
        } finally {
            setSending(false)
        }
    }

    const handleClose = () => {
        if (!sending) {
            onClose(false)
        }
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3 }
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: 'white'
                }}
            >
                <EmailIcon />
                <Box>
                    <Typography variant="h6" fontWeight="bold">
                        Enviar Cotação por Email
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Lead #{lead?.id} • {lead?.customerName || 'Cliente'}
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ mt: 2 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {/* Preview */}
                <Box
                    sx={{
                        p: 2,
                        mb: 3,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    }}
                >
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        📋 Resumo da Cotação
                    </Typography>
                    <Typography variant="body2">
                        <strong>Itens:</strong> {lead?.itemCount || lead?.items?.length || 0} produto(s)
                    </Typography>
                    <Typography variant="body2">
                        <strong>Total:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead?.totalGeral || lead?.totalValue || 0)}
                    </Typography>
                </Box>

                {/* Email do destinatário */}
                <TextField
                    label="Email do Destinatário"
                    type="email"
                    fullWidth
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@empresa.com"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <EmailIcon color="action" />
                            </InputAdornment>
                        )
                    }}
                    sx={{ mb: 2 }}
                />

                {/* Cópia (CC) */}
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={includeCC}
                            onChange={(e) => setIncludeCC(e.target.checked)}
                            size="small"
                        />
                    }
                    label="Enviar cópia para outros emails"
                    sx={{ mb: 1 }}
                />

                {includeCC && (
                    <Box sx={{ mb: 2 }}>
                        <TextField
                            label="Email em cópia (CC)"
                            type="email"
                            fullWidth
                            size="small"
                            value={ccInput}
                            onChange={(e) => setCcInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddCC()}
                            placeholder="Digite e pressione Enter"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <CcIcon color="action" fontSize="small" />
                                    </InputAdornment>
                                ),
                                endAdornment: ccInput && (
                                    <Button size="small" onClick={handleAddCC}>
                                        Adicionar
                                    </Button>
                                )
                            }}
                        />
                        {ccEmails && (
                            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {ccEmails.split(',').map((e, idx) => (
                                    <Chip
                                        key={idx}
                                        label={e.trim()}
                                        size="small"
                                        onDelete={() => {
                                            const emails = ccEmails.split(',').map(x => x.trim()).filter((_, i) => i !== idx)
                                            setCcEmails(emails.join(', '))
                                        }}
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>
                )}

                {/* Mensagem personalizada */}
                <TextField
                    label="Mensagem Personalizada (opcional)"
                    fullWidth
                    multiline
                    rows={3}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Adicione uma mensagem personalizada ao email..."
                    sx={{ mb: 2 }}
                />

                {/* Nome do remetente */}
                <TextField
                    label="Seu Nome (opcional)"
                    fullWidth
                    size="small"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Ex: João Silva - Comercial"
                />
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button
                    onClick={handleClose}
                    disabled={sending}
                    startIcon={<CloseIcon />}
                >
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSend}
                    disabled={sending || !email}
                    startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
                >
                    {sending ? 'Enviando...' : 'Enviar Email'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
