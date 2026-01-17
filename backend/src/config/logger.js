import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Formato customizado para logs
const logFormat = printf(({ level, message, timestamp, requestId, ...metadata }) => {
  let msg = `${timestamp} [${level}]`;
  
  if (requestId) {
    msg += ` [${requestId}]`;
  }
  
  msg += `: ${message}`;
  
  // Adicionar metadata se existir
  if (Object.keys(metadata).length > 0 && metadata.stack === undefined) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Formato para produção (JSON estruturado)
const jsonFormat = printf(({ level, message, timestamp, requestId, ...metadata }) => {
  const logEntry = {
    timestamp,
    level,
    message,
    ...(requestId && { requestId }),
    ...metadata
  };
  return JSON.stringify(logEntry);
});

// Determinar nível de log baseado no ambiente
const getLogLevel = () => {
  const env = process.env.NODE_ENV || 'development';
  switch (env) {
    case 'production':
      return 'info';
    case 'test':
      return 'error';
    default:
      return 'debug';
  }
};

// Criar logger
const logger = winston.createLogger({
  level: getLogLevel(),
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true })
  ),
  defaultMeta: { service: 'leads-agent' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        process.env.NODE_ENV === 'production' ? jsonFormat : combine(colorize(), logFormat)
      )
    })
  ]
});

// Adicionar file transport em produção
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: jsonFormat
  }));
  
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    format: jsonFormat
  }));
}

/**
 * Cria um child logger com requestId para rastreamento
 * @param {string} requestId - ID único da requisição
 */
export const createRequestLogger = (requestId) => {
  return logger.child({ requestId });
};

/**
 * Middleware para adicionar requestId e logger à requisição
 */
export const requestLoggerMiddleware = (req, res, next) => {
  // Gerar requestId único
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;
  req.logger = createRequestLogger(requestId);
  
  // Log da requisição
  req.logger.info(`${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Log do tempo de resposta
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    req.logger[logLevel](`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      statusCode: res.statusCode,
      duration
    });
  });
  
  next();
};

export default logger;
