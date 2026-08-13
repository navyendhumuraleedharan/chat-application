import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

// Base formats for all environments
const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const transports = [
  // Always log to Console so Docker captures logs via stdout/stderr
  new winston.transports.Console({
    format: isProduction
      ? baseFormat
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, stack }) => {
            return `[${timestamp}] ${level}: ${stack || message}`;
          })
        ),
  }),
];

// Write to files ONLY during local development (outside Docker production container)
if (!isProduction) {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  defaultMeta: { service: 'chat-app-backend' },
  transports,
});

export default logger;
