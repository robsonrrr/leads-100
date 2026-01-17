import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material'
import {
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  Description as ReportIcon,
  People as PeopleIcon,
  Assignment as LeadsIcon,
  TrendingUp as PerformanceIcon,
  Flag as GoalsIcon
} from '@mui/icons-material'
import { reportsService, customersService } from '../services/api'
import { useToast } from '../contexts/ToastContext'

const reportIcons = {
  portfolio: PeopleIcon,
  leads: LeadsIcon,
  performance: PerformanceIcon,
  goals: GoalsIcon
}

const reportColors = {
  portfolio: '#2196f3',
  leads: '#ff9800',
  performance: '#4caf50',
  goals: '#9c27b0'
}

function ReportsPage() {
  const toast = useToast()
  const { user } = useSelector((state) => state.auth)
  const isManager = (user?.level || 0) > 4

  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(null)
  
  // Filtros para gerentes
  const [segments, setSegments] = useState([])
  const [sellers, setSellers] = useState([])
  const [selectedSegment, setSelectedSegment] = useState('')
  const [selectedSeller, setSelectedSeller] = useState('')

  const currentYear = new Date().getFullYear()

  useEffect(() => {
    loadReports()
    if (isManager) {
      loadFilters()
    }
  }, [isManager])

  const loadReports = async () => {
    try {
      setLoading(true)
      const response = await reportsService.getTypes()
      if (response.data.success) {
        setReports(response.data.data || [])
      }
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err)
      toast.error('Erro ao carregar lista de relatórios')
    } finally {
      setLoading(false)
    }
  }

  const loadFilters = async () => {
    try {
      const [segResponse, sellerResponse] = await Promise.all([
        customersService.getSellerSegments(),
        customersService.getSellers()
      ])
      if (segResponse.data.success) {
        setSegments(segResponse.data.data || [])
      }
      if (sellerResponse.data.success) {
        setSellers(sellerResponse.data.data || [])
      }
    } catch (err) {
      console.error('Erro ao carregar filtros:', err)
    }
  }

  const handleDownload = async (reportId) => {
    try {
      setDownloading(reportId)
      
      const params = {}
      if (selectedSegment) params.segmento = selectedSegment
      if (selectedSeller) params.sellerId = selectedSeller
      params.year = currentYear

      let response
      switch (reportId) {
        case 'portfolio':
          response = await reportsService.downloadPortfolio(params)
          break
        case 'leads':
          response = await reportsService.downloadLeads(params)
          break
        case 'performance':
          response = await reportsService.downloadPerformance(params)
          break
        case 'goals':
          response = await reportsService.downloadGoals(params)
          break
        default:
          throw new Error('Relatório não encontrado')
      }

      // Download do arquivo
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `relatorio-${reportId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Relatório gerado com sucesso!')
    } catch (err) {
      console.error('Erro ao gerar relatório:', err)
      toast.error(err.response?.data?.error?.message || 'Erro ao gerar relatório')
    } finally {
      setDownloading(null)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReportIcon color="primary" fontSize="large" />
          <Typography variant="h4">Relatórios</Typography>
        </Box>

        {isManager && (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Segmento</InputLabel>
              <Select
                value={selectedSegment}
                label="Segmento"
                onChange={(e) => setSelectedSegment(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {segments.map(seg => (
                  <MenuItem key={seg} value={seg}>{seg}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Vendedor</InputLabel>
              <Select
                value={selectedSeller}
                label="Vendedor"
                onChange={(e) => setSelectedSeller(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {sellers.map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.nick || s.user}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </Box>

      {/* Info */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Clique em "Gerar PDF" para baixar o relatório. Os filtros selecionados acima serão aplicados.
      </Alert>

      {/* Cards de Relatórios */}
      <Grid container spacing={3}>
        {reports.map((report) => {
          const IconComponent = reportIcons[report.id] || ReportIcon
          const color = reportColors[report.id] || '#666'
          const isDownloading = downloading === report.id

          return (
            <Grid item xs={12} sm={6} md={4} key={report.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Box 
                      sx={{ 
                        p: 1, 
                        borderRadius: 2, 
                        bgcolor: `${color}20`,
                        display: 'flex'
                      }}
                    >
                      <IconComponent sx={{ color, fontSize: 28 }} />
                    </Box>
                    <PdfIcon color="error" fontSize="small" />
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    {report.name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    {report.description}
                  </Typography>

                  {report.managerOnly && (
                    <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                      Apenas gerentes
                    </Typography>
                  )}
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={isDownloading ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
                    onClick={() => handleDownload(report.id)}
                    disabled={isDownloading}
                  >
                    {isDownloading ? 'Gerando...' : 'Gerar PDF'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}

export default ReportsPage
