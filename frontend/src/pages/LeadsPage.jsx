import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
    Typography,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Button,
    IconButton,
    TextField,
    InputAdornment,
    Tooltip,
    Alert,
    Chip
} from '@mui/material'
import {
    Add as AddIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Search as SearchIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    ContentCopy as CopyIcon,
    FilterList as FilterListIcon,
    FileDownload as FileDownloadIcon
} from '@mui/icons-material'
import { leadsService } from '../services/api'
import { useSelector } from 'react-redux'
import { useManagerFilter } from '../contexts/ManagerFilterContext'
import { formatDate, formatCurrency } from '../utils'
import { DashboardSkeleton } from '../components/skeletons'
import EmptyState from '../components/EmptyState'
import ManagerFilters from '../components/ManagerFilters'
import PullToRefresh from '../components/PullToRefresh'
import { useToast } from '../contexts/ToastContext'
import LeadsMetrics from '../components/LeadsMetrics'
import AdvancedFilters, { FilterButton } from '../components/AdvancedFilters'
import { CheckCircle as ConvertedIcon, HourglassEmpty as PendingIcon, WhatsApp as WhatsAppIcon, Print as PrintIcon } from '@mui/icons-material'

function LeadsPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()
    const { user } = useSelector((state) => state.auth)
    const toast = useToast()

    const getInitialPage = () => {
        const pageParam = searchParams.get('page')
        const stored = localStorage.getItem('leads-page-page')
        return pageParam ? parseInt(pageParam, 10) - 1 : (stored ? parseInt(stored, 10) : 0)
    }

    const getInitialRowsPerPage = () => {
        const limitParam = searchParams.get('limit')
        const stored = localStorage.getItem('leads-page-rowsPerPage')
        return limitParam ? parseInt(limitParam, 10) : (stored ? parseInt(stored, 10) : 100)
    }

    const getInitialSort = () => {
        const sortKey = searchParams.get('sort')
        const sortDir = searchParams.get('dir')
        const storedSort = localStorage.getItem('leads-page-sort')
        const storedDir = localStorage.getItem('leads-page-sortDir')

        if (sortKey) return { key: sortKey, direction: sortDir || 'desc' }
        if (storedSort) return { key: storedSort, direction: storedDir || 'desc' }
        return { key: 'id', direction: 'desc' }
    }

    const formatTimeAgo = (dateString) => {
        if (!dateString) return ''
        const now = new Date()
        const date = new Date(dateString)
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'agora'
        if (diffMins < 60) return `${diffMins}min`
        if (diffHours < 24) return `${diffHours}h`
        return `${diffDays}d`
    }

    const formatTime = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

    const [leads, setLeads] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [page, setPage] = useState(getInitialPage())
    const [rowsPerPage, setRowsPerPage] = useState(getInitialRowsPerPage())
    const [total, setTotal] = useState(0)
    const [sortConfig, setSortConfig] = useState(getInitialSort())
    const [selectedSegment, setSelectedSegment] = useState(() => {
        const segmentParam = searchParams.get('segment')
        const stored = localStorage.getItem('leads-page-segment')
        return segmentParam !== null ? segmentParam : (stored || '')
    })

    const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '')
    const [debouncedQuery, setDebouncedQuery] = useState(() => searchParams.get('q') || '')
    const getTodayDate = () => new Date().toISOString().split('T')[0]
    const [dateFrom, setDateFrom] = useState(() => searchParams.get('dateFrom') || getTodayDate())
    const [dateTo, setDateTo] = useState(() => searchParams.get('dateTo') || getTodayDate())
    const [metrics, setMetrics] = useState({ totalCount: 0, totalValue: 0, convertedCount: 0 })
    const [statusFilter, setStatusFilter] = useState('')
    const [sellers, setSellers] = useState([])
    const [sellerFilter, setSellerFilter] = useState('')
    const [exporting, setExporting] = useState(false)
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
    const [advancedFilters, setAdvancedFilters] = useState({})

    const { isManager, selectedSellerSegment, selectedSeller, getFilterParams } = useManagerFilter()

    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedQuery(searchQuery), 400)
        return () => clearTimeout(timeout)
    }, [searchQuery])

    useEffect(() => {
        loadLeads()
    }, [page, rowsPerPage, sortConfig, selectedSegment, debouncedQuery, selectedSellerSegment, selectedSeller, dateFrom, dateTo, statusFilter, sellerFilter])

    const loadLeads = async () => {
        try {
            setLoading(true)
            setError('')
            const params = {
                page: page + 1,
                limit: rowsPerPage,
                sort: sortConfig.key || 'total',
                sortDir: sortConfig.direction || 'desc',
                ...getFilterParams()
            }
            if (debouncedQuery?.trim()) params.q = debouncedQuery.trim()
            if (selectedSegment) params.cSegment = selectedSegment
            if (dateFrom) params.dateFrom = dateFrom
            if (dateTo) params.dateTo = dateTo
            if (statusFilter) params.status = statusFilter
            if (sellerFilter) params.filterSellerId = sellerFilter

            const response = await leadsService.getAll(params)
            if (response.data.success) {
                setLeads(response.data.data || [])
                setTotal(response.data.pagination?.total || 0)
                if (response.data.pagination?.metrics) {
                    setMetrics({
                        totalCount: response.data.pagination.total,
                        totalValue: response.data.pagination.metrics.totalValue,
                        convertedCount: response.data.pagination.metrics.convertedCount
                    })
                }
                // Extrair vendedores únicos dos leads para o filtro
                const uniqueSellers = [...new Map((response.data.data || []).filter(l => l.sellerNick).map(l => [l.sellerId || l.sellerNick, { id: l.sellerId, nick: l.sellerNick }])).values()]
                if (uniqueSellers.length > 0 && sellers.length === 0) {
                    setSellers(uniqueSellers)
                }
            }
        } catch (err) {
            setError('Erro ao carregar leads')
            toast.showError('Erro ao carregar leads')
        } finally {
            setLoading(false)
        }
    }

    const handleSort = (key) => {
        const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
        setSortConfig({ key, direction })
        setPage(0)
    }

    const getSortedLeads = () => {
        if (!sortConfig.key) return leads
        return [...leads].sort((a, b) => {
            let aV = a[sortConfig.key], bV = b[sortConfig.key]
            if (sortConfig.key === 'total') { aV = a.totalValue; bV = b.totalValue }
            return sortConfig.direction === 'asc' ? (aV > bV ? 1 : -1) : (aV < bV ? 1 : -1)
        })
    }

    // Exportar leads para Excel
    const handleExport = async () => {
        try {
            setExporting(true)
            const params = {
                ...getFilterParams(),
                limit: 1000
            }
            if (debouncedQuery?.trim()) params.q = debouncedQuery.trim()
            if (selectedSegment) params.cSegment = selectedSegment
            if (dateFrom) params.dateFrom = dateFrom
            if (dateTo) params.dateTo = dateTo
            if (statusFilter) params.status = statusFilter
            if (sellerFilter) params.sellerId = sellerFilter

            const response = await leadsService.exportToExcel(params)

            // Criar blob e download
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `leads_${new Date().toISOString().split('T')[0]}.xlsx`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.showSuccess('Exportação concluída!')
        } catch (err) {
            toast.showError('Erro ao exportar leads')
            console.error('Export error:', err)
        } finally {
            setExporting(false)
        }
    }

    const SortableHeader = ({ columnKey, children, align = 'left' }) => {
        const isActive = sortConfig.key === columnKey
        return (
            <TableCell align={align} onClick={() => handleSort(columnKey)} sx={{ cursor: 'pointer' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
                    {children}
                    {isActive && (sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                </Box>
            </TableCell>
        )
    }

    return (
        <PullToRefresh onRefresh={loadLeads}>
            <Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
                    <Typography variant="h4">Leads</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                        <TextField
                            size="small"
                            placeholder="Buscar..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                        />
                        <TextField
                            size="small"
                            type="date"
                            label="De"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            size="small"
                            type="date"
                            label="Até"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                        <ManagerFilters />
                        <Button
                            variant="outlined"
                            startIcon={<FileDownloadIcon />}
                            onClick={handleExport}
                            disabled={exporting || loading}
                        >
                            {exporting ? 'Exportando...' : 'Excel'}
                        </Button>
                        <FilterButton
                            onClick={() => setShowAdvancedFilters(true)}
                            activeCount={Object.values(advancedFilters).filter(v => v !== '' && v !== null && v !== undefined && v !== 0 && v !== 100000).length}
                        />
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/leads/new')}>Novo Lead</Button>
                    </Box>
                </Box>

                {/* Advanced Filters Drawer */}
                <AdvancedFilters
                    open={showAdvancedFilters}
                    onClose={() => setShowAdvancedFilters(false)}
                    filters={{
                        dateFrom,
                        dateTo,
                        status: statusFilter,
                        sellerId: sellerFilter,
                        segment: selectedSegment
                    }}
                    onApply={(filters) => {
                        if (filters.dateFrom) setDateFrom(filters.dateFrom)
                        if (filters.dateTo) setDateTo(filters.dateTo)
                        if (filters.status !== undefined) setStatusFilter(filters.status)
                        if (filters.sellerId !== undefined) setSellerFilter(filters.sellerId)
                        if (filters.segment !== undefined) setSelectedSegment(filters.segment)
                        setAdvancedFilters(filters)
                        setPage(0)
                    }}
                    sellers={sellers}
                    isManager={isManager}
                />

                <LeadsMetrics metrics={metrics} loading={loading} />

                {/* Filtros Rápidos */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                        <FilterListIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                        Filtros:
                    </Typography>

                    {/* Filtro por Status */}
                    <Chip
                        label="Todos"
                        size="small"
                        variant={statusFilter === '' ? 'filled' : 'outlined'}
                        color={statusFilter === '' ? 'primary' : 'default'}
                        onClick={() => { setStatusFilter(''); setPage(0); }}
                        sx={{ fontWeight: statusFilter === '' ? 700 : 400 }}
                    />
                    <Chip
                        label="Abertos"
                        size="small"
                        icon={<PendingIcon />}
                        variant={statusFilter === 'aberto' ? 'filled' : 'outlined'}
                        color={statusFilter === 'aberto' ? 'info' : 'default'}
                        onClick={() => { setStatusFilter('aberto'); setPage(0); }}
                        sx={{ fontWeight: statusFilter === 'aberto' ? 700 : 400 }}
                    />
                    <Chip
                        label="Convertidos"
                        size="small"
                        icon={<ConvertedIcon />}
                        variant={statusFilter === 'convertido' ? 'filled' : 'outlined'}
                        color={statusFilter === 'convertido' ? 'success' : 'default'}
                        onClick={() => { setStatusFilter('convertido'); setPage(0); }}
                        sx={{ fontWeight: statusFilter === 'convertido' ? 700 : 400 }}
                    />

                    {/* Separador */}
                    <Box sx={{ borderLeft: '1px solid', borderColor: 'divider', height: 24, mx: 1 }} />

                    {/* Filtro por Vendedor */}
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                        Vendedor:
                    </Typography>
                    <Chip
                        label="Todos"
                        size="small"
                        variant={sellerFilter === '' ? 'filled' : 'outlined'}
                        color={sellerFilter === '' ? 'primary' : 'default'}
                        onClick={() => { setSellerFilter(''); setPage(0); }}
                        sx={{ fontWeight: sellerFilter === '' ? 700 : 400 }}
                    />
                    {sellers.map(seller => (
                        <Chip
                            key={seller.id || seller.nick}
                            label={seller.nick}
                            size="small"
                            variant={sellerFilter === String(seller.id) ? 'filled' : 'outlined'}
                            color={sellerFilter === String(seller.id) ? 'secondary' : 'default'}
                            onClick={() => { setSellerFilter(String(seller.id)); setPage(0); }}
                            sx={{ fontWeight: sellerFilter === String(seller.id) ? 700 : 400 }}
                        />
                    ))}
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Paper>
                    {loading ? <DashboardSkeleton /> : (
                        <>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <SortableHeader columnKey="id">ID</SortableHeader>
                                            <TableCell>Seg</TableCell>
                                            <TableCell align="center">Itens</TableCell>
                                            <SortableHeader columnKey="customer">Cliente</SortableHeader>
                                            <SortableHeader columnKey="date">Data</SortableHeader>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Responsável</TableCell>
                                            <SortableHeader columnKey="orderWeb"># Pedido</SortableHeader>
                                            <SortableHeader columnKey="total" align="right">Total</SortableHeader>
                                            <TableCell align="right">Ações</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {getSortedLeads().map(lead => (
                                            <TableRow key={lead.id} hover>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        {lead.id}
                                                        <IconButton size="small" onClick={() => { navigator.clipboard.writeText(lead.id); toast.showSuccess('Copiado!') }}>
                                                            <CopyIcon sx={{ fontSize: '0.8rem' }} />
                                                        </IconButton>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={lead.segmentName ? lead.segmentName.substring(0, 3).toUpperCase() : '-'}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontSize: '0.65rem', fontWeight: 600 }}
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Tooltip title={`${lead.pricedItemCount || 0} com preço / ${lead.itemCount || 0} total`}>
                                                        <Chip
                                                            label={`${lead.pricedItemCount || 0}/${lead.itemCount || 0}`}
                                                            size="small"
                                                            color={lead.pricedItemCount > 0 ? 'success' : (lead.itemCount > 0 ? 'warning' : 'default')}
                                                            sx={{ fontSize: '0.7rem', fontWeight: 600, minWidth: 40 }}
                                                        />
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{lead.customerName || '-'}</Typography>
                                                        {lead.xBuyer && <Typography variant="caption" color="text.secondary">Comprador: {lead.xBuyer}</Typography>}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2">{formatDate(lead.createdAt)} {formatTime(lead.createdAt)}</Typography>
                                                        <Typography variant="caption" color="text.secondary">há {formatTimeAgo(lead.createdAt)}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    {lead.orderWeb ? (
                                                        <Chip label="CONVERTIDO" size="small" color="success" icon={<ConvertedIcon />} sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                                                    ) : (
                                                        <Chip label="ABERTO" size="small" color="info" icon={<PendingIcon />} sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption" sx={{ fontWeight: 500 }}>{lead.sellerNick || '-'}</Typography>
                                                </TableCell>
                                                <TableCell>{lead.orderWeb || '-'}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(lead.totalValue || 0)}</TableCell>
                                                <TableCell align="right">
                                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                                        {lead.customerPhone && (
                                                            <Tooltip title="WhatsApp">
                                                                <IconButton size="small" color="success" onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(`https://wa.me/55${lead.customerPhone.replace(/\D/g, '')}`, '_blank')
                                                                }}>
                                                                    <WhatsAppIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip title="Visualizar">
                                                            <IconButton size="small" color="primary" onClick={() => navigate(`/leads/${lead.id}`)}><VisibilityIcon fontSize="small" /></IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Imprimir">
                                                            <IconButton size="small" onClick={() => window.open(`/leads/${lead.id}/mail`, '_blank')}><PrintIcon fontSize="small" /></IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Editar">
                                                            <IconButton size="small" onClick={() => navigate(`/leads/${lead.id}/edit`)}><EditIcon fontSize="small" /></IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {leads.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={8}>
                                                    <EmptyState
                                                        title="Nenhum lead encontrado"
                                                        description="Tente ajustar seus filtros ou crie um novo lead."
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                component="div"
                                count={total}
                                page={page}
                                onPageChange={(e, p) => setPage(p)}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
                            />
                        </>
                    )}
                </Paper>
            </Box>
        </PullToRefresh>
    )
}

export default LeadsPage
