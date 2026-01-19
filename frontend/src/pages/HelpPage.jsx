/**
 * Help Page - User Manual
 * 
 * Displays the appropriate manual based on user level
 * 
 * @version 1.0
 * @date 2026-01-19
 */

import React, { useState, useEffect } from 'react'
import {
    Box,
    Paper,
    Typography,
    Tabs,
    Tab,
    Divider,
    Chip,
    Alert,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Card,
    CardContent,
    Grid,
} from '@mui/material'
import {
    Help as HelpIcon,
    MenuBook as ManualIcon,
    ExpandMore as ExpandMoreIcon,
    CheckCircle as CheckIcon,
    Info as InfoIcon,
    Warning as WarningIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Person as PersonIcon,
    Settings as SettingsIcon,
    Dashboard as DashboardIcon,
    ShoppingCart as LeadIcon,
    People as CustomersIcon,
    Assessment as AnalyticsIcon,
    Flag as GoalsIcon,
    Task as TaskIcon,
    WhatsApp as WhatsAppIcon,
    AdminPanelSettings as AdminIcon,
} from '@mui/icons-material'
import { useSelector } from 'react-redux'

// Quick reference cards
const QuickReferenceCard = ({ title, items, icon, color = 'primary' }) => (
    <Card sx={{ height: '100%' }}>
        <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: `${color}.light`,
                    color: `${color}.dark`,
                    display: 'flex'
                }}>
                    {icon}
                </Box>
                <Typography variant="h6" fontWeight="bold">
                    {title}
                </Typography>
            </Box>
            <List dense>
                {items.map((item, index) => (
                    <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                            primary={item}
                            primaryTypographyProps={{ variant: 'body2' }}
                        />
                    </ListItem>
                ))}
            </List>
        </CardContent>
    </Card>
)

const HelpPage = () => {
    const { user } = useSelector((state) => state.auth)
    const userLevel = user?.level || user?.nivel || 1
    const isManager = userLevel >= 5

    const [tabValue, setTabValue] = useState(0)

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue)
    }

    // Determine user type
    const getUserType = () => {
        if (userLevel >= 6) return { label: 'Administrador', color: 'error' }
        if (userLevel >= 5) return { label: 'Gerente', color: 'secondary' }
        if (userLevel >= 4) return { label: 'Supervisor', color: 'warning' }
        if (userLevel >= 3) return { label: 'Vendedor Sênior', color: 'info' }
        return { label: 'Vendedor', color: 'primary' }
    }

    const userType = getUserType()

    // Seller quick reference
    const sellerQuickRef = [
        {
            title: 'Dashboard',
            icon: <DashboardIcon />,
            color: 'primary',
            items: [
                'Visualize métricas do seu desempenho',
                'Acompanhe leads abertos',
                'Veja clientes em risco',
                'Monitore vendas do mês'
            ]
        },
        {
            title: 'Leads',
            icon: <LeadIcon />,
            color: 'success',
            items: [
                'Crie novas cotações',
                'Acompanhe status dos leads',
                'Converta leads em pedidos',
                'Adicione itens e calcule preços'
            ]
        },
        {
            title: 'Clientes',
            icon: <CustomersIcon />,
            color: 'info',
            items: [
                'Visualize sua carteira',
                'Identifique clientes inativos',
                'Veja histórico de compras',
                'Monitore clientes em risco'
            ]
        },
        {
            title: 'Tarefas do Dia',
            icon: <TaskIcon />,
            color: 'warning',
            items: [
                'Veja tarefas prioritárias',
                'Execute follow-ups',
                'Marque tarefas como concluídas',
                'Registre resultados'
            ]
        }
    ]

    // Manager additional features
    const managerQuickRef = [
        {
            title: 'Gestão de Metas',
            icon: <GoalsIcon />,
            color: 'secondary',
            items: [
                'Defina metas por vendedor',
                'Acompanhe progresso da equipe',
                'Veja ranking de vendedores',
                'Compare meses anteriores'
            ]
        },
        {
            title: 'WhatsApp Analytics',
            icon: <WhatsAppIcon />,
            color: 'success',
            items: [
                'Veja mensagens da equipe',
                'Analise intenções detectadas',
                'Monitore leads automáticos',
                'Acompanhe conversões'
            ]
        },
        {
            title: 'Admin Panel',
            icon: <AdminIcon />,
            color: 'error',
            items: [
                'Gerencie usuários',
                'Vincule telefones WhatsApp',
                'Configure chatbot IA',
                'Veja logs de auditoria'
            ]
        },
        {
            title: 'Analytics Avançado',
            icon: <AnalyticsIcon />,
            color: 'info',
            items: [
                'Métricas consolidadas',
                'Filtro por vendedor/segmento',
                'Previsão de vendas (IA)',
                'Análise de churn'
            ]
        }
    ]

    // FAQ items
    const faqItems = [
        {
            question: 'Como criar um novo lead?',
            answer: 'Acesse o Dashboard e clique no botão "+ Novo Lead". Preencha os dados do cliente, adicione os produtos desejados e salve. O lead ficará disponível na lista de leads abertos.'
        },
        {
            question: 'Como converter um lead em pedido?',
            answer: 'Abra o lead desejado no Dashboard. Revise os itens e valores. Clique no botão "Converter" no topo do lead. Confirme a conversão e o pedido será gerado no sistema.'
        },
        {
            question: 'Como funciona a classificação de clientes?',
            answer: '🟢 Ativo: Comprou nos últimos 30 dias. 🟡 Em Risco: Última compra entre 30-60 dias. 🔴 Inativo: Sem compra há mais de 60 dias.'
        },
        {
            question: 'O que são as Daily Tasks?',
            answer: 'São tarefas prioritárias geradas automaticamente pela IA baseadas em sinais de compra, clientes inativos e oportunidades detectadas. Execute-as para maximizar suas vendas.'
        },
        {
            question: 'Como usar o chatbot?',
            answer: 'Digite sua pergunta no campo de chat. O chatbot entende comandos em português como "simular preço", "buscar cliente", "consultar estoque". Ele aplicará automaticamente as políticas de desconto.'
        },
        ...(isManager ? [
            {
                question: 'Como definir metas para a equipe?',
                answer: 'Acesse Metas no menu lateral. Clique em "Nova Meta", selecione o vendedor, período e valores. As metas podem ser mensais ou anuais. O progresso é calculado automaticamente.'
            },
            {
                question: 'Como vincular telefones WhatsApp aos vendedores?',
                answer: 'Acesse Admin > Telefones Vendedores. Clique em adicionar, selecione o vendedor e digite o número do WhatsApp. Assim, as conversas daquele telefone serão atribuídas ao vendedor correto.'
            },
            {
                question: 'Como ver logs de auditoria?',
                answer: 'Acesse Admin > Logs. Você verá um histórico de todas as ações realizadas no sistema, incluindo quem fez, quando e o que foi alterado. Use os filtros para encontrar ações específicas.'
            }
        ] : [])
    ]

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <HelpIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                    <Typography variant="h4" fontWeight="bold">
                        Central de Ajuda
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manual do usuário e guia rápido
                    </Typography>
                </Box>
                <Box sx={{ ml: 'auto' }}>
                    <Chip
                        icon={<PersonIcon />}
                        label={`${userType.label} (Level ${userLevel})`}
                        color={userType.color}
                        variant="outlined"
                    />
                </Box>
            </Box>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="Guia Rápido" icon={<InfoIcon />} iconPosition="start" />
                    <Tab label="FAQ" icon={<HelpIcon />} iconPosition="start" />
                    <Tab label="Contato" icon={<PhoneIcon />} iconPosition="start" />
                </Tabs>
            </Paper>

            {/* Tab Content */}
            {tabValue === 0 && (
                <Box>
                    {/* Welcome Message */}
                    <Alert severity="info" sx={{ mb: 3 }}>
                        <Typography variant="body1">
                            Bem-vindo ao <strong>Sistema de Gestão de Leads</strong>!
                            {isManager
                                ? ' Como gerente, você tem acesso a funcionalidades avançadas de gestão de equipe e administração.'
                                : ' Aqui você encontra um guia rápido das principais funcionalidades.'}
                        </Typography>
                    </Alert>

                    {/* Seller Features */}
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        📋 Funcionalidades Principais
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                        {sellerQuickRef.map((ref, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index}>
                                <QuickReferenceCard {...ref} />
                            </Grid>
                        ))}
                    </Grid>

                    {/* Manager Features */}
                    {isManager && (
                        <>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                🛠️ Funcionalidades de Gestão
                            </Typography>
                            <Grid container spacing={2} sx={{ mb: 4 }}>
                                {managerQuickRef.map((ref, index) => (
                                    <Grid item xs={12} sm={6} md={3} key={index}>
                                        <QuickReferenceCard {...ref} />
                                    </Grid>
                                ))}
                            </Grid>
                        </>
                    )}

                    {/* Keyboard Shortcuts */}
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            ⌨️ Atalhos Úteis
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={4}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip label="/" size="small" />
                                    <Typography variant="body2">Abrir chatbot</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip label="Ctrl+K" size="small" />
                                    <Typography variant="body2">Busca rápida</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip label="?" size="small" />
                                    <Typography variant="body2">Ajuda</Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Tips */}
                    <Alert severity="success" icon={<CheckIcon />}>
                        <Typography variant="body2">
                            <strong>Dica:</strong> Use o chatbot para fazer simulações de preço, consultar estoque e buscar informações de clientes.
                            Basta digitar sua pergunta em português!
                        </Typography>
                    </Alert>
                </Box>
            )}

            {tabValue === 1 && (
                <Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Perguntas Frequentes
                    </Typography>

                    {faqItems.map((item, index) => (
                        <Accordion key={index} defaultExpanded={index === 0}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography fontWeight="medium">{item.question}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="body2" color="text.secondary">
                                    {item.answer}
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            )}

            {tabValue === 2 && (
                <Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Precisa de Ajuda?
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <EmailIcon color="primary" />
                                        <Typography variant="h6">Suporte Técnico</Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        Para problemas técnicos, bugs ou dúvidas sobre o sistema:
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        suporte@rolemak.com.br
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <PhoneIcon color="success" />
                                        <Typography variant="h6">Telefone</Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        Horário comercial (8h às 18h):
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        (11) 3333-4444
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12}>
                            <Alert severity="info">
                                <Typography variant="body2">
                                    <strong>Dica:</strong> Antes de entrar em contato, tente usar o chatbot do sistema.
                                    Ele pode responder a maioria das dúvidas sobre uso do sistema.
                                </Typography>
                            </Alert>
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* Footer */}
            <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                    Sistema de Gestão de Leads v1.7.0 • © Rolemak 2026
                </Typography>
            </Box>
        </Box>
    )
}

export default HelpPage
