/**
 * Testes unitários para AppError
 */
import { jest, describe, it, expect } from '@jest/globals'
import { AppError, ErrorCodes, Errors } from '../../../src/utils/AppError.js'

describe('AppError', () => {
  describe('constructor', () => {
    it('deve criar um erro com valores padrão', () => {
      const error = new AppError('Mensagem de teste')
      
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
      expect(error.message).toBe('Mensagem de teste')
      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('INTERNAL_ERROR')
      expect(error.details).toBeNull()
      expect(error.isOperational).toBe(true)
    })

    it('deve criar um erro com valores customizados', () => {
      const details = { field: 'email', reason: 'inválido' }
      const error = new AppError('Erro de validação', 400, 'VALIDATION_ERROR', details)
      
      expect(error.message).toBe('Erro de validação')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.details).toEqual(details)
    })

    it('deve ter stack trace', () => {
      const error = new AppError('Teste')
      
      expect(error.stack).toBeDefined()
      expect(error.stack).toContain('AppError')
    })
  })

  describe('toJSON', () => {
    it('deve serializar erro sem details', () => {
      const error = new AppError('Erro teste', 404, 'NOT_FOUND')
      const json = error.toJSON()
      
      expect(json).toEqual({
        code: 'NOT_FOUND',
        message: 'Erro teste'
      })
      expect(json.details).toBeUndefined()
    })

    it('deve serializar erro com details', () => {
      const details = { id: 123 }
      const error = new AppError('Não encontrado', 404, 'NOT_FOUND', details)
      const json = error.toJSON()
      
      expect(json).toEqual({
        code: 'NOT_FOUND',
        message: 'Não encontrado',
        details: { id: 123 }
      })
    })
  })
})

describe('ErrorCodes', () => {
  it('deve ter códigos de autenticação', () => {
    expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED')
    expect(ErrorCodes.TOKEN_EXPIRED).toBe('TOKEN_EXPIRED')
    expect(ErrorCodes.TOKEN_INVALID).toBe('TOKEN_INVALID')
    expect(ErrorCodes.TOKEN_REQUIRED).toBe('TOKEN_REQUIRED')
  })

  it('deve ter códigos de validação', () => {
    expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR')
    expect(ErrorCodes.INVALID_INPUT).toBe('INVALID_INPUT')
    expect(ErrorCodes.INVALID_ID).toBe('INVALID_ID')
  })

  it('deve ter códigos de recursos', () => {
    expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND')
    expect(ErrorCodes.LEAD_NOT_FOUND).toBe('LEAD_NOT_FOUND')
    expect(ErrorCodes.CUSTOMER_NOT_FOUND).toBe('CUSTOMER_NOT_FOUND')
  })

  it('deve ter códigos de conflito', () => {
    expect(ErrorCodes.CONFLICT).toBe('CONFLICT')
    expect(ErrorCodes.LEAD_ALREADY_CONVERTED).toBe('LEAD_ALREADY_CONVERTED')
  })
})

describe('Errors (factory functions)', () => {
  describe('erros de autenticação', () => {
    it('unauthorized deve criar erro 401', () => {
      const error = Errors.unauthorized()
      
      expect(error).toBeInstanceOf(AppError)
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('UNAUTHORIZED')
    })

    it('unauthorized deve aceitar mensagem customizada', () => {
      const error = Errors.unauthorized('Sessão expirada')
      
      expect(error.message).toBe('Sessão expirada')
    })

    it('tokenRequired deve criar erro 401', () => {
      const error = Errors.tokenRequired()
      
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('TOKEN_REQUIRED')
    })

    it('tokenInvalid deve criar erro 403', () => {
      const error = Errors.tokenInvalid()
      
      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('TOKEN_INVALID')
    })
  })

  describe('erros de validação', () => {
    it('validation deve criar erro 400 com details', () => {
      const details = [{ field: 'email', message: 'inválido' }]
      const error = Errors.validation(details)
      
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.details).toEqual(details)
    })

    it('invalidId deve criar erro 400', () => {
      const error = Errors.invalidId('leadId')
      
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('INVALID_ID')
      expect(error.message).toContain('leadId')
    })
  })

  describe('erros de recurso não encontrado', () => {
    it('notFound deve criar erro 404', () => {
      const error = Errors.notFound('Usuário')
      
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
      expect(error.message).toContain('Usuário')
    })

    it('leadNotFound deve criar erro 404 com ID', () => {
      const error = Errors.leadNotFound(123)
      
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('LEAD_NOT_FOUND')
      expect(error.message).toContain('123')
    })

    it('customerNotFound deve criar erro 404', () => {
      const error = Errors.customerNotFound(456)
      
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('CUSTOMER_NOT_FOUND')
    })
  })

  describe('erros de regra de negócio', () => {
    it('leadAlreadyConverted deve criar erro 409', () => {
      const error = Errors.leadAlreadyConverted(789)
      
      expect(error.statusCode).toBe(409)
      expect(error.code).toBe('LEAD_ALREADY_CONVERTED')
      expect(error.message).toContain('789')
    })

    it('emptyCart deve criar erro 422', () => {
      const error = Errors.emptyCart()
      
      expect(error.statusCode).toBe(422)
      expect(error.code).toBe('EMPTY_CART')
    })
  })

  describe('erros internos', () => {
    it('internal deve criar erro 500', () => {
      const error = Errors.internal()
      
      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('INTERNAL_ERROR')
    })

    it('database deve criar erro 500', () => {
      const error = Errors.database()
      
      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('DATABASE_ERROR')
    })
  })
})
