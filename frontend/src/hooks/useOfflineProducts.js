/**
 * Hook para dados de produtos offline
 * 
 * Prioriza cache SQLite local, fallback para API
 */

import { useState, useEffect, useCallback } from 'react'
import { sqliteService } from '../services/sqliteService'
import { productsService } from '../services/api'

export function useOfflineProducts({
    search = '',
    segment = '',
    category = '',
    brand = '',
    page = 1,
    limit = 24,
    enabled = true
} = {}) {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isOffline, setIsOffline] = useState(!navigator.onLine)
    const [source, setSource] = useState('api') // 'cache' | 'api'
    const [totalCount, setTotalCount] = useState(0)

    // Monitorar estado online/offline
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

    // Buscar produtos
    const fetchProducts = useCallback(async () => {
        if (!enabled) return

        setLoading(true)
        setError(null)

        try {
            // Se offline, usar cache
            if (isOffline) {
                const offset = (page - 1) * limit
                const cached = await sqliteService.searchProducts({
                    search,
                    segment,
                    category,
                    brand,
                    limit,
                    offset
                })

                const count = await sqliteService.getProductsCount()

                setProducts(cached)
                setTotalCount(count)
                setSource('cache')
                console.log(`📦 Offline: ${cached.length} produtos do cache`)
            } else {
                // Se online, buscar da API
                const params = { page, limit }
                if (search) params.search = search
                if (segment) params.segment = segment
                if (category) params.category = category

                const response = await productsService.search(params)

                if (response.data.success) {
                    let prods = response.data.data || []

                    // Filtrar produtos sem preço
                    prods = prods.filter(p => {
                        const price = p.price || p.preco_tabela || 0
                        return price > 0
                    })

                    // Filtrar por marca (frontend)
                    if (brand) {
                        prods = prods.filter(p => p.brand === brand)
                    }

                    setProducts(prods)
                    setTotalCount(response.data.pagination?.total || prods.length)
                    setSource('api')

                    // Salvar no cache em background
                    if (prods.length > 0) {
                        sqliteService.saveProducts(prods).catch(console.error)
                    }
                }
            }
        } catch (err) {
            console.error('Erro ao buscar produtos:', err)

            // Fallback para cache se API falhar
            try {
                const offset = (page - 1) * limit
                const cached = await sqliteService.searchProducts({
                    search,
                    segment,
                    category,
                    brand,
                    limit,
                    offset
                })

                if (cached.length > 0) {
                    setProducts(cached)
                    setSource('cache')
                    console.log(`📦 Fallback: ${cached.length} produtos do cache`)
                } else {
                    setError('Sem conexão e cache vazio')
                }
            } catch (cacheErr) {
                setError(err.message || 'Erro ao buscar produtos')
            }
        } finally {
            setLoading(false)
        }
    }, [search, segment, category, brand, page, limit, isOffline, enabled])

    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

    // Forçar refresh
    const refresh = useCallback(() => {
        fetchProducts()
    }, [fetchProducts])

    return {
        products,
        loading,
        error,
        isOffline,
        source,
        totalCount,
        refresh
    }
}

/**
 * Hook para metadados de produtos (segmentos, categorias, marcas)
 */
export function useOfflineProductMetadata() {
    const [segments, setSegments] = useState([])
    const [categories, setCategories] = useState([])
    const [brands, setBrands] = useState([])
    const [loading, setLoading] = useState(true)
    const [isOffline, setIsOffline] = useState(!navigator.onLine)

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

    useEffect(() => {
        const loadMetadata = async () => {
            setLoading(true)

            try {
                if (isOffline) {
                    // Do cache
                    const [segs, cats, brds] = await Promise.all([
                        sqliteService.getSegments(),
                        sqliteService.getCategories(),
                        sqliteService.getBrands()
                    ])
                    setSegments(segs)
                    setCategories(cats)
                    setBrands(brds)
                } else {
                    // Da API
                    const [segRes, catRes] = await Promise.all([
                        productsService.getSegments(),
                        productsService.getCategories()
                    ])

                    if (segRes.data.success) {
                        const segs = segRes.data.data || []
                        setSegments([...new Set(segs.map(s => s.segmento || s.name))].filter(Boolean))
                    }
                    if (catRes.data.success) {
                        const cats = catRes.data.data || []
                        setCategories([...new Set(cats.map(c => c.categoria || c.name))].filter(Boolean))
                    }
                }
            } catch (err) {
                console.error('Erro ao carregar metadados:', err)
                // Tentar cache como fallback
                try {
                    const [segs, cats, brds] = await Promise.all([
                        sqliteService.getSegments(),
                        sqliteService.getCategories(),
                        sqliteService.getBrands()
                    ])
                    setSegments(segs)
                    setCategories(cats)
                    setBrands(brds)
                } catch (e) {
                    console.error('Erro no fallback cache:', e)
                }
            } finally {
                setLoading(false)
            }
        }

        loadMetadata()
    }, [isOffline])

    return { segments, categories, brands, loading, isOffline }
}

export default useOfflineProducts
