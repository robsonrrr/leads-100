/**
 * Tasks Service
 * Frontend API client for Daily Tasks system
 */
import api from './api'

/**
 * Tasks service for Daily Tasks OODA system
 */
export const tasksService = {
    /**
     * Generate daily tasks (triggers OODA pipeline on backend)
     * @param {string} date - Optional date (YYYY-MM-DD)
     */
    generate: (date = null) =>
        api.post('/v2/tasks/generate', { date }),

    /**
     * Get today's tasks for the authenticated user
     * @param {string} date - Optional date (YYYY-MM-DD)
     */
    getToday: (date = null) =>
        api.get('/v2/tasks/today', { params: { date } }),

    /**
     * Get tasks for a specific seller (manager view)
     * @param {number} sellerId - Seller ID
     * @param {string} date - Optional date (YYYY-MM-DD)
     */
    getSellerTasks: (sellerId, date = null) =>
        api.get(`/v2/tasks/today/${sellerId}`, { params: { date } }),

    /**
     * Get a specific task by ID
     * @param {number} taskId - Task ID
     */
    getById: (taskId) =>
        api.get(`/v2/tasks/${taskId}`),

    /**
     * Start a task (mark as IN_PROGRESS)
     * @param {number} taskId - Task ID
     */
    start: (taskId) =>
        api.patch(`/v2/tasks/${taskId}/start`),

    /**
     * Complete a task with outcome
     * @param {number} taskId - Task ID
     * @param {Object} outcome - Outcome data
     * @param {string} outcome.outcome_code - WON, LOST, NO_RESPONSE, ESCALATED, DEFERRED
     * @param {string} outcome.outcome_reason_code - PRICE, DEADLINE, etc.
     * @param {string} outcome.outcome_note - Optional note
     */
    complete: (taskId, outcome) =>
        api.patch(`/v2/tasks/${taskId}/done`, outcome),

    /**
     * Snooze a task
     * @param {number} taskId - Task ID
     * @param {string} snoozeUntil - DateTime to snooze until
     * @param {string} note - Optional note
     */
    snooze: (taskId, snoozeUntil, note = null) =>
        api.patch(`/v2/tasks/${taskId}/snooze`, { snooze_until: snoozeUntil, note }),

    /**
     * Cancel a task
     * @param {number} taskId - Task ID
     * @param {string} note - Optional note
     */
    cancel: (taskId, note = null) =>
        api.delete(`/v2/tasks/${taskId}`, { data: { note } }),

    /**
     * Get task statistics
     * @param {Object} params - Query params
     * @param {number} params.seller_id - Optional seller ID (managers only)
     * @param {string} params.start_date - Start date
     * @param {string} params.end_date - End date
     */
    getStats: (params = {}) =>
        api.get('/v2/tasks/stats', { params }),

    /**
     * Get SLA breaches
     * @param {number} sellerId - Optional seller ID (managers only)
     */
    getSlaBreaches: (sellerId = null) =>
        api.get('/v2/tasks/sla-breaches', { params: { seller_id: sellerId } }),

    /**
     * Get available outcome reasons
     * @param {string} outcomeCode - Optional filter by outcome code
     */
    getOutcomeReasons: (outcomeCode = null) =>
        api.get('/v2/tasks/outcomes', { params: { outcome_code: outcomeCode } }),

    /**
     * Get task rules (admin only)
     */
    getRules: () =>
        api.get('/v2/tasks/rules'),
}

export default tasksService
