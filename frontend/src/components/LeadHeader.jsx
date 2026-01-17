import {
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  IconButton
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  ShoppingCart as ShoppingCartIcon,
  Print as PrintIcon,
  Email as EmailIcon
} from '@mui/icons-material'

/**
 * Componente de cabeçalho do Lead
 * Exibe informações principais e ações
 */
function LeadHeader({
  lead,
  onBack,
  onEdit,
  onPrint,
  onEmail,
  onConvert,
  onDelete
}) {
  const isConverted = !!lead.orderWeb || lead.type === 2

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 2,
        color: 'white'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        {/* Lado esquerdo - Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <IconButton
            onClick={onBack}
            sx={{
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
              Lead #{lead.id}
              {lead.orderWeb && (
                <Typography component="span" variant="h4" sx={{ ml: 1, fontWeight: 700, opacity: 0.95 }}>
                  - Pedido #{lead.orderWeb}
                </Typography>
              )}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip
                label={lead.type === 1 ? 'Lead' : 'Pedido'}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 600
                }}
              />
              {lead.customer?.nome && (
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  • {lead.customer.nome}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Lado direito - Ações */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <ActionButton
            icon={<EditIcon />}
            label="Editar"
            onClick={onEdit}
            disabled={isConverted}
            title={isConverted ? 'Este lead não pode ser editado pois já possui número de pedido' : 'Editar lead'}
          />
          <ActionButton
            icon={<PrintIcon />}
            label="Imprimir"
            onClick={onPrint}
          />
          <ActionButton
            icon={<EmailIcon />}
            label="Enviar"
            onClick={onEmail}
          />
          <ActionButton
            icon={<ShoppingCartIcon />}
            label="Converter"
            onClick={onConvert}
            disabled={isConverted}
            title={isConverted ? 'Este lead já foi convertido' : 'Converter em pedido real'}
            sx={{
              bgcolor: 'success.main',
              '&:hover': { bgcolor: 'success.dark' }
            }}
          />
          <ActionButton
            icon={<DeleteIcon />}
            label="Excluir"
            onClick={onDelete}
            disabled={isConverted}
            title={isConverted ? 'Este lead não pode ser excluído' : 'Excluir lead'}
            sx={{
              '&:hover': { bgcolor: 'rgba(255, 87, 87, 0.3)' }
            }}
          />
        </Box>
      </Box>
    </Paper>
  )
}

/**
 * Botão de ação estilizado
 */
function ActionButton({ icon, label, onClick, disabled, title, sx = {} }) {
  return (
    <Button
      variant="contained"
      startIcon={icon}
      onClick={onClick}
      disabled={disabled}
      title={title}
      sx={{
        bgcolor: 'rgba(255, 255, 255, 0.2)',
        color: 'white',
        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
        '&.Mui-disabled': {
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          color: 'rgba(255, 255, 255, 0.5)'
        },
        ...sx
      }}
    >
      {label}
    </Button>
  )
}

export default LeadHeader
