import api from './api';

/**
 * Notification Service (Q2 2026)
 * Gerencia Push Notifications no frontend
 */
const notificationService = {
    /**
     * Verifica se o navegador suporta push notifications
     */
    isSupported: () => {
        return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    },

    /**
     * Verifica status atual das permissões
     */
    getPermissionStatus: () => {
        if (!notificationService.isSupported()) return 'unsupported';
        return Notification.permission; // 'default', 'granted', 'denied'
    },

    /**
     * Solicita permissão para notificações
     */
    requestPermission: async () => {
        if (!notificationService.isSupported()) {
            throw new Error('Notificações não suportadas neste navegador');
        }

        const permission = await Notification.requestPermission();
        return permission;
    },

    /**
     * Registra o service worker e ativa push notifications
     */
    subscribe: async () => {
        if (!notificationService.isSupported()) {
            throw new Error('Notificações não suportadas');
        }

        // 1. Solicitar permissão
        const permission = await notificationService.requestPermission();
        if (permission !== 'granted') {
            throw new Error('Permissão negada');
        }

        // 2. Registrar Service Worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        // 3. Obter chave pública VAPID do backend
        const keyResponse = await api.get('/notifications/vapid-public-key');
        const vapidPublicKey = keyResponse.data.data.publicKey;

        // 4. Converter chave para Uint8Array
        const urlBase64ToUint8Array = (base64String) => {
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding)
                .replace(/-/g, '+')
                .replace(/_/g, '/');
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
        };

        // 5. Criar subscription
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });

        // 6. Enviar subscription para o backend
        await api.post('/notifications/subscribe', { subscription: subscription.toJSON() });

        return { success: true, message: 'Notificações ativadas!' };
    },

    /**
     * Desativa push notifications
     */
    unsubscribe: async () => {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();
        }

        await api.post('/notifications/unsubscribe');
        return { success: true, message: 'Notificações desativadas' };
    },

    /**
     * Verifica se já está inscrito
     */
    isSubscribed: async () => {
        if (!notificationService.isSupported()) return false;

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            return !!subscription;
        } catch {
            return false;
        }
    },

    /**
     * Obtém preferências de notificação
     */
    getPreferences: async () => {
        const response = await api.get('/notifications/preferences');
        return response.data.data;
    },

    /**
     * Atualiza preferências de notificação
     */
    updatePreferences: async (preferences) => {
        const response = await api.put('/notifications/preferences', preferences);
        return response.data.data;
    },

    /**
     * Envia notificação de teste
     */
    sendTest: async () => {
        const response = await api.post('/notifications/test');
        return response.data;
    }
};

export default notificationService;
