import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import api from '../services/api'

const NotificationContext = createContext(null)

// Converter VAPID key para Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export function NotificationProvider({ children }) {
    const [isSupported, setIsSupported] = useState(false)
    const [permission, setPermission] = useState('default')
    const [subscription, setSubscription] = useState(null)
    const [preferences, setPreferences] = useState(null)
    const [inAppNotifications, setInAppNotifications] = useState([])
    const [loading, setLoading] = useState(true)

    // Verificar suporte
    useEffect(() => {
        const supported = 'serviceWorker' in navigator && 'PushManager' in window
        setIsSupported(supported)

        if (supported) {
            setPermission(Notification.permission)
        }

        setLoading(false)
    }, [])

    // Registrar service worker e carregar subscription existente
    useEffect(() => {
        if (!isSupported) return

        const init = async () => {
            try {
                // Registrar service worker
                const registration = await navigator.serviceWorker.register('/sw.js')
                console.log('Service Worker registrado:', registration)

                // Verificar subscription existente
                const existingSub = await registration.pushManager.getSubscription()
                if (existingSub) {
                    setSubscription(existingSub)
                }

                // Carregar preferências do backend
                await loadPreferences()
            } catch (error) {
                console.error('Erro ao inicializar notificações:', error)
            }
        }

        init()

        // Escutar mensagens do service worker (notificações in-app)
        const handleMessage = (event) => {
            if (event.data && event.data.type === 'PUSH_RECEIVED') {
                const notification = {
                    id: Date.now(),
                    ...event.data.payload,
                    timestamp: new Date()
                }
                setInAppNotifications(prev => [notification, ...prev].slice(0, 10))
            }
        }

        navigator.serviceWorker.addEventListener('message', handleMessage)
        return () => {
            navigator.serviceWorker.removeEventListener('message', handleMessage)
        }
    }, [isSupported])

    // Carregar preferências
    const loadPreferences = async () => {
        try {
            const response = await api.get('/notifications/preferences')
            if (response.data.success) {
                setPreferences(response.data.data)
            }
        } catch (error) {
            console.error('Erro ao carregar preferências:', error)
        }
    }

    // Solicitar permissão e inscrever
    const subscribe = useCallback(async () => {
        if (!isSupported) {
            throw new Error('Notificações não suportadas neste navegador')
        }

        try {
            // Solicitar permissão
            const perm = await Notification.requestPermission()
            setPermission(perm)

            if (perm !== 'granted') {
                throw new Error('Permissão para notificações negada')
            }

            // Obter chave pública do servidor
            const keyResponse = await api.get('/notifications/public-key')
            const vapidPublicKey = keyResponse.data.data.publicKey

            // Obter registration do service worker
            const registration = await navigator.serviceWorker.ready

            // Criar subscription
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            })

            // Enviar subscription para o servidor
            await api.post('/notifications/subscribe', { subscription: sub.toJSON() })

            setSubscription(sub)
            return { success: true, subscription: sub }
        } catch (error) {
            console.error('Erro ao inscrever para notificações:', error)
            throw error
        }
    }, [isSupported])

    // Cancelar inscrição
    const unsubscribe = useCallback(async () => {
        if (subscription) {
            try {
                await subscription.unsubscribe()
                await api.post('/notifications/unsubscribe')
                setSubscription(null)
                return { success: true }
            } catch (error) {
                console.error('Erro ao cancelar inscrição:', error)
                throw error
            }
        }
    }, [subscription])

    // Atualizar preferências
    const updatePreferences = useCallback(async (newPrefs) => {
        try {
            const response = await api.put('/notifications/preferences', newPrefs)
            if (response.data.success) {
                setPreferences(response.data.data)
                return { success: true }
            }
        } catch (error) {
            console.error('Erro ao atualizar preferências:', error)
            throw error
        }
    }, [])

    // Enviar notificação de teste
    const sendTest = useCallback(async () => {
        try {
            const response = await api.post('/notifications/test')
            return response.data
        } catch (error) {
            console.error('Erro ao enviar teste:', error)
            throw error
        }
    }, [])

    // Limpar notificação in-app
    const dismissNotification = useCallback((id) => {
        setInAppNotifications(prev => prev.filter(n => n.id !== id))
    }, [])

    // Limpar todas as notificações in-app
    const clearAllNotifications = useCallback(() => {
        setInAppNotifications([])
    }, [])

    const value = {
        isSupported,
        permission,
        isSubscribed: !!subscription,
        subscription,
        preferences,
        inAppNotifications,
        loading,
        subscribe,
        unsubscribe,
        updatePreferences,
        sendTest,
        dismissNotification,
        clearAllNotifications,
        loadPreferences
    }

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    )
}

export function useNotifications() {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotifications deve ser usado dentro de NotificationProvider')
    }
    return context
}

export default NotificationContext
