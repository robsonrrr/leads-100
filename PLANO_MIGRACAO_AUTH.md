# 📋 Plano de Migração: Leads Agent → CSuite Auth

**Data:** 2026-01-27  
**Versão:** 1.0  
**Responsável:** AI Assistant  
**Referência:** seller-cockpit e manager-cockpit (já migrados)

---

## 🎯 Objetivo

Migrar o sistema de autenticação do **Leads Agent** para usar o serviço centralizado **csuite-auth**, mantendo compatibilidade com o sistema atual durante a transição.

---

## 📊 Análise Atual

### Leads Agent (Atual)
| Aspecto | Implementação |
|---------|---------------|
| **Middleware** | `src/middleware/auth.js` - Validação JWT local |
| **Controller** | `src/controllers/auth.controller.js` - Login, refresh, 2FA local |
| **Routes** | `src/routes/auth.routes.js` - Endpoints próprios |
| **JWT Secret** | `process.env.JWT_SECRET` (local) |
| **2FA** | Implementação local com speakeasy |
| **Password** | MD5→bcrypt migration local |

### CSuite Auth (Centralizado)
| Aspecto | Implementação |
|---------|---------------|
| **URL** | `http://localhost:8050` (dev) / `http://csuite-auth:8050` (prod) |
| **Endpoints** | `/auth/login`, `/auth/refresh`, `/auth/validate`, `/auth/me`, `/auth/logout` |
| **2FA** | Centralizado |
| **Password** | MD5→bcrypt migration centralizado |
| **Redis** | Refresh tokens + blacklist |

### Seller Cockpit (Referência - Já Migrado)
```
seller-cockpit/backend/src/
├── middleware/auth.middleware.js  ← Validação híbrida (local + csuite-auth)
├── services/auth.service.js       ← Proxy para csuite-auth com fallback
└── routes/auth.routes.js          ← Proxy para csuite-auth
```

---

## 📁 Arquivos a Modificar

| Arquivo | Ação | Prioridade |
|---------|------|------------|
| `src/middleware/auth.js` | **SUBSTITUIR** por versão híbrida | 🔴 Alta |
| `src/controllers/auth.controller.js` | **SUBSTITUIR** por proxy para csuite-auth | 🔴 Alta |
| `src/services/auth.service.js` | **CRIAR** (novo arquivo) | 🔴 Alta |
| `src/routes/auth.routes.js` | **MANTER** (mesmos endpoints) | 🟡 Média |
| `.env` | **ADICIONAR** CSUITE_AUTH_URL | 🔴 Alta |
| `package.json` | **VERIFICAR** axios está instalado | 🟢 Baixa |

---

## 🔧 Implementação Passo a Passo

### Fase 1: Preparação (5 min)

#### 1.1 Adicionar variável de ambiente

```bash
# .env
CSUITE_AUTH_URL=http://localhost:8050
# Em produção: http://csuite-auth:8050
```

#### 1.2 Verificar dependências

```bash
cd leads-agent/backend
npm list axios
# Se não instalado:
npm install axios
```

---

### Fase 2: Criar Auth Service (15 min)

Criar arquivo `src/services/auth.service.js`:

```javascript
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
                            empresa: response.data.data.user.empresa
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
            // If csuite-auth is down, fall back to local auth
            if (authError.response?.status === 401) {
                return { success: false, error: 'Credenciais inválidas' };
            }

            logger.warn('csuite-auth unavailable, falling back to local auth');
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
                    empresa: user.empresa
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

    // Try csuite-auth /auth/me
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
            if (decoded.type !== 'refresh') {
                return { success: false, error: 'Token inválido' };
            }

            const [users] = await db().execute(
                'SELECT id, user, level as nivel, depto, segmento FROM users WHERE id = ? LIMIT 1',
                [decoded.userId]
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

            return { success: true, data: { accessToken } };
        } catch (e) {
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
        return { success: false, error: 'Erro ao desabilitar 2FA' };
    }
}

export { JWT_SECRET, CSUITE_AUTH_URL };
```

---

### Fase 3: Atualizar Middleware (10 min)

Substituir `src/middleware/auth.js`:

```javascript
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

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next(Errors.tokenRequired());
    }

    // DEV MODE: Accept mock tokens
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
            // Normalize user fields
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
 */
export async function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next();
    }

    // Try local validation
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
}

/**
 * Middleware para verificar nível de permissão
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
 * Middleware para verificar acesso ao recurso
 */
export function checkResourceAccess(ownerIdField = 'userId') {
    return (req, res, next) => {
        if (!req.user) {
            return next(Errors.unauthorized());
        }

        const userLevel = req.user.level || 0;

        if (userLevel > 4) {
            return next();
        }

        req.restrictToOwner = true;
        req.ownerId = req.user.userId;

        next();
    };
}

export default { authenticateToken, optionalAuth, requireLevel, requireAdmin, checkResourceAccess };
```

---

### Fase 4: Atualizar Controller (10 min)

Substituir `src/controllers/auth.controller.js`:

```javascript
import * as authService from '../services/auth.service.js';
import { auditLog } from '../services/auditLog.service.js';
import { Errors } from '../utils/AppError.js';

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
        next(error);
    }
}

/**
 * Get current user - proxies to csuite-auth
 */
export async function getCurrentUser(req, res, next) {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const result = await authService.getUserFromToken(token);

        if (!result.success) {
            return res.status(401).json(result);
        }

        res.json({ success: true, data: { user: result.data } });
    } catch (error) {
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
        
        if (result.success) {
            await auditLog.logEvent('2FA_ENABLED', req.user.userId, req.user.username, 'Usuário habilitou 2FA', req);
        }
        
        res.json(result);
    } catch (error) {
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
        
        if (result.success) {
            await auditLog.logEvent('2FA_DISABLED', req.user.userId, req.user.username, 'Usuário desabilitou 2FA', req);
        }
        
        res.json(result);
    } catch (error) {
        next(error);
    }
}
```

---

### Fase 5: Atualizar .env (2 min)

```bash
# Adicionar ao .env
CSUITE_AUTH_URL=http://localhost:8050

# Garantir mesmo JWT_SECRET que csuite-auth
JWT_SECRET=csuite-unified-jwt-secret-2026-production
```

---

## ✅ Checklist de Validação

### Testes Funcionais
- [ ] Login funciona via csuite-auth
- [ ] Login funciona via fallback local (quando csuite-auth offline)
- [ ] Refresh token funciona
- [ ] GET /auth/me retorna dados corretos
- [ ] Logout funciona
- [ ] 2FA setup funciona
- [ ] 2FA enable/disable funciona
- [ ] Token do seller-cockpit funciona no leads-agent
- [ ] Token do leads-agent funciona no seller-cockpit

### Testes de Fallback
- [ ] Parar csuite-auth e testar login local
- [ ] Verificar logs de fallback

### Testes de Performance
- [ ] Validação local < 5ms
- [ ] Validação via csuite-auth < 100ms

---

## 📋 Ordem de Execução

```
1. [Backup] Fazer backup dos arquivos atuais
2. [Env] Adicionar CSUITE_AUTH_URL ao .env
3. [Service] Criar auth.service.js
4. [Middleware] Atualizar auth.js
5. [Controller] Atualizar auth.controller.js
6. [Test] Testar login
7. [Test] Testar refresh
8. [Test] Testar cross-app token
9. [Deploy] Deploy para dev
10. [Monitor] Monitorar logs por 24h
```

---

## ⚠️ Rollback Plan

Se algo der errado:

1. Restaurar arquivos de backup
2. Remover CSUITE_AUTH_URL do .env
3. Reiniciar backend

---

## 📊 Estimativa de Tempo

| Fase | Tempo |
|------|-------|
| Preparação | 5 min |
| Auth Service | 15 min |
| Middleware | 10 min |
| Controller | 10 min |
| Testes | 20 min |
| **Total** | **~60 min** |

---

## 🔗 Referências

- `csuite-auth/README.md` - Documentação do serviço
- `seller-cockpit/backend/src/services/auth.service.js` - Implementação de referência
- `seller-cockpit/backend/src/middleware/auth.middleware.js` - Middleware de referência

---

**Última Atualização:** 2026-01-27 23:15  
**Status:** Pronto para execução
