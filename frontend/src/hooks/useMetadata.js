import { useState, useEffect, useCallback } from 'react'
import { leadsService } from '../services/api'

/**
 * Hook customizado para carregar metadados compartilhados
 * (transportadoras, unidades, NOPs, etc.)
 * 
 * Usa cache para evitar múltiplas requisições
 */

// Cache global para metadados (não muda frequentemente)
const cache = {
  transporters: null,
  units: null,
  nops: null,
  segments: null,
  lastFetch: {}
}

// Tempo de cache em ms (5 minutos)
const CACHE_TTL = 5 * 60 * 1000

function isCacheValid(key) {
  const lastFetch = cache.lastFetch[key]
  if (!lastFetch) return false
  return Date.now() - lastFetch < CACHE_TTL
}

/**
 * Hook para carregar metadados com cache
 * @param {Object} options - Opções de carregamento
 * @param {boolean} options.transporters - Carregar transportadoras
 * @param {boolean} options.units - Carregar unidades
 * @param {boolean} options.nops - Carregar NOPs
 * @param {boolean} options.segments - Carregar segmentos
 * @returns {Object} Dados e estado de carregamento
 */
export function useMetadata(options = {}) {
  const {
    transporters: loadTransporters = true,
    units: loadUnits = true,
    nops: loadNops = false,
    segments: loadSegments = false
  } = options

  const [transporters, setTransporters] = useState(cache.transporters || [])
  const [units, setUnits] = useState(cache.units || [])
  const [nops, setNops] = useState(cache.nops || [])
  const [segments, setSegments] = useState(cache.segments || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    const promises = []
    const toLoad = []

    // Verificar o que precisa ser carregado
    if (loadTransporters && !isCacheValid('transporters')) {
      promises.push(leadsService.getTransporters())
      toLoad.push('transporters')
    }

    if (loadUnits && !isCacheValid('units')) {
      promises.push(leadsService.getUnits())
      toLoad.push('units')
    }

    if (loadNops && !isCacheValid('nops')) {
      promises.push(leadsService.getNops())
      toLoad.push('nops')
    }

    if (loadSegments && !isCacheValid('segments')) {
      promises.push(leadsService.getSegments())
      toLoad.push('segments')
    }

    // Se tudo está em cache, não fazer requisição
    if (promises.length === 0) {
      return
    }

    try {
      setLoading(true)
      const results = await Promise.all(promises)

      results.forEach((res, index) => {
        const key = toLoad[index]
        if (res.data.success) {
          const data = res.data.data || []
          cache[key] = data
          cache.lastFetch[key] = Date.now()

          switch (key) {
            case 'transporters':
              setTransporters(data)
              break
            case 'units':
              setUnits(data)
              break
            case 'nops':
              setNops(data)
              break
            case 'segments':
              setSegments(data)
              break
          }
        }
      })
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar metadados')
    } finally {
      setLoading(false)
    }
  }, [loadTransporters, loadUnits, loadNops, loadSegments])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refresh = useCallback(() => {
    // Limpar cache e recarregar
    cache.transporters = null
    cache.units = null
    cache.nops = null
    cache.segments = null
    cache.lastFetch = {}
    fetchData()
  }, [fetchData])

  /**
   * Busca transportadora por ID
   */
  const getTransporterById = useCallback((id) => {
    return transporters.find(t => t.id === id)
  }, [transporters])

  /**
   * Busca unidade por ID
   */
  const getUnitById = useCallback((id) => {
    return units.find(u => u.id === id)
  }, [units])

  /**
   * Busca NOP por ID
   */
  const getNopById = useCallback((id) => {
    return nops.find(n => n.id === id)
  }, [nops])

  return {
    // Data
    transporters,
    units,
    nops,
    segments,
    // State
    loading,
    error,
    // Helpers
    getTransporterById,
    getUnitById,
    getNopById,
    // Actions
    refresh
  }
}

/**
 * Hook para limpar cache de metadados
 */
export function clearMetadataCache() {
  cache.transporters = null
  cache.units = null
  cache.nops = null
  cache.segments = null
  cache.lastFetch = {}
}

export default useMetadata
