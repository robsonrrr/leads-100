import { useState, useEffect, useMemo } from 'react'
import { Autocomplete, TextField, CircularProgress, Box, Typography, Chip } from '@mui/material'
import { Inventory as StockIcon, LocalOffer as PromoIcon, Lock as FixedPriceIcon } from '@mui/icons-material'
import { productsService, promotionsService } from '../services/api'
import { formatCurrency } from '../utils'

/**
 * ProductAutocomplete - Busca de produtos com preview visual
 * Inclui: thumbnail, preço, estoque, marca e badge de promoção
 * @param {Array} customerFixedPrices - Lista de preços fixos do cliente (opcional)
 */
function ProductAutocomplete({ value, onChange, error, helperText, customerFixedPrices = [] }) {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [promotions, setPromotions] = useState([]) // Lista de promoções ativas
  const [recentSearches, setRecentSearches] = useState([]) // Cache de buscas recentes
  const [favorites, setFavorites] = useState([]) // Favoritos do vendedor

  // Carregar buscas recentes do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('product_recent_searches')
      if (saved) {
        setRecentSearches(JSON.parse(saved))
      }
    } catch (e) {
      console.debug('Erro ao carregar buscas recentes:', e)
    }
  }, [])

  // Carregar promoções ativas uma vez
  useEffect(() => {
    loadPromotions()
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    try {
      const response = await productsService.getFavorites()
      if (response.data.success && response.data.data) {
        setFavorites(response.data.data.map(p => ({ ...p, isFavorite: true })))
      }
    } catch (err) {
      console.debug('Erro ao carregar favoritos:', err)
    }
  }

  const loadPromotions = async () => {
    try {
      const response = await promotionsService.getActive()
      if (response.data.success && response.data.data?.promotions) {
        setPromotions(response.data.data.promotions)
      }
    } catch (err) {
      console.debug('Erro ao carregar promoções:', err)
    }
  }

  // Criar mapa de promoções para lookup rápido
  const promotionMap = useMemo(() => {
    const map = new Map()
    if (Array.isArray(promotions)) {
      promotions.forEach(promo => {
        map.set(promo.sku, {
          promoPrice: promo.preco_promo,
          promoDiscount: promo.desconto
        })
      })
    }
    return map
  }, [promotions])

  // Criar mapa de preços fixos do cliente
  const fixedPriceMap = useMemo(() => {
    const map = new Map()
    if (Array.isArray(customerFixedPrices)) {
      customerFixedPrices.forEach(fp => {
        map.set(fp.sku_id, {
          fixedPrice: parseFloat(fp.fixed_price),
          discountFromPt: fp.discount_from_pt ? parseFloat(fp.discount_from_pt) : null
        })
      })
    }
    return map
  }, [customerFixedPrices])

  useEffect(() => {
    if (inputValue.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchProducts(inputValue)
      }, 300)

      return () => clearTimeout(timeoutId)
    } else if (inputValue.length === 0) {
      // Mostrar favoritos e recentes quando campo vazio
      const combined = [
        ...favorites.slice(0, 5).map(p => ({ ...p, isFavorite: true })),
        ...recentSearches.slice(0, 5).map(p => ({ ...p, isRecent: true }))
      ]
      // Remover duplicatas (favoritos têm prioridade)
      const seen = new Set()
      const unique = combined.filter(p => {
        if (seen.has(p.id)) return false
        seen.add(p.id)
        return true
      })
      setOptions(unique)
    } else {
      setOptions([])
    }
  }, [inputValue, recentSearches, favorites])

  // Função para salvar produto nas buscas recentes
  const saveToRecentSearches = (product) => {
    if (!product?.id) return

    const updated = [
      product,
      ...recentSearches.filter(p => p.id !== product.id)
    ].slice(0, 10) // Manter apenas os 10 últimos

    setRecentSearches(updated)
    try {
      localStorage.setItem('product_recent_searches', JSON.stringify(updated))
    } catch (e) {
      console.debug('Erro ao salvar buscas recentes:', e)
    }
  }

  const searchProducts = async (searchTerm) => {
    try {
      setLoading(true)
      const response = await productsService.search({
        search: searchTerm,
        limit: 15,
        simple: '1'
      })

      if (response.data.success) {
        // Enriquecer com dados de promoção e preço fixo
        const enrichedData = response.data.data.map(product => {
          let enriched = { ...product }

          // Verificar preço fixo do cliente (prioridade máxima)
          const fixedPrice = fixedPriceMap.get(product.id)
          if (fixedPrice) {
            enriched = {
              ...enriched,
              hasFixedPrice: true,
              fixedPrice: fixedPrice.fixedPrice,
              fixedPriceDiscount: fixedPrice.discountFromPt,
              originalPrice: product.price, // Guardar preço original
              price: fixedPrice.fixedPrice // Substituir preço pelo fixo
            }
          }

          // Verificar promoção
          const promo = promotionMap.get(product.id)
          if (promo) {
            enriched = {
              ...enriched,
              onPromotion: true,
              promoPrice: promo.promoPrice,
              promoDiscount: promo.promoDiscount
            }
          }

          return enriched
        })
        setOptions(enrichedData)
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

  // Helper para destacar o termo buscado no texto
  const highlightMatch = (text, query) => {
    if (!text || !query || query.length < 2) return text

    const textStr = String(text)
    const queryStr = String(query).toLowerCase()
    const lowerText = textStr.toLowerCase()
    const index = lowerText.indexOf(queryStr)

    if (index === -1) return text

    const before = textStr.slice(0, index)
    const match = textStr.slice(index, index + queryStr.length)
    const after = textStr.slice(index + queryStr.length)

    return (
      <>
        {before}
        <Box
          component="span"
          sx={{
            bgcolor: 'warning.light',
            color: 'warning.contrastText',
            borderRadius: 0.5,
            px: 0.25
          }}
        >
          {match}
        </Box>
        {after}
      </>
    )
  }

  return (
    <Autocomplete
      options={options}
      value={value}
      onChange={(event, newValue) => {
        if (newValue) {
          saveToRecentSearches(newValue)
        }
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
                    component="span"
                    sx={{
                      fontWeight: 'bold',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {highlightMatch(option.model || option.codigo || `#${option.id}`, inputValue)}
                  </Typography>
                  {option.brand && (
                    <Typography variant="caption" color="text.secondary" component="span">
                      {highlightMatch(option.brand, inputValue)}
                    </Typography>
                  )}
                  {option.isFavorite && (
                    <Chip
                      label="⭐ Favorito"
                      size="small"
                      color="warning"
                      sx={{
                        height: 16,
                        '& .MuiChip-label': { px: 0.5, fontSize: '0.65rem' }
                      }}
                    />
                  )}
                  {option.isRecent && !option.isFavorite && (
                    <Chip
                      label="Recente"
                      size="small"
                      color="default"
                      sx={{
                        height: 16,
                        '& .MuiChip-label': { px: 0.5, fontSize: '0.65rem' }
                      }}
                    />
                  )}
                </Box>

                {/* Linha 2: Descrição */}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  component="span"
                  sx={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 250
                  }}
                >
                  {highlightMatch(option.name || option.description || option.descricao, inputValue)}
                </Typography>

                {/* Linha 3: Preço e Estoque */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                  {/* Badge Preço Fixo do Cliente */}
                  {option.hasFixedPrice && (
                    <Chip
                      icon={<FixedPriceIcon sx={{ fontSize: 14 }} />}
                      label={option.fixedPriceDiscount ? `Seu: -${Math.round(option.fixedPriceDiscount)}%` : 'Seu Preço'}
                      color="warning"
                      size="small"
                      sx={{
                        height: 20,
                        '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem', fontWeight: 'bold' },
                        '& .MuiChip-icon': { ml: 0.5 }
                      }}
                    />
                  )}

                  {/* Badge Promoção */}
                  {option.onPromotion && (
                    <Chip
                      icon={<PromoIcon sx={{ fontSize: 14 }} />}
                      label={option.promoDiscount ? `-${Math.round(option.promoDiscount)}%` : 'Promo'}
                      color="error"
                      size="small"
                      sx={{
                        height: 20,
                        '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem', fontWeight: 'bold' },
                        '& .MuiChip-icon': { ml: 0.5 },
                        animation: 'pulse 2s infinite'
                      }}
                    />
                  )}

                  {/* Preço */}
                  {(option.price || option.preco_venda) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {option.hasFixedPrice ? (
                        // Preço fixo do cliente
                        <>
                          <Typography
                            variant="caption"
                            sx={{
                              textDecoration: 'line-through',
                              color: 'text.disabled',
                              fontSize: '0.7rem'
                            }}
                          >
                            {formatCurrency(option.originalPrice || option.preco_venda)}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="warning.main"
                            sx={{ fontWeight: 'bold' }}
                          >
                            {formatCurrency(option.fixedPrice)}
                          </Typography>
                        </>
                      ) : option.onPromotion && option.promoPrice ? (
                        // Preço promocional
                        <>
                          <Typography
                            variant="caption"
                            sx={{
                              textDecoration: 'line-through',
                              color: 'text.disabled',
                              fontSize: '0.7rem'
                            }}
                          >
                            {formatCurrency(option.price || option.preco_venda)}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="error.main"
                            sx={{ fontWeight: 'bold' }}
                          >
                            {formatCurrency(option.promoPrice)}
                          </Typography>
                        </>
                      ) : (
                        // Preço normal
                        <Typography
                          variant="body2"
                          color="primary.main"
                          sx={{ fontWeight: 'bold' }}
                        >
                          {formatCurrency(option.price || option.preco_venda)}
                        </Typography>
                      )}
                    </Box>
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


