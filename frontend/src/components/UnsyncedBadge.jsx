/**
 * Badge para indicar que um item não foi sincronizado com a nuvem
 * Usado em leads, rascunhos e itens criados offline
 */

import { Chip, Tooltip } from '@mui/material'
import { CloudOff as CloudOffIcon, CloudQueue as CloudPendingIcon } from '@mui/icons-material'

/**
 * Badge "Não salvo na nuvem"
 * @param {Object} props
 * @param {boolean} props.pending - Se está pendente de sincronização
 * @param {string} props.size - Tamanho do chip ('small', 'medium')
 * @param {string} props.variant - Variante do chip ('filled', 'outlined')
 * @param {boolean} props.showLabel - Se deve mostrar o label ou apenas o ícone
 */
export function UnsyncedBadge({
    pending = true,
    size = 'small',
    variant = 'filled',
    showLabel = true
}) {
    if (!pending) return null

    return (
        <Tooltip title="Não salvo na nuvem - será sincronizado automaticamente quando online">
            <Chip
                icon={<CloudOffIcon sx={{ fontSize: size === 'small' ? 14 : 18 }} />}
                label={showLabel ? 'Não sincronizado' : undefined}
                size={size}
                variant={variant}
                color="warning"
                sx={{
                    fontWeight: 600,
                    fontSize: size === 'small' ? '0.65rem' : '0.75rem',
                    height: size === 'small' ? 20 : 24,
                    '& .MuiChip-label': { px: showLabel ? 1 : 0.5 },
                    '& .MuiChip-icon': { ml: showLabel ? undefined : 0.5, mr: showLabel ? undefined : -0.5 },
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                        '0%': { opacity: 1 },
                        '50%': { opacity: 0.7 },
                        '100%': { opacity: 1 }
                    }
                }}
            />
        </Tooltip>
    )
}

/**
 * Badge "Sincronizando"
 */
export function SyncingBadge({ size = 'small' }) {
    return (
        <Tooltip title="Sincronizando com a nuvem...">
            <Chip
                icon={<CloudPendingIcon sx={{ fontSize: size === 'small' ? 14 : 18 }} />}
                label="Sincronizando..."
                size={size}
                variant="outlined"
                color="info"
                sx={{
                    fontWeight: 600,
                    fontSize: size === 'small' ? '0.65rem' : '0.75rem',
                    height: size === 'small' ? 20 : 24,
                    '& .MuiChip-icon': {
                        animation: 'spin 1s linear infinite',
                    },
                    '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                    }
                }}
            />
        </Tooltip>
    )
}

/**
 * Badge compacto (apenas ícone) para uso em tabelas/listas
 */
export function UnsyncedIcon({ pending = true, syncing = false }) {
    if (!pending && !syncing) return null

    if (syncing) {
        return (
            <Tooltip title="Sincronizando...">
                <CloudPendingIcon
                    color="info"
                    sx={{
                        fontSize: 16,
                        animation: 'spin 1s linear infinite',
                        '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' }
                        }
                    }}
                />
            </Tooltip>
        )
    }

    return (
        <Tooltip title="Não salvo na nuvem">
            <CloudOffIcon
                color="warning"
                sx={{
                    fontSize: 16,
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                        '0%': { opacity: 1 },
                        '50%': { opacity: 0.5 },
                        '100%': { opacity: 1 }
                    }
                }}
            />
        </Tooltip>
    )
}

export default UnsyncedBadge
