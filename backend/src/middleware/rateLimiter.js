import rateLimit from 'express-rate-limit';
import logger from '../config/logger.js';

/**
 * Configurações de rate limiting
 */
const RATE_LIMIT_CONFIG = {
  // Limite geral da API (aumentado para ambiente com proxy/container compartilhando IP)
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5000, // 5000 requisições por janela (considerando múltiplos usuários no mesmo IP)
    message: 'Muitas requisições. Tente novamente em alguns minutos.'
  },
  // Limite para autenticação (mais restritivo para prevenir brute force)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // 50 tentativas por janela (múltiplos usuários)
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  // Limite para operações de escrita (POST, PUT, DELETE)
  write: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 200, // 200 operações por minuto
    message: 'Muitas operações de escrita. Aguarde um momento.'
  },
  // Limite para busca/autocomplete
  search: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 300, // 300 buscas por minuto
    message: 'Muitas buscas. Aguarde um momento.'
  }
};

/**
 * Função para extrair chave do rate limit
 * Usa userId se autenticado, senão usa IP
 */
const keyGenerator = (req) => {
  if (req.user?.userId) {
    return `user:${req.user.userId}`;
  }
  return `ip:${req.ip}`;
};

/**
 * Handler para quando limite é excedido
 */
const createLimitHandler = (type) => (req, res, options) => {
  logger.warn('Rate limit exceeded', {
    type,
    key: keyGenerator(req),
    ip: req.ip,
    userId: req.user?.userId,
    path: req.originalUrl,
    method: req.method
  });

  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: options.message,
      retryAfter: Math.ceil(options.windowMs / 1000)
    }
  });
};

/**
 * Rate limiter geral para toda a API
 */
export const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.general.windowMs,
  max: RATE_LIMIT_CONFIG.general.max,
  keyGenerator,
  handler: createLimitHandler('general'),
  standardHeaders: true, // Retorna headers RateLimit-*
  legacyHeaders: false, // Desabilita headers X-RateLimit-*
  skip: (req) => {
    // Não aplicar rate limit em preflight requests (CORS)
    if (req.method === 'OPTIONS') return true;
    // Não aplicar rate limit em health checks
    return req.path === '/health' || req.path === '/api/health';
  }
});

/**
 * Rate limiter para autenticação (login)
 * Mais restritivo para prevenir brute force
 */
export const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.auth.windowMs,
  max: RATE_LIMIT_CONFIG.auth.max,
  keyGenerator: (req) => req.ip, // Usar apenas IP para auth
  handler: createLimitHandler('auth'),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false // Contar todas as tentativas
});

/**
 * Rate limiter para operações de escrita
 */
export const writeLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.write.windowMs,
  max: RATE_LIMIT_CONFIG.write.max,
  keyGenerator,
  handler: createLimitHandler('write'),
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter para buscas/autocomplete
 */
export const searchLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.search.windowMs,
  max: RATE_LIMIT_CONFIG.search.max,
  keyGenerator,
  handler: createLimitHandler('search'),
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Factory para criar rate limiter customizado
 * @param {Object} options - Opções do rate limit
 */
export const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 60 * 1000,
    max: options.max || 100,
    keyGenerator: options.keyGenerator || keyGenerator,
    handler: createLimitHandler(options.type || 'custom'),
    standardHeaders: true,
    legacyHeaders: false,
    skip: options.skip
  });
};

export default {
  generalLimiter,
  authLimiter,
  writeLimiter,
  searchLimiter,
  createRateLimiter
};
