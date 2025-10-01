// Script to set up the first admin user in the system
// Run this once to create an admin user after deploying the new role-based system

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, getDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJP2evMxm1_lX-Hdf6C4sV_nO0c89DL00",
  authDomain: "kiddo-quest-de7b0.firebaseapp.com",
  projectId: "kiddo-quest-de7b0",
  storageBucket: "kiddo-quest-de7b0.firebasestorage.app",
  messagingSenderId: "303359892497",
  appId: "1:303359892497:web:4c9ac1ede46cc8d7d6e5b0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setupAdmin() {
  try {
    const adminEmail = 'thetangstr@gmail.com'; // Replace with your admin email
    
    // Find user by email
    console.log(`Looking for user with email: ${adminEmail}`);
    
    // You'll need to get the user's UID from Firebase Auth console
    // This is just a template - you'll need to replace USER_UID with the actual UID
    const userId = 'USER_UID_HERE'; // Replace with actual UID from Firebase Auth
    
    if (userId === 'USER_UID_HERE') {
      console.log('ERROR: Please replace USER_UID_HERE with the actual user UID from Firebase Auth console');
      console.log('1. Go to Firebase Console > Authentication > Users');
      console.log('2. Find the user with email:', adminEmail);
      console.log('3. Copy their UID and replace USER_UID_HERE in this script');
      return;
    }
    
    // Update user role to admin
    const userRef = doc(db, 'users', userId);
    
    // Check if user exists
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      console.log('User document not found. Please ensure the user has logged in at least once.');
      return;
    }
    
    await updateDoc(userRef, {
      role: 'admin',
      updatedAt: new Date(),
      updatedBy: 'setup-script'
    });
    
    console.log(`Successfully set ${adminEmail} as admin!`);
    console.log('User can now access admin features on next login.');
    
  } catch (error) {
    console.error('Error setting up admin:', error);
  }
}

// Run the setup
setupAdmin();