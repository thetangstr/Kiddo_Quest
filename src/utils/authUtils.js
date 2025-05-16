import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Check if a user is allowed to login based on their Firestore record
 * @param {Object} user - Firebase Auth user object
 * @returns {Promise<Object>} The user data with additional auth status
 */
export const checkUserAuthStatus = async (user) => {
  if (!user || !user.uid) {
    throw new Error('Invalid user object');
  }
  
  try {
    // Get the user document from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    // If user document doesn't exist, create a basic one
    if (!userDoc.exists()) {
      throw new Error('User record not found in database. Please contact an administrator.');
    }
    
    const userData = userDoc.data();
    
    // Check if user is allowed to authenticate
    if (userData.status === 'inactive' || userData.authEnabled === false) {
      throw new Error('Your account is inactive or has been disabled. Please contact an administrator.');
    }
    
    // Update the last login time
    await updateDoc(doc(db, 'users', user.uid), {
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return {
      ...userData,
      uid: user.uid,
      email: user.email || userData.email,
      displayName: user.displayName || userData.displayName || '',
      photoURL: user.photoURL || userData.photoURL || '',
      emailVerified: user.emailVerified || userData.emailVerified || false
    };
  } catch (error) {
    console.error('Error checking user auth status:', error);
    throw error;
  }
};

/**
 * Track user login activity
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export const trackUserLogin = async (userId, email) => {
  try {
    const today = new Date();
    const docRef = doc(db, 'userActivity', userId);
    const activityDoc = await getDoc(docRef);
    
    if (activityDoc.exists()) {
      // Update existing activity document
      await updateDoc(docRef, {
        lastLogin: serverTimestamp(),
        loginCount: (activityDoc.data().loginCount || 0) + 1,
        email: email
      });
    } else {
      // Create new activity document
      await updateDoc(docRef, {
        userId,
        email,
        lastLogin: serverTimestamp(),
        loginCount: 1,
        firstLogin: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error tracking user login:', error);
    // Non-critical error, don't throw
  }
};
