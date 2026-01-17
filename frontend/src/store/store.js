import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import leadsReducer from './slices/leadsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    leads: leadsReducer,
  },
})

