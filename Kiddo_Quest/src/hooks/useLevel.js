import { useState, useEffect, useCallback } from 'react';
import useKiddoQuestStore from '../store';
import { 
  calculateLevelFromXP,
  getLevelDetails,
  checkLevelUp,
  getLevelUpCelebration,
  getNextPrivilege,
  XPConfig 
} from '../utils/xpCalculator';

/**
 * Custom hook for level management
 * Provides level calculations, progress tracking, level up detection, and privilege checking
 */
const useLevel = (childId = null) => {
  const { 
    childProfiles, 
    currentUser,
    selectedChildIdForDashboard 
  } = useKiddoQuestStore();

  // State for level up animations and notifications
  const [levelUpData, setLevelUpData] = useState(null);
  const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false);
  const [previousXP, setPreviousXP] = useState(0);

  // Determine which child to track
  const targetChildId = childId || selectedChildIdForDashboard;
  const targetChild = childProfiles.find(child => child.id === targetChildId);

  // Calculate current level details
  const currentLevel = useCallback(() => {
    if (!targetChild) return null;
    
    const totalXP = targetChild.totalXP || targetChild.xp || 0;
    return getLevelDetails(totalXP);
  }, [targetChild]);

  // Get level information
  const levelInfo = currentLevel();

  // Check for level up when XP changes
  useEffect(() => {
    if (!targetChild) return;

    const currentXP = targetChild.totalXP || targetChild.xp || 0;
    
    if (previousXP > 0 && currentXP > previousXP) {
      const levelUpResult = checkLevelUp(previousXP, currentXP);
      
      if (levelUpResult.leveledUp) {
        setLevelUpData({
          ...levelUpResult,
          childName: targetChild.name,
          celebration: getLevelUpCelebration(levelUpResult.newLevel),
          privileges: levelUpResult.newPrivileges
        });
        setShowLevelUpAnimation(true);
      }
    }
    
    setPreviousXP(currentXP);
  }, [targetChild, previousXP]);

  // Calculate XP needed for next level
  const getXPToNextLevel = useCallback(() => {
    if (!levelInfo) return 0;
    return levelInfo.xpToNext - levelInfo.currentXP;
  }, [levelInfo]);

  // Calculate level progress percentage
  const getLevelProgress = useCallback(() => {
    if (!levelInfo) return 0;
    return levelInfo.progress;
  }, [levelInfo]);

  // Check if user has specific privilege
  const hasPrivilege = useCallback((privilege) => {
    if (!levelInfo) return false;
    return levelInfo.privileges.includes(privilege);
  }, [levelInfo]);

  // Get all available privileges at current level
  const getAvailablePrivileges = useCallback(() => {
    if (!levelInfo) return [];
    return levelInfo.privileges;
  }, [levelInfo]);

  // Get next privilege unlock information
  const getNextPrivilegeUnlock = useCallback(() => {
    if (!levelInfo) return null;
    return getNextPrivilege(levelInfo.level);
  }, [levelInfo]);

  // Calculate XP multiplier based on level
  const getXPMultiplier = useCallback(() => {
    if (!levelInfo) return 1.0;
    
    // Higher levels get slight XP bonuses
    if (levelInfo.level >= 15) return 1.3;
    if (levelInfo.level >= 10) return 1.2;
    if (levelInfo.level >= 5) return 1.1;
    return 1.0;
  }, [levelInfo]);

  // Dismiss level up animation
  const dismissLevelUp = useCallback(() => {
    setShowLevelUpAnimation(false);
    setLevelUpData(null);
  }, []);

  // Get level statistics for all children
  const getFamilyLevelStats = useCallback(() => {
    if (childProfiles.length === 0) return null;

    const stats = {
      totalChildren: childProfiles.length,
      averageLevel: 0,
      highestLevel: 0,
      lowestLevel: Infinity,
      levelDistribution: {},
      totalFamilyXP: 0,
      levelLeader: null
    };

    let totalLevels = 0;

    childProfiles.forEach(child => {
      const xp = child.totalXP || child.xp || 0;
      const level = calculateLevelFromXP(xp);
      
      totalLevels += level;
      stats.totalFamilyXP += xp;
      
      if (level > stats.highestLevel) {
        stats.highestLevel = level;
        stats.levelLeader = child;
      }
      
      if (level < stats.lowestLevel) {
        stats.lowestLevel = level;
      }
      
      stats.levelDistribution[level] = (stats.levelDistribution[level] || 0) + 1;
    });

    stats.averageLevel = totalLevels / childProfiles.length;
    if (stats.lowestLevel === Infinity) stats.lowestLevel = 1;

    return stats;
  }, [childProfiles]);

  // Get level comparison with siblings
  const getLevelComparison = useCallback(() => {
    if (!targetChild || childProfiles.length <= 1) return null;

    const currentChildLevel = calculateLevelFromXP(targetChild.totalXP || targetChild.xp || 0);
    const siblings = childProfiles.filter(child => child.id !== targetChild.id);
    
    const comparison = {
      currentLevel: currentChildLevel,
      higherThan: 0,
      equalTo: 0,
      lowerThan: 0,
      rank: 1,
      totalSiblings: siblings.length
    };

    siblings.forEach(sibling => {
      const siblingLevel = calculateLevelFromXP(sibling.totalXP || sibling.xp || 0);
      
      if (currentChildLevel > siblingLevel) {
        comparison.higherThan++;
      } else if (currentChildLevel === siblingLevel) {
        comparison.equalTo++;
      } else {
        comparison.lowerThan++;
        comparison.rank++;
      }
    });

    return comparison;
  }, [targetChild, childProfiles]);

  // Get level milestone information
  const getLevelMilestones = useCallback(() => {
    if (!levelInfo) return [];

    const milestones = [];
    const privilegeLevels = Object.keys(XPConfig.LEVEL_PRIVILEGES)
      .map(Number)
      .sort((a, b) => a - b);

    privilegeLevels.forEach(level => {
      const isUnlocked = levelInfo.level >= level;
      const privileges = XPConfig.LEVEL_PRIVILEGES[level];
      
      milestones.push({
        level,
        isUnlocked,
        privileges,
        levelData: XPConfig.LEVEL_DEFINITIONS[level - 1]
      });
    });

    return milestones;
  }, [levelInfo]);

  // Predict level from potential XP gain
  const predictLevelFromXP = useCallback((additionalXP) => {
    if (!targetChild) return null;
    
    const currentXP = targetChild.totalXP || targetChild.xp || 0;
    const projectedXP = currentXP + additionalXP;
    const projectedLevel = calculateLevelFromXP(projectedXP);
    const projectedDetails = getLevelDetails(projectedXP);
    
    return {
      currentLevel: levelInfo?.level || 1,
      projectedLevel,
      levelsGained: projectedLevel - (levelInfo?.level || 1),
      projectedDetails,
      willLevelUp: projectedLevel > (levelInfo?.level || 1)
    };
  }, [targetChild, levelInfo]);

  // Get level requirements for specific level
  const getLevelRequirements = useCallback((targetLevel) => {
    if (!levelInfo) return null;
    
    const currentXP = targetChild?.totalXP || targetChild?.xp || 0;
    const requiredXP = XPConfig.LEVEL_DEFINITIONS[targetLevel - 1] 
      ? getLevelDetails(0).xpNeededForNext * targetLevel
      : 0;
    
    return {
      targetLevel,
      currentXP,
      requiredXP,
      remainingXP: Math.max(0, requiredXP - currentXP),
      canAchieve: targetLevel <= XPConfig.LEVEL_CONFIG.MAX_LEVEL,
      estimatedDays: Math.ceil((requiredXP - currentXP) / 50), // Assuming 50 XP per day average
      privileges: XPConfig.LEVEL_PRIVILEGES[targetLevel] || []
    };
  }, [targetChild, levelInfo]);

  return {
    // Current level information
    levelInfo,
    currentLevel: levelInfo?.level || 1,
    currentXP: targetChild?.totalXP || targetChild?.xp || 0,
    
    // Progress tracking
    xpToNextLevel: getXPToNextLevel(),
    levelProgress: getLevelProgress(),
    
    // Level up detection
    showLevelUpAnimation,
    levelUpData,
    dismissLevelUp,
    
    // Privilege system
    hasPrivilege,
    getAvailablePrivileges,
    getNextPrivilegeUnlock,
    
    // Level calculations
    getXPMultiplier,
    predictLevelFromXP,
    getLevelRequirements,
    
    // Family statistics
    getFamilyLevelStats,
    getLevelComparison,
    getLevelMilestones,
    
    // Configuration
    maxLevel: XPConfig.LEVEL_CONFIG.MAX_LEVEL,
    levelDefinitions: XPConfig.LEVEL_DEFINITIONS,
    privilegeSystem: XPConfig.LEVEL_PRIVILEGES,
    
    // Utility
    isMaxLevel: levelInfo?.isMaxLevel || false,
    targetChild,
    
    // Methods for level management
    calculateLevel: calculateLevelFromXP,
    getLevelDetails: (xp) => getLevelDetails(xp),
    checkLevelUp: (oldXP, newXP) => checkLevelUp(oldXP, newXP)
  };
};

export default useLevel;