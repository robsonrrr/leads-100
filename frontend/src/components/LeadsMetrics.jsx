import {
    Box,
    Paper,
    Typography,
    Skeleton
} from '@mui/material'
import {
    Assignment as LeadsIcon,
    CheckCircle as ConvertedIcon,
    AttachMoney as PipelineIcon,
    Assessment as TicketIcon
} from '@mui/icons-material'
import { formatCurrency } from '../utils'

function MetricCard({ title, value, icon: Icon, color, loading }) {
    const getGradient = (color) => {
        switch (color) {
            case 'primary': return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            case 'warning': return 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'
            case 'success': return 'linear-gradient(135deg, #84fb95 0%, #116222 100%)'
            case 'info': return 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)'
            default: return 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }
    }

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                flex: 1,
                minWidth: '240px',
                borderRadius: '16px',
                background: '#fff',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 20px -10px rgba(0,0,0,0.1)'
                }
            }}
        >
            <Box
                sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: getGradient(color),
                    color: '#fff',
                    boxShadow: `0 8px 16px -4px ${color === 'primary' ? 'rgba(118, 75, 162, 0.4)' : 'rgba(0,0,0,0.1)'}`
                }}
            >
                <Icon fontSize="medium" />
            </Box>
            <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5, display: 'block' }}>
                    {title}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    {loading ? <Skeleton width={80} /> : value}
                </Typography>
            </Box>
        </Paper>
    )
}

function LeadsMetrics({ metrics, loading }) {
    return (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <MetricCard
                title="Total de Leads"
                value={metrics?.totalCount || 0}
                icon={LeadsIcon}
                color="primary"
                loading={loading}
            />
            <MetricCard
                title="Pipeline Total"
                value={formatCurrency(metrics?.totalValue || 0)}
                icon={PipelineIcon}
                color="warning"
                loading={loading}
            />
            <MetricCard
                title="Convertidos"
                value={metrics?.convertedCount || 0}
                icon={ConvertedIcon}
                color="success"
                loading={loading}
            />
            <MetricCard
                title="Ticket Médio"
                value={formatCurrency(metrics?.totalCount > 0 ? metrics.totalValue / metrics.totalCount : 0)}
                icon={TicketIcon}
                color="info"
                loading={loading}
            />
        </Box>
    )
}

export default LeadsMetrics
