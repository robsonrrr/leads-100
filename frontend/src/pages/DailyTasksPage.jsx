/**
 * DailyTasksPage
 * Main page for viewing and managing daily tasks (OODA-driven)
 */
import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Chip,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip,
    LinearProgress,
    Badge,
    Fab,
    Skeleton,
    Collapse,
    Button,
    Snackbar
} from '@mui/material'
import {
    Refresh as RefreshIcon,
    LocalFireDepartment as CriticalIcon,
    TrendingUp as OpportunityIcon,
    CleaningServices as HygieneIcon,
    Inventory as BacklogIcon,
    CheckCircle as DoneIcon,
    AccessTime as TimeIcon,
    EmojiEvents as TrophyIcon,
    Warning as WarningIcon
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import TaskCard from '../components/TaskCard'
import TaskOutcomeDialog from '../components/TaskOutcomeDialog'
import PullToRefresh from '../components/PullToRefresh'
import { tasksService } from '../services/tasks.service'

/**
 * Bucket configuration
 */
const BUCKETS = {
    CRITICAL: {
        key: 'CRITICAL',
        label: 'Críticas',
        icon: CriticalIcon,
        color: '#ff6b6b',
        gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)'
    },
    OPPORTUNITY: {
        key: 'OPPORTUNITY',
        label: 'Oportunidades',
        icon: OpportunityIcon,
        color: '#4ecdc4',
        gradient: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)'
    },
    HYGIENE: {
        key: 'HYGIENE',
        label: 'Higiene',
        icon: HygieneIcon,
        color: '#667eea',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }
}

/**
 * Stats card component
 */
function StatsCard({ icon: Icon, label, value, color, subtext }) {
    return (
        <Paper
            sx={{
                p: 2,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flex: 1,
                minWidth: 140,
                background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
                border: `1px solid ${color}30`
            }}
        >
            <Box
                sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
                    color: 'white'
                }}
            >
                <Icon />
            </Box>
            <Box>
                <Typography variant="h5" fontWeight={700} color={color}>
                    {value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {label}
                </Typography>
                {subtext && (
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        {subtext}
                    </Typography>
                )}
            </Box>
        </Paper>
    )
}

/**
 * Bucket section component
 */
function BucketSection({ bucket, tasks, onStart, onComplete, onSnooze, loading }) {
    const [expanded, setExpanded] = useState(true)
    const config = BUCKETS[bucket]
    const Icon = config.icon

    const doneTasks = tasks.filter(t => t.status === 'DONE')
    const activeTasks = tasks.filter(t => t.status !== 'DONE')

    return (
        <Paper
            sx={{
                mb: 2,
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
            }}
        >
            {/* Section header */}
            <Box
                onClick={() => setExpanded(!expanded)}
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    cursor: 'pointer',
                    background: config.gradient,
                    color: 'white',
                    '&:hover': { opacity: 0.95 }
                }}
            >
                <Icon />
                <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
                    {config.label}
                </Typography>
                <Chip
                    label={`${activeTasks.length} pendentes`}
                    size="small"
                    sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 500
                    }}
                />
                {doneTasks.length > 0 && (
                    <Chip
                        icon={<DoneIcon sx={{ color: 'white !important', fontSize: 16 }} />}
                        label={doneTasks.length}
                        size="small"
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.3)',
                            color: 'white'
                        }}
                    />
                )}
            </Box>

            {/* Tasks list */}
            <Collapse in={expanded}>
                <Box sx={{ p: 2 }}>
                    {loading ? (
                        <Box>
                            <Skeleton variant="rounded" height={100} sx={{ mb: 2, borderRadius: 3 }} />
                            <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
                        </Box>
                    ) : tasks.length === 0 ? (
                        <Box sx={{ py: 3, textAlign: 'center' }}>
                            <Typography color="text.secondary">
                                Nenhuma tarefa neste bucket
                            </Typography>
                        </Box>
                    ) : (
                        <AnimatePresence>
                            {/* Active tasks first */}
                            {activeTasks.map((task) => (
                                <TaskCard
                                    key={task.task_id}
                                    task={task}
                                    onStart={onStart}
                                    onComplete={onComplete}
                                    onSnooze={onSnooze}
                                />
                            ))}

                            {/* Done tasks at the bottom */}
                            {doneTasks.length > 0 && (
                                <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                        Concluídas ({doneTasks.length})
                                    </Typography>
                                    {doneTasks.map((task) => (
                                        <TaskCard
                                            key={task.task_id}
                                            task={task}
                                            onStart={onStart}
                                            onComplete={onComplete}
                                            onSnooze={onSnooze}
                                        />
                                    ))}
                                </Box>
                            )}
                        </AnimatePresence>
                    )}
                </Box>
            </Collapse>
        </Paper>
    )
}

/**
 * Main page component
 */
export default function DailyTasksPage() {
    const { user } = useSelector((state) => state.auth)

    const [tasks, setTasks] = useState([])
    const [summary, setSummary] = useState(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState(null)
    const [activeTab, setActiveTab] = useState(0)

    // Dialog state
    const [outcomeDialogOpen, setOutcomeDialogOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState(null)

    // Toast state
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

    /**
     * Load tasks
     */
    const loadTasks = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true)
        setError(null)

        try {
            const response = await tasksService.getToday()
            const data = response.data

            if (data.success) {
                setTasks(data.tasks || [])
                setSummary(data.summary || null)
            } else {
                // If no tasks exist, try to generate
                const genResponse = await tasksService.generate()
                if (genResponse.data.success) {
                    // Reload after generation
                    const reloadResponse = await tasksService.getToday()
                    setTasks(reloadResponse.data.tasks || [])
                    setSummary(reloadResponse.data.summary || null)
                }
            }
        } catch (err) {
            console.error('Failed to load tasks:', err)
            setError(err.response?.data?.error || 'Erro ao carregar tarefas')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        loadTasks()
    }, [loadTasks])

    /**
     * Handle refresh
     */
    const handleRefresh = async () => {
        setRefreshing(true)

        try {
            // Force regenerate
            await tasksService.generate()
            await loadTasks(false)
            showToast('Tarefas atualizadas!', 'success')
        } catch (err) {
            showToast('Erro ao atualizar', 'error')
        }
    }

    /**
     * Handle start task
     */
    const handleStartTask = async (task) => {
        try {
            await tasksService.start(task.task_id)

            // Update local state
            setTasks(prev => prev.map(t =>
                t.task_id === task.task_id
                    ? { ...t, status: 'IN_PROGRESS', started_at: new Date().toISOString() }
                    : t
            ))

            showToast('Tarefa iniciada!', 'success')
        } catch (err) {
            showToast('Erro ao iniciar tarefa', 'error')
        }
    }

    /**
     * Handle complete task
     */
    const handleCompleteClick = (task) => {
        setSelectedTask(task)
        setOutcomeDialogOpen(true)
    }

    const handleCompleteTask = async (outcome) => {
        if (!selectedTask) return

        try {
            await tasksService.complete(selectedTask.task_id, outcome)

            // Update local state
            setTasks(prev => prev.map(t =>
                t.task_id === selectedTask.task_id
                    ? {
                        ...t,
                        status: 'DONE',
                        done_at: new Date().toISOString(),
                        outcome_code: outcome.outcome_code,
                        outcome_reason_code: outcome.outcome_reason_code
                    }
                    : t
            ))

            // Update summary
            if (summary) {
                setSummary(prev => ({
                    ...prev,
                    by_status: {
                        ...prev.by_status,
                        DONE: (prev.by_status?.DONE || 0) + 1,
                        IN_PROGRESS: Math.max(0, (prev.by_status?.IN_PROGRESS || 0) - 1)
                    }
                }))
            }

            showToast('Tarefa concluída!', 'success')
        } catch (err) {
            throw err // Let dialog handle error
        }
    }

    /**
     * Handle snooze task
     */
    const handleSnoozeTask = async (task) => {
        // For now, snooze for 2 hours
        const snoozeUntil = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

        try {
            await tasksService.snooze(task.task_id, snoozeUntil)

            // Update local state
            setTasks(prev => prev.map(t =>
                t.task_id === task.task_id
                    ? { ...t, status: 'SNOOZED', snoozed_until: snoozeUntil }
                    : t
            ))

            showToast('Tarefa adiada por 2 horas', 'info')
        } catch (err) {
            showToast('Erro ao adiar tarefa', 'error')
        }
    }

    /**
     * Show toast
     */
    const showToast = (message, severity = 'success') => {
        setToast({ open: true, message, severity })
    }

    /**
     * Group tasks by bucket
     */
    const tasksByBucket = {
        CRITICAL: tasks.filter(t => t.task_bucket === 'CRITICAL'),
        OPPORTUNITY: tasks.filter(t => t.task_bucket === 'OPPORTUNITY'),
        HYGIENE: tasks.filter(t => t.task_bucket === 'HYGIENE')
    }

    const totalTasks = tasks.length
    const doneTasks = tasks.filter(t => t.status === 'DONE').length
    const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
    const slaBreaches = summary?.sla_breaches || 0

    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <Box sx={{ pb: 10 }}>
                {/* Header */}
                <Box sx={{
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box>
                        <Typography variant="h5" fontWeight={700}>
                            📋 Seu Dia
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {new Date().toLocaleDateString('pt-BR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long'
                            })}
                        </Typography>
                    </Box>

                    <Tooltip title="Atualizar tarefas">
                        <IconButton
                            onClick={handleRefresh}
                            disabled={refreshing}
                            sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                '&:hover': { opacity: 0.9 }
                            }}
                        >
                            {refreshing ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                <RefreshIcon />
                            )}
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Error alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Stats row */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                    <StatsCard
                        icon={TrophyIcon}
                        label="Progresso"
                        value={`${completionPct}%`}
                        color="#4ecdc4"
                        subtext={`${doneTasks} de ${totalTasks}`}
                    />
                    <StatsCard
                        icon={TimeIcon}
                        label="Pendentes"
                        value={totalTasks - doneTasks}
                        color="#667eea"
                    />
                    {slaBreaches > 0 && (
                        <StatsCard
                            icon={WarningIcon}
                            label="SLA em risco"
                            value={slaBreaches}
                            color="#ff6b6b"
                        />
                    )}
                </Box>

                {/* Progress bar */}
                <Box sx={{ mb: 3 }}>
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

                {/* Loading state */}
                {loading ? (
                    <Box>
                        {Object.values(BUCKETS).map((bucket) => (
                            <Paper key={bucket.key} sx={{ mb: 2, borderRadius: 3, overflow: 'hidden' }}>
                                <Skeleton variant="rectangular" height={56} />
                                <Box sx={{ p: 2 }}>
                                    <Skeleton variant="rounded" height={100} sx={{ mb: 2, borderRadius: 3 }} />
                                    <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                ) : (
                    /* Bucket sections */
                    <Box>
                        {Object.keys(BUCKETS).map((bucketKey) => (
                            <BucketSection
                                key={bucketKey}
                                bucket={bucketKey}
                                tasks={tasksByBucket[bucketKey]}
                                onStart={handleStartTask}
                                onComplete={handleCompleteClick}
                                onSnooze={handleSnoozeTask}
                                loading={loading}
                            />
                        ))}
                    </Box>
                )}

                {/* Empty state */}
                {!loading && tasks.length === 0 && (
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            🎉 Dia livre!
                        </Typography>
                        <Typography color="text.secondary">
                            Nenhuma tarefa gerada para hoje.
                        </Typography>
                        <Button
                            variant="outlined"
                            sx={{ mt: 2 }}
                            onClick={handleRefresh}
                        >
                            Gerar tarefas
                        </Button>
                    </Paper>
                )}

                {/* Outcome dialog */}
                <TaskOutcomeDialog
                    open={outcomeDialogOpen}
                    task={selectedTask}
                    onClose={() => {
                        setOutcomeDialogOpen(false)
                        setSelectedTask(null)
                    }}
                    onComplete={handleCompleteTask}
                />

                {/* Toast */}
                <Snackbar
                    open={toast.open}
                    autoHideDuration={3000}
                    onClose={() => setToast({ ...toast, open: false })}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert
                        severity={toast.severity}
                        onClose={() => setToast({ ...toast, open: false })}
                        sx={{ borderRadius: 2 }}
                    >
                        {toast.message}
                    </Alert>
                </Snackbar>
            </Box>
        </PullToRefresh>
    )
}
