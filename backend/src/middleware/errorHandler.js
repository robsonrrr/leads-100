import logger from '../config/logger.js';
import { AppError, ErrorCodes } from '../utils/AppError.js';

/**
 * Middleware de tratamento de erros centralizado
 * Converte diferentes tipos de erros em respostas padronizadas
 */
export function errorHandler(err, req, res, next) {
  // Usar logger do request se disponível, senão usar logger global
  const log = req.logger || logger;

  // Determinar se é um erro operacional (esperado) ou de programação
  let error = err;

  // Converter erros conhecidos para AppError
  if (!(err instanceof AppError)) {
    error = convertToAppError(err);
  }

  // Log do erro
  if (error.statusCode >= 500) {
    log.error('Server error', {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack,
      path: req.originalUrl,
      method: req.method,
      userId: req.user?.userId
    });
  } else if (error.statusCode >= 400) {
    log.warn('Client error', {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      path: req.originalUrl,
      method: req.method,
      details: error.details
    });
  }

  // Preparar resposta
  const response = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details && { details: error.details })
    }
  };

  // Em desenvolvimento, incluir stack trace
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }

  // Adicionar requestId se disponível
  if (req.requestId) {
    response.error.requestId = req.requestId;
  }

  res.status(error.statusCode).json(response);
}

/**
 * Converte erros desconhecidos para AppError
 */
function convertToAppError(err) {
  // Erro de sintaxe JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return new AppError(
      'JSON inválido no corpo da requisição',
      400,
      ErrorCodes.INVALID_INPUT,
      { parseError: err.message }
    );
  }

  // Erro do MySQL
  if (err.code && err.code.startsWith('ER_')) {
    return handleMySQLError(err);
  }

  // Erro do Joi (validação)
  if (err.isJoi) {
    return new AppError(
      'Erro de validação',
      400,
      ErrorCodes.VALIDATION_ERROR,
      err.details?.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))
    );
  }

  // Erro JWT
  if (err.name === 'JsonWebTokenError') {
    return new AppError('Token inválido', 403, ErrorCodes.TOKEN_INVALID);
  }

  if (err.name === 'TokenExpiredError') {
    return new AppError('Token expirado', 403, ErrorCodes.TOKEN_EXPIRED);
  }

  // Erro genérico - manter statusCode se existir
  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode >= 500 
    ? 'Erro interno do servidor' 
    : err.message || 'Erro desconhecido';

  return new AppError(message, statusCode, ErrorCodes.INTERNAL_ERROR);
}

/**
 * Trata erros específicos do MySQL
 */
function handleMySQLError(err) {
  const mysqlErrors = {
    'ER_DUP_ENTRY': {
      statusCode: 409,
      code: ErrorCodes.DUPLICATE_ENTRY,
      message: 'Registro duplicado'
    },
    'ER_NO_REFERENCED_ROW': {
      statusCode: 400,
      code: ErrorCodes.VALIDATION_ERROR,
      message: 'Referência inválida - registro relacionado não existe'
    },
    'ER_NO_REFERENCED_ROW_2': {
      statusCode: 400,
      code: ErrorCodes.VALIDATION_ERROR,
      message: 'Referência inválida - registro relacionado não existe'
    },
    'ER_ROW_IS_REFERENCED': {
      statusCode: 409,
      code: ErrorCodes.CONFLICT,
      message: 'Não é possível remover - existem registros dependentes'
    },
    'ER_ROW_IS_REFERENCED_2': {
      statusCode: 409,
      code: ErrorCodes.CONFLICT,
      message: 'Não é possível remover - existem registros dependentes'
    },
    'ER_DATA_TOO_LONG': {
      statusCode: 400,
      code: ErrorCodes.VALIDATION_ERROR,
      message: 'Dados excedem o tamanho máximo permitido'
    },
    'ER_TRUNCATED_WRONG_VALUE': {
      statusCode: 400,
      code: ErrorCodes.INVALID_INPUT,
      message: 'Valor inválido para o tipo de campo'
    },
    'ER_ACCESS_DENIED_ERROR': {
      statusCode: 500,
      code: ErrorCodes.DATABASE_ERROR,
      message: 'Erro de acesso ao banco de dados'
    },
    'ER_CON_COUNT_ERROR': {
      statusCode: 503,
      code: ErrorCodes.DATABASE_ERROR,
      message: 'Servidor temporariamente indisponível'
    },
    'ECONNREFUSED': {
      statusCode: 503,
      code: ErrorCodes.DATABASE_ERROR,
      message: 'Não foi possível conectar ao banco de dados'
    }
  };

  const known = mysqlErrors[err.code];
  if (known) {
    return new AppError(known.message, known.statusCode, known.code, {
      sqlCode: err.code,
      sqlMessage: process.env.NODE_ENV === 'development' ? err.sqlMessage : undefined
    });
  }

  // Erro MySQL desconhecido
  return new AppError(
    'Erro ao acessar banco de dados',
    500,
    ErrorCodes.DATABASE_ERROR,
    process.env.NODE_ENV === 'development' ? { sqlCode: err.code } : undefined
  );
}

/**
 * Middleware para capturar erros não tratados em rotas async
 * Uso: app.get('/route', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Handler para rotas não encontradas
 */
export function notFoundHandler(req, res, next) {
  const error = new AppError(
    `Rota não encontrada: ${req.method} ${req.originalUrl}`,
    404,
    ErrorCodes.NOT_FOUND
  );
  next(error);
}

export default errorHandler;
