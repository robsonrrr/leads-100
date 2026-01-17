import { Box, Typography, Button } from '@mui/material'
import {
  Inbox as InboxIcon,
  Search as SearchIcon,
  ShoppingCart as CartIcon,
  Description as DocumentIcon,
  Error as ErrorIcon
} from '@mui/icons-material'

// Ícones disponíveis para empty states
const ICONS = {
  inbox: InboxIcon,
  search: SearchIcon,
  cart: CartIcon,
  document: DocumentIcon,
  error: ErrorIcon
}

/**
 * Componente de Empty State reutilizável
 * 
 * @param {string} icon - Nome do ícone (inbox, search, cart, document, error)
 * @param {string} title - Título principal
 * @param {string} description - Descrição secundária
 * @param {string} actionLabel - Texto do botão de ação (opcional)
 * @param {function} onAction - Callback do botão de ação (opcional)
 * @param {string} size - Tamanho do componente (small, medium, large)
 */
function EmptyState({
  icon = 'inbox',
  title = 'Nenhum item encontrado',
  description,
  actionLabel,
  onAction,
  size = 'medium'
}) {
  const IconComponent = ICONS[icon] || InboxIcon

  const sizes = {
    small: {
      iconSize: 48,
      titleVariant: 'body1',
      descVariant: 'body2',
      padding: 2
    },
    medium: {
      iconSize: 80,
      titleVariant: 'h6',
      descVariant: 'body2',
      padding: 4
    },
    large: {
      iconSize: 120,
      titleVariant: 'h5',
      descVariant: 'body1',
      padding: 6
    }
  }

  const config = sizes[size] || sizes.medium

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: config.padding,
        px: 2,
        textAlign: 'center'
      }}
    >
      <Box
        sx={{
          width: config.iconSize,
          height: config.iconSize,
          borderRadius: '50%',
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2
        }}
      >
        <IconComponent
          sx={{
            fontSize: config.iconSize * 0.5,
            color: 'text.secondary'
          }}
        />
      </Box>

      <Typography
        variant={config.titleVariant}
        color="text.primary"
        fontWeight={500}
        gutterBottom
      >
        {title}
      </Typography>

      {description && (
        <Typography
          variant={config.descVariant}
          color="text.secondary"
          sx={{ maxWidth: 400, mb: actionLabel ? 3 : 0 }}
        >
          {description}
        </Typography>
      )}

      {actionLabel && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          size={size === 'small' ? 'small' : 'medium'}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  )
}

export default EmptyState
