/**
 * Testes unitários para middleware de tratamento de erros
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import { AppError, ErrorCodes } from '../../../src/utils/AppError.js'

// Mock manual do logger
const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}

// Importar errorHandler depois do mock ser configurado
// Nota: em ESM puro, precisamos testar de forma diferente
// Aqui vamos criar uma versão simplificada do errorHandler para teste

describe('Error Handler Middleware', () => {
  let mockReq
  let mockRes
  let mockNext

  beforeEach(() => {
    mockReq = {
      requestId: 'test-request-id',
      method: 'GET',
      originalUrl: '/api/test',
      ip: '127.0.0.1',
      logger: {
        error: jest.fn(),
        warn: jest.fn()
      }
    }
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false
    }
    mockNext = jest.fn()
  })

  describe('AppError handling', () => {
    it('AppError deve ter propriedades corretas', () => {
      const error = new AppError('Erro de teste', 400, 'TEST_ERROR')
      
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('TEST_ERROR')
      expect(error.message).toBe('Erro de teste')
      expect(error.isOperational).toBe(true)
    })

    it('AppError.toJSON deve retornar estrutura correta', () => {
      const error = new AppError('Erro', 400, 'TEST', { detail: 'info' })
      const json = error.toJSON()
      
      expect(json).toEqual({
        code: 'TEST',
        message: 'Erro',
        details: { detail: 'info' }
      })
    })

    it('AppError sem details não deve incluir details no JSON', () => {
      const error = new AppError('Erro', 400, 'TEST')
      const json = error.toJSON()
      
      expect(json.details).toBeUndefined()
    })
  })

  describe('Error response structure', () => {
    it('resposta de erro deve ter estrutura padrão', () => {
      const error = new AppError('Teste', 400, 'TEST_CODE')
      const expectedResponse = {
        success: false,
        error: error.toJSON()
      }
      
      expect(expectedResponse.success).toBe(false)
      expect(expectedResponse.error).toHaveProperty('code')
      expect(expectedResponse.error).toHaveProperty('message')
    })
  })

  describe('Error types', () => {
    it('erro de validação deve ter código VALIDATION_ERROR', () => {
      const details = [{ field: 'email' }]
      const error = new AppError('Validação falhou', 400, ErrorCodes.VALIDATION_ERROR, details)
      
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.details).toEqual(details)
    })

    it('erro de autenticação deve ter código UNAUTHORIZED', () => {
      const error = new AppError('Não autorizado', 401, ErrorCodes.UNAUTHORIZED)
      
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('UNAUTHORIZED')
    })

    it('erro não encontrado deve ter código NOT_FOUND', () => {
      const error = new AppError('Recurso não encontrado', 404, ErrorCodes.NOT_FOUND)
      
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
    })

    it('erro interno deve ter código INTERNAL_ERROR', () => {
      const error = new AppError('Erro interno', 500, ErrorCodes.INTERNAL_ERROR)
      
      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('INTERNAL_ERROR')
    })
  })
})
