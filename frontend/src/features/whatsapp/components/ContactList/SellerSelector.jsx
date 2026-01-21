/**
 * WhatsApp v2.0 - Seller Selector
 * 
 * Componente para selecionar vendedor na home do WhatsApp
 * Mostra botões com os vendedores cadastrados em seller_phones
 * 
 * @version 1.0
 * @date 2026-01-20
 */

import React, { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Button,
    Chip,
    Avatar,
    Skeleton,
    Alert,
    Paper,
    Badge,
    Tooltip,
} from '@mui/material'
import {
    Person as PersonIcon,
    Phone as PhoneIcon,
    WhatsApp as WhatsAppIcon,
    Business as BusinessIcon,
} from '@mui/icons-material'
import api from '../../../../services/api'

/**
 * Componente de seleção de vendedor
 */
export function SellerSelector({ onSellerSelect, selectedSeller }) {
    const [sellers, setSellers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Carregar vendedores
    useEffect(() => {
        loadSellers()
    }, [])

    const loadSellers = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await api.get('/superbot/seller-phones')
            const sellerPhones = response.data?.data || []

            // Agrupar por usuário (vendedor pode ter múltiplos telefones)
            const sellersMap = new Map()
            sellerPhones.forEach(sp => {
                const key = sp.user_id
                if (!sellersMap.has(key)) {
                    sellersMap.set(key, {
                        user_id: sp.user_id,
                        user_name: sp.user_name || sp.seller_name || `Vendedor ${sp.user_id}`,
                        phones: [],
                        is_active: sp.is_active,
                    })
                }
                sellersMap.get(key).phones.push({
                    phone_number: sp.phone_number,
                    phone_name: sp.phone_name,
                    is_primary: sp.is_primary,
                })
            })

            setSellers(Array.from(sellersMap.values()))
        } catch (err) {
            console.error('Erro ao carregar vendedores:', err)
            setError('Não foi possível carregar os vendedores')
        } finally {
            setLoading(false)
        }
    }

    const handleSellerClick = (seller) => {
        onSellerSelect?.(seller)
    }

    // Loading state
    if (loading) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                    Carregando vendedores...
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} variant="rounded" width={140} height={48} />
                    ))}
                </Box>
            </Box>
        )
    }

    // Error state
    if (error) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="error" sx={{ mb: 1 }}>
                    {error}
                </Alert>
                <Button size="small" onClick={loadSellers}>
                    Tentar novamente
                </Button>
            </Box>
        )
    }

    // Empty state
    if (sellers.length === 0) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <BusinessIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">
                    Nenhum vendedor cadastrado
                </Typography>
                <Typography variant="caption" color="text.disabled">
                    Configure telefones de vendedores no Admin
                </Typography>
            </Box>
        )
    }

    return (
        <Box sx={{ p: 2 }}>
            {/* Header */}
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WhatsAppIcon sx={{ color: '#25D366' }} />
                <Typography variant="subtitle1" fontWeight="bold">
                    Selecione um Vendedor
                </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Clique em um vendedor para ver seus contatos do WhatsApp
            </Typography>

            {/* Seller Buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {sellers.map((seller) => {
                    const isSelected = selectedSeller?.user_id === seller.user_id
                    const primaryPhone = seller.phones.find(p => p.is_primary) || seller.phones[0]

                    return (
                        <Paper
                            key={seller.user_id}
                            elevation={isSelected ? 3 : 1}
                            onClick={() => handleSellerClick(seller)}
                            sx={{
                                p: 2,
                                cursor: 'pointer',
                                border: isSelected ? '2px solid #25D366' : '1px solid transparent',
                                bgcolor: isSelected ? 'rgba(37, 211, 102, 0.05)' : 'background.paper',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    bgcolor: isSelected ? 'rgba(37, 211, 102, 0.1)' : 'action.hover',
                                    transform: 'translateY(-1px)',
                                    boxShadow: 3,
                                },
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Badge
                                    overlap="circular"
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    badgeContent={
                                        <WhatsAppIcon
                                            sx={{
                                                width: 16,
                                                height: 16,
                                                color: '#fff',
                                                bgcolor: '#25D366',
                                                borderRadius: '50%',
                                                p: 0.3,
                                            }}
                                        />
                                    }
                                >
                                    <Avatar
                                        sx={{
                                            bgcolor: isSelected ? '#25D366' : 'primary.main',
                                            width: 44,
                                            height: 44,
                                        }}
                                    >
                                        <PersonIcon />
                                    </Avatar>
                                </Badge>

                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" fontWeight="bold">
                                        {seller.user_name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                        <Typography variant="caption" color="text.secondary">
                                            {primaryPhone?.phone_number}
                                        </Typography>
                                    </Box>
                                </Box>

                                {seller.phones.length > 1 && (
                                    <Tooltip title={`${seller.phones.length} telefones cadastrados`}>
                                        <Chip
                                            size="small"
                                            label={`+${seller.phones.length - 1}`}
                                            sx={{ fontSize: '0.7rem' }}
                                        />
                                    </Tooltip>
                                )}
                            </Box>
                        </Paper>
                    )
                })}
            </Box>
        </Box>
    )
}

export default SellerSelector
