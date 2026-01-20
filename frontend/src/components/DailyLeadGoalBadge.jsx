import { useState, useEffect, useCallback } from 'react'
import {
    Box,
    Chip,
    Tooltip,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    LinearProgress
} from '@mui/material'
import { TrendingUp as TrendingUpIcon } from '@mui/icons-material'
import { userService } from '../services/api'

function DailyLeadGoalBadge() {
    const [progress, setProgress] = useState(null)
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [newGoal, setNewGoal] = useState(50)
    const [saving, setSaving] = useState(false)

    const fetchProgress = useCallback(async () => {
        try {
            const response = await userService.getDailyLeadProgress()
            setProgress(response.data.data)
            setNewGoal(response.data.data.goal)
        } catch (error) {
            console.error('Erro ao buscar progresso diário:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchProgress()

        // Atualizar a cada 2 minutos
        const interval = setInterval(fetchProgress, 120000)
        return () => clearInterval(interval)
    }, [fetchProgress])

    // Escutar evento de lead criado para atualizar em tempo real
    useEffect(() => {
        const handleLeadCreated = () => {
            fetchProgress()
        }

        window.addEventListener('lead-created', handleLeadCreated)
        return () => window.removeEventListener('lead-created', handleLeadCreated)
    }, [fetchProgress])

    const handleSaveGoal = async () => {
        if (newGoal < 1 || newGoal > 500) return

        try {
            setSaving(true)
            await userService.updateDailyLeadGoal(newGoal)
            setDialogOpen(false)
            fetchProgress()
        } catch (error) {
            console.error('Erro ao salvar meta:', error)
            alert('Erro ao salvar meta')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <Chip
                size="small"
                icon={<CircularProgress size={14} />}
                label="..."
                sx={{ mx: 1 }}
            />
        )
    }

    if (!progress) return null

    const { goal, created, percentage, completed } = progress

    // Cor baseada no progresso
    const getColor = () => {
        if (completed) return 'success'
        if (percentage >= 50) return 'warning'
        return 'default'
    }

    return (
        <>
            <Tooltip
                title={
                    <Box sx={{ p: 0.5 }}>
                        <Typography variant="body2" fontWeight="bold">
                            Meta Diária de Leads
                        </Typography>
                        <Typography variant="caption">
                            {created} de {goal} leads criados hoje
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(percentage, 100)}
                            sx={{ mt: 1, height: 6, borderRadius: 3 }}
                            color={completed ? 'success' : 'primary'}
                        />
                        <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                            Clique para configurar sua meta
                        </Typography>
                    </Box>
                }
                arrow
            >
                <Chip
                    size="small"
                    icon={<TrendingUpIcon sx={{ fontSize: 16 }} />}
                    label={`${created}/${goal}`}
                    color={getColor()}
                    onClick={() => setDialogOpen(true)}
                    sx={{
                        mx: 1,
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        '& .MuiChip-icon': { color: 'inherit' },
                        animation: completed ? 'pulse 1s ease-in-out 3' : 'none',
                        '@keyframes pulse': {
                            '0%, 100%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.05)' }
                        }
                    }}
                />
            </Tooltip>

            {/* Dialog para configurar meta */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>
                    🎯 Meta Diária de Leads
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Configure quantos leads você deseja criar por dia.
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight="medium">Progresso de Hoje:</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                            <LinearProgress
                                variant="determinate"
                                value={Math.min(percentage, 100)}
                                sx={{ flex: 1, height: 10, borderRadius: 5 }}
                                color={completed ? 'success' : 'primary'}
                            />
                            <Typography variant="body2" fontWeight="bold">
                                {percentage}%
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {created} leads criados de {goal}
                        </Typography>
                    </Box>

                    <TextField
                        label="Nova Meta Diária"
                        type="number"
                        fullWidth
                        value={newGoal}
                        onChange={(e) => setNewGoal(parseInt(e.target.value) || 1)}
                        inputProps={{ min: 1, max: 500 }}
                        helperText="Entre 1 e 500 leads por dia"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveGoal}
                        disabled={saving || newGoal < 1 || newGoal > 500}
                    >
                        {saving ? 'Salvando...' : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default DailyLeadGoalBadge
