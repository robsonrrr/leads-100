/**
 * TaskOutcomeDialog Component
 * Dialog for completing a task with outcome and reason
 */
import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    TextField,
    Select,
    MenuItem,
    InputLabel,
    Box,
    Typography,
    Alert,
    CircularProgress
} from '@mui/material'
import {
    CheckCircle as WonIcon,
    Cancel as LostIcon,
    MailOutline as NoReplyIcon,
    CallMade as EscalatedIcon,
    Schedule as DeferredIcon
} from '@mui/icons-material'
import { tasksService } from '../services/tasks.service'

const OUTCOME_OPTIONS = [
    {
        code: 'WON',
        label: 'Ganhou',
        icon: WonIcon,
        color: 'success',
        description: 'Venda realizada ou objetivo alcançado'
    },
    {
        code: 'LOST',
        label: 'Perdeu',
        icon: LostIcon,
        color: 'error',
        description: 'Cliente não fechou negócio'
    },
    {
        code: 'NO_RESPONSE',
        label: 'Sem resposta',
        icon: NoReplyIcon,
        color: 'warning',
        description: 'Cliente não respondeu após tentativas'
    },
    {
        code: 'ESCALATED',
        label: 'Escalado',
        icon: EscalatedIcon,
        color: 'info',
        description: 'Encaminhado para pricing/gerente'
    },
    {
        code: 'DEFERRED',
        label: 'Adiado',
        icon: DeferredIcon,
        color: 'default',
        description: 'Cliente vai retornar depois'
    }
]

export default function TaskOutcomeDialog({
    open,
    task,
    onClose,
    onComplete
}) {
    const [outcomeCode, setOutcomeCode] = useState('')
    const [reasonCode, setReasonCode] = useState('')
    const [note, setNote] = useState('')
    const [reasons, setReasons] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Load reasons when outcome changes
    useEffect(() => {
        if (outcomeCode) {
            loadReasons(outcomeCode)
        } else {
            setReasons([])
            setReasonCode('')
        }
    }, [outcomeCode])

    const loadReasons = async (code) => {
        try {
            const response = await tasksService.getOutcomeReasons(code)
            setReasons(response.data.reasons || [])
        } catch (err) {
            console.error('Failed to load reasons:', err)
            setReasons([])
        }
    }

    const handleClose = () => {
        setOutcomeCode('')
        setReasonCode('')
        setNote('')
        setError(null)
        onClose()
    }

    const handleSubmit = async () => {
        // Validation
        if (!outcomeCode) {
            setError('Selecione um resultado')
            return
        }

        if (['LOST', 'ESCALATED'].includes(outcomeCode) && !reasonCode) {
            setError('Selecione um motivo para LOST ou ESCALATED')
            return
        }

        setLoading(true)
        setError(null)

        try {
            await onComplete({
                outcome_code: outcomeCode,
                outcome_reason_code: reasonCode || null,
                outcome_note: note || null
            })
            handleClose()
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao salvar')
        } finally {
            setLoading(false)
        }
    }

    const requiresReason = ['LOST', 'ESCALATED'].includes(outcomeCode)

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
            <DialogTitle sx={{ pb: 1 }}>
                <Typography variant="h6" fontWeight={600}>
                    Concluir Tarefa
                </Typography>
                {task && (
                    <Typography variant="body2" color="text.secondary">
                        {task.title}
                    </Typography>
                )}
            </DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Outcome selection */}
                <FormControl component="fieldset" sx={{ width: '100%', mb: 3 }}>
                    <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                        Resultado
                    </FormLabel>
                    <RadioGroup
                        value={outcomeCode}
                        onChange={(e) => setOutcomeCode(e.target.value)}
                    >
                        {OUTCOME_OPTIONS.map((option) => {
                            const Icon = option.icon
                            return (
                                <FormControlLabel
                                    key={option.code}
                                    value={option.code}
                                    control={<Radio color={option.color} />}
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Icon
                                                fontSize="small"
                                                color={option.color}
                                            />
                                            <Box>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {option.label}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {option.description}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    }
                                    sx={{
                                        mb: 1,
                                        p: 1,
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: outcomeCode === option.code ? `${option.color}.main` : 'divider',
                                        bgcolor: outcomeCode === option.code ? `${option.color}.light` : 'transparent',
                                        '&:hover': {
                                            bgcolor: `${option.color}.light`,
                                            opacity: 0.8
                                        }
                                    }}
                                />
                            )
                        })}
                    </RadioGroup>
                </FormControl>

                {/* Reason selection */}
                {outcomeCode && reasons.length > 0 && (
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel id="reason-label">
                            Motivo {requiresReason && '*'}
                        </InputLabel>
                        <Select
                            labelId="reason-label"
                            value={reasonCode}
                            onChange={(e) => setReasonCode(e.target.value)}
                            label={`Motivo ${requiresReason ? '*' : ''}`}
                        >
                            <MenuItem value="">
                                <em>Selecione um motivo</em>
                            </MenuItem>
                            {reasons.map((reason) => (
                                <MenuItem key={reason.reason_code} value={reason.reason_code}>
                                    <Box>
                                        <Typography variant="body2">{reason.label}</Typography>
                                        {reason.description && (
                                            <Typography variant="caption" color="text.secondary">
                                                {reason.description}
                                            </Typography>
                                        )}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                {/* Note */}
                <TextField
                    fullWidth
                    label="Observação (opcional)"
                    multiline
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Adicione detalhes sobre o resultado..."
                    sx={{ mb: 2 }}
                />
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading || !outcomeCode}
                    startIcon={loading ? <CircularProgress size={16} /> : null}
                    sx={{
                        background: outcomeCode === 'WON'
                            ? 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)'
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                >
                    {loading ? 'Salvando...' : 'Confirmar'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
