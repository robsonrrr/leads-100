import { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import RefreshIcon from '@mui/icons-material/Refresh';

const PullToRefresh = ({ onRefresh, children }) => {
    const [pulling, setPulling] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const y = useMotionValue(0);
    const controls = useAnimation();

    // Refresh threshold
    const THRESHOLD = 80;

    // Transform y value to opacity and rotation for the icon
    const opacity = useTransform(y, [0, THRESHOLD], [0, 1]);
    const rotate = useTransform(y, [0, THRESHOLD], [0, 360]);
    const scale = useTransform(y, [0, THRESHOLD], [0.5, 1.2]);

    const handleDrag = (event, info) => {
        if (refreshing) return;

        const currentY = info.point.y;
        const offset = info.offset.y;

        // Only allow pulling if at the top of the page
        if (window.scrollY === 0 && offset > 0) {
            setPulling(true);
            y.set(offset * 0.4); // Resistance factor
        } else {
            setPulling(false);
            y.set(0);
        }
    };

    const handleDragEnd = async (event, info) => {
        if (refreshing) return;

        if (y.get() >= THRESHOLD) {
            setRefreshing(true);
            setPulling(false);

            // Keep at threshold while refreshing
            await controls.start({ y: THRESHOLD });

            try {
                await onRefresh();
            } catch (err) {
                console.error('Refresh failed', err);
            } finally {
                setRefreshing(false);
                await controls.start({ y: 0 });
                y.set(0);
            }
        } else {
            setPulling(false);
            controls.start({ y: 0 });
            y.set(0);
        }
    };

    return (
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
            {/* Container do ícone de refresh */}
            <motion.div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: THRESHOLD,
                    zIndex: 10,
                    opacity,
                    scale,
                    rotate: refreshing ? undefined : rotate
                }}
                animate={refreshing ? { rotate: 360 } : {}}
                transition={refreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
            >
                <Paper
                    elevation={3}
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        bgcolor: 'primary.main',
                        color: 'white'
                    }}
                >
                    <RefreshIcon />
                </Paper>
            </motion.div>

            {/* Conteúdo que será arrastado */}
            <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.6}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                animate={controls}
                style={{ y }}
            >
                {children}
            </motion.div>
        </Box>
    );
};

export default PullToRefresh;
