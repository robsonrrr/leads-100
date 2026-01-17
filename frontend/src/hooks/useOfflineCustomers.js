/**
 * Hook para dados de clientes offline
 * 
 * Prioriza cache SQLite local, fallback para API
 */

import { useState, useEffect, useCallback } from 'react'
import { sqliteService } from '../services/sqliteService'
import { customersService } from '../services/api'

export function useOfflineCustomers({
    search = '',
    sellerId = null,
    page = 1,
    limit = 50,
    enabled = true
} = {}) {
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isOffline, setIsOffline] = useState(!navigator.onLine)
    const [source, setSource] = useState('api')
    const [totalCount, setTotalCount] = useState(0)

    useEffect(() => {
        const handleOnline = () => setIsOffline(false)
        const handleOffline = () => setIsOffline(true)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    const fetchCustomers = useCallback(async () => {
        if (!enabled) return

        setLoading(true)
        setError(null)

        try {
            if (isOffline) {
                // Do cache
                const offset = (page - 1) * limit
                const cached = await sqliteService.searchCustomers({
                    search,
                    sellerId,
                    limit,
                    offset
                })

                setCustomers(cached)
                setTotalCount(cached.length) // Aproximado
                setSource('cache')
                console.log(`📦 Offline: ${cached.length} clientes do cache`)
            } else {
                // Da API
                const params = { page, limit }
                if (search) params.search = search

                const response = await customersService.search(params)

                if (response.data.success) {
                    const custs = response.data.data || []
                    setCustomers(custs)
                    setTotalCount(response.data.pagination?.total || custs.length)
                    setSource('api')

                    // Salvar no cache em background
                    if (custs.length > 0) {
                        sqliteService.saveCustomers(custs).catch(console.error)
                    }
                }
            }
        } catch (err) {
            console.error('Erro ao buscar clientes:', err)

            // Fallback para cache
            try {
                const offset = (page - 1) * limit
                const cached = await sqliteService.searchCustomers({
                    search,
                    sellerId,
                    limit,
                    offset
                })

                if (cached.length > 0) {
                    setCustomers(cached)
                    setSource('cache')
                } else {
                    setError('Sem conexão e cache vazio')
                }
            } catch (cacheErr) {
                setError(err.message || 'Erro ao buscar clientes')
            }
        } finally {
            setLoading(false)
        }
    }, [search, sellerId, page, limit, isOffline, enabled])

    useEffect(() => {
        fetchCustomers()
    }, [fetchCustomers])

    const refresh = useCallback(() => {
        fetchCustomers()
    }, [fetchCustomers])

    return {
        customers,
        loading,
        error,
        isOffline,
        source,
        totalCount,
        refresh
    }
}

export default useOfflineCustomers
