// Firebase configuration for Kiddo Quest
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCJP2evMxm1_lX-Hdf6C4sV_nO0c89DL00",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "kiddo-quest-de7b0.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "kiddo-quest-de7b0",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "kiddo-quest-de7b0.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "303359892497",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:303359892497:web:4c9ac1ede46cc8d7d6e5b0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, storage, googleProvider };
