import { createSlice } from '@reduxjs/toolkit'

// Carregar estado inicial do localStorage
const loadInitialState = () => {
  const token = localStorage.getItem('token')
  const refreshToken = localStorage.getItem('refreshToken')
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null

  return {
    user,
    token,
    refreshToken,
    isAuthenticated: !!token,
    loading: false,
    error: null,
  }
}

const initialState = loadInitialState()

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true
      state.error = null
    },
    loginSuccess: (state, action) => {
      state.loading = false
      state.isAuthenticated = true
      state.user = action.payload.user
      state.token = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      // Salvar no localStorage
      localStorage.setItem('token', action.payload.accessToken)
      localStorage.setItem('refreshToken', action.payload.refreshToken)
      localStorage.setItem('user', JSON.stringify(action.payload.user))
    },
    loginFailure: (state, action) => {
      state.loading = false
      state.isAuthenticated = false
      state.error = action.payload
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    },
    updateToken: (state, action) => {
      state.token = action.payload
      localStorage.setItem('token', action.payload)
    },
  },
})

export const { loginStart, loginSuccess, loginFailure, logout, updateToken } = authSlice.actions
export default authSlice.reducer

