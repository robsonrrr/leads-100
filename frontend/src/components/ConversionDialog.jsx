import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material'
import { ShoppingCart as ShoppingCartIcon } from '@mui/icons-material'

/**
 * Dialog de conversão de Lead para Pedido
 * Permite selecionar transportadora e adicionar observações
 */
function ConversionDialog({
  open,
  onClose,
  onConfirm,
  lead,
  transporters = [],
  loading = false,
  error = ''
}) {
  const [formData, setFormData] = useState({
    cTransporter: lead?.cTransporter || '',
    remarks: {
      finance: lead?.remarks?.finance || '',
      logistic: lead?.remarks?.logistic || '',
      nfe: lead?.remarks?.nfe || '',
      obs: lead?.remarks?.obs || '',
      manager: lead?.remarks?.manager || ''
    }
  })

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleRemarkChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      remarks: {
        ...prev.remarks,
        [field]: value
      }
    }))
  }

  const handleSubmit = () => {
    onConfirm(formData)
  }

  const isValid = formData.cTransporter !== ''

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShoppingCartIcon color="primary" />
        Converter Lead em Pedido
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Confirme os dados abaixo antes de converter este lead em um pedido real.
          Esta ação não pode ser desfeita.
        </Typography>

        <Grid container spacing={3}>
          {/* Transportadora */}
          <Grid item xs={12}>
            <FormControl fullWidth required error={!formData.cTransporter}>
              <InputLabel>Transportadora</InputLabel>
              <Select
                value={formData.cTransporter}
                onChange={(e) => handleChange('cTransporter', e.target.value)}
                label="Transportadora"
              >
                {transporters.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Observações Financeiras */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Observações Financeiras"
              multiline
              rows={2}
              value={formData.remarks.finance}
              onChange={(e) => handleRemarkChange('finance', e.target.value)}
              placeholder="Condições especiais de pagamento..."
            />
          </Grid>

          {/* Observações Logística */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Observações Logística"
              multiline
              rows={2}
              value={formData.remarks.logistic}
              onChange={(e) => handleRemarkChange('logistic', e.target.value)}
              placeholder="Instruções de entrega..."
            />
          </Grid>

          {/* Observações NFE */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Observações NF-e"
              multiline
              rows={2}
              value={formData.remarks.nfe}
              onChange={(e) => handleRemarkChange('nfe', e.target.value)}
              placeholder="Observações para nota fiscal..."
            />
          </Grid>

          {/* Observações Gerais */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Observações Gerais"
              multiline
              rows={2}
              value={formData.remarks.obs}
              onChange={(e) => handleRemarkChange('obs', e.target.value)}
              placeholder="Outras observações..."
            />
          </Grid>

          {/* Observações Gerente */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Observações do Gerente"
              multiline
              rows={2}
              value={formData.remarks.manager}
              onChange={(e) => handleRemarkChange('manager', e.target.value)}
              placeholder="Observações internas do gerente..."
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleSubmit}
          disabled={loading || !isValid}
          startIcon={loading ? <CircularProgress size={20} /> : <ShoppingCartIcon />}
        >
          {loading ? 'Convertendo...' : 'Confirmar Conversão'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConversionDialog
