// Badge model and criteria for KiddoQuest gamification system

import { serverTimestamp } from 'firebase/firestore';

// Badge categories and configurations
const BADGE_CONFIG = {
  CATEGORIES: {
    QUEST: 'quest',
    STREAK: 'streak',
    XP: 'xp',
    SOCIAL: 'social',
    SPECIAL: 'special',
    MILESTONE: 'milestone'
  },
  RARITY: {
    COMMON: { name: 'Common', color: '#4CAF50', multiplier: 1 },
    UNCOMMON: { name: 'Uncommon', color: '#2196F3', multiplier: 1.2 },
    RARE: { name: 'Rare', color: '#9C27B0', multiplier: 1.5 },
    EPIC: { name: 'Epic', color: '#FF9800', multiplier: 2 },
    LEGENDARY: { name: 'Legendary', color: '#F44336', multiplier: 3 }
  }
};

// Badge definitions with unlock criteria
const BADGE_DEFINITIONS = [
  // Quest Badges
  {
    id: 'first_quest',
    name: 'First Steps',
    description: 'Complete your first quest',
    category: 'quest',
    rarity: 'common',
    icon: '/assets/badges/first-quest.png',
    criteria: { questsCompleted: 1 },
    xpReward: 50
  },
  {
    id: 'quest_novice',
    name: 'Quest Novice',
    description: 'Complete 10 quests',
    category: 'quest',
    rarity: 'common',
    icon: '/assets/badges/quest-novice.png',
    criteria: { questsCompleted: 10 },
    xpReward: 100
  },
  {
    id: 'quest_expert',
    name: 'Quest Expert',
    description: 'Complete 50 quests',
    category: 'quest',
    rarity: 'uncommon',
    icon: '/assets/badges/quest-expert.png',
    criteria: { questsCompleted: 50 },
    xpReward: 250
  },
  {
    id: 'quest_master',
    name: 'Quest Master',
    description: 'Complete 100 quests',
    category: 'quest',
    rarity: 'rare',
    icon: '/assets/badges/quest-master.png',
    criteria: { questsCompleted: 100 },
    xpReward: 500
  },
  {
    id: 'quest_legend',
    name: 'Quest Legend',
    description: 'Complete 500 quests',
    category: 'quest',
    rarity: 'legendary',
    icon: '/assets/badges/quest-legend.png',
    criteria: { questsCompleted: 500 },
    xpReward: 1000
  },

  // Streak Badges
  {
    id: 'three_day_streak',
    name: 'Getting Started',
    description: 'Complete quests for 3 days in a row',
    category: 'streak',
    rarity: 'common',
    icon: '/assets/badges/streak-3.png',
    criteria: { streakDays: 3 },
    xpReward: 75
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Complete quests for 7 days in a row',
    category: 'streak',
    rarity: 'uncommon',
    icon: '/assets/badges/streak-7.png',
    criteria: { streakDays: 7 },
    xpReward: 150
  },
  {
    id: 'month_champion',
    name: 'Month Champion',
    description: 'Complete quests for 30 days in a row',
    category: 'streak',
    rarity: 'epic',
    icon: '/assets/badges/streak-30.png',
    criteria: { streakDays: 30 },
    xpReward: 500
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Complete quests for 100 days in a row',
    category: 'streak',
    rarity: 'legendary',
    icon: '/assets/badges/streak-100.png',
    criteria: { streakDays: 100 },
    xpReward: 1500
  },

  // XP Badges
  {
    id: 'xp_collector',
    name: 'XP Collector',
    description: 'Earn 1,000 total XP',
    category: 'xp',
    rarity: 'common',
    icon: '/assets/badges/xp-1k.png',
    criteria: { totalXP: 1000 },
    xpReward: 100
  },
  {
    id: 'xp_hoarder',
    name: 'XP Hoarder',
    description: 'Earn 10,000 total XP',
    category: 'xp',
    rarity: 'uncommon',
    icon: '/assets/badges/xp-10k.png',
    criteria: { totalXP: 10000 },
    xpReward: 250
  },
  {
    id: 'xp_master',
    name: 'XP Master',
    description: 'Earn 50,000 total XP',
    category: 'xp',
    rarity: 'rare',
    icon: '/assets/badges/xp-50k.png',
    criteria: { totalXP: 50000 },
    xpReward: 500
  },
  {
    id: 'xp_legend',
    name: 'XP Legend',
    description: 'Earn 100,000 total XP',
    category: 'xp',
    rarity: 'legendary',
    icon: '/assets/badges/xp-100k.png',
    criteria: { totalXP: 100000 },
    xpReward: 1000
  },

  // Social Badges
  {
    id: 'team_player',
    name: 'Team Player',
    description: 'Complete 5 family goals',
    category: 'social',
    rarity: 'uncommon',
    icon: '/assets/badges/team-player.png',
    criteria: { familyGoalsCompleted: 5 },
    xpReward: 200
  },
  {
    id: 'family_hero',
    name: 'Family Hero',
    description: 'Complete 25 family goals',
    category: 'social',
    rarity: 'epic',
    icon: '/assets/badges/family-hero.png',
    criteria: { familyGoalsCompleted: 25 },
    xpReward: 750
  },

  // Milestone Badges
  {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reach level 5',
    category: 'milestone',
    rarity: 'uncommon',
    icon: '/assets/badges/level-5.png',
    criteria: { level: 5 },
    xpReward: 200
  },
  {
    id: 'level_10',
    name: 'Elite Member',
    description: 'Reach level 10',
    category: 'milestone',
    rarity: 'rare',
    icon: '/assets/badges/level-10.png',
    criteria: { level: 10 },
    xpReward: 500
  },
  {
    id: 'level_15',
    name: 'Legendary Achiever',
    description: 'Reach level 15',
    category: 'milestone',
    rarity: 'epic',
    icon: '/assets/badges/level-15.png',
    criteria: { level: 15 },
    xpReward: 750
  },
  {
    id: 'max_level',
    name: 'Ultimate Champion',
    description: 'Reach level 20',
    category: 'milestone',
    rarity: 'legendary',
    icon: '/assets/badges/level-20.png',
    criteria: { level: 20 },
    xpReward: 1000
  },

  // Special Badges
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete a quest before 8 AM',
    category: 'special',
    rarity: 'uncommon',
    icon: '/assets/badges/early-bird.png',
    criteria: { type: 'early_morning_quest' },
    xpReward: 150
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete a quest after 10 PM',
    category: 'special',
    rarity: 'uncommon',
    icon: '/assets/badges/night-owl.png',
    criteria: { type: 'late_night_quest' },
    xpReward: 150
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Complete 10 quests on weekends',
    category: 'special',
    rarity: 'rare',
    icon: '/assets/badges/weekend-warrior.png',
    criteria: { weekendQuests: 10 },
    xpReward: 300
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete 20 hard difficulty quests',
    category: 'special',
    rarity: 'epic',
    icon: '/assets/badges/perfectionist.png',
    criteria: { hardQuestsCompleted: 20 },
    xpReward: 600
  }
];

// Badge model class
export class Badge {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.category = data.category;
    this.rarity = data.rarity;
    this.icon = data.icon;
    this.criteria = data.criteria;
    this.xpReward = data.xpReward || 0;
    this.dateEarned = data.dateEarned || null;
    this.isUnlocked = data.isUnlocked || false;
    this.progress = data.progress || 0;
  }

  // Check if badge criteria is met
  checkCriteria(userStats) {
    if (this.isUnlocked) return true;

    const criteria = this.criteria;
    
    // Quest completion badges
    if (criteria.questsCompleted !== undefined) {
      return userStats.questsCompleted >= criteria.questsCompleted;
    }
    
    // Streak badges
    if (criteria.streakDays !== undefined) {
      return userStats.currentStreak >= criteria.streakDays;
    }
    
    // XP badges
    if (criteria.totalXP !== undefined) {
      return userStats.totalXP >= criteria.totalXP;
    }
    
    // Level badges
    if (criteria.level !== undefined) {
      return userStats.level >= criteria.level;
    }
    
    // Family goal badges
    if (criteria.familyGoalsCompleted !== undefined) {
      return userStats.familyGoalsCompleted >= criteria.familyGoalsCompleted;
    }
    
    // Special type badges
    if (criteria.type !== undefined) {
      return userStats[criteria.type] || false;
    }
    
    // Weekend quest badges
    if (criteria.weekendQuests !== undefined) {
      return userStats.weekendQuests >= criteria.weekendQuests;
    }
    
    // Hard quest badges
    if (criteria.hardQuestsCompleted !== undefined) {
      return userStats.hardQuestsCompleted >= criteria.hardQuestsCompleted;
    }
    
    return false;
  }

  // Calculate progress towards badge
  calculateProgress(userStats) {
    if (this.isUnlocked) return 100;

    const criteria = this.criteria;
    
    if (criteria.questsCompleted !== undefined) {
      return Math.min(100, (userStats.questsCompleted / criteria.questsCompleted) * 100);
    }
    
    if (criteria.streakDays !== undefined) {
      return Math.min(100, (userStats.currentStreak / criteria.streakDays) * 100);
    }
    
    if (criteria.totalXP !== undefined) {
      return Math.min(100, (userStats.totalXP / criteria.totalXP) * 100);
    }
    
    if (criteria.level !== undefined) {
      return Math.min(100, (userStats.level / criteria.level) * 100);
    }
    
    if (criteria.familyGoalsCompleted !== undefined) {
      return Math.min(100, (userStats.familyGoalsCompleted / criteria.familyGoalsCompleted) * 100);
    }
    
    if (criteria.weekendQuests !== undefined) {
      return Math.min(100, (userStats.weekendQuests / criteria.weekendQuests) * 100);
    }
    
    if (criteria.hardQuestsCompleted !== undefined) {
      return Math.min(100, (userStats.hardQuestsCompleted / criteria.hardQuestsCompleted) * 100);
    }
    
    return 0;
  }

  // Get rarity information
  getRarityInfo() {
    return BADGE_CONFIG.RARITY[this.rarity.toUpperCase()] || BADGE_CONFIG.RARITY.COMMON;
  }

  // Unlock badge
  unlock() {
    this.isUnlocked = true;
    this.dateEarned = serverTimestamp();
    this.progress = 100;
    return this;
  }

  // Convert to Firebase document
  toFirestore() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      rarity: this.rarity,
      icon: this.icon,
      criteria: this.criteria,
      xpReward: this.xpReward,
      dateEarned: this.dateEarned,
      isUnlocked: this.isUnlocked,
      progress: this.progress
    };
  }

  // Create from Firebase document
  static fromFirestore(data) {
    return new Badge(data);
  }

  // Validate badge data
  static validate(data) {
    const errors = [];
    
    if (!data.id) errors.push('Badge ID is required');
    if (!data.name) errors.push('Badge name is required');
    if (!data.description) errors.push('Badge description is required');
    if (!data.category || !Object.values(BADGE_CONFIG.CATEGORIES).includes(data.category)) {
      errors.push('Valid badge category is required');
    }
    if (!data.rarity || !Object.keys(BADGE_CONFIG.RARITY).includes(data.rarity.toUpperCase())) {
      errors.push('Valid badge rarity is required');
    }
    if (!data.criteria || typeof data.criteria !== 'object') {
      errors.push('Badge criteria object is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      rarity: this.rarity,
      rarityInfo: this.getRarityInfo(),
      icon: this.icon,
      criteria: this.criteria,
      xpReward: this.xpReward,
      dateEarned: this.dateEarned,
      isUnlocked: this.isUnlocked,
      progress: this.progress
    };
  }
}

// Check all badges for a user
export const checkBadgeUnlocks = (userStats, existingBadges = []) => {
  const newlyUnlocked = [];
  const updatedBadges = [];
  
  BADGE_DEFINITIONS.forEach(badgeDef => {
    const existingBadge = existingBadges.find(b => b.id === badgeDef.id);
    const badge = existingBadge ? new Badge(existingBadge) : new Badge(badgeDef);
    
    if (!badge.isUnlocked && badge.checkCriteria(userStats)) {
      badge.unlock();
      newlyUnlocked.push(badge);
    } else if (!badge.isUnlocked) {
      badge.progress = badge.calculateProgress(userStats);
    }
    
    updatedBadges.push(badge);
  });
  
  return {
    newlyUnlocked,
    allBadges: updatedBadges,
    totalXPReward: newlyUnlocked.reduce((sum, badge) => sum + badge.xpReward, 0)
  };
};

// Get badges by category
export const getBadgesByCategory = (badges, category) => {
  return badges.filter(badge => badge.category === category);
};

// Get badges by rarity
export const getBadgesByRarity = (badges, rarity) => {
  return badges.filter(badge => badge.rarity === rarity);
};

// Get user badge statistics
export const getBadgeStats = (badges) => {
  const unlockedBadges = badges.filter(badge => badge.isUnlocked);
  const totalBadges = BADGE_DEFINITIONS.length;
  
  const statsByCategory = {};
  const statsByRarity = {};
  
  Object.values(BADGE_CONFIG.CATEGORIES).forEach(category => {
    const categoryBadges = badges.filter(badge => badge.category === category);
    const unlockedInCategory = categoryBadges.filter(badge => badge.isUnlocked);
    
    statsByCategory[category] = {
      total: categoryBadges.length,
      unlocked: unlockedInCategory.length,
      percentage: categoryBadges.length > 0 ? (unlockedInCategory.length / categoryBadges.length) * 100 : 0
    };
  });
  
  Object.keys(BADGE_CONFIG.RARITY).forEach(rarity => {
    const rarityBadges = badges.filter(badge => badge.rarity === rarity.toLowerCase());
    const unlockedInRarity = rarityBadges.filter(badge => badge.isUnlocked);
    
    statsByRarity[rarity] = {
      total: rarityBadges.length,
      unlocked: unlockedInRarity.length,
      percentage: rarityBadges.length > 0 ? (unlockedInRarity.length / rarityBadges.length) * 100 : 0
    };
  });
  
  return {
    totalUnlocked: unlockedBadges.length,
    totalBadges,
    completionPercentage: (unlockedBadges.length / totalBadges) * 100,
    totalXPFromBadges: unlockedBadges.reduce((sum, badge) => sum + badge.xpReward, 0),
    statsByCategory,
    statsByRarity,
    mostRecentBadge: unlockedBadges
      .sort((a, b) => (b.dateEarned?.toMillis?.() || 0) - (a.dateEarned?.toMillis?.() || 0))[0] || null
  };
};

// Get next badges to unlock
export const getNextBadgesToUnlock = (userStats, badges, limit = 5) => {
  const unlockedBadgeIds = new Set(badges.filter(b => b.isUnlocked).map(b => b.id));
  
  return BADGE_DEFINITIONS
    .filter(badgeDef => !unlockedBadgeIds.has(badgeDef.id))
    .map(badgeDef => {
      const badge = new Badge(badgeDef);
      badge.progress = badge.calculateProgress(userStats);
      return badge;
    })
    .sort((a, b) => b.progress - a.progress)
    .slice(0, limit);
};

// Initialize user badges
export const initializeUserBadges = () => {
  return BADGE_DEFINITIONS.map(badgeDef => new Badge(badgeDef));
};

// Format badge display name
export const formatBadgeRarity = (rarity) => {
  const rarityInfo = BADGE_CONFIG.RARITY[rarity.toUpperCase()];
  return rarityInfo ? rarityInfo.name : 'Common';
};

// Get badge color by rarity
export const getBadgeColor = (rarity) => {
  const rarityInfo = BADGE_CONFIG.RARITY[rarity.toUpperCase()];
  return rarityInfo ? rarityInfo.color : BADGE_CONFIG.RARITY.COMMON.color;
};

// Export configuration and definitions
export const BadgeConfig = {
  BADGE_CONFIG,
  BADGE_DEFINITIONS
};

export default {
  Badge,
  checkBadgeUnlocks,
  getBadgesByCategory,
  getBadgesByRarity,
  getBadgeStats,
  getNextBadgesToUnlock,
  initializeUserBadges,
  formatBadgeRarity,
  getBadgeColor,
  BadgeConfig
};