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
 * Retorna análise de queries críticas com EXPLAIN
 */
export async function getQueryMetrics(req, res, next) {
    try {
        // Verificar nível de acesso (admin apenas)
        if (req.user?.level >= 5) {
            return res.status(403).json({
                success: false,
                error: { message: 'Acesso negado - requer admin' }
            });
        }

        const analyses = [];

        // Query 1: Listagem de leads
        try {
            const [explain1] = await db().execute(`
                EXPLAIN SELECT s.cSCart, s.dCart, s.cCustomer, s.cSeller
                FROM mak.sCart s
                WHERE s.cSeller = 1 AND s.cType = 1
                ORDER BY s.dCart DESC
                LIMIT 20
            `);
            analyses.push({
                name: 'Listagem de leads por vendedor',
                query: 'SELECT ... FROM sCart WHERE cSeller = ? ORDER BY dCart DESC',
                explain: explain1[0] || {},
                usesIndex: explain1[0]?.key ? true : false,
                scanType: explain1[0]?.type || 'unknown',
                status: explain1[0]?.key ? '✅ OK' : '⚠️ Precisa de índice'
            });
        } catch (e) {
            analyses.push({ name: 'Listagem de leads', error: e.message });
        }

        // Query 2: Itens do lead
        try {
            const [explain2] = await db().execute(`
                EXPLAIN SELECT i.cCart, i.cProduct, i.qProduct
                FROM mak.icart i
                WHERE i.cSCart = 1
            `);
            analyses.push({
                name: 'Itens do lead',
                query: 'SELECT ... FROM icart WHERE cSCart = ?',
                explain: explain2[0] || {},
                usesIndex: explain2[0]?.key ? true : false,
                scanType: explain2[0]?.type || 'unknown',
                status: explain2[0]?.key ? '✅ OK' : '⚠️ Precisa de índice'
            });
        } catch (e) {
            analyses.push({ name: 'Itens do lead', error: e.message });
        }

        // Query 3: Clientes por vendedor
        try {
            const [explain3] = await db().execute(`
                EXPLAIN SELECT id, nome, cidade
                FROM mak.clientes
                WHERE vendedor = 1 AND bloqueado = 0 AND ativo = 1
                LIMIT 50
            `);
            analyses.push({
                name: 'Clientes por vendedor',
                query: 'SELECT ... FROM clientes WHERE vendedor = ? AND bloqueado = 0',
                explain: explain3[0] || {},
                usesIndex: explain3[0]?.key ? true : false,
                scanType: explain3[0]?.type || 'unknown',
                status: explain3[0]?.key ? '✅ OK' : '⚠️ Precisa de índice'
            });
        } catch (e) {
            analyses.push({ name: 'Clientes por vendedor', error: e.message });
        }

        // Query 4: Busca de produtos
        try {
            const [explain4] = await db().execute(`
                EXPLAIN SELECT id, modelo, marca, nome
                FROM mak.inv
                WHERE marca = 'SKF' AND habilitado = '1'
                LIMIT 20
            `);
            analyses.push({
                name: 'Busca de produtos',
                query: 'SELECT ... FROM inv WHERE marca = ? AND habilitado = 1',
                explain: explain4[0] || {},
                usesIndex: explain4[0]?.key ? true : false,
                scanType: explain4[0]?.type || 'unknown',
                status: explain4[0]?.key ? '✅ OK' : '⚠️ Precisa de índice'
            });
        } catch (e) {
            analyses.push({ name: 'Busca de produtos', error: e.message });
        }

        // Query 5: Pedidos por vendedor
        try {
            const [explain5] = await db().execute(`
                EXPLAIN SELECT id, datae, valor
                FROM mak.hoje
                WHERE vendedor = 1
                ORDER BY datae DESC
                LIMIT 20
            `);
            analyses.push({
                name: 'Pedidos por vendedor',
                query: 'SELECT ... FROM hoje WHERE vendedor = ? ORDER BY datae DESC',
                explain: explain5[0] || {},
                usesIndex: explain5[0]?.key ? true : false,
                scanType: explain5[0]?.type || 'unknown',
                status: explain5[0]?.key ? '✅ OK' : '⚠️ Precisa de índice'
            });
        } catch (e) {
            analyses.push({ name: 'Pedidos por vendedor', error: e.message });
        }

        // Índices criados no Q3.1
        let indexReport = [];
        try {
            const [indexes] = await db().execute(`
                SELECT TABLE_NAME, INDEX_NAME, 
                       GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns
                FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = 'mak' AND INDEX_NAME LIKE 'idx_%'
                GROUP BY TABLE_NAME, INDEX_NAME
                ORDER BY TABLE_NAME
            `);
            indexReport = indexes;
        } catch (e) {
            indexReport = [{ error: e.message }];
        }

        // Resumo
        const usingIndex = analyses.filter(a => a.usesIndex).length;
        const total = analyses.filter(a => !a.error).length;

        res.json({
            success: true,
            data: {
                summary: {
                    queriesAnalyzed: total,
                    usingIndex,
                    needsOptimization: total - usingIndex,
                    score: total > 0 ? Math.round((usingIndex / total) * 100) + '%' : '0%'
                },
                analyses,
                indexesQ31: indexReport,
                recommendations: [
                    'Queries com type=ALL precisam de índice',
                    'Queries com type=ref ou range estão otimizadas',
                    'Executar ANALYZE TABLE após criar índices',
                    'Monitorar performance_schema para queries lentas'
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
