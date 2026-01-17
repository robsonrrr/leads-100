/**
 * Sync Service - Gerenciador de sincronização
 * 
 * Responsável por:
 * - Sincronização inicial (bulk)
 * - Sincronização incremental (delta)
 * - Gerenciamento da fila de operações offline
 */

import { sqliteService } from './sqliteService'
import api from './api'

const SYNC_INTERVAL = 15 * 60 * 1000 // 15 minutos
const SYNC_QUEUE_INTERVAL = 30 * 1000 // 30 segundos

class SyncService {
    constructor() {
        this.isSyncing = false
        this.listeners = new Set()
        this.syncInterval = null
        this.queueInterval = null
    }

    /**
     * Adiciona listener de eventos de sync
     */
    addListener(callback) {
        this.listeners.add(callback)
        return () => this.listeners.delete(callback)
    }

    /**
     * Notifica listeners de eventos
     */
    notify(event, data) {
        this.listeners.forEach(cb => cb(event, data))
    }

    /**
     * Inicia serviço de sincronização
     */
    start() {
        console.log('🔄 SyncService iniciado')

        // Sync inicial se online
        if (navigator.onLine) {
            this.syncAll()
        }

        // Configurar intervalo de sync
        this.syncInterval = setInterval(() => {
            if (navigator.onLine && !this.isSyncing) {
                this.syncIncremental()
            }
        }, SYNC_INTERVAL)

        // Processar fila de operações
        this.queueInterval = setInterval(() => {
            if (navigator.onLine) {
                this.processQueue()
            }
        }, SYNC_QUEUE_INTERVAL)

        // Listener de volta online
        window.addEventListener('online', () => {
            console.log('🌐 Voltou online - iniciando sync')
            this.syncIncremental()
            this.processQueue()
        })
    }

    /**
     * Para o serviço de sincronização
     */
    stop() {
        if (this.syncInterval) clearInterval(this.syncInterval)
        if (this.queueInterval) clearInterval(this.queueInterval)
        console.log('🔄 SyncService parado')
    }

    /**
     * Sincronização completa (primeira vez ou reset)
     */
    async syncAll() {
        if (this.isSyncing) return

        this.isSyncing = true
        this.notify('sync:start', { type: 'full' })

        try {
            console.log('📥 Iniciando sync completa...')

            // Sync de produtos em batch
            let hasMore = true
            let since = null
            let totalProducts = 0

            while (hasMore) {
                const response = await api.get('/sync/products', {
                    params: { since, limit: 1000 }
                })

                if (response.data.success && response.data.data.length > 0) {
                    await sqliteService.saveProducts(response.data.data)
                    totalProducts += response.data.data.length
                    since = response.data.pagination.lastSync
                    hasMore = response.data.pagination.hasMore

                    this.notify('sync:progress', {
                        entity: 'products',
                        count: totalProducts
                    })
                } else {
                    hasMore = false
                }
            }

            // Sync de clientes
            let customersSince = null
            let hasMoreCustomers = true
            let totalCustomers = 0

            while (hasMoreCustomers) {
                const response = await api.get('/sync/customers', {
                    params: { since: customersSince, limit: 500 }
                })

                if (response.data.success && response.data.data.length > 0) {
                    await sqliteService.saveCustomers(response.data.data)
                    totalCustomers += response.data.data.length
                    customersSince = response.data.pagination.lastSync
                    hasMoreCustomers = response.data.pagination.hasMore

                    this.notify('sync:progress', {
                        entity: 'customers',
                        count: totalCustomers
                    })
                } else {
                    hasMoreCustomers = false
                }
            }

            // Atualizar metadados
            await sqliteService.updateSyncMetadata('products', totalProducts)
            await sqliteService.updateSyncMetadata('customers', totalCustomers)

            console.log(`✅ Sync completa: ${totalProducts} produtos, ${totalCustomers} clientes`)
            this.notify('sync:complete', {
                type: 'full',
                products: totalProducts,
                customers: totalCustomers
            })

        } catch (error) {
            console.error('❌ Erro na sync completa:', error)
            this.notify('sync:error', { error: error.message })
        } finally {
            this.isSyncing = false
        }
    }

    /**
     * Sincronização incremental (apenas mudanças)
     */
    async syncIncremental() {
        if (this.isSyncing) return

        this.isSyncing = true
        this.notify('sync:start', { type: 'incremental' })

        try {
            // Pegar último sync de produtos
            const lastProductSync = await sqliteService.getLastSync('products')

            const productRes = await api.get('/sync/products', {
                params: { since: lastProductSync, limit: 500 }
            })

            if (productRes.data.success && productRes.data.data.length > 0) {
                await sqliteService.saveProducts(productRes.data.data)
                await sqliteService.updateSyncMetadata('products', productRes.data.data.length)
                console.log(`📥 Sync incremental: ${productRes.data.data.length} produtos atualizados`)
            }

            // Pegar último sync de clientes
            const lastCustomerSync = await sqliteService.getLastSync('customers')

            const customerRes = await api.get('/sync/customers', {
                params: { since: lastCustomerSync, limit: 200 }
            })

            if (customerRes.data.success && customerRes.data.data.length > 0) {
                await sqliteService.saveCustomers(customerRes.data.data)
                await sqliteService.updateSyncMetadata('customers', customerRes.data.data.length)
                console.log(`📥 Sync incremental: ${customerRes.data.data.length} clientes atualizados`)
            }

            this.notify('sync:complete', { type: 'incremental' })

        } catch (error) {
            console.error('❌ Erro na sync incremental:', error)
            this.notify('sync:error', { error: error.message })
        } finally {
            this.isSyncing = false
        }
    }

    /**
     * Processa fila de operações offline
     */
    async processQueue() {
        try {
            const pending = await sqliteService.getPendingSyncItems()

            if (pending.length === 0) return

            console.log(`📤 Processando ${pending.length} operações na fila...`)

            for (const item of pending) {
                try {
                    const payload = JSON.parse(item.payload)

                    switch (item.action) {
                        case 'CREATE':
                            await api.post(`/${item.entity}`, payload)
                            break
                        case 'UPDATE':
                            await api.put(`/${item.entity}/${item.entity_id}`, payload)
                            break
                        case 'DELETE':
                            await api.delete(`/${item.entity}/${item.entity_id}`)
                            break
                    }

                    await sqliteService.markSynced(item.id)
                    console.log(`✅ Sincronizado: ${item.action} ${item.entity} ${item.entity_id}`)

                } catch (error) {
                    console.error(`❌ Erro ao sincronizar ${item.id}:`, error)
                    await sqliteService.markSyncError(item.id)
                    this.notify('queue:error', {
                        entity: item.entity,
                        action: item.action,
                        error: error.message
                    })
                }
            }

            this.notify('queue:processed', { count: pending.length })

        } catch (error) {
            console.error('❌ Erro ao processar fila:', error)
        }
    }

    /**
     * Força sincronização manual
     */
    async forceSync() {
        if (navigator.onLine) {
            await this.syncIncremental()
            await this.processQueue()
        }
    }

    /**
     * Retorna status de sync
     */
    async getStatus() {
        const stats = await sqliteService.getStats()
        const lastProductSync = await sqliteService.getLastSync('products')
        const lastCustomerSync = await sqliteService.getLastSync('customers')

        return {
            ...stats,
            lastProductSync,
            lastCustomerSync,
            isSyncing: this.isSyncing,
            isOnline: navigator.onLine
        }
    }
}

export const syncService = new SyncService()
export default syncService
