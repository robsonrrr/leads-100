import jwt from 'jsonwebtoken';
import { Errors } from '../utils/AppError.js';

/**
 * Middleware de autenticação obrigatória
 * Verifica se o token JWT é válido
 */
export function authenticateToken(req, res, next) {
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return next(Errors.tokenRequired());
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return next(Errors.tokenInvalid());
      }
      return next(Errors.tokenInvalid());
    }

    req.user = user;
    next();
  });
}

/**
 * Middleware de autenticação opcional
 * Se o token existir e for válido, adiciona user ao request
 * NUNCA deve lançar erro - apenas prossegue sem autenticação se token inválido
 */
export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (!err && user) {
          req.user = user;
        }
        // Se erro ou token inválido, simplesmente não define req.user
        next();
      });
    } else {
      next();
    }
  } catch (error) {
    // Qualquer erro é silenciado - opcional significa opcional
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
