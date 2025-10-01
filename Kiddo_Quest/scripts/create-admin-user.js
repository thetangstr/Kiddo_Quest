// Script to create admin user for testing
// Run this with: node scripts/create-admin-user.js

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration (same as in your app)
const firebaseConfig = {
  apiKey: "AIzaSyCJP2evMxm1_lX-Hdf6C4sV_nO0c89DL00",
  authDomain: "kiddo-quest-de7b0.firebaseapp.com",
  projectId: "kiddo-quest-de7b0",
  storageBucket: "kiddo-quest-de7b0.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef1234567890"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminUser() {
  const adminEmail = 'testadmin@example.com'; // Use a test email instead
  const adminPassword = 'TestAdmin123!';
  
  try {
    console.log('Attempting to create test admin user...');
    
    // Try to create the user
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;
    
    console.log('Test admin user created successfully:', user.uid);
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: adminEmail,
      createdAt: serverTimestamp(),
      isAdmin: true,
      status: 'active',
      role: 'parent'
    });
    
    console.log('Test admin user document created in Firestore');
    
    console.log('✅ Test admin user setup complete!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Test admin user already exists, trying to sign in...');
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        console.log('✅ Test admin user sign-in successful:', userCredential.user.uid);
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);
      } catch (signInError) {
        console.log('❌ Test admin user exists but sign-in failed:', signInError.message);
      }
    } else {
      console.error('❌ Error creating test admin user:', error.message);
    }
  }
}

createAdminUser().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
