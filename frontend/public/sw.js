// Service Worker for Push Notifications
// This file should be in the public folder

const CACHE_NAME = 'leads-agent-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
    console.log('Service Worker installed');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) return;

    // Skip API requests - we want fresh data for IA
    if (event.request.url.includes('/api/')) return;

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    // Only cache successful GET requests
                    if (event.request.method === 'GET' && fetchResponse.status === 200) {
                        cache.put(event.request, fetchResponse.clone());
                    }
                    return fetchResponse;
                });
            });
        }).catch(() => {
            // Offline fallback for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
                return caches.match('/');
            }
        })
    );
});

self.addEventListener('push', (event) => {
    console.log('Push notification received');

    let data = {
        title: 'Leads Agent',
        body: 'Nova notificação',
        icon: '/icons/notification.png',
        badge: '/icons/badge.png',
        data: { url: '/' }
    };

    try {
        if (event.data) {
            data = { ...data, ...event.data.json() };
        }
    } catch (e) {
        console.error('Error parsing push data:', e);
    }

    const options = {
        body: data.body,
        icon: data.icon || '/icons/notification.png',
        badge: data.badge || '/icons/badge.png',
        vibrate: [100, 50, 100],
        data: data.data || { url: '/' },
        actions: [
            { action: 'open', title: 'Abrir' },
            { action: 'close', title: 'Fechar' }
        ],
        requireInteraction: true,
        tag: data.tag || 'default'
    };

    event.waitUntil(
        Promise.all([
            // Mostrar notificação nativa
            self.registration.showNotification(data.title, options),

            // Enviar mensagem para o app (notificação in-app)
            self.clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clients) => {
                    clients.forEach((client) => {
                        client.postMessage({
                            type: 'PUSH_RECEIVED',
                            payload: {
                                title: data.title,
                                body: data.body,
                                url: data.data?.url || '/',
                                category: data.data?.category || 'GENERAL'
                            }
                        });
                    });
                })
        ])
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked');
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    if (event.action === 'close') {
        return;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Se já houver uma janela aberta, focar nela
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(urlToOpen);
                        return client.focus();
                    }
                }
                // Caso contrário, abrir nova janela
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Handle background sync for offline notifications
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-notifications') {
        console.log('Background sync triggered');
    }
});
