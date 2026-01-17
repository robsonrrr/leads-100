/**
 * Lazy Loading Utilities - Q3.1 Performance
 * Componentes e hooks para otimização de carregamento
 */
import { lazy, Suspense, memo, useCallback, useMemo } from 'react';
import { Box, CircularProgress, Skeleton } from '@mui/material';

/**
 * Loading fallback padrão
 */
export const LoadingSpinner = ({ size = 40, height = 200 }) => (
    <Box
        sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height,
            width: '100%'
        }}
    >
        <CircularProgress size={size} />
    </Box>
);

/**
 * Skeleton para cards
 */
export const CardSkeleton = ({ height = 200 }) => (
    <Skeleton
        variant="rounded"
        height={height}
        animation="wave"
        sx={{ borderRadius: 2 }}
    />
);

/**
 * Skeleton para tabelas
 */
export const TableSkeleton = ({ rows = 5 }) => (
    <Box sx={{ width: '100%' }}>
        <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
        {[...Array(rows)].map((_, i) => (
            <Skeleton
                key={i}
                variant="rectangular"
                height={52}
                sx={{ mb: 0.5 }}
                animation="wave"
            />
        ))}
    </Box>
);

/**
 * Wrapper para lazy loading com fallback customizável
 */
export const LazyComponent = ({
    component: Component,
    fallback = <LoadingSpinner />,
    ...props
}) => (
    <Suspense fallback={fallback}>
        <Component {...props} />
    </Suspense>
);

/**
 * HOC para criar componente lazy com prefetch
 */
export const createLazyComponent = (importFn, fallback = <LoadingSpinner />) => {
    const LazyComp = lazy(importFn);

    const WrappedComponent = (props) => (
        <Suspense fallback={fallback}>
            <LazyComp {...props} />
        </Suspense>
    );

    // Prefetch function
    WrappedComponent.preload = importFn;

    return WrappedComponent;
};

/**
 * Hook para prefetch de componentes lazy
 */
export const usePrefetch = (lazyComponents) => {
    return useCallback(() => {
        lazyComponents.forEach((component) => {
            if (component.preload) {
                component.preload();
            }
        });
    }, [lazyComponents]);
};

/**
 * HOC para memoização profunda de componentes
 * Evita re-renders desnecessários
 */
export const withMemo = (Component, propsAreEqual) => {
    return memo(Component, propsAreEqual);
};

/**
 * Comparador para props de lista
 * Usa para memoização de componentes com arrays
 */
export const listPropsAreEqual = (prevProps, nextProps) => {
    // Compara arrays por length e IDs
    const prevItems = prevProps.items || prevProps.data || [];
    const nextItems = nextProps.items || nextProps.data || [];

    if (prevItems.length !== nextItems.length) return false;

    // Compara IDs dos primeiros e últimos 5 itens
    const compareCount = Math.min(5, prevItems.length);
    for (let i = 0; i < compareCount; i++) {
        if (prevItems[i]?.id !== nextItems[i]?.id) return false;
    }

    // Compara outras props importantes
    return (
        prevProps.loading === nextProps.loading &&
        prevProps.error === nextProps.error
    );
};

/**
 * Lazy loaded widgets do Dashboard (mais pesados)
 */
export const LazyCartItems = createLazyComponent(
    () => import('../components/CartItems'),
    <TableSkeleton rows={3} />
);

export const LazyAdvancedFilters = createLazyComponent(
    () => import('../components/AdvancedFilters'),
    <CardSkeleton height={400} />
);

export const LazyLeadsAnalyticsWidget = createLazyComponent(
    () => import('../components/LeadsAnalyticsWidget'),
    <CardSkeleton height={300} />
);

export const LazyExecutiveSummaryWidget = createLazyComponent(
    () => import('../components/ExecutiveSummaryWidget'),
    <CardSkeleton height={250} />
);

export const LazyPipelineWidget = createLazyComponent(
    () => import('../components/PipelineWidget'),
    <CardSkeleton height={300} />
);

export const LazyInventoryHealthWidget = createLazyComponent(
    () => import('../components/InventoryHealthWidget'),
    <CardSkeleton height={300} />
);

export const LazyPerformanceWidget = createLazyComponent(
    () => import('../components/PerformanceWidget'),
    <CardSkeleton height={250} />
);

export const LazyRecommendationsWidget = createLazyComponent(
    () => import('../components/RecommendationsWidget'),
    <CardSkeleton height={300} />
);

export const LazyInteractionsTimeline = createLazyComponent(
    () => import('../components/InteractionsTimeline'),
    <CardSkeleton height={400} />
);

export const LazyLeadHistoryTimeline = createLazyComponent(
    () => import('../components/LeadHistoryTimeline'),
    <CardSkeleton height={400} />
);

export default {
    LoadingSpinner,
    CardSkeleton,
    TableSkeleton,
    LazyComponent,
    createLazyComponent,
    usePrefetch,
    withMemo,
    listPropsAreEqual
};
