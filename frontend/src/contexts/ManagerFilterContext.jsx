import { createContext, useContext, useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { customersService } from '../services/api'

const ManagerFilterContext = createContext(null)

export function ManagerFilterProvider({ children }) {
    const { user } = useSelector((state) => state.auth)
    const isManager = (user?.level || 0) > 4

    // Estados dos filtros
    const [sellerSegments, setSellerSegments] = useState([])
    const [selectedSellerSegment, setSelectedSellerSegment] = useState(() => {
        return localStorage.getItem('manager-filter-segment') || ''
    })

    const [sellers, setSellers] = useState([])
    const [loadingSellers, setLoadingSellers] = useState(false)
    const [selectedSeller, setSelectedSeller] = useState(null)
    const [pendingSellerId, setPendingSellerId] = useState(() => {
        return localStorage.getItem('manager-filter-sellerId') || null
    })

    // Carregar segmentos de vendedores (apenas para gerentes)
    useEffect(() => {
        if (isManager) {
            customersService.getSellerSegments()
                .then(response => {
                    if (response.data.success) {
                        setSellerSegments(response.data.data || [])
                    }
                })
                .catch(err => {
                    console.error('Erro ao carregar segmentos de vendedores:', err)
                })
        }
    }, [isManager])

    // Carregar vendedores (apenas para gerentes)
    useEffect(() => {
        if (isManager) {
            setLoadingSellers(true)
            const params = selectedSellerSegment ? { segmento: selectedSellerSegment } : {}
            customersService.getSellers(params)
                .then(response => {
                    if (response.data.success) {
                        const sellersList = response.data.data || []
                        setSellers(sellersList)

                        // Restaurar vendedor do localStorage se existir
                        if (pendingSellerId && !selectedSeller) {
                            const seller = sellersList.find(s => s.id === parseInt(pendingSellerId))
                            if (seller) {
                                setSelectedSeller(seller)
                            }
                            setPendingSellerId(null)
                        }
                        // Limpar vendedor selecionado se não estiver mais na lista
                        else if (selectedSeller && !sellersList.find(s => s.id === selectedSeller.id)) {
                            setSelectedSeller(null)
                        }
                    }
                })
                .catch(err => {
                    console.error('Erro ao carregar vendedores:', err)
                })
                .finally(() => {
                    setLoadingSellers(false)
                })
        }
    }, [isManager, selectedSellerSegment])

    // Persistir no localStorage quando mudar
    useEffect(() => {
        if (selectedSellerSegment) {
            localStorage.setItem('manager-filter-segment', selectedSellerSegment)
        } else {
            localStorage.removeItem('manager-filter-segment')
        }
    }, [selectedSellerSegment])

    useEffect(() => {
        if (selectedSeller) {
            localStorage.setItem('manager-filter-sellerId', selectedSeller.id.toString())
        } else {
            localStorage.removeItem('manager-filter-sellerId')
        }
    }, [selectedSeller])

    // Funções para alterar filtros
    const setSegment = (segment) => {
        setSelectedSellerSegment(segment)
        setSelectedSeller(null) // Limpar vendedor ao mudar segmento
    }

    const setSeller = (seller) => {
        setSelectedSeller(seller)
    }

    const clearFilters = () => {
        setSelectedSellerSegment('')
        setSelectedSeller(null)
    }

    const value = {
        isManager,
        // Segmentos
        sellerSegments,
        selectedSellerSegment,
        setSegment,
        // Vendedores
        sellers,
        loadingSellers,
        selectedSeller,
        setSeller,
        // Utilitários
        clearFilters,
        // Para consultas à API - retorna os parâmetros corretos
        getFilterParams: () => {
            const params = {}
            if (selectedSeller) {
                params.filterSellerId = selectedSeller.id
            } else if (selectedSellerSegment) {
                params.sellerSegmento = selectedSellerSegment
            }
            return params
        }
    }

    return (
        <ManagerFilterContext.Provider value={value}>
            {children}
        </ManagerFilterContext.Provider>
    )
}

export function useManagerFilter() {
    const context = useContext(ManagerFilterContext)
    if (!context) {
        throw new Error('useManagerFilter deve ser usado dentro de ManagerFilterProvider')
    }
    return context
}

export default ManagerFilterContext
