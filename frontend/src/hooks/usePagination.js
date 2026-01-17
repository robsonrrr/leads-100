import { useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PAGINATION } from '../utils/constants'

/**
 * Hook customizado para gerenciar paginação
 * Suporta persistência em URL e localStorage
 * 
 * @param {Object} options - Opções de configuração
 * @param {string} options.storageKey - Chave para localStorage
 * @param {boolean} options.syncWithUrl - Sincronizar com URL params
 * @param {number} options.defaultPage - Página inicial (1-based)
 * @param {number} options.defaultLimit - Limite inicial
 * @returns {Object} Estado e funções de paginação
 */
export function usePagination(options = {}) {
  const {
    storageKey = 'pagination',
    syncWithUrl = true,
    defaultPage = PAGINATION.DEFAULT_PAGE,
    defaultLimit = PAGINATION.DEFAULT_LIMIT
  } = options

  const [searchParams, setSearchParams] = useSearchParams()

  // Recuperar valores iniciais
  const getInitialPage = () => {
    if (syncWithUrl) {
      const pageParam = searchParams.get('page')
      if (pageParam) return parseInt(pageParam, 10)
    }
    const stored = localStorage.getItem(`${storageKey}-page`)
    return stored ? parseInt(stored, 10) : defaultPage
  }

  const getInitialLimit = () => {
    if (syncWithUrl) {
      const limitParam = searchParams.get('limit')
      if (limitParam) return parseInt(limitParam, 10)
    }
    const stored = localStorage.getItem(`${storageKey}-limit`)
    return stored ? parseInt(stored, 10) : defaultLimit
  }

  const [page, setPageState] = useState(getInitialPage())
  const [limit, setLimitState] = useState(getInitialLimit())
  const [total, setTotal] = useState(0)

  // Calcular offset e total de páginas
  const offset = useMemo(() => (page - 1) * limit, [page, limit])
  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit])
  const hasNextPage = useMemo(() => page < totalPages, [page, totalPages])
  const hasPrevPage = useMemo(() => page > 1, [page])

  // Persistir valores
  const persist = useCallback((newPage, newLimit) => {
    localStorage.setItem(`${storageKey}-page`, String(newPage))
    localStorage.setItem(`${storageKey}-limit`, String(newLimit))

    if (syncWithUrl) {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev)
        newParams.set('page', String(newPage))
        newParams.set('limit', String(newLimit))
        return newParams
      })
    }
  }, [storageKey, syncWithUrl, setSearchParams])

  // Funções de controle
  const setPage = useCallback((newPage) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages || 1))
    setPageState(validPage)
    persist(validPage, limit)
  }, [limit, totalPages, persist])

  const setLimit = useCallback((newLimit) => {
    const validLimit = Math.max(1, Math.min(newLimit, 100))
    setLimitState(validLimit)
    setPageState(1) // Reset para página 1 ao mudar limite
    persist(1, validLimit)
  }, [persist])

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage(page + 1)
    }
  }, [hasNextPage, page, setPage])

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setPage(page - 1)
    }
  }, [hasPrevPage, page, setPage])

  const firstPage = useCallback(() => {
    setPage(1)
  }, [setPage])

  const lastPage = useCallback(() => {
    setPage(totalPages)
  }, [totalPages, setPage])

  const reset = useCallback(() => {
    setPageState(defaultPage)
    setLimitState(defaultLimit)
    persist(defaultPage, defaultLimit)
  }, [defaultPage, defaultLimit, persist])

  // Handler para MUI TablePagination (0-based)
  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage + 1) // MUI é 0-based, nosso hook é 1-based
  }, [setPage])

  const handleChangeRowsPerPage = useCallback((event) => {
    setLimit(parseInt(event.target.value, 10))
  }, [setLimit])

  return {
    // Estado (1-based page)
    page,
    limit,
    total,
    offset,
    totalPages,
    hasNextPage,
    hasPrevPage,
    
    // Setters
    setPage,
    setLimit,
    setTotal,
    
    // Navigation
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    reset,
    
    // MUI TablePagination handlers (page é 0-based para o MUI)
    muiPage: page - 1,
    handleChangePage,
    handleChangeRowsPerPage,
    rowsPerPageOptions: PAGINATION.OPTIONS
  }
}

export default usePagination
