import { useState, useEffect, useRef } from 'react'
import {
    Box,
    Typography,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    TextField,
    Card,
    CardContent,
    CardMedia
} from '@mui/material'
import {
    CameraAlt as CameraIcon,
    Close as CloseIcon,
    FlashlightOn as FlashOnIcon,
    FlashlightOff as FlashOffIcon,
    QrCodeScanner as ScannerIcon
} from '@mui/icons-material'
import { productsService } from '../services/api'
import { formatCurrency } from '../utils'

/**
 * Componente Scanner de Código de Barras
 * Usa a API MediaDevices para acessar a câmera
 * Fallback para entrada manual
 */
export default function BarcodeScanner({ open, onClose, onProductFound }) {
    const [hasCamera, setHasCamera] = useState(true)
    const [scanning, setScanning] = useState(false)
    const [error, setError] = useState('')
    const [manualCode, setManualCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [foundProduct, setFoundProduct] = useState(null)
    const [flashOn, setFlashOn] = useState(false)

    const videoRef = useRef(null)
    const streamRef = useRef(null)
    const canvasRef = useRef(null)

    // Verificar suporte a câmera
    useEffect(() => {
        const checkCamera = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices()
                const cameras = devices.filter(d => d.kind === 'videoinput')
                setHasCamera(cameras.length > 0)
            } catch (err) {
                setHasCamera(false)
            }
        }
        checkCamera()
    }, [])

    // Iniciar câmera quando modal abre
    useEffect(() => {
        if (open && hasCamera) {
            startCamera()
        }
        return () => stopCamera()
    }, [open, hasCamera])

    const startCamera = async () => {
        try {
            setError('')
            setScanning(true)

            const constraints = {
                video: {
                    facingMode: 'environment', // Câmera traseira
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            }

            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            streamRef.current = stream

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.play()
            }

            // Iniciar detecção de código de barras (usando BarcodeDetector API se disponível)
            if ('BarcodeDetector' in window) {
                startBarcodeDetection()
            }
        } catch (err) {
            console.error('Erro ao acessar câmera:', err)
            setError('Não foi possível acessar a câmera. Use a entrada manual.')
            setHasCamera(false)
            setScanning(false)
        }
    }

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        setScanning(false)
    }

    const startBarcodeDetection = async () => {
        if (!('BarcodeDetector' in window)) return

        try {
            const detector = new window.BarcodeDetector({
                formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39']
            })

            const detect = async () => {
                if (!videoRef.current || !scanning) return

                try {
                    const barcodes = await detector.detect(videoRef.current)
                    if (barcodes.length > 0) {
                        const code = barcodes[0].rawValue
                        handleBarcodeDetected(code)
                        return
                    }
                } catch (err) {
                    // Continuar tentando
                }

                if (scanning) {
                    requestAnimationFrame(detect)
                }
            }

            detect()
        } catch (err) {
            console.debug('BarcodeDetector não disponível:', err)
        }
    }

    const handleBarcodeDetected = async (code) => {
        stopCamera()
        setManualCode(code)
        await searchProduct(code)
    }

    const searchProduct = async (barcode) => {
        if (!barcode || barcode.length < 8) {
            setError('Código de barras deve ter pelo menos 8 dígitos')
            return
        }

        setLoading(true)
        setError('')
        setFoundProduct(null)

        try {
            const response = await productsService.getByBarcode(barcode)
            if (response.data.success && response.data.data) {
                setFoundProduct(response.data.data)
            } else {
                setError('Produto não encontrado para este código de barras')
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setError('Produto não encontrado para este código de barras')
            } else {
                setError('Erro ao buscar produto. Tente novamente.')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleManualSearch = () => {
        searchProduct(manualCode)
    }

    const handleSelectProduct = () => {
        if (foundProduct) {
            onProductFound?.(foundProduct)
            handleClose()
        }
    }

    const handleClose = () => {
        stopCamera()
        setManualCode('')
        setFoundProduct(null)
        setError('')
        onClose()
    }

    const handleRetry = () => {
        setFoundProduct(null)
        setError('')
        setManualCode('')
        if (hasCamera) {
            startCamera()
        }
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScannerIcon />
                    Leitor de Código de Barras
                </Box>
                <IconButton onClick={handleClose}><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent>
                {/* Área da câmera */}
                {hasCamera && !foundProduct && (
                    <Box
                        sx={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '4/3',
                            bgcolor: 'black',
                            borderRadius: 2,
                            overflow: 'hidden',
                            mb: 2
                        }}
                    >
                        <video
                            ref={videoRef}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                            playsInline
                            muted
                        />

                        {/* Overlay de guia */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '80%',
                                height: 80,
                                border: '3px solid #fff',
                                borderRadius: 1,
                                boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
                            }}
                        />

                        {scanning && (
                            <Typography
                                sx={{
                                    position: 'absolute',
                                    bottom: 16,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    color: 'white',
                                    bgcolor: 'rgba(0,0,0,0.6)',
                                    px: 2,
                                    py: 0.5,
                                    borderRadius: 1
                                }}
                            >
                                Posicione o código de barras na área
                            </Typography>
                        )}

                        {/* Controles da câmera */}
                        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                            <IconButton
                                sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}
                                onClick={() => setFlashOn(!flashOn)}
                            >
                                {flashOn ? <FlashOnIcon /> : <FlashOffIcon />}
                            </IconButton>
                        </Box>

                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </Box>
                )}

                {/* Erro */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Entrada manual */}
                {(!hasCamera || !scanning) && !foundProduct && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Digite o código de barras manualmente:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Ex: 7891234567890"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ''))}
                                onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                            />
                            <Button
                                variant="contained"
                                onClick={handleManualSearch}
                                disabled={loading || manualCode.length < 8}
                            >
                                {loading ? <CircularProgress size={20} /> : 'Buscar'}
                            </Button>
                        </Box>
                    </Box>
                )}

                {/* Produto encontrado */}
                {foundProduct && (
                    <Card sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex' }}>
                            <CardMedia
                                component="img"
                                sx={{ width: 120, height: 120, objectFit: 'contain', bgcolor: '#f5f5f5' }}
                                image={foundProduct.imageUrl}
                                alt={foundProduct.model}
                                onError={(e) => { e.target.src = '/placeholder-product.png' }}
                            />
                            <CardContent>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    {foundProduct.model}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {foundProduct.brand}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                    {foundProduct.name}
                                </Typography>
                                <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                                    {formatCurrency(foundProduct.price)}
                                </Typography>
                            </CardContent>
                        </Box>
                    </Card>
                )}
            </DialogContent>

            <DialogActions>
                {foundProduct ? (
                    <>
                        <Button onClick={handleRetry}>Escanear Outro</Button>
                        <Button variant="contained" onClick={handleSelectProduct}>
                            Usar Este Produto
                        </Button>
                    </>
                ) : (
                    <Button onClick={handleClose}>Cancelar</Button>
                )}
            </DialogActions>
        </Dialog>
    )
}

// Adicionar ao api.js:
// getByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
