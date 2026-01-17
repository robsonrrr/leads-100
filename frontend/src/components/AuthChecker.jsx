import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { authService } from '../services/api'
import { loginSuccess, logout } from '../store/slices/authSlice'

function AuthChecker({ children }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isAuthenticated, token } = useSelector((state) => state.auth)

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token')
      
      // Se não há token no localStorage, fazer logout
      if (!storedToken) {
        if (isAuthenticated) {
          dispatch(logout())
        }
        return
      }

      // Se há token mas não está autenticado no Redux, restaurar estado
      if (storedToken && !isAuthenticated) {
        const userStr = localStorage.getItem('user')
        const refreshToken = localStorage.getItem('refreshToken')
        
        if (userStr && refreshToken) {
          try {
            // Verificar se o token ainda é válido
            const response = await authService.getMe()
            if (response.data.success) {
              dispatch(loginSuccess({
                user: JSON.parse(userStr),
                accessToken: storedToken,
                refreshToken: refreshToken
              }))
            } else {
              // Token inválido, fazer logout
              dispatch(logout())
              // Não navegar imediatamente, deixar o ProtectedRoute fazer isso
            }
          } catch (error) {
            // Token inválido ou expirado, fazer logout
            // Não navegar imediatamente, deixar o ProtectedRoute fazer isso
            dispatch(logout())
          }
        }
      }
    }

    checkAuth()
  }, [isAuthenticated, dispatch, navigate])

  // Sempre renderizar children, mesmo se a verificação ainda estiver em andamento
  return children
}

export default AuthChecker

