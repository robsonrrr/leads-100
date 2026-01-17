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



export default logger;
