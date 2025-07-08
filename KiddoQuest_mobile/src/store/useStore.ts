import { create } from 'zustand';
import { Platform } from 'react-native';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getAuth, 
  getFirestore,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from '../utils/firebase';

// Helper function to get period string for recurring quests
const getPeriodString = (date: Date, frequency: 'daily' | 'weekly' | 'monthly'): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  switch (frequency) {
    case 'daily':
      return `${year}-${month}-${day}`;
    case 'weekly':
      // Get week number
      const startOfYear = new Date(year, 0, 1);
      const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
      return `${year}-W${String(weekNumber).padStart(2, '0')}`;
    case 'monthly':
      return `${year}-${month}`;
    default:
      return `${year}-${month}-${day}`;
  }
};

// Helper function to check if child has completed quest in current period
const hasCompletedInCurrentPeriod = (quest: Quest, childId: string): boolean => {
  if (!quest.isRecurring || !quest.completions) {
    return false;
  }
  
  const currentPeriod = getPeriodString(new Date(), quest.frequency || 'daily');
  return quest.completions.some(completion => 
    completion.childId === childId && completion.period === currentPeriod
  );
};

// Helper functions for cross-platform Firestore operations
const firestoreHelpers = {
  async getDoc(db: any, collection: string, docId: string) {
    if (Platform.OS === 'web') {
      const { doc, getDoc } = require('firebase/firestore');
      const docRef = doc(db, collection, docId);
      const docSnap = await getDoc(docRef);
      return {
        exists: () => docSnap.exists(),
        data: () => docSnap.data()
      };
    } else {
      const docSnap = await db.collection(collection).doc(docId).get();
      return {
        exists: () => docSnap.exists,
        data: () => docSnap.data()
      };
    }
  },

  async setDoc(db: any, collection: string, docId: string, data: any) {
    if (Platform.OS === 'web') {
      const { doc, setDoc } = require('firebase/firestore');
      const docRef = doc(db, collection, docId);
      return await setDoc(docRef, data);
    } else {
      return await db.collection(collection).doc(docId).set(data);
    }
  },

  async updateDoc(db: any, collection: string, docId: string, data: any) {
    if (Platform.OS === 'web') {
      const { doc, updateDoc } = require('firebase/firestore');
      const docRef = doc(db, collection, docId);
      return await updateDoc(docRef, data);
    } else {
      return await db.collection(collection).doc(docId).update(data);
    }
  },

  async addDoc(db: any, collection: string, data: any) {
    if (Platform.OS === 'web') {
      const { collection: collectionRef, addDoc } = require('firebase/firestore');
      const colRef = collectionRef(db, collection);
      return await addDoc(colRef, data);
    } else {
      return await db.collection(collection).add(data);
    }
  },

  async getDocs(db: any, collection: string, whereClause?: { field: string, operator: string, value: any }) {
    if (Platform.OS === 'web') {
      const { collection: collectionRef, getDocs, query, where } = require('firebase/firestore');
      let q = collectionRef(db, collection);
      
      if (whereClause) {
        q = query(q, where(whereClause.field, whereClause.operator, whereClause.value));
      }
      
      const querySnapshot = await getDocs(q);
      return {
        docs: querySnapshot.docs.map((doc: any) => ({
          id: doc.id,
          data: () => doc.data()
        }))
      };
    } else {
      let ref = db.collection(collection);
      
      if (whereClause) {
        ref = ref.where(whereClause.field, whereClause.operator, whereClause.value);
      }
      
      const querySnapshot = await ref.get();
      return {
        docs: querySnapshot.docs.map((doc: any) => ({
          id: doc.id,
          data: () => doc.data()
        }))
      };
    }
  }
};

// Define types for our store
interface User {
  uid: string;
  email: string;
  isAdmin?: boolean;
  displayName?: string;
}

interface Child {
  id: string;
  name: string;
  age: number;
  theme?: string;
  accessibility?: {
    highContrast?: boolean;
    reducedMotion?: boolean;
    largeText?: boolean;
  };
}

interface QuestCompletion {
  childId: string;
  completedAt: Date;
  period: string; // e.g., "2024-01-15" for daily, "2024-W03" for weekly
}

interface Quest {
  id: string;
  title: string;
  description: string;
  points: number;
  childId: string; // For one-time quests, this is the specific child
  completed: boolean; // For backward compatibility with one-time quests
  isRecurring?: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly';
  completions?: QuestCompletion[]; // For recurring quests
  availableToAllChildren?: boolean; // For recurring quests available to all kids
}

interface Reward {
  id: string;
  title: string;
  description: string;
  points: number;
  childId: string;
  redeemed: boolean;
}

interface Penalty {
  id: string;
  title: string;
  description: string;
  pointsDeduction: number;
  childId: string;
  parentId: string;
  reason: string;
  appliedAt: Date;
  appliedBy: string;
  status: 'active' | 'reversed';
  createdAt: Date;
  updatedAt?: Date;
}

interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Children
  children: Child[];
  selectedChild: Child | null;
  
  // Quests and Rewards
  quests: Quest[];
  rewards: Reward[];
  penalties: Penalty[];
  
  // Current view (for mobile navigation compatibility)
  currentView: string;
  
  // Actions
  loginParent: (email: string, password: string) => Promise<void>;
  registerParent: (email: string, password: string) => Promise<void>;
  logoutParent: () => Promise<void>;
  setCurrentView: (view: string) => void;
  setAuthState: (isAuthenticated: boolean, user: User | null) => void;
  loadUserData: (uid: string) => Promise<void>;
  
  // Children actions
  addChild: (child: Omit<Child, 'id'>) => Promise<void>;
  updateChild: (child: Child) => Promise<void>;
  selectChild: (child: Child | null) => void;
  
  // Quest and Reward actions
  addQuest: (quest: Omit<Quest, 'id'>) => Promise<void>;
  updateQuest: (quest: Quest) => Promise<void>;
  completeQuest: (questId: string) => Promise<void>;
  deleteQuest: (questId: string) => Promise<void>;
  addReward: (reward: Omit<Reward, 'id'>) => Promise<void>;
  updateReward: (rewardData: Reward) => Promise<void>;
  redeemReward: (rewardId: string) => Promise<void>;
  deleteReward: (rewardId: string) => Promise<void>;
  
  // Theme and accessibility
  updateChildTheme: (childId: string, theme: string) => Promise<void>;
  updateChildAccessibility: (
    childId: string, 
    settings: { highContrast?: boolean, reducedMotion?: boolean, largeText?: boolean }
  ) => Promise<void>;
  
  // Penalty actions
  addPenalty: (penalty: Omit<Penalty, 'id'>) => Promise<void>;
  reversePenalty: (penaltyId: string) => Promise<void>;
  deletePenalty: (penaltyId: string) => Promise<void>;
  getPenaltiesForChild: (childId: string) => Penalty[];
}

// Create the store with Zustand and persist middleware
const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      children: [],
      selectedChild: null,
      quests: [],
      rewards: [],
      penalties: [],
      currentView: 'login',
      
      // Authentication actions
      loginParent: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          // Handle authentication
          const userCredential = await signInWithEmailAndPassword(email, password);
          
          // Get user data from Firestore
          const db = getFirestore();
          const userDoc = await firestoreHelpers.getDoc(db, 'users', userCredential.user.uid);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Set the user in state
            set({ 
              user: {
                uid: userCredential.user.uid,
                email: userCredential.user.email || '',
                isAdmin: userData?.isAdmin || false,
                displayName: userData?.displayName || '',
              },
              isAuthenticated: true,
              isLoading: false,
              currentView: userData?.isAdmin ? 'adminDashboard' : 'parentDashboard',
            });
            
            // If user is not an admin, load their children
            if (!userData?.isAdmin) {
              const childrenSnapshot = await firestoreHelpers.getDocs(
                db, 
                'children', 
                { field: 'parentId', operator: '==', value: userCredential.user.uid }
              );
              
              const children: Child[] = childrenSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as Child[];
              
              set({ children });
            }
          } else {
            throw new Error('User document not found');
          }
        } catch (error: any) {
          console.error('Login error:', error);
          set({ 
            error: error.message || 'Failed to login', 
            isLoading: false,
            isAuthenticated: false,
          });
        }
      },
      
      registerParent: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          // Create user in Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(email, password);
          
          // Create user document in Firestore
          const db = getFirestore();
          await firestoreHelpers.setDoc(db, 'users', userCredential.user.uid, {
            email,
            isAdmin: false,
            createdAt: new Date(),
          });
          
          // Set the user in state
          set({
            user: {
              uid: userCredential.user.uid,
              email: userCredential.user.email || '',
              isAdmin: false,
            },
            isAuthenticated: true,
            isLoading: false,
            currentView: 'parentDashboard',
          });
        } catch (error: any) {
          console.error('Registration error:', error);
          set({ 
            error: error.message || 'Failed to register', 
            isLoading: false 
          });
        }
      },
      
      logoutParent: async () => {
        set({ isLoading: true });
        try {
          await signOut();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            children: [],
            selectedChild: null,
            quests: [],
            rewards: [],
            penalties: [],
            currentView: 'login',
          });
        } catch (error: any) {
          console.error('Logout error:', error);
          set({ 
            error: error.message || 'Failed to logout',
            isLoading: false
          });
        }
      },
      
      setCurrentView: (view) => {
        set({ currentView: view });
      },
    
      setAuthState: (isAuthenticated, user) => {
        set({ 
          isAuthenticated, 
          user,
          isLoading: false,
          currentView: user?.isAdmin ? 'adminDashboard' : (isAuthenticated ? 'parentDashboard' : 'login')
        });
      },
    
      loadUserData: async (uid) => {
        set({ isLoading: true });
        try {
          const db = getFirestore();
          const userDoc = await firestoreHelpers.getDoc(db, 'users', uid);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            const user: User = {
              uid,
              email: userData.email || '',
              isAdmin: userData.role === 'admin' || userData.isAdmin || false,
              displayName: userData.displayName
            };
            
            // Load children if not admin
            let children: Child[] = [];
            if (!user.isAdmin) {
              const childrenSnapshot = await firestoreHelpers.getDocs(
                db, 
                'children', 
                { field: 'parentId', operator: '==', value: uid }
              );
              
              children = childrenSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as Child[];
            }
            
            set({ 
              user,
              isAuthenticated: true,
              isLoading: false,
              children,
              currentView: user.isAdmin ? 'adminDashboard' : 'parentDashboard'
            });
          } else {
            throw new Error('User document not found');
          }
        } catch (error: any) {
          console.error('Error loading user data:', error);
          set({ 
            error: error.message || 'Failed to load user data',
            isLoading: false,
            isAuthenticated: false,
            user: null
          });
        }
      },
      
      // Children actions
      addChild: async (childData) => {
        const { user } = get();
        if (!user) return;
        
        set({ isLoading: true });
        try {
          const db = getFirestore();
          const childRef = await db.collection('children').add({
            ...childData,
            parentId: user.uid,
            createdAt: new Date(),
          });
          
          const newChild: Child = {
            id: childRef.id,
            ...childData,
          };
          
          set(state => ({ 
            children: [...state.children, newChild],
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Add child error:', error);
          set({
            error: error.message || 'Failed to add child',
            isLoading: false
          });
        }
      },
      
      updateChild: async (child) => {
        set({ isLoading: true });
        try {
          const db = getFirestore();
          await db.collection('children').doc(child.id).update({
            name: child.name,
            age: child.age,
            theme: child.theme,
            accessibility: child.accessibility,
          });
          
          set(state => ({
            children: state.children.map(c => c.id === child.id ? child : c),
            selectedChild: state.selectedChild?.id === child.id ? child : state.selectedChild,
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Update child error:', error);
          set({
            error: error.message || 'Failed to update child',
            isLoading: false
          });
        }
      },
      
      selectChild: (child) => {
        set({ selectedChild: child });
        if (child) {
          set({ currentView: 'childDashboard' });
        }
      },
      
      // Quest and Reward actions
      addQuest: async (questData) => {
        const { selectedChild } = get();
        if (!selectedChild) return;
        
        set({ isLoading: true });
        try {
          const db = getFirestore();
          const questRef = await db.collection('quests').add({
            ...questData,
            childId: selectedChild.id,
            completed: false,
            createdAt: new Date(),
          });
          
          const newQuest: Quest = {
            id: questRef.id,
            ...questData,
            childId: selectedChild.id,
            completed: false,
          };
          
          set(state => ({ 
            quests: [...state.quests, newQuest],
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Add quest error:', error);
          set({
            error: error.message || 'Failed to add quest',
            isLoading: false
          });
        }
      },
      
      completeQuest: async (questId) => {
        set({ isLoading: true });
        try {
          const db = getFirestore();
          const state = get();
          const quest = state.quests.find(q => q.id === questId);
          const currentChild = state.selectedChild;
          
          if (!quest || !currentChild) {
            throw new Error('Quest or child not found');
          }

          const now = new Date();
          let updateData: any = {};

          if (quest.isRecurring) {
            // For recurring quests, add completion to the completions array
            const period = getPeriodString(now, quest.frequency || 'daily');
            const newCompletion: QuestCompletion = {
              childId: currentChild.id,
              completedAt: now,
              period: period
            };

            const existingCompletions = quest.completions || [];
            const updatedCompletions = [...existingCompletions, newCompletion];

            updateData = {
              completions: updatedCompletions,
              lastCompletedAt: now
            };

            // Update local state for recurring quests
            set(state => ({
              quests: state.quests.map(q => 
                q.id === questId 
                  ? { ...q, completions: updatedCompletions, lastCompletedAt: now }
                  : q
              ),
              isLoading: false
            }));
          } else {
            // For one-time quests, use the original logic
            updateData = {
              completed: true,
              completedAt: now,
            };

            // Update local state for one-time quests
            set(state => ({
              quests: state.quests.map(q => 
                q.id === questId ? { ...q, completed: true, completedAt: now } : q
              ),
              isLoading: false
            }));
          }

          await firestoreHelpers.updateDoc(db, 'quests', questId, updateData);

          // Award points to the child
          if (currentChild) {
            const updatedPoints = (currentChild.totalPoints || 0) + quest.points;
            await firestoreHelpers.updateDoc(db, 'children', currentChild.id, {
              totalPoints: updatedPoints
            });

            set(state => ({
              selectedChild: state.selectedChild 
                ? { ...state.selectedChild, totalPoints: updatedPoints }
                : null,
              children: state.children.map(c => 
                c.id === currentChild.id 
                  ? { ...c, totalPoints: updatedPoints }
                  : c
              )
            }));
          }

        } catch (error: any) {
          console.error('Complete quest error:', error);
          set({
            error: error.message || 'Failed to complete quest',
            isLoading: false
          });
        }
      },
    
      deleteQuest: async (questId) => {
        set({ isLoading: true });
        try {
          const db = getFirestore();
          
          if (Platform.OS === 'web') {
            const { doc, deleteDoc } = require('firebase/firestore');
            const questRef = doc(db, 'quests', questId);
            await deleteDoc(questRef);
          } else {
            await db.collection('quests').doc(questId).delete();
          }
          
          set(state => ({
            quests: state.quests.filter(q => q.id !== questId),
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Delete quest error:', error);
          set({
            error: error.message || 'Failed to delete quest',
            isLoading: false
          });
        }
      },
    
      updateQuest: async (questData) => {
        set({ isLoading: true });
        try {
          const db = getFirestore();
          await firestoreHelpers.updateDoc(db, 'quests', questData.id, {
            title: questData.title,
            description: questData.description,
            points: questData.points,
            childId: questData.childId,
            updatedAt: new Date(),
          });
          
          set(state => ({
            quests: state.quests.map(q => 
              q.id === questData.id ? questData : q
            ),
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Update quest error:', error);
          set({
            error: error.message || 'Failed to update quest',
            isLoading: false
          });
        }
      },
      
      addReward: async (rewardData) => {
        const { selectedChild } = get();
        if (!selectedChild) return;
        
        set({ isLoading: true });
        try {
          const db = getFirestore();
          const rewardRef = await db.collection('rewards').add({
            ...rewardData,
            childId: selectedChild.id,
            redeemed: false,
            createdAt: new Date(),
          });
          
          const newReward: Reward = {
            id: rewardRef.id,
            ...rewardData,
            childId: selectedChild.id,
            redeemed: false,
          };
          
          set(state => ({ 
            rewards: [...state.rewards, newReward],
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Add reward error:', error);
          set({
            error: error.message || 'Failed to add reward',
            isLoading: false
          });
        }
      },
      
      redeemReward: async (rewardId) => {
        set({ isLoading: true });
        try {
          const db = getFirestore();
          await db.collection('rewards').doc(rewardId).update({
            redeemed: true,
            redeemedAt: new Date(),
          });
          
          set(state => ({
            rewards: state.rewards.map(r => 
              r.id === rewardId ? { ...r, redeemed: true } : r
            ),
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Redeem reward error:', error);
          set({
            error: error.message || 'Failed to redeem reward',
            isLoading: false
          });
        }
      },

      updateReward: async (rewardData) => {
        set({ isLoading: true });
        try {
          const db = getFirestore();
          
          // Filter out undefined values to prevent Firebase errors
          const updateData = {
            title: rewardData.title,
            description: rewardData.description,
            cost: rewardData.cost,
            childId: rewardData.childId,
            updatedAt: new Date()
          };
          
          // Only include source field if it's defined
          if (rewardData.source !== undefined) {
            updateData.source = rewardData.source;
          }
          
          await firestoreHelpers.updateDoc(db, 'rewards', rewardData.id, updateData);
          
          set(state => ({
            rewards: state.rewards.map(r => 
              r.id === rewardData.id ? { ...r, ...rewardData } : r
            ),
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Error updating reward:', error);
          set({
            error: error.message || 'Failed to update reward',
            isLoading: false
          });
        }
      },

      deleteReward: async (rewardId) => {
        set({ isLoading: true });
        try {
          const db = getFirestore();
          
          if (Platform.OS === 'web') {
            const { doc, deleteDoc } = require('firebase/firestore');
            const rewardRef = doc(db, 'rewards', rewardId);
            await deleteDoc(rewardRef);
          } else {
            await db.collection('rewards').doc(rewardId).delete();
          }
          
          set(state => ({
            rewards: state.rewards.filter(r => r.id !== rewardId),
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Delete reward error:', error);
          set({
            error: error.message || 'Failed to delete reward',
            isLoading: false
          });
        }
      },
      
      // Theme and accessibility
      updateChildTheme: async (childId, theme) => {
        set({ isLoading: true });
        try {
          const db = getFirestore();
          await db.collection('children').doc(childId).update({ theme });
          
          set(state => ({
            children: state.children.map(c => 
              c.id === childId ? { ...c, theme } : c
            ),
            selectedChild: state.selectedChild?.id === childId 
              ? { ...state.selectedChild, theme } 
              : state.selectedChild,
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Update theme error:', error);
          set({
            error: error.message || 'Failed to update theme',
            isLoading: false
          });
        }
      },
      
      updateChildAccessibility: async (childId, settings) => {
        set({ isLoading: true });
        try {
          const db = getFirestore();
          
          // Get the current child to merge accessibility settings
          const child = get().children.find(c => c.id === childId);
          const updatedAccessibility = {
            ...(child?.accessibility || {}),
            ...settings
          };
          
          await db.collection('children').doc(childId).update({
            accessibility: updatedAccessibility
          });
          
          set(state => ({
            children: state.children.map(c => 
              c.id === childId 
                ? { ...c, accessibility: updatedAccessibility } 
                : c
            ),
            selectedChild: state.selectedChild?.id === childId 
              ? { ...state.selectedChild, accessibility: updatedAccessibility } 
              : state.selectedChild,
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Update accessibility error:', error);
          set({
            error: error.message || 'Failed to update accessibility settings',
            isLoading: false
          });
        }
      },
      
      // Penalty actions
      addPenalty: async (penaltyData) => {
        const { user } = get();
        if (!user) return;
        
        set({ isLoading: true });
        try {
          const db = getFirestore();
          
          // Get the child to check current points
          const child = get().children.find(c => c.id === penaltyData.childId);
          if (!child) {
            throw new Error('Child not found');
          }
          
          const penaltyRef = await firestoreHelpers.addDoc(db, 'penalties', {
            ...penaltyData,
            parentId: user.uid,
            appliedBy: user.uid,
            status: 'active',
            createdAt: new Date(),
            appliedAt: new Date(),
          });
          
          // Calculate new points (don't let it go below 0)
          const newPoints = Math.max(0, (child.totalPoints || 0) - penaltyData.pointsDeduction);
          
          // Update child points
          await firestoreHelpers.updateDoc(db, 'children', child.id, {
            totalPoints: newPoints
          });
          
          const newPenalty: Penalty = {
            id: penaltyRef.id,
            ...penaltyData,
            parentId: user.uid,
            appliedBy: user.uid,
            status: 'active',
            createdAt: new Date(),
            appliedAt: new Date(),
          };
          
          set(state => ({ 
            penalties: [...state.penalties, newPenalty],
            children: state.children.map(c => 
              c.id === child.id ? { ...c, totalPoints: newPoints } : c
            ),
            selectedChild: state.selectedChild?.id === child.id 
              ? { ...state.selectedChild, totalPoints: newPoints }
              : state.selectedChild,
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Add penalty error:', error);
          set({
            error: error.message || 'Failed to add penalty',
            isLoading: false
          });
        }
      },
      
      reversePenalty: async (penaltyId) => {
        set({ isLoading: true });
        try {
          const db = getFirestore();
          const penalty = get().penalties.find(p => p.id === penaltyId);
          const child = get().children.find(c => c.id === penalty?.childId);
          
          if (!penalty || !child || penalty.status !== 'active') {
            throw new Error('Penalty or child not found, or penalty already reversed');
          }
          
          // Update penalty status
          await firestoreHelpers.updateDoc(db, 'penalties', penaltyId, {
            status: 'reversed',
            reversedAt: new Date(),
            updatedAt: new Date()
          });
          
          // Restore points to child
          const newPoints = (child.totalPoints || 0) + penalty.pointsDeduction;
          await firestoreHelpers.updateDoc(db, 'children', child.id, {
            totalPoints: newPoints
          });
          
          set(state => ({
            penalties: state.penalties.map(p => 
              p.id === penaltyId 
                ? { ...p, status: 'reversed', reversedAt: new Date() }
                : p
            ),
            children: state.children.map(c => 
              c.id === child.id ? { ...c, totalPoints: newPoints } : c
            ),
            selectedChild: state.selectedChild?.id === child.id 
              ? { ...state.selectedChild, totalPoints: newPoints }
              : state.selectedChild,
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Reverse penalty error:', error);
          set({
            error: error.message || 'Failed to reverse penalty',
            isLoading: false
          });
        }
      },
      
      deletePenalty: async (penaltyId) => {
        set({ isLoading: true });
        try {
          const db = getFirestore();
          
          if (Platform.OS === 'web') {
            const { doc, deleteDoc } = require('firebase/firestore');
            const penaltyRef = doc(db, 'penalties', penaltyId);
            await deleteDoc(penaltyRef);
          } else {
            await db.collection('penalties').doc(penaltyId).delete();
          }
          
          set(state => ({
            penalties: state.penalties.filter(p => p.id !== penaltyId),
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Delete penalty error:', error);
          set({
            error: error.message || 'Failed to delete penalty',
            isLoading: false
          });
        }
      },
      
      getPenaltiesForChild: (childId) => {
        return get().penalties.filter(penalty => penalty.childId === childId);
      }
    }),
    {
      name: 'kiddo-quest-storage', // unique name
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentView: state.currentView,
        selectedChild: state.selectedChild,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);

export default useStore;
