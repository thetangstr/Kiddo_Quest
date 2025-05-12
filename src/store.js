import { create } from 'zustand';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  browserLocalPersistence
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  setDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage, googleProvider } from './firebase';
import { SUBSCRIPTION_TIERS, FEATURES, isFeatureAvailable } from './utils/subscriptionManager';

// Zustand Store for Global State Management
const useKiddoQuestStore = create((set, get) => ({
  // --- Authentication State ---
  currentUser: null, 
  isLoadingAuth: true,
  requirePin: false,

  // --- Data State (will be populated from Firestore) ---
  childProfiles: [], 
  quests: [],
  questCompletions: [], // Track quest completions per child
  rewards: [],
  
  // --- UI State ---
  currentView: 'login', 
  selectedChildIdForDashboard: null,
  editingQuestId: null, 
  editingRewardId: null,
  isLoadingData: false, // General data loading indicator
  
  // --- Subscription State ---
  subscriptionTier: SUBSCRIPTION_TIERS.FREE, // Default to free tier
  subscriptionFeatures: {}, // Will be populated based on tier
  isIconPickerOpen: false,
  iconPickerCallback: null,

  // --- PIN Management ---
  hasParentPin: async () => {
    try {
      const user = auth.currentUser;
      if (!user) return false;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return false;
      
      const userData = userDoc.data();
      return userData.parentPin ? true : false;
    } catch (error) {
      console.error('Error checking for PIN:', error);
      return false;
    }
  },
  
  setParentPin: async (pin) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }
      
      // Hash the PIN before storing it
      // In a real app, use a proper hashing algorithm with salt
      // This is a simple hash for demonstration purposes
      const hashedPin = btoa(pin); // Base64 encoding (not secure for production)
      
      await updateDoc(doc(db, 'users', user.uid), {
        parentPin: hashedPin,
        pinUpdatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error setting PIN:', error);
      return { success: false, error: error.message };
    }
  },
  
  verifyParentPin: async (pin) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        return { success: false, error: 'User data not found' };
      }
      
      const userData = userDoc.data();
      if (!userData.parentPin) {
        return { success: false, error: 'No PIN set' };
      }
      
      // Hash the input PIN and compare with stored hash
      const hashedPin = btoa(pin);
      
      if (hashedPin === userData.parentPin) {
        set({ requirePin: false });
        return { success: true };
      } else {
        return { success: false, error: 'Incorrect PIN' };
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return { success: false, error: error.message };
    }
  },
  
  setRequirePin: (require) => {
    set({ requirePin: require });
  },
  
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
        return parentUser;
      }
    } catch (error) {
      set({ isLoadingAuth: false });
      throw error;
    }
  },
  
  loginWithGoogle: async () => {
    try {
      set({ isLoadingAuth: true });
      
      // Sign in with Google popup
      const provider = new GoogleAuthProvider();
      
      // Add login hint to improve the login experience
      provider.setCustomParameters({
        prompt: 'select_account',
        login_hint: 'thetangstr@gmail.com'
      });
      
      // Persist the auth state to prevent refresh issues
      auth.setPersistence(browserLocalPersistence);
      
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email;
      
      console.log('Google login attempt:', userEmail);
      
      // Special case for admin - always allow and set admin privileges
      if (userEmail === 'thetangstr@gmail.com') {
        console.log('Admin login detected');
        
        // Create or update admin user in Firestore
        await setDoc(doc(db, 'users', result.user.uid), {
          email: userEmail,
          displayName: result.user.displayName || '',
          photoURL: result.user.photoURL || '',
          lastLogin: serverTimestamp(),
          lastLoginAt: new Date().toISOString(),
          createdAt: serverTimestamp(),
          status: 'active',
          isAdmin: true,
          loginCount7Days: 1,
          authEnabled: true
        }, { merge: true });
        
        // Set admin user in state
        const adminUser = { 
          uid: result.user.uid, 
          email: userEmail, 
          role: 'parent',
          isAdmin: true
        };
        
        // Update state with admin user
        set({ 
          currentUser: adminUser, 
          currentView: 'adminDashboard', 
          isLoadingAuth: false 
        });
        
        // Record login activity
        await addDoc(collection(db, 'userActivity'), {
          userId: result.user.uid,
          email: userEmail,
          type: 'login',
          timestamp: serverTimestamp()
        });
        
        // Wait a moment to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return adminUser;
      }
      
      // For non-admin users, check if they exist in Firestore
      const userQuery = query(collection(db, 'users'), where('email', '==', userEmail));
      const userSnapshot = await getDocs(userQuery);
      
      // Check if user has a valid invitation
      const invitationQuery = query(collection(db, 'invitations'), where('email', '==', userEmail));
      const invitationSnapshot = await getDocs(invitationQuery);
      
      // Allow access if:
      // 1. User exists in the users collection
      // 2. User has a valid invitation
      if (!userSnapshot.empty || !invitationSnapshot.empty) {
        // If user doesn't exist but has an invitation, create the user
        if (userSnapshot.empty && !invitationSnapshot.empty) {
          // Create new user in Firestore
          await setDoc(doc(db, 'users', result.user.uid), {
            email: userEmail,
            displayName: result.user.displayName || '',
            photoURL: result.user.photoURL || '',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            loginCount: 1,
            status: 'active',
            isAdmin: false,
            authEnabled: true
          });
          
          // Update invitation status
          const invitationDoc = invitationSnapshot.docs[0];
          await updateDoc(doc(db, 'invitations', invitationDoc.id), {
            status: 'accepted',
            acceptedAt: serverTimestamp()
          });
        } else if (!userSnapshot.empty) {
          // Update existing user's login information
          const userDoc = userSnapshot.docs[0];
          const userData = userDoc.data();
          
          // Link the Firebase Auth user with the Firestore user if they were created separately
          // This happens if the user was created directly in Firestore when Email/Password auth was disabled
          if (userData.authEnabled === false && userDoc.id.startsWith('manual_')) {
            console.log('Linking manually created Firestore user with Firebase Auth account');
            
            // Create a new user document with the Firebase Auth UID
            await setDoc(doc(db, 'users', result.user.uid), {
              ...userData,
              email: userEmail,
              displayName: result.user.displayName || '',
              photoURL: result.user.photoURL || '',
              lastLogin: serverTimestamp(),
              loginCount: (userData.loginCount || 0) + 1,
              authEnabled: true,
              linkedFromManualId: userDoc.id,
              passwordHash: null // Remove any stored password hash
            });
            
            // Mark the old document as migrated but don't delete it yet
            await updateDoc(doc(db, 'users', userDoc.id), {
              status: 'migrated',
              migratedToId: result.user.uid,
              migratedAt: serverTimestamp()
            });
          } else {
            // Normal update for existing user
            await updateDoc(doc(db, 'users', userDoc.id), {
              lastLogin: serverTimestamp(),
              loginCount: (userData.loginCount || 0) + 1
            });
          }
        }
        
        // Set user in state
        const parentUser = { 
          uid: result.user.uid, 
          email: userEmail, 
          role: 'parent',
          isAdmin: userEmail === 'thetangstr@gmail.com'
        };
        
        set({ 
          currentUser: parentUser, 
          currentView: parentUser.isAdmin ? 'adminDashboard' : 'parentDashboard', 
          isLoadingAuth: false 
        });
        
        // Record login activity
        await addDoc(collection(db, 'userActivity'), {
          userId: result.user.uid,
          email: userEmail,
          type: 'login',
          timestamp: serverTimestamp()
        });
        
        // Update user's last login time and count if needed
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          const userData = userDoc.data();
          await updateDoc(doc(db, 'users', result.user.uid), {
            lastLogin: serverTimestamp(),
            lastLoginAt: new Date().toISOString(),
            loginCount7Days: (userData.loginCount7Days || 0) + 1
          });
        }
        
        await get().fetchParentData(parentUser.uid);
        return parentUser;
      } else if (userEmail === 'thetangstr@gmail.com') {
        // Special case for admin user's first login
        await setDoc(doc(db, 'users', result.user.uid), {
          email: userEmail,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          lastLoginAt: new Date().toISOString(),
          status: 'active',
          isAdmin: true,
          loginCount7Days: 1
        });
        
        const adminUser = { 
          uid: result.user.uid, 
          email: userEmail, 
          role: 'parent',
          isAdmin: true
        };
        
        set({ 
          currentUser: adminUser, 
          currentView: 'adminDashboard', 
          isLoadingAuth: false 
        });
        
        await get().fetchParentData(result.user.uid);
        await get().createDefaultQuestsAndRewards(result.user.uid);
        return adminUser;
      } else {
        // This should not happen due to the earlier checks, but just in case
        await signOut(auth);
        set({ isLoadingAuth: false });
        throw new Error('An unexpected error occurred. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Google login error:', error);
      set({ isLoadingAuth: false });
      throw error;
    }
  },
  
  registerParent: async (email, password) => {
    set({ isLoadingAuth: true });
    try {
      // Always allow admin email
      if (email !== 'thetangstr@gmail.com') {
        // Check if user already exists in the active users collection or has an invitation
        const userQuery = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
        const userSnapshot = await getDocs(userQuery);
        
        const invitationQuery = query(collection(db, 'invitations'), where('email', '==', email.toLowerCase()));
        const invitationSnapshot = await getDocs(invitationQuery);
        
        // If user doesn't exist in the users collection and doesn't have an invitation, deny access
        if (userSnapshot.empty && invitationSnapshot.empty) {
          set({ isLoadingAuth: false });
          throw new Error('Access denied. Your email is not authorized to use this application.');
        }
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        createdAt: serverTimestamp()
      });
      
      const parentUser = { 
        uid: user.uid, 
        email: user.email, 
        role: 'parent'
      };
      
      set({ 
        currentUser: parentUser, 
        currentView: 'parentDashboard', 
        isLoadingAuth: false,
        childProfiles: [], 
        quests: [], 
        rewards: [] 
      });
      
      alert('Registration successful!');
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
        rewards: [], 
        selectedChildIdForDashboard: null, 
        isLoadingAuth: false, 
        editingQuestId: null, 
        editingRewardId: null, 
        isPasscodeModalOpen: false, 
        passcodeError: '' 
      });
    } catch (error) {
      console.error("Error logging out:", error);
    }
  },
  
  checkAuthStatus: () => {
    set({ isLoadingAuth: true });
    
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        try {
          // Always allow admin email
          if (user.email !== 'thetangstr@gmail.com') {
            // Check if user exists in the active users collection
            const userQuery = query(collection(db, 'users'), where('email', '==', user.email.toLowerCase()));
            const userSnapshot = await getDocs(userQuery);
            
            // If user doesn't exist in the users collection, sign them out
            if (userSnapshot.empty) {
              await signOut(auth);
              set({ isLoadingAuth: false, currentView: 'login' });
              return;
            }
            
            // Check if user is active
            const userData = userSnapshot.docs[0].data();
            if (userData.status === 'inactive') {
              await signOut(auth);
              set({ isLoadingAuth: false, currentView: 'login' });
              throw new Error('Your account has been deactivated. Please contact the administrator.');
            }
          }
          
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
              currentView: 'parentDashboard', 
              isLoadingAuth: false 
            });
            
            await get().fetchParentData(parentUser.uid);
          } else {
            // Create user document if it doesn't exist (first login after registration)
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              createdAt: serverTimestamp()
            });
            
            const parentUser = { 
              uid: user.uid, 
              email: user.email, 
              role: 'parent'
            };
            
            set({ 
              currentUser: parentUser, 
              currentView: 'parentDashboard', 
              isLoadingAuth: false 
            });
          }
        } catch (error) {
          console.error("Error checking user document:", error);
          set({ isLoadingAuth: false, currentView: 'login' });
        }
      } else {
        // User is signed out
        set({ isLoadingAuth: false, currentView: 'login' });
      }
    });
  },

  // --- Data Fetching Actions ---
  createDefaultQuestsAndRewards: async (parentId) => {
    try {
      // Default quests
      const defaultQuests = [
        {
          title: "Make Your Bed",
          description: "Make your bed neatly every morning",
          xp: 2,
          type: "recurring",
          frequency: "daily",
          iconName: "Home",
          parentId,
          status: "new",
          createdAt: serverTimestamp()
        },
        {
          title: "Brush Your Teeth",
          description: "Brush your teeth in the morning and evening",
          xp: 1,
          type: "recurring",
          frequency: "daily",
          iconName: "Smile",
          parentId,
          status: "new",
          createdAt: serverTimestamp()
        },
        {
          title: "Clean Your Room",
          description: "Tidy up your room and put away all toys",
          xp: 3,
          type: "recurring",
          frequency: "weekly",
          iconName: "Trash2",
          parentId,
          status: "new",
          createdAt: serverTimestamp()
        },
        {
          title: "Read a Book",
          description: "Read a book or listen to a story",
          xp: 2,
          type: "recurring",
          frequency: "daily",
          iconName: "BookOpen",
          parentId,
          status: "new",
          createdAt: serverTimestamp()
        },
        {
          title: "Help with Dishes",
          description: "Help with dishes after a meal",
          xp: 2,
          type: "recurring",
          frequency: "daily",
          iconName: "Utensils",
          parentId,
          status: "new",
          createdAt: serverTimestamp()
        },
        {
          title: "Homework Complete",
          description: "Finish all homework or learning activities",
          xp: 3,
          type: "recurring",
          frequency: "daily",
          iconName: "BookOpen",
          parentId,
          status: "new",
          createdAt: serverTimestamp()
        },
        {
          title: "Feed the Pet",
          description: "Feed the family pet",
          xp: 1,
          type: "recurring",
          frequency: "daily",
          iconName: "Heart",
          parentId,
          status: "new",
          createdAt: serverTimestamp()
        },
        {
          title: "Pick Up Toys",
          description: "Put away all your toys",
          xp: 2,
          type: "recurring",
          frequency: "daily",
          iconName: "Package",
          parentId,
          status: "new",
          createdAt: serverTimestamp()
        },
        {
          title: "Share with Others",
          description: "Share your toys or take turns nicely",
          xp: 3,
          type: "recurring",
          frequency: "daily",
          iconName: "Users",
          parentId,
          status: "new",
          createdAt: serverTimestamp()
        },
        {
          title: "Be Active",
          description: "Play outside or do some exercise",
          xp: 2,
          type: "recurring",
          frequency: "daily",
          iconName: "Activity",
          parentId,
          status: "new",
          createdAt: serverTimestamp()
        }
      ];
      
      // Default rewards
      const defaultRewards = [
        {
          title: "Movie Night",
          description: "Choose a movie for family movie night",
          cost: 25,
          iconName: "Film",
          parentId,
          status: "available",
          createdAt: serverTimestamp()
        },
        {
          title: "Extra Screen Time",
          description: "Get 15 minutes of extra screen time",
          cost: 10,
          iconName: "Smartphone",
          parentId,
          status: "available",
          createdAt: serverTimestamp()
        },
        {
          title: "Special Treat",
          description: "Choose a special snack or dessert",
          cost: 15,
          iconName: "IceCream",
          parentId,
          status: "available",
          createdAt: serverTimestamp()
        },
        {
          title: "Stay Up Late",
          description: "Stay up 15 minutes past bedtime",
          cost: 20,
          iconName: "Moon",
          parentId,
          status: "available",
          createdAt: serverTimestamp()
        },
        {
          title: "Pick Activity",
          description: "Choose a family activity for the weekend",
          cost: 30,
          iconName: "Smile",
          parentId,
          status: "available",
          createdAt: serverTimestamp()
        },
        {
          title: "Stickers",
          description: "Get a sheet of fun stickers",
          cost: 10,
          iconName: "Star",
          parentId,
          status: "available",
          createdAt: serverTimestamp()
        },
        {
          title: "Playground Time",
          description: "Extra time at the playground",
          cost: 15,
          iconName: "Activity",
          parentId,
          status: "available",
          createdAt: serverTimestamp()
        }
      ];
      
      // Add quests to Firestore
      const questPromises = defaultQuests.map(quest => {
        return addDoc(collection(db, 'quests'), quest);
      });
      
      // Add rewards to Firestore
      const rewardPromises = defaultRewards.map(reward => {
        return addDoc(collection(db, 'rewards'), reward);
      });
      
      // Wait for all promises to resolve
      const questResults = await Promise.all(questPromises);
      const rewardResults = await Promise.all(rewardPromises);
      
      // Format the results for state update
      const quests = defaultQuests.map((quest, index) => ({
        id: questResults[index].id,
        ...quest,
        createdAt: new Date().toISOString()
      }));
      
      const rewards = defaultRewards.map((reward, index) => ({
        id: rewardResults[index].id,
        ...reward,
        createdAt: new Date().toISOString()
      }));
      
      // Update state
      set(state => ({
        quests: [...state.quests, ...quests],
        rewards: [...state.rewards, ...rewards]
      }));
      
      return { quests, rewards };
    } catch (error) {
      console.error("Error creating default quests and rewards:", error);
      throw error;
    }
  },
  
  fetchParentData: async (parentId) => {
    set({ isLoadingData: true });
    
    try {
      // Fetch child profiles
      const childProfilesQuery = query(
        collection(db, 'childProfiles'), 
        where('parentId', '==', parentId)
      );
      const childProfilesSnap = await getDocs(childProfilesQuery);
      const fetchedChildProfiles = childProfilesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Fetch quests
      const questsQuery = query(
        collection(db, 'quests'), 
        where('parentId', '==', parentId)
      );
      const questsSnap = await getDocs(questsQuery);
      const fetchedQuests = questsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Fetch rewards
      const rewardsQuery = query(
        collection(db, 'rewards'), 
        where('parentId', '==', parentId)
      );
      const rewardsSnap = await getDocs(rewardsQuery);
      const fetchedRewards = rewardsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Fetch quest completions for all children
      let fetchedQuestCompletions = [];
      
      if (fetchedChildProfiles.length > 0) {
        // Get all child IDs
        const childIds = fetchedChildProfiles.map(child => child.id);
        
        // Only fetch if we have child profiles
        try {
          // Query completions for all children
          const completionsQuery = query(
            collection(db, 'questCompletions'),
            where('childId', 'in', childIds)
          );
          
          const completionsSnap = await getDocs(completionsQuery);
          fetchedQuestCompletions = completionsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } catch (error) {
          console.error("Error fetching quest completions:", error);
          // Continue even if this fails
        }
      }
      
      set({ 
        childProfiles: fetchedChildProfiles,
        quests: fetchedQuests,
        rewards: fetchedRewards,
        questCompletions: fetchedQuestCompletions,
        isLoadingData: false
      });
      
      // If no quests or rewards exist, create default ones
      if (fetchedQuests.length === 0 && fetchedRewards.length === 0) {
        await get().createDefaultQuestsAndRewards(parentId);
      }
      
      return { childProfiles: fetchedChildProfiles, quests: fetchedQuests, rewards: fetchedRewards };
    } catch (error) {
      console.error("Error fetching parent data:", error);
      set({ isLoadingData: false });
      throw error;
    }
  },
  
  // --- Child Profile Management ---
  addChildProfile: async (profileData) => {
    const parentId = get().currentUser?.uid;
    if (!parentId) return;
    
    set({ isLoadingData: true });
    
    try {
      // Handle avatar image upload if it's a file
      let avatarUrl = profileData.avatar;
      
      if (profileData.avatarFile) {
        const storageRef = ref(storage, `avatars/${parentId}/${Date.now()}_${profileData.avatarFile.name}`);
        await uploadBytes(storageRef, profileData.avatarFile);
        avatarUrl = await getDownloadURL(storageRef);
      }
      
      // Add child profile to Firestore
      const childProfileRef = await addDoc(collection(db, 'childProfiles'), {
        name: profileData.name,
        avatar: avatarUrl,
        xp: profileData.xp || 0,
        parentId,
        createdAt: serverTimestamp()
      });
      
      const newChildProfile = {
        id: childProfileRef.id,
        name: profileData.name,
        avatar: avatarUrl,
        xp: profileData.xp || 0,
        parentId,
        createdAt: new Date().toISOString()
      };
      
      // Check if we're in tutorial mode
      const inTutorialMode = localStorage.getItem('kiddoquest_in_tutorial') === 'true';
      
      set(state => ({ 
        childProfiles: [...state.childProfiles, newChildProfile],
        isLoadingData: false,
        // Only navigate to parentDashboard if not in tutorial mode
        // In tutorial mode, we'll let the component handle navigation
        ...(!inTutorialMode ? { currentView: 'parentDashboard' } : {})
      }));
      
      return newChildProfile;
    } catch (error) {
      console.error("Error adding child profile:", error);
      set({ isLoadingData: false });
      throw error;
    }
  },
  
  updateChildProfile: async (childId, updatedData) => {
    set({ isLoadingData: true });
    
    try {
      // Validate childId
      if (!childId) {
        throw new Error('Child ID is required');
      }
      
      // Handle avatar image upload if it's a file
      let avatarUrl = updatedData.avatar;
      
      if (updatedData.avatarFile) {
        const parentId = get().currentUser?.uid;
        const storageRef = ref(storage, `avatars/${parentId}/${Date.now()}_${updatedData.avatarFile.name}`);
        await uploadBytes(storageRef, updatedData.avatarFile);
        avatarUrl = await getDownloadURL(storageRef);
      }
      
      // Prepare data for update (remove avatarFile which is not needed in Firestore)
      const { avatarFile, ...dataToUpdate } = updatedData;
      if (avatarUrl) dataToUpdate.avatar = avatarUrl;
      
      // Make sure we have a valid document reference
      const childDocRef = doc(db, 'childProfiles', childId.toString());
      
      // Update in Firestore
      await updateDoc(childDocRef, {
        ...dataToUpdate,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      set(state => ({
        childProfiles: state.childProfiles.map(profile => 
          profile.id === childId 
            ? { ...profile, ...dataToUpdate } 
            : profile
        ),
        isLoadingData: false
      }));
    } catch (error) {
      console.error("Error updating child profile:", error);
      set({ isLoadingData: false });
      throw error;
    }
  },
  
  deleteChildProfile: async (childId) => {
    set({ isLoadingData: true });
    
    try {
      // Validate childId
      if (!childId) {
        throw new Error('Child ID is required');
      }
      
      // Make sure we have a valid document reference
      const childDocRef = doc(db, 'childProfiles', childId.toString());
      
      // Delete from Firestore
      await deleteDoc(childDocRef);
      
      // Also delete any quest completions associated with this child
      const completionsQuery = query(
        collection(db, 'questCompletions'),
        where('childId', '==', childId)
      );
      
      const completionsSnapshot = await getDocs(completionsQuery);
      const deletePromises = completionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Update local state
      set(state => ({
        childProfiles: state.childProfiles.filter(profile => profile.id !== childId),
        // Also filter out any quest completions for this child
        questCompletions: (state.questCompletions || []).filter(completion => completion.childId !== childId),
        isLoadingData: false
      }));
    } catch (error) {
      console.error("Error deleting child profile:", error);
      set({ isLoadingData: false });
      throw error;
    }
  },

  // --- Navigation Actions ---
  navigateTo: (view, params = {}) => {
    // Push state to browser history
    window.history.pushState({ view, params }, '', `#${view}`);
    set(state => ({
      currentView: view,
      ...params
    }));
  },

  // Handle browser back/forward navigation
  handlePopState: (event) => {
    const state = event.state;
    if (state && state.view) {
      set({ currentView: state.view, ...state.params });
    } else {
      // Fallback: go to parentDashboard
      set({ currentView: 'parentDashboard' });
    }
  },
  
  selectChildForDashboard: (childId, view = 'childDashboard') => {
    // Set both IDs to ensure compatibility with both dashboard and edit screens
    set({ 
      selectedChildIdForDashboard: childId, 
      selectedChildId: childId,
      currentView: view 
    });
  },
  
  switchToChildView: (childId) => {
    const { childProfiles } = get();
    const childProfile = childProfiles.find(child => child.id === childId);
    
    if (childProfile) {
      set({ 
        selectedChildIdForDashboard: childId, 
        currentView: 'childDashboard' 
      });
      return true;
    }
    return false;
  },
  
  // --- Quest Management ---
  addQuest: async (questData) => {
    const parentId = get().currentUser?.uid;
    if (!parentId) return;
    
    set({ isLoadingData: true });
    
    try {
      // Handle image upload if it's a file
      let imageUrl = null;
      
      if (questData.imageFile) {
        const storageRef = ref(storage, `quests/${parentId}/${Date.now()}_${questData.imageFile.name}`);
        await uploadBytes(storageRef, questData.imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      // Prepare data for Firestore (remove imageFile which is not needed in Firestore)
      const { imageFile, ...dataToAdd } = questData;
      
      // Add quest to Firestore
      const questRef = await addDoc(collection(db, 'quests'), {
        ...dataToAdd,
        parentId,
        status: 'new',
        image: imageUrl,
        createdAt: serverTimestamp()
      });
      
      const newQuest = {
        id: questRef.id,
        ...dataToAdd,
        parentId,
        status: 'new',
        image: imageUrl,
        createdAt: new Date().toISOString()
      };
      
      set(state => ({ 
        quests: [...state.quests, newQuest],
        isLoadingData: false,
        currentView: 'manageQuests'
      }));
      
      return newQuest;
    } catch (error) {
      console.error("Error adding quest:", error);
      set({ isLoadingData: false });
      throw error;
    }
  },
  
  updateQuest: async (questId, updatedData) => {
    set({ isLoadingData: true });
    
    try {
      // Handle image upload if it's a file
      let imageUrl = updatedData.image;
      
      if (updatedData.imageFile) {
        const parentId = get().currentUser?.uid;
        const storageRef = ref(storage, `quests/${parentId}/${Date.now()}_${updatedData.imageFile.name}`);
        await uploadBytes(storageRef, updatedData.imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      // Prepare data for update (remove imageFile which is not needed in Firestore)
      const { imageFile, ...dataToUpdate } = updatedData;
      if (imageUrl) dataToUpdate.image = imageUrl;
      
      // Update in Firestore
      await updateDoc(doc(db, 'quests', questId), {
        ...dataToUpdate,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      set(state => ({
        quests: state.quests.map(quest => 
          quest.id === questId 
            ? { ...quest, ...dataToUpdate } 
            : quest
        ),
        isLoadingData: false,
        editingQuestId: null,
        currentView: 'manageQuests'
      }));
    } catch (error) {
      console.error("Error updating quest:", error);
      set({ isLoadingData: false });
      throw error;
    }
  },
  
  deleteQuest: async (questId) => {
    set({ isLoadingData: true });
    
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'quests', questId));
      
      // Update local state
      set(state => ({
        quests: state.quests.filter(quest => quest.id !== questId),
        isLoadingData: false
      }));
    } catch (error) {
      console.error("Error deleting quest:", error);
      set({ isLoadingData: false });
      throw error;
    }
  },
  
  setEditingQuestId: (questId) => {
    set({ editingQuestId: questId });
  },
  
  // Alias for backward compatibility
  setEditingQuest: (questId) => {
    set({ editingQuestId: questId, currentView: 'questForm' });
  },
  
  editQuest: (questId) => {
    set({ 
      editingQuestId: questId, 
      currentView: 'editQuest' 
    });
  },
  
  // --- Reward Management ---
  addReward: async (rewardData) => {
    const parentId = get().currentUser?.uid;
    if (!parentId) return;
    
    set({ isLoadingData: true });
    
    try {
      // Handle image upload if it's a file
      let imageUrl = null;
      
      if (rewardData.imageFile) {
        const storageRef = ref(storage, `rewards/${parentId}/${Date.now()}_${rewardData.imageFile.name}`);
        await uploadBytes(storageRef, rewardData.imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      // Prepare data for Firestore (remove imageFile which is not needed in Firestore)
      const { imageFile, ...dataToAdd } = rewardData;
      
      // Add reward to Firestore
      const rewardRef = await addDoc(collection(db, 'rewards'), {
        ...dataToAdd,
        parentId,
        status: 'available',
        image: imageUrl,
        createdAt: serverTimestamp()
      });
      
      const newReward = {
        id: rewardRef.id,
        ...dataToAdd,
        parentId,
        status: 'available',
        image: imageUrl,
        createdAt: new Date().toISOString()
      };
      
      set(state => ({ 
        rewards: [...state.rewards, newReward],
        isLoadingData: false,
        currentView: 'manageRewards'
      }));
      
      return newReward;
    } catch (error) {
      console.error("Error adding reward:", error);
      set({ isLoadingData: false });
      throw error;
    }
  },
  
  updateReward: async (rewardId, updatedData) => {
    set({ isLoadingData: true });
    
    try {
      // Handle image upload if it's a file
      let imageUrl = updatedData.image;
      
      if (updatedData.imageFile) {
        const parentId = get().currentUser?.uid;
        const storageRef = ref(storage, `rewards/${parentId}/${Date.now()}_${updatedData.imageFile.name}`);
        await uploadBytes(storageRef, updatedData.imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      // Prepare data for update (remove imageFile which is not needed in Firestore)
      const { imageFile, ...dataToUpdate } = updatedData;
      if (imageUrl) dataToUpdate.image = imageUrl;
      
      // Update in Firestore
      await updateDoc(doc(db, 'rewards', rewardId), {
        ...dataToUpdate,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      set(state => ({
        rewards: state.rewards.map(reward => 
          reward.id === rewardId 
            ? { ...reward, ...dataToUpdate } 
            : reward
        ),
        isLoadingData: false,
        editingRewardId: null,
        currentView: 'manageRewards'
      }));
    } catch (error) {
      console.error("Error updating reward:", error);
      set({ isLoadingData: false });
      throw error;
    }
  },
  
  deleteReward: async (rewardId) => {
    set({ isLoadingData: true });
    
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'rewards', rewardId));
      
      // Update local state
      set(state => ({
        rewards: state.rewards.filter(reward => reward.id !== rewardId),
        isLoadingData: false
      }));
    } catch (error) {
      console.error("Error deleting reward:", error);
      set({ isLoadingData: false });
      throw error;
    }
  },
  
  setEditingReward: (rewardId) => {
    set({ 
      editingRewardId: rewardId, 
      currentView: 'rewardForm' 
    });
  },
  
  // --- Child Actions (Quest/Reward Claiming) ---
  claimQuest: async (questId, childId) => {
    set({ isLoadingData: true });
    
    try {
      // Get the quest details
      const quest = get().quests.find(q => q.id === questId);
      if (!quest) {
        set({ isLoadingData: false });
        return false;
      }
      
      // For quests assigned to multiple children, we need to track completions per child
      // Create a completion record instead of updating the quest directly
      const completionRef = await addDoc(collection(db, 'questCompletions'), {
        questId,
        childId,
        status: 'pending_verification',
        claimedAt: serverTimestamp()
      });
      
      // Update local state - we'll mark the quest as claimed for this child only in the UI
      // but keep it available for other children
      set(state => {
        // Create a new completion record in our local state
        const questCompletions = state.questCompletions || [];
        const newCompletion = {
          id: completionRef.id,
          questId,
          childId,
          status: 'pending_verification',
          claimedAt: new Date().toISOString()
        };
        
        return {
          // Add the completion to our state
          questCompletions: [...questCompletions, newCompletion],
          // Don't modify the original quest - this keeps it available for other children
          isLoadingData: false
        };
      });
      
      return true;
    } catch (error) {
      console.error("Error claiming quest:", error);
      set({ isLoadingData: false });
      return false;
    }
  },
  
  approveQuest: async (completionId) => {
    set({ isLoadingData: true });
    
    try {
      // Get the completion record to approve
      const questCompletions = get().questCompletions || [];
      const completion = questCompletions.find(c => c.id === completionId);
      
      if (!completion) {
        set({ isLoadingData: false });
        return false;
      }
      
      // Get the quest details
      const quest = get().quests.find(q => q.id === completion.questId);
      if (!quest) {
        set({ isLoadingData: false });
        return false;
      }
      
      // Get the child who claimed the quest
      const childProfile = get().childProfiles.find(child => child.id === completion.childId);
      if (!childProfile) {
        set({ isLoadingData: false });
        return false;
      }
      
      // Update completion status in Firestore
      await updateDoc(doc(db, 'questCompletions', completionId), {
        status: 'completed',
        completedAt: serverTimestamp()
      });
      
      // Update child XP in Firestore
      const newXP = (childProfile.xp || 0) + quest.xp;
      await updateDoc(doc(db, 'childProfiles', childProfile.id), {
        xp: newXP,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      set(state => {
        // Update the completion record
        const updatedCompletions = (state.questCompletions || []).map(c => 
          c.id === completionId 
            ? { ...c, status: 'completed', completedAt: new Date().toISOString() } 
            : c
        );
        
        // Update the child's XP
        const updatedProfiles = state.childProfiles.map(child => 
          child.id === childProfile.id 
            ? { ...child, xp: newXP } 
            : child
        );
        
        return {
          questCompletions: updatedCompletions,
          childProfiles: updatedProfiles,
          isLoadingData: false
        };
      });
      
      // For daily quests, we don't need to create a new instance for each child
      // since the original quest remains available to other children
      
      return true;
    } catch (error) {
      console.error("Error approving quest:", error);
      set({ isLoadingData: false });
      return false;
    }
  },
  
  claimReward: async (rewardId, childId) => {
    set({ isLoadingData: true });
    
    try {
      // Get the reward to claim
      const reward = get().rewards.find(r => r.id === rewardId);
      if (!reward) {
        set({ isLoadingData: false });
        return { success: false, message: 'Reward not found' };
      }
      
      // Get the child who is claiming the reward
      const childProfile = get().childProfiles.find(child => child.id === childId);
      if (!childProfile) {
        set({ isLoadingData: false });
        return { success: false, message: 'Child profile not found' };
      }
      
      // Check if child has enough XP
      if ((childProfile.xp || 0) < reward.cost) {
        set({ isLoadingData: false });
        return { 
          success: false, 
          message: `Not enough XP. Need ${reward.cost - childProfile.xp} more XP.` 
        };
      }
      
      // Update reward status in Firestore
      await updateDoc(doc(db, 'rewards', rewardId), {
        status: 'claimed',
        claimedBy: childId,
        claimedAt: serverTimestamp()
      });
      
      // Update child XP in Firestore
      const newXP = childProfile.xp - reward.cost;
      await updateDoc(doc(db, 'childProfiles', childProfile.id), {
        xp: newXP,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      set(state => ({
        rewards: state.rewards.map(r => 
          r.id === rewardId 
            ? { 
                ...r, 
                status: 'claimed', 
                claimedBy: childId,
                claimedAt: new Date().toISOString()
              } 
            : r
        ),
        childProfiles: state.childProfiles.map(child => 
          child.id === childProfile.id 
            ? { ...child, xp: newXP } 
            : child
        ),
        isLoadingData: false
      }));
      
      return { 
        success: true, 
        message: `Successfully claimed ${reward.title}!`,
        showConfetti: true
      };
    } catch (error) {
      console.error("Error claiming reward:", error);
      set({ isLoadingData: false });
      return { 
        success: false, 
        message: 'An error occurred while claiming the reward.' 
      };
    }
  },
  
  // --- Icon Picker Actions ---
  openIconPicker: (callback) => {
    set({ 
      isIconPickerOpen: true,
      iconPickerCallback: callback
    });
  },
  
  closeIconPicker: () => {
    set({ 
      isIconPickerOpen: false,
      iconPickerCallback: null
    });
  },
  
  selectIcon: (iconName) => {
    const { iconPickerCallback } = get();
    if (iconPickerCallback) {
      iconPickerCallback(iconName);
    }
    get().closeIconPicker();
  },
  
  // --- Subscription Management ---
  updateSubscriptionTier: async (tier) => {
    const parentId = get().currentUser?.uid;
    if (!parentId) return;
    
    set({ isLoadingData: true });
    
    try {
      // Update subscription tier in Firestore
      await updateDoc(doc(db, 'users', parentId), {
        subscriptionTier: tier,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      set({ 
        subscriptionTier: tier,
        isLoadingData: false 
      });
      
      return true;
    } catch (error) {
      console.error("Error updating subscription tier:", error);
      set({ isLoadingData: false });
      throw error;
    }
  },
  
  checkFeatureAvailability: (featureId, currentCount = 0) => {
    const { subscriptionTier } = get();
    return isFeatureAvailable(featureId, subscriptionTier, currentCount);
  },
  
  getSubscriptionDetails: () => {
    const { subscriptionTier } = get();
    return {
      tier: subscriptionTier,
      features: Object.values(FEATURES).map(feature => ({
        ...feature,
        available: isFeatureAvailable(feature.id, subscriptionTier),
        limit: feature.limits[subscriptionTier]?.limit || 0,
        description: feature.limits[subscriptionTier]?.description || 'Not available'
      }))
    };
  },
  
  // --- Edit Child Profile ---
  setEditingChildId: (childId) => {
    set({ selectedChildIdForDashboard: childId });
  }
}));

export default useKiddoQuestStore;
