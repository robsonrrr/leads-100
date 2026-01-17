import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  leads: [],
  currentLead: null,
  loading: false,
  error: null,
}

const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setLeads: (state, action) => {
      state.leads = action.payload
    },
    setCurrentLead: (state, action) => {
      state.currentLead = action.payload
    },
    addLead: (state, action) => {
      state.leads.unshift(action.payload)
    },
    updateLead: (state, action) => {
      const index = state.leads.findIndex(lead => lead.id === action.payload.id)
      if (index !== -1) {
        state.leads[index] = action.payload
      }
    },
    removeLead: (state, action) => {
      state.leads = state.leads.filter(lead => lead.id !== action.payload)
    },
    setError: (state, action) => {
      state.error = action.payload
    },
  },
})

export const { 
  setLoading, 
  setLeads, 
  setCurrentLead, 
  addLead, 
  updateLead, 
  removeLead, 
  setError 
} = leadsSlice.actions

export default leadsSlice.reducer

