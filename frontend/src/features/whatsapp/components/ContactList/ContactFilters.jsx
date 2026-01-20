/**
 * WhatsApp v2.0 - ContactFilters Component
 * Filtros adicionais para lista de contatos
 */

import React from 'react'
import {
    Box,
    FormControl,
    Select,
    MenuItem,
    Chip,
    Typography,
} from '@mui/material'
import {
    FilterList as FilterIcon,
    Person as PersonIcon,
} from '@mui/icons-material'

/**
 * Componente de filtros para contatos
 */
function ContactFilters({
    sellers = [],
    selectedSellerId = null,
    onSellerChange,
    totalContacts = 0,
    showCount = true,
}) {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1.5,
                py: 1,
                bgcolor: '#fafafa',
                borderBottom: '1px solid #e0e0e0',
            }}
        >
            {/* Contagem */}
            {showCount && (
                <Typography variant="caption" color="text.secondary">
                    {totalContacts} contato{totalContacts !== 1 ? 's' : ''}
                </Typography>
            )}

            {/* Filtro por vendedor */}
            {sellers.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select
                        value={selectedSellerId || ''}
                        onChange={(e) => onSellerChange(e.target.value || null)}
                        displayEmpty
                        sx={{
                            fontSize: '0.8rem',
                            '& .MuiSelect-select': {
                                py: 0.5,
                            },
                        }}
                        startAdornment={
                            <PersonIcon
                                sx={{ mr: 0.5, fontSize: 16, color: '#9e9e9e' }}
                            />
                        }
                    >
                        <MenuItem value="">
                            <em>Todos vendedores</em>
                        </MenuItem>
                        {sellers.map((seller) => (
                            <MenuItem key={seller.id} value={seller.id}>
                                {seller.name || seller.username}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            {/* Chip de filtro ativo */}
            {selectedSellerId && (
                <Chip
                    size="small"
                    label="Filtro ativo"
                    onDelete={() => onSellerChange(null)}
                    icon={<FilterIcon fontSize="small" />}
                    sx={{ ml: 1 }}
                />
            )}
        </Box>
    )
}

export default ContactFilters
