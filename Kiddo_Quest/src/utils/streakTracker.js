// Streak model and tracker for KiddoQuest gamification system

import { serverTimestamp } from 'firebase/firestore';

// Streak configuration
const STREAK_CONFIG = {
  TIMEZONE_OFFSET: 0, // UTC by default, should be set per family
  STREAK_RESET_HOUR: 4, // Streaks reset at 4 AM to account for late-night completions
  MIN_QUEST_DIFFICULTY: 'easy', // Minimum difficulty to count towards streak
  STREAK_TYPES: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly'
  },
  MULTIPLIERS: {
    STREAK_3: 1.1,    // 10% bonus after 3 days
    STREAK_7: 1.2,    // 20% bonus after 7 days
    STREAK_14: 1.3,   // 30% bonus after 14 days
    STREAK_30: 1.5,   // 50% bonus after 30 days
    STREAK_100: 2.0   // 100% bonus after 100 days
  },
  FREEZE_COST: 50, // XP cost to freeze streak for one day
  MAX_FREEZES_PER_WEEK: 2
};

// Streak milestone definitions
const STREAK_MILESTONES = [
  { days: 3, title: 'Getting Started', reward: 100, badge: 'three_day_streak' },
  { days: 7, title: 'Week Warrior', reward: 200, badge: 'week_warrior' },
  { days: 14, title: 'Two Week Champion', reward: 300, badge: null },
  { days: 21, title: 'Three Week Hero', reward: 400, badge: null },
  { days: 30, title: 'Month Master', reward: 500, badge: 'month_champion' },
  { days: 50, title: 'Fifty Day Fighter', reward: 750, badge: null },
  { days: 75, title: 'Diamond Dedication', reward: 1000, badge: null },
  { days: 100, title: 'Unstoppable Force', reward: 1500, badge: 'unstoppable' },
  { days: 200, title: 'Legendary Persistence', reward: 2500, badge: null },
  { days: 365, title: 'Year of Excellence', reward: 5000, badge: 'year_champion' }
];

// Streak model class
export class Streak {
  constructor(data = {}) {
    this.userId = data.userId;
    this.type = data.type || STREAK_CONFIG.STREAK_TYPES.DAILY;
    this.currentStreak = data.currentStreak || 0;
    this.longestStreak = data.longestStreak || 0;
    this.lastCompletionDate = data.lastCompletionDate || null;
    this.streakStartDate = data.streakStartDate || null;
    this.isActive = data.isActive || false;
    this.freezesUsed = data.freezesUsed || 0;
    this.lastFreezeDate = data.lastFreezeDate || null;
    this.streakMultiplier = data.streakMultiplier || 1.0;
    this.milestoneRewards = data.milestoneRewards || [];
    this.totalQuestsInStreak = data.totalQuestsInStreak || 0;
    this.createdAt = data.createdAt || serverTimestamp();
    this.updatedAt = data.updatedAt || serverTimestamp();
  }

  // Check if streak should continue based on last completion
  shouldContinueStreak(currentDate = new Date()) {
    if (!this.lastCompletionDate || !this.isActive) return false;

    const lastCompletion = this.lastCompletionDate.toDate ? 
      this.lastCompletionDate.toDate() : 
      new Date(this.lastCompletionDate);
    
    const daysDiff = this.getDaysDifference(lastCompletion, currentDate);
    
    // Allow same day completions and next day completions
    return daysDiff <= 1;
  }

  // Check if streak should be broken
  shouldBreakStreak(currentDate = new Date()) {
    if (!this.lastCompletionDate || !this.isActive) return false;

    const lastCompletion = this.lastCompletionDate.toDate ? 
      this.lastCompletionDate.toDate() : 
      new Date(this.lastCompletionDate);
    
    const daysDiff = this.getDaysDifference(lastCompletion, currentDate);
    
    // Break streak if more than 1 day has passed without completion
    return daysDiff > 1;
  }

  // Get days difference accounting for streak reset hour
  getDaysDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    // Adjust for streak reset hour
    if (d1.getHours() < STREAK_CONFIG.STREAK_RESET_HOUR) {
      d1.setDate(d1.getDate() - 1);
    }
    if (d2.getHours() < STREAK_CONFIG.STREAK_RESET_HOUR) {
      d2.setDate(d2.getDate() - 1);
    }
    
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    
    return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
  }

  // Record quest completion for streak
  recordCompletion(questData, completionDate = new Date()) {
    const shouldStart = !this.isActive || this.shouldBreakStreak(completionDate);
    const shouldContinue = this.shouldContinueStreak(completionDate);
    
    if (shouldStart) {
      // Start new streak
      this.currentStreak = 1;
      this.streakStartDate = completionDate;
      this.isActive = true;
      this.totalQuestsInStreak = 1;
    } else if (shouldContinue) {
      // Continue existing streak
      const lastCompletion = this.lastCompletionDate.toDate ? 
        this.lastCompletionDate.toDate() : 
        new Date(this.lastCompletionDate);
      
      const daysDiff = this.getDaysDifference(lastCompletion, completionDate);
      
      if (daysDiff === 1) {
        // Next day completion
        this.currentStreak += 1;
        this.totalQuestsInStreak += 1;
      } else if (daysDiff === 0) {
        // Same day completion
        this.totalQuestsInStreak += 1;
      }
    }
    
    this.lastCompletionDate = completionDate;
    this.longestStreak = Math.max(this.longestStreak, this.currentStreak);
    this.streakMultiplier = this.calculateMultiplier();
    this.updatedAt = serverTimestamp();
    
    // Check for milestone rewards
    const milestoneReached = this.checkMilestoneReached();
    
    return {
      streakContinued: shouldContinue && !shouldStart,
      streakStarted: shouldStart,
      currentStreak: this.currentStreak,
      longestStreak: this.longestStreak,
      multiplier: this.streakMultiplier,
      milestoneReached
    };
  }

  // Break the current streak
  breakStreak(reason = 'missed_day') {
    if (!this.isActive) return false;
    
    this.isActive = false;
    this.streakMultiplier = 1.0;
    this.updatedAt = serverTimestamp();
    
    return {
      broken: true,
      finalStreak: this.currentStreak,
      longestStreak: this.longestStreak,
      reason
    };
  }

  // Freeze streak to prevent breaking
  freezeStreak(userXP, freezeDate = new Date()) {
    const freezeCost = STREAK_CONFIG.FREEZE_COST;
    
    // Check if user has enough XP
    if (userXP < freezeCost) {
      return { success: false, reason: 'insufficient_xp', required: freezeCost };
    }
    
    // Check freeze limits
    const weeksSinceLastFreeze = this.lastFreezeDate ? 
      Math.floor((freezeDate - this.lastFreezeDate) / (1000 * 60 * 60 * 24 * 7)) : 
      1;
    
    if (weeksSinceLastFreeze === 0 && this.freezesUsed >= STREAK_CONFIG.MAX_FREEZES_PER_WEEK) {
      return { 
        success: false, 
        reason: 'freeze_limit_reached', 
        maxPerWeek: STREAK_CONFIG.MAX_FREEZES_PER_WEEK 
      };
    }
    
    // Reset freeze count if new week
    if (weeksSinceLastFreeze > 0) {
      this.freezesUsed = 0;
    }
    
    // Apply freeze
    this.freezesUsed += 1;
    this.lastFreezeDate = freezeDate;
    this.lastCompletionDate = freezeDate; // Extend last completion
    this.updatedAt = serverTimestamp();
    
    return {
      success: true,
      xpCost: freezeCost,
      freezesRemaining: STREAK_CONFIG.MAX_FREEZES_PER_WEEK - this.freezesUsed
    };
  }

  // Calculate streak multiplier
  calculateMultiplier() {
    if (this.currentStreak >= 100) return STREAK_CONFIG.MULTIPLIERS.STREAK_100;
    if (this.currentStreak >= 30) return STREAK_CONFIG.MULTIPLIERS.STREAK_30;
    if (this.currentStreak >= 14) return STREAK_CONFIG.MULTIPLIERS.STREAK_14;
    if (this.currentStreak >= 7) return STREAK_CONFIG.MULTIPLIERS.STREAK_7;
    if (this.currentStreak >= 3) return STREAK_CONFIG.MULTIPLIERS.STREAK_3;
    return 1.0;
  }

  // Check if milestone was reached
  checkMilestoneReached() {
    const milestone = STREAK_MILESTONES.find(m => 
      m.days === this.currentStreak && 
      !this.milestoneRewards.includes(m.days)
    );
    
    if (milestone) {
      this.milestoneRewards.push(milestone.days);
      return milestone;
    }
    
    return null;
  }

  // Get next milestone
  getNextMilestone() {
    return STREAK_MILESTONES.find(m => 
      m.days > this.currentStreak && 
      !this.milestoneRewards.includes(m.days)
    );
  }

  // Get streak status
  getStatus(currentDate = new Date()) {
    if (!this.isActive) {
      return { 
        status: 'inactive', 
        daysUntilBreak: 0,
        canFreeze: false 
      };
    }
    
    if (this.shouldBreakStreak(currentDate)) {
      return { 
        status: 'broken', 
        daysUntilBreak: 0,
        canFreeze: false 
      };
    }
    
    const lastCompletion = this.lastCompletionDate.toDate ? 
      this.lastCompletionDate.toDate() : 
      new Date(this.lastCompletionDate);
    
    const daysDiff = this.getDaysDifference(lastCompletion, currentDate);
    const daysUntilBreak = Math.max(0, 1 - daysDiff);
    
    return {
      status: daysDiff === 0 ? 'completed_today' : 'active',
      daysUntilBreak,
      canFreeze: daysUntilBreak === 0 && this.freezesUsed < STREAK_CONFIG.MAX_FREEZES_PER_WEEK
    };
  }

  // Convert to Firebase document
  toFirestore() {
    return {
      userId: this.userId,
      type: this.type,
      currentStreak: this.currentStreak,
      longestStreak: this.longestStreak,
      lastCompletionDate: this.lastCompletionDate,
      streakStartDate: this.streakStartDate,
      isActive: this.isActive,
      freezesUsed: this.freezesUsed,
      lastFreezeDate: this.lastFreezeDate,
      streakMultiplier: this.streakMultiplier,
      milestoneRewards: this.milestoneRewards,
      totalQuestsInStreak: this.totalQuestsInStreak,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Create from Firebase document
  static fromFirestore(data) {
    return new Streak(data);
  }

  // Validate streak data
  static validate(data) {
    const errors = [];
    
    if (!data.userId) errors.push('User ID is required');
    if (data.type && !Object.values(STREAK_CONFIG.STREAK_TYPES).includes(data.type)) {
      errors.push('Valid streak type is required');
    }
    if (data.currentStreak < 0) errors.push('Current streak cannot be negative');
    if (data.longestStreak < 0) errors.push('Longest streak cannot be negative');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    const nextMilestone = this.getNextMilestone();
    const status = this.getStatus();
    
    return {
      userId: this.userId,
      type: this.type,
      currentStreak: this.currentStreak,
      longestStreak: this.longestStreak,
      lastCompletionDate: this.lastCompletionDate,
      streakStartDate: this.streakStartDate,
      isActive: this.isActive,
      freezesUsed: this.freezesUsed,
      lastFreezeDate: this.lastFreezeDate,
      streakMultiplier: this.streakMultiplier,
      milestoneRewards: this.milestoneRewards,
      totalQuestsInStreak: this.totalQuestsInStreak,
      nextMilestone,
      status: status.status,
      daysUntilBreak: status.daysUntilBreak,
      canFreeze: status.canFreeze,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Initialize streak for new user
export const initializeUserStreak = (userId) => {
  return new Streak({ userId });
};

// Get streak statistics
export const getStreakStats = (streaks) => {
  const activeStreaks = streaks.filter(s => s.isActive);
  const totalStreaks = streaks.length;
  const longestOverall = Math.max(...streaks.map(s => s.longestStreak), 0);
  const totalQuestsCompleted = streaks.reduce((sum, s) => sum + s.totalQuestsInStreak, 0);
  const totalMilestones = streaks.reduce((sum, s) => sum + s.milestoneRewards.length, 0);
  
  return {
    activeStreaks: activeStreaks.length,
    totalStreaks,
    longestOverallStreak: longestOverall,
    totalQuestsInStreaks: totalQuestsCompleted,
    totalMilestonesReached: totalMilestones,
    averageStreakLength: totalStreaks > 0 ? 
      streaks.reduce((sum, s) => sum + s.longestStreak, 0) / totalStreaks : 0
  };
};

// Calculate streak bonus XP
export const calculateStreakBonus = (baseXP, streak) => {
  if (!streak || !streak.isActive) return 0;
  
  const bonus = baseXP * (streak.streakMultiplier - 1);
  return Math.floor(bonus);
};

// Get streak encouragement message
export const getStreakMessage = (streak) => {
  if (!streak.isActive) {
    return "Start a new quest streak today!";
  }
  
  const status = streak.getStatus();
  const nextMilestone = streak.getNextMilestone();
  
  if (status.status === 'completed_today') {
    if (nextMilestone) {
      const daysToMilestone = nextMilestone.days - streak.currentStreak;
      return `Great job! ${daysToMilestone} more days to reach "${nextMilestone.title}"`;
    }
    return `Amazing ${streak.currentStreak} day streak! Keep it up!`;
  }
  
  if (status.daysUntilBreak === 0) {
    return "Your streak is at risk! Complete a quest today to keep it going.";
  }
  
  return `${streak.currentStreak} day streak active! Complete today's quest to continue.`;
};

// Get all streak milestones
export const getStreakMilestones = () => {
  return [...STREAK_MILESTONES];
};

// Format streak display
export const formatStreakDays = (days) => {
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;
  if (days < 365) {
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    if (remainingDays === 0) return `${weeks} week${weeks !== 1 ? 's' : ''}`;
    return `${weeks}w ${remainingDays}d`;
  }
  const years = Math.floor(days / 365);
  const remainingDays = days % 365;
  return `${years} year${years !== 1 ? 's' : ''} ${remainingDays} days`;
};

// Export configuration
export const StreakConfig = {
  STREAK_CONFIG,
  STREAK_MILESTONES
};

export default {
  Streak,
  initializeUserStreak,
  getStreakStats,
  calculateStreakBonus,
  getStreakMessage,
  getStreakMilestones,
  formatStreakDays,
  StreakConfig
};