/**
 * Centralized logging utility for KiddoQuest
 * Provides environment-aware logging with levels
 */

const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

class Logger {
  constructor(context = 'App') {
    this.context = context;
  }

  /**
   * Format log message with context
   */
  _formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      level,
      context: this.context,
      message,
      ...meta
    };
  }

  /**
   * Sanitize sensitive data before logging
   */
  _sanitize(data) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'pin', 'parentPin'];
    const sanitized = { ...data };

    for (const key in sanitized) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this._sanitize(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Log error messages (always logged, even in production)
   */
  error(message, error = null, meta = {}) {
    const logData = this._formatMessage(LOG_LEVELS.ERROR, message, {
      ...this._sanitize(meta),
      error: error ? {
        message: error.message,
        stack: IS_DEVELOPMENT ? error.stack : undefined,
        code: error.code
      } : undefined
    });

    console.error(`[${this.context}]`, message, error || '', meta);

    // In production, send to error tracking service (Sentry, etc.)
    if (IS_PRODUCTION && window.Sentry) {
      window.Sentry.captureException(error || new Error(message), {
        contexts: { meta: this._sanitize(meta) }
      });
    }

    return logData;
  }

  /**
   * Log warning messages (logged in dev and staging)
   */
  warn(message, meta = {}) {
    if (IS_PRODUCTION) return;

    const logData = this._formatMessage(LOG_LEVELS.WARN, message, this._sanitize(meta));
    console.warn(`[${this.context}]`, message, meta);

    return logData;
  }

  /**
   * Log info messages (dev and staging only)
   */
  info(message, meta = {}) {
    if (IS_PRODUCTION) return;

    const logData = this._formatMessage(LOG_LEVELS.INFO, message, this._sanitize(meta));
    console.info(`[${this.context}]`, message, meta);

    return logData;
  }

  /**
   * Log debug messages (dev only)
   */
  debug(message, meta = {}) {
    if (!IS_DEVELOPMENT) return;

    const logData = this._formatMessage(LOG_LEVELS.DEBUG, message, this._sanitize(meta));
    console.debug(`[${this.context}]`, message, meta);

    return logData;
  }

  /**
   * Log performance metrics
   */
  performance(operation, duration, meta = {}) {
    if (IS_PRODUCTION) return;

    this.info(`Performance: ${operation} took ${duration}ms`, {
      operation,
      duration,
      ...meta
    });
  }

  /**
   * Create a child logger with a specific context
   */
  child(context) {
    return new Logger(`${this.context}:${context}`);
  }
}

// Create default logger instance
const logger = new Logger('KiddoQuest');

// Export both the class and default instance
export { Logger, LOG_LEVELS };
export default logger;
