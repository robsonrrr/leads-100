/**
 * DailyTasksWidget
 * Compact widget for Dashboard showing task summary
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Paper,
    Box,
    Typography,
    LinearProgress,
    Chip,
    IconButton,
    Skeleton,
    Button,
    Tooltip
} from '@mui/material'
import {
    LocalFireDepartment as CriticalIcon,
    TrendingUp as OpportunityIcon,
    CleaningServices as HygieneIcon,
    ArrowForward as ArrowIcon,
    CheckCircle as DoneIcon,
    Warning as WarningIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { tasksService } from '../services/tasks.service'

/**
 * Small bucket indicator
 */
function BucketChip({ bucket, count, done }) {
    const configs = {
        CRITICAL: { icon: CriticalIcon, color: '#ff6b6b', label: 'Críticas' },
        OPPORTUNITY: { icon: OpportunityIcon, color: '#4ecdc4', label: 'Oportunidades' },
        HYGIENE: { icon: HygieneIcon, color: '#667eea', label: 'Higiene' }
    }

    const config = configs[bucket] || configs.CRITICAL
    const Icon = config.icon
    const pending = count - done

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1,
            borderRadius: 2,
            bgcolor: `${config.color}15`,
            border: `1px solid ${config.color}30`
        }}>
            <Icon sx={{ color: config.color, fontSize: 18 }} />
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" noWrap>
                    {config.label}
                </Typography>
                <Typography variant="subtitle2" fontWeight={600} sx={{ color: config.color }}>
                    {pending} pendentes
                </Typography>
            </Box>
        </Box>
    )
}

export default function DailyTasksWidget({ onRefresh }) {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState(null)
    const [error, setError] = useState(null)

    const loadData = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await tasksService.getToday()

            if (response.data.success) {
                setData({
                    tasks: response.data.tasks || [],
                    summary: response.data.summary || {}
                })
            } else {
                // Try to generate
                await tasksService.generate()
                const retryResponse = await tasksService.getToday()
                setData({
                    tasks: retryResponse.data.tasks || [],
                    summary: retryResponse.data.summary || {}
                })
            }
        } catch (err) {
            console.error('Failed to load tasks widget:', err)
            setError('Erro ao carregar')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const tasks = data?.tasks || []
    const summary = data?.summary || {}

    const byBucket = {
        CRITICAL: tasks.filter(t => t.task_bucket === 'CRITICAL'),
        OPPORTUNITY: tasks.filter(t => t.task_bucket === 'OPPORTUNITY'),
        HYGIENE: tasks.filter(t => t.task_bucket === 'HYGIENE')
    }

    const totalTasks = tasks.length
    const doneTasks = tasks.filter(t => t.status === 'DONE').length
    const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
    const slaBreaches = summary.sla_breaches || 0

    if (loading) {
        return (
            <Paper sx={{ p: 2, borderRadius: 3 }}>
                <Skeleton variant="text" width="50%" height={24} />
                <Skeleton variant="rectangular" height={100} sx={{ mt: 1, borderRadius: 2 }} />
            </Paper>
        )
    }

    if (error) {
        return (
            <Paper sx={{ p: 2, borderRadius: 3, textAlign: 'center' }}>
                <Typography color="error" gutterBottom>{error}</Typography>
                <Button size="small" onClick={loadData}>Tentar novamente</Button>
            </Paper>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Paper
                sx={{
                    p: 2,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #667eea08 0%, #764ba208 100%)',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        boxShadow: '0 8px 30px rgba(102, 126, 234, 0.15)',
                        transform: 'translateY(-2px)'
                    }
                }}
                onClick={() => navigate('/tasks')}
            >
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                        📋 Seu Dia
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {slaBreaches > 0 && (
                            <Chip
                                icon={<WarningIcon sx={{ fontSize: 14 }} />}
                                label={`${slaBreaches} SLA`}
                                size="small"
                                color="error"
                                variant="outlined"
                                sx={{ height: 24 }}
                            />
                        )}
                        <Tooltip title="Ver todas">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate('/tasks'); }}>
                                <ArrowIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Progress */}
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                            Progresso do dia
                        </Typography>
                        <Typography variant="caption" fontWeight={600} color="primary">
                            {completionPct}% ({doneTasks}/{totalTasks})
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={completionPct}
                        sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)'
                            }
                        }}
                    />
                </Box>

                {/* Buckets */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {Object.entries(byBucket).map(([bucket, items]) => (
                        <BucketChip
                            key={bucket}
                            bucket={bucket}
                            count={items.length}
                            done={items.filter(t => t.status === 'DONE').length}
                        />
                    ))}
                </Box>

                {/* Empty state */}
                {totalTasks === 0 && (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            🎉 Nenhuma tarefa pendente!
                        </Typography>
                    </Box>
                )}
            </Paper>
        </motion.div>
    )
}
