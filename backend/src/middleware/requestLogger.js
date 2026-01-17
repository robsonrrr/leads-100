import logger from '../config/logger.js';
import { monitorRequest } from '../services/monitorService.js';

/**
 * Cria um child logger com requestId para rastreamento
 * @param {string} requestId - ID único da requisição
 */
export const createRequestLogger = (requestId) => {
    return logger.child({ requestId });
};

/**
 * Middleware para adicionar requestId, logger à requisição e monitorar performance
 */
export const requestLoggerMiddleware = (req, res, next) => {
    // Gerar requestId único
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    req.requestId = requestId;
    req.logger = createRequestLogger(requestId);

    // Log da requisição
    req.logger.info(`${req.method} ${req.originalUrl}`, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Log do tempo de resposta
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
        req.logger[logLevel](`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
            statusCode: res.statusCode,
            duration
        });

        // Monitoramento para Alertas (Q3 Bloco 1.4)
        monitorRequest(res.statusCode, duration);
    });

    next();
};
