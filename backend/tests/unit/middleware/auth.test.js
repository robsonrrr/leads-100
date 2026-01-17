/**
 * Testes unitários para middleware de autenticação
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import jwt from 'jsonwebtoken'
import { authenticateToken, requireLevel, requireAdmin } from '../../../src/middleware/auth.js'

// Mock do JWT secret
const JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
process.env.JWT_SECRET = JWT_SECRET

describe('Auth Middleware', () => {
  let mockReq
  let mockRes
  let mockNext

  beforeEach(() => {
    mockReq = {
      headers: {},
      user: null
    }
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }
    mockNext = jest.fn()
  })

  describe('authenticateToken', () => {
    it('deve chamar next com erro quando não há token', () => {
      authenticateToken(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
        code: 'TOKEN_REQUIRED'
      }))
    })

    it('deve chamar next com erro para token inválido', () => {
      mockReq.headers['authorization'] = 'Bearer invalid-token'
      
      authenticateToken(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: expect.any(Number)
      }))
    })

    it('deve chamar next com erro para token expirado', () => {
      // Criar token expirado
      const expiredToken = jwt.sign(
        { userId: 1, username: 'test' },
        JWT_SECRET,
        { expiresIn: '-1h' } // Expirado há 1 hora
      )
      mockReq.headers['authorization'] = `Bearer ${expiredToken}`
      
      authenticateToken(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
        code: 'TOKEN_EXPIRED'
      }))
    })

    it('deve adicionar user ao request para token válido', () => {
      const validToken = jwt.sign(
        { userId: 1, username: 'admin', level: 1 },
        JWT_SECRET,
        { expiresIn: '1h' }
      )
      mockReq.headers['authorization'] = `Bearer ${validToken}`
      
      authenticateToken(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalledWith()
      expect(mockReq.user).toBeDefined()
      expect(mockReq.user.userId).toBe(1)
      expect(mockReq.user.username).toBe('admin')
    })

    it('deve retornar erro quando header não tem Bearer prefix', () => {
      mockReq.headers['authorization'] = 'invalid-format'
      
      authenticateToken(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401
      }))
    })
  })

  describe('requireLevel', () => {
    it('deve passar quando user tem nível menor ou igual ao requerido', () => {
      mockReq.user = { userId: 1, level: 2 }
      
      const middleware = requireLevel(5)
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('deve bloquear quando user tem nível maior que o requerido', () => {
      mockReq.user = { userId: 1, level: 10 }
      
      const middleware = requireLevel(5)
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 403,
        code: 'INSUFFICIENT_PERMISSIONS'
      }))
    })

    it('deve chamar next com erro quando não há user', () => {
      mockReq.user = null
      
      const middleware = requireLevel(5)
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401
      }))
    })
  })

  describe('requireAdmin', () => {
    it('deve passar para usuário com nível 1', () => {
      mockReq.user = { userId: 1, level: 1 }
      
      requireAdmin(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('deve passar para usuário com nível 2', () => {
      mockReq.user = { userId: 1, level: 2 }
      
      requireAdmin(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('deve bloquear usuário com nível maior que 4', () => {
      mockReq.user = { userId: 1, level: 5 }
      
      requireAdmin(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 403
      }))
    })
  })
})
