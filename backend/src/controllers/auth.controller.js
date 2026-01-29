/**
 * Auth Controller for Leads Agent
 * Proxies authentication requests to centralized csuite-auth service
 */
import * as authService from '../services/auth.service.js';
import { auditLog } from '../services/auditLog.service.js';
import { Errors } from '../utils/AppError.js';
import logger from '../config/logger.js';

/**
 * Login - proxies to csuite-auth
 */
export async function login(req, res, next) {
  try {
    const { username, password, twoFactorToken } = req.body;

    if (!username || !password) {
      return next(Errors.validation([
        { field: 'username', message: 'Username é obrigatório' },
        { field: 'password', message: 'Password é obrigatória' }
      ].filter((_, i) => i === 0 ? !username : !password)));
    }

    const result = await authService.login(username, password, twoFactorToken);

    // Audit log
    if (result.success && result.data?.user) {
      await auditLog.logLogin(result.data.user.id, username, req, true);
    } else if (!result.requires2FA) {
      await auditLog.logLogin(null, username, req, false);
    }

    if (!result.success) {
      return next(Errors.unauthorized(result.error));
    }

    res.json(result);
  } catch (error) {
    logger.error('Login controller error:', error);
    next(error);
  }
}

/**
 * Refresh token - proxies to csuite-auth
 */
export async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: { message: 'Refresh token is required' }
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('Refresh token controller error:', error);
    next(error);
  }
}

/**
 * Get current user - proxies to csuite-auth
 */
export async function getCurrentUser(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Token not provided' }
      });
    }

    const result = await authService.getUserFromToken(token);

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json({ success: true, data: { user: result.data } });
  } catch (error) {
    logger.error('Get current user controller error:', error);
    next(error);
  }
}

/**
 * Logout - proxies to csuite-auth
 */
export async function logout(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const result = await authService.logout(token);
    res.json(result);
  } catch (error) {
    logger.error('Logout controller error:', error);
    next(error);
  }
}

/**
 * Setup 2FA - proxies to csuite-auth
 */
export async function setup2FA(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const result = await authService.setup2FA(token);
    res.json(result);
  } catch (error) {
    logger.error('Setup 2FA controller error:', error);
    next(error);
  }
}

/**
 * Enable 2FA - proxies to csuite-auth
 */
export async function enable2FA(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const result = await authService.enable2FA(token, req.body.token);

    if (result.success && req.user) {
      await auditLog.logEvent('2FA_ENABLED', req.user.userId, req.user.username, 'Usuário habilitou 2FA', req);
    }

    res.json(result);
  } catch (error) {
    logger.error('Enable 2FA controller error:', error);
    next(error);
  }
}

/**
 * Disable 2FA - proxies to csuite-auth
 */
export async function disable2FA(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const result = await authService.disable2FA(token, req.body.token);

    if (result.success && req.user) {
      await auditLog.logEvent('2FA_DISABLED', req.user.userId, req.user.username, 'Usuário desabilitou 2FA', req);
    }

    res.json(result);
  } catch (error) {
    logger.error('Disable 2FA controller error:', error);
    next(error);
  }
}
