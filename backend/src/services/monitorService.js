import logger from '../config/logger.js';

let requestCount = 0;
let errorCount = 0;
let lastReset = Date.now();

const RESET_INTERVAL = 60000; // 1 minuto

/**
 * Monitora métricas de requisição e dispara alertas se necessário
 * @param {number} statusCode 
 * @param {number} duration 
 */
export function monitorRequest(statusCode, duration) {
    // Reset counters of interval passed
    const now = Date.now();
    if (now - lastReset > RESET_INTERVAL) {
        checkThresholds();
        requestCount = 0;
        errorCount = 0;
        lastReset = now;
    }

    requestCount++;
    if (statusCode >= 500) {
        errorCount++;
    }

    // Check latency (Alert 1.4.2)
    if (duration > 500) {
        logger.warn(`High Latency Detected: ${duration}ms`, {
            alert_type: 'latency',
            metric: 'duration',
            value: duration,
            threshold: 500,
            severity: 'warning'
        });
    }
}

/**
 * Verifica thresholds agregados (Error Rate)
 * Chamado a cada RESET_INTERVAL
 */
function checkThresholds() {
    if (requestCount === 0) return;

    const errorRate = (errorCount / requestCount) * 100;

    // Alert 1.4.3
    if (errorRate > 1) {
        logger.error(`High Error Rate Detected: ${errorRate.toFixed(2)}%`, {
            alert_type: 'error_rate',
            metric: 'error_percent',
            value: errorRate,
            threshold: 1,
            period: '1min',
            total_requests: requestCount,
            total_errors: errorCount,
            severity: 'critical'
        });
    }
}

export default {
    monitorRequest
};
