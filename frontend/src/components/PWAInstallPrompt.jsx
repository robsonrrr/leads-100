import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Typography,
    Paper,
    IconButton,
    Snackbar,
    Alert
} from '@mui/material';
import {
    GetApp as InstallIcon,
    Close as CloseIcon
} from '@mui/icons-material';

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can add to home screen
            setVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setVisible(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User responded to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setVisible(false);
    };

    const handleClose = () => {
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <Snackbar
            open={visible}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            sx={{ mb: 8 }} // Evitar cobrir o chat ou outros elementos fixos
        >
            <Alert
                severity="info"
                variant="filled"
                icon={<InstallIcon />}
                action={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Button color="inherit" size="small" onClick={handleInstallClick} sx={{ fontWeight: 'bold' }}>
                            INSTALAR APP
                        </Button>
                        <IconButton size="small" color="inherit" onClick={handleClose}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                }
                sx={{
                    bgcolor: 'primary.dark',
                    color: 'white',
                    '& .MuiAlert-icon': { color: 'white' }
                }}
            >
                <Typography variant="body2">
                    Instale o Leads Agent para acesso rápido e modo offline.
                </Typography>
            </Alert>
        </Snackbar>
    );
};

export default PWAInstallPrompt;
