import { useState, useEffect } from 'react'
import { Autocomplete, TextField, CircularProgress, Box, Typography, Chip } from '@mui/material'
import { Inventory as StockIcon } from '@mui/icons-material'
import { productsService } from '../services/api'
import { formatCurrency } from '../utils'

/**
 * ProductAutocomplete - Busca de produtos com preview visual
 * Inclui: thumbnail, preço, estoque e marca
 */
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
        limit: 15,
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

  // Helper para determinar status de estoque
  const getStockStatus = (stock) => {
    if (!stock && stock !== 0) return null
    const stockNum = parseInt(stock)
    if (stockNum <= 0) return { label: 'Sem estoque', color: 'error', value: 0 }
    if (stockNum < 5) return { label: `${stockNum} un.`, color: 'warning', value: stockNum }
    return { label: `${stockNum} un.`, color: 'success', value: stockNum }
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
        const stockStatus = getStockStatus(option.stock || option.estoque)
        const imageUrl = option.id
          ? `https://img.rolemak.com.br/id/h80/${option.id}.jpg?version=9.02`
          : null

        return (
          <Box
            component="li"
            key={key}
            {...optionProps}
            sx={{
              '&.MuiAutocomplete-option': {
                py: 1,
                px: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': { borderBottom: 'none' }
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              {/* Thumbnail do produto */}
              {imageUrl && (
                <Box
                  component="img"
                  src={imageUrl}
                  alt={option.model || 'Produto'}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                  sx={{
                    width: 48,
                    height: 48,
                    objectFit: 'contain',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    flexShrink: 0
                  }}
                />
              )}

              {/* Informações do produto */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {/* Linha 1: Modelo e Marca */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 'bold',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {option.model || option.codigo || `#${option.id}`}
                  </Typography>
                  {option.brand && (
                    <Typography variant="caption" color="text.secondary">
                      {option.brand}
                    </Typography>
                  )}
                </Box>

                {/* Linha 2: Descrição */}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 250
                  }}
                >
                  {option.name || option.description || option.descricao}
                </Typography>

                {/* Linha 3: Preço e Estoque */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  {/* Preço */}
                  {(option.price || option.preco_venda) && (
                    <Typography
                      variant="body2"
                      color="primary.main"
                      sx={{ fontWeight: 'bold' }}
                    >
                      {formatCurrency(option.price || option.preco_venda)}
                    </Typography>
                  )}

                  {/* Estoque */}
                  {stockStatus && (
                    <Chip
                      icon={<StockIcon sx={{ fontSize: 14 }} />}
                      label={stockStatus.label}
                      color={stockStatus.color}
                      size="small"
                      sx={{
                        height: 20,
                        '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem' },
                        '& .MuiChip-icon': { ml: 0.5 }
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Buscar Produto (código, modelo ou descrição)"
          placeholder="Digite pelo menos 2 caracteres..."
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
      ListboxProps={{
        sx: {
          maxHeight: 350,
          '& .MuiAutocomplete-option': {
            minHeight: 64
          }
        }
      }}
    />
  )
}

export default ProductAutocomplete


