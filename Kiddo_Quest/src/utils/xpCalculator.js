// Level model and XP calculations for KiddoQuest gamification system

// Level progression configuration
const LEVEL_CONFIG = {
  MAX_LEVEL: 20,
  BASE_XP: 100, // XP needed for level 2
  GROWTH_FACTOR: 1.5, // Each level requires 50% more XP than previous
  BONUS_MULTIPLIERS: {
    firstOfDay: 1.2,
    streak: 1.1,
    questOfDay: 1.5,
    difficulty: {
      easy: 1.0,
      medium: 1.5,
      hard: 2.0
    }
  }
};

// Level definitions with titles and privileges
const LEVEL_DEFINITIONS = [
  { number: 1, title: 'Beginner', color: '#4CAF50', icon: '/assets/levels/level-1.png' },
  { number: 2, title: 'Helper', color: '#8BC34A', icon: '/assets/levels/level-2.png' },
  { number: 3, title: 'Adventurer', color: '#CDDC39', icon: '/assets/levels/level-3.png' },
  { number: 4, title: 'Explorer', color: '#FFEB3B', icon: '/assets/levels/level-4.png' },
  { number: 5, title: 'Achiever', color: '#FFC107', icon: '/assets/levels/level-5.png' },
  { number: 6, title: 'Champion', color: '#FF9800', icon: '/assets/levels/level-6.png' },
  { number: 7, title: 'Star', color: '#FF5722', icon: '/assets/levels/level-7.png' },
  { number: 8, title: 'Hero', color: '#F44336', icon: '/assets/levels/level-8.png' },
  { number: 9, title: 'Master', color: '#E91E63', icon: '/assets/levels/level-9.png' },
  { number: 10, title: 'Expert', color: '#9C27B0', icon: '/assets/levels/level-10.png' },
  { number: 11, title: 'Pro', color: '#673AB7', icon: '/assets/levels/level-11.png' },
  { number: 12, title: 'Elite', color: '#3F51B5', icon: '/assets/levels/level-12.png' },
  { number: 13, title: 'Superstar', color: '#2196F3', icon: '/assets/levels/level-13.png' },
  { number: 14, title: 'Legendary', color: '#03A9F4', icon: '/assets/levels/level-14.png' },
  { number: 15, title: 'Mythic', color: '#00BCD4', icon: '/assets/levels/level-15.png' },
  { number: 16, title: 'Epic', color: '#009688', icon: '/assets/levels/level-16.png' },
  { number: 17, title: 'Immortal', color: '#4CAF50', icon: '/assets/levels/level-17.png' },
  { number: 18, title: 'Divine', color: '#8BC34A', icon: '/assets/levels/level-18.png' },
  { number: 19, title: 'Supreme', color: '#CDDC39', icon: '/assets/levels/level-19.png' },
  { number: 20, title: 'Ultimate', color: '#FFD700', icon: '/assets/levels/level-20.png' }
];

// Privileges unlocked at each level
const LEVEL_PRIVILEGES = {
  1: ['basic_quests', 'earn_xp'],
  2: ['custom_avatar', 'daily_bonus'],
  3: ['badge_collection', 'streak_tracking'],
  5: ['bonus_multiplier', 'quest_templates'],
  7: ['create_own_quests', 'family_goals'],
  10: ['elite_badges', 'reward_discount'],
  15: ['legendary_status', 'mentor_role'],
  20: ['ultimate_privileges', 'all_features']
};

// Pre-calculated XP requirements for performance (memoization)
const XP_CACHE = new Map();

// Calculate XP required for a specific level
export const getXPRequiredForLevel = (level) => {
  if (level <= 1) return 0;
  if (level > LEVEL_CONFIG.MAX_LEVEL) return Infinity;
  
  // Check cache first for performance
  if (XP_CACHE.has(level)) {
    return XP_CACHE.get(level);
  }
  
  let totalXP = 0;
  for (let i = 2; i <= level; i++) {
    totalXP += Math.floor(LEVEL_CONFIG.BASE_XP * Math.pow(LEVEL_CONFIG.GROWTH_FACTOR, i - 2));
  }
  
  // Cache the result
  XP_CACHE.set(level, totalXP);
  return totalXP;
};

// Calculate current level from total XP
export const calculateLevelFromXP = (totalXP) => {
  if (totalXP < 0) return 1;
  
  for (let level = LEVEL_CONFIG.MAX_LEVEL; level >= 1; level--) {
    if (totalXP >= getXPRequiredForLevel(level)) {
      return level;
    }
  }
  return 1;
};

// Get level details including progress to next level
export const getLevelDetails = (totalXP) => {
  const currentLevel = calculateLevelFromXP(totalXP);
  const currentLevelXP = getXPRequiredForLevel(currentLevel);
  const nextLevelXP = getXPRequiredForLevel(currentLevel + 1);
  const xpInCurrentLevel = totalXP - currentLevelXP;
  const xpNeededForNext = nextLevelXP - currentLevelXP;
  
  const levelDef = LEVEL_DEFINITIONS[currentLevel - 1] || LEVEL_DEFINITIONS[0];
  const privileges = [];
  
  // Collect all privileges up to current level
  for (let i = 1; i <= currentLevel; i++) {
    if (LEVEL_PRIVILEGES[i]) {
      privileges.push(...LEVEL_PRIVILEGES[i]);
    }
  }
  
  return {
    level: currentLevel,
    title: levelDef.title,
    color: levelDef.color,
    icon: levelDef.icon,
    currentXP: xpInCurrentLevel,
    xpToNext: xpNeededForNext,
    totalXP,
    progress: (xpInCurrentLevel / xpNeededForNext) * 100,
    nextLevelAt: nextLevelXP,
    privileges,
    isMaxLevel: currentLevel >= LEVEL_CONFIG.MAX_LEVEL
  };
};

// Calculate XP with bonuses
export const calculateXPWithBonuses = (baseXP, options = {}) => {
  let multiplier = 1.0;
  
  // Apply difficulty multiplier
  if (options.difficulty) {
    multiplier *= LEVEL_CONFIG.BONUS_MULTIPLIERS.difficulty[options.difficulty] || 1.0;
  }
  
  // Apply first quest of the day bonus
  if (options.isFirstOfDay) {
    multiplier *= LEVEL_CONFIG.BONUS_MULTIPLIERS.firstOfDay;
  }
  
  // Apply streak bonus
  if (options.hasStreak) {
    multiplier *= LEVEL_CONFIG.BONUS_MULTIPLIERS.streak;
  }
  
  // Apply quest of the day bonus
  if (options.isQuestOfDay) {
    multiplier *= LEVEL_CONFIG.BONUS_MULTIPLIERS.questOfDay;
  }
  
  return Math.floor(baseXP * multiplier);
};

// Check if level up occurred
export const checkLevelUp = (oldTotalXP, newTotalXP) => {
  const oldLevel = calculateLevelFromXP(oldTotalXP);
  const newLevel = calculateLevelFromXP(newTotalXP);
  
  if (newLevel > oldLevel) {
    return {
      leveledUp: true,
      oldLevel,
      newLevel,
      levelsGained: newLevel - oldLevel,
      newPrivileges: LEVEL_PRIVILEGES[newLevel] || []
    };
  }
  
  return { leveledUp: false };
};

// Get celebration animation for level up
export const getLevelUpCelebration = (newLevel) => {
  if (newLevel === 5) return 'fireworks';
  if (newLevel === 10) return 'epic_fireworks';
  if (newLevel === 15) return 'legendary_celebration';
  if (newLevel === 20) return 'ultimate_celebration';
  if (newLevel % 5 === 0) return 'special_celebration';
  return 'standard_celebration';
};

// Format XP display
export const formatXP = (xp) => {
  if (xp >= 10000) {
    return `${(xp / 1000).toFixed(1)}k`;
  }
  return xp.toLocaleString();
};

// Get level progress percentage
export const getLevelProgress = (totalXP) => {
  const details = getLevelDetails(totalXP);
  return Math.min(100, Math.max(0, details.progress));
};

// Get next privilege unlock info
export const getNextPrivilege = (currentLevel) => {
  const privilegeLevels = Object.keys(LEVEL_PRIVILEGES)
    .map(Number)
    .sort((a, b) => a - b);
  
  const nextPrivilegeLevel = privilegeLevels.find(level => level > currentLevel);
  
  if (nextPrivilegeLevel) {
    return {
      level: nextPrivilegeLevel,
      levelsAway: nextPrivilegeLevel - currentLevel,
      privileges: LEVEL_PRIVILEGES[nextPrivilegeLevel]
    };
  }
  
  return null;
};

// Export configuration for use in other components
export const XPConfig = {
  LEVEL_CONFIG,
  LEVEL_DEFINITIONS,
  LEVEL_PRIVILEGES
};

// Level model class for advanced operations
export class Level {
  constructor(data) {
    this.number = data.number || 1;
    this.title = data.title || 'Beginner';
    this.xpRequired = getXPRequiredForLevel(this.number);
    this.xpToNext = getXPRequiredForLevel(this.number + 1) - this.xpRequired;
    this.privileges = this.getPrivileges();
    this.icon = data.icon || LEVEL_DEFINITIONS[this.number - 1]?.icon;
    this.color = data.color || LEVEL_DEFINITIONS[this.number - 1]?.color;
    this.celebrationAnimation = getLevelUpCelebration(this.number);
  }
  
  getPrivileges() {
    const privileges = [];
    for (let i = 1; i <= this.number; i++) {
      if (LEVEL_PRIVILEGES[i]) {
        privileges.push(...LEVEL_PRIVILEGES[i]);
      }
    }
    return privileges;
  }
  
  hasPrivilege(privilege) {
    return this.privileges.includes(privilege);
  }
  
  toJSON() {
    return {
      number: this.number,
      title: this.title,
      xpRequired: this.xpRequired,
      xpToNext: this.xpToNext,
      privileges: this.privileges,
      icon: this.icon,
      color: this.color,
      celebrationAnimation: this.celebrationAnimation
    };
  }
}

export default {
  getXPRequiredForLevel,
  calculateLevelFromXP,
  getLevelDetails,
  calculateXPWithBonuses,
  checkLevelUp,
  getLevelUpCelebration,
  formatXP,
  getLevelProgress,
  getNextPrivilege,
  Level,
  XPConfig
};