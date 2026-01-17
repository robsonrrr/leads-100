import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'

// Limpar caches antigos
cleanupOutdatedCaches()

// Precaching dos assets gerados pelo build
precacheAndRoute(self.__WB_MANIFEST)

// Cache de Imagens de Produto (Runtime Caching)
registerRoute(
    ({ url }) => url.origin === 'https://img.rolemak.com.br',
    new CacheFirst({
        cacheName: 'product-images-cache',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 500,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 dias
            }),
        ],
    })
)

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
