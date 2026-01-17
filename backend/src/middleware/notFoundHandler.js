import { AppError, ErrorCodes } from '../utils/AppError.js';

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

export default notFoundHandler;
