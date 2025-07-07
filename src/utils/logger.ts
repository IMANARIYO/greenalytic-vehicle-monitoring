import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

// Log format: [timestamp] level: message
const logFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level}: ${message}`;
});

const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Console log only in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), logFormat)
    })
  );
}

// Utility: Safe error logging
export function logErrorSafe(tag: string, action: string, error: unknown): void {
  const msg = `${tag} ${action}`;

  if (process.env.NODE_ENV === 'development') {
    logger.error(`${msg} —`, error);
  } else {
    if (error instanceof Error) {
      logger.error(`${msg} — ${error.message}`);
    } else {
      logger.error(`${msg} — unknown error`);
    }
  }
}

export default logger;
