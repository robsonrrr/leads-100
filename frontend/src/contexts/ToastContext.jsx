import { createContext, useContext, useState, useCallback } from 'react'
import { Snackbar, Alert, Slide } from '@mui/material'

const ToastContext = createContext(null)

// Tipos de toast disponíveis
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

function SlideTransition(props) {
  return <Slide {...props} direction="up" />
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({
    open: false,
    message: '',
    type: TOAST_TYPES.INFO,
    duration: 4000
  })

  const showToast = useCallback((message, type = TOAST_TYPES.INFO, duration = 4000) => {
    setToast({
      open: true,
      message,
      type,
      duration
    })
  }, [])

  const hideToast = useCallback((event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    setToast(prev => ({ ...prev, open: false }))
  }, [])

  // Métodos de conveniência
  const success = useCallback((message, duration) => {
    showToast(message, TOAST_TYPES.SUCCESS, duration)
  }, [showToast])

  const error = useCallback((message, duration) => {
    showToast(message, TOAST_TYPES.ERROR, duration || 6000) // Erros ficam mais tempo
  }, [showToast])

  const warning = useCallback((message, duration) => {
    showToast(message, TOAST_TYPES.WARNING, duration)
  }, [showToast])

  const info = useCallback((message, duration) => {
    showToast(message, TOAST_TYPES.INFO, duration)
  }, [showToast])

  const value = {
    showToast,
    success,
    error,
    warning,
    info
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={toast.duration}
        onClose={hideToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={SlideTransition}
      >
        <Alert
          onClose={hideToast}
          severity={toast.type}
          variant="filled"
          elevation={6}
          sx={{ 
            width: '100%',
            minWidth: 300,
            '& .MuiAlert-message': {
              fontSize: '0.95rem'
            }
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider')
  }
  return context
}

export default ToastContext
