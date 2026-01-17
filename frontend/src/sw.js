import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

// Limpar caches antigos
cleanupOutdatedCaches()

// Precaching dos assets gerados pelo build
precacheAndRoute(self.__WB_MANIFEST)

// Ativar SW imediatamente
self.skipWaiting()
clientsClaim()

// Background Sync: Escutar evento 'sync'
self.addEventListener('sync', (event) => {
    console.log(`[SW] Evento sync recebido: ${event.tag}`)

    if (event.tag === 'sync-leads' || event.tag === 'sync-queue') {
        event.waitUntil(triggerSyncInClients())
    }
})

// Função auxiliar para notificar abas abertas
async function triggerSyncInClients() {
    const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    })

    console.log(`[SW] Notificando ${allClients.length} abas para sincronizar`)

    for (const client of allClients) {
        client.postMessage({
            type: 'SYNC_TRIGGERED',
            timestamp: Date.now()
        })
    }
}

// Escutar mensagens do frontend
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting()
    }
})
