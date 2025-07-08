// This script directly fixes admin access for both admin users
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Admin emails that should always have admin access
const ADMIN_EMAILS = ['thetangstr@gmail.com', 'yteva2017@gmail.com'];
const SUPER_ADMIN_EMAILS = ['thetangstr@gmail.com'];

/**
 * Run this function to immediately fix admin access issues
 */
export const fixAdminAccess = async () => {
  console.log('🔧 FIXING ADMIN ACCESS 🔧');
  
  try {
    // For each admin email
    for (const email of ADMIN_EMAILS) {
      console.log(`Fixing access for ${email}...`);
      
      // Find user by email (case insensitive)
      const userQuery = query(
        collection(db, 'users'), 
        where('email', '==', email.toLowerCase())
      );
      
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        // User exists
        const userData = userSnapshot.docs[0].data();
        const userId = userSnapshot.docs[0].id;
        
        console.log(`Found user with ID: ${userId}`);
        
        // 1. Update user document with admin flags
        await updateDoc(doc(db, 'users', userId), {
          isAdmin: true,
          isSuperAdmin: SUPER_ADMIN_EMAILS.includes(email.toLowerCase()),
          role: 'admin',
          updatedAt: serverTimestamp()
        });
        console.log(`Updated user document with admin flags`);
        
        // 2. Create or update roles document
        const roleDoc = await getDoc(doc(db, 'roles', userId));
        
        if (!roleDoc.exists()) {
          // Create new role document
          await setDoc(doc(db, 'roles', userId), {
            roles: ['admin'],
            isSuperAdmin: SUPER_ADMIN_EMAILS.includes(email.toLowerCase()),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          console.log(`Created new role document`);
        } else {
          // Update existing role document
          const currentRoles = roleDoc.data().roles || [];
          if (!currentRoles.includes('admin')) {
            currentRoles.push('admin');
          }
          
          await updateDoc(doc(db, 'roles', userId), {
            roles: currentRoles,
            isSuperAdmin: SUPER_ADMIN_EMAILS.includes(email.toLowerCase()),
            updatedAt: serverTimestamp()
          });
          console.log(`Updated existing role document`);
        }
      } else {
        console.log(`User with email ${email} not found. Will be set up on first login.`);
      }
    }
    
    console.log('✅ ADMIN ACCESS FIX COMPLETED SUCCESSFULLY ✅');
    return true;
  } catch (error) {
    console.error('❌ ERROR FIXING ADMIN ACCESS:', error);
    return false;
  }
};

// Export a function to run from the browser console
if (typeof window !== 'undefined') {
  window.fixAdminAccess = fixAdminAccess;
  console.log('Admin access fix function available as window.fixAdminAccess()');
}
