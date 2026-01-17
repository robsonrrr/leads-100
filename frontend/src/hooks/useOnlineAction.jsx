/**
 * Hook para controlar ações que requerem conexão online
 * 
 * Uso:
 * const { isOnline, disabledProps, OfflineTooltip } = useOnlineAction()
 * <Button {...disabledProps}>Ação que requer internet</Button>
 * <OfflineTooltip><Button disabled={!isOnline}>Enviar</Button></OfflineTooltip>
 */

import { useState, useEffect, useCallback } from 'react'
import { Tooltip, Button, IconButton } from '@mui/material'
import { WifiOff as OfflineIcon } from '@mui/icons-material'

/**
 * Hook para verificar status online e fornecer propriedades para desabilitar ações
 */
export function useOnlineAction() {
    const [isOnline, setIsOnline] = useState(navigator.onLine)

    useEffect(() => {
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    // Props para desabilitar botão quando offline
    const disabledProps = isOnline ? {} : {
        disabled: true,
        sx: {
            opacity: 0.6,
            cursor: 'not-allowed',
            '&.Mui-disabled': {
                pointerEvents: 'auto' // Permitir tooltip mesmo desabilitado
            }
        }
    }

    // Wrapper de tooltip para quando offline
    const OfflineTooltip = useCallback(({ children, title = 'Indisponível offline' }) => {
        if (isOnline) return children

        return (
            <Tooltip title={title} arrow>
                <span>{children}</span>
            </Tooltip>
        )
    }, [isOnline])

    return {
        isOnline,
        isOffline: !isOnline,
        disabledProps,
        OfflineTooltip
    }
}

/**
 * Componente de botão que se desabilita automaticamente quando offline
 */
export function OnlineButton({
    children,
    offlineMessage = 'Requer conexão com internet',
    showOfflineIcon = true,
    ...props
}) {
    const { isOnline } = useOnlineAction()

    if (!isOnline) {
        return (
            <Tooltip title={offlineMessage} arrow>
                <span>
                    <Button
                        {...props}
                        disabled
                        startIcon={showOfflineIcon ? <OfflineIcon /> : props.startIcon}
                        sx={{
                            ...props.sx,
                            opacity: 0.6,
                            '&.Mui-disabled': {
                                pointerEvents: 'auto'
                            }
                        }}
                    >
                        {children}
                    </Button>
                </span>
            </Tooltip>
        )
    }

    return <Button {...props}>{children}</Button>
}

/**
 * Componente de IconButton que se desabilita automaticamente quando offline
 */
export function OnlineIconButton({
    children,
    offlineMessage = 'Requer conexão com internet',
    ...props
}) {
    const { isOnline } = useOnlineAction()

    if (!isOnline) {
        return (
            <Tooltip title={offlineMessage} arrow>
                <span>
                    <IconButton
                        {...props}
                        disabled
                        sx={{
                            ...props.sx,
                            opacity: 0.5,
                            '&.Mui-disabled': {
                                pointerEvents: 'auto'
                            }
                        }}
                    >
                        {children}
                    </IconButton>
                </span>
            </Tooltip>
        )
    }

    return <IconButton {...props}>{children}</IconButton>
}

/**
 * HOC para envolver ações que requerem conexão
 */
export function withOnlineRequired(Component, offlineMessage = 'Esta ação requer internet') {
    return function OnlineRequiredComponent(props) {
        const { isOnline } = useOnlineAction()

        if (!isOnline) {
            return (
                <Tooltip title={offlineMessage} arrow>
                    <span>
                        <Component {...props} disabled />
                    </span>
                </Tooltip>
            )
        }

        return <Component {...props} />
    }
}

export default useOnlineAction
