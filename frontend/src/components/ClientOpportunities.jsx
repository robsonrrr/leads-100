import React, { useState, useEffect } from 'react';
import {
    Paper, Typography, Box, List, ListItem, ListItemText,
    Chip, IconButton, Tooltip, Skeleton
} from '@mui/material';
import { AddShoppingCart, TrendingUp } from '@mui/icons-material';
import { customersService } from '../services/api';
import { formatCurrency } from '../utils';

/**
 * Componente que exibe oportunidades de venda (produtos que o segmento compra e o cliente não).
 * Baseado no endpoint /customers/:id/opportunities
 */
const ClientOpportunities = ({ customerId, onAddProduct }) => {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!customerId) return;

        const fetchOpportunities = async () => {
            setLoading(true);
            try {
                const response = await customersService.getOpportunities(customerId);
                if (response.data.success) {
                    setOpportunities(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch opportunities:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOpportunities();
    }, [customerId]);

    if (!customerId) return null;

    if (loading) {
        return <Skeleton variant="rectangular" height={100} sx={{ mt: 2, borderRadius: 2 }} />;
    }

    if (opportunities.length === 0) return null;

    return (
        <Paper
            elevation={2}
            sx={{
                mt: 2,
                p: 2,
                background: 'linear-gradient(to right, #fff, #fbe9e7)',
                borderLeft: '4px solid #ff5722'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <TrendingUp color="error" sx={{ mr: 1 }} />
                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                    Oportunidades de Venda
                </Typography>
                <Chip
                    label="Alta Demanda"
                    size="small"
                    color="error"
                    variant="outlined"
                    sx={{ ml: 'auto', height: 20, fontSize: '0.7rem' }}
                />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Produtos em alta no segmento que este cliente ainda não comprou:
            </Typography>

            <List dense disablePadding>
                {opportunities.map((product) => (
                    <ListItem
                        key={product.id}
                        disableGutters
                        secondaryAction={
                            onAddProduct && (
                                <Tooltip title="Adicionar ao carrinho">
                                    <IconButton
                                        edge="end"
                                        aria-label="add"
                                        size="small"
                                        color="primary"
                                        onClick={() => onAddProduct({
                                            id: product.id,
                                            model: product.model,
                                            name: product.name,
                                            brand: product.brand,
                                            price: product.price
                                        })}
                                    >
                                        <AddShoppingCart fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )
                        }
                        sx={{
                            py: 0.5,
                            borderBottom: '1px dashed rgba(0,0,0,0.1)',
                            '&:last-child': { borderBottom: 'none' }
                        }}
                    >
                        <ListItemText
                            primary={
                                <Typography variant="body2" fontWeight="500">
                                    {product.model} - {product.name}
                                </Typography>
                            }
                            secondary={
                                <Box component="span" sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Typography variant="caption" component="span" fontWeight="bold" color="success.main">
                                        {formatCurrency(product.price)}
                                    </Typography>
                                    <Typography variant="caption" component="span" color="text.secondary">
                                        • {product.brand}
                                    </Typography>
                                </Box>
                            }
                        />
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
};

export default ClientOpportunities;
