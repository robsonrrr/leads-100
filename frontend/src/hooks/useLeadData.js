import { useState, useEffect, useCallback } from 'react'
import { leadsService } from '../services/api'

/**
 * Hook customizado para carregar dados de um lead
 * Centraliza lógica de carregamento, loading state e error handling
 * 
 * @param {number|string} leadId - ID do lead
 * @returns {Object} Estado e funções do lead
 */
export function useLeadData(leadId) {
  const [lead, setLead] = useState(null)
  const [totals, setTotals] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadLead = useCallback(async () => {
    const id = parseInt(leadId)
    if (isNaN(id) || id <= 0) {
      setError('ID de lead inválido')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const [leadRes, totalsRes, itemsRes] = await Promise.all([
        leadsService.getById(id),
        leadsService.calculateTotals(id),
        leadsService.getItems(id)
      ])

      if (leadRes.data.success) {
        setLead(leadRes.data.data)
      } else {
        setError('Lead não encontrado')
      }

      if (totalsRes.data.success) {
        setTotals(totalsRes.data.data)
      }

      if (itemsRes.data.success) {
        setItems(itemsRes.data.data || [])
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar lead')
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => {
    loadLead()
  }, [loadLead])

  const refreshTotals = useCallback(async () => {
    const id = parseInt(leadId)
    if (isNaN(id) || id <= 0) return

    try {
      const totalsRes = await leadsService.calculateTotals(id)
      if (totalsRes.data.success) {
        setTotals(totalsRes.data.data)
      }
    } catch (err) {
      console.error('Erro ao atualizar totais:', err)
    }
  }, [leadId])

  const refreshItems = useCallback(async () => {
    const id = parseInt(leadId)
    if (isNaN(id) || id <= 0) return

    try {
      const itemsRes = await leadsService.getItems(id)
      if (itemsRes.data.success) {
        setItems(itemsRes.data.data || [])
      }
      await refreshTotals()
    } catch (err) {
      console.error('Erro ao atualizar itens:', err)
    }
  }, [leadId, refreshTotals])

  const updateLead = useCallback(async (data) => {
    const id = parseInt(leadId)
    if (isNaN(id) || id <= 0) return false

    try {
      const response = await leadsService.update(id, data)
      if (response.data.success) {
        setLead(prev => ({ ...prev, ...response.data.data }))
        setError('')
        return true
      } else {
        setError(response.data.error?.message || 'Erro ao atualizar lead')
        return false
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao atualizar lead')
      return false
    }
  }, [leadId])

  const clearError = useCallback(() => {
    setError('')
  }, [])

  return {
    // State
    lead,
    totals,
    items,
    loading,
    error,
    // Actions
    reload: loadLead,
    refreshTotals,
    refreshItems,
    updateLead,
    setLead,
    setItems,
    setError,
    clearError
  }
}

export default useLeadData
