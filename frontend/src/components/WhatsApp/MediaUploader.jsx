/**
 * MediaUploader Component
 * 
 * Componente para upload e envio de mídia via WhatsApp
 * Suporta imagens, PDFs, documentos e áudio
 * 
 * @version 1.0
 * @date 2026-01-23
 */

import React, { useState, useRef, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    Button,
    CircularProgress,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Tooltip,
    Chip,
    Alert
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Image as ImageIcon,
    PictureAsPdf as PdfIcon,
    AudioFile as AudioIcon,
    VideoFile as VideoIcon,
    InsertDriveFile as FileIcon,
    Close as CloseIcon,
    Send as SendIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';

// Configurações de tipos aceitos
const ACCEPTED_TYPES = {
    image: {
        accept: 'image/jpeg,image/png,image/gif,image/webp',
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        maxSize: 16 * 1024 * 1024, // 16MB
        icon: ImageIcon,
        label: 'Imagem'
    },
    document: {
        accept: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
        maxSize: 16 * 1024 * 1024, // 16MB
        icon: PdfIcon,
        label: 'Documento'
    },
    audio: {
        accept: 'audio/mpeg,audio/ogg,audio/wav,audio/mp4',
        extensions: ['.mp3', '.ogg', '.wav', '.m4a'],
        maxSize: 16 * 1024 * 1024, // 16MB
        icon: AudioIcon,
        label: 'Áudio'
    },
    video: {
        accept: 'video/mp4,video/3gpp,video/quicktime',
        extensions: ['.mp4', '.3gp', '.mov'],
        maxSize: 16 * 1024 * 1024, // 16MB
        icon: VideoIcon,
        label: 'Vídeo'
    }
};

/**
 * Obtém o tipo de mídia baseado no arquivo
 */
function getMediaType(file) {
    const mimeType = file.type.toLowerCase();

    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('sheet')) return 'document';

    return 'document'; // default
}

/**
 * Formata tamanho de arquivo
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Componente de preview de arquivo
 */
function FilePreview({ file, mediaType, onRemove }) {
    const [preview, setPreview] = useState(null);

    // Gerar preview para imagens
    React.useEffect(() => {
        if (mediaType === 'image' && file) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target.result);
            reader.readAsDataURL(file);
        }
        return () => setPreview(null);
    }, [file, mediaType]);

    const IconComponent = ACCEPTED_TYPES[mediaType]?.icon || FileIcon;

    return (
        <Paper
            elevation={2}
            sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                borderRadius: 2,
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider'
            }}
        >
            {/* Preview ou ícone */}
            <Box
                sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'action.hover',
                    flexShrink: 0
                }}
            >
                {preview ? (
                    <img
                        src={preview}
                        alt={file.name}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                ) : (
                    <IconComponent sx={{ fontSize: 40, color: 'primary.main' }} />
                )}
            </Box>

            {/* Informações do arquivo */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    variant="subtitle2"
                    noWrap
                    sx={{ fontWeight: 600 }}
                >
                    {file.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {formatFileSize(file.size)}
                </Typography>
                <Chip
                    label={ACCEPTED_TYPES[mediaType]?.label || 'Arquivo'}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ mt: 0.5 }}
                />
            </Box>

            {/* Botão de remover */}
            <Tooltip title="Remover arquivo">
                <IconButton
                    onClick={onRemove}
                    size="small"
                    sx={{ color: 'error.main' }}
                >
                    <DeleteIcon />
                </IconButton>
            </Tooltip>
        </Paper>
    );
}

/**
 * Componente principal de upload de mídia
 */
export function MediaUploader({
    onUpload,
    onCancel,
    disabled = false,
    uploading = false,
    uploadProgress = 0,
    maxSize = 16 * 1024 * 1024,
    acceptedTypes = ['image', 'document', 'audio', 'video']
}) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [mediaType, setMediaType] = useState(null);
    const [caption, setCaption] = useState('');
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    // Construir accept string
    const acceptString = acceptedTypes
        .map(type => ACCEPTED_TYPES[type]?.accept)
        .filter(Boolean)
        .join(',');

    /**
     * Valida o arquivo selecionado
     */
    const validateFile = useCallback((file) => {
        // Verificar tamanho
        if (file.size > maxSize) {
            return `Arquivo muito grande. Máximo: ${formatFileSize(maxSize)}`;
        }

        // Verificar tipo
        const type = getMediaType(file);
        if (!acceptedTypes.includes(type)) {
            return `Tipo de arquivo não suportado: ${file.type}`;
        }

        return null;
    }, [maxSize, acceptedTypes]);

    /**
     * Handler para seleção de arquivo
     */
    const handleFileSelect = useCallback((file) => {
        setError(null);

        if (!file) return;

        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        const type = getMediaType(file);
        setSelectedFile(file);
        setMediaType(type);
    }, [validateFile]);

    /**
     * Handler para input de arquivo
     */
    const handleInputChange = useCallback((e) => {
        const file = e.target.files?.[0];
        handleFileSelect(file);
        // Reset input para permitir selecionar o mesmo arquivo novamente
        e.target.value = '';
    }, [handleFileSelect]);

    /**
     * Handler para drag & drop
     */
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        handleFileSelect(file);
    }, [handleFileSelect]);

    /**
     * Handler para remover arquivo
     */
    const handleRemove = useCallback(() => {
        setSelectedFile(null);
        setMediaType(null);
        setCaption('');
        setError(null);
    }, []);

    /**
     * Handler para envio
     */
    const handleSend = useCallback(() => {
        if (!selectedFile || !mediaType) return;

        onUpload?.({
            file: selectedFile,
            type: mediaType,
            caption: caption.trim()
        });
    }, [selectedFile, mediaType, caption, onUpload]);

    /**
     * Handler para cancelar
     */
    const handleCancel = useCallback(() => {
        handleRemove();
        onCancel?.();
    }, [handleRemove, onCancel]);

    return (
        <Box sx={{ width: '100%' }}>
            {/* Erro */}
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            {/* Área de upload (quando não há arquivo selecionado) */}
            {!selectedFile && (
                <Paper
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    sx={{
                        p: 4,
                        border: '2px dashed',
                        borderColor: isDragging ? 'primary.main' : 'divider',
                        borderRadius: 2,
                        backgroundColor: isDragging ? 'action.hover' : 'background.paper',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                        '&:hover': {
                            borderColor: 'primary.light',
                            backgroundColor: 'action.hover'
                        }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={acceptString}
                        onChange={handleInputChange}
                        style={{ display: 'none' }}
                    />

                    <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />

                    <Typography variant="h6" gutterBottom>
                        Arraste um arquivo ou clique para selecionar
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                        Formatos aceitos: imagens, PDFs, documentos, áudio
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                        Tamanho máximo: {formatFileSize(maxSize)}
                    </Typography>

                    {/* Chips de tipos aceitos */}
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {acceptedTypes.map(type => {
                            const config = ACCEPTED_TYPES[type];
                            if (!config) return null;
                            const Icon = config.icon;
                            return (
                                <Chip
                                    key={type}
                                    icon={<Icon />}
                                    label={config.label}
                                    size="small"
                                    variant="outlined"
                                />
                            );
                        })}
                    </Box>
                </Paper>
            )}

            {/* Preview do arquivo selecionado */}
            {selectedFile && (
                <Box>
                    <FilePreview
                        file={selectedFile}
                        mediaType={mediaType}
                        onRemove={handleRemove}
                    />

                    {/* Campo de legenda */}
                    <TextField
                        fullWidth
                        label="Legenda (opcional)"
                        placeholder="Adicione uma descrição para este arquivo..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        multiline
                        maxRows={3}
                        disabled={disabled || uploading}
                        sx={{ mt: 2 }}
                        inputProps={{ maxLength: 1000 }}
                        helperText={`${caption.length}/1000`}
                    />

                    {/* Progress bar */}
                    {uploading && (
                        <Box sx={{ mt: 2 }}>
                            <LinearProgress
                                variant="determinate"
                                value={uploadProgress}
                                sx={{ height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                Enviando... {uploadProgress}%
                            </Typography>
                        </Box>
                    )}

                    {/* Botões de ação */}
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                            variant="outlined"
                            onClick={handleCancel}
                            disabled={uploading}
                            startIcon={<CloseIcon />}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSend}
                            disabled={disabled || uploading || !selectedFile}
                            startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                        >
                            {uploading ? 'Enviando...' : 'Enviar'}
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
}

/**
 * Dialog para upload de mídia
 */
export function MediaUploadDialog({
    open,
    onClose,
    onUpload,
    phone,
    uploading = false,
    uploadProgress = 0
}) {
    const handleUpload = useCallback((media) => {
        onUpload?.(media);
    }, [onUpload]);

    return (
        <Dialog
            open={open}
            onClose={uploading ? undefined : onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Enviar arquivo</Typography>
                    {!uploading && (
                        <IconButton onClick={onClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    )}
                </Box>
            </DialogTitle>
            <DialogContent>
                {phone && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Enviando para: <strong>{phone}</strong>
                    </Typography>
                )}
                <MediaUploader
                    onUpload={handleUpload}
                    onCancel={onClose}
                    uploading={uploading}
                    uploadProgress={uploadProgress}
                />
            </DialogContent>
        </Dialog>
    );
}

export default MediaUploader;
