/**
 * Chatbot Config Page - Admin
 * 
 * Configuração do chatbot e respostas automáticas
 * 
 * @version 1.0
 * @date 2026-01-18
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    TextField,
    Switch,
    FormControlLabel,
    Chip,
    Alert,
    CircularProgress,
    Grid,
    Card,
    CardContent,
    Divider,
    Slider,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material'
import {
    ArrowBack as ArrowBackIcon,
    Save as SaveIcon,
    Refresh as RefreshIcon,
    SmartToy as ChatbotIcon,
    Schedule as ScheduleIcon,
    Message as MessageIcon,
    Psychology as AIIcon,
    Warning as WarningIcon,
    ExpandMore as ExpandMoreIcon,
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
} from '@mui/icons-material'
import adminService from '../../services/admin.service'

// Default config values
const DEFAULT_CONFIG = {
    enabled: true,
    workingHours: {
        enabled: true,
        start: '08:00',
        end: '18:00',
        days: [1, 2, 3, 4, 5], // Mon-Fri
        timezone: 'America/Sao_Paulo',
    },
    messages: {
        greeting: 'Olá! Sou o assistente virtual da Rolemak. Como posso ajudar você hoje?',
        away: 'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h. Deixe sua mensagem que retornaremos assim que possível!',
        fallback: 'Desculpe, não entendi sua mensagem. Pode reformular ou digite "ajuda" para ver as opções disponíveis.',
        escalation: 'Vou transferir você para um de nossos atendentes. Por favor, aguarde um momento.',
    },
    ai: {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 500,
        enableAnalysis: true,
    },
    escalation: {
        enabled: true,
        keywords: ['gerente', 'humano', 'atendente', 'reclamação', 'problema'],
        maxAttempts: 3,
        inactivityTimeout: 300, // seconds
    },
    features: {
        autoReply: true,
        intentDetection: true,
        sentimentAnalysis: true,
        transcribeAudio: true,
    },
}

const DAYS_OF_WEEK = [
    { value: 0, label: 'Dom' },
    { value: 1, label: 'Seg' },
    { value: 2, label: 'Ter' },
    { value: 3, label: 'Qua' },
    { value: 4, label: 'Qui' },
    { value: 5, label: 'Sex' },
    { value: 6, label: 'Sáb' },
]

const AI_MODELS = [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Rápido)' },
    { value: 'gpt-4o', label: 'GPT-4o (Avançado)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku (Rápido)' },
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
]

function TabPanel({ children, value, index, ...props }) {
    return (
        <div hidden={value !== index} {...props}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    )
}

const ChatbotConfigPage = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [tabValue, setTabValue] = useState(0)

    const [config, setConfig] = useState(DEFAULT_CONFIG)
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        loadConfig()
    }, [])

    const loadConfig = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await adminService.getChatbotConfig()
            if (response.data?.data) {
                setConfig({ ...DEFAULT_CONFIG, ...response.data.data })
            }
        } catch (err) {
            console.error('Erro ao carregar configuração:', err)
            // Use default config if not found
            setConfig(DEFAULT_CONFIG)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            setError(null)
            await adminService.updateChatbotConfig(config)
            setSuccess('Configuração salva com sucesso!')
            setHasChanges(false)
            setTimeout(() => setSuccess(null), 3000)
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao salvar configuração')
        } finally {
            setSaving(false)
        }
    }

    const updateConfig = (path, value) => {
        setConfig(prev => {
            const newConfig = { ...prev }
            const keys = path.split('.')
            let current = newConfig
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = { ...current[keys[i]] }
                current = current[keys[i]]
            }
            current[keys[keys.length - 1]] = value
            return newConfig
        })
        setHasChanges(true)
    }

    const toggleDay = (day) => {
        const days = [...config.workingHours.days]
        const index = days.indexOf(day)
        if (index > -1) {
            days.splice(index, 1)
        } else {
            days.push(day)
            days.sort()
        }
        updateConfig('workingHours.days', days)
    }

    const addKeyword = (keyword) => {
        if (keyword && !config.escalation.keywords.includes(keyword)) {
            updateConfig('escalation.keywords', [...config.escalation.keywords, keyword])
        }
    }

    const removeKeyword = (keyword) => {
        updateConfig('escalation.keywords', config.escalation.keywords.filter(k => k !== keyword))
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => navigate('/admin')}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            🤖 Configuração do Chatbot
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Respostas automáticas, IA e horários de funcionamento
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {/* Status global */}
                    <Chip
                        icon={config.enabled ? <PlayIcon /> : <PauseIcon />}
                        label={config.enabled ? 'Chatbot Ativo' : 'Chatbot Pausado'}
                        color={config.enabled ? 'success' : 'default'}
                        onClick={() => updateConfig('enabled', !config.enabled)}
                        sx={{ cursor: 'pointer' }}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={loadConfig}
                    >
                        Recarregar
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                    >
                        Salvar
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}

            {hasChanges && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Você tem alterações não salvas
                </Alert>
            )}

            {/* Tabs */}
            <Paper sx={{ mb: 2 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                    <Tab icon={<ScheduleIcon />} label="Horários" />
                    <Tab icon={<MessageIcon />} label="Mensagens" />
                    <Tab icon={<AIIcon />} label="IA" />
                    <Tab icon={<WarningIcon />} label="Escalação" />
                </Tabs>
            </Paper>

            {/* Tab: Horários */}
            <TabPanel value={tabValue} index={0}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        ⏰ Horário de Funcionamento
                    </Typography>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.workingHours.enabled}
                                onChange={(e) => updateConfig('workingHours.enabled', e.target.checked)}
                            />
                        }
                        label="Ativar horário de funcionamento"
                    />

                    {config.workingHours.enabled && (
                        <Box sx={{ mt: 3 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="time"
                                        label="Início"
                                        value={config.workingHours.start}
                                        onChange={(e) => updateConfig('workingHours.start', e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="time"
                                        label="Fim"
                                        value={config.workingHours.end}
                                        onChange={(e) => updateConfig('workingHours.end', e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Dias de funcionamento
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        {DAYS_OF_WEEK.map(day => (
                                            <Chip
                                                key={day.value}
                                                label={day.label}
                                                color={config.workingHours.days.includes(day.value) ? 'primary' : 'default'}
                                                onClick={() => toggleDay(day.value)}
                                                sx={{ cursor: 'pointer' }}
                                            />
                                        ))}
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </Paper>
            </TabPanel>

            {/* Tab: Mensagens */}
            <TabPanel value={tabValue} index={1}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        💬 Mensagens Automáticas
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Mensagem de Saudação"
                                value={config.messages.greeting}
                                onChange={(e) => updateConfig('messages.greeting', e.target.value)}
                                helperText="Enviada quando o cliente inicia uma conversa"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Mensagem Fora do Horário"
                                value={config.messages.away}
                                onChange={(e) => updateConfig('messages.away', e.target.value)}
                                helperText="Enviada fora do horário de funcionamento"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Mensagem de Fallback"
                                value={config.messages.fallback}
                                onChange={(e) => updateConfig('messages.fallback', e.target.value)}
                                helperText="Enviada quando o chatbot não entende a mensagem"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Mensagem de Escalação"
                                value={config.messages.escalation}
                                onChange={(e) => updateConfig('messages.escalation', e.target.value)}
                                helperText="Enviada quando a conversa é transferida para um humano"
                            />
                        </Grid>
                    </Grid>
                </Paper>
            </TabPanel>

            {/* Tab: IA */}
            <TabPanel value={tabValue} index={2}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        🧠 Configurações de IA
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Modelo de IA</InputLabel>
                                <Select
                                    value={config.ai.model}
                                    onChange={(e) => updateConfig('ai.model', e.target.value)}
                                    label="Modelo de IA"
                                >
                                    {AI_MODELS.map(model => (
                                        <MenuItem key={model.value} value={model.value}>
                                            {model.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Máximo de Tokens"
                                value={config.ai.maxTokens}
                                onChange={(e) => updateConfig('ai.maxTokens', parseInt(e.target.value))}
                                inputProps={{ min: 100, max: 4000 }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography gutterBottom>
                                Temperatura: {config.ai.temperature}
                            </Typography>
                            <Slider
                                value={config.ai.temperature}
                                onChange={(e, v) => updateConfig('ai.temperature', v)}
                                min={0}
                                max={1}
                                step={0.1}
                                marks={[
                                    { value: 0, label: 'Preciso' },
                                    { value: 0.5, label: 'Balanceado' },
                                    { value: 1, label: 'Criativo' },
                                ]}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                Funcionalidades
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.features.autoReply}
                                        onChange={(e) => updateConfig('features.autoReply', e.target.checked)}
                                    />
                                }
                                label="Resposta automática"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.features.intentDetection}
                                        onChange={(e) => updateConfig('features.intentDetection', e.target.checked)}
                                    />
                                }
                                label="Detecção de intenção"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.features.sentimentAnalysis}
                                        onChange={(e) => updateConfig('features.sentimentAnalysis', e.target.checked)}
                                    />
                                }
                                label="Análise de sentimento"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.features.transcribeAudio}
                                        onChange={(e) => updateConfig('features.transcribeAudio', e.target.checked)}
                                    />
                                }
                                label="Transcrever áudio"
                            />
                        </Grid>
                    </Grid>
                </Paper>
            </TabPanel>

            {/* Tab: Escalação */}
            <TabPanel value={tabValue} index={3}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        🚨 Escalação para Humano
                    </Typography>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.escalation.enabled}
                                onChange={(e) => updateConfig('escalation.enabled', e.target.checked)}
                            />
                        }
                        label="Permitir escalação automática"
                    />

                    {config.escalation.enabled && (
                        <Box sx={{ mt: 3 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Máximo de Tentativas"
                                        value={config.escalation.maxAttempts}
                                        onChange={(e) => updateConfig('escalation.maxAttempts', parseInt(e.target.value))}
                                        helperText="Número de tentativas antes de escalar automaticamente"
                                        inputProps={{ min: 1, max: 10 }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Timeout de Inatividade (segundos)"
                                        value={config.escalation.inactivityTimeout}
                                        onChange={(e) => updateConfig('escalation.inactivityTimeout', parseInt(e.target.value))}
                                        helperText="Tempo sem resposta antes de escalar"
                                        inputProps={{ min: 60, max: 3600 }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Palavras-chave para escalar imediatamente
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                        {config.escalation.keywords.map(keyword => (
                                            <Chip
                                                key={keyword}
                                                label={keyword}
                                                onDelete={() => removeKeyword(keyword)}
                                            />
                                        ))}
                                    </Box>
                                    <TextField
                                        size="small"
                                        placeholder="Adicionar palavra-chave..."
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                addKeyword(e.target.value)
                                                e.target.value = ''
                                            }
                                        }}
                                        helperText="Pressione Enter para adicionar"
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </Paper>
            </TabPanel>
        </Box>
    )
}

export default ChatbotConfigPage
