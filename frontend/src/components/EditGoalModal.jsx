import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box,
    CircularProgress,
    Alert
} from '@mui/material'
import { customersService } from '../services/api'

function EditGoalModal({ open, onClose, customer, onSuccess }) {
    const isNewGoal = !customer?.goal
    const [goalValue, setGoalValue] = useState(customer?.goal?.year || 0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Reset goalValue quando o modal abre
    useEffect(() => {
        if (open) {
            setGoalValue(customer?.goal?.year || 0)
            setError('')
        }
    }, [open, customer?.goal?.year])

    const handleSave = async () => {
        if (goalValue < 0) {
            setError('A meta não pode ser negativa')
            return
        }

        if (goalValue === 0 && isNewGoal) {
            setError('Informe um valor para a meta')
            return
        }

        try {
            setLoading(true)
            setError('')

            await customersService.updateGoal(customer.id, { goal_units: parseInt(goalValue) })

            if (onSuccess) {
                onSuccess(customer.id, parseInt(goalValue))
            }
            onClose()
        } catch (err) {
            console.error('Erro ao salvar meta:', err)
            setError(err.response?.data?.error?.message || 'Erro ao salvar meta')
        } finally {
            setLoading(false)
        }
    }

    const calculateMonthlyGoal = (annual) => Math.round(annual / 11)
    const currentProgress = customer?.goal?.soldYear || 0
    const newGap = Math.max(0, goalValue - currentProgress)
    const newProgressPct = goalValue > 0 ? Math.round((currentProgress / goalValue) * 100) : 0

    // Calcular classificação sugerida
    const suggestedClass = goalValue >= 100 ? 'A' : goalValue >= 50 ? 'B' : goalValue > 0 ? 'C' : 'I'

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ pb: 1 }}>
                <Typography variant="h6">
                    {isNewGoal ? '➕ Definir Meta de Máquinas' : '✏️ Editar Meta de Máquinas'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {customer?.tradeName || customer?.name}
                </Typography>
            </DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {/* Situação atual - só mostrar se já existe meta */}
                {!isNewGoal && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Situação Atual
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Box sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: 1, flex: 1, minWidth: 120 }}>
                                <Typography variant="caption" color="text.secondary">Meta Atual</Typography>
                                <Typography variant="h6" fontWeight="bold">{customer?.goal?.year} un</Typography>
                            </Box>
                            <Box sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: 1, flex: 1, minWidth: 120 }}>
                                <Typography variant="caption" color="text.secondary">Vendidas</Typography>
                                <Typography variant="h6" color="primary.main" fontWeight="bold">{currentProgress} un</Typography>
                            </Box>
                            <Box sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: 1, flex: 1, minWidth: 120 }}>
                                <Typography variant="caption" color="text.secondary">Classificação</Typography>
                                <Typography variant="h6" fontWeight="bold">Classe {customer?.goal?.classification}</Typography>
                            </Box>
                        </Box>
                    </Box>
                )}

                {/* Info para nova meta */}
                {isNewGoal && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Este cliente ainda não possui meta de máquinas definida para {new Date().getFullYear()}.
                    </Alert>
                )}

                <TextField
                    label={isNewGoal ? "Meta Anual (unidades)" : "Nova Meta Anual (unidades)"}
                    type="number"
                    fullWidth
                    value={goalValue}
                    onChange={(e) => setGoalValue(e.target.value)}
                    inputProps={{ min: 0 }}
                    helperText={`Meta mensal: ${calculateMonthlyGoal(goalValue)} unidades`}
                    sx={{ mb: 2 }}
                    autoFocus
                />

                {goalValue > 0 && (
                    <Box sx={{ bgcolor: 'info.lighter', p: 2, borderRadius: 1 }}>
                        <Typography variant="body2" fontWeight="medium" color="info.dark">
                            📊 {isNewGoal ? 'Previsão:' : 'Simulação com nova meta:'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                            {!isNewGoal && (
                                <Typography variant="body2">
                                    Progresso: <strong>{newProgressPct}%</strong>
                                </Typography>
                            )}
                            <Typography variant="body2">
                                {isNewGoal ? 'Faltarão' : 'Faltam'}: <strong>{newGap} un</strong>
                            </Typography>
                            <Typography variant="body2">
                                Meta/mês: <strong>{calculateMonthlyGoal(goalValue)} un</strong>
                            </Typography>
                            <Typography variant="body2">
                                Classificação: <strong>Classe {suggestedClass}</strong>
                            </Typography>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, pt: 1 }}>
                <Button onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading || (goalValue === customer?.goal?.year && !isNewGoal) || (isNewGoal && goalValue === 0)}
                    startIcon={loading && <CircularProgress size={16} />}
                >
                    {loading ? 'Salvando...' : isNewGoal ? 'Criar Meta' : 'Salvar Meta'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default EditGoalModal

