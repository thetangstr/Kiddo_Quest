import { Platform } from 'react-native';

// Error logging utility that can be extended with crash reporting services
class ErrorLogger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.EXPO_PUBLIC_ENVIRONMENT !== 'production';
  }

  log(message: string, extra?: any) {
    if (this.isDevelopment) {
      console.log(`[LOG] ${message}`, extra);
    }
    // In production, send to analytics/crash reporting service
    // Example: Sentry.captureMessage(message, 'info');
  }

  error(error: Error | string, extra?: any) {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${error}`, extra);
    } else {
      // In production, send to crash reporting service
      // Example: Sentry.captureException(error);
      
      // For now, silently log to prevent exposing errors to users
      // You should integrate a proper crash reporting service
    }
  }

  warn(message: string, extra?: any) {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, extra);
    }
    // In production, could send to analytics
  }

  // Initialize crash reporting service
  init() {
    if (!this.isDevelopment) {
      // Initialize Sentry, Bugsnag, or other crash reporting
      // Example:
      // Sentry.init({
      //   dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      //   environment: process.env.EXPO_PUBLIC_ENVIRONMENT,
      // });
    }
  }

  // Set user context for better error tracking
  setUser(userId: string, email?: string) {
    if (!this.isDevelopment) {
      // Example:
      // Sentry.setUser({ id: userId, email });
    }
  }

  // Clear user context on logout
  clearUser() {
    if (!this.isDevelopment) {
      // Example:
      // Sentry.setUser(null);
    }
  }
}

// Export singleton instance
export const logger = new ErrorLogger();

// Initialize on app start
logger.init();