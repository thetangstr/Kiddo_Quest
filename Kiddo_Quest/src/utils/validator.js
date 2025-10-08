/**
 * Input Validation Utility
 * Centralized validation for all user inputs before Firestore writes
 */

import logger from './logger';

/**
 * Validation result object
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the validation passed
 * @property {Array<string>} errors - List of validation error messages
 */

/**
 * Sanitize string input to prevent XSS
 * @param {string} input - The input string
 * @returns {string} Sanitized string
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {ValidationResult}
 */
export function validateEmail(email) {
  const errors = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Email format is invalid');
  }

  if (email.length > 254) {
    errors.push('Email is too long (max 254 characters)');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate child profile data
 * @param {Object} profileData - Child profile data to validate
 * @returns {ValidationResult}
 */
export function validateChildProfile(profileData) {
  const errors = [];

  // Validate name
  if (!profileData.name || typeof profileData.name !== 'string') {
    errors.push('Child name is required');
  } else if (profileData.name.trim().length < 1) {
    errors.push('Child name cannot be empty');
  } else if (profileData.name.length > 50) {
    errors.push('Child name is too long (max 50 characters)');
  }

  // Validate XP
  if (profileData.xp !== undefined) {
    if (typeof profileData.xp !== 'number' || profileData.xp < 0) {
      errors.push('XP must be a non-negative number');
    }
    if (profileData.xp > 1000000) {
      errors.push('XP value is unreasonably high');
    }
  }

  // Validate age if provided
  if (profileData.age !== undefined) {
    if (typeof profileData.age !== 'number' || profileData.age < 4 || profileData.age > 18) {
      errors.push('Age must be between 4 and 18');
    }
  }

  // Validate theme if provided
  if (profileData.theme) {
    const validThemes = ['default', 'space', 'ocean', 'forest', 'rainbow'];
    if (!validThemes.includes(profileData.theme)) {
      errors.push(`Theme must be one of: ${validThemes.join(', ')}`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate quest data
 * @param {Object} questData - Quest data to validate
 * @returns {ValidationResult}
 */
export function validateQuest(questData) {
  const errors = [];

  // Validate title
  if (!questData.title || typeof questData.title !== 'string') {
    errors.push('Quest title is required');
  } else if (questData.title.trim().length < 3) {
    errors.push('Quest title must be at least 3 characters');
  } else if (questData.title.length > 100) {
    errors.push('Quest title is too long (max 100 characters)');
  }

  // Validate description (optional)
  if (questData.description && questData.description.length > 500) {
    errors.push('Quest description is too long (max 500 characters)');
  }

  // Validate XP
  if (!questData.xp || typeof questData.xp !== 'number') {
    errors.push('Quest XP is required and must be a number');
  } else if (questData.xp < 0) {
    errors.push('Quest XP cannot be negative');
  } else if (questData.xp > 10000) {
    errors.push('Quest XP is too high (max 10,000)');
  }

  // Validate quest type
  if (questData.type) {
    const validTypes = ['one-time', 'recurring'];
    if (!validTypes.includes(questData.type)) {
      errors.push(`Quest type must be either 'one-time' or 'recurring'`);
    }
  }

  // Validate frequency if recurring
  if (questData.type === 'recurring' && questData.frequency) {
    const validFrequencies = ['daily', 'weekly', 'monthly'];
    if (!validFrequencies.includes(questData.frequency)) {
      errors.push(`Frequency must be one of: ${validFrequencies.join(', ')}`);
    }
  }

  // Validate category if provided
  if (questData.category) {
    const validCategories = ['chores', 'homework', 'hygiene', 'kindness', 'exercise', 'creativity', 'other'];
    if (!validCategories.includes(questData.category)) {
      errors.push(`Category must be one of: ${validCategories.join(', ')}`);
    }
  }

  // Validate difficulty if provided
  if (questData.difficulty) {
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(questData.difficulty)) {
      errors.push(`Difficulty must be one of: ${validDifficulties.join(', ')}`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate reward data
 * @param {Object} rewardData - Reward data to validate
 * @returns {ValidationResult}
 */
export function validateReward(rewardData) {
  const errors = [];

  // Validate name
  if (!rewardData.name || typeof rewardData.name !== 'string') {
    errors.push('Reward name is required');
  } else if (rewardData.name.trim().length < 3) {
    errors.push('Reward name must be at least 3 characters');
  } else if (rewardData.name.length > 100) {
    errors.push('Reward name is too long (max 100 characters)');
  }

  // Validate description (optional)
  if (rewardData.description && rewardData.description.length > 500) {
    errors.push('Reward description is too long (max 500 characters)');
  }

  // Validate cost
  if (!rewardData.cost || typeof rewardData.cost !== 'number') {
    errors.push('Reward cost is required and must be a number');
  } else if (rewardData.cost < 0) {
    errors.push('Reward cost cannot be negative');
  } else if (rewardData.cost > 100000) {
    errors.push('Reward cost is too high (max 100,000 XP)');
  }

  // Validate image URL if provided
  if (rewardData.image && typeof rewardData.image === 'string') {
    try {
      new URL(rewardData.image);
    } catch {
      errors.push('Reward image must be a valid URL');
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate and sanitize all fields in an object
 * @param {Object} data - Data object to sanitize
 * @param {Array<string>} stringFields - List of fields that should be sanitized as strings
 * @returns {Object} Sanitized data object
 */
export function sanitizeData(data, stringFields = []) {
  const sanitized = { ...data };

  stringFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = sanitizeString(sanitized[field]);
    }
  });

  return sanitized;
}

/**
 * Validate PIN format
 * @param {string} pin - PIN to validate
 * @returns {ValidationResult}
 */
export function validatePIN(pin) {
  const errors = [];

  if (!pin || typeof pin !== 'string') {
    errors.push('PIN is required');
    return { isValid: false, errors };
  }

  if (pin.length < 4) {
    errors.push('PIN must be at least 4 characters');
  }

  if (pin.length > 20) {
    errors.push('PIN is too long (max 20 characters)');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate file upload
 * @param {File} file - File object to validate
 * @param {Object} options - Validation options
 * @param {number} options.maxSize - Maximum file size in bytes (default: 5MB)
 * @param {Array<string>} options.allowedTypes - Allowed MIME types
 * @returns {ValidationResult}
 */
export function validateFileUpload(file, options = {}) {
  const errors = [];
  const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB default
  const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (!file) {
    errors.push('File is required');
    return { isValid: false, errors };
  }

  if (file.size > maxSize) {
    errors.push(`File size exceeds maximum allowed size (${maxSize / 1024 / 1024}MB)`);
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Log validation errors
 * @param {string} context - Context where validation failed
 * @param {Array<string>} errors - List of validation errors
 */
export function logValidationErrors(context, errors) {
  logger.warn(`Validation failed in ${context}`, { errors });
}

export default {
  sanitizeString,
  sanitizeData,
  validateEmail,
  validateChildProfile,
  validateQuest,
  validateReward,
  validatePIN,
  validateFileUpload,
  logValidationErrors
};
