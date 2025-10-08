import { useState, useEffect, useCallback } from 'react';
import useKiddoQuestStore from '../store';
import { 
  Badge,
  checkBadgeUnlocks,
  getBadgesByCategory,
  getBadgesByRarity,
  getBadgeStats,
  getNextBadgesToUnlock,
  initializeUserBadges,
  BadgeConfig 
} from '../utils/badgeManager';
import { collection, doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Custom hook for badge management
 * Provides badge earning logic, progress tracking, collection management, and achievement notifications
 */
const useBadges = (childId = null) => {
  const { 
    childProfiles, 
    currentUser,
    selectedChildIdForDashboard,
    quests,
    questCompletions 
  } = useKiddoQuestStore();

  // State management
  const [badges, setBadges] = useState([]);
  const [newlyUnlockedBadges, setNewlyUnlockedBadges] = useState([]);
  const [showBadgeNotification, setShowBadgeNotification] = useState(false);
  const [badgeStats, setBadgeStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Determine which child to track
  const targetChildId = childId || selectedChildIdForDashboard;
  const targetChild = childProfiles.find(child => child.id === targetChildId);

  // Real-time listener for user badges
  useEffect(() => {
    if (!targetChildId) {
      setBadges([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const badgesRef = doc(db, 'userBadges', targetChildId);
    
    const unsubscribe = onSnapshot(badgesRef, (docSnap) => {
      if (docSnap.exists()) {
        const badgeData = docSnap.data();
        const userBadges = badgeData.badges || [];
        setBadges(userBadges.map(badgeData => Badge.fromFirestore(badgeData)));
      } else {
        // Initialize badges for new user
        const initialBadges = initializeUserBadges();
        setBadges(initialBadges);
        saveBadgesToFirestore(initialBadges);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [targetChildId]);

  // Update badge stats when badges change
  useEffect(() => {
    if (badges.length > 0) {
      const stats = getBadgeStats(badges);
      setBadgeStats(stats);
    }
  }, [badges]);

  // Check for badge unlocks when user stats change
  useEffect(() => {
    if (!targetChild || badges.length === 0) return;

    const userStats = calculateUserStats(targetChild);
    const unlockResult = checkBadgeUnlocks(userStats, badges);
    
    if (unlockResult.newlyUnlocked.length > 0) {
      setNewlyUnlockedBadges(unlockResult.newlyUnlocked);
      setShowBadgeNotification(true);
      setBadges(unlockResult.allBadges);
      saveBadgesToFirestore(unlockResult.allBadges);
      
      // Award XP for unlocked badges
      if (unlockResult.totalXPReward > 0) {
        awardBadgeXP(unlockResult.totalXPReward);
      }
    } else {
      // Update progress for existing badges
      setBadges(unlockResult.allBadges);
      saveBadgesToFirestore(unlockResult.allBadges);
    }
  }, [targetChild, questCompletions]);

  // Calculate user statistics for badge checking
  const calculateUserStats = useCallback((child) => {
    if (!child) return {};

    const completions = questCompletions.filter(c => c.childId === child.id);
    const now = new Date();
    
    // Calculate streak days (simplified - would need streak tracking in production)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayCompletions = completions.filter(c => {
      const completionDate = c.completedAt?.toDate?.() || new Date(c.completedAt);
      return completionDate >= today;
    });
    
    const yesterdayCompletions = completions.filter(c => {
      const completionDate = c.completedAt?.toDate?.() || new Date(c.completedAt);
      return completionDate >= yesterday && completionDate < today;
    });

    // Calculate weekend quests
    const weekendCompletions = completions.filter(c => {
      const completionDate = c.completedAt?.toDate?.() || new Date(c.completedAt);
      const dayOfWeek = completionDate.getDay();
      return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
    });

    // Calculate hard quest completions
    const hardCompletions = completions.filter(c => {
      const quest = quests.find(q => q.id === c.questId);
      return quest?.difficulty === 'hard';
    });

    // Calculate special achievements
    const morningCompletions = completions.filter(c => {
      const completionDate = c.completedAt?.toDate?.() || new Date(c.completedAt);
      return completionDate.getHours() < 8;
    });

    const nightCompletions = completions.filter(c => {
      const completionDate = c.completedAt?.toDate?.() || new Date(c.completedAt);
      return completionDate.getHours() >= 22;
    });

    return {
      questsCompleted: completions.length,
      totalXP: child.totalXP || child.xp || 0,
      level: child.level || 1,
      currentStreak: child.activeStreak || 0,
      longestStreak: child.longestStreak || 0,
      familyGoalsCompleted: 0, // Would need family goal tracking
      weekendQuests: weekendCompletions.length,
      hardQuestsCompleted: hardCompletions.length,
      
      // Special achievement flags
      early_morning_quest: morningCompletions.length > 0,
      late_night_quest: nightCompletions.length > 0,
      
      // Streak tracking
      streakDays: child.activeStreak || 0
    };
  }, [questCompletions, quests]);

  // Save badges to Firestore
  const saveBadgesToFirestore = useCallback(async (badgesToSave) => {
    if (!targetChildId || badgesToSave.length === 0) return;

    try {
      const badgesRef = doc(db, 'userBadges', targetChildId);
      await setDoc(badgesRef, {
        userId: targetChildId,
        badges: badgesToSave.map(badge => badge.toFirestore()),
        lastUpdated: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving badges to Firestore:', error);
    }
  }, [targetChildId]);

  // Award XP for badge unlocks
  const awardBadgeXP = useCallback(async (xpAmount) => {
    if (!targetChild || xpAmount <= 0) return;

    // This would integrate with the main store's XP awarding system
    // For now, we'll just log it for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Awarded ${xpAmount} XP for badge unlocks to ${targetChild.name}`);
    }
  }, [targetChild]);

  // Get badges by category
  const getBadgesByCategory = useCallback((category) => {
    return getBadgesByCategory(badges, category);
  }, [badges]);

  // Get badges by rarity
  const getBadgesByRarity = useCallback((rarity) => {
    return getBadgesByRarity(badges, rarity);
  }, [badges]);

  // Get unlocked badges
  const getUnlockedBadges = useCallback(() => {
    return badges.filter(badge => badge.isUnlocked);
  }, [badges]);

  // Get locked badges
  const getLockedBadges = useCallback(() => {
    return badges.filter(badge => !badge.isUnlocked);
  }, [badges]);

  // Get next badges to unlock
  const getNextBadges = useCallback((limit = 5) => {
    if (!targetChild) return [];
    
    const userStats = calculateUserStats(targetChild);
    return getNextBadgesToUnlock(userStats, badges, limit);
  }, [targetChild, badges, calculateUserStats]);

  // Get badge progress for specific badge
  const getBadgeProgress = useCallback((badgeId) => {
    if (!targetChild) return 0;
    
    const badge = badges.find(b => b.id === badgeId);
    if (!badge) return 0;
    
    const userStats = calculateUserStats(targetChild);
    return badge.calculateProgress(userStats);
  }, [targetChild, badges, calculateUserStats]);

  // Check if specific badge is unlocked
  const isBadgeUnlocked = useCallback((badgeId) => {
    const badge = badges.find(b => b.id === badgeId);
    return badge ? badge.isUnlocked : false;
  }, [badges]);

  // Get badge by ID
  const getBadgeById = useCallback((badgeId) => {
    return badges.find(b => b.id === badgeId);
  }, [badges]);

  // Get recent badges (unlocked in last 7 days)
  const getRecentBadges = useCallback(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    return badges.filter(badge => {
      if (!badge.isUnlocked || !badge.dateEarned) return false;
      
      const earnedDate = badge.dateEarned.toDate ? 
        badge.dateEarned.toDate() : 
        new Date(badge.dateEarned);
      
      return earnedDate >= weekAgo;
    });
  }, [badges]);

  // Get badge completion percentage
  const getCompletionPercentage = useCallback(() => {
    if (badges.length === 0) return 0;
    
    const unlockedCount = badges.filter(b => b.isUnlocked).length;
    return (unlockedCount / badges.length) * 100;
  }, [badges]);

  // Dismiss badge notification
  const dismissBadgeNotification = useCallback(() => {
    setShowBadgeNotification(false);
    setNewlyUnlockedBadges([]);
  }, []);

  // Force badge check (useful for manual triggers)
  const forceCheckBadges = useCallback(() => {
    if (!targetChild) return;
    
    const userStats = calculateUserStats(targetChild);
    const unlockResult = checkBadgeUnlocks(userStats, badges);
    
    setBadges(unlockResult.allBadges);
    saveBadgesToFirestore(unlockResult.allBadges);
    
    if (unlockResult.newlyUnlocked.length > 0) {
      setNewlyUnlockedBadges(unlockResult.newlyUnlocked);
      setShowBadgeNotification(true);
      
      if (unlockResult.totalXPReward > 0) {
        awardBadgeXP(unlockResult.totalXPReward);
      }
    }
    
    return unlockResult;
  }, [targetChild, badges, calculateUserStats, saveBadgesToFirestore, awardBadgeXP]);

  // Get family badge statistics
  const getFamilyBadgeStats = useCallback(() => {
    if (childProfiles.length === 0) return null;

    // This would require fetching badges for all children
    // For now, return basic stats
    return {
      totalFamilyBadges: badges.filter(b => b.isUnlocked).length,
      averageBadgesPerChild: badges.filter(b => b.isUnlocked).length,
      mostCommonBadge: null,
      familyBadgeLeader: targetChild?.name || 'Unknown'
    };
  }, [childProfiles, badges, targetChild]);

  // Search badges
  const searchBadges = useCallback((searchTerm) => {
    if (!searchTerm) return badges;
    
    const term = searchTerm.toLowerCase();
    return badges.filter(badge => 
      badge.name.toLowerCase().includes(term) ||
      badge.description.toLowerCase().includes(term) ||
      badge.category.toLowerCase().includes(term)
    );
  }, [badges]);

  // Filter badges
  const filterBadges = useCallback((filters) => {
    let filteredBadges = [...badges];
    
    if (filters.category) {
      filteredBadges = filteredBadges.filter(b => b.category === filters.category);
    }
    
    if (filters.rarity) {
      filteredBadges = filteredBadges.filter(b => b.rarity === filters.rarity);
    }
    
    if (filters.unlocked !== undefined) {
      filteredBadges = filteredBadges.filter(b => b.isUnlocked === filters.unlocked);
    }
    
    if (filters.progress) {
      const userStats = calculateUserStats(targetChild);
      filteredBadges = filteredBadges.filter(b => {
        const progress = b.calculateProgress(userStats);
        return progress >= filters.progress.min && progress <= filters.progress.max;
      });
    }
    
    return filteredBadges;
  }, [badges, targetChild, calculateUserStats]);

  return {
    // Badge collection
    badges,
    unlockedBadges: getUnlockedBadges(),
    lockedBadges: getLockedBadges(),
    
    // Badge statistics
    badgeStats,
    completionPercentage: getCompletionPercentage(),
    
    // Badge notifications
    newlyUnlockedBadges,
    showBadgeNotification,
    dismissBadgeNotification,
    
    // Badge querying
    getBadgesByCategory: getBadgesByCategory,
    getBadgesByRarity: getBadgesByRarity,
    getBadgeById,
    getNextBadges,
    getRecentBadges,
    
    // Progress tracking
    getBadgeProgress,
    isBadgeUnlocked,
    
    // Badge management
    forceCheckBadges,
    calculateUserStats: () => targetChild ? calculateUserStats(targetChild) : {},
    
    // Search and filter
    searchBadges,
    filterBadges,
    
    // Family statistics
    getFamilyBadgeStats,
    
    // Configuration
    badgeCategories: BadgeConfig.BADGE_CONFIG.CATEGORIES,
    badgeRarities: BadgeConfig.BADGE_CONFIG.RARITY,
    allBadgeDefinitions: BadgeConfig.BADGE_DEFINITIONS,
    
    // State
    loading,
    targetChild,
    
    // Utility functions
    Badge: Badge,
    initializeUserBadges,
    checkBadgeUnlocks: (userStats) => checkBadgeUnlocks(userStats, badges)
  };
};

export default useBadges;