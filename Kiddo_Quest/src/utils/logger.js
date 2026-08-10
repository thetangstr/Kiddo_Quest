/**
 * Centralized logging utility with automatic data sanitization
 * Prevents sensitive data exposure in logs
 */

class Logger {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'pin', 'parentPin', 'auth', 'credential'];
  }

  /**
   * Sanitize data by redacting sensitive fields
   * @param {any} data - Data to sanitize
   * @returns {any} - Sanitized data
   */
  _sanitize(data) {
    if (!data) return data;

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this._sanitize(item));
    }

    // Handle objects
    if (typeof data === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        // Check if key contains sensitive information
        const isSensitive = this.sensitiveKeys.some(sensitiveKey =>
          key.toLowerCase().includes(sensitiveKey.toLowerCase())
        );

        if (isSensitive) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this._sanitize(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Log informational message
   * @param {string} message - Log message
   * @param {object} meta - Additional metadata
   */
  info(message, meta = {}) {
    if (this.environment === 'development') {
      console.log(`[INFO] ${message}`, this._sanitize(meta));
    }
    // In production, this would send to a logging service like Sentry
  }

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Error|null} error - Error object
   * @param {object} meta - Additional metadata
   */
  error(message, error = null, meta = {}) {
    const errorData = {
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : null,
      meta: this._sanitize(meta)
    };

    if (this.environment === 'development') {
      console.error(`[ERROR] ${message}`, errorData);
    } else {
      // In production, send to error tracking service
      // Example: Sentry.captureException(error, { extra: errorData });
      console.error(`[ERROR] ${message}`, errorData);
    }
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    if (this.environment === 'development') {
      console.warn(`[WARN] ${message}`, this._sanitize(meta));
    }
  }

  /**
   * Log debug message (only in development)
   * @param {string} message - Debug message
   * @param {object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    if (this.environment === 'development') {
      console.debug(`[DEBUG] ${message}`, this._sanitize(meta));
    }
  }
}

// Export singleton instance
const logger = new Logger();
export default logger;
