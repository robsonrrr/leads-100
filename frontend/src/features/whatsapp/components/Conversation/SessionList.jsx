/**
 * WhatsApp v2.0 - SessionList Component
 * Lista de sessões/conversas do contato
 */

import React, { memo } from 'react'
import {
    Box,
    Paper,
    Typography,
    Chip,
} from '@mui/material'
import { Image as ImageIcon } from '@mui/icons-material'
import { formatTimestamp } from '../../utils/formatters'

/**
 * Item de sessão (memoizado)
 */
const SessionItem = memo(({ session, selected, onClick }) => {
    const lastMessageDate = new Date(session.last_message_at)
    const isToday = new Date().toDateString() === lastMessageDate.toDateString()

    return (
        <Paper
            elevation={selected ? 3 : 1}
            onClick={() => onClick(session)}
            sx={{
                p: 1.5,
                mb: 1,
                cursor: 'pointer',
                borderLeft: selected ? '4px solid #25D366' : 'none',
                transition: 'all 0.2s',
                '&:hover': {
                    bgcolor: 'rgba(37, 211, 102, 0.05)',
                },
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="subtitle2" fontWeight="bold" noWrap>
                    Sessão {session.session_id?.slice(-8)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {isToday
                        ? lastMessageDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        : lastMessageDate.toLocaleDateString('pt-BR')
                    }
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip
                    size="small"
                    label={`${session.messages_count || 0} msgs`}
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                />
                {session.media_count > 0 && (
                    <Chip
                        size="small"
                        icon={<ImageIcon sx={{ fontSize: 12 }} />}
                        label={session.media_count}
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                )}
            </Box>
        </Paper>
    )
})

SessionItem.displayName = 'SessionItem'

/**
 * Lista de sessões
 */
function SessionList({
    sessions = [],
    selectedSession = null,
    onSessionSelect,
    maxHeight = 200,
}) {
    if (sessions.length === 0) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                    Nenhuma sessão encontrada
                </Typography>
            </Box>
        )
    }

    return (
        <Box
            sx={{
                maxHeight,
                overflowY: 'auto',
                p: 1,
                bgcolor: '#f9f9f9',
            }}
        >
            <Typography variant="caption" color="text.secondary" sx={{ px: 0.5, mb: 1, display: 'block' }}>
                Conversas ({sessions.length})
            </Typography>

            {sessions.map((session) => (
                <SessionItem
                    key={session.session_id}
                    session={session}
                    selected={selectedSession?.session_id === session.session_id}
                    onClick={onSessionSelect}
                />
            ))}
        </Box>
    )
}

export default SessionList
