import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { getDatabase } from '../config/database.js';
import { cacheGet, cacheSet, cacheDelete } from '../config/redis.js';
import { Errors } from '../utils/AppError.js';
import { auditLog } from '../services/auditLog.service.js';
import logger from '../config/logger.js';

const db = () => getDatabase();

// Login - integra com sistema legado
export async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return next(Errors.validation([
        { field: 'username', message: 'Username é obrigatório' },
        { field: 'password', message: 'Password é obrigatória' }
      ].filter((_, i) => i === 0 ? !username : !password)));
    }

    // Buscar usuário no banco (tabela users do sistema legado)
    const [users] = await db().execute(
      'SELECT id, user, newpassword as password, password_bcrypt, nick, email, level as nivel, depto, segmento, empresa, password_version, two_factor_enabled, two_factor_secret FROM users WHERE user = ? OR email = ? OR email_interno = ? LIMIT 1',
      [username, username, username]
    );

    if (users.length === 0) {
      // Log tentativa de login falha
      await auditLog.logLogin(null, username, req, false);
      return next(Errors.unauthorized('Credenciais inválidas'));
    }

    const user = users[0];
    let isValidPassword = false;
    let needsMigration = false;

    // 1. Tentar Bcrypt primeiro se disponível (coluna dedicada)
    if (user.password_bcrypt) {
      isValidPassword = await bcrypt.compare(password, user.password_bcrypt);
    }

    // 2. Se falhar ou não tiver bcrypt, tentar MD5 Legado
    if (!isValidPassword) {
      const crypto = await import('crypto');
      const passwordHash = crypto.createHash('md5').update(password).digest('hex');
      isValidPassword = user.password.toLowerCase() === passwordHash.toLowerCase();

      // Fallback manual (texto plano)
      if (!isValidPassword) {
        isValidPassword = user.password === password;
      }

      if (isValidPassword) {
        needsMigration = true;
      }
    }

    // 3. Fallback de transição: se a flag era BCRYPT mas o hash estava em newpassword (erro da versão anterior)
    if (!isValidPassword && user.password_version === 'BCRYPT' && user.password) {
      try {
        isValidPassword = await bcrypt.compare(password, user.password);
        if (isValidPassword) {
          needsMigration = true;
        }
      } catch (err) { }
    }

    if (!isValidPassword) {
      // Log tentativa de login falha
      await auditLog.logLogin(user.id, user.user, req, false);
      return next(Errors.unauthorized('Credenciais inválidas'));
    }

    // 4. Auto-migração para Bcrypt (Q1 2026) - Armazena em coluna separada para manter MD5 legado!
    if (needsMigration) {
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(password, salt);
      // Mantemos o newpassword original e salvamos o novo no password_bcrypt
      await db().execute(
        'UPDATE rolemak_users SET password_bcrypt = ?, password_version = "BCRYPT", last_password_change = NOW() WHERE id = ?',
        [newHash, user.id]
      );
      logger.info(`User ${user.user} migrated to BCRYPT (Hybrid Mode)`);
    }

    // 4. Verificar 2FA (Q1 2026)
    const isAdmin = (user.nivel || user.level) > 4;
    let needs2FASetup = false;

    if (isAdmin && !user.two_factor_secret) {
      needs2FASetup = true;
    }

    if (user.two_factor_enabled || isAdmin) {
      if (user.two_factor_enabled && !req.body.twoFactorToken) {
        return res.json({
          success: true,
          requires2FA: true,
          tempToken: jwt.sign({ userId: user.id, is2FAStage: true }, process.env.JWT_SECRET, { expiresIn: '5m' })
        });
      }

      if (user.two_factor_enabled && req.body.twoFactorToken) {
        const verified = speakeasy.totp.verify({
          secret: user.two_factor_secret,
          encoding: 'base32',
          token: req.body.twoFactorToken
        });

        if (!verified) {
          return next(Errors.unauthorized('Token 2FA inválido'));
        }
      }
    }

    // Gerar tokens
    const accessToken = jwt.sign(
      {
        userId: user.id,
        username: user.user,
        level: user.nivel || user.level,
        depto: user.depto,
        segmento: user.segmento
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    // Salvar refresh token no cache
    await cacheSet(`refresh_token:${user.id}`, refreshToken, 7 * 24 * 60 * 60);

    // Log login bem-sucedido
    await auditLog.logLogin(user.id, user.user, req, true);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.user,
          nick: user.nick,
          email: user.email,
          level: user.nivel,
          depto: user.depto,
          segmento: user.segmento,
          empresa: user.empresa,
          needs2FASetup
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
}

// Refresh token
export async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: { message: 'Refresh token is required' }
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Verificar se o token está no cache
    const cachedToken = await cacheGet(`refresh_token:${decoded.userId}`);
    if (cachedToken !== refreshToken) {
      return res.status(403).json({
        success: false,
        error: { message: 'Invalid refresh token' }
      });
    }

    // Gerar novo access token
    const [users] = await db().execute(
      'SELECT id, user, level as nivel, depto, segmento FROM users WHERE id = ? LIMIT 1',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    const user = users[0];
    const accessToken = jwt.sign(
      {
        userId: user.id,
        username: user.user,
        level: user.nivel,
        depto: user.depto,
        segmento: user.segmento
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      data: { accessToken }
    });
  } catch (error) {
    next(error);
  }
}

// Get current user
export async function getCurrentUser(req, res, next) {
  try {
    const [users] = await db().execute(
      'SELECT id, user, nick, email, email_interno, level as nivel, depto, cargo, segmento, empresa, two_factor_enabled FROM users WHERE id = ? LIMIT 1',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    res.json({
      success: true,
      data: { user: users[0] }
    });
  } catch (error) {
    next(error);
  }
}

// Logout
export async function logout(req, res, next) {
  try {
    // Remover refresh token do cache
    await cacheDelete(`refresh_token:${req.user.userId}`);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
}

// Setup 2FA - Gerar segredo e QR Code
export async function setup2FA(req, res, next) {
  try {
    const user = req.user;
    const secret = speakeasy.generateSecret({
      name: `LeadsAgent:${user.username}`
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    await db().execute(
      'UPDATE rolemak_users SET two_factor_secret = ? WHERE id = ?',
      [secret.base32, user.userId]
    );

    res.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl
      }
    });
  } catch (error) {
    next(error);
  }
}

// Enable 2FA - Verificar e ativar
export async function enable2FA(req, res, next) {
  try {
    const { token } = req.body;
    const userId = req.user.userId;

    const [users] = await db().execute(
      'SELECT two_factor_secret FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0 || !users[0].two_factor_secret) {
      return next(Errors.validation([{ field: 'token', message: 'Setup 2FA não iniciado' }]));
    }

    const verified = speakeasy.totp.verify({
      secret: users[0].two_factor_secret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      return next(Errors.unauthorized('Token 2FA inválido'));
    }

    await db().execute(
      'UPDATE rolemak_users SET two_factor_enabled = 1 WHERE id = ?',
      [userId]
    );

    await auditLog.logEvent('2FA_ENABLED', userId, req.user.username, 'Usuário habilitou 2FA', req);

    res.json({
      success: true,
      message: '2FA habilitado com sucesso'
    });
  } catch (error) {
    next(error);
  }
}

export async function disable2FA(req, res, next) {
  try {
    const { token } = req.body;
    const userId = req.user.userId;

    const [users] = await db().execute(
      'SELECT two_factor_secret FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) return next(Errors.unauthorized());

    const verified = speakeasy.totp.verify({
      secret: users[0].two_factor_secret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      return next(Errors.unauthorized('Token 2FA inválido para desativação'));
    }

    await db().execute(
      'UPDATE rolemak_users SET two_factor_enabled = 0, two_factor_secret = NULL WHERE id = ?',
      [userId]
    );

    await auditLog.logEvent('2FA_DISABLED', userId, req.user.username, 'Usuário desabilitou 2FA', req);

    res.json({
      success: true,
      message: '2FA desabilitado com sucesso'
    });
  } catch (error) {
    next(error);
  }
}
