/**
 * Performance Hooks - Q3.1
 * Hooks para otimização de performance
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Hook de debounce para inputs e buscas
 * Adia a execução até o usuário parar de digitar
 */
export const useDebounce = (value, delay = 300) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

/**
 * Hook de debounce com callback
 */
export const useDebouncedCallback = (callback, delay = 300, deps = []) => {
    const timeoutRef = useRef(null);

    const debouncedCallback = useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay, ...deps]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return debouncedCallback;
};

/**
 * Hook de throttle para scroll e resize
 * Limita a frequência de execução
 */
export const useThrottle = (value, limit = 100) => {
    const [throttledValue, setThrottledValue] = useState(value);
    const lastRan = useRef(Date.now());

    useEffect(() => {
        const handler = setTimeout(() => {
            if (Date.now() - lastRan.current >= limit) {
                setThrottledValue(value);
                lastRan.current = Date.now();
            }
        }, limit - (Date.now() - lastRan.current));

        return () => {
            clearTimeout(handler);
        };
    }, [value, limit]);

    return throttledValue;
};

/**
 * Hook de throttle com callback
 */
export const useThrottledCallback = (callback, limit = 100, deps = []) => {
    const lastRan = useRef(Date.now());
    const timeoutRef = useRef(null);

    const throttledCallback = useCallback((...args) => {
        if (Date.now() - lastRan.current >= limit) {
            callback(...args);
            lastRan.current = Date.now();
        } else {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                callback(...args);
                lastRan.current = Date.now();
            }, limit - (Date.now() - lastRan.current));
        }
    }, [callback, limit, ...deps]);

    return throttledCallback;
};

/**
 * Hook para intersection observer (lazy loading de imagens/componentes)
 */
export const useIntersectionObserver = (options = {}) => {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const [hasIntersected, setHasIntersected] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
            if (entry.isIntersecting) {
                setHasIntersected(true);
                if (options.triggerOnce) {
                    observer.unobserve(element);
                }
            }
        }, {
            threshold: options.threshold || 0,
            rootMargin: options.rootMargin || '0px',
            ...options
        });

        observer.observe(element);

        return () => {
            observer.unobserve(element);
        };
    }, [options.threshold, options.rootMargin, options.triggerOnce]);

    return { ref, isIntersecting, hasIntersected };
};

/**
 * Hook para prefetch de dados quando componente entra na viewport
 */
export const usePrefetchOnVisible = (fetchFn, options = {}) => {
    const { ref, hasIntersected } = useIntersectionObserver({
        rootMargin: options.rootMargin || '200px',
        triggerOnce: true
    });
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (hasIntersected && !data && !loading) {
            setLoading(true);
            fetchFn()
                .then(setData)
                .catch(setError)
                .finally(() => setLoading(false));
        }
    }, [hasIntersected, fetchFn, data, loading]);

    return { ref, data, loading, error };
};

/**
 * Hook para memoização de callbacks com dependencies tracking
 */
export const useStableCallback = (callback) => {
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    return useCallback((...args) => {
        return callbackRef.current(...args);
    }, []);
};

/**
 * Hook para tracking de primeiro render
 */
export const useIsFirstRender = () => {
    const isFirstRender = useRef(true);

    useEffect(() => {
        isFirstRender.current = false;
    }, []);

    return isFirstRender.current;
};

/**
 * Hook para previous value
 */
export const usePrevious = (value) => {
    const ref = useRef();

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref.current;
};

/**
 * Hook para window size com throttle
 */
export const useWindowSize = (throttleMs = 200) => {
    const [size, setSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0
    });

    const throttledSetSize = useThrottledCallback(() => {
        setSize({
            width: window.innerWidth,
            height: window.innerHeight
        });
    }, throttleMs, []);

    useEffect(() => {
        window.addEventListener('resize', throttledSetSize);
        return () => window.removeEventListener('resize', throttledSetSize);
    }, [throttledSetSize]);

    return size;
};

/**
 * Hook para media queries
 */
export const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);

        const handler = (event) => setMatches(event.matches);
        mediaQuery.addEventListener('change', handler);

        return () => mediaQuery.removeEventListener('change', handler);
    }, [query]);

    return matches;
};

/**
 * Hook para detectar se está em mobile
 */
export const useIsMobile = () => useMediaQuery('(max-width: 768px)');

/**
 * Hook para scroll position com throttle
 */
export const useScrollPosition = (throttleMs = 100) => {
    const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });

    const handleScroll = useThrottledCallback(() => {
        setScrollPosition({
            x: window.scrollX,
            y: window.scrollY
        });
    }, throttleMs, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    return scrollPosition;
};

export default {
    useDebounce,
    useDebouncedCallback,
    useThrottle,
    useThrottledCallback,
    useIntersectionObserver,
    usePrefetchOnVisible,
    useStableCallback,
    useIsFirstRender,
    usePrevious,
    useWindowSize,
    useMediaQuery,
    useIsMobile,
    useScrollPosition
};
