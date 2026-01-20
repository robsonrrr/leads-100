/**
 * WhatsApp v2.0 - ContactSearch Component
 * Barra de busca de contatos com debounce
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
    Box,
    TextField,
    InputAdornment,
    IconButton,
    CircularProgress,
} from '@mui/material'
import {
    Search as SearchIcon,
    Clear as ClearIcon,
} from '@mui/icons-material'
import { TIMEOUTS } from '../../utils/constants'

/**
 * Componente de busca com debounce
 */
function ContactSearch({
    value = '',
    onChange,
    onSearch,
    loading = false,
    placeholder = 'Buscar contato...',
}) {
    const [localValue, setLocalValue] = useState(value)
    const debounceRef = useRef(null)

    // Sincronizar valor externo
    useEffect(() => {
        setLocalValue(value)
    }, [value])

    // Debounce da busca
    const handleChange = useCallback((e) => {
        const newValue = e.target.value
        setLocalValue(newValue)

        // Cancelar debounce anterior
        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }

        // Novo debounce
        debounceRef.current = setTimeout(() => {
            onChange?.(newValue)
            onSearch?.(newValue)
        }, TIMEOUTS.SEARCH_DEBOUNCE)
    }, [onChange, onSearch])

    // Limpar busca
    const handleClear = useCallback(() => {
        setLocalValue('')
        onChange?.('')
        onSearch?.('')

        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }
    }, [onChange, onSearch])

    // Cleanup
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
        }
    }, [])

    return (
        <Box sx={{ p: 1.5, borderBottom: '1px solid #e0e0e0' }}>
            <TextField
                fullWidth
                size="small"
                value={localValue}
                onChange={handleChange}
                placeholder={placeholder}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            {loading ? (
                                <CircularProgress size={18} color="inherit" />
                            ) : (
                                <SearchIcon color="action" fontSize="small" />
                            )}
                        </InputAdornment>
                    ),
                    endAdornment: localValue ? (
                        <InputAdornment position="end">
                            <IconButton
                                size="small"
                                onClick={handleClear}
                                edge="end"
                            >
                                <ClearIcon fontSize="small" />
                            </IconButton>
                        </InputAdornment>
                    ) : null,
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: '#f5f5f5',
                        '& fieldset': {
                            borderColor: 'transparent',
                        },
                        '&:hover fieldset': {
                            borderColor: '#e0e0e0',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#25D366',
                        },
                    },
                }}
            />
        </Box>
    )
}

export default ContactSearch
