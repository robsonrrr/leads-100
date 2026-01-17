/**
 * Alert Service - Q3.1 Performance Monitoring
 * Sistema de alertas para latência, erros e métricas de performance
 */
import logger from '../config/logger.js';
import { getRedis } from '../config/redis.js';
import { SlackService } from './slack.service.js';

// Thresholds Q3.1
const THRESHOLDS = {
    // Latência
    LATENCY_WARNING: 300,     // 300ms - warning
    LATENCY_CRITICAL: 500,    // 500ms - critical alert
    LATENCY_EMERGENCY: 1000,  // 1s - emergency

    // Error Rate
    ERROR_RATE_WARNING: 1,    // 1% - warning
    ERROR_RATE_CRITICAL: 5,   // 5% - critical

    // Cache
    CACHE_HIT_WARNING: 70,    // < 70% - warning
    CACHE_HIT_CRITICAL: 50,   // < 50% - critical

    // Memory
    MEMORY_WARNING: 80,       // 80% usage - warning
    MEMORY_CRITICAL: 90,      // 90% usage - critical

    // Database
    DB_QUERY_SLOW: 500,       // 500ms - slow query
    DB_QUERY_CRITICAL: 2000   // 2s - critical slow query
};

// Cooldown para evitar spam de alertas (em ms)
const ALERT_COOLDOWN = {
    WARNING: 5 * 60 * 1000,   // 5 minutos
    CRITICAL: 2 * 60 * 1000,  // 2 minutos
    EMERGENCY: 30 * 1000      // 30 segundos
};

// Estado dos alertas (para cooldown)
const alertState = {
    lastAlerts: new Map(),
    counts: {
        warning: 0,
        critical: 0,
        emergency: 0
    },
    startTime: Date.now()
};

/**
 * Verifica se pode enviar alerta (cooldown)
 */
function canSendAlert(alertKey, level) {
    const now = Date.now();
    const lastAlert = alertState.lastAlerts.get(alertKey);
    const cooldown = ALERT_COOLDOWN[level.toUpperCase()] || ALERT_COOLDOWN.WARNING;

    if (!lastAlert || (now - lastAlert) > cooldown) {
        alertState.lastAlerts.set(alertKey, now);
        return true;
    }

    return false;
}

/**
 * Envia alerta para diversos canais
 */
async function sendAlert(alert) {
    const { level, type, message, details, timestamp } = alert;

    // Incrementar contador
    alertState.counts[level]++;

    // Log estruturado
    const logData = {
        alertLevel: level,
        alertType: type,
        message,
        details,
        timestamp
    };

    switch (level) {
        case 'emergency':
            logger.error('🚨 EMERGENCY ALERT:', logData);
            break;
        case 'critical':
            logger.error('🔴 CRITICAL ALERT:', logData);
            break;
        case 'warning':
            logger.warn('⚠️ WARNING ALERT:', logData);
            break;
        default:
            logger.info('ℹ️ INFO ALERT:', logData);
    }

    // Salvar no Redis para histórico
    try {
        const redis = getRedis();
        if (redis) {
            const key = `alerts:${type}:${timestamp}`;
            await redis.set(key, JSON.stringify(alert), 'EX', 86400); // 24h

            // Adicionar à lista de alertas recentes
            await redis.lpush('alerts:recent', JSON.stringify(alert));
            await redis.ltrim('alerts:recent', 0, 99); // Manter últimos 100
        }
    } catch (e) {
        logger.error('Failed to save alert to Redis:', e);
    }

    // Enviar para Slack (critical e emergency sempre, warning só se habilitado)
    try {
        if (level === 'emergency' || level === 'critical') {
            await SlackService.sendAlert(alert);
        } else if (level === 'warning' && process.env.SLACK_ALERT_WARNINGS === 'true') {
            await SlackService.sendAlert(alert);
        }
    } catch (slackError) {
        logger.error('Failed to send Slack alert:', slackError);
    }

    return alert;
}

/**
 * AlertService - Serviço principal de alertas
 */
export const AlertService = {
    /**
     * Alerta de latência alta
     */
    async checkLatency(endpoint, durationMs) {
        const alertKey = `latency:${endpoint}`;

        if (durationMs >= THRESHOLDS.LATENCY_EMERGENCY) {
            if (canSendAlert(alertKey, 'emergency')) {
                return sendAlert({
                    level: 'emergency',
                    type: 'latency',
                    message: `Emergency: ${endpoint} took ${durationMs}ms (> ${THRESHOLDS.LATENCY_EMERGENCY}ms)`,
                    details: {
                        endpoint,
                        durationMs,
                        threshold: THRESHOLDS.LATENCY_EMERGENCY
                    },
                    timestamp: new Date().toISOString()
                });
            }
        } else if (durationMs >= THRESHOLDS.LATENCY_CRITICAL) {
            if (canSendAlert(alertKey, 'critical')) {
                return sendAlert({
                    level: 'critical',
                    type: 'latency',
                    message: `Critical: ${endpoint} took ${durationMs}ms (> ${THRESHOLDS.LATENCY_CRITICAL}ms)`,
                    details: {
                        endpoint,
                        durationMs,
                        threshold: THRESHOLDS.LATENCY_CRITICAL
                    },
                    timestamp: new Date().toISOString()
                });
            }
        } else if (durationMs >= THRESHOLDS.LATENCY_WARNING) {
            if (canSendAlert(alertKey, 'warning')) {
                return sendAlert({
                    level: 'warning',
                    type: 'latency',
                    message: `Warning: ${endpoint} is slow (${durationMs}ms > ${THRESHOLDS.LATENCY_WARNING}ms)`,
                    details: {
                        endpoint,
                        durationMs,
                        threshold: THRESHOLDS.LATENCY_WARNING
                    },
                    timestamp: new Date().toISOString()
                });
            }
        }

        return null;
    },

    /**
     * Alerta de error rate alta
     */
    async checkErrorRate(totalRequests, errors) {
        if (totalRequests < 100) return null; // Precisa de amostra significativa

        const errorRate = (errors / totalRequests) * 100;
        const alertKey = 'error_rate';

        if (errorRate >= THRESHOLDS.ERROR_RATE_CRITICAL) {
            if (canSendAlert(alertKey, 'critical')) {
                return sendAlert({
                    level: 'critical',
                    type: 'error_rate',
                    message: `Critical: Error rate is ${errorRate.toFixed(2)}% (> ${THRESHOLDS.ERROR_RATE_CRITICAL}%)`,
                    details: {
                        totalRequests,
                        errors,
                        errorRate: errorRate.toFixed(2)
                    },
                    timestamp: new Date().toISOString()
                });
            }
        } else if (errorRate >= THRESHOLDS.ERROR_RATE_WARNING) {
            if (canSendAlert(alertKey, 'warning')) {
                return sendAlert({
                    level: 'warning',
                    type: 'error_rate',
                    message: `Warning: Error rate is ${errorRate.toFixed(2)}% (> ${THRESHOLDS.ERROR_RATE_WARNING}%)`,
                    details: {
                        totalRequests,
                        errors,
                        errorRate: errorRate.toFixed(2)
                    },
                    timestamp: new Date().toISOString()
                });
            }
        }

        return null;
    },

    /**
     * Alerta de cache hit rate baixo
     */
    async checkCacheHitRate(hits, misses) {
        const total = hits + misses;
        if (total < 100) return null; // Precisa de amostra significativa

        const hitRate = (hits / total) * 100;
        const alertKey = 'cache_hit_rate';

        if (hitRate < THRESHOLDS.CACHE_HIT_CRITICAL) {
            if (canSendAlert(alertKey, 'critical')) {
                return sendAlert({
                    level: 'critical',
                    type: 'cache_hit_rate',
                    message: `Critical: Cache hit rate is ${hitRate.toFixed(2)}% (< ${THRESHOLDS.CACHE_HIT_CRITICAL}%)`,
                    details: {
                        hits,
                        misses,
                        hitRate: hitRate.toFixed(2)
                    },
                    timestamp: new Date().toISOString()
                });
            }
        } else if (hitRate < THRESHOLDS.CACHE_HIT_WARNING) {
            if (canSendAlert(alertKey, 'warning')) {
                return sendAlert({
                    level: 'warning',
                    type: 'cache_hit_rate',
                    message: `Warning: Cache hit rate is ${hitRate.toFixed(2)}% (< ${THRESHOLDS.CACHE_HIT_WARNING}%)`,
                    details: {
                        hits,
                        misses,
                        hitRate: hitRate.toFixed(2)
                    },
                    timestamp: new Date().toISOString()
                });
            }
        }

        return null;
    },

    /**
     * Alerta de slow query no banco
     */
    async checkSlowQuery(query, durationMs, metadata = {}) {
        const alertKey = `slow_query:${query.substring(0, 50)}`;

        if (durationMs >= THRESHOLDS.DB_QUERY_CRITICAL) {
            if (canSendAlert(alertKey, 'critical')) {
                return sendAlert({
                    level: 'critical',
                    type: 'slow_query',
                    message: `Critical: Slow query took ${durationMs}ms`,
                    details: {
                        query: query.substring(0, 200),
                        durationMs,
                        ...metadata
                    },
                    timestamp: new Date().toISOString()
                });
            }
        } else if (durationMs >= THRESHOLDS.DB_QUERY_SLOW) {
            if (canSendAlert(alertKey, 'warning')) {
                return sendAlert({
                    level: 'warning',
                    type: 'slow_query',
                    message: `Warning: Slow query took ${durationMs}ms`,
                    details: {
                        query: query.substring(0, 200),
                        durationMs,
                        ...metadata
                    },
                    timestamp: new Date().toISOString()
                });
            }
        }

        return null;
    },

    /**
     * Alerta de uso de memória alto
     */
    async checkMemoryUsage() {
        const used = process.memoryUsage();
        const heapUsedPercent = (used.heapUsed / used.heapTotal) * 100;
        const alertKey = 'memory_usage';

        if (heapUsedPercent >= THRESHOLDS.MEMORY_CRITICAL) {
            if (canSendAlert(alertKey, 'critical')) {
                return sendAlert({
                    level: 'critical',
                    type: 'memory',
                    message: `Critical: Memory usage is ${heapUsedPercent.toFixed(1)}%`,
                    details: {
                        heapUsed: Math.round(used.heapUsed / 1024 / 1024) + 'MB',
                        heapTotal: Math.round(used.heapTotal / 1024 / 1024) + 'MB',
                        rss: Math.round(used.rss / 1024 / 1024) + 'MB',
                        heapUsedPercent: heapUsedPercent.toFixed(1)
                    },
                    timestamp: new Date().toISOString()
                });
            }
        } else if (heapUsedPercent >= THRESHOLDS.MEMORY_WARNING) {
            if (canSendAlert(alertKey, 'warning')) {
                return sendAlert({
                    level: 'warning',
                    type: 'memory',
                    message: `Warning: Memory usage is ${heapUsedPercent.toFixed(1)}%`,
                    details: {
                        heapUsed: Math.round(used.heapUsed / 1024 / 1024) + 'MB',
                        heapTotal: Math.round(used.heapTotal / 1024 / 1024) + 'MB',
                        heapUsedPercent: heapUsedPercent.toFixed(1)
                    },
                    timestamp: new Date().toISOString()
                });
            }
        }

        return null;
    },

    /**
     * Retorna estatísticas de alertas
     */
    getStats() {
        const uptime = Math.floor((Date.now() - alertState.startTime) / 1000);
        return {
            counts: { ...alertState.counts },
            uptime: `${uptime}s`,
            cooldowns: Object.keys(ALERT_COOLDOWN).reduce((acc, key) => {
                acc[key] = `${ALERT_COOLDOWN[key] / 1000}s`;
                return acc;
            }, {})
        };
    },

    /**
     * Retorna alertas recentes do Redis
     */
    async getRecentAlerts(limit = 20) {
        try {
            const redis = getRedis();
            if (!redis) return [];

            const alerts = await redis.lrange('alerts:recent', 0, limit - 1);
            return alerts.map(a => JSON.parse(a));
        } catch (e) {
            logger.error('Failed to get recent alerts:', e);
            return [];
        }
    },

    /**
     * Reset contadores de alerta
     */
    reset() {
        alertState.lastAlerts.clear();
        alertState.counts = { warning: 0, critical: 0, emergency: 0 };
        alertState.startTime = Date.now();
        logger.info('Alert service reset');
    },

    // Expor thresholds para configuração
    THRESHOLDS
};

export default AlertService;
