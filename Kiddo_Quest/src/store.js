import { create } from 'zustand';
import bcrypt from 'bcryptjs';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup
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
import { verifyInvitation, acceptInvitation } from './utils/invitationManager';

// Zustand Store for Global State Management
const useKiddoQuestStore = create((set, get) => ({
  // --- Authentication State ---
  currentUser: null, 
  isLoadingAuth: true,
  requirePin: false,

  // --- Data State (will be populated from Firestore) ---
  childProfiles: [], 
  quests: [],
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
      
      // Hash the PIN with bcrypt for security
      const saltRounds = 12;
      const hashedPin = await bcrypt.hash(pin, saltRounds);
      
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
      
      // Compare the input PIN with the stored hash using bcrypt
      const isValidPin = await bcrypt.compare(pin, userData.parentPin);
      
      if (isValidPin) {
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
  loginParent: async (email, password) => {
    set({ isLoadingAuth: true });
    console.log('Starting login process for email:', email);
    try {
      // Check allowlist access (disabled during role-based transition)
      if (true) {
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
        const userData = userDoc.data();
        const parentUser = { 
          uid: user.uid, 
          email: user.email, 
          role: userData.role || 'parent',
          isAdmin: userData.role === 'admin'
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
        const isAdminUser = false; // New users are not admin by default
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          createdAt: serverTimestamp(),
          status: 'active', // Ensure user is marked as active
          isAdmin: isAdminUser
        });
        
        const parentUser = { 
          uid: user.uid, 
          email: user.email, 
          role: 'parent',
          isAdmin: isAdminUser
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
    set({ isLoadingAuth: true });
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if admin user (thetangstr@gmail.com)
      const isAdminEmail = user.email.toLowerCase() === 'thetangstr@gmail.com';
      
      console.log('User logged in:', user.email, 'Is admin:', isAdminEmail);
      
      // Create or update user document (simplified approach)
      const parentUser = { 
        uid: user.uid, 
        email: user.email, 
        role: isAdminEmail ? 'admin' : 'parent',
        isAdmin: isAdminEmail
      };
      
      // Always create/update the user document to ensure it exists
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email.toLowerCase(),
        role: parentUser.role,
        status: 'active',
        isAdmin: parentUser.isAdmin,
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true }); // Use merge to update existing or create new
      
      set({ 
        currentUser: parentUser, 
        currentView: parentUser.isAdmin ? 'adminDashboard' : 'parentDashboard', 
        isLoadingAuth: false 
      });
      
      console.log('User authenticated successfully:', parentUser);
      
      // Fetch user data after successful authentication
      await get().fetchParentData(parentUser.uid);
      return parentUser;
    } catch (error) {
      console.error('Google login error:', error);
      set({ isLoadingAuth: false, error: error.message });
      throw error;
    }
  },
  
  registerParent: async (email, password) => {
    set({ isLoadingAuth: true });
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Save user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        createdAt: serverTimestamp(),
        role: 'parent',
        subscription: 'explorer', // Default free tier
        childrenIds: [],
        outstandingBalance: 0, // For tracking kids' reward debt
        familyId: user.uid, // Default: user is the family creator
        familyMembers: [{ uid: user.uid, role: 'parent', email: user.email }]
      });
      
      // Update store state
      set({
        currentUser: user,
        userType: 'parent',
        userData: {
          email: user.email,
          role: 'parent',
          subscription: 'explorer',
          childrenIds: [],
          outstandingBalance: 0,
          familyId: user.uid,
          familyMembers: [{ uid: user.uid, role: 'parent', email: user.email }]
        },
        isInitialized: true,
      });
      
      return user;
    } catch (error) {
      set({ error: error.message });
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
    console.log('Starting auth check');
    
    return onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User logged in: ${user.email}` : 'No user');
      
      if (user) {
        // User is signed in
        try {
          // Check if admin user (thetangstr@gmail.com)
          const isAdminEmail = user.email.toLowerCase() === 'thetangstr@gmail.com';
          
          console.log('Auth state changed - User:', user.email, 'Is admin:', isAdminEmail);
          
          // Create or update user document (simplified approach)
          const parentUser = { 
            uid: user.uid, 
            email: user.email, 
            role: isAdminEmail ? 'admin' : 'parent',
            isAdmin: isAdminEmail
          };
          
          // Always create/update the user document to ensure it exists
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email.toLowerCase(),
            role: parentUser.role,
            status: 'active',
            isAdmin: parentUser.isAdmin,
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true }); // Use merge to update existing or create new
          
          set({ 
            currentUser: parentUser,
            isLoadingAuth: false,
            currentView: parentUser.isAdmin ? 'adminDashboard' : 'parentDashboard'
          });
          
          console.log('User authenticated via auth state change:', parentUser);
          
          // Fetch user data after successful authentication
          try {
            await get().fetchParentData(parentUser.uid);
            console.log('Parent data fetched successfully');
          } catch (err) {
            console.error('Failed to fetch parent data:', err);
            // Continue anyway - user is still authenticated
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
      
      set({ 
        childProfiles: fetchedChildProfiles,
        quests: fetchedQuests,
        rewards: fetchedRewards,
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
        theme: profileData.theme || 'default',
        createdAt: serverTimestamp()
      });
      
      const newChildProfile = {
        id: childProfileRef.id,
        name: profileData.name,
        avatar: avatarUrl,
        xp: profileData.xp || 0,
        theme: profileData.theme || 'default',
        parentId,
        createdAt: new Date().toISOString()
      };
      
      set(state => ({ 
        childProfiles: [...state.childProfiles, newChildProfile],
        isLoadingData: false,
        currentView: 'parentDashboard'
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
      
      // Update in Firestore
      await updateDoc(doc(db, 'childProfiles', childId), {
        ...dataToUpdate,
        updatedAt: serverTimestamp()
      });
      
      console.log('Updated child profile with data:', dataToUpdate);
      
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
      // Delete from Firestore
      await deleteDoc(doc(db, 'childProfiles', childId));
      
      // Update local state
      set(state => ({
        childProfiles: state.childProfiles.filter(profile => profile.id !== childId),
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
    console.log('🔄 navigateTo called:', { view, params, currentView: get().currentView });
    set({ currentView: view, ...params });
    console.log('🔄 navigateTo completed, new state:', { currentView: get().currentView });
  },
  
  selectChildForDashboard: (childId) => {
    set({ selectedChildIdForDashboard: childId, currentView: 'childDashboard' });
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
  
  setEditingQuest: (questId) => {
    set({ 
      editingQuestId: questId, 
      currentView: 'questForm' 
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
        source: dataToAdd.source, // Save Amazon product source if present
        createdAt: serverTimestamp()
      });
      
      const newReward = {
        id: rewardRef.id,
        ...dataToAdd,
        parentId,
        status: 'available',
        image: imageUrl,
        source: dataToAdd.source, // Include Amazon product source in state
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
      const reward = get().rewards.find(r => r.id === rewardId);
      if (!reward) throw new Error('Reward not found');
      
      // Handle image upload if it's a file
      let imageUrl = null;
      
      if (updatedData.imageFile) {
        const parentId = get().currentUser?.uid;
        const storageRef = ref(storage, `rewards/${parentId}/${Date.now()}_${updatedData.imageFile.name}`);
        await uploadBytes(storageRef, updatedData.imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      // Prepare data for Firestore (remove imageFile which is not needed in Firestore)
      const { imageFile, ...dataToUpdate } = updatedData;
      
      // Update reward in Firestore
      await updateDoc(doc(db, 'rewards', rewardId), {
        ...dataToUpdate,
        image: imageUrl || reward.image,
        source: dataToUpdate.source, // Include Amazon source info
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      set(state => ({
        rewards: state.rewards.map(reward => 
          reward.id === rewardId 
            ? { 
                ...reward, 
                ...dataToUpdate, 
                image: imageUrl || reward.image,
                source: dataToUpdate.source
              } 
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
      const questRef = doc(db, 'quests', questId);
      
      // Update quest status in Firestore
      await updateDoc(questRef, {
        status: 'pending_verification',
        claimedBy: childId,
        claimedAt: serverTimestamp()
      });
      
      // Update local state
      set(state => ({
        quests: state.quests.map(quest => 
          quest.id === questId 
            ? { 
                ...quest, 
                status: 'pending_verification', 
                claimedBy: childId,
                claimedAt: new Date().toISOString()
              } 
            : quest
        ),
        isLoadingData: false
      }));
      
      return true;
    } catch (error) {
      console.error("Error claiming quest:", error);
      set({ isLoadingData: false });
      return false;
    }
  },
  
  approveQuest: async (questId) => {
    set({ isLoadingData: true });
    
    try {
      // Get the quest to approve
      const quest = get().quests.find(q => q.id === questId);
      if (!quest || !quest.claimedBy) {
        set({ isLoadingData: false });
        return false;
      }
      
      // Get the child who claimed the quest
      const childProfile = get().childProfiles.find(child => child.id === quest.claimedBy);
      if (!childProfile) {
        set({ isLoadingData: false });
        return false;
      }
      
      // Update quest status in Firestore
      await updateDoc(doc(db, 'quests', questId), {
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
      set(state => ({
        quests: state.quests.map(q => 
          q.id === questId 
            ? { ...q, status: 'completed', completedAt: new Date().toISOString() } 
            : q
        ),
        childProfiles: state.childProfiles.map(child => 
          child.id === childProfile.id 
            ? { ...child, xp: newXP } 
            : child
        ),
        isLoadingData: false
      }));
      
      // If quest is recurring, create a new instance
      if (quest.type === 'recurring') {
        const { id, status, claimedBy, claimedAt, completedAt, ...recurringQuestData } = quest;
        
        // Add a new quest instance to Firestore
        const newQuestRef = await addDoc(collection(db, 'quests'), {
          ...recurringQuestData,
          status: 'new',
          createdAt: serverTimestamp()
        });
        
        const newQuest = {
          id: newQuestRef.id,
          ...recurringQuestData,
          status: 'new',
          createdAt: new Date().toISOString()
        };
        
        // Update local state with the new quest
        set(state => ({ 
          quests: [...state.quests, newQuest]
        }));
      }
      
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
  
  // --- Invitation Processing ---
  processInvitationAfterAuth: async (token, userId) => {
    if (!token) return { success: false, message: 'No invitation token provided' };
    
    try {
      // Import invitationManager functions dynamically to avoid circular imports
      const { verifyInvitation, acceptInvitation } = await import('./utils/invitationManager');
      
      // Verify the invitation token
      const verificationResult = await verifyInvitation(token);
      
      if (!verificationResult.success) {
        return verificationResult; // Return the error from verification
      }
      
      // If verification successful, accept the invitation
      const acceptResult = await acceptInvitation(verificationResult.invitation.id, userId);
      
      if (acceptResult.success) {
        // Update the current user's family info if needed
        const user = get().currentUser;
        if (user) {
          // Refresh user data to include new family connections
          await get().fetchParentData(user.uid);
        }
      }
      
      return acceptResult;
    } catch (error) {
      console.error('Error processing invitation after auth:', error);
      return { 
        success: false, 
        message: 'Failed to process invitation. Please try again.'
      };
    }
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

// Expose store to window for debugging
if (typeof window !== 'undefined') {
  window.useKiddoQuestStore = useKiddoQuestStore;
}
