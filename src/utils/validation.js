/**
 * Utility functions for data validation throughout the application
 */

/**
 * Validates child profile data
 * @param {Object} profileData - Child profile data to validate
 * @returns {Object} Validation result with success status and error message
 */
export const validateChildProfile = (profileData) => {
  const errors = [];
  
  if (!profileData.name || profileData.name.trim() === '') {
    errors.push('Child name is required');
  }
  
  if (profileData.name && profileData.name.length > 50) {
    errors.push('Child name must be less than 50 characters');
  }
  
  // Avatar is optional, but if provided, validate it
  if (profileData.avatarFile) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(profileData.avatarFile.type)) {
      errors.push('Avatar must be a valid image file (JPEG, PNG, GIF, or WEBP)');
    }
    
    // 5MB max size
    if (profileData.avatarFile.size > 5 * 1024 * 1024) {
      errors.push('Avatar file size must be less than 5MB');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates quest data
 * @param {Object} questData - Quest data to validate
 * @returns {Object} Validation result with success status and error message
 */
export const validateQuest = (questData) => {
  const errors = [];
  
  if (!questData.title || questData.title.trim() === '') {
    errors.push('Quest title is required');
  }
  
  if (questData.title && questData.title.length > 100) {
    errors.push('Quest title must be less than 100 characters');
  }
  
  if (!questData.points || isNaN(questData.points) || questData.points < 0) {
    errors.push('Quest points must be a positive number');
  }
  
  if (questData.recurring) {
    if (!questData.frequency) {
      errors.push('Frequency is required for recurring quests');
    }
    
    if (questData.penaltyPoints && (isNaN(questData.penaltyPoints) || questData.penaltyPoints < 0)) {
      errors.push('Penalty points must be a positive number');
    }
    
    if (questData.maxPenalties && (isNaN(questData.maxPenalties) || questData.maxPenalties < 0)) {
      errors.push('Maximum penalties must be a positive number');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates reward data
 * @param {Object} rewardData - Reward data to validate
 * @returns {Object} Validation result with success status and error message
 */
export const validateReward = (rewardData) => {
  const errors = [];
  
  if (!rewardData.title || rewardData.title.trim() === '') {
    errors.push('Reward title is required');
  }
  
  if (rewardData.title && rewardData.title.length > 100) {
    errors.push('Reward title must be less than 100 characters');
  }
  
  if (!rewardData.points || isNaN(rewardData.points) || rewardData.points <= 0) {
    errors.push('Reward points must be a positive number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates PIN
 * @param {string} pin - PIN to validate
 * @param {string} confirmPin - Confirmation PIN (optional)
 * @returns {Object} Validation result with success status and error message
 */
export const validatePin = (pin, confirmPin = null) => {
  const errors = [];
  
  if (!pin || pin.length !== 4) {
    errors.push('PIN must be exactly 4 digits');
  }
  
  if (!/^\d+$/.test(pin)) {
    errors.push('PIN must contain only digits');
  }
  
  if (confirmPin !== null && pin !== confirmPin) {
    errors.push('PINs do not match');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
