/**
 * LiveIndicator Component
 * 
 * Indicador visual de status da conexão em tempo real
 * Mostra status online/offline e digitando
 * 
 * @version 1.0
 * @date 2026-01-24
 */

import React from 'react';
import { Box, Typography, Chip, Tooltip, CircularProgress } from '@mui/material';
import {
    FiberManualRecord as DotIcon,
    Wifi as WifiIcon,
    WifiOff as WifiOffIcon,
    Edit as TypingIcon
} from '@mui/icons-material';

/**
 * Componente de indicador de conexão live
 */
export function LiveConnectionIndicator({
    isConnected,
    connectionStatus = 'disconnected',
    showLabel = true,
    size = 'small'
}) {
    const getColor = () => {
        switch (connectionStatus) {
            case 'connected': return 'success';
            case 'connecting': return 'warning';
            case 'error': return 'error';
            default: return 'default';
        }
    };

    const getLabel = () => {
        switch (connectionStatus) {
            case 'connected': return 'Ao vivo';
            case 'connecting': return 'Conectando...';
            case 'error': return 'Erro';
            default: return 'Offline';
        }
    };

    const getIcon = () => {
        switch (connectionStatus) {
            case 'connected':
                return <DotIcon sx={{ fontSize: 10, color: '#4caf50', animation: 'pulse 2s infinite' }} />;
            case 'connecting':
                return <CircularProgress size={10} thickness={4} />;
            case 'error':
                return <WifiOffIcon sx={{ fontSize: 12, color: 'error.main' }} />;
            default:
                return <WifiOffIcon sx={{ fontSize: 12, color: 'text.disabled' }} />;
        }
    };

    return (
        <Tooltip title={getLabel()}>
            <Chip
                size={size}
                icon={getIcon()}
                label={showLabel ? getLabel() : undefined}
                color={getColor()}
                variant="outlined"
                sx={{
                    height: size === 'small' ? 20 : 24,
                    fontSize: '0.7rem',
                    '& .MuiChip-icon': {
                        marginLeft: showLabel ? 0.5 : 0
                    },
                    '@keyframes pulse': {
                        '0%': { opacity: 1 },
                        '50%': { opacity: 0.5 },
                        '100%': { opacity: 1 }
                    }
                }}
            />
        </Tooltip>
    );
}

/**
 * Componente de status de presença (online/offline)
 */
export function PresenceIndicator({
    presence = 'unknown',
    lastSeen = null,
    showLabel = true
}) {
    const getColor = () => {
        switch (presence) {
            case 'online': return '#4caf50';
            case 'offline': return '#9e9e9e';
            case 'typing': return '#2196f3';
            default: return '#9e9e9e';
        }
    };

    const getLabel = () => {
        switch (presence) {
            case 'online': return 'Online';
            case 'offline':
                if (lastSeen) {
                    const date = new Date(lastSeen);
                    return `Visto por último ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                }
                return 'Offline';
            case 'typing': return 'Digitando...';
            default: return '';
        }
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <DotIcon
                sx={{
                    fontSize: 10,
                    color: getColor(),
                    animation: presence === 'online' ? 'pulse 2s infinite' : 'none'
                }}
            />
            {showLabel && (
                <Typography
                    variant="caption"
                    sx={{
                        color: presence === 'online' ? 'success.main' : 'text.secondary',
                        fontSize: '0.7rem'
                    }}
                >
                    {getLabel()}
                </Typography>
            )}
        </Box>
    );
}

/**
 * Componente de indicador de digitação
 */
export function TypingIndicator({ isTyping = false, senderName = null }) {
    if (!isTyping) return null;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                backgroundColor: 'action.hover',
                borderRadius: 2,
                maxWidth: 'fit-content'
            }}
        >
            <Box sx={{ display: 'flex', gap: '3px' }}>
                {[1, 2, 3].map((i) => (
                    <Box
                        key={i}
                        sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: 'primary.main',
                            animation: 'bounce 1.4s infinite ease-in-out both',
                            animationDelay: `${(i - 1) * 0.16}s`,
                            '@keyframes bounce': {
                                '0%, 80%, 100%': {
                                    transform: 'scale(0)'
                                },
                                '40%': {
                                    transform: 'scale(1)'
                                }
                            }
                        }}
                    />
                ))}
            </Box>
            <Typography variant="caption" color="text.secondary">
                {senderName ? `${senderName} está digitando...` : 'Digitando...'}
            </Typography>
        </Box>
    );
}

/**
 * Componente de barra de status do chat
 */
export function ChatStatusBar({
    isConnected,
    connectionStatus,
    presence,
    lastSeen,
    isTyping
}) {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 0.5,
                backgroundColor: 'background.default',
                borderBottom: '1px solid',
                borderColor: 'divider',
                minHeight: 28
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PresenceIndicator presence={presence} lastSeen={lastSeen} />
                {isTyping && <TypingIndicator isTyping={isTyping} />}
            </Box>
            <LiveConnectionIndicator
                isConnected={isConnected}
                connectionStatus={connectionStatus}
                showLabel={false}
            />
        </Box>
    );
}

export default {
    LiveConnectionIndicator,
    PresenceIndicator,
    TypingIndicator,
    ChatStatusBar
};
