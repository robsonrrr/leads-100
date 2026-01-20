/**
 * WhatsApp v2.0 - MediaViewer Component
 * Visualizador de mídia (imagens, vídeos, documentos)
 */

import React, { useState, memo } from 'react'
import {
    Box,
    Skeleton,
    IconButton,
    Dialog,
    DialogContent,
    Typography,
} from '@mui/material'
import {
    AttachFile as AttachFileIcon,
    Close as CloseIcon,
    Download as DownloadIcon,
    Fullscreen as FullscreenIcon,
} from '@mui/icons-material'

/**
 * Visualizador de mídia (memoizado)
 */
const MediaViewer = memo(({
    type,
    url,
    thumbnail = null,
    caption = null,
}) => {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    // Imagem
    if (type === 'image') {
        return (
            <>
                <Box
                    onClick={() => url && setOpen(true)}
                    sx={{
                        position: 'relative',
                        borderRadius: 2,
                        overflow: 'hidden',
                        cursor: url ? 'pointer' : 'default',
                        maxWidth: 250,
                        '&:hover': {
                            '& .overlay': { opacity: 1 },
                        },
                    }}
                >
                    {loading && !error && (
                        <Skeleton
                            variant="rectangular"
                            width={200}
                            height={150}
                            animation="wave"
                        />
                    )}

                    {error ? (
                        <Box
                            sx={{
                                width: 200,
                                height: 100,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: '#f5f5f5',
                                borderRadius: 2,
                            }}
                        >
                            <Typography variant="caption" color="text.secondary">
                                Imagem não disponível
                            </Typography>
                        </Box>
                    ) : (
                        <img
                            src={thumbnail || url}
                            alt={caption || 'Imagem'}
                            onLoad={() => setLoading(false)}
                            onError={() => {
                                setLoading(false)
                                setError(true)
                            }}
                            style={{
                                width: '100%',
                                display: loading ? 'none' : 'block',
                                borderRadius: 8,
                            }}
                        />
                    )}

                    {!error && !loading && url && (
                        <Box
                            className="overlay"
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                bgcolor: 'rgba(0,0,0,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                            }}
                        >
                            <FullscreenIcon sx={{ color: '#fff', fontSize: 32 }} />
                        </Box>
                    )}
                </Box>

                {/* Modal de visualização */}
                <Dialog
                    open={open}
                    onClose={() => setOpen(false)}
                    maxWidth="lg"
                >
                    <DialogContent sx={{ p: 0, position: 'relative' }}>
                        <IconButton
                            onClick={() => setOpen(false)}
                            sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                color: '#fff',
                                bgcolor: 'rgba(0,0,0,0.5)',
                                zIndex: 1,
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                        <img
                            src={url}
                            alt={caption || 'Imagem'}
                            style={{ maxWidth: '90vw', maxHeight: '90vh' }}
                        />
                    </DialogContent>
                </Dialog>
            </>
        )
    }

    // Vídeo
    if (type === 'video') {
        return (
            <Box sx={{ maxWidth: 300 }}>
                <video
                    src={url}
                    controls
                    style={{
                        width: '100%',
                        borderRadius: 8,
                    }}
                    poster={thumbnail}
                    preload="metadata"
                />
                {caption && (
                    <Typography variant="caption" color="text.secondary" mt={0.5}>
                        {caption}
                    </Typography>
                )}
            </Box>
        )
    }

    // Documento
    if (type === 'document') {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    bgcolor: 'rgba(0,0,0,0.05)',
                    borderRadius: 1,
                    minWidth: 180,
                }}
            >
                <AttachFileIcon color="action" />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" noWrap>
                        {caption || 'Documento'}
                    </Typography>
                </Box>
                {url && (
                    <IconButton
                        size="small"
                        href={url}
                        target="_blank"
                        download
                    >
                        <DownloadIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>
        )
    }

    // Tipo desconhecido
    return null
})

MediaViewer.displayName = 'MediaViewer'

export default MediaViewer
