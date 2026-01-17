/**
 * Testes de integração para rotas de autenticação
 */
import request from 'supertest'
import express from 'express'
import jwt from 'jsonwebtoken'
import { testUsers } from '../fixtures/index.js'

// Mock do database antes de importar as rotas
jest.mock('../../src/config/database.js', () => {
  const mockPool = {
    promise: () => ({
      query: jest.fn(),
      execute: jest.fn(),
      getConnection: jest.fn().mockResolvedValue({
        query: jest.fn(),
        release: jest.fn()
      })
    })
  }
  return { pool: mockPool }
})

// Mock do Redis
jest.mock('../../src/config/redis.js', () => ({
  redisClient: {
    isReady: true,
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1)
  }
}))

// Mock do logger
jest.mock('../../src/config/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  },
  requestLoggerMiddleware: (req, res, next) => {
    req.requestId = 'test-id'
    req.logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
    next()
  }
}))

// Mock do audit log
jest.mock('../../src/services/auditLog.service.js', () => ({
  auditLog: {
    logLogin: jest.fn().mockResolvedValue(undefined),
    log: jest.fn().mockResolvedValue(undefined)
  }
}))

// Agora importar as dependências
import { pool } from '../../src/config/database.js'
import authRoutes from '../../src/routes/auth.routes.js'
import { errorHandler } from '../../src/middleware/errorHandler.js'

const JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
process.env.JWT_SECRET = JWT_SECRET
process.env.JWT_EXPIRES_IN = '1h'
process.env.JWT_REFRESH_EXPIRES_IN = '7d'

describe('Auth Routes - Integration Tests', () => {
  let app

  beforeAll(() => {
    app = express()
    app.use(express.json())
    app.use('/api/auth', authRoutes)
    app.use(errorHandler)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/login', () => {
    it('deve retornar 400 para credenciais vazias', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
      
      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('deve retornar 400 quando username está vazio', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'test123' })
      
      expect(response.status).toBe(400)
    })

    it('deve retornar 400 quando password está vazio', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin' })
      
      expect(response.status).toBe(400)
    })

    it('deve retornar 401 para usuário não encontrado', async () => {
      // Mock retorno vazio (usuário não existe)
      pool.promise().query.mockResolvedValueOnce([[], []])
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'invalid', password: 'test123' })
      
      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })

    it('deve retornar 401 para senha incorreta', async () => {
      // Mock retorno do usuário
      pool.promise().query.mockResolvedValueOnce([[testUsers[0]], []])
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrong-password' })
      
      expect(response.status).toBe(401)
    })

    it('deve retornar token para credenciais válidas', async () => {
      // Mock retorno do usuário com senha hasheada para 'password123'
      const userWithHash = {
        ...testUsers[0],
        pass: '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1BD7WC'
      }
      pool.promise().query.mockResolvedValueOnce([[userWithHash], []])
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'password123' })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('token')
      expect(response.body.data).toHaveProperty('refreshToken')
      expect(response.body.data).toHaveProperty('user')
    })
  })

  describe('GET /api/auth/me', () => {
    it('deve retornar 401 sem token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
      
      expect(response.status).toBe(401)
    })

    it('deve retornar 401 com token inválido', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
      
      expect(response.status).toBe(401)
    })

    it('deve retornar dados do usuário com token válido', async () => {
      const token = jwt.sign(
        { userId: 1, username: 'admin', level: 1 },
        JWT_SECRET,
        { expiresIn: '1h' }
      )
      
      // Mock retorno do usuário
      pool.promise().query.mockResolvedValueOnce([[testUsers[0]], []])
      
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id')
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('deve retornar 400 sem refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
      
      expect(response.status).toBe(400)
    })

    it('deve retornar novo token com refresh token válido', async () => {
      const refreshToken = jwt.sign(
        { userId: 1, username: 'admin', type: 'refresh' },
        JWT_SECRET,
        { expiresIn: '7d' }
      )
      
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('token')
    })
  })
})
