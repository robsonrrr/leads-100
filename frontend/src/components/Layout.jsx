import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon,
  LocalOffer as PromotionsIcon,
  Flag as FlagIcon,
  Description as ReportsIcon,
  Security as SecurityIcon,
  ListAlt as ListAltIcon,
  GpsFixed as TargetIcon,
  Inventory as ProductsIcon,
  WhatsApp as WhatsAppIcon,
  AdminPanelSettings as AdminIcon,
  ChecklistRtl as TasksIcon,
  Help as HelpIcon
} from '@mui/icons-material'
import { logout } from '../store/slices/authSlice'
import { interactionsService } from '../services/api'
import ChatBot from './ChatBot/ChatBot'
import PWAInstallPrompt from './PWAInstallPrompt'
import OfflineIndicator from './OfflineIndicator'
import InAppNotification from './InAppNotification'
import NotificationBell from './common/NotificationBell'
import SyncErrorNotifications from './SyncErrorNotifications'
import useServiceWorker from '../hooks/useServiceWorker'
import DailyLeadGoalBadge from './DailyLeadGoalBadge'
import DailyMachinesGoalBadge from './DailyMachinesGoalBadge'

const drawerWidth = 240

function Layout({ children }) {
  // Inicializar Service Worker
  useServiceWorker()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [followUpCount, setFollowUpCount] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { user, token } = useSelector((state) => state.auth)

  // Carregar contagem de follow-ups pendentes
  useEffect(() => {
    const loadFollowUpCount = async () => {
      try {
        const response = await interactionsService.getFollowUpsCount()
        if (response.data.success) {
          setFollowUpCount(response.data.data.overdue || 0)
        }
      } catch (err) {
        console.error('Erro ao carregar contagem de follow-ups:', err)
      }
    }
    loadFollowUpCount()
    // Atualizar a cada 5 minutos
    const interval = setInterval(loadFollowUpCount, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  // Mobile Swipe Detection
  const touchStartRef = useRef(0)
  const touchEndRef = useRef(0)

  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartRef.current = e.targetTouches[0].clientX
    }

    const handleTouchMove = (e) => {
      touchEndRef.current = e.targetTouches[0].clientX
    }

    const handleTouchEnd = () => {
      const start = touchStartRef.current
      const end = touchEndRef.current
      const distance = end - start

      // Swipe from left edge (within first 40px) to open
      if (start < 40 && distance > 80 && !mobileOpen) {
        setMobileOpen(true)
      }

      // Swipe left to right from drawer to close
      if (mobileOpen && distance < -80) {
        setMobileOpen(false)
      }
    }

    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [mobileOpen])

  const getJwtLevel = (jwt) => {
    try {
      if (!jwt) return 0
      const parts = jwt.split('.')
      if (parts.length < 2) return 0
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4 || 4)) % 4, '=')
      const payload = JSON.parse(atob(padded))
      return payload?.level ?? 0
    } catch {
      return 0
    }
  }

  const userLevel = user?.level ?? user?.nivel ?? getJwtLevel(token) ?? 0
  const isManager = userLevel > 4
  const isRestricted = userLevel < 4
  const isLevelLessThan5 = userLevel < 5  // Para ocultar WhatsApp e Produtos

  const menuItems = [
    ...(!isRestricted ? [{ text: 'Dashboard', icon: <Badge badgeContent={followUpCount} color="error" max={9}><DashboardIcon /></Badge>, path: '/' }] : []),
    { text: '📋 Seu Dia', icon: <TasksIcon sx={{ color: '#667eea' }} />, path: '/tasks' },
    { text: 'Leads', icon: <ListAltIcon />, path: '/leads' },
    { text: 'Produtos', icon: <ProductsIcon />, path: '/products' },
    { text: 'Minha Carteira', icon: <PeopleIcon />, path: '/customers' },
    ...(!isRestricted ? [{ text: 'Analytics', icon: <BarChartIcon />, path: '/analytics' }] : []),
    { text: 'Metas por Cliente', icon: <TargetIcon />, path: '/metas-por-cliente' },
    { text: 'Promoções', icon: <PromotionsIcon />, path: '/promotions' },
    { text: 'Desconto por Quantidade', icon: <PromotionsIcon />, path: '/pricing/quantity-discounts' },
    { text: 'Lançamentos', icon: <PromotionsIcon />, path: '/pricing/launch-products' },
    ...(isManager ? [{ text: 'Metas', icon: <FlagIcon />, path: '/goals' }] : []),
    ...(!isRestricted ? [{ text: 'Relatórios', icon: <ReportsIcon />, path: '/reports' }] : []),
    ...(!isLevelLessThan5 ? [{ text: 'WhatsApp', icon: <WhatsAppIcon sx={{ color: '#25D366' }} />, path: '/whatsapp-v2' }] : []),
    { text: 'Novo Lead', icon: <AddIcon />, path: '/leads/new' },
    { text: 'Segurança', icon: <SecurityIcon />, path: '/security' },
    ...(isManager ? [{ text: 'Admin', icon: <AdminIcon sx={{ color: '#1a237e' }} />, path: '/admin' }] : []),
    { text: 'Ajuda', icon: <HelpIcon sx={{ color: '#0288d1' }} />, path: '/help' },
  ]

  // Versão do app (importada do package.json via Vite)
  const appVersion = import.meta.env.PACKAGE_VERSION || '1.7.13'

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar>
        <Box
          component="img"
          src="https://cdn.rolemak.com.br/media/rolemak-preto.svg"
          alt="Rolemak"
          sx={{
            height: 24,
            width: 'auto',
            objectFit: 'contain',
            display: 'block'
          }}
        />
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path)
                setMobileOpen(false)
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Leads Agent v{appVersion}
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Gestão de Leads
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DailyMachinesGoalBadge />
            <DailyLeadGoalBadge />
            <NotificationBell />
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user?.nick || user?.username}
            </Typography>
            <IconButton onClick={handleMenuOpen} size="small">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {(user?.nick || user?.username || 'U').charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                Perfil
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); navigate('/security'); }}>
                <ListItemIcon>
                  <SecurityIcon fontSize="small" />
                </ListItemIcon>
                Segurança
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Sair
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
      {(user?.level > 4 || user?.id === 107) && <ChatBot />}
      <PWAInstallPrompt />
      <OfflineIndicator />
      <InAppNotification />
      <SyncErrorNotifications />
    </Box>
  )
}

export default Layout

