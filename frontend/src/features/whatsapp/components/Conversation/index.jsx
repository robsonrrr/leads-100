/**
 * WhatsApp v2.0 - Conversation Component
 * Container principal da conversa
 */

import React, { useRef, useEffect, useCallback, useState } from 'react'
import { Box, Button, CircularProgress, Snackbar, Alert } from '@mui/material'
import { KeyboardArrowUp as LoadMoreIcon } from '@mui/icons-material'
import ConversationHeader from './ConversationHeader'
import SessionList from './SessionList'
import MessageBubble from './MessageBubble'
import DateSeparator from './DateSeparator'
import { LoadingState, EmptyState, ErrorState } from '../common'
import { useConversations, useMessages } from '../../hooks'
import { CHAT_BACKGROUND } from '../../utils/constants'
import { MessageComposer, MediaUploadDialog } from '../../../../components/WhatsApp'
import { useSendMessage } from '../../../../hooks/useSendMessage'
import { useMediaUpload } from '../../../../hooks/useMediaUpload'

/**
 * Componente principal de conversa
 */
function Conversation({
    contact,
    height = '100%',
    showHeader = true,
    showSessions = true,
    showAIBadges = true,
    onInfoClick,
}) {
    const {
        conversations,
        conversationsLoading,
        selectedSession,
        loadConversations,
        selectSession,
    } = useConversations()

    const {
        messages,
        messagesLoading: loading,
        messagesError: error,
        messagesHasMore: hasMore,
        groupedMessages,
        loadMore,
    } = useMessages()

    // Send message hook
    const { sendMessage, sending: sendingMessage, error: sendError } = useSendMessage({
        onSuccess: (sentMessage) => {
            setSnackbar({ open: true, message: 'Mensagem enviada!', severity: 'success' })
            // Refresh messages after send
            setTimeout(() => handleRefresh(), 500)
        },
        onError: (err) => {
            setSnackbar({ open: true, message: err.message || 'Erro ao enviar', severity: 'error' })
        }
    })

    // Snackbar state for feedback
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

    // Media upload state
    const [mediaDialogOpen, setMediaDialogOpen] = useState(false)
    const { sendMedia, uploading: uploadingMedia, progress: uploadProgress } = useMediaUpload({
        onSuccess: (uploadedMedia) => {
            setMediaDialogOpen(false)
            setSnackbar({ open: true, message: 'Mídia enviada com sucesso!', severity: 'success' })
            setTimeout(() => handleRefresh(), 500)
        },
        onError: (err) => {
            setSnackbar({ open: true, message: err.message || 'Erro ao enviar mídia', severity: 'error' })
        }
    })

    const containerRef = useRef(null)
    const messagesEndRef = useRef(null)
    const isLoadingMoreRef = useRef(false)
    const previousScrollHeightRef = useRef(0)
    useEffect(() => {
        if (messagesEndRef.current && !isLoadingMoreRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
        isLoadingMoreRef.current = false
    }, [messages.length])

    // Maintain scroll position when loading more
    const handleLoadMore = useCallback(() => {
        if (containerRef.current) {
            previousScrollHeightRef.current = containerRef.current.scrollHeight
            isLoadingMoreRef.current = true
        }
        loadMore()
    }, [loadMore])

    useEffect(() => {
        if (isLoadingMoreRef.current && containerRef.current && !loading) {
            const newScrollHeight = containerRef.current.scrollHeight
            containerRef.current.scrollTop = newScrollHeight - previousScrollHeightRef.current
        }
    }, [loading])

    // Refresh handler
    const handleRefresh = useCallback(() => {
        if (contact?.phone) {
            loadConversations(contact.phone)
        }
    }, [contact?.phone, loadConversations])

    // No contact selected
    if (!contact) {
        return (
            <EmptyState
                title="Selecione um contato"
                subtitle="Escolha um contato na lista para ver as conversas"
                icon="chat"
                height={height}
            />
        )
    }

    // Get grouped messages
    const groups = groupedMessages()

    return (
        <Box
            sx={{
                height,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#fff',
            }}
        >
            {/* Header */}
            {showHeader && (
                <ConversationHeader
                    contact={contact}
                    onRefresh={handleRefresh}
                    onInfoClick={onInfoClick}
                    loading={conversationsLoading}
                />
            )}

            {/* Main content area */}
            <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Sessions sidebar */}
                {showSessions && conversations.length > 0 && (
                    <Box
                        sx={{
                            width: 200,
                            borderRight: '1px solid #e0e0e0',
                            overflowY: 'auto',
                        }}
                    >
                        <SessionList
                            sessions={conversations}
                            selectedSession={selectedSession}
                            onSessionSelect={selectSession}
                            maxHeight="100%"
                        />
                    </Box>
                )}

                {/* Messages area */}
                <Box
                    ref={containerRef}
                    sx={{
                        flex: 1,
                        overflowY: 'auto',
                        bgcolor: CHAT_BACKGROUND.bg,
                        backgroundImage: CHAT_BACKGROUND.pattern,
                        py: 1,
                    }}
                >
                    {/* Loading state */}
                    {loading && messages.length === 0 && (
                        <LoadingState
                            message="Carregando mensagens..."
                            height={400}
                        />
                    )}

                    {/* Error state */}
                    {error && messages.length === 0 && (
                        <ErrorState
                            message="Erro ao carregar mensagens"
                            details={error}
                            onRetry={handleRefresh}
                            height={400}
                        />
                    )}

                    {/* Empty state */}
                    {!loading && !error && messages.length === 0 && selectedSession && (
                        <EmptyState
                            title="Nenhuma mensagem"
                            subtitle="Esta conversa ainda não possui mensagens"
                            icon="chat"
                            height={400}
                        />
                    )}

                    {/* No session selected */}
                    {!loading && !error && !selectedSession && conversations.length > 0 && (
                        <EmptyState
                            title="Selecione uma conversa"
                            subtitle="Escolha uma sessão na lista lateral"
                            icon="chat"
                            height={400}
                        />
                    )}

                    {/* Load more button */}
                    {hasMore && messages.length > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                            <Button
                                size="small"
                                startIcon={loading ? <CircularProgress size={14} /> : <LoadMoreIcon />}
                                onClick={handleLoadMore}
                                disabled={loading}
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.9)',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
                                }}
                            >
                                {loading ? 'Carregando...' : 'Mensagens anteriores'}
                            </Button>
                        </Box>
                    )}

                    {/* Messages grouped by date */}
                    {Object.entries(groups).map(([date, dateMessages]) => (
                        <React.Fragment key={date}>
                            <DateSeparator date={date} />
                            {dateMessages.map((message) => (
                                <MessageBubble
                                    key={message.id}
                                    message={message}
                                    showAIBadge={showAIBadges}
                                />
                            ))}
                        </React.Fragment>
                    ))}

                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                </Box>
            </Box>

            {/* Message Composer */}
            {selectedSession && (
                <Box sx={{ p: 1.5, borderTop: '1px solid #e0e0e0', bgcolor: 'background.paper' }}>
                    <MessageComposer
                        phone={contact?.phone}
                        onSend={async (message) => {
                            const result = await sendMessage(contact.phone, message)
                            return result
                        }}
                        onMediaUpload={() => setMediaDialogOpen(true)}
                        disabled={!contact || sendingMessage || uploadingMedia}
                        sending={sendingMessage}
                        placeholder={`Enviar mensagem para ${contact?.name || contact?.phone || 'contato'}...`}
                        showAttachment={true}
                    />
                </Box>
            )}

            {/* Media Upload Dialog */}
            <MediaUploadDialog
                open={mediaDialogOpen}
                onClose={() => setMediaDialogOpen(false)}
                onUpload={async (media) => {
                    await sendMedia(contact.phone, media)
                }}
                phone={contact?.phone}
                uploading={uploadingMedia}
                uploadProgress={uploadProgress}
            />

            {/* Snackbar for feedback */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    )
}

export default Conversation
