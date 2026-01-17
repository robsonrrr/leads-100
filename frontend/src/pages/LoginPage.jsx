import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert
} from '@mui/material'
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice'
import { authService } from '../services/api'

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const [show2FA, setShow2FA] = useState(false)
  const [error, setError] = useState('')
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    dispatch(loginStart())

    try {
      const response = await authService.login(username, password, show2FA ? twoFactorToken : null)

      if (response.data.requires2FA) {
        setShow2FA(true)
        dispatch(loginFailure('2FA Required'))
        return
      }

      if (response.data.success) {
        dispatch(loginSuccess(response.data.data))
        if (response.data.data.user.needs2FASetup) {
          // Poderíamos redirecionar direto para /security ou apenas deixar um alerta
          console.warn('Admin needs to setup 2FA');
        }
        navigate('/')
      } else {
        throw new Error(response.data.error?.message || 'Erro ao fazer login')
      }
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Erro ao fazer login'
      setError(message)
      dispatch(loginFailure(message))
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Leads Modern
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Sistema de Gestão de Leads
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {!show2FA ? (
              <>
                <TextField
                  fullWidth
                  label="Usuário"
                  variant="outlined"
                  margin="normal"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                />
                <TextField
                  fullWidth
                  label="Senha"
                  type="password"
                  variant="outlined"
                  margin="normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </>
            ) : (
              <TextField
                fullWidth
                label="Código 2FA"
                variant="outlined"
                margin="normal"
                value={twoFactorToken}
                onChange={(e) => setTwoFactorToken(e.target.value)}
                required
                autoFocus
                placeholder="Ex: 123456"
              />
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              {show2FA ? 'Confirmar Token' : 'Entrar'}
            </Button>

            {show2FA && (
              <Button
                fullWidth
                variant="text"
                onClick={() => setShow2FA(false)}
              >
                Voltar para Login
              </Button>
            )}
          </form>
        </Paper>
      </Box>
    </Container>
  )
}

export default LoginPage
