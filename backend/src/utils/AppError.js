/**
 * Classe de erro customizada para a aplicação
 * Permite criar erros com códigos padronizados e mensagens descritivas
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Distingue erros operacionais de erros de programação

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details })
    };
  }
}

/**
 * Códigos de erro padronizados
 */
export const ErrorCodes = {
  // Autenticação (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_REQUIRED: 'TOKEN_REQUIRED',

  // Autorização (403)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Validação (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_ID: 'INVALID_ID',
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',

  // Recursos (404)
  NOT_FOUND: 'NOT_FOUND',
  LEAD_NOT_FOUND: 'LEAD_NOT_FOUND',
  CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',

  // Conflitos (409)
  CONFLICT: 'CONFLICT',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  LEAD_ALREADY_CONVERTED: 'LEAD_ALREADY_CONVERTED',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // Regras de negócio (422)
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  EMPTY_CART: 'EMPTY_CART',
  INVALID_QUANTITY: 'INVALID_QUANTITY',
  INVALID_PRICE: 'INVALID_PRICE',
  CUSTOMER_INACTIVE: 'CUSTOMER_INACTIVE',

  // Servidor (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR'
};

/**
 * Factory functions para criar erros comuns
 */
export const Errors = {
  // Autenticação
  unauthorized: (message = 'Não autorizado') =>
    new AppError(message, 401, ErrorCodes.UNAUTHORIZED),

  tokenRequired: () =>
    new AppError('Token de acesso requerido', 401, ErrorCodes.TOKEN_REQUIRED),

  tokenInvalid: () =>
    new AppError('Token inválido ou expirado', 403, ErrorCodes.TOKEN_INVALID),

  forbidden: (message = 'Acesso negado') =>
    new AppError(message, 403, ErrorCodes.FORBIDDEN),

  insufficientPermissions: (action = 'esta ação') =>
    new AppError(`Permissões insuficientes para ${action}`, 403, ErrorCodes.INSUFFICIENT_PERMISSIONS),

  // Validação
  validation: (details) =>
    new AppError('Erro de validação', 400, ErrorCodes.VALIDATION_ERROR, details),

  invalidInput: (field, message) =>
    new AppError(message || `Campo inválido: ${field}`, 400, ErrorCodes.INVALID_INPUT, { field }),

  invalidId: (resource = 'recurso') =>
    new AppError(`ID de ${resource} inválido`, 400, ErrorCodes.INVALID_ID),

  missingField: (field) =>
    new AppError(`Campo obrigatório não informado: ${field}`, 400, ErrorCodes.MISSING_REQUIRED_FIELD, { field }),

  // Recursos não encontrados
  notFound: (resource = 'Recurso') =>
    new AppError(`${resource} não encontrado`, 404, ErrorCodes.NOT_FOUND),

  leadNotFound: (id) =>
    new AppError(`Lead ${id ? `#${id} ` : ''}não encontrado`, 404, ErrorCodes.LEAD_NOT_FOUND),

  customerNotFound: (id) =>
    new AppError(`Cliente ${id ? `#${id} ` : ''}não encontrado`, 404, ErrorCodes.CUSTOMER_NOT_FOUND),

  productNotFound: (id) =>
    new AppError(`Produto ${id ? `#${id} ` : ''}não encontrado`, 404, ErrorCodes.PRODUCT_NOT_FOUND),

  orderNotFound: (id) =>
    new AppError(`Pedido ${id ? `#${id} ` : ''}não encontrado`, 404, ErrorCodes.ORDER_NOT_FOUND),

  itemNotFound: (id) =>
    new AppError(`Item ${id ? `#${id} ` : ''}não encontrado`, 404, ErrorCodes.ITEM_NOT_FOUND),

  // Conflitos
  alreadyExists: (resource) =>
    new AppError(`${resource} já existe`, 409, ErrorCodes.ALREADY_EXISTS),

  leadAlreadyConverted: (id) =>
    new AppError(`Lead ${id ? `#${id} ` : ''}já foi convertido em pedido`, 409, ErrorCodes.LEAD_ALREADY_CONVERTED),

  // Regras de negócio
  businessRule: (message, details = null) =>
    new AppError(message, 422, ErrorCodes.BUSINESS_RULE_VIOLATION, details),

  emptyCart: () =>
    new AppError('Não é possível converter um lead sem itens', 422, ErrorCodes.EMPTY_CART),

  invalidQuantity: (message = 'Quantidade inválida') =>
    new AppError(message, 422, ErrorCodes.INVALID_QUANTITY),

  invalidPrice: (message = 'Preço inválido') =>
    new AppError(message, 422, ErrorCodes.INVALID_PRICE),

  customerInactive: (id) =>
    new AppError(`Cliente ${id ? `#${id} ` : ''}está inativo`, 422, ErrorCodes.CUSTOMER_INACTIVE),

  // Servidor
  internal: (message = 'Erro interno do servidor') =>
    new AppError(message, 500, ErrorCodes.INTERNAL_ERROR),

  database: (message = 'Erro ao acessar banco de dados') =>
    new AppError(message, 500, ErrorCodes.DATABASE_ERROR),

  externalService: (service, message) =>
    new AppError(message || `Erro ao conectar com ${service}`, 500, ErrorCodes.EXTERNAL_SERVICE_ERROR, { service })
};

export default AppError;
