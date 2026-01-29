/**
 * Auth Service for Leads Agent
 * Proxies authentication to centralized csuite-auth service
 * Falls back to local validation when csuite-auth is unavailable
 */
import axios from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDatabase } from '../config/database.js';
import logger from '../config/logger.js';

const db = () => getDatabase();

// Centralized auth service URL
const CSUITE_AUTH_URL = process.env.CSUITE_AUTH_URL || 'http://localhost:8050';

// Unified JWT secret (same as csuite-auth)
const JWT_SECRET = process.env.JWT_SECRET || 'csuite-unified-jwt-secret-2026-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Login with username/password via csuite-auth
 */
export async function login(username, password, twoFactorToken = null) {
    try {
        // Try csuite-auth service first
        try {
            const response = await axios.post(`${CSUITE_AUTH_URL}/auth/login`, {
                username,
                password,
                twoFactorToken
            }, {
                timeout: 5000
            });

            if (response.data.success) {
                logger.info(`Login via csuite-auth: ${username}`);
                return {
                    success: true,
                    data: {
                        user: {
                            id: response.data.data.user.id,
                            seller_id: response.data.data.user.seller_id || response.data.data.user.id,
                            userId: response.data.data.user.id,
                            username: response.data.data.user.username,
                            nick: response.data.data.user.nick,
                            name: response.data.data.user.name || response.data.data.user.nick,
                            email: response.data.data.user.email,
                            level: response.data.data.user.level || 0,
                            depto: response.data.data.user.depto,
                            segmento: response.data.data.user.segmento,
                            empresa: response.data.data.user.empresa,
                            needs2FASetup: response.data.data.user.needs2FASetup || false
                        },
                        accessToken: response.data.data.accessToken,
                        refreshToken: response.data.data.refreshToken
                    }
                };
            }

            // 2FA required
            if (response.data.requires2FA) {
                return {
                    success: true,
                    requires2FA: true,
                    tempToken: response.data.tempToken
                };
            }

            return { success: false, error: response.data.error?.message || 'Credenciais inválidas' };

        } catch (authError) {
            // If csuite-auth returns 401, credentials are invalid
            if (authError.response?.status === 401) {
                return { success: false, error: 'Credenciais inválidas' };
            }

            // csuite-auth is down or unreachable, fall back to local auth
            logger.warn(`csuite-auth unavailable (${authError.message}), falling back to local auth`);
            return await loginLocal(username, password);
        }

    } catch (error) {
        logger.error('Login error:', error);
        return { success: false, error: 'Erro interno no servidor' };
    }
}

/**
 * Local login fallback (when csuite-auth is unavailable)
 */
export async function loginLocal(username, password) {
    try {
        const [users] = await db().execute(`
            SELECT 
                id, user, nick, email, email_interno,
                newpassword as password, password_bcrypt,
                level as nivel, depto, segmento, empresa,
                two_factor_enabled, two_factor_secret
            FROM users 
            WHERE user = ? OR email = ? OR email_interno = ? 
            LIMIT 1
        `, [username, username, username]);

        if (users.length === 0) {
            return { success: false, error: 'Credenciais inválidas' };
        }

        const user = users[0];
        let isValidPassword = false;
        let needsMigration = false;

        // 1. Try bcrypt first
        if (user.password_bcrypt) {
            isValidPassword = await bcrypt.compare(password, user.password_bcrypt);
        }

        // 2. Try MD5 (legacy)
        if (!isValidPassword && user.password) {
            const passwordHash = crypto.createHash('md5').update(password).digest('hex');
            isValidPassword = user.password.toLowerCase() === passwordHash.toLowerCase();

            // Fallback: plain text comparison
            if (!isValidPassword) {
                isValidPassword = user.password === password;
            }

            if (isValidPassword) {
                needsMigration = true;
            }
        }

        if (!isValidPassword) {
            return { success: false, error: 'Credenciais inválidas' };
        }

        // 3. Auto-migrate to bcrypt
        if (needsMigration) {
            try {
                const salt = await bcrypt.genSalt(10);
                const newHash = await bcrypt.hash(password, salt);
                await db().execute(
                    'UPDATE rolemak_users SET password_bcrypt = ?, password_version = "BCRYPT" WHERE id = ?',
                    [newHash, user.id]
                );
                logger.info(`User ${user.user} password migrated to bcrypt (local fallback)`);
            } catch (migrationError) {
                logger.error('Password migration error:', migrationError);
            }
        }

        // 4. Generate JWT (same format as csuite-auth)
        const tokenPayload = {
            userId: user.id,
            seller_id: user.id,
            username: user.user,
            nick: user.nick,
            email: user.email || user.email_interno,
            level: user.nivel || 0,
            depto: user.depto,
            segmento: user.segmento
        };

        const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        const refreshToken = jwt.sign({ userId: user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });

        logger.info(`Login local (fallback): ${user.user}`);

        return {
            success: true,
            data: {
                user: {
                    id: user.id,
                    userId: user.id,
                    seller_id: user.id,
                    username: user.user,
                    nick: user.nick,
                    name: user.nick || user.user,
                    email: user.email || user.email_interno,
                    level: user.nivel || 0,
                    depto: user.depto,
                    segmento: user.segmento,
                    empresa: user.empresa,
                    needs2FASetup: false
                },
                accessToken,
                refreshToken
            }
        };

    } catch (error) {
        logger.error('Local login error:', error);
        return { success: false, error: 'Erro interno no servidor' };
    }
}

/**
 * Validate JWT token (locally or via csuite-auth)
 */
export async function validateToken(token) {
    // Try local validation first (faster)
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return { valid: true, user: decoded };
    } catch (localError) {
        // Try csuite-auth if local fails
        try {
            const response = await axios.post(`${CSUITE_AUTH_URL}/auth/validate`, { token }, { timeout: 2000 });
            if (response.data.valid) {
                return { valid: true, user: response.data.user };
            }
        } catch (e) {
            // Both failed
        }
        return { valid: false, error: 'Token inválido ou expirado' };
    }
}

/**
 * Get user info from token
 */
export async function getUserFromToken(token) {
    const validation = await validateToken(token);
    if (!validation.valid) {
        return { success: false, error: validation.error };
    }

    // Try csuite-auth /auth/me for fresh data
    try {
        const response = await axios.get(`${CSUITE_AUTH_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 2000
        });

        if (response.data.success && response.data.data.user) {
            return { success: true, data: response.data.data.user };
        }
    } catch (e) {
        // Fallback to token data
    }

    // Fallback: return data from token
    return { success: true, data: validation.user };
}

/**
 * Refresh access token via csuite-auth
 */
export async function refreshAccessToken(refreshToken) {
    // Try csuite-auth first
    try {
        const response = await axios.post(`${CSUITE_AUTH_URL}/auth/refresh`, {
            refreshToken
        }, { timeout: 5000 });

        if (response.data.success) {
            return {
                success: true,
                data: {
                    accessToken: response.data.data.accessToken
                }
            };
        }

        return { success: false, error: 'Token inválido' };
    } catch (error) {
        // Fallback: validate locally and issue new token
        try {
            const decoded = jwt.verify(refreshToken, JWT_SECRET);

            // Check if it's a refresh token
            if (decoded.type !== 'refresh' && !decoded.userId) {
                return { success: false, error: 'Token inválido' };
            }

            const userId = decoded.userId || decoded.id;
            const [users] = await db().execute(
                'SELECT id, user, level as nivel, depto, segmento FROM users WHERE id = ? LIMIT 1',
                [userId]
            );

            if (users.length === 0) {
                return { success: false, error: 'Usuário não encontrado' };
            }

            const user = users[0];
            const accessToken = jwt.sign({
                userId: user.id,
                seller_id: user.id,
                username: user.user,
                level: user.nivel,
                depto: user.depto,
                segmento: user.segmento
            }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

            logger.info(`Token refreshed locally (fallback): ${user.user}`);
            return { success: true, data: { accessToken } };
        } catch (e) {
            logger.error('Local refresh token error:', e.message);
            return { success: false, error: 'Erro ao renovar token' };
        }
    }
}

/**
 * Logout via csuite-auth
 */
export async function logout(token) {
    try {
        await axios.post(`${CSUITE_AUTH_URL}/auth/logout`, {}, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 2000
        });
    } catch (e) {
        // Ignore errors - logout should always succeed
    }
    return { success: true, message: 'Logout realizado com sucesso' };
}

/**
 * 2FA Setup via csuite-auth
 */
export async function setup2FA(token) {
    try {
        const response = await axios.post(`${CSUITE_AUTH_URL}/auth/2fa/setup`, {}, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000
        });
        return response.data;
    } catch (error) {
        logger.error('2FA setup error:', error.message);
        return { success: false, error: 'Erro ao configurar 2FA' };
    }
}

/**
 * 2FA Enable via csuite-auth
 */
export async function enable2FA(token, twoFactorToken) {
    try {
        const response = await axios.post(`${CSUITE_AUTH_URL}/auth/2fa/enable`,
            { token: twoFactorToken },
            {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
            }
        );
        return response.data;
    } catch (error) {
        logger.error('2FA enable error:', error.message);
        return { success: false, error: 'Erro ao habilitar 2FA' };
    }
}

/**
 * 2FA Disable via csuite-auth
 */
export async function disable2FA(token, twoFactorToken) {
    try {
        const response = await axios.post(`${CSUITE_AUTH_URL}/auth/2fa/disable`,
            { token: twoFactorToken },
            {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
            }
        );
        return response.data;
    } catch (error) {
        logger.error('2FA disable error:', error.message);
        return { success: false, error: 'Erro ao desabilitar 2FA' };
    }
}

export { JWT_SECRET, CSUITE_AUTH_URL };
