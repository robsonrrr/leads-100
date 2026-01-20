import { useState, useEffect } from 'react'
import { Autocomplete, TextField, CircularProgress, Box, Typography } from '@mui/material'
import { customersService } from '../services/api'

function CustomerAutocomplete({ value, onChange, error, helperText }) {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')

  // Incluir valor pré-selecionado nas opções
  useEffect(() => {
    if (value && !options.find(o => o.id === value.id)) {
      setOptions(prev => [value, ...prev.filter(o => o.id !== value.id)])
    }
  }, [value])

  useEffect(() => {
    if (inputValue.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchCustomers(inputValue)
      }, 300)

      return () => clearTimeout(timeoutId)
    } else {
      setOptions(value ? [value] : [])
    }
  }, [inputValue])

  const searchCustomers = async (searchTerm) => {
    try {
      setLoading(true)
      const response = await customersService.search({
        search: searchTerm,
        limit: 10,
        simple: '1'
      })

      if (response.data.success) {
        setOptions(response.data.data)
      }
    } catch (err) {
      console.error('Erro ao buscar clientes:', err)
      setOptions([])
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = (option) => {
    const parts = []
    if (option.ender) parts.push(option.ender)
    if (option.city) parts.push(option.city)
    if (option.state) parts.push(option.state)
    return parts.length > 0 ? parts.join(', ') : ''
  }

  const formatLimit = (limite) => {
    if (!limite || limite === 0) return null
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(limite)
  }

  return (
    <Autocomplete
      options={options}
      value={value}
      onChange={(event, newValue) => {
        onChange(newValue)
      }}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue)
      }}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option
        return option.name || option.tradeName || `Cliente #${option.id}`
      }}
      isOptionEqualToValue={(option, value) => option.id === value?.id}
      loading={loading}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props
        const address = formatAddress(option)
        const limitFormatted = formatLimit(option.limite)
        return (
          <Box component="li" key={key} {...optionProps}>
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1">
                  {option.name || option.tradeName || `Cliente #${option.id}`}
                </Typography>
                {limitFormatted && (
                  <Typography variant="body2" color="primary" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    Limite: {limitFormatted}
                  </Typography>
                )}
              </Box>
              {address && (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  {address}
                </Typography>
              )}
            </Box>
          </Box>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Cliente"
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      noOptionsText={inputValue.length < 2 ? 'Digite pelo menos 2 caracteres' : 'Nenhum cliente encontrado'}
    />
  )
}

export default CustomerAutocomplete

