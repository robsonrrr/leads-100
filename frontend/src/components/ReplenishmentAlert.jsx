import { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Button,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    AddShoppingCart as CartIcon,
    Loop as RefreshIcon,
    Warning as WarningIcon,
    TrendingDown as TrendIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { formatCurrency } from '../utils';

// Nota: Idealmente mover para api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function ReplenishmentAlert({ customerId = null }) {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    const loadSuggestions = async () => {
        setLoading(true);
        try {
            // Usar a rota V2
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/v2/analytics/replenishment`, {
                params: { customerId },
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setSuggestions(response.data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar sugestões:', error);
            // Silencioso se falhar, widget auxiliar
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSuggestions();
    }, [customerId]);

    if (loading) return <Box p={2} textAlign="center"><CircularProgress size={20} /></Box>;

    if (suggestions.length === 0) return null; // Não mostrar se vazio

    return (
        <Paper sx={{ p: 2, bgcolor: '#fff4e5', border: '1px solid #ffcc80' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                    <WarningIcon color="warning" />
                    <Typography variant="h6" color="warning.dark">
                        Oportunidades de Reposição
                    </Typography>
                </Box>
                <IconButton size="small" onClick={loadSuggestions}>
                    <RefreshIcon fontSize="small" />
                </IconButton>
            </Box>

            <Typography variant="body2" color="text.secondary" paragraph>
                Produtos recorrentes que podem estar acabando no cliente.
            </Typography>

            <List dense>
                {suggestions.slice(0, 5).map((item) => (
                    <ListItem
                        key={item.productId}
                        divider
                        sx={{ px: 0 }}
                    >
                        <ListItemText
                            primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="subtitle2">{item.productName}</Typography>
                                    {item.urgency === 'CRITICA' && (
                                        <Chip label="Crítico" size="small" color="error" sx={{ height: 20, fontSize: '0.6rem' }} />
                                    )}
                                </Box>
                            }
                            secondary={
                                <span style={{ fontSize: '0.75rem' }}>
                                    Última compra: {new Date(item.lastPurchaseDate).toLocaleDateString()} |
                                    Consumo Médio: <strong>{item.avgMonthlyConsumption}/mês</strong>
                                </span>
                            }
                        />
                        <ListItemSecondaryAction>
                            <IconButton
                                edge="end"
                                color="primary"
                                onClick={() => toast.info(`Adicionado ${item.productName} ao carrinho (Simulação)`)}
                            >
                                <CartIcon />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>

            {suggestions.length > 5 && (
                <Box textAlign="center" mt={1}>
                    <Button size="small">Ver mais {suggestions.length - 5} sugestões</Button>
                </Box>
            )}
        </Paper>
    );
}
