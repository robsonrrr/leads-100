/**
 * Serviço de Métricas para uso Offline e Sincronização
 */
const METRICS_KEY = 'leads_agent_metrics'

export const metricsService = {
    /**
     * Registra início de uma sessão offline
     */
    logOfflineSession() {
        const data = this.get()
        data.offlineSessions = (data.offlineSessions || 0) + 1
        data.lastOfflineSession = new Date().toISOString()
        this.save(data)
        console.log('📊 Métrica: Sessão offline registrada')
    },

    /**
     * Registra resultado de sync
     * @param {boolean} success 
     */
    logSync(success) {
        const data = this.get()
        data.syncTotal = (data.syncTotal || 0) + 1
        if (success) {
            data.syncSuccess = (data.syncSuccess || 0) + 1
        } else {
            data.syncErrors = (data.syncErrors || 0) + 1
        }
        data.lastSyncAttempt = new Date().toISOString()
        this.save(data)
    },

    /**
     * Obtém todas as métricas
     */
    get() {
        try {
            return JSON.parse(localStorage.getItem(METRICS_KEY) || '{}')
        } catch {
            return {}
        }
    },

    /**
     * Salva métricas
     */
    save(data) {
        localStorage.setItem(METRICS_KEY, JSON.stringify(data))
    },

    /**
     * Calcula taxa de sucesso de sync
     */
    getSyncSuccessRate() {
        const { syncTotal, syncSuccess } = this.get()
        if (!syncTotal) return 100
        return ((syncSuccess || 0) / syncTotal * 100).toFixed(2)
    },

    /**
     * Limpa métricas
     */
    clear() {
        localStorage.removeItem(METRICS_KEY)
    }
}

export default metricsService
