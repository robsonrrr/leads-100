import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Box, Typography } from '@mui/material'

/**
 * Componente de logo dinâmico baseado na marca do usuário
 * Suporta: mak-prime, zoje, e outras marcas
 * Tenta carregar a imagem SVG, se falhar mostra texto da marca como fallback
 */
function MakPrimeLogo({ height = 24, marca, sx = {} }) {
  const { user } = useSelector((state) => state.auth)
  const [imageError, setImageError] = useState(false)

  // Determinar a marca: prop > user.segmento > padrão mak-prime
  // Normalizar: converter para lowercase e substituir espaços por hífens
  const getMarca = () => {
    let result = 'mak-prime'

    if (marca) {
      result = marca.toLowerCase().replace(/\s+/g, '-')
    } else if (user?.segmento) {
      const seg = String(user.segmento || '').toLowerCase().trim()
      // Mapear segmentos conhecidos para nomes de marca (verificação mais específica)
      if (seg === 'zoje' || seg.startsWith('zoje') || seg.endsWith('zoje') || seg.includes('zoje')) {
        result = 'zoje'
      } else if (seg === 'mak-prime' || seg === 'makprime' || seg.includes('mak') || seg.includes('prime')) {
        result = 'mak-prime'
      } else if (seg && seg !== 'geral') {
        result = seg.replace(/\s+/g, '-')
      }
    } else if (user?.empresa) {
      const emp = String(user.empresa || '').toLowerCase().trim()
      if (emp === 'zoje' || emp.startsWith('zoje') || emp.endsWith('zoje') || emp.includes('zoje')) {
        result = 'zoje'
      } else if (emp === 'mak-prime' || emp === 'makprime' || emp.includes('mak') || emp.includes('prime')) {
        result = 'mak-prime'
      }
    }

    return result === 'geral' ? 'mak-prime' : result
  }

  const marcaNormalizada = getMarca()
  const logoUrl = `https://cdn.rolemak.com.br/svg/marca/${marcaNormalizada}.svg?version=7.73`
  const marcaDisplay = marcaNormalizada.replace(/-/g, ' ')

  // Debug em desenvolvimento
  if (import.meta.env.DEV) {
    console.log('MakPrimeLogo - Marca detectada:', marcaNormalizada, 'URL:', logoUrl)
    console.log('MakPrimeLogo - User segmento:', user?.segmento, 'User empresa:', user?.empresa, 'Prop marca:', marca)
  }

  if (imageError) {
    // Fallback: mostrar texto se a imagem não carregar
    return (
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          color: 'text.primary',
          textTransform: 'capitalize',
          ...sx
        }}
      >
        {marcaDisplay}
      </Typography>
    )
  }

  return (
    <Box
      component="img"
      src={logoUrl}
      alt={marcaDisplay.toUpperCase()}
      onError={(e) => {
        console.error('❌ Erro ao carregar logo:', logoUrl)
        console.error('Marca normalizada:', marcaNormalizada)
        console.error('User segmento:', user?.segmento, 'User empresa:', user?.empresa)
        setImageError(true)
      }}
      onLoad={() => {
        if (import.meta.env.DEV) {
          console.log('✅ Logo carregado com sucesso:', logoUrl)
        }
        setImageError(false) // Resetar erro se carregar com sucesso
      }}
      sx={{
        height: height,
        width: 'auto',
        objectFit: 'contain',
        display: 'block',
        ...sx
      }}
    />
  )
}

export default MakPrimeLogo
