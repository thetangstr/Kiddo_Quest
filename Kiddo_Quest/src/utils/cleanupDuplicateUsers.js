// Utility to clean up duplicate users in Firestore
import { collection, getDocs, query, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Clean up duplicate users in the Firestore users collection
 * Keeps the most recently active user for each email address
 */
export const cleanupDuplicateUsers = async () => {
  console.log('🧹 Starting duplicate user cleanup...');
  
  try {
    // Get all users from the users collection
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    
    // Group users by email (case-insensitive)
    const usersByEmail = new Map();
    
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      const email = userData.email?.toLowerCase().trim();
      
      if (email) {
        if (!usersByEmail.has(email)) {
          usersByEmail.set(email, []);
        }
        usersByEmail.get(email).push({
          id: doc.id,
          data: userData,
          lastLogin: userData.lastLogin,
          createdAt: userData.createdAt
        });
      }
    });
    
    let duplicatesFound = 0;
    let duplicatesRemoved = 0;
    
    // Process each email group
    for (const [email, users] of usersByEmail) {
      if (users.length > 1) {
        duplicatesFound += users.length - 1;
        console.log(`Found ${users.length} users for email: ${email}`);
        
        // Sort users to find the best one to keep
        // Priority: 1) Most recent login, 2) Most recent creation, 3) First by ID
        users.sort((a, b) => {
          // Compare last login
          if (a.lastLogin && b.lastLogin) {
            return b.lastLogin.toDate() - a.lastLogin.toDate();
          }
          if (a.lastLogin && !b.lastLogin) return -1;
          if (!a.lastLogin && b.lastLogin) return 1;
          
          // Compare creation date
          if (a.createdAt && b.createdAt) {
            return b.createdAt.toDate() - a.createdAt.toDate();
          }
          if (a.createdAt && !b.createdAt) return -1;
          if (!a.createdAt && b.createdAt) return 1;
          
          // Fallback to ID comparison
          return a.id.localeCompare(b.id);
        });
        
        const userToKeep = users[0];
        const usersToDelete = users.slice(1);
        
        console.log(`Keeping user ${userToKeep.id} for ${email}`);
        
        // Update the kept user with consolidated data
        const consolidatedData = {
          ...userToKeep.data,
          email: email, // Ensure consistent email format
          status: userToKeep.data.status || 'inactive',
          updatedAt: serverTimestamp(),
          cleanupDate: serverTimestamp()
        };
        
        await updateDoc(doc(db, 'users', userToKeep.id), consolidatedData);
        
        // Delete duplicate users
        for (const userToDelete of usersToDelete) {
          console.log(`Deleting duplicate user ${userToDelete.id} for ${email}`);
          await deleteDoc(doc(db, 'users', userToDelete.id));
          duplicatesRemoved++;
        }
      }
    }
    
    console.log(`✅ Cleanup completed:`);
    console.log(`   - ${duplicatesFound} duplicate users found`);
    console.log(`   - ${duplicatesRemoved} duplicate users removed`);
    console.log(`   - ${usersByEmail.size} unique email addresses remaining`);
    
    return {
      success: true,
      duplicatesFound,
      duplicatesRemoved,
      uniqueEmails: usersByEmail.size
    };
    
  } catch (error) {
    console.error('❌ Error during duplicate user cleanup:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Export a function to run from the browser console
if (typeof window !== 'undefined') {
  window.cleanupDuplicateUsers = cleanupDuplicateUsers;
  console.log('Duplicate user cleanup function available as window.cleanupDuplicateUsers()');
}
