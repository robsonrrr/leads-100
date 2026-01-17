import { useEffect } from 'react'
import { registerSW } from 'virtual:pwa-register'
import { syncService } from '../services/syncService'
import { useToast } from '../contexts/ToastContext'

export function useServiceWorker() {
    const toast = useToast()

    useEffect(() => {
        // Registrar Service Worker via vite-plugin-pwa
        const updateSW = registerSW({
            onNeedRefresh() {
                // Notificar usuário sobre atualização
                if (confirm('Nova versão disponível. Atualizar agora?')) {
                    updateSW(true)
                }
            },
            onOfflineReady() {
                console.log('App pronto para uso offline!')
                toast?.showSuccess?.('App pronto para uso offline!')
            },
            onRegisterError(error) {
                console.error('Erro ao registrar SW:', error)
            }
        })

        // Listener para mensagens do SW (Background Sync trigger)
        if ('serviceWorker' in navigator) {
            const handleMessage = (event) => {
                if (event.data && event.data.type === 'SYNC_TRIGGERED') {
                    console.log('⚡ Background Sync solicitado pelo SW')
                    toast?.showInfo?.('Sincronizando em segundo plano...')
                    syncService.forceSync()
                }
            }

            navigator.serviceWorker.addEventListener('message', handleMessage)
            return () => navigator.serviceWorker.removeEventListener('message', handleMessage)
        }
    }, [toast])

    // Função para registrar sync tag
    const registerBackgroudSync = async (tag = 'sync-leads') => {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            try {
                const registration = await navigator.serviceWorker.ready
                await registration.sync.register(tag)
                console.log(`📌 Background Sync registrado: ${tag}`)
            } catch (err) {
                console.error('Erro ao registrar Background Sync:', err)
            }
        }
    }

    return { registerBackgroudSync }
}

export default useServiceWorker
