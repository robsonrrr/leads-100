/**
 * WhatsApp v2.0 - MessageBubble Component
 * Bolha de mensagem individual
 */

import React, { memo } from 'react'
import {
    Box,
    Paper,
    Typography,
    Avatar,
    Chip,
    Tooltip,
} from '@mui/material'
import {
    Check as CheckIcon,
    DoneAll as DoneAllIcon,
    Schedule as ScheduleIcon,
    SmartToy as SmartToyIcon,
    Psychology as PsychologyIcon,
} from '@mui/icons-material'
import { formatTimestamp } from '../../utils/formatters'
import { BUBBLE_COLORS, INTENT_COLORS } from '../../utils/constants'
import AudioPlayer from './AudioPlayer'
import MediaViewer from './MediaViewer'

/**
 * Bolha de mensagem do WhatsApp (memoizada)
 */
const MessageBubble = memo(({
    message,
    showAIBadge = true,
    onClick = null,
}) => {
    const isIncoming = message.direction === 'incoming'
    const isAI = message.ai_response || message.is_bot_message

    // Determinar estilo da bolha
    const getBubbleStyle = () => {
        const base = isIncoming ? BUBBLE_COLORS.incoming : BUBBLE_COLORS.outgoing
        if (isAI) {
            return { ...base, ...BUBBLE_COLORS.ai }
        }
        return base
    }

    const style = getBubbleStyle()

    // Determinar tipo de conteúdo
    const mediaType = message.media_type || message.message_type
    const hasMedia = mediaType && ['image', 'video', 'audio', 'document'].includes(mediaType)
    const hasAudio = mediaType === 'audio' || message.is_voice_note || message.has_transcription
    const mediaUrl = message.media_url || message.s3_url || message.url
    const mediaDuration = message.media_duration || message.duration

    // Status icon
    const getStatusIcon = () => {
        if (isIncoming) return null

        switch (message.status) {
            case 'read':
                return <DoneAllIcon sx={{ fontSize: 14, color: '#53bdeb' }} />
            case 'delivered':
                return <DoneAllIcon sx={{ fontSize: 14, color: '#8696a0' }} />
            case 'sent':
                return <CheckIcon sx={{ fontSize: 14, color: '#8696a0' }} />
            default:
                return <ScheduleIcon sx={{ fontSize: 12, color: '#8696a0' }} />
        }
    }

    return (
        <Box
            onClick={() => onClick?.(message)}
            sx={{
                display: 'flex',
                justifyContent: isIncoming ? 'flex-start' : 'flex-end',
                mb: 0.5,
                mx: 1,
                cursor: onClick ? 'pointer' : 'default',
            }}
        >
            {/* AI Avatar */}
            {isAI && isIncoming && showAIBadge && (
                <Tooltip title="Resposta da IA">
                    <Avatar
                        sx={{
                            width: 24,
                            height: 24,
                            mr: 0.5,
                            bgcolor: BUBBLE_COLORS.ai.icon,
                            alignSelf: 'flex-end',
                            mb: 0.5,
                        }}
                    >
                        <SmartToyIcon sx={{ fontSize: 14 }} />
                    </Avatar>
                </Tooltip>
            )}

            {/* Bubble */}
            <Paper
                elevation={0}
                sx={{
                    maxWidth: '70%',
                    minWidth: 80,
                    p: 1,
                    px: 1.5,
                    bgcolor: style.bg,
                    border: `1px solid ${style.border}`,
                    boxShadow: style.shadow,
                    borderRadius: 2,
                    borderTopLeftRadius: isIncoming ? 4 : 16,
                    borderTopRightRadius: isIncoming ? 16 : 4,
                    position: 'relative',
                }}
            >
                {/* Media content */}
                {hasMedia && mediaUrl && (
                    <Box sx={{ mb: message.message_text ? 1 : 0 }}>
                        {hasAudio ? (
                            <AudioPlayer
                                src={mediaUrl}
                                transcription={message.transcription_text}
                                duration={mediaDuration}
                            />
                        ) : (
                            <MediaViewer
                                type={mediaType}
                                url={mediaUrl}
                                thumbnail={message.thumbnail_url}
                                caption={message.caption}
                            />
                        )}
                    </Box>
                )}

                {/* Text content */}
                {message.message_text && (
                    <Typography
                        variant="body2"
                        sx={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            color: '#303030',
                        }}
                    >
                        {message.message_text}
                    </Typography>
                )}

                {/* Transcription (if no audio player) */}
                {!mediaUrl && message.transcription_text && (
                    <Box
                        sx={{
                            mt: 0.5,
                            p: 0.5,
                            bgcolor: 'rgba(0,0,0,0.05)',
                            borderRadius: 1,
                        }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            📝 {message.transcription_text}
                        </Typography>
                    </Box>
                )}

                {/* Footer: timestamp + status + intent */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 0.5,
                        mt: 0.5,
                    }}
                >
                    {/* Intent badge */}
                    {message.intent && (
                        <Chip
                            size="small"
                            label={message.intent.replace(/_/g, ' ')}
                            sx={{
                                height: 16,
                                fontSize: '0.65rem',
                                bgcolor: `${INTENT_COLORS[message.intent] || '#9E9E9E'}20`,
                                color: INTENT_COLORS[message.intent] || '#9E9E9E',
                                borderColor: INTENT_COLORS[message.intent] || '#9E9E9E',
                            }}
                            variant="outlined"
                        />
                    )}

                    {/* Timestamp */}
                    <Typography
                        variant="caption"
                        sx={{ color: '#667781', fontSize: '0.7rem' }}
                    >
                        {formatTimestamp(message.received_at)}
                    </Typography>

                    {/* Status indicator */}
                    {getStatusIcon()}

                    {/* AI indicator for outgoing */}
                    {isAI && !isIncoming && showAIBadge && (
                        <Tooltip title="Resposta da IA">
                            <PsychologyIcon
                                sx={{ fontSize: 14, color: BUBBLE_COLORS.ai.icon }}
                            />
                        </Tooltip>
                    )}
                </Box>
            </Paper>
        </Box>
    )
})

MessageBubble.displayName = 'MessageBubble'

export default MessageBubble
