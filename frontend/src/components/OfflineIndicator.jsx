import { useState, useEffect } from 'react';
import { Box, Chip, Tooltip, IconButton, Badge } from '@mui/material';
import {
    CloudOff as OfflineIcon,
    WifiOff as NoWifiIcon,
    Sync as SyncIcon,
    CloudDone as OnlineIcon
} from '@mui/icons-material';
import { offlineSyncService } from '../services/offlineSync.service';

import { metricsService } from '../services/metricsService';

const OfflineIndicator = () => {
    const [status, setStatus] = useState(offlineSyncService.getQueueStatus());

    useEffect(() => {
        const handleStatusChange = () => {
            setStatus(offlineSyncService.getQueueStatus());
        };

        const handleOffline = () => {
            handleStatusChange();
            metricsService.logOfflineSession();
        }

        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleOffline);

        // Polling para checar fila (opcional, pode ser disparado por eventos no service)
        const interval = setInterval(handleStatusChange, 5000);

        return () => {
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    const { isOnline, pendingCount } = status;

    if (isOnline && pendingCount === 0) return null;

    return (
        <Box sx={{ position: 'fixed', bottom: 20, left: 20, zIndex: 2000 }}>
            {pendingCount > 0 ? (
                <Tooltip title={`${pendingCount} itens pendentes de sincronização`}>
                    <Chip
                        icon={isOnline ? <SyncIcon className="spin" /> : <OfflineIcon />}
                        label={`${pendingCount} Pendente(s)`}
                        color={isOnline ? "primary" : "warning"}
                        sx={{
                            boxShadow: 3,
                            '& .spin': {
                                animation: isOnline ? 'spin 2s linear infinite' : 'none',
                            },
                            '@keyframes spin': {
                                '0%': { transform: 'rotate(0deg)' },
                                '100%': { transform: 'rotate(360deg)' }
                            }
                        }}
                    />
                </Tooltip>
            ) : !isOnline ? (
                <Tooltip title="Você está desconectado. Algumas funcionalidades podem estar limitadas.">
                    <Chip
                        icon={<NoWifiIcon />}
                        label="Offline"
                        color="error"
                        sx={{ boxShadow: 3 }}
                    />
                </Tooltip>
            ) : null}
        </Box>
    );
};

export default OfflineIndicator;
