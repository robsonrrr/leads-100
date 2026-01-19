/**
 * Admin Dashboard Page
 * 
 * Dashboard principal do painel administrativo
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
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    Divider,
    CircularProgress,
    Alert,
} from '@mui/material'
import {
    People as PeopleIcon,
    Phone as PhoneIcon,
    Settings as SettingsIcon,
    Security as SecurityIcon,
    Assessment as AssessmentIcon,
    PersonAdd as PersonAddIcon,
    PhoneAndroid as PhoneAndroidIcon,
    SmartToy as ChatbotIcon,
    Webhook as WebhookIcon,
    History as LogsIcon,
    Storage as StorageIcon,
    TrendingUp as TrendingUpIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import adminService from '../../services/admin.service'

// Card de métrica
const MetricCard = ({ title, value, subtitle, icon, color = 'primary', onClick }) => (
    <Card
        sx={{
            cursor: onClick ? 'pointer' : 'default',
            transition: 'all 0.2s',
            '&:hover': onClick ? {
                transform: 'translateY(-4px)',
                boxShadow: 4,
            } : {},
        }}
        onClick={onClick}
    >
        <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                        {title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color={`${color}.main`}>
                        {value}
                    </Typography>
                    {subtitle && (
                        <Typography variant="caption" color="text.secondary">
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                <Box
                    sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: `${color}.light`,
                        color: `${color}.dark`,
                    }}
                >
                    {icon}
                </Box>
            </Box>
        </CardContent>
    </Card>
)

// Menu de navegação admin
const AdminMenu = ({ items }) => {
    const navigate = useNavigate()

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                ⚙️ Administração
            </Typography>
            <List>
                {items.map((item, index) => (
                    <React.Fragment key={item.path}>
                        <ListItemButton onClick={() => navigate(item.path)}>
                            <ListItemIcon sx={{ color: item.color || 'inherit' }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.title}
                                secondary={item.description}
                            />
                            {item.badge && (
                                <Chip
                                    size="small"
                                    label={item.badge}
                                    color={item.badgeColor || 'default'}
                                />
                            )}
                        </ListItemButton>
                        {index < items.length - 1 && <Divider />}
                    </React.Fragment>
                ))}
            </List>
        </Paper>
    )
}

const AdminDashboard = () => {
    const navigate = useNavigate()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        try {
            setLoading(true)
            const response = await adminService.getStats()
            setStats(response.data?.data)
        } catch (err) {
            console.error('Erro ao carregar estatísticas:', err)
            setError('Não foi possível carregar as estatísticas')
        } finally {
            setLoading(false)
        }
    }

    const menuItems = [
        {
            title: 'Gestão de Usuários',
            description: 'Criar, editar e gerenciar usuários do sistema',
            icon: <PeopleIcon />,
            path: '/admin/users',
            color: '#1976d2',
        },
        {
            title: 'Vinculação de Telefones',
            description: 'Associar telefones WhatsApp a vendedores',
            icon: <PhoneIcon />,
            path: '/admin/seller-phones',
            color: '#25D366',
        },
        {
            title: 'Vinculação de Clientes',
            description: 'Gerenciar links Superbot ↔ Leads-Agent',
            icon: <PhoneAndroidIcon />,
            path: '/admin/customer-links',
            color: '#128C7E',
        },
        {
            title: 'Configuração do Chatbot',
            description: 'Configurar respostas automáticas e IA',
            icon: <ChatbotIcon />,
            path: '/admin/chatbot',
            color: '#9c27b0',
        },
        {
            title: 'Status do Webhook',
            description: 'Monitorar conexão com WhatsApp',
            icon: <WebhookIcon />,
            path: '/admin/webhook',
            color: '#f57c00',
            badge: 'Em breve',
            badgeColor: 'warning',
        },
        {
            title: 'Logs e Auditoria',
            description: 'Visualizar histórico de ações',
            icon: <LogsIcon />,
            path: '/admin/logs',
            color: '#607d8b',
        },
        {
            title: 'Configurações do Sistema',
            description: 'Cache, jobs e health check',
            icon: <StorageIcon />,
            path: '/admin/system',
            color: '#455a64',
            badge: 'Em breve',
            badgeColor: 'warning',
        },
    ]

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
                <Box>
                    <Typography variant="h4" fontWeight="bold">
                        🛠️ Painel Administrativo
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gerenciamento de usuários, configurações e monitoramento
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={() => navigate('/admin/users/new')}
                >
                    Novo Usuário
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Métricas */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Total de Usuários"
                        value={stats?.users?.total || 0}
                        subtitle={`${stats?.users?.active || 0} ativos`}
                        icon={<PeopleIcon fontSize="large" />}
                        color="primary"
                        onClick={() => navigate('/admin/users')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Administradores"
                        value={stats?.users?.admins || 0}
                        subtitle="Level 5+"
                        icon={<SecurityIcon fontSize="large" />}
                        color="secondary"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Vendedores"
                        value={stats?.users?.sellers || 0}
                        subtitle="Level 1-4"
                        icon={<TrendingUpIcon fontSize="large" />}
                        color="success"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Ativos Última Semana"
                        value={stats?.users?.active_last_week || 0}
                        subtitle="Logins nos últimos 7 dias"
                        icon={<CheckCircleIcon fontSize="large" />}
                        color="info"
                    />
                </Grid>
            </Grid>

            {/* Menu de navegação */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <AdminMenu items={menuItems} />
                </Grid>

                <Grid item xs={12} md={4}>
                    {/* Quick Stats */}
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            📊 Resumo Rápido
                        </Typography>
                        <List dense>
                            <ListItem>
                                <ListItemIcon>
                                    <CheckCircleIcon color="success" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={`${stats?.users?.active || 0} usuários ativos`}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon>
                                    <WarningIcon color="warning" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={`${stats?.users?.inactive || 0} usuários inativos`}
                                />
                            </ListItem>
                        </List>
                    </Paper>

                    {/* Níveis de Acesso */}
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            🔐 Níveis de Acesso
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Chip label="Level 1-2: Vendedor" size="small" />
                            <Chip label="Level 3: Vendedor Sênior" size="small" />
                            <Chip label="Level 4: Supervisor" size="small" />
                            <Chip label="Level 5: Gerente" size="small" color="primary" />
                            <Chip label="Level 6: Administrador" size="small" color="secondary" />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    )
}

export default AdminDashboard
