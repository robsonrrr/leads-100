import jwt from 'jsonwebtoken';
import axios from 'axios';
import { Errors } from '../utils/AppError.js';
import logger from '../config/logger.js';

// Centralized auth service URL
const CSUITE_AUTH_URL = process.env.CSUITE_AUTH_URL || 'http://localhost:8050';

// Unified JWT secret (same as csuite-auth)
const JWT_SECRET = process.env.JWT_SECRET || 'csuite-unified-jwt-secret-2026-production';

/**
 * Middleware de autenticação obrigatória
 * Primeiro tenta validação local, depois csuite-auth
 */
export async function authenticateToken(req, res, next) {
  if (req.method === 'OPTIONS') {
    return next();
  }

  // ARIA Service-to-Service Auth: Check for internal service token
  const ariaServiceToken = req.headers['x-aria-service-token'];
  const ariaUserId = req.headers['x-aria-user-id'];
  const ARIA_SERVICE_SECRET = process.env.ARIA_SERVICE_SECRET || 'aria-internal-service-2026';

  if (ariaServiceToken && ariaServiceToken === ARIA_SERVICE_SECRET) {
    logger.debug('ARIA Service Auth: Accepting service token');
    req.user = {
      userId: parseInt(ariaUserId) || 1,
      seller_id: parseInt(ariaUserId) || 1,
      username: 'aria_service',
      nick: 'ARIA Voice Assistant',
      email: 'aria@csuite.internal',
      level: 5,  // High level for AI access
      source: 'aria'
    };
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(Errors.tokenRequired());
  }

  // DEV MODE: Accept mock tokens for development/testing
  if (process.env.NODE_ENV !== 'production' && token.startsWith('mock_jwt_token_')) {
    logger.debug('DEV MODE: Accepting mock token');
    req.user = {
      userId: 1,
      seller_id: 1,
      username: 'dev_user',
      nick: 'Dev User',
      email: 'dev@test.com',
      level: 5
    };
    return next();
  }

  // Try local JWT validation first (faster)
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (localError) {
    logger.debug('Local JWT validation failed, trying csuite-auth');
  }

  // Try csuite-auth service
  try {
    const response = await axios.post(`${CSUITE_AUTH_URL}/auth/validate`, { token }, {
      timeout: 2000
    });

    if (response.data.valid && response.data.user) {
      req.user = response.data.user;
      // Normalize user fields for compatibility
      req.user.userId = req.user.userId || req.user.id;
      return next();
    }

    return next(Errors.tokenInvalid());

  } catch (authError) {
    logger.warn('csuite-auth validation failed:', authError.message);
    return next(Errors.tokenInvalid());
  }
}

/**
 * Middleware de autenticação opcional
 * Se o token existir e for válido, adiciona user ao request
 * NUNCA deve lançar erro - apenas prossegue sem autenticação se token inválido
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    // DEV MODE: Accept mock tokens
    if (process.env.NODE_ENV !== 'production' && token.startsWith('mock_jwt_token_')) {
      req.user = {
        userId: 1,
        seller_id: 1,
        username: 'dev_user',
        nick: 'Dev User',
        email: 'dev@test.com',
        level: 5
      };
      return next();
    }

    // Try local validation first
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (e) {
      // Try csuite-auth
      try {
        const response = await axios.post(`${CSUITE_AUTH_URL}/auth/validate`, { token }, { timeout: 2000 });
        if (response.data.valid && response.data.user) {
          req.user = response.data.user;
          req.user.userId = req.user.userId || req.user.id;
        }
      } catch (authError) {
        // Ignore - it's optional
      }
    }

    next();
  } catch (error) {
    // Any error is silenced - optional means optional
    next();
  }
}

/**
 * Middleware para verificar nível de permissão
 * @param {number} minLevel - Nível mínimo requerido (quanto maior, mais permissões)
 */
export function requireLevel(minLevel) {
  return (req, res, next) => {
    if (!req.user) {
      return next(Errors.unauthorized());
    }

    const userLevel = req.user.level || 0;

    if (userLevel < minLevel) {
      return next(Errors.insufficientPermissions());
    }

    next();
  };
}

/**
 * Middleware para verificar se usuário é admin (level > 4)
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return next(Errors.unauthorized());
  }

  const userLevel = req.user.level || 0;

  if (userLevel <= 4) {
    return next(Errors.insufficientPermissions('acesso administrativo'));
  }

  next();
}

/**
 * Middleware para verificar se usuário pode acessar recurso
 * Admins podem ver tudo, usuários comuns só veem seus próprios recursos
 */
export function checkResourceAccess(ownerIdField = 'userId') {
  return (req, res, next) => {
    if (!req.user) {
      return next(Errors.unauthorized());
    }

    const userLevel = req.user.level || 0;

    // Admins podem acessar qualquer recurso
    if (userLevel > 4) {
      return next();
    }

    // Usuários comuns só podem acessar seus próprios recursos
    // O campo de owner será verificado no controller/repository
    req.restrictToOwner = true;
    req.ownerId = req.user.userId;

    next();
  };
}

export default { authenticateToken, optionalAuth, requireLevel, requireAdmin, checkResourceAccess };
