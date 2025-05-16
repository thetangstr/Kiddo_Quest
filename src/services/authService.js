import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  linkWithCredential,
  fetchSignInMethodsForEmail,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { checkUserAuthStatus, trackUserLogin } from '../utils/authUtils';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

/**
 * Comprehensive authentication service for Kiddo Quest
 * Handles user registration, login, profile management, and admin functions
 */
class AuthService {
  // User Registration
  
  /**
   * Register a new user with email and password
   * @param {Object} userData - User data including email, password, etc.
   * @returns {Promise<Object>} User object
   */
  async registerUser(userData) {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      const user = userCredential.user;
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: userData.email.toLowerCase(),
        displayName: userData.displayName || '',
        photoURL: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        status: 'pending', // Initially pending until email verified or admin activates
        isAdmin: false,
        authEnabled: true,
        emailVerified: false
      });
      
      return user;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }
  
  /**
   * Create a new user by admin (bypasses email verification)
   * @param {Object} userData - User data including email, password, role, etc.
   * @returns {Promise<Object>} User object
   */
  async createUserByAdmin(userData) {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      const user = userCredential.user;
      
      // Create user document in Firestore with active status
      await setDoc(doc(db, 'users', user.uid), {
        email: userData.email.toLowerCase(),
        displayName: userData.displayName || '',
        photoURL: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        status: 'active', // Active by default when created by admin
        isAdmin: !!userData.isAdmin,
        authEnabled: true,
        emailVerified: true // Auto-verify when created by admin
      });
      
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  /**
   * Sign in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User object
   */
  async signInWithEmailPassword(email, password) {
    try {
      // First verify this is a valid email format
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      
      // Normalize email to lowercase
      email = email.toLowerCase();
      
      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check user auth status and permissions in Firestore
      const userData = await checkUserAuthStatus(user);
      
      // Track the login activity
      await trackUserLogin(user.uid, email);
      
      // Return enhanced user object
      return {
        uid: user.uid,
        email: user.email,
        displayName: userData.displayName || '',
        photoURL: userData.photoURL || '',
        emailVerified: user.emailVerified,
        isAdmin: userData.isAdmin || false,
        status: userData.status || 'active',
        role: 'parent',
        authEnabled: userData.authEnabled !== false
      };
    } catch (error) {
      console.error('Error signing in with email/password:', error);
      // Add more user-friendly error messages
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many login attempts. Please try again later');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('This account has been disabled. Please contact support.');
      }
      throw error;
    }
  }
  
  /**
   * Sign in with Google
   * @returns {Promise<Object>} User object and linking status
   */
  async signInWithGoogle() {
    try {
      // Configure Google provider to show account picker
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userEmail = user.email.toLowerCase();
      
      // Check if this email already exists with a different auth method
      const methods = await fetchSignInMethodsForEmail(auth, userEmail);
      
      // If email exists but not with Google, we need to handle account linking
      if (methods.length > 0 && !methods.includes('google.com')) {
        return {
          user,
          needsLinking: true,
          existingMethods: methods
        };
      }
      
      // Special case for admin and known users
      const specialEmails = [
        'thetangstr@gmail.com', 
        'fayfdeng@gmail.com', 
        'fay.f.deng@gmail.com', 
        'yangtangwork@gmail.com',
        'yang.tang.work@gmail.com'
      ].map(email => email.toLowerCase());
      
      // Special case for admin
      if (userEmail === 'thetangstr@gmail.com') {
        // Create or update admin user in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: userEmail,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          status: 'active',
          isAdmin: true,
          authEnabled: true,
          emailVerified: true
        }, { merge: true });
        
        // Record login activity
        await trackUserLogin(user.uid, userEmail);
        
        return {
          uid: user.uid,
          email: userEmail,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          emailVerified: true,
          isAdmin: true,
          status: 'active',
          role: 'parent',
          authProvider: 'google'
        };
      } 
      
      // Special case for known users
      if (specialEmails.includes(userEmail)) {
        // Create or update special user in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: userEmail,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          status: 'active',
          isAdmin: false,
          authEnabled: true,
          emailVerified: true
        }, { merge: true });
        
        // Record login activity
        await trackUserLogin(user.uid, userEmail);
        
        return {
          uid: user.uid,
          email: userEmail,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          emailVerified: true,
          isAdmin: false,
          status: 'active',
          role: 'parent',
          authProvider: 'google'
        };
      }
      
      // For all other users, check if they exist in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Update login information
        await updateDoc(doc(db, 'users', user.uid), {
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
          photoURL: user.photoURL || userData.photoURL || '',
          displayName: user.displayName || userData.displayName || ''
        });
        
        // Record login activity
        await trackUserLogin(user.uid, userEmail);
        
        return {
          uid: user.uid,
          email: userEmail,
          displayName: user.displayName || userData.displayName || '',
          photoURL: user.photoURL || userData.photoURL || '',
          emailVerified: user.emailVerified,
          isAdmin: userData.isAdmin || false,
          status: userData.status || 'pending',
          role: 'parent',
          authProvider: 'google'
        };
      } else {
        // Create new user entry in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: userEmail,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          status: 'pending', // New users need admin approval
          isAdmin: false,
          authEnabled: true,
          emailVerified: user.emailVerified,
          authProvider: 'google'
        });
        
        // Record signup activity
        await addDoc(collection(db, 'userActivity'), {
          userId: user.uid,
          email: userEmail,
          type: 'signup',
          method: 'google',
          timestamp: serverTimestamp()
        });
        
        return {
          uid: user.uid,
          email: userEmail,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          emailVerified: user.emailVerified,
          isAdmin: false,
          status: 'pending',
          role: 'parent',
          authProvider: 'google'
        };
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Sign-in popup was blocked. Please enable popups for this site and try again.');
      }
      throw error;
    }
  }
  
  /**
   * Link email account with Google account
   * @param {Object} googleUser - Google user object
   * @param {string} password - Password for existing email account
   * @returns {Promise<Object>} Combined user object
   */
  async linkGoogleWithExistingAccount(googleUser, password) {
    try {
      // Sign in with email and password first
      const userEmail = googleUser.email;
      const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
      const user = userCredential.user;
      
      // Create Google auth credential
      const credential = GoogleAuthProvider.credential(
        googleUser.getAuthResponse().id_token
      );
      
      // Link the two accounts
      await linkWithCredential(user, credential);
      
      // Update user document in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        googleLinked: true,
        updatedAt: serverTimestamp()
      });
      
      // Record account linking
      await addDoc(collection(db, 'userActivity'), {
        userId: user.uid,
        email: userEmail,
        type: 'account_linking',
        method: 'google',
        timestamp: serverTimestamp()
      });
      
      return user;
    } catch (error) {
      console.error('Error linking accounts:', error);
      throw error;
    }
  }
  
  /**
   * Reset password via email
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async resetPassword(email) {
    try {
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      
      // Send password reset email
      await sendPasswordResetEmail(auth, email);
      
      // Log the password reset request
      await addDoc(collection(db, 'userActivity'), {
        email: email.toLowerCase(),
        type: 'password_reset_request',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }
  
  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      const user = auth.currentUser;
      if (user) {
        // Log the sign out
        await addDoc(collection(db, 'userActivity'), {
          userId: user.uid,
          email: user.email,
          type: 'logout',
          timestamp: serverTimestamp()
        });
      }
      
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
  
  /**
   * Get all users from Firestore
   * @returns {Promise<Array>} Array of user objects
   */
  async getAllUsers() {
    try {
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      
      return usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }
  
  /**
   * Send an invitation to a new user
   * @param {Object} invitationData - Data for the invitation
   * @returns {Promise<Object>} Created user object
   */
  async sendInvitation(invitationData) {
    try {
      const { email, tempPassword, message, sentBy } = invitationData;
      
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      
      // Check if user already exists
      const userQuery = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
      const userSnapshot = await getDocs(userQuery);
      
      let userId;
      
      if (userSnapshot.empty) {
        // Create new user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
        userId = userCredential.user.uid;
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', userId), {
          email: email.toLowerCase(),
          displayName: '',
          photoURL: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          status: 'pending', // Pending until user completes setup
          isAdmin: false,
          authEnabled: true,
          emailVerified: false,
          needsPasswordChange: true
        });
      } else {
        // User already exists, get their ID
        userId = userSnapshot.docs[0].id;
        
        // Update user status to active
        await updateDoc(doc(db, 'users', userId), {
          status: 'active',
          authEnabled: true,
          updatedAt: serverTimestamp()
        });
      }
      
      // Create invitation record
      await addDoc(collection(db, 'invitations'), {
        userId,
        email: email.toLowerCase(),
        message,
        sentBy: sentBy || auth.currentUser?.email || 'system',
        status: 'sent',
        createdAt: serverTimestamp()
      });
      
      return { userId, email };
    } catch (error) {
      console.error('Error sending invitation:', error);
      throw error;
    }
  }
}

export default new AuthService();
