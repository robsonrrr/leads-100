import { useState, useEffect } from 'react'
import {
    Drawer,
    Box,
    Typography,
    IconButton,
    Button,
    Divider,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    FormControlLabel,
    Switch,
    Slider,
    Autocomplete,
    Stack,
    Badge,
    useTheme,
    alpha
} from '@mui/material'
import {
    Close as CloseIcon,
    FilterList as FilterIcon,
    Clear as ClearIcon,
    Save as SaveIcon,
    RestartAlt as ResetIcon
} from '@mui/icons-material'
import { leadsService, customersService } from '../services/api'

const SEGMENT_OPTIONS = [
    { id: 1, name: 'Máquinas', slug: 'machines' },
    { id: 2, name: 'Rolamentos', slug: 'bearings' },
    { id: 3, name: 'Peças', slug: 'parts' },
    { id: 5, name: 'Auto', slug: 'auto' },
    { id: 6, name: 'Moto', slug: 'moto' }
]

const STATUS_OPTIONS = [
    { value: '', label: 'Todos' },
    { value: 'aberto', label: 'Em Aberto' },
    { value: 'convertido', label: 'Convertido' },
    { value: 'cancelado', label: 'Cancelado' }
]

const VALUE_RANGES = [
    { min: 0, max: 1000, label: 'Até R$ 1.000' },
    { min: 1000, max: 5000, label: 'R$ 1.000 - R$ 5.000' },
    { min: 5000, max: 10000, label: 'R$ 5.000 - R$ 10.000' },
    { min: 10000, max: 50000, label: 'R$ 10.000 - R$ 50.000' },
    { min: 50000, max: null, label: 'Acima de R$ 50.000' }
]

export default function AdvancedFilters({
    open,
    onClose,
    filters,
    onApply,
    sellers = [],
    isManager = false
}) {
    const theme = useTheme()

    // Estado local dos filtros
    const [localFilters, setLocalFilters] = useState({
        dateFrom: '',
        dateTo: '',
        status: '',
        segment: '',
        sellerId: '',
        minValue: 0,
        maxValue: 100000,
        hasItems: null,
        customerSearch: '',
        selectedCustomer: null,
        onlyWithOrder: false,
        onlyWithoutOrder: false
    })

    // Sincronizar com filtros externos
    useEffect(() => {
        if (filters) {
            setLocalFilters(prev => ({
                ...prev,
                ...filters
            }))
        }
    }, [filters, open])

    // Estado para busca de clientes
    const [customerOptions, setCustomerOptions] = useState([])
    const [loadingCustomers, setLoadingCustomers] = useState(false)

    // Buscar clientes
    const searchCustomers = async (query) => {
        if (!query || query.length < 2) {
            setCustomerOptions([])
            return
        }

        try {
            setLoadingCustomers(true)
            const response = await customersService.search(query)
            if (response.data.success) {
                setCustomerOptions(response.data.data || [])
            }
        } catch (err) {
            console.error('Erro ao buscar clientes:', err)
        } finally {
            setLoadingCustomers(false)
        }
    }

    // Debounce da busca de clientes
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (localFilters.customerSearch) {
                searchCustomers(localFilters.customerSearch)
            }
        }, 300)
        return () => clearTimeout(timeout)
    }, [localFilters.customerSearch])

    // Contar filtros ativos
    const countActiveFilters = () => {
        let count = 0
        if (localFilters.dateFrom) count++
        if (localFilters.dateTo) count++
        if (localFilters.status) count++
        if (localFilters.segment) count++
        if (localFilters.sellerId) count++
        if (localFilters.minValue > 0) count++
        if (localFilters.maxValue < 100000) count++
        if (localFilters.hasItems !== null) count++
        if (localFilters.selectedCustomer) count++
        if (localFilters.onlyWithOrder) count++
        if (localFilters.onlyWithoutOrder) count++
        return count
    }

    // Atualizar filtro
    const updateFilter = (key, value) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }))
    }

    // Limpar todos os filtros
    const clearAllFilters = () => {
        setLocalFilters({
            dateFrom: '',
            dateTo: '',
            status: '',
            segment: '',
            sellerId: '',
            minValue: 0,
            maxValue: 100000,
            hasItems: null,
            customerSearch: '',
            selectedCustomer: null,
            onlyWithOrder: false,
            onlyWithoutOrder: false
        })
    }

    // Aplicar filtros
    const handleApply = () => {
        onApply(localFilters)
        onClose()
    }

    // Presets de data rápida
    const applyDatePreset = (preset) => {
        const today = new Date()
        let from, to

        switch (preset) {
            case 'today':
                from = to = today.toISOString().split('T')[0]
                break
            case 'yesterday':
                const yesterday = new Date(today)
                yesterday.setDate(yesterday.getDate() - 1)
                from = to = yesterday.toISOString().split('T')[0]
                break
            case 'week':
                const weekAgo = new Date(today)
                weekAgo.setDate(weekAgo.getDate() - 7)
                from = weekAgo.toISOString().split('T')[0]
                to = today.toISOString().split('T')[0]
                break
            case 'month':
                const monthAgo = new Date(today)
                monthAgo.setMonth(monthAgo.getMonth() - 1)
                from = monthAgo.toISOString().split('T')[0]
                to = today.toISOString().split('T')[0]
                break
            case 'quarter':
                const quarterAgo = new Date(today)
                quarterAgo.setMonth(quarterAgo.getMonth() - 3)
                from = quarterAgo.toISOString().split('T')[0]
                to = today.toISOString().split('T')[0]
                break
            default:
                return
        }

        setLocalFilters(prev => ({ ...prev, dateFrom: from, dateTo: to }))
    }

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: '100%', sm: 400 },
                    bgcolor: 'background.paper'
                }
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: 'white'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FilterIcon />
                    <Typography variant="h6" fontWeight="bold">
                        Filtros Avançados
                    </Typography>
                    {countActiveFilters() > 0 && (
                        <Chip
                            label={countActiveFilters()}
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                        />
                    )}
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'white' }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Content */}
            <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
                {/* Período */}
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    📅 Período
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    {[
                        { key: 'today', label: 'Hoje' },
                        { key: 'yesterday', label: 'Ontem' },
                        { key: 'week', label: '7 dias' },
                        { key: 'month', label: '30 dias' },
                        { key: 'quarter', label: '90 dias' }
                    ].map(preset => (
                        <Chip
                            key={preset.key}
                            label={preset.label}
                            size="small"
                            variant="outlined"
                            onClick={() => applyDatePreset(preset.key)}
                            sx={{ cursor: 'pointer' }}
                        />
                    ))}
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <TextField
                        label="De"
                        type="date"
                        size="small"
                        fullWidth
                        value={localFilters.dateFrom}
                        onChange={(e) => updateFilter('dateFrom', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        label="Até"
                        type="date"
                        size="small"
                        fullWidth
                        value={localFilters.dateTo}
                        onChange={(e) => updateFilter('dateTo', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* Status */}
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    📊 Status
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3 }}>
                    {STATUS_OPTIONS.map(option => (
                        <Chip
                            key={option.value}
                            label={option.label}
                            size="small"
                            variant={localFilters.status === option.value ? 'filled' : 'outlined'}
                            color={localFilters.status === option.value ? 'primary' : 'default'}
                            onClick={() => updateFilter('status', option.value)}
                            sx={{ cursor: 'pointer', mb: 1 }}
                        />
                    ))}
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* Segmento */}
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    🏷️ Segmento
                </Typography>
                <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                    <InputLabel>Segmento</InputLabel>
                    <Select
                        value={localFilters.segment}
                        onChange={(e) => updateFilter('segment', e.target.value)}
                        label="Segmento"
                    >
                        <MenuItem value="">Todos</MenuItem>
                        {SEGMENT_OPTIONS.map(seg => (
                            <MenuItem key={seg.id} value={seg.id}>
                                {seg.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Vendedor (apenas para gerentes) */}
                {isManager && sellers.length > 0 && (
                    <>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            👤 Vendedor
                        </Typography>
                        <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                            <InputLabel>Vendedor</InputLabel>
                            <Select
                                value={localFilters.sellerId}
                                onChange={(e) => updateFilter('sellerId', e.target.value)}
                                label="Vendedor"
                            >
                                <MenuItem value="">Todos</MenuItem>
                                {sellers.map(seller => (
                                    <MenuItem key={seller.id} value={seller.id}>
                                        {seller.nick || seller.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Busca de Cliente */}
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    🏢 Cliente
                </Typography>
                <Autocomplete
                    size="small"
                    options={customerOptions}
                    getOptionLabel={(option) => option.nome || option.name || ''}
                    value={localFilters.selectedCustomer}
                    onChange={(_, newValue) => updateFilter('selectedCustomer', newValue)}
                    onInputChange={(_, newValue) => updateFilter('customerSearch', newValue)}
                    loading={loadingCustomers}
                    noOptionsText="Digite para buscar..."
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Buscar cliente"
                            placeholder="Nome ou CNPJ"
                        />
                    )}
                    renderOption={(props, option) => (
                        <li {...props} key={option.id}>
                            <Box>
                                <Typography variant="body2" fontWeight="bold">
                                    {option.nome || option.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {option.cnpj} • {option.cidade}/{option.estado}
                                </Typography>
                            </Box>
                        </li>
                    )}
                    sx={{ mb: 3 }}
                />

                <Divider sx={{ my: 2 }} />

                {/* Faixa de Valor */}
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    💰 Faixa de Valor
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                    {VALUE_RANGES.map((range, idx) => (
                        <Chip
                            key={idx}
                            label={range.label}
                            size="small"
                            variant="outlined"
                            onClick={() => {
                                updateFilter('minValue', range.min)
                                updateFilter('maxValue', range.max || 100000)
                            }}
                            sx={{ cursor: 'pointer', mb: 1 }}
                        />
                    ))}
                </Stack>
                <Box sx={{ px: 1, mb: 3 }}>
                    <Slider
                        value={[localFilters.minValue, localFilters.maxValue]}
                        onChange={(_, newValue) => {
                            updateFilter('minValue', newValue[0])
                            updateFilter('maxValue', newValue[1])
                        }}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                        min={0}
                        max={100000}
                        step={1000}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                            R$ {localFilters.minValue.toLocaleString('pt-BR')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            R$ {localFilters.maxValue.toLocaleString('pt-BR')}
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Opções adicionais */}
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    ⚙️ Opções
                </Typography>
                <Stack spacing={1} sx={{ mb: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={localFilters.hasItems === true}
                                onChange={(e) => updateFilter('hasItems', e.target.checked ? true : null)}
                                size="small"
                            />
                        }
                        label="Apenas leads com itens"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={localFilters.onlyWithOrder}
                                onChange={(e) => {
                                    updateFilter('onlyWithOrder', e.target.checked)
                                    if (e.target.checked) updateFilter('onlyWithoutOrder', false)
                                }}
                                size="small"
                            />
                        }
                        label="Apenas convertidos em pedido"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={localFilters.onlyWithoutOrder}
                                onChange={(e) => {
                                    updateFilter('onlyWithoutOrder', e.target.checked)
                                    if (e.target.checked) updateFilter('onlyWithOrder', false)
                                }}
                                size="small"
                            />
                        }
                        label="Apenas sem pedido"
                    />
                </Stack>
            </Box>

            {/* Footer */}
            <Box
                sx={{
                    p: 2,
                    borderTop: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    gap: 1
                }}
            >
                <Button
                    variant="outlined"
                    startIcon={<ResetIcon />}
                    onClick={clearAllFilters}
                    sx={{ flex: 1 }}
                >
                    Limpar
                </Button>
                <Button
                    variant="contained"
                    startIcon={<FilterIcon />}
                    onClick={handleApply}
                    sx={{ flex: 2 }}
                >
                    Aplicar Filtros
                </Button>
            </Box>
        </Drawer>
    )
}

// Componente de botão para abrir os filtros
export function FilterButton({ onClick, activeCount = 0 }) {
    return (
        <Badge badgeContent={activeCount} color="primary" invisible={activeCount === 0}>
            <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={onClick}
                sx={{
                    borderColor: activeCount > 0 ? 'primary.main' : 'divider',
                    color: activeCount > 0 ? 'primary.main' : 'text.secondary'
                }}
            >
                Filtros
            </Button>
        </Badge>
    )
}
