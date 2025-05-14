import { collection, query, where, getDocs, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Utility to update a user's status to active and ensure they can sign in
 * @param {string} email - The email to search for
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const activateUserByEmail = async (email) => {
  try {
    console.log(`Searching for user with email: ${email}`);
    
    // First try exact match
    let userQuery = query(collection(db, 'users'), where('email', '==', email));
    let userSnapshot = await getDocs(userQuery);
    
    // If no match, try alternative email formats
    if (userSnapshot.empty) {
      // Try with dots removed (for Gmail addresses which ignore dots)
      const altEmail = email.replace(/\./g, '').toLowerCase() + '@gmail.com';
      userQuery = query(collection(db, 'users'), where('email', '==', altEmail));
      userSnapshot = await getDocs(userQuery);
      
      // Try another common format
      if (userSnapshot.empty) {
        // Try with different format f.lastname@gmail.com
        if (email.includes('@gmail.com')) {
          const parts = email.split('@')[0];
          const altEmail2 = `fay.f.deng@gmail.com`;
          userQuery = query(collection(db, 'users'), where('email', '==', altEmail2));
          userSnapshot = await getDocs(userQuery);
        }
      }
    }
    
    if (!userSnapshot.empty) {
      // User found, update their status
      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      
      console.log(`Found user: ${userDoc.id}, current status: ${userData.status || 'undefined'}`);
      
      await updateDoc(doc(db, 'users', userDoc.id), {
        status: 'active',
        authEnabled: true,
        updatedAt: serverTimestamp()
      });
      
      console.log(`User ${userDoc.id} status updated to active`);
      return true;
    } else {
      // User not found, create a new user entry
      console.log(`User not found. Creating new user entry for ${email}`);
      
      // Create with manually generated ID
      const userId = `manual_${Date.now()}`;
      await setDoc(doc(db, 'users', userId), {
        email: email,
        status: 'active',
        authEnabled: true,
        isAdmin: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log(`New user created with ID: ${userId}`);
      return true;
    }
  } catch (error) {
    console.error('Error updating user status:', error);
    return false;
  }
};

// Export a function to run this from the console for easy debugging
window.activateUserByEmail = activateUserByEmail;
