import { useManagerFilter } from '../contexts/ManagerFilterContext'
import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Autocomplete,
    TextField,
    InputAdornment,
    CircularProgress,
    Chip,
    IconButton,
    Tooltip
} from '@mui/material'
import {
    People as PeopleIcon,
    Clear as ClearIcon
} from '@mui/icons-material'

function ManagerFilters({ compact = false }) {
    const {
        isManager,
        sellerSegments,
        selectedSellerSegment,
        setSegment,
        sellers,
        loadingSellers,
        selectedSeller,
        setSeller,
        clearFilters
    } = useManagerFilter()

    if (!isManager) return null

    const hasActiveFilter = selectedSellerSegment || selectedSeller

    if (compact) {
        // Versão compacta para exibir no header
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {selectedSeller && (
                    <Chip
                        icon={<PeopleIcon fontSize="small" />}
                        label={selectedSeller.name}
                        onDelete={() => setSeller(null)}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                )}
                {selectedSellerSegment && !selectedSeller && (
                    <Chip
                        label={`Seg: ${selectedSellerSegment}`}
                        onDelete={() => setSegment('')}
                        size="small"
                        color="secondary"
                        variant="outlined"
                    />
                )}
            </Box>
        )
    }

    return (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {sellerSegments.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Seg. Vendedor</InputLabel>
                    <Select
                        value={selectedSellerSegment}
                        label="Seg. Vendedor"
                        onChange={(e) => setSegment(e.target.value)}
                    >
                        <MenuItem value="">Todos</MenuItem>
                        {sellerSegments.map(seg => (
                            <MenuItem key={seg} value={seg}>{seg}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            <Autocomplete
                size="small"
                options={sellers}
                getOptionLabel={(option) => option.name}
                value={selectedSeller}
                onChange={(e, newValue) => setSeller(newValue)}
                loading={loadingSellers}
                sx={{ minWidth: 220 }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Vendedor"
                        placeholder="Todos"
                        InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                                <>
                                    <InputAdornment position="start">
                                        <PeopleIcon color="action" fontSize="small" />
                                    </InputAdornment>
                                    {params.InputProps.startAdornment}
                                </>
                            ),
                            endAdornment: (
                                <>
                                    {loadingSellers ? <CircularProgress color="inherit" size={18} /> : null}
                                    {params.InputProps.endAdornment}
                                </>
                            ),
                        }}
                    />
                )}
            />

            {hasActiveFilter && (
                <Tooltip title="Limpar filtros">
                    <IconButton size="small" onClick={clearFilters} color="error">
                        <ClearIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
        </Box>
    )
}

export default ManagerFilters
