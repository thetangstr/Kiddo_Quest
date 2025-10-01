// Subscription Manager for Kiddo Quest
// Handles feature access based on subscription tier

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PREMIUM: 'premium'
};

// Feature definitions with their availability by tier
export const FEATURES = {
  // Child Profile Features
  CHILD_PROFILES: {
    id: 'child_profiles',
    name: 'Child Profiles',
    description: 'Add multiple child profiles to your account',
    limits: {
      [SUBSCRIPTION_TIERS.FREE]: {
        limit: 2,
        description: 'Up to 2 child profiles'
      },
      [SUBSCRIPTION_TIERS.PREMIUM]: {
        limit: null, // null means unlimited
        description: 'Unlimited child profiles'
      }
    }
  },
  
  // Quest Features
  QUESTS: {
    id: 'quests',
    name: 'Quests',
    description: 'Create and manage quests for your children',
    limits: {
      [SUBSCRIPTION_TIERS.FREE]: {
        limit: 10,
        description: 'Up to 10 active quests'
      },
      [SUBSCRIPTION_TIERS.PREMIUM]: {
        limit: null,
        description: 'Unlimited quests'
      }
    }
  },
  
  // Reward Features
  REWARDS: {
    id: 'rewards',
    name: 'Rewards',
    description: 'Create and manage rewards for your children',
    limits: {
      [SUBSCRIPTION_TIERS.FREE]: {
        limit: 5,
        description: 'Up to 5 active rewards'
      },
      [SUBSCRIPTION_TIERS.PREMIUM]: {
        limit: null,
        description: 'Unlimited rewards'
      }
    }
  },
  
  // Story Mode
  STORY_MODE: {
    id: 'story_mode',
    name: 'Story Mode',
    description: 'Create themed quest chains with narratives',
    limits: {
      [SUBSCRIPTION_TIERS.FREE]: {
        limit: 0,
        description: 'Not available'
      },
      [SUBSCRIPTION_TIERS.PREMIUM]: {
        limit: null,
        description: 'Full access to Story Mode'
      }
    }
  },
  
  // Skill Tracking
  SKILL_TRACKING: {
    id: 'skill_tracking',
    name: 'Skill Tracking',
    description: 'Track children\'s progress in different skill areas',
    limits: {
      [SUBSCRIPTION_TIERS.FREE]: {
        limit: 0,
        description: 'Not available'
      },
      [SUBSCRIPTION_TIERS.PREMIUM]: {
        limit: null,
        description: 'Full skill tracking and reporting'
      }
    }
  },
  
  // Child-Suggested Content
  CHILD_SUGGESTIONS: {
    id: 'child_suggestions',
    name: 'Child Suggestions',
    description: 'Allow children to suggest quests and rewards',
    limits: {
      [SUBSCRIPTION_TIERS.FREE]: {
        limit: 0,
        description: 'Not available'
      },
      [SUBSCRIPTION_TIERS.PREMIUM]: {
        limit: null,
        description: 'Enable child suggestions'
      }
    }
  },
  
  // Avatar Customization
  AVATAR_CUSTOMIZATION: {
    id: 'avatar_customization',
    name: 'Avatar Customization',
    description: 'Customize child avatars with different options',
    limits: {
      [SUBSCRIPTION_TIERS.FREE]: {
        limit: 1,
        description: 'Basic avatar options'
      },
      [SUBSCRIPTION_TIERS.PREMIUM]: {
        limit: null,
        description: 'Full avatar customization'
      }
    }
  },
  
  // Badges & Achievements
  BADGES: {
    id: 'badges',
    name: 'Badges & Achievements',
    description: 'Earn and collect badges for completing quests',
    limits: {
      [SUBSCRIPTION_TIERS.FREE]: {
        limit: 0,
        description: 'Not available'
      },
      [SUBSCRIPTION_TIERS.PREMIUM]: {
        limit: null,
        description: 'Full badges and achievements system'
      }
    }
  },
  
  // Mystery Rewards
  MYSTERY_REWARDS: {
    id: 'mystery_rewards',
    name: 'Mystery Rewards',
    description: 'Special rewards that are revealed when claimed',
    limits: {
      [SUBSCRIPTION_TIERS.FREE]: {
        limit: 0,
        description: 'Not available'
      },
      [SUBSCRIPTION_TIERS.PREMIUM]: {
        limit: null,
        description: 'Access to mystery rewards'
      }
    }
  }
};

/**
 * Check if a feature is available for the given subscription tier
 * @param {string} featureId - The ID of the feature to check
 * @param {string} tier - The subscription tier to check against
 * @param {number} currentCount - The current count of items (if applicable)
 * @returns {boolean} - Whether the feature is available
 */
export const isFeatureAvailable = (featureId, tier, currentCount = 0) => {
  const feature = FEATURES[featureId];
  if (!feature) return false;
  
  const tierLimit = feature.limits[tier];
  if (!tierLimit) return false;
  
  // If limit is null, the feature is unlimited
  if (tierLimit.limit === null) return true;
  
  // If limit is 0, the feature is not available
  if (tierLimit.limit === 0) return false;
  
  // Otherwise, check if current count is below the limit
  return currentCount < tierLimit.limit;
};

/**
 * Get the limit for a feature based on subscription tier
 * @param {string} featureId - The ID of the feature to check
 * @param {string} tier - The subscription tier to check against
 * @returns {number|null} - The limit for the feature (null means unlimited)
 */
export const getFeatureLimit = (featureId, tier) => {
  const feature = FEATURES[featureId];
  if (!feature) return 0;
  
  const tierLimit = feature.limits[tier];
  if (!tierLimit) return 0;
  
  return tierLimit.limit;
};

/**
 * Get all features available for a subscription tier
 * @param {string} tier - The subscription tier
 * @returns {Array} - Array of available features
 */
export const getAvailableFeatures = (tier) => {
  return Object.values(FEATURES).filter(feature => {
    const tierLimit = feature.limits[tier];
    return tierLimit && tierLimit.limit !== 0;
  });
};

/**
 * Get premium features that are not available in the free tier
 * @returns {Array} - Array of premium-only features
 */
export const getPremiumOnlyFeatures = () => {
  return Object.values(FEATURES).filter(feature => {
    const freeTierLimit = feature.limits[SUBSCRIPTION_TIERS.FREE];
    return freeTierLimit && freeTierLimit.limit === 0;
  });
};
