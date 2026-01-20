import React, { useState, useEffect } from 'react'
import {
    Box,
    Card,
    CardContent,
    Typography,
    LinearProgress,
    Chip,
    Skeleton,
    Tooltip
} from '@mui/material'
import TargetIcon from '@mui/icons-material/GpsFixed'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { analyticsV2Service } from '../services/api'

/**
 * CustomerGoalCard - Exibe a meta de um cliente específico
 * Usado na página de Lead/Cliente
 */
export default function CustomerGoalCard({ customerId }) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchGoal = async () => {
            if (!customerId) return

            setLoading(true)
            try {
                const response = await analyticsV2Service.getCustomerGoal(customerId)
                if (response.data.success) {
                    setData(response.data.data)
                }
            } catch (err) {
                // Silently fail - customer may not have a goal
                setError('Sem meta definida')
            } finally {
                setLoading(false)
            }
        }

        fetchGoal()
    }, [customerId])

    const getClassificationInfo = (classification) => {
        switch (classification) {
            case 'A': return { label: 'Top', color: 'success', description: 'Cliente estratégico - Alto volume' }
            case 'B': return { label: 'Médio', color: 'info', description: 'Cliente em crescimento' }
            case 'C': return { label: 'Baixo', color: 'warning', description: 'Cliente a desenvolver' }
            case 'I': return { label: 'Inativo', color: 'error', description: 'Cliente a reativar' }
            default: return { label: classification, color: 'default', description: '' }
        }
    }

    const getProgressColor = (pct) => {
        if (pct >= 80) return 'success'
        if (pct >= 50) return 'info'
        if (pct >= 25) return 'warning'
        return 'error'
    }

    if (loading) {
        return (
            <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent sx={{ py: 1.5 }}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="rectangular" height={8} sx={{ mt: 1 }} />
                </CardContent>
            </Card>
        )
    }

    if (!data || error) {
        return null // Don't show anything if no goal
    }

    const classInfo = getClassificationInfo(data.classification)
    const progressPercent = Math.min(data.achievement_pct, 100)

    return (
        <Card
            variant="outlined"
            sx={{
                mb: 2,
                borderColor: `${classInfo.color}.main`,
                borderWidth: 2
            }}
        >
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TargetIcon fontSize="small" color="primary" />
                        <Typography variant="subtitle2" fontWeight="bold">
                            Meta 2026
                        </Typography>
                    </Box>
                    <Tooltip title={classInfo.description}>
                        <Chip
                            label={`Classe ${data.classification} - ${classInfo.label}`}
                            color={classInfo.color}
                            size="small"
                        />
                    </Tooltip>
                </Box>

                {/* Annual Progress bar */}
                <Box sx={{ mb: 1 }}>
                    <LinearProgress
                        variant="determinate"
                        value={progressPercent}
                        color={getProgressColor(data.achievement_pct)}
                        sx={{ height: 10, borderRadius: 5 }}
                    />
                </Box>

                {/* Annual Stats */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TrendingUpIcon fontSize="small" color="success" />
                        <Typography variant="body2">
                            <strong>{data.sold_2026}</strong> vendidas
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Meta: <strong>{data.goal_2026}</strong> un
                    </Typography>
                    <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={getProgressColor(data.achievement_pct) + '.main'}
                    >
                        {data.achievement_pct}%
                    </Typography>
                </Box>

                {/* Annual Gap */}
                {data.gap > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        Faltam <strong>{data.gap}</strong> unidades para a meta anual
                    </Typography>
                )}
                {data.gap <= 0 && (
                    <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block' }}>
                        ✅ Meta anual atingida! Excedeu em {Math.abs(data.gap)} unidades
                    </Typography>
                )}

                {/* Monthly Goal Section */}
                {data.goal_month > 0 && (
                    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="caption" fontWeight="bold" color="text.secondary">
                                📅 Meta do Mês
                            </Typography>
                            <Typography
                                variant="caption"
                                fontWeight="bold"
                                color={getProgressColor(data.achievement_month_pct) + '.main'}
                            >
                                {data.achievement_month_pct}%
                            </Typography>
                        </Box>

                        {/* Monthly Progress bar */}
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(data.achievement_month_pct || 0, 100)}
                            color={getProgressColor(data.achievement_month_pct || 0)}
                            sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
                        />

                        {/* Monthly Stats */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption">
                                <strong>{data.sold_month || 0}</strong> vendidas
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Meta: <strong>{data.goal_month}</strong> un
                            </Typography>
                            {data.gap_month > 0 ? (
                                <Typography variant="caption" color="text.secondary">
                                    Faltam <strong>{data.gap_month}</strong>
                                </Typography>
                            ) : (
                                <Typography variant="caption" color="success.main">
                                    ✅ +{Math.abs(data.gap_month)}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                )}
            </CardContent>
        </Card>
    )
}
