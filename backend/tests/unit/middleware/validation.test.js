/**
 * Testes unitários para middleware de validação
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import Joi from 'joi'
import { validate, validateId, validatePagination, CommonSchemas } from '../../../src/middleware/validation.js'

describe('Validation Middleware', () => {
  let mockReq
  let mockRes
  let mockNext

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {}
    }
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }
    mockNext = jest.fn()
  })

  describe('validate', () => {
    const testSchema = {
      body: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        age: Joi.number().min(18).optional()
      })
    }

    it('deve passar validação com dados válidos no body', () => {
      mockReq.body = { name: 'Teste', email: 'teste@email.com' }
      
      const middleware = validate(testSchema)
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalledWith()
      expect(mockReq.body).toEqual({ name: 'Teste', email: 'teste@email.com' })
    })

    it('deve chamar next com erro para dados inválidos', () => {
      mockReq.body = { name: 'Teste' } // falta email
      
      const middleware = validate(testSchema)
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 400,
        code: 'VALIDATION_ERROR'
      }))
    })

    it('deve validar query params', () => {
      const querySchema = {
        query: Joi.object({
          page: Joi.number().min(1).default(1),
          limit: Joi.number().min(1).max(100).default(10)
        })
      }
      
      mockReq.query = { page: '5', limit: '20' }
      
      const middleware = validate(querySchema)
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalledWith()
      expect(mockReq.query.page).toBe(5)
      expect(mockReq.query.limit).toBe(20)
    })

    it('deve validar params de rota', () => {
      const paramsSchema = {
        params: Joi.object({
          id: Joi.number().required()
        })
      }
      
      mockReq.params = { id: '123' }
      
      const middleware = validate(paramsSchema)
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalledWith()
      expect(mockReq.params.id).toBe(123)
    })
  })

  describe('validateId', () => {
    it('deve passar com ID numérico válido', () => {
      mockReq.params = { id: '123' }
      
      const middleware = validateId()
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('deve falhar com ID não numérico', () => {
      mockReq.params = { id: 'abc' }
      
      const middleware = validateId()
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 400,
        code: 'INVALID_ID'
      }))
    })

    it('deve falhar com ID negativo', () => {
      mockReq.params = { id: '-5' }
      
      const middleware = validateId()
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        code: 'INVALID_ID'
      }))
    })

    it('deve falhar com ID zero', () => {
      mockReq.params = { id: '0' }
      
      const middleware = validateId()
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        code: 'INVALID_ID'
      }))
    })
  })

  describe('validatePagination', () => {
    it('deve aplicar valores padrão quando não fornecidos', () => {
      mockReq.query = {}
      
      validatePagination(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalledWith()
      expect(mockReq.query.page).toBe(1)
      expect(mockReq.query.limit).toBe(10)
    })

    it('deve validar e converter valores fornecidos', () => {
      mockReq.query = { page: '3', limit: '25' }
      
      validatePagination(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalledWith()
      expect(mockReq.query.page).toBe(3)
      expect(mockReq.query.limit).toBe(25)
    })

    it('deve limitar o máximo de itens por página', () => {
      mockReq.query = { limit: '500' }
      
      validatePagination(mockReq, mockRes, mockNext)
      
      expect(mockReq.query.limit).toBeLessThanOrEqual(100)
    })
  })

  describe('CommonSchemas', () => {
    it('id deve validar números positivos', () => {
      const result = CommonSchemas.id.validate(123)
      expect(result.error).toBeUndefined()
      expect(result.value).toBe(123)
    })

    it('id deve rejeitar números negativos', () => {
      const result = CommonSchemas.id.validate(-1)
      expect(result.error).toBeDefined()
    })

    it('email deve validar emails válidos', () => {
      const result = CommonSchemas.email.validate('teste@email.com')
      expect(result.error).toBeUndefined()
    })

    it('email deve rejeitar emails inválidos', () => {
      const result = CommonSchemas.email.validate('invalid-email')
      expect(result.error).toBeDefined()
    })

    it('pagination deve ter valores padrão', () => {
      const result = CommonSchemas.pagination.validate({})
      expect(result.value.page).toBe(1)
      expect(result.value.limit).toBe(10)
    })
  })
})
