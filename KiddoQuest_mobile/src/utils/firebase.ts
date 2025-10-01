import { Platform } from 'react-native';

// For Expo/React Native, we need to handle Firebase differently
let auth: any;
let firestore: any;
let storage: any;
let firebase: any;

if (Platform.OS === 'web') {
  // Web Firebase implementation using Firebase v9+ modular SDK
  const { initializeApp, getApps } = require('firebase/app');
  const { getAuth } = require('firebase/auth');
  const { getFirestore } = require('firebase/firestore');
  const { getStorage } = require('firebase/storage');
  
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
  };

  // Validate required config
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error('Firebase configuration is missing. Please check your environment variables.');
  }

  // Initialize Firebase for web
  try {
    firebase = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(firebase);
    firestore = getFirestore(firebase);
    storage = getStorage(firebase);
  } catch (error) {
    console.error('Error initializing Firebase for web:', error);
  }
} else {
  // React Native Firebase implementation
  // For React Native, Firebase is auto-initialized from google-services.json/GoogleService-Info.plist
  // We just need to import the services
  try {
    const firebaseApp = require('@react-native-firebase/app').default;
    const firebaseAuth = require('@react-native-firebase/auth').default;
    const firebaseFirestore = require('@react-native-firebase/firestore').default;
    const firebaseStorage = require('@react-native-firebase/storage').default;
    
    firebase = firebaseApp;
    auth = firebaseAuth();
    firestore = firebaseFirestore();
    storage = firebaseStorage();
  } catch (error) {
    console.error('Error initializing Firebase for React Native:', error);
  }
}

// Helper functions that provide a consistent API across platforms
export const getAuth = () => {
  return auth;
};

export const getFirestore = () => {
  return firestore;
};

export const getStorage = () => {
  return storage;
};

export const signInWithEmailAndPassword = async (email: string, password: string) => {
  if (Platform.OS === 'web') {
    const { signInWithEmailAndPassword } = require('firebase/auth');
    return await signInWithEmailAndPassword(auth, email, password);
  } else {
    return await auth.signInWithEmailAndPassword(email, password);
  }
};

export const createUserWithEmailAndPassword = async (email: string, password: string) => {
  if (Platform.OS === 'web') {
    const { createUserWithEmailAndPassword } = require('firebase/auth');
    return await createUserWithEmailAndPassword(auth, email, password);
  } else {
    return await auth.createUserWithEmailAndPassword(email, password);
  }
};

export const signOut = async () => {
  if (Platform.OS === 'web') {
    const { signOut } = require('firebase/auth');
    return await signOut(auth);
  } else {
    return await auth.signOut();
  }
};

export const onAuthStateChanged = (callback: (user: any) => void) => {
  if (Platform.OS === 'web') {
    const { onAuthStateChanged } = require('firebase/auth');
    return onAuthStateChanged(auth, callback);
  } else {
    return auth.onAuthStateChanged(callback);
  }
};

// Export the Firebase instances for direct use
export { auth, firestore, storage, firebase };

export default {
  getAuth,
  getFirestore,
  getStorage,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
};
