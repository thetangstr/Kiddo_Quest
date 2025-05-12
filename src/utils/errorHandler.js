/**
 * Utility functions for consistent error handling throughout the application
 */

/**
 * Logs errors and formats them for user display
 * @param {Error} error - The error object
 * @param {string} context - Where the error occurred
 * @param {boolean} silent - Whether to suppress console output
 * @returns {Object} Formatted error object
 */
export const handleError = (error, context, silent = false) => {
  if (!silent) {
    console.error(`Error in ${context}:`, error);
  }
  
  // Format user-friendly error message
  let userMessage = 'An unexpected error occurred. Please try again.';
  
  // Handle common Firebase errors
  if (error.code) {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        userMessage = 'Invalid email or password';
        break;
      case 'auth/email-already-in-use':
        userMessage = 'This email is already registered';
        break;
      case 'auth/weak-password':
        userMessage = 'Password is too weak';
        break;
      case 'auth/invalid-email':
        userMessage = 'Invalid email address';
        break;
      case 'auth/requires-recent-login':
        userMessage = 'Please log out and log back in to perform this action';
        break;
      case 'permission-denied':
        userMessage = 'You do not have permission to perform this action';
        break;
      default:
        // If we have a code but no specific handling, use the code
        userMessage = `Error: ${error.code.replace('auth/', '')}`;
    }
  } else if (error.message) {
    // Use the error message if available
    userMessage = error.message;
  }
  
  return {
    success: false,
    error: userMessage,
    originalError: error,
    context
  };
};

/**
 * Wraps an async function with error handling
 * @param {Function} fn - The async function to wrap
 * @param {string} context - Context for error logging
 * @returns {Function} Wrapped function with error handling
 */
export const withErrorHandling = (fn, context) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      return handleError(error, context);
    }
  };
};
