/**
 * Optimized Image Component - Q3.1 Performance
 * Lazy loading, placeholder, e fallback para imagens
 */
import { useState, memo } from 'react';
import { Box, Skeleton } from '@mui/material';
import { useIntersectionObserver } from '../hooks/usePerformance';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';

/**
 * Componente de imagem otimizada com lazy loading
 */
export const OptimizedImage = memo(({
    src,
    alt,
    width,
    height,
    fallback,
    placeholder,
    objectFit = 'cover',
    borderRadius = 0,
    loading = 'lazy',
    rootMargin = '50px',
    sx = {},
    ...props
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const { ref, hasIntersected } = useIntersectionObserver({
        rootMargin,
        triggerOnce: true
    });

    const shouldLoad = loading === 'eager' || hasIntersected;

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = () => {
        setHasError(true);
        setIsLoaded(true);
    };

    // Fallback para erro
    if (hasError) {
        if (fallback) {
            return fallback;
        }
        return (
            <Box
                sx={{
                    width,
                    height,
                    borderRadius,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.200',
                    color: 'grey.500',
                    ...sx
                }}
                {...props}
            >
                <BrokenImageIcon />
            </Box>
        );
    }

    return (
        <Box
            ref={ref}
            sx={{
                position: 'relative',
                width,
                height,
                borderRadius,
                overflow: 'hidden',
                ...sx
            }}
            {...props}
        >
            {/* Skeleton enquanto carrega */}
            {!isLoaded && (
                placeholder || (
                    <Skeleton
                        variant="rectangular"
                        width="100%"
                        height="100%"
                        animation="wave"
                        sx={{ position: 'absolute', top: 0, left: 0 }}
                    />
                )
            )}

            {/* Imagem real (só renderiza quando na viewport) */}
            {shouldLoad && (
                <img
                    src={src}
                    alt={alt}
                    onLoad={handleLoad}
                    onError={handleError}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit,
                        opacity: isLoaded ? 1 : 0,
                        transition: 'opacity 0.3s ease-in-out'
                    }}
                />
            )}
        </Box>
    );
});

OptimizedImage.displayName = 'OptimizedImage';

/**
 * Avatar otimizado com fallback para iniciais
 */
export const OptimizedAvatar = memo(({
    src,
    name,
    size = 40,
    fontSize = 16,
    bgcolor = 'primary.main',
    color = 'white',
    ...props
}) => {
    const [hasError, setHasError] = useState(false);
    const { ref, hasIntersected } = useIntersectionObserver({
        rootMargin: '50px',
        triggerOnce: true
    });

    // Gerar iniciais do nome
    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    const initials = getInitials(name);

    if (hasError || !src) {
        return (
            <Box
                sx={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    bgcolor,
                    color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize,
                    fontWeight: 'bold'
                }}
                {...props}
            >
                {initials}
            </Box>
        );
    }

    return (
        <Box
            ref={ref}
            sx={{
                width: size,
                height: size,
                borderRadius: '50%',
                overflow: 'hidden',
                bgcolor: 'grey.200'
            }}
            {...props}
        >
            {hasIntersected && (
                <img
                    src={src}
                    alt={name}
                    onError={() => setHasError(true)}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                />
            )}
        </Box>
    );
});

OptimizedAvatar.displayName = 'OptimizedAvatar';

/**
 * Galeria de imagens com lazy loading
 */
export const LazyImageGallery = memo(({ images, columns = 3, gap = 2, ...props }) => {
    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap
            }}
            {...props}
        >
            {images.map((image, index) => (
                <OptimizedImage
                    key={image.id || index}
                    src={image.src}
                    alt={image.alt || `Image ${index + 1}`}
                    width="100%"
                    height={200}
                    borderRadius={1}
                    rootMargin="100px"
                />
            ))}
        </Box>
    );
});

LazyImageGallery.displayName = 'LazyImageGallery';

export default OptimizedImage;
