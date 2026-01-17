import { useState, useEffect } from 'react'
import { Autocomplete, TextField, CircularProgress, Box, Typography } from '@mui/material'
import { productsService } from '../services/api'

function ProductAutocomplete({ value, onChange, error, helperText }) {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    if (inputValue.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchProducts(inputValue)
      }, 300)

      return () => clearTimeout(timeoutId)
    } else {
      setOptions([])
    }
  }, [inputValue])

  const searchProducts = async (searchTerm) => {
    try {
      setLoading(true)
      const response = await productsService.search({
        search: searchTerm,
        limit: 10,
        simple: '1'
      })

      if (response.data.success) {
        setOptions(response.data.data)
      }
    } catch (err) {
      console.error('Erro ao buscar produtos:', err)
      setOptions([])
    } finally {
      setLoading(false)
    }
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
        const parts = []
        if (option.model) parts.push(option.model)
        if (option.brand) parts.push(option.brand)
        if (option.name) parts.push(option.name)
        return parts.length > 0 ? parts.join(' - ') : (option.description || `Produto #${option.id}`)
      }}
      isOptionEqualToValue={(option, value) => option.id === value?.id}
      loading={loading}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props
        return (
          <Box component="li" key={key} {...optionProps}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {option.model && `${option.model} - `}
                {option.brand && `${option.brand} - `}
                {option.name || option.description || `Produto #${option.id}`}
              </Typography>
              {option.description && option.name && (
                <Typography variant="caption" color="text.secondary">
                  {option.description}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                {option.price && (
                  <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
                    R$ {parseFloat(option.price).toFixed(2)}
                  </Typography>
                )}
                {option.model && (
                  <Typography variant="caption" color="text.secondary">
                    Modelo: {option.model}
                  </Typography>
                )}
                {option.brand && (
                  <Typography variant="caption" color="text.secondary">
                    Marca: {option.brand}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Produto"
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
      noOptionsText={inputValue.length < 2 ? 'Digite pelo menos 2 caracteres' : 'Nenhum produto encontrado'}
    />
  )
}

export default ProductAutocomplete

