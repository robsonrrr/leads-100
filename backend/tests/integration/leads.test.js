/**
 * Testes de integração para rotas de leads
 */
import request from 'supertest'
import express from 'express'
import jwt from 'jsonwebtoken'
import { testLeads, testCustomers, testCartItems } from '../fixtures/index.js'

// Mock do database
jest.mock('../../src/config/database.js', () => {
  const mockPool = {
    promise: () => ({
      query: jest.fn(),
      execute: jest.fn(),
      getConnection: jest.fn().mockResolvedValue({
        query: jest.fn(),
        execute: jest.fn(),
        release: jest.fn(),
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn()
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
    logLeadCreate: jest.fn().mockResolvedValue(undefined),
    logLeadDelete: jest.fn().mockResolvedValue(undefined),
    logLeadConvert: jest.fn().mockResolvedValue(undefined),
    log: jest.fn().mockResolvedValue(undefined)
  }
}))

import { pool } from '../../src/config/database.js'
import leadsRoutes from '../../src/routes/leads.routes.js'
import { errorHandler } from '../../src/middleware/errorHandler.js'
import { authenticateToken } from '../../src/middleware/auth.js'

const JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
process.env.JWT_SECRET = JWT_SECRET

describe('Leads Routes - Integration Tests', () => {
  let app
  let authToken

  beforeAll(() => {
    app = express()
    app.use(express.json())
    app.use(authenticateToken) // Todas as rotas requerem auth
    app.use('/api/leads', leadsRoutes)
    app.use(errorHandler)

    // Gerar token válido para testes
    authToken = jwt.sign(
      { userId: 1, username: 'admin', level: 1 },
      JWT_SECRET,
      { expiresIn: '1h' }
    )
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/leads', () => {
    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app)
        .get('/api/leads')
      
      expect(response.status).toBe(401)
    })

    it('deve retornar lista de leads com autenticação', async () => {
      // Mock da query - retorna leads e contagem
      pool.promise().query
        .mockResolvedValueOnce([[{ total: 2 }], []]) // COUNT query
        .mockResolvedValueOnce([testLeads, []]) // SELECT query
      
      const response = await request(app)
        .get('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.pagination).toBeDefined()
    })

    it('deve aceitar parâmetros de paginação', async () => {
      pool.promise().query
        .mockResolvedValueOnce([[{ total: 50 }], []])
        .mockResolvedValueOnce([testLeads, []])
      
      const response = await request(app)
        .get('/api/leads')
        .query({ page: 2, limit: 10 })
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(response.status).toBe(200)
      expect(response.body.pagination.page).toBe(2)
    })

    it('deve filtrar por segmento', async () => {
      pool.promise().query
        .mockResolvedValueOnce([[{ total: 1 }], []])
        .mockResolvedValueOnce([[testLeads[0]], []])
      
      const response = await request(app)
        .get('/api/leads')
        .query({ cSegment: 'machines' })
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(response.status).toBe(200)
    })
  })

  describe('GET /api/leads/:id', () => {
    it('deve retornar 400 para ID inválido', async () => {
      const response = await request(app)
        .get('/api/leads/abc')
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('INVALID_ID')
    })

    it('deve retornar 404 para lead não encontrado', async () => {
      pool.promise().query.mockResolvedValueOnce([[], []])
      
      const response = await request(app)
        .get('/api/leads/99999')
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(response.status).toBe(404)
    })

    it('deve retornar lead existente', async () => {
      const leadWithDetails = {
        ...testLeads[0],
        customerName: testCustomers[0].name,
        sellerNick: 'Admin'
      }
      pool.promise().query.mockResolvedValueOnce([[leadWithDetails], []])
      
      const response = await request(app)
        .get('/api/leads/5001')
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(5001)
    })
  })

  describe('POST /api/leads', () => {
    it('deve retornar 400 para dados inválidos', async () => {
      const response = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}) // Dados vazios
      
      expect(response.status).toBe(400)
    })

    it('deve criar lead com dados válidos', async () => {
      const newLead = {
        customerId: 1001,
        cSegment: 'machines',
        nPaymentType: 2,
        nFreight: 1
      }
      
      // Mock da criação
      pool.promise().query.mockResolvedValueOnce([{ insertId: 6001 }, []])
      
      const response = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newLead)
      
      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('cSCart')
    })
  })

  describe('PUT /api/leads/:id', () => {
    it('deve retornar 400 para ID inválido', async () => {
      const response = await request(app)
        .put('/api/leads/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cLogUnity: 1 })
      
      expect(response.status).toBe(400)
    })

    it('deve atualizar lead existente', async () => {
      // Mock: verificar se lead existe
      pool.promise().query.mockResolvedValueOnce([[testLeads[0]], []])
      // Mock: atualizar lead
      pool.promise().query.mockResolvedValueOnce([{ affectedRows: 1 }, []])
      // Mock: retornar lead atualizado
      pool.promise().query.mockResolvedValueOnce([[{ ...testLeads[0], cLogUnity: 2 }], []])
      
      const response = await request(app)
        .put('/api/leads/5001')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cLogUnity: 2 })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })

  describe('DELETE /api/leads/:id', () => {
    it('deve fazer soft delete do lead', async () => {
      // Mock: verificar se lead existe
      pool.promise().query.mockResolvedValueOnce([[testLeads[0]], []])
      // Mock: soft delete
      pool.promise().query.mockResolvedValueOnce([{ affectedRows: 1 }, []])
      
      const response = await request(app)
        .delete('/api/leads/5001')
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('deve retornar 404 para lead inexistente', async () => {
      pool.promise().query.mockResolvedValueOnce([[], []])
      
      const response = await request(app)
        .delete('/api/leads/99999')
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/leads/:id/items', () => {
    it('deve retornar itens do carrinho', async () => {
      // Mock: verificar se lead existe
      pool.promise().query.mockResolvedValueOnce([[testLeads[0]], []])
      // Mock: buscar itens
      pool.promise().query.mockResolvedValueOnce([testCartItems, []])
      
      const response = await request(app)
        .get('/api/leads/5001/items')
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
    })
  })

  describe('POST /api/leads/:id/convert', () => {
    it('deve retornar erro se lead já foi convertido', async () => {
      // Lead já tem orderWeb (já convertido)
      pool.promise().query.mockResolvedValueOnce([[testLeads[1]], []])
      
      const response = await request(app)
        .post('/api/leads/5002/convert')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cTransporter: 101 })
      
      expect(response.status).toBe(409)
      expect(response.body.error.code).toBe('LEAD_ALREADY_CONVERTED')
    })
  })
})
