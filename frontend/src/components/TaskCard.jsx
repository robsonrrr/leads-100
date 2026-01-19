/**
 * TaskCard Component
 * Displays a single task with all relevant information
 */
import { useState } from 'react'
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    IconButton,
    Tooltip,
    LinearProgress,
    Collapse,
    Button,
    Stack,
    Avatar
} from '@mui/material'
import {
    PlayArrow as StartIcon,
    CheckCircle as DoneIcon,
    Snooze as SnoozeIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
    Warning as WarningIcon,
    Person as PersonIcon,
    AccessTime as TimeIcon,
    TipsAndUpdates as TipsIcon,
    BlockOutlined as DoNotIcon,
    WhatsApp as WhatsAppIcon,
    Description as LeadIcon,
    Receipt as QuoteIcon,
    TrendingDown as ChurnIcon,
    EmojiEvents as GoalIcon
} from '@mui/icons-material'
import { motion } from 'framer-motion'

/**
 * Get icon by task type
 */
const getTaskIcon = (taskType) => {
    if (taskType?.includes('WHATSAPP') || taskType?.includes('REPLY')) return WhatsAppIcon
    if (taskType?.includes('LEAD')) return LeadIcon
    if (taskType?.includes('QUOTE')) return QuoteIcon
    if (taskType?.includes('CHURN')) return ChurnIcon
    if (taskType?.includes('GOAL')) return GoalIcon
    return LeadIcon
}

/**
 * Get bucket colors
 */
const getBucketStyles = (bucket) => {
    switch (bucket) {
        case 'CRITICAL':
            return {
                bg: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                chip: { bgcolor: 'error.main', color: 'white' },
                border: '2px solid #ff6b6b'
            }
        case 'OPPORTUNITY':
            return {
                bg: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                chip: { bgcolor: 'success.main', color: 'white' },
                border: '2px solid #4ecdc4'
            }
        case 'HYGIENE':
            return {
                bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                chip: { bgcolor: 'info.main', color: 'white' },
                border: '2px solid #667eea'
            }
        default:
            return {
                bg: 'linear-gradient(135deg, #636e72 0%, #2d3436 100%)',
                chip: { bgcolor: 'grey.600', color: 'white' },
                border: '2px solid #636e72'
            }
    }
}

/**
 * Format time remaining for SLA
 */
const formatSlaRemaining = (slaDueAt) => {
    if (!slaDueAt) return null

    const now = new Date()
    const due = new Date(slaDueAt)
    const diff = due - now

    if (diff < 0) {
        const overdue = Math.abs(diff)
        const hours = Math.floor(overdue / (1000 * 60 * 60))
        return { text: `${hours}h atrasado`, isOverdue: true }
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
        return { text: `${hours}h ${minutes}min`, isOverdue: false, isUrgent: hours < 1 }
    }
    return { text: `${minutes}min`, isOverdue: false, isUrgent: minutes < 30 }
}

export default function TaskCard({
    task,
    onStart,
    onComplete,
    onSnooze,
    expanded: controlledExpanded,
    onExpandChange
}) {
    const [localExpanded, setLocalExpanded] = useState(false)
    const expanded = controlledExpanded !== undefined ? controlledExpanded : localExpanded

    const toggleExpanded = () => {
        if (onExpandChange) {
            onExpandChange(!expanded)
        } else {
            setLocalExpanded(!localExpanded)
        }
    }

    const bucketStyles = getBucketStyles(task.task_bucket)
    const TaskIcon = getTaskIcon(task.task_type)
    const slaInfo = formatSlaRemaining(task.sla_due_at)

    const recommended = task.recommended_json || {}
    const guardrails = task.guardrail_json || {}
    const playbook = recommended.playbook || task.rule_playbook || {}
    const whyReasons = recommended.why || []

    const isInProgress = task.status === 'IN_PROGRESS'
    const isDone = task.status === 'DONE'
    const isSnoozed = task.status === 'SNOOZED'

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card
                sx={{
                    mb: 2,
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    border: isInProgress ? bucketStyles.border : 'none',
                    opacity: isDone ? 0.7 : 1,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: isDone ? 'none' : 'translateY(-2px)',
                        boxShadow: isDone ? '0 4px 20px rgba(0,0,0,0.1)' : '0 8px 30px rgba(0,0,0,0.15)'
                    }
                }}
            >
                {/* Header gradient strip */}
                <Box sx={{ height: 4, background: bucketStyles.bg }} />

                <CardContent sx={{ p: 2.5 }}>
                    {/* Top row: Icon, Title, Priority, Expand */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Avatar
                            sx={{
                                width: 44,
                                height: 44,
                                background: bucketStyles.bg,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                            }}
                        >
                            <TaskIcon sx={{ fontSize: 24 }} />
                        </Avatar>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography
                                    variant="subtitle1"
                                    sx={{
                                        fontWeight: 600,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        flex: 1,
                                        textDecoration: isDone ? 'line-through' : 'none'
                                    }}
                                >
                                    {task.title}
                                </Typography>
                                <Chip
                                    label={`P: ${task.priority_score}`}
                                    size="small"
                                    sx={{
                                        ...bucketStyles.chip,
                                        fontSize: '0.7rem',
                                        height: 22,
                                        fontWeight: 600
                                    }}
                                />
                            </Box>

                            {/* Customer name and mode */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                {task.customer_name && (
                                    <Chip
                                        icon={<PersonIcon sx={{ fontSize: 14 }} />}
                                        label={task.customer_name}
                                        size="small"
                                        variant="outlined"
                                        sx={{ height: 24, fontSize: '0.75rem' }}
                                    />
                                )}

                                {/* SLA indicator */}
                                {slaInfo && (
                                    <Chip
                                        icon={<TimeIcon sx={{ fontSize: 14 }} />}
                                        label={slaInfo.text}
                                        size="small"
                                        color={slaInfo.isOverdue ? 'error' : slaInfo.isUrgent ? 'warning' : 'default'}
                                        variant={slaInfo.isOverdue ? 'filled' : 'outlined'}
                                        sx={{ height: 24, fontSize: '0.75rem' }}
                                    />
                                )}
                            </Box>
                        </Box>

                        <IconButton onClick={toggleExpanded} size="small">
                            {expanded ? <CollapseIcon /> : <ExpandIcon />}
                        </IconButton>
                    </Box>

                    {/* Expanded content */}
                    <Collapse in={expanded}>
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>

                            {/* Why section */}
                            {whyReasons.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        📍 Por que esta tarefa?
                                    </Typography>
                                    <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {whyReasons.slice(0, 4).map((reason, idx) => (
                                            <Chip
                                                key={idx}
                                                label={reason}
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                                sx={{ fontSize: '0.65rem', height: 20 }}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {/* Playbook / Tips */}
                            {playbook.primary_action && (
                                <Box sx={{
                                    mb: 2,
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(76, 175, 80, 0.1)'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <TipsIcon sx={{ color: 'success.main', fontSize: 18 }} />
                                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.dark' }}>
                                            {playbook.primary_action}
                                        </Typography>
                                    </Box>
                                    {playbook.talking_points && playbook.talking_points.length > 0 && (
                                        <Box sx={{ mt: 1, pl: 3 }}>
                                            {playbook.talking_points.slice(0, 2).map((point, idx) => (
                                                <Typography key={idx} variant="caption" color="text.secondary" display="block">
                                                    • {point}
                                                </Typography>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            )}

                            {/* Guardrails / Do Not */}
                            {guardrails.do_not && guardrails.do_not.length > 0 && (
                                <Box sx={{
                                    mb: 2,
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(244, 67, 54, 0.1)'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <DoNotIcon sx={{ color: 'error.main', fontSize: 18 }} />
                                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'error.dark' }}>
                                            Não fazer:
                                        </Typography>
                                    </Box>
                                    <Box sx={{ mt: 0.5, pl: 3 }}>
                                        {guardrails.do_not.map((item, idx) => (
                                            <Typography key={idx} variant="caption" color="error.dark" display="block">
                                                ❌ {item}
                                            </Typography>
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {/* Action buttons */}
                            {!isDone && (
                                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                    {task.status === 'OPEN' && (
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<StartIcon />}
                                            onClick={() => onStart?.(task)}
                                            sx={{
                                                background: bucketStyles.bg,
                                                '&:hover': { opacity: 0.9 }
                                            }}
                                        >
                                            Iniciar
                                        </Button>
                                    )}

                                    {task.status === 'IN_PROGRESS' && (
                                        <Button
                                            variant="contained"
                                            size="small"
                                            color="success"
                                            startIcon={<DoneIcon />}
                                            onClick={() => onComplete?.(task)}
                                        >
                                            Concluir
                                        </Button>
                                    )}

                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<SnoozeIcon />}
                                        onClick={() => onSnooze?.(task)}
                                    >
                                        Adiar
                                    </Button>
                                </Stack>
                            )}

                            {/* Done indicator */}
                            {isDone && (
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    mt: 1,
                                    color: 'success.main'
                                }}>
                                    <DoneIcon fontSize="small" />
                                    <Typography variant="body2">
                                        Concluído • {task.outcome_code}
                                        {task.outcome_reason_code && ` (${task.outcome_reason_code})`}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Collapse>

                    {/* Quick action buttons when collapsed */}
                    {!expanded && !isDone && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5, gap: 1 }}>
                            {task.status === 'OPEN' && (
                                <Tooltip title="Iniciar tarefa">
                                    <IconButton
                                        size="small"
                                        onClick={() => onStart?.(task)}
                                        sx={{
                                            background: bucketStyles.bg,
                                            color: 'white',
                                            '&:hover': { opacity: 0.9 }
                                        }}
                                    >
                                        <StartIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                            {task.status === 'IN_PROGRESS' && (
                                <Tooltip title="Concluir tarefa">
                                    <IconButton
                                        size="small"
                                        color="success"
                                        onClick={() => onComplete?.(task)}
                                        sx={{ bgcolor: 'success.light' }}
                                    >
                                        <DoneIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    )
}
