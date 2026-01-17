import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Alert
} from '@mui/material'
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  DragIndicator as DragIndicatorIcon,
  GpsFixed as TargetIcon,
  SmartToy as AIIcon,
  Assignment as OpsIcon
} from '@mui/icons-material'
import { userService } from '../services/api'
import { useSelector } from 'react-redux'
import { useManagerFilter } from '../contexts/ManagerFilterContext'
import MetricsCards from '../components/MetricsCards'
import AlertsWidget from '../components/AlertsWidget'
import AtRiskCustomers from '../components/AtRiskCustomers'
import GoalProgressWidget from '../components/GoalProgressWidget'
import FollowUpsWidget from '../components/FollowUpsWidget'
import RankingWidget from '../components/RankingWidget'
import ManagerMetricsWidget from '../components/ManagerMetricsWidget'
import ForecastWidget from '../components/ForecastWidget'
import DeviationWidget from '../components/DeviationWidget'
import ManagerFilters from '../components/ManagerFilters'
import { useToast } from '../contexts/ToastContext'
import { Reorder, AnimatePresence, motion } from 'framer-motion'
import PullToRefresh from '../components/PullToRefresh'
// Meta 30k Widgets
import ExecutiveSummaryWidget from '../components/ExecutiveSummaryWidget'
import PenetrationWidget from '../components/PenetrationWidget'
import PipelineWidget from '../components/PipelineWidget'
import InventoryHealthWidget from '../components/InventoryHealthWidget'
import CustomerGoalsWidget from '../components/CustomerGoalsWidget'
import LeadsAnalyticsWidget from '../components/LeadsAnalyticsWidget'
import ReplenishmentAlert from '../components/ReplenishmentAlert'

function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const toast = useToast()

  const { isManager, selectedSellerSegment, selectedSeller } = useManagerFilter()

  // Verifica se o segmento atual é "machines" (para widgets da Meta 30k)
  const isMachinesSegment = selectedSellerSegment === 'machines' || !selectedSellerSegment

  // --- ESTADO CUSTOM DASHBOARD (Q2) ---
  const [isConfiguring, setIsConfiguring] = useState(false)
  const [activeWidgets, setActiveWidgets] = useState([])
  const [currentTab, setCurrentTab] = useState(0)

  // Widgets disponíveis - categorizados para abas
  const WIDGETS_LIB = {
    // CATEGORIA: META 30k
    'executive-summary': { component: ExecutiveSummaryWidget, title: '📊 Resumo Executivo', grid: 12, category: 0, priority: true },
    'penetration': { component: PenetrationWidget, title: '👥 Penetração Mensal', grid: 6, category: 0 },
    'pipeline': { component: PipelineWidget, title: '📈 Pipeline de Vendas', grid: 6, category: 0 },
    'customer-goals': { component: CustomerGoalsWidget, title: '🎯 Metas por Cliente', grid: 6, category: 0 },
    'ranking': { component: RankingWidget, title: 'Ranking', grid: 6, category: 0 },

    // CATEGORIA: IA & BI
    'leads-analytics': { component: LeadsAnalyticsWidget, title: '📊 Métricas de Leads', grid: 12, category: 1, priority: true },
    'forecast': { component: ForecastWidget, title: 'Previsão de Vendas (IA)', grid: 6, category: 1 },
    'deviation': { component: DeviationWidget, title: 'Análise de Desvio (IA)', grid: 6, category: 1 },
    'risk': { component: AtRiskCustomers, title: 'Risco Churn (IA)', grid: 6, category: 1 },
    'metrics-cards': { component: MetricsCards, title: 'Resumo de Vendas', grid: 12, category: 1 },

    // CATEGORIA: OPERAÇÕES
    'inventory': { component: InventoryHealthWidget, title: '📦 Saúde do Inventário', grid: 12, category: 2 },
    'replenishment': { component: ReplenishmentAlert, title: '⚠️ Reposição Sugerida', grid: 12, category: 2 },
    'followups': { component: FollowUpsWidget, title: 'Follow-ups', grid: 6, category: 2 },
    'alerts': { component: AlertsWidget, title: 'Alertas Operacionais', grid: 6, category: 2 },
    'manager-metrics': { component: ManagerMetricsWidget, title: 'Métricas de Gerente', grid: 12, category: 2 },
    'goals': { component: GoalProgressWidget, title: 'Metas Gerais', grid: 6, category: 2 }
  }

  // --- EFEITOS E MÉTODOS ---
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await userService.getPreferences()
        const availableWidgets = Object.keys(WIDGETS_LIB)

        if (response.data.success && response.data.data.dashboard_config) {
          const config = response.data.data.dashboard_config
          const widgets = Array.isArray(config.widgets) ? config.widgets : []
          const existingIds = new Set(widgets.map(w => w.id))
          const maxOrder = widgets.reduce((max, w) => Math.max(max, Number.isFinite(w.order) ? w.order : 0), 0)

          const merged = [
            ...widgets,
            ...availableWidgets
              .filter((id) => !existingIds.has(id))
              .map((id, idx) => ({ id, enabled: true, order: maxOrder + 1 + idx }))
          ]

          const sorted = merged
            .filter(w => w.enabled && availableWidgets.includes(w.id))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map(w => w.id)

          setActiveWidgets(sorted.length > 0 ? sorted : availableWidgets)
        } else {
          setActiveWidgets(availableWidgets)
        }
      } catch (err) {
        setActiveWidgets(Object.keys(WIDGETS_LIB))
      }
    }
    loadPreferences()
  }, [isMachinesSegment])

  const handleSaveConfig = async () => {
    try {
      const newConfig = {
        widgets: Object.keys(WIDGETS_LIB).map(id => ({
          id,
          enabled: activeWidgets.includes(id),
          order: activeWidgets.indexOf(id) !== -1 ? activeWidgets.indexOf(id) : 99
        }))
      }
      await userService.updatePreferences({ dashboard_config: newConfig })
      setIsConfiguring(false)
      toast.showSuccess('Dashboard atualizado!')
    } catch (err) {
      toast.showError('Erro ao salvar')
    }
  }

  return (
    <PullToRefresh onRefresh={() => window.location.reload()}>
      <Box>
        {/* Header com Filtros e Ações */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
          <Typography variant="h4" fontWeight="bold">Dashboard</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ManagerFilters />
            <Tooltip title="Customizar Dashboard">
              <IconButton onClick={() => setIsConfiguring(!isConfiguring)} color={isConfiguring ? 'primary' : 'default'}>
                {isConfiguring ? <CloseIcon /> : <SettingsIcon />}
              </IconButton>
            </Tooltip>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/leads/new')}>Novo Lead</Button>
          </Box>
        </Box>

        {/* Navegação por Abas */}
        <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, bgcolor: 'transparent' }}>
          <Tabs
            value={currentTab}
            onChange={(e, v) => setCurrentTab(v)}
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<TargetIcon sx={{ mr: 1 }} />} iconPosition="start" label="Meta 30k" />
            <Tab icon={<AIIcon sx={{ mr: 1 }} />} iconPosition="start" label="IA & Inteligência" />
            <Tab icon={<OpsIcon sx={{ mr: 1 }} />} iconPosition="start" label="Operações" />
          </Tabs>
        </Paper>

        {/* Configuração de Widgets */}
        {isConfiguring && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'action.hover', border: '2px dashed', borderColor: 'primary.main' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Configurar Widgets (Arraste para reordenar)</Typography>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveConfig}>Salvar Layout</Button>
            </Box>
            <Reorder.Group axis="y" values={activeWidgets} onReorder={setActiveWidgets} style={{ listStyle: 'none', padding: 0 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {activeWidgets.map(id => (
                  <Reorder.Item key={id} value={id}>
                    <Chip
                      icon={<DragIndicatorIcon />}
                      label={WIDGETS_LIB[id]?.title}
                      onDelete={() => setActiveWidgets(activeWidgets.filter(w => w !== id))}
                      sx={{ cursor: 'grab', mb: 1 }}
                    />
                  </Reorder.Item>
                ))}
                {Object.keys(WIDGETS_LIB).filter(id => !activeWidgets.includes(id)).map(id => (
                  <Chip key={id} label={WIDGETS_LIB[id]?.title || id} onClick={() => setActiveWidgets([...activeWidgets, id])} variant="outlined" sx={{ mb: 1 }} />
                ))}
              </Box>
            </Reorder.Group>
          </Paper>
        )}

        {/* RENDERIZAÇÃO DINÂMICA DE WIDGETS POR ABA */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '16px' }}
            >
              {currentTab === 0 && !isMachinesSegment && (
                <Alert severity="info" sx={{ width: '100%' }}>
                  Os widgets da aba <strong>Meta 30k</strong> aparecem apenas quando o filtro de segmento está em <strong>machines</strong>.
                </Alert>
              )}

              {activeWidgets
                .filter(id => WIDGETS_LIB[id]?.category === currentTab)
                .map(id => {
                  const W = WIDGETS_LIB[id]
                  if (!W) return null
                  const Component = W.component
                  return (
                    <Box
                      key={id}
                      sx={{
                        width: {
                          xs: '100%',
                          md: W.grid === 12 ? '100%' : W.grid === 6 ? 'calc(50% - 8px)' : 'calc(33.33% - 11px)'
                        }
                      }}
                    >
                      <Component
                        sellerId={selectedSeller?.id}
                        sellerSegmento={!selectedSeller ? selectedSellerSegment : null}
                      />
                    </Box>
                  )
                })}

              {activeWidgets.filter(id => WIDGETS_LIB[id]?.category === currentTab).length === 0 && !(currentTab === 0 && !isMachinesSegment) && (
                <Alert severity="warning" sx={{ width: '100%' }}>
                  Nenhum widget habilitado para esta aba. Use <strong>Customizar Dashboard</strong> para adicionar widgets.
                </Alert>
              )}
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>
    </PullToRefresh>
  )
}

export default DashboardPage
