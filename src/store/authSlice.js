import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  setDoc 
} from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * Authentication slice for the Kiddo Quest store
 * Handles user authentication, registration, and session management
 */
export const createAuthSlice = (set, get) => ({
  // --- Authentication State ---
  currentUser: null, 
  isLoadingAuth: true,
  
  // --- Authentication Actions ---
  setCurrentUser: (user, view = 'parentDashboard') => {
    set({ 
      currentUser: user, 
      currentView: view, 
      isLoadingAuth: false 
    });
  },
  
  loginParent: async (email, password) => {
    set({ isLoadingAuth: true });
    try {
      // Always allow admin email
      if (email !== 'thetangstr@gmail.com') {
        // Check if user already exists in the active users collection
        const userQuery = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
        const userSnapshot = await getDocs(userQuery);
        
        // If user doesn't exist in the users collection, deny access
        if (userSnapshot.empty) {
          set({ isLoadingAuth: false });
          throw new Error('Access denied. Your email is not authorized to use this application.');
        }
        
        // Check if user is active
        const userData = userSnapshot.docs[0].data();
        if (userData.status === 'inactive') {
          set({ isLoadingAuth: false });
          throw new Error('Your account has been deactivated. Please contact the administrator.');
        }
      }
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Get user profile from Firestore to check if passcode exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        // We can use userData in the future if needed
        // const userData = userDoc.data();
        const parentUser = { 
          uid: user.uid, 
          email: user.email, 
          role: 'parent',
          // Explicitly track if user is admin
          isAdmin: user.email === 'thetangstr@gmail.com'
        };
        
        set({ 
          currentUser: parentUser, 
          currentView: parentUser.isAdmin ? 'adminDashboard' : 'parentDashboard', 
          isLoadingAuth: false 
        });
        
        await get().fetchParentData(parentUser.uid);
        return parentUser;
      } else {
        // Create user document if it doesn't exist (first email login)
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          createdAt: serverTimestamp(),
          // Store admin status in Firestore
          isAdmin: user.email === 'thetangstr@gmail.com'
        });
        
        const parentUser = { 
          uid: user.uid, 
          email: user.email, 
          role: 'parent',
          isAdmin: user.email === 'thetangstr@gmail.com'
        };
        
        set({ 
          currentUser: parentUser, 
          currentView: parentUser.isAdmin ? 'adminDashboard' : 'parentDashboard', 
          isLoadingAuth: false 
        });
        
        // Create default quests and rewards for new users
        await get().createDefaultQuestsAndRewards(user.uid);
        
        return parentUser;
      }
    } catch (error) {
      set({ isLoadingAuth: false });
      throw error;
    }
  },
  
  loginWithGoogle: async () => {
    set({ isLoadingAuth: true });
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user is in the allowlist (if enabled)
      // For now, we'll allow all Google logins
      
      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        // User exists, check if they're active
        const userData = userDoc.data();
        
        if (userData.status === 'inactive') {
          await signOut(auth);
          set({ isLoadingAuth: false });
          throw new Error('Your account has been deactivated. Please contact the administrator.');
        }
        
        const parentUser = { 
          uid: user.uid, 
          email: user.email, 
          role: 'parent',
          isAdmin: user.email === 'thetangstr@gmail.com'
        };
        
        set({ 
          currentUser: parentUser, 
          currentView: parentUser.isAdmin ? 'adminDashboard' : 'parentDashboard', 
          isLoadingAuth: false 
        });
        
        await get().fetchParentData(parentUser.uid);
        return parentUser;
      } else {
        // Create user document if it doesn't exist (first Google login)
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          createdAt: serverTimestamp(),
          isAdmin: user.email === 'thetangstr@gmail.com'
        });
        
        const parentUser = { 
          uid: user.uid, 
          email: user.email, 
          role: 'parent',
          isAdmin: user.email === 'thetangstr@gmail.com'
        };
        
        set({ 
          currentUser: parentUser, 
          currentView: parentUser.isAdmin ? 'adminDashboard' : 'parentDashboard', 
          isLoadingAuth: false 
        });
        
        // Create default quests and rewards for new users
        await get().createDefaultQuestsAndRewards(user.uid);
        
        return parentUser;
      }
    } catch (error) {
      set({ isLoadingAuth: false });
      throw error;
    }
  },
  
  registerParent: async (email, password) => {
    set({ isLoadingAuth: true });
    try {
      // Create the user in Firebase Auth
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        createdAt: serverTimestamp(),
        isAdmin: user.email === 'thetangstr@gmail.com'
      });
      
      const parentUser = { 
        uid: user.uid, 
        email: user.email, 
        role: 'parent',
        isAdmin: user.email === 'thetangstr@gmail.com'
      };
      
      set({ 
        currentUser: parentUser, 
        currentView: 'parentDashboard', 
        isLoadingAuth: false 
      });
      
      // Create default quests and rewards for new users
      await get().createDefaultQuestsAndRewards(user.uid);
      
      return parentUser;
    } catch (error) {
      set({ isLoadingAuth: false });
      throw error;
    }
  },
  
  logout: async () => {
    try {
      await signOut(auth);
      set({ 
        currentUser: null, 
        currentView: 'login',
        childProfiles: [],
        quests: [],
        questCompletions: [],
        rewards: []
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  },
  
  checkAuthStatus: () => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Check if user is active
            if (userData.status === 'inactive') {
              await signOut(auth);
              set({ 
                currentUser: null, 
                currentView: 'login', 
                isLoadingAuth: false 
              });
              return;
            }
            
            const parentUser = { 
              uid: user.uid, 
              email: user.email, 
              role: 'parent',
              isAdmin: user.email === 'thetangstr@gmail.com'
            };
            
            set({ 
              currentUser: parentUser, 
              currentView: parentUser.isAdmin ? 'adminDashboard' : 'parentDashboard', 
              isLoadingAuth: false 
            });
            
            await get().fetchParentData(parentUser.uid);
          } else {
            // Create user document if it doesn't exist
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              createdAt: serverTimestamp(),
              isAdmin: user.email === 'thetangstr@gmail.com'
            });
            
            const parentUser = { 
              uid: user.uid, 
              email: user.email, 
              role: 'parent',
              isAdmin: user.email === 'thetangstr@gmail.com'
            };
            
            set({ 
              currentUser: parentUser, 
              currentView: 'parentDashboard', 
              isLoadingAuth: false 
            });
            
            // Create default quests and rewards for new users
            await get().createDefaultQuestsAndRewards(user.uid);
          }
        } catch (error) {
          console.error('Error checking auth status:', error);
          set({ isLoadingAuth: false });
        }
      } else {
        set({ 
          currentUser: null, 
          currentView: 'login', 
          isLoadingAuth: false 
        });
      }
    });
  }
});
