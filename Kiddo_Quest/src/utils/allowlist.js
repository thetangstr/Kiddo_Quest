// Email allowlist for Kiddo Quest
// This file manages the list of allowed email addresses for the application

/**
 * List of allowed email addresses that can access the application
 * These users will have automatic access without requiring additional verification
 */
export const ALLOWED_EMAILS = [
  'thetangstr@gmail.com',
  'yteva2017@gmail.com',
  'thetangstr002@gmail.com',
  'thetangstr003@gmail.com',
  'kailortang@gmail.com',
  'fay.f.deng@gmail.com',
  'fengxuexu@gmail.com',
  'tianjieus@gmail.com',
  'peijingtang@gmail.com',
  // Add more allowed emails below this line
];

/**
 * Check if an email is in the allowlist
 * @param {string} email - The email to check
 * @returns {boolean} - Whether the email is allowed
 */
export const isEmailAllowed = (email) => {
  if (!email) return false;
  
  // Convert to lowercase for case-insensitive comparison
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check if email is in the allowlist
  return ALLOWED_EMAILS.some(allowedEmail => 
    allowedEmail.toLowerCase() === normalizedEmail
  );
};

/**
 * Check if allowlist is enabled
 * Set this to false to disable allowlist checking
 */
export const ALLOWLIST_ENABLED = true;
