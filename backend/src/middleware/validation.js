import Joi from 'joi';
import { Errors } from '../utils/AppError.js';

/**
 * Middleware factory para validação de request
 * @param {Object} schemas - Objeto com schemas Joi para body, query e params
 * @returns {Function} Middleware Express
 */
export function validate(schemas) {
  return (req, res, next) => {
    const errors = [];

    // Validar body
    if (schemas.body) {
      const { error } = schemas.body.validate(req.body, { abortEarly: false });
      if (error) {
        errors.push(...formatJoiErrors(error, 'body'));
      }
    }

    // Validar query params
    if (schemas.query) {
      const { error } = schemas.query.validate(req.query, { abortEarly: false });
      if (error) {
        errors.push(...formatJoiErrors(error, 'query'));
      }
    }

    // Validar route params
    if (schemas.params) {
      const { error } = schemas.params.validate(req.params, { abortEarly: false });
      if (error) {
        errors.push(...formatJoiErrors(error, 'params'));
      }
    }

    if (errors.length > 0) {
      return next(Errors.validation(errors));
    }

    next();
  };
}

/**
 * Formata erros do Joi para formato padronizado
 */
function formatJoiErrors(joiError, location) {
  return joiError.details.map(detail => ({
    field: detail.path.join('.'),
    message: translateJoiMessage(detail),
    location,
    type: detail.type
  }));
}

/**
 * Traduz mensagens do Joi para português
 */
function translateJoiMessage(detail) {
  const field = detail.path[detail.path.length - 1] || 'campo';
  const translations = {
    'any.required': `O campo "${field}" é obrigatório`,
    'string.empty': `O campo "${field}" não pode estar vazio`,
    'string.min': `O campo "${field}" deve ter no mínimo ${detail.context?.limit} caracteres`,
    'string.max': `O campo "${field}" deve ter no máximo ${detail.context?.limit} caracteres`,
    'string.email': `O campo "${field}" deve ser um email válido`,
    'number.base': `O campo "${field}" deve ser um número`,
    'number.integer': `O campo "${field}" deve ser um número inteiro`,
    'number.min': `O campo "${field}" deve ser maior ou igual a ${detail.context?.limit}`,
    'number.max': `O campo "${field}" deve ser menor ou igual a ${detail.context?.limit}`,
    'number.positive': `O campo "${field}" deve ser um número positivo`,
    'date.base': `O campo "${field}" deve ser uma data válida`,
    'array.base': `O campo "${field}" deve ser uma lista`,
    'array.min': `O campo "${field}" deve ter no mínimo ${detail.context?.limit} itens`,
    'object.base': `O campo "${field}" deve ser um objeto`,
    'any.only': `O campo "${field}" deve ser um dos valores permitidos`,
    'any.invalid': `O campo "${field}" contém um valor inválido`
  };

  return translations[detail.type] || detail.message;
}

/**
 * Middleware para validar ID numérico em params
 */
export function validateId(paramName = 'id') {
  return (req, res, next) => {
    const id = parseInt(req.params[paramName]);
    
    if (isNaN(id) || id <= 0) {
      return next(Errors.invalidId());
    }
    
    // Substituir pelo valor parseado
    req.params[paramName] = id;
    next();
  };
}

/**
 * Middleware para validar paginação
 */
export function validatePagination(req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  if (page < 1) {
    return next(Errors.invalidInput('page', 'Página deve ser maior que 0'));
  }

  if (limit < 1 || limit > 100) {
    return next(Errors.invalidInput('limit', 'Limite deve estar entre 1 e 100'));
  }

  req.pagination = { page, limit };
  next();
}

/**
 * Schemas comuns reutilizáveis
 */
export const CommonSchemas = {
  // ID numérico
  id: Joi.number().integer().positive().required(),

  // Paginação
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  // Ordenação
  sorting: Joi.object({
    sort: Joi.string().valid('date', 'total', 'id', 'customer', 'segment').default('date'),
    sortDir: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // Filtros de data
  dateRange: Joi.object({
    dateFrom: Joi.date().iso(),
    dateTo: Joi.date().iso().min(Joi.ref('dateFrom'))
  }),

  // Remarks (observações)
  remarks: Joi.object({
    finance: Joi.string().allow('').max(1000),
    logistic: Joi.string().allow('').max(1000),
    nfe: Joi.string().allow('').max(1000),
    obs: Joi.string().allow('').max(1000),
    manager: Joi.string().allow('').max(1000)
  })
};

/**
 * Sanitiza string para prevenir XSS
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Middleware para sanitizar inputs de string no body
 */
export function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

function sanitizeObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  return obj;
}

export default { validate, validateId, validatePagination, CommonSchemas, sanitizeBody };
