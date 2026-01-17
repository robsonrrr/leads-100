import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import ActivePromotions from '../components/ActivePromotions'
import { customersService } from '../services/api'

function PromotionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useSelector((state) => state.auth)
  const isManager = (user?.level || 0) > 4

  // Estados para gerentes
  const [sellerSegments, setSellerSegments] = useState([])
  const [selectedSegment, setSelectedSegment] = useState(searchParams.get('segmento') || '')

  // Carregar segmentos de vendedores
  useEffect(() => {
    if (isManager) {
      customersService.getSellerSegments()
        .then(response => {
          if (response.data.success) {
            setSellerSegments(response.data.data || [])
          }
        })
        .catch(err => console.error('Erro ao carregar segmentos:', err))
    }
  }, [isManager])

  // Sincronizar estado com URL quando navegar de volta
  useEffect(() => {
    const urlSegmento = searchParams.get('segmento') || ''
    if (urlSegmento !== selectedSegment) setSelectedSegment(urlSegmento)
  }, [searchParams])

  // Atualizar URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedSegment) params.set('segmento', selectedSegment)
    setSearchParams(params, { replace: true })
  }, [selectedSegment, setSearchParams])

  // Determinar o segmento a filtrar
  const getSegmentFilter = () => {
    if (selectedSegment) {
      return selectedSegment
    }
    if (!isManager && user?.segmento) {
      return user.segmento
    }
    return null
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Promoções</Typography>
        
        {isManager && sellerSegments.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Segmento</InputLabel>
            <Select
              value={selectedSegment}
              label="Segmento"
              onChange={(e) => setSelectedSegment(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {sellerSegments.map(seg => (
                <MenuItem key={seg} value={seg}>{seg}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      <ActivePromotions selectedSegment={getSegmentFilter()} />
    </Box>
  )
}

export default PromotionsPage
