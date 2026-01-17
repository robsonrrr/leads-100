/**
 * Virtual Scrolling Component - Q3.1 Performance
 * Renderiza apenas os itens visíveis na viewport
 */
import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Box } from '@mui/material';

/**
 * Hook para virtual scrolling
 */
export const useVirtualScroll = ({
    itemCount,
    itemHeight,
    containerHeight,
    overscan = 3
}) => {
    const [scrollTop, setScrollTop] = useState(0);

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
        itemCount,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const visibleItems = [];
    for (let i = startIndex; i < endIndex; i++) {
        visibleItems.push({
            index: i,
            style: {
                position: 'absolute',
                top: i * itemHeight,
                height: itemHeight,
                left: 0,
                right: 0
            }
        });
    }

    const totalHeight = itemCount * itemHeight;

    const handleScroll = useCallback((e) => {
        setScrollTop(e.target.scrollTop);
    }, []);

    return {
        visibleItems,
        totalHeight,
        handleScroll,
        startIndex,
        endIndex
    };
};

/**
 * Componente de lista virtualizada simples
 */
export const VirtualList = memo(({
    items,
    itemHeight,
    containerHeight,
    renderItem,
    overscan = 3,
    ...props
}) => {
    const containerRef = useRef(null);
    const [scrollTop, setScrollTop] = useState(0);

    const handleScroll = useCallback((e) => {
        setScrollTop(e.target.scrollTop);
    }, []);

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
        items.length,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const totalHeight = items.length * itemHeight;
    const offsetY = startIndex * itemHeight;

    const visibleItems = items.slice(startIndex, endIndex);

    return (
        <Box
            ref={containerRef}
            onScroll={handleScroll}
            sx={{
                height: containerHeight,
                overflow: 'auto',
                position: 'relative'
            }}
            {...props}
        >
            <Box sx={{ height: totalHeight, position: 'relative' }}>
                <Box sx={{ transform: `translateY(${offsetY}px)` }}>
                    {visibleItems.map((item, idx) => (
                        <Box
                            key={item.id || startIndex + idx}
                            sx={{ height: itemHeight }}
                        >
                            {renderItem(item, startIndex + idx)}
                        </Box>
                    ))}
                </Box>
            </Box>
        </Box>
    );
});

VirtualList.displayName = 'VirtualList';

/**
 * Componente de tabela virtualizada
 * Para listas muito grandes (> 100 itens)
 */
export const VirtualTable = memo(({
    rows,
    columns,
    rowHeight = 52,
    headerHeight = 56,
    containerHeight = 400,
    overscan = 5,
    onRowClick,
    ...props
}) => {
    const containerRef = useRef(null);
    const [scrollTop, setScrollTop] = useState(0);

    const handleScroll = useCallback((e) => {
        setScrollTop(e.target.scrollTop);
    }, []);

    const contentHeight = containerHeight - headerHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endIndex = Math.min(
        rows.length,
        Math.ceil((scrollTop + contentHeight) / rowHeight) + overscan
    );

    const totalHeight = rows.length * rowHeight;
    const offsetY = startIndex * rowHeight;

    const visibleRows = rows.slice(startIndex, endIndex);

    return (
        <Box {...props}>
            {/* Header fixo */}
            <Box
                sx={{
                    display: 'flex',
                    height: headerHeight,
                    bgcolor: 'grey.100',
                    borderBottom: 1,
                    borderColor: 'divider',
                    fontWeight: 'bold'
                }}
            >
                {columns.map((col) => (
                    <Box
                        key={col.field}
                        sx={{
                            flex: col.flex || 1,
                            width: col.width,
                            p: 2,
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        {col.headerName}
                    </Box>
                ))}
            </Box>

            {/* Body virtualizado */}
            <Box
                ref={containerRef}
                onScroll={handleScroll}
                sx={{
                    height: contentHeight,
                    overflow: 'auto',
                    position: 'relative'
                }}
            >
                <Box sx={{ height: totalHeight, position: 'relative' }}>
                    <Box sx={{ transform: `translateY(${offsetY}px)` }}>
                        {visibleRows.map((row, idx) => (
                            <Box
                                key={row.id || startIndex + idx}
                                onClick={() => onRowClick?.(row)}
                                sx={{
                                    display: 'flex',
                                    height: rowHeight,
                                    borderBottom: 1,
                                    borderColor: 'divider',
                                    cursor: onRowClick ? 'pointer' : 'default',
                                    '&:hover': {
                                        bgcolor: 'action.hover'
                                    }
                                }}
                            >
                                {columns.map((col) => (
                                    <Box
                                        key={col.field}
                                        sx={{
                                            flex: col.flex || 1,
                                            width: col.width,
                                            p: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                    >
                                        {col.renderCell
                                            ? col.renderCell({ row, value: row[col.field] })
                                            : row[col.field]
                                        }
                                    </Box>
                                ))}
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
});

VirtualTable.displayName = 'VirtualTable';

/**
 * HOC para adicionar virtualização a componentes de lista
 */
export const withVirtualization = (WrappedComponent, options = {}) => {
    const VirtualizedComponent = memo((props) => {
        const { items = [], ...rest } = props;

        // Se poucos itens, usar componente normal
        if (items.length < (options.threshold || 50)) {
            return <WrappedComponent items={items} {...rest} />;
        }

        // Se muitos itens, usar virtualização
        return (
            <VirtualList
                items={items}
                itemHeight={options.itemHeight || 72}
                containerHeight={options.containerHeight || 400}
                renderItem={(item, index) => (
                    <WrappedComponent
                        items={[item]}
                        singleItem
                        index={index}
                        {...rest}
                    />
                )}
            />
        );
    });

    VirtualizedComponent.displayName = `Virtualized(${WrappedComponent.displayName || WrappedComponent.name})`;

    return VirtualizedComponent;
};

export default {
    useVirtualScroll,
    VirtualList,
    VirtualTable,
    withVirtualization
};
