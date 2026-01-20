import { useState, useEffect, useCallback } from 'react'
import {
    Box,
    Chip,
    Tooltip,
    CircularProgress,
    Typography,
    LinearProgress
} from '@mui/material'
import { Inventory as InventoryIcon } from '@mui/icons-material'
import { useSelector } from 'react-redux'
import { userService } from '../services/api'

function DailyMachinesGoalBadge() {
    const [progress, setProgress] = useState(null)
    const [loading, setLoading] = useState(true)
    const { user } = useSelector((state) => state.auth)

    const fetchProgress = useCallback(async () => {
        try {
            const response = await userService.getDailyMachinesProgress()
            setProgress(response.data.data)
        } catch (error) {
            console.error('Erro ao buscar progresso de máquinas:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchProgress()

        // Atualizar a cada 5 minutos
        const interval = setInterval(fetchProgress, 300000)
        return () => clearInterval(interval)
    }, [fetchProgress])


    if (loading) {
        return (
            <Chip
                size="small"
                icon={<CircularProgress size={14} />}
                label="..."
                sx={{ mx: 0.5 }}
            />
        )
    }

    if (!progress) return null

    const { goalMonth, soldMonth, percentage, completed, isManager, daysRemaining, remaining } = progress

    // Se não tiver meta, não exibir
    if (goalMonth <= 0) return null

    // Cor baseada no progresso
    const getColor = () => {
        if (completed) return 'success'
        if (percentage >= 60) return 'warning'
        if (percentage >= 30) return 'default'
        return 'error'
    }

    // Ícone animado se completou a meta
    const chipSx = {
        mx: 0.5,
        fontWeight: 'bold',
        '& .MuiChip-icon': { color: 'inherit' },
        ...(completed && {
            animation: 'pulse 1s ease-in-out 3',
            '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.05)' }
            }
        })
    }

    return (
        <Tooltip
            title={
                <Box sx={{ p: 0.5 }}>
                    <Typography variant="body2" fontWeight="bold">
                        🏭 Meta Mensal de Máquinas {isManager ? '(Segmento)' : ''}
                    </Typography>
                    <Typography variant="caption">
                        {soldMonth} de {goalMonth} unidades vendidas este mês
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={Math.min(percentage, 100)}
                        sx={{ mt: 1, height: 6, borderRadius: 3 }}
                        color={completed ? 'success' : 'primary'}
                    />
                    <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                        {remaining > 0 ? `Faltam ${remaining} unidades (${daysRemaining} dias restantes)` : '✅ Meta atingida!'}
                    </Typography>
                </Box>
            }
            arrow
        >
            <Chip
                size="small"
                icon={<InventoryIcon sx={{ fontSize: 16 }} />}
                label={`${soldMonth}/${goalMonth}`}
                color={getColor()}
                sx={chipSx}
            />
        </Tooltip>
    )
}

export default DailyMachinesGoalBadge
