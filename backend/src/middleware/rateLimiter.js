import logger from '../config/logger.js';

/**
 * Rate Limiting DESATIVADO
 * 
 * Os rate limiters foram desativados porque estavam causando problemas
 * com múltiplos usuários atrás do mesmo IP (proxy/container).
 * 
 * Se precisar reativar, descomente o código original abaixo.
 */

// Middleware passthrough - não bloqueia nada
const passthrough = (req, res, next) => next();

// Rate limiters desativados - apenas passthrough
export const generalLimiter = passthrough;
export const authLimiter = passthrough;
export const writeLimiter = passthrough;
export const searchLimiter = passthrough;
export const pollingLimiter = passthrough;
export const createRateLimiter = () => passthrough;

export default {
  generalLimiter,
  authLimiter,
  writeLimiter,
  searchLimiter,
  pollingLimiter,
  createRateLimiter
};

/*
// ==========================================
// CÓDIGO ORIGINAL (DESATIVADO)
// ==========================================

import rateLimit from 'express-rate-limit';

const RATE_LIMIT_CONFIG = {
  general: {
    windowMs: 15 * 60 * 1000,
    max: 5000,
    message: 'Muitas requisições. Tente novamente em alguns minutos.'
  },
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  write: {
    windowMs: 1 * 60 * 1000,
    max: 200,
    message: 'Muitas operações de escrita. Aguarde um momento.'
  },
  search: {
    windowMs: 1 * 60 * 1000,
    max: 300,
    message: 'Muitas buscas. Aguarde um momento.'
  },
  polling: {
    windowMs: 1 * 60 * 1000,
    max: 600,
    message: 'Polling muito frequente. Reduza a frequência.'
  }
};

const keyGenerator = (req) => {
  if (req.user?.userId) {
    return `user:${req.user.userId}`;
  }
  return `ip:${req.ip}`;
};

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

export const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.general.windowMs,
  max: RATE_LIMIT_CONFIG.general.max,
  keyGenerator,
  handler: createLimitHandler('general'),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (req.method === 'OPTIONS') return true;
    return req.path === '/health' || req.path === '/api/health';
  }
});

export const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.auth.windowMs,
  max: RATE_LIMIT_CONFIG.auth.max,
  keyGenerator: (req) => req.ip,
  handler: createLimitHandler('auth'),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

export const writeLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.write.windowMs,
  max: RATE_LIMIT_CONFIG.write.max,
  keyGenerator,
  handler: createLimitHandler('write'),
  standardHeaders: true,
  legacyHeaders: false
});

export const searchLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.search.windowMs,
  max: RATE_LIMIT_CONFIG.search.max,
  keyGenerator,
  handler: createLimitHandler('search'),
  standardHeaders: true,
  legacyHeaders: false
});

export const pollingLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.polling.windowMs,
  max: RATE_LIMIT_CONFIG.polling.max,
  keyGenerator,
  handler: createLimitHandler('polling'),
  standardHeaders: true,
  legacyHeaders: false
});

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
*/
