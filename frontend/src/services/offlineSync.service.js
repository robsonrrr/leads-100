import { leadsService } from './api';

const OFFLINE_QUEUE_KEY = 'leads_offline_queue';

class OfflineSyncService {
    constructor() {
        this.isOnline = navigator.onLine;
        this.queue = this.loadQueue();

        window.addEventListener('online', () => this.handleOnlineStatusChange(true));
        window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
    }

    loadQueue() {
        try {
            const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading offline queue', e);
            return [];
        }
    }

    saveQueue() {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
    }

    async handleOnlineStatusChange(isOnline) {
        this.isOnline = isOnline;
        console.log(`🌐 Device is now ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

        if (isOnline && this.queue.length > 0) {
            console.log(`🔄 Syncing ${this.queue.length} pending items...`);
            await this.sync();
        }
    }

    /**
     * Adiciona uma requisição à fila offline
     */
    enqueue(type, data) {
        const item = {
            id: Date.now(),
            type,
            data,
            timestamp: new Date().toISOString()
        };
        this.queue.push(item);
        this.saveQueue();
        console.log('📦 Item queued for offline sync:', type);
        return item;
    }

    /**
     * Tenta sincronizar todos os itens da fila
     */
    async sync() {
        if (!navigator.onLine || this.queue.length === 0) return;

        const itemsToProcess = [...this.queue];
        const failures = [];

        for (const item of itemsToProcess) {
            try {
                console.log(`🚀 Syncing item ${item.id} (${item.type})...`);

                if (item.type === 'CREATE_LEAD') {
                    await leadsService.create(item.data);
                } else if (item.type === 'ADD_INTERACTION') {
                    // Import dinâmico para evitar circular dependency se necessário
                    const { interactionsService } = await import('./api');
                    await interactionsService.create(item.data);
                }

                // Remover da fila após sucesso
                this.queue = this.queue.filter(q => q.id !== item.id);
                this.saveQueue();
                console.log(`✅ Item ${item.id} synced successfully.`);
            } catch (error) {
                console.error(`❌ Failed to sync item ${item.id}:`, error);
                failures.push(item);
                // Se for erro de rede de novo, para por aqui
                if (!navigator.onLine) break;
            }
        }

        if (this.queue.length === 0) {
            console.log('✨ All offline items synced.');
        } else {
            console.log(`⚠️ ${this.queue.length} items still pending.`);
        }
    }

    getQueueStatus() {
        return {
            isOnline: this.isOnline,
            pendingCount: this.queue.length
        };
    }
}

export const offlineSyncService = new OfflineSyncService();
