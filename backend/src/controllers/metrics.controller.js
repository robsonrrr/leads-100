/**
 * Performance Metrics Controller - Q3.1
 * Endpoints para monitoramento de performance e métricas de cache
 */

import { getRedis } from '../config/redis.js';
import { getDatabase } from '../config/database.js';
import logger from '../config/logger.js';
import { CacheService } from '../services/cache.service.js';

const db = () => getDatabase();

// Métricas em memória
let performanceMetrics = {
    requests: 0,
    totalResponseTime: 0,
    slowQueries: 0,
    errors: 0,
    startTime: Date.now()
};

// Métricas de cache em memória
let cacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    invalidations: 0
};

/**
 * Middleware para coletar métricas de request
 */
export function metricsMiddleware(req, res, next) {
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        performanceMetrics.requests++;
        performanceMetrics.totalResponseTime += duration;

        if (duration > 1000) {
            performanceMetrics.slowQueries++;
            logger.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
        }

        if (res.statusCode >= 500) {
            performanceMetrics.errors++;
        }
    });

    next();
}

/**
 * Incrementa contador de cache hit
 */
export function recordCacheHit() {
    cacheMetrics.hits++;
}

/**
 * Incrementa contador de cache miss
 */
export function recordCacheMiss() {
    cacheMetrics.misses++;
}

/**
 * GET /api/metrics/performance
 * Retorna métricas de performance do sistema
 */
export async function getPerformanceMetrics(req, res, next) {
    try {
        const uptime = Math.floor((Date.now() - performanceMetrics.startTime) / 1000);
        const avgResponseTime = performanceMetrics.requests > 0
            ? Math.round(performanceMetrics.totalResponseTime / performanceMetrics.requests)
            : 0;

        // Verificar conexão Redis
        const redis = getRedis();
        const redisStatus = redis ? 'connected' : 'disconnected';

        // Verificar conexão DB
        let dbStatus = 'unknown';
        try {
            await db().execute('SELECT 1');
            dbStatus = 'connected';
        } catch (e) {
            dbStatus = 'disconnected';
        }

        // Calcular hit rate
        const totalCacheOps = cacheMetrics.hits + cacheMetrics.misses;
        const hitRate = totalCacheOps > 0
            ? ((cacheMetrics.hits / totalCacheOps) * 100).toFixed(2)
            : 0;

        res.json({
            success: true,
            data: {
                system: {
                    uptime: `${uptime}s`,
                    uptimeFormatted: formatUptime(uptime),
                    nodeVersion: process.version,
                    memoryUsage: formatMemoryUsage()
                },
                requests: {
                    total: performanceMetrics.requests,
                    avgResponseTime: `${avgResponseTime}ms`,
                    slowQueries: performanceMetrics.slowQueries,
                    errors: performanceMetrics.errors,
                    errorRate: performanceMetrics.requests > 0
                        ? ((performanceMetrics.errors / performanceMetrics.requests) * 100).toFixed(2) + '%'
                        : '0%'
                },
                cache: {
                    status: redisStatus,
                    hits: cacheMetrics.hits,
                    misses: cacheMetrics.misses,
                    hitRate: `${hitRate}%`,
                    sets: cacheMetrics.sets,
                    invalidations: cacheMetrics.invalidations
                },
                database: {
                    status: dbStatus
                },
                targets: {
                    avgResponseTime: '< 300ms',
                    hitRate: '> 70%',
                    errorRate: '< 1%'
                }
            }
        });
    } catch (error) {
        logger.error('Error getting performance metrics:', error);
        next(error);
    }
}

/**
 * GET /api/metrics/cache
 * Retorna métricas detalhadas de cache
 */
export async function getCacheMetrics(req, res, next) {
    try {
        const redis = getRedis();

        if (!redis) {
            return res.json({
                success: true,
                data: {
                    status: 'disconnected',
                    message: 'Redis não disponível',
                    metrics: cacheMetrics
                }
            });
        }

        // Obter info do Redis
        const info = await redis.info('stats');
        const memoryInfo = await redis.info('memory');

        // Parse info
        const stats = parseRedisInfo(info);
        const memory = parseRedisInfo(memoryInfo);

        // Contar keys por prefixo
        const keyStats = {};
        const prefixes = ['meta:', 'lead:', 'cart:', 'customer:', 'product:', 'cgoals:', 'dash:', 'analytics:'];

        for (const prefix of prefixes) {
            const keys = await redis.keys(`${prefix}*`);
            keyStats[prefix.replace(':', '')] = keys.length;
        }

        res.json({
            success: true,
            data: {
                status: 'connected',
                memory: {
                    used: memory.used_memory_human || 'N/A',
                    peak: memory.used_memory_peak_human || 'N/A',
                    fragmentation: memory.mem_fragmentation_ratio || 'N/A'
                },
                stats: {
                    totalConnections: stats.total_connections_received || 0,
                    totalCommands: stats.total_commands_processed || 0,
                    keyspaceHits: stats.keyspace_hits || 0,
                    keyspaceMisses: stats.keyspace_misses || 0,
                    hitRate: calculateHitRate(stats.keyspace_hits, stats.keyspace_misses)
                },
                keys: keyStats,
                applicationMetrics: cacheMetrics
            }
        });
    } catch (error) {
        logger.error('Error getting cache metrics:', error);
        next(error);
    }
}

/**
 * GET /api/metrics/queries
 * Retorna análise de queries (requer permissão admin)
 */
export async function getQueryMetrics(req, res, next) {
    try {
        // Verificar nível de acesso
        if (req.user?.level < 5) {
            return res.status(403).json({
                success: false,
                error: { message: 'Acesso negado' }
            });
        }

        // Tentar buscar slow queries do MySQL
        let slowQueries = [];
        try {
            const [rows] = await db().execute(`
        SELECT 
          query, 
          exec_count, 
          avg_latency,
          max_latency
        FROM performance_schema.events_statements_summary_by_digest
        WHERE avg_latency > 1000000000
        ORDER BY avg_latency DESC
        LIMIT 10
      `);
            slowQueries = rows;
        } catch (e) {
            // performance_schema pode não estar disponível
            slowQueries = [{ message: 'performance_schema não disponível' }];
        }

        res.json({
            success: true,
            data: {
                slowQueries,
                recommendations: [
                    'Executar EXPLAIN em queries lentas',
                    'Verificar índices com SHOW INDEX',
                    'Analisar tabelas com ANALYZE TABLE',
                    'Considerar cache para queries frequentes'
                ]
            }
        });
    } catch (error) {
        logger.error('Error getting query metrics:', error);
        next(error);
    }
}

/**
 * POST /api/metrics/reset
 * Reseta métricas (requer admin)
 */
export async function resetMetrics(req, res, next) {
    try {
        if (req.user?.level < 5) {
            return res.status(403).json({
                success: false,
                error: { message: 'Acesso negado' }
            });
        }

        performanceMetrics = {
            requests: 0,
            totalResponseTime: 0,
            slowQueries: 0,
            errors: 0,
            startTime: Date.now()
        };

        cacheMetrics = {
            hits: 0,
            misses: 0,
            sets: 0,
            invalidations: 0
        };

        res.json({
            success: true,
            message: 'Métricas resetadas'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/metrics/health
 * Health check endpoint
 */
export async function healthCheck(req, res) {
    const checks = {
        api: 'ok',
        database: 'unknown',
        cache: 'unknown'
    };

    try {
        await db().execute('SELECT 1');
        checks.database = 'ok';
    } catch (e) {
        checks.database = 'error';
    }

    const redis = getRedis();
    checks.cache = redis ? 'ok' : 'unavailable';

    const allOk = checks.api === 'ok' && checks.database === 'ok';

    res.status(allOk ? 200 : 503).json({
        status: allOk ? 'healthy' : 'degraded',
        checks,
        timestamp: new Date().toISOString()
    });
}

// ============ HELPERS ============

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
}

function formatMemoryUsage() {
    const used = process.memoryUsage();
    return {
        rss: formatBytes(used.rss),
        heapTotal: formatBytes(used.heapTotal),
        heapUsed: formatBytes(used.heapUsed),
        external: formatBytes(used.external)
    };
}

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function parseRedisInfo(info) {
    const result = {};
    const lines = info.split('\r\n');
    for (const line of lines) {
        if (line && !line.startsWith('#')) {
            const [key, value] = line.split(':');
            if (key && value) {
                result[key] = value;
            }
        }
    }
    return result;
}

function calculateHitRate(hits, misses) {
    const h = parseInt(hits) || 0;
    const m = parseInt(misses) || 0;
    const total = h + m;
    if (total === 0) return '0%';
    return ((h / total) * 100).toFixed(2) + '%';
}

export default {
    metricsMiddleware,
    getPerformanceMetrics,
    getCacheMetrics,
    getQueryMetrics,
    resetMetrics,
    healthCheck,
    recordCacheHit,
    recordCacheMiss
};
