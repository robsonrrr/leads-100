/**
 * WhatsApp v2.0 - AudioPlayer Component
 * Player de áudio com transcrição
 */

import React, { useState, useRef, memo } from 'react'
import {
    Box,
    IconButton,
    Typography,
    Collapse,
} from '@mui/material'
import {
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    VolumeUp as VolumeIcon,
} from '@mui/icons-material'
import { formatDuration } from '../../utils/formatters'

/**
 * Player de áudio estilo WhatsApp (memoizado)
 */
const AudioPlayer = memo(({
    src,
    transcription = null,
    duration = 0,
}) => {
    const audioRef = useRef(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [showTranscription, setShowTranscription] = useState(false)

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause()
            } else {
                audioRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const percent = (audioRef.current.currentTime / audioRef.current.duration) * 100
            setProgress(isNaN(percent) ? 0 : percent)
            setCurrentTime(audioRef.current.currentTime)
        }
    }

    const handleEnded = () => {
        setIsPlaying(false)
        setProgress(0)
        setCurrentTime(0)
    }

    const handleProgressClick = (e) => {
        if (audioRef.current) {
            const rect = e.currentTarget.getBoundingClientRect()
            const percent = (e.clientX - rect.left) / rect.width
            audioRef.current.currentTime = percent * audioRef.current.duration
        }
    }

    return (
        <Box sx={{ width: '100%', minWidth: 200 }}>
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                preload="metadata"
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* Play/Pause button */}
                <IconButton
                    size="small"
                    onClick={togglePlay}
                    sx={{
                        bgcolor: '#00a884',
                        color: '#fff',
                        width: 32,
                        height: 32,
                        '&:hover': { bgcolor: '#008f72' },
                    }}
                >
                    {isPlaying ? (
                        <PauseIcon fontSize="small" />
                    ) : (
                        <PlayIcon fontSize="small" />
                    )}
                </IconButton>

                {/* Progress bar */}
                <Box
                    onClick={handleProgressClick}
                    sx={{
                        flex: 1,
                        position: 'relative',
                        height: 24,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    {/* Background track */}
                    <Box
                        sx={{
                            height: 4,
                            bgcolor: 'rgba(0,0,0,0.2)',
                            borderRadius: 2,
                            width: '100%',
                        }}
                    >
                        {/* Progress fill */}
                        <Box
                            sx={{
                                height: '100%',
                                bgcolor: '#00a884',
                                borderRadius: 2,
                                width: `${progress}%`,
                                transition: 'width 0.1s linear',
                            }}
                        />
                    </Box>
                </Box>

                {/* Duration */}
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ minWidth: 35, fontSize: '0.7rem' }}
                >
                    {formatDuration(currentTime || duration)}
                </Typography>

                {/* Transcription toggle */}
                {transcription && (
                    <IconButton
                        size="small"
                        onClick={() => setShowTranscription(!showTranscription)}
                        color={showTranscription ? 'primary' : 'default'}
                        sx={{ padding: 0.5 }}
                    >
                        <VolumeIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>

            {/* Transcription */}
            <Collapse in={showTranscription}>
                <Box
                    sx={{
                        mt: 1,
                        p: 1,
                        bgcolor: 'rgba(0,0,0,0.05)',
                        borderRadius: 1,
                        borderLeft: '3px solid #00a884',
                    }}
                >
                    <Typography variant="caption" color="text.secondary">
                        📝 Transcrição:
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                        {transcription}
                    </Typography>
                </Box>
            </Collapse>
        </Box>
    )
})

AudioPlayer.displayName = 'AudioPlayer'

export default AudioPlayer
