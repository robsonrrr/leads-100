import React, { useState, useEffect } from 'react'
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    LinearProgress,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert,
    ToggleButtonGroup,
    ToggleButton
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TargetIcon from '@mui/icons-material/GpsFixed'
import { analyticsV2Service } from '../services/api'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

export default function CustomerGoalsWidget() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filter, setFilter] = useState('all') // all, A, B, C, I
    const { user } = useSelector((state) => state.auth)
    const navigate = useNavigate()

    const fetchData = async () => {
        setLoading(true)
        setError(null)
        try {
            // Buscar metas do vendedor logado
            const sellerId = user?.id
            if (!sellerId) {
                setError('Usuário não identificado')
                return
            }

            const response = await analyticsV2Service.getCustomerGoalsBySeller(sellerId, {
                classification: filter !== 'all' ? filter : null,
                limit: 20
            })

            if (response.data.success) {
                setData(response.data.data)
            }
        } catch (err) {
            setError(err.message || 'Erro ao carregar metas')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [user?.id, filter])

    const getClassificationColor = (classification) => {
        switch (classification) {
            case 'A': return 'success'
            case 'B': return 'info'
            case 'C': return 'warning'
            case 'I': return 'error'
            default: return 'default'
        }
    }

    const getClassificationLabel = (classification) => {
        switch (classification) {
            case 'A': return 'Top'
            case 'B': return 'Médio'
            case 'C': return 'Baixo'
            case 'I': return 'Inativo'
            default: return classification
        }
    }

    const getProgressColor = (pct) => {
        if (pct >= 80) return 'success'
        if (pct >= 50) return 'info'
        if (pct >= 25) return 'warning'
        return 'error'
    }

    if (loading) {
        return (
            <Card>
                <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card>
                <CardContent>
                    <Alert severity="error">{error}</Alert>
                </CardContent>
            </Card>
        )
    }

    const customers = data?.customers || []
    const summary = data?.summary || []
    const totals = data?.totals || {}

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TargetIcon color="primary" />
                        <Typography variant="h6" fontWeight="bold">
                            Metas por Cliente
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title="Abrir em página">
                            <IconButton size="small" onClick={() => navigate('/metas-por-cliente')}>
                                <OpenInFullIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Atualizar">
                            <IconButton size="small" onClick={fetchData}>
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Summary Cards */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {summary.map((s) => (
                        <Chip
                            key={s.classification}
                            label={`${getClassificationLabel(s.classification)}: ${s.customers} (${s.achievement_pct || 0}%)`}
                            color={getClassificationColor(s.classification)}
                            size="small"
                            variant="outlined"
                        />
                    ))}
                </Box>

                {/* Filter */}
                <Box sx={{ mb: 2 }}>
                    <ToggleButtonGroup
                        value={filter}
                        exclusive
                        onChange={(e, v) => v && setFilter(v)}
                        size="small"
                    >
                        <ToggleButton value="all">Todos</ToggleButton>
                        <ToggleButton value="A">Top A</ToggleButton>
                        <ToggleButton value="B">Médio B</ToggleButton>
                        <ToggleButton value="C">Baixo C</ToggleButton>
                        <ToggleButton value="I">Inativos</ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* Table */}
                <TableContainer sx={{ maxHeight: 350 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Cliente</TableCell>
                                <TableCell align="center">Classe</TableCell>
                                <TableCell align="right">Meta</TableCell>
                                <TableCell align="right">Vendido</TableCell>
                                <TableCell align="center" sx={{ minWidth: 120 }}>Progresso</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {customers.map((customer) => (
                                <TableRow key={customer.customer_id} hover>
                                    <TableCell>
                                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                            {customer.customer_name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {customer.city}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={customer.classification}
                                            color={getClassificationColor(customer.classification)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" fontWeight="medium">
                                            {customer.goal_2026}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                            {customer.sold_2026 > 0 ? (
                                                <TrendingUpIcon fontSize="small" color="success" />
                                            ) : (
                                                <TrendingDownIcon fontSize="small" color="error" />
                                            )}
                                            <Typography variant="body2">
                                                {customer.sold_2026}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={Math.min(customer.achievement_pct, 100)}
                                                color={getProgressColor(customer.achievement_pct)}
                                                sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                                            />
                                            <Typography variant="caption" sx={{ minWidth: 35 }}>
                                                {customer.achievement_pct}%
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Totals */}
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                            {totals.customers || 0} clientes
                        </Typography>
                        <Typography variant="body2">
                            <strong>{totals.total_sold || 0}</strong> / {totals.total_goal || 0} un
                            ({totals.total_goal > 0 ? Math.round((totals.total_sold / totals.total_goal) * 100) : 0}%)
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    )
}
