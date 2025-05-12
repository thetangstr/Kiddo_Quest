// Email allowlist for Kiddo Quest
// This file manages access to the application by checking against the users collection in Firestore

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Default admin email that always has access
 */
export const ADMIN_EMAIL = 'thetangstr@gmail.com';

/**
 * Check if an email is allowed to access the application
 * This function checks if the email exists in the Firestore users collection
 * @param {string} email - The email to check
 * @returns {Promise<boolean>} - Whether the email is allowed
 */
export const isEmailAllowed = async (email) => {
  if (!email) return false;
  
  // Admin email always has access
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  
  // Convert to lowercase for case-insensitive comparison
  const normalizedEmail = email.toLowerCase().trim();
  
  try {
    // Check if the email exists in the users collection with status 'active'
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', normalizedEmail),
      where('status', '==', 'active')
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    return !usersSnapshot.empty;
  } catch (error) {
    console.error('Error checking if email is allowed:', error);
    // If there's an error, default to not allowed
    return false;
  }
};

/**
 * Check if allowlist is enabled
 * Set this to false to disable allowlist checking
 */
export const ALLOWLIST_ENABLED = true;
