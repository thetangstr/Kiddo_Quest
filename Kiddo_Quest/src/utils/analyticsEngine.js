// Analytics engine and report model for KiddoQuest insights system

import { serverTimestamp } from 'firebase/firestore';

// Analytics configuration
const ANALYTICS_CONFIG = {
  REPORT_TYPES: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    CUSTOM: 'custom'
  },
  METRICS: {
    QUEST_COMPLETION: 'quest_completion',
    XP_EARNED: 'xp_earned',
    STREAK_PERFORMANCE: 'streak_performance',
    BADGE_PROGRESS: 'badge_progress',
    LEVEL_PROGRESSION: 'level_progression',
    FAMILY_PARTICIPATION: 'family_participation',
    REWARD_REDEMPTION: 'reward_redemption'
  },
  INSIGHT_TYPES: {
    TREND: 'trend',
    ACHIEVEMENT: 'achievement',
    RECOMMENDATION: 'recommendation',
    WARNING: 'warning',
    CELEBRATION: 'celebration'
  },
  AGGREGATION_PERIODS: {
    HOUR: 'hour',
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    QUARTER: 'quarter',
    YEAR: 'year'
  }
};

// Analytics report model class
export class AnalyticsReport {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.familyId = data.familyId;
    this.userId = data.userId || null; // null for family-wide reports
    this.type = data.type || ANALYTICS_CONFIG.REPORT_TYPES.WEEKLY;
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.metrics = data.metrics || {};
    this.insights = data.insights || [];
    this.trends = data.trends || {};
    this.comparisons = data.comparisons || {};
    this.recommendations = data.recommendations || [];
    this.generatedAt = data.generatedAt || serverTimestamp();
    this.version = data.version || '1.0';
  }

  generateId() {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Add metric data
  addMetric(metricType, value, metadata = {}) {
    if (!this.metrics[metricType]) {
      this.metrics[metricType] = [];
    }
    
    this.metrics[metricType].push({
      value,
      timestamp: new Date(),
      metadata
    });
  }

  // Add insight
  addInsight(type, title, description, data = {}) {
    this.insights.push({
      type,
      title,
      description,
      data,
      timestamp: new Date(),
      priority: this.calculateInsightPriority(type, data)
    });
  }

  // Calculate insight priority
  calculateInsightPriority(type, data) {
    switch (type) {
      case ANALYTICS_CONFIG.INSIGHT_TYPES.WARNING:
        return 1; // Highest priority
      case ANALYTICS_CONFIG.INSIGHT_TYPES.ACHIEVEMENT:
        return 2;
      case ANALYTICS_CONFIG.INSIGHT_TYPES.CELEBRATION:
        return 2;
      case ANALYTICS_CONFIG.INSIGHT_TYPES.RECOMMENDATION:
        return 3;
      case ANALYTICS_CONFIG.INSIGHT_TYPES.TREND:
        return 4; // Lowest priority
      default:
        return 3;
    }
  }

  // Add trend analysis
  addTrend(metric, direction, magnitude, confidence = 'medium') {
    this.trends[metric] = {
      direction, // 'up', 'down', 'stable'
      magnitude, // percentage change
      confidence, // 'low', 'medium', 'high'
      timestamp: new Date()
    };
  }

  // Add comparison data
  addComparison(metric, currentValue, previousValue, percentChange) {
    this.comparisons[metric] = {
      current: currentValue,
      previous: previousValue,
      change: percentChange,
      improved: percentChange > 0
    };
  }

  // Add recommendation
  addRecommendation(title, description, actionType, priority = 'medium') {
    this.recommendations.push({
      title,
      description,
      actionType,
      priority,
      timestamp: new Date()
    });
  }

  // Get high priority insights
  getHighPriorityInsights() {
    return this.insights
      .filter(insight => insight.priority <= 2)
      .sort((a, b) => a.priority - b.priority);
  }

  // Get positive trends
  getPositiveTrends() {
    return Object.entries(this.trends)
      .filter(([_, trend]) => trend.direction === 'up')
      .map(([metric, trend]) => ({ metric, ...trend }));
  }

  // Get concerning trends
  getConcerningTrends() {
    return Object.entries(this.trends)
      .filter(([_, trend]) => trend.direction === 'down' && trend.magnitude > 10)
      .map(([metric, trend]) => ({ metric, ...trend }));
  }

  // Convert to Firebase document
  toFirestore() {
    return {
      id: this.id,
      familyId: this.familyId,
      userId: this.userId,
      type: this.type,
      startDate: this.startDate,
      endDate: this.endDate,
      metrics: this.metrics,
      insights: this.insights,
      trends: this.trends,
      comparisons: this.comparisons,
      recommendations: this.recommendations,
      generatedAt: this.generatedAt,
      version: this.version
    };
  }

  // Create from Firebase document
  static fromFirestore(data) {
    return new AnalyticsReport(data);
  }

  // Validate report data
  static validate(data) {
    const errors = [];
    
    if (!data.familyId) errors.push('Family ID is required');
    if (!data.type || !Object.values(ANALYTICS_CONFIG.REPORT_TYPES).includes(data.type)) {
      errors.push('Valid report type is required');
    }
    if (!data.startDate) errors.push('Start date is required');
    if (!data.endDate) errors.push('End date is required');
    if (data.startDate && data.endDate && new Date(data.startDate) > new Date(data.endDate)) {
      errors.push('Start date must be before end date');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    return {
      id: this.id,
      familyId: this.familyId,
      userId: this.userId,
      type: this.type,
      startDate: this.startDate,
      endDate: this.endDate,
      metrics: this.metrics,
      insights: this.insights,
      trends: this.trends,
      comparisons: this.comparisons,
      recommendations: this.recommendations,
      highPriorityInsights: this.getHighPriorityInsights(),
      positiveTrends: this.getPositiveTrends(),
      concerningTrends: this.getConcerningTrends(),
      generatedAt: this.generatedAt,
      version: this.version
    };
  }
}

// Generate analytics report
export const generateAnalyticsReport = async (familyId, userId = null, reportType = 'weekly', customRange = null) => {
  const { startDate, endDate } = getDateRange(reportType, customRange);
  const report = new AnalyticsReport({
    familyId,
    userId,
    type: reportType,
    startDate,
    endDate
  });

  // This would typically fetch data from Firestore
  // For now, we'll return the empty report structure
  return report;
};

// Calculate quest completion metrics
export const calculateQuestMetrics = (completions, dateRange) => {
  const { startDate, endDate } = dateRange;
  const relevantCompletions = completions.filter(completion => {
    const completionDate = completion.completedAt.toDate ? 
      completion.completedAt.toDate() : 
      new Date(completion.completedAt);
    return completionDate >= startDate && completionDate <= endDate;
  });

  const totalCompleted = relevantCompletions.length;
  const uniqueQuests = new Set(relevantCompletions.map(c => c.questId)).size;
  const difficultyBreakdown = relevantCompletions.reduce((acc, completion) => {
    const difficulty = completion.difficulty || 'easy';
    acc[difficulty] = (acc[difficulty] || 0) + 1;
    return acc;
  }, {});

  const dailyCompletions = groupByDay(relevantCompletions, dateRange);
  const averagePerDay = totalCompleted / Math.max(1, getDaysBetween(startDate, endDate));

  return {
    totalCompleted,
    uniqueQuests,
    difficultyBreakdown,
    dailyCompletions,
    averagePerDay,
    completionRate: calculateCompletionRate(relevantCompletions, dateRange)
  };
};

// Calculate XP metrics
export const calculateXPMetrics = (xpEvents, dateRange) => {
  const { startDate, endDate } = dateRange;
  const relevantEvents = xpEvents.filter(event => {
    const eventDate = event.timestamp.toDate ? 
      event.timestamp.toDate() : 
      new Date(event.timestamp);
    return eventDate >= startDate && eventDate <= endDate;
  });

  const totalXP = relevantEvents.reduce((sum, event) => sum + event.xpGained, 0);
  const dailyXP = groupByDay(relevantEvents, dateRange, 'xpGained');
  const averagePerDay = totalXP / Math.max(1, getDaysBetween(startDate, endDate));
  const xpSources = relevantEvents.reduce((acc, event) => {
    const source = event.source || 'quest';
    acc[source] = (acc[source] || 0) + event.xpGained;
    return acc;
  }, {});

  return {
    totalXP,
    dailyXP,
    averagePerDay,
    xpSources,
    peakDay: findPeakDay(dailyXP)
  };
};

// Calculate streak performance
export const calculateStreakMetrics = (streaks, dateRange) => {
  const activeStreaks = streaks.filter(s => s.isActive);
  const longestStreak = Math.max(...streaks.map(s => s.longestStreak), 0);
  const averageStreakLength = streaks.length > 0 ? 
    streaks.reduce((sum, s) => sum + s.longestStreak, 0) / streaks.length : 0;

  const streakBreaks = streaks.filter(s => !s.isActive && s.longestStreak > 0).length;
  const totalStreaksStarted = streaks.filter(s => s.streakStartDate).length;

  return {
    activeStreaks: activeStreaks.length,
    longestStreak,
    averageStreakLength,
    streakBreaks,
    totalStreaksStarted,
    streakSuccessRate: totalStreaksStarted > 0 ? 
      (totalStreaksStarted - streakBreaks) / totalStreaksStarted * 100 : 0
  };
};

// Generate insights from metrics
export const generateInsights = (metrics, previousMetrics = null) => {
  const insights = [];

  // Quest completion insights
  if (metrics.quests) {
    if (metrics.quests.totalCompleted === 0) {
      insights.push({
        type: ANALYTICS_CONFIG.INSIGHT_TYPES.WARNING,
        title: 'No Quests Completed',
        description: 'No quests were completed during this period. Consider setting easier goals or providing more motivation.',
        data: { metric: 'quest_completion', value: 0 }
      });
    } else if (metrics.quests.averagePerDay >= 2) {
      insights.push({
        type: ANALYTICS_CONFIG.INSIGHT_TYPES.ACHIEVEMENT,
        title: 'High Quest Activity',
        description: `Excellent work! Completing an average of ${metrics.quests.averagePerDay.toFixed(1)} quests per day.`,
        data: { metric: 'quest_completion', value: metrics.quests.averagePerDay }
      });
    }

    // Previous period comparison
    if (previousMetrics?.quests) {
      const improvement = ((metrics.quests.totalCompleted - previousMetrics.quests.totalCompleted) / 
        Math.max(1, previousMetrics.quests.totalCompleted)) * 100;
      
      if (improvement > 20) {
        insights.push({
          type: ANALYTICS_CONFIG.INSIGHT_TYPES.CELEBRATION,
          title: 'Quest Completion Improving',
          description: `Quest completions increased by ${improvement.toFixed(1)}% compared to the previous period!`,
          data: { metric: 'quest_improvement', value: improvement }
        });
      } else if (improvement < -20) {
        insights.push({
          type: ANALYTICS_CONFIG.INSIGHT_TYPES.WARNING,
          title: 'Quest Completion Declining',
          description: `Quest completions decreased by ${Math.abs(improvement).toFixed(1)}% compared to the previous period.`,
          data: { metric: 'quest_decline', value: improvement }
        });
      }
    }
  }

  // XP insights
  if (metrics.xp) {
    if (metrics.xp.totalXP > 1000) {
      insights.push({
        type: ANALYTICS_CONFIG.INSIGHT_TYPES.ACHIEVEMENT,
        title: 'XP Milestone Reached',
        description: `Earned ${metrics.xp.totalXP} XP this period - great progress!`,
        data: { metric: 'xp_earned', value: metrics.xp.totalXP }
      });
    }

    // Check for XP source diversity
    const sources = Object.keys(metrics.xp.xpSources);
    if (sources.length === 1) {
      insights.push({
        type: ANALYTICS_CONFIG.INSIGHT_TYPES.RECOMMENDATION,
        title: 'Diversify XP Sources',
        description: 'Try different types of activities to earn XP from multiple sources.',
        data: { metric: 'xp_diversity', sources }
      });
    }
  }

  // Streak insights
  if (metrics.streaks) {
    if (metrics.streaks.activeStreaks === 0 && metrics.streaks.streakBreaks > 0) {
      insights.push({
        type: ANALYTICS_CONFIG.INSIGHT_TYPES.WARNING,
        title: 'Streak Broken',
        description: 'Your quest streak was broken. Start a new one today to build momentum!',
        data: { metric: 'streak_broken' }
      });
    } else if (metrics.streaks.longestStreak >= 7) {
      insights.push({
        type: ANALYTICS_CONFIG.INSIGHT_TYPES.ACHIEVEMENT,
        title: 'Strong Streak Performance',
        description: `Achieved a ${metrics.streaks.longestStreak}-day streak - excellent consistency!`,
        data: { metric: 'streak_achievement', value: metrics.streaks.longestStreak }
      });
    }
  }

  return insights.sort((a, b) => a.priority - b.priority);
};

// Generate recommendations
export const generateRecommendations = (metrics, userProfile) => {
  const recommendations = [];

  // Quest completion recommendations
  if (metrics.quests?.averagePerDay < 1) {
    recommendations.push({
      title: 'Increase Quest Frequency',
      description: 'Try to complete at least one quest per day to build a consistent habit.',
      actionType: 'increase_quest_frequency',
      priority: 'high'
    });
  }

  // Difficulty recommendations
  if (metrics.quests?.difficultyBreakdown) {
    const easyQuests = metrics.quests.difficultyBreakdown.easy || 0;
    const totalQuests = metrics.quests.totalCompleted;
    
    if (easyQuests / totalQuests > 0.8) {
      recommendations.push({
        title: 'Try Harder Challenges',
        description: 'You\'re doing great with easy quests! Consider trying some medium or hard difficulty quests for more XP.',
        actionType: 'increase_difficulty',
        priority: 'medium'
      });
    }
  }

  // Streak recommendations
  if (metrics.streaks?.activeStreaks === 0) {
    recommendations.push({
      title: 'Start a New Streak',
      description: 'Begin a new quest streak today to earn streak bonuses and build momentum.',
      actionType: 'start_streak',
      priority: 'medium'
    });
  }

  // XP optimization recommendations
  if (metrics.xp?.averagePerDay < 100) {
    recommendations.push({
      title: 'Optimize XP Earning',
      description: 'Focus on harder quests and maintain streaks to earn more XP per day.',
      actionType: 'optimize_xp',
      priority: 'low'
    });
  }

  return recommendations;
};

// Helper functions
const getDateRange = (reportType, customRange = null) => {
  if (customRange) {
    return {
      startDate: new Date(customRange.startDate),
      endDate: new Date(customRange.endDate)
    };
  }

  const endDate = new Date();
  const startDate = new Date();

  switch (reportType) {
    case ANALYTICS_CONFIG.REPORT_TYPES.DAILY:
      startDate.setDate(endDate.getDate() - 1);
      break;
    case ANALYTICS_CONFIG.REPORT_TYPES.WEEKLY:
      startDate.setDate(endDate.getDate() - 7);
      break;
    case ANALYTICS_CONFIG.REPORT_TYPES.MONTHLY:
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 7);
  }

  return { startDate, endDate };
};

const groupByDay = (items, dateRange, valueField = null) => {
  const { startDate, endDate } = dateRange;
  const days = {};
  
  // Initialize all days in range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayKey = currentDate.toISOString().split('T')[0];
    days[dayKey] = valueField ? 0 : [];
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Group items by day
  items.forEach(item => {
    const itemDate = item.completedAt?.toDate?.() || item.timestamp?.toDate?.() || new Date(item.date);
    const dayKey = itemDate.toISOString().split('T')[0];
    
    if (days[dayKey] !== undefined) {
      if (valueField) {
        days[dayKey] += item[valueField] || 0;
      } else {
        days[dayKey].push(item);
      }
    }
  });
  
  return days;
};

const getDaysBetween = (startDate, endDate) => {
  const timeDiff = endDate.getTime() - startDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

const calculateCompletionRate = (completions, dateRange) => {
  // This would typically compare against assigned quests
  // For now, return a simple metric
  return completions.length > 0 ? 85 : 0; // Default 85% if any completions
};

const findPeakDay = (dailyData) => {
  let peakDay = null;
  let peakValue = 0;
  
  Object.entries(dailyData).forEach(([day, value]) => {
    const dayValue = Array.isArray(value) ? value.length : value;
    if (dayValue > peakValue) {
      peakValue = dayValue;
      peakDay = day;
    }
  });
  
  return { day: peakDay, value: peakValue };
};

// Export comprehensive analytics data
export const generateComprehensiveReport = (familyData, reportType = 'weekly') => {
  const dateRange = getDateRange(reportType);
  const report = new AnalyticsReport({
    familyId: familyData.familyId,
    type: reportType,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  });

  // Calculate all metrics
  const questMetrics = calculateQuestMetrics(familyData.completions || [], dateRange);
  const xpMetrics = calculateXPMetrics(familyData.xpEvents || [], dateRange);
  const streakMetrics = calculateStreakMetrics(familyData.streaks || [], dateRange);

  // Add metrics to report
  report.addMetric(ANALYTICS_CONFIG.METRICS.QUEST_COMPLETION, questMetrics);
  report.addMetric(ANALYTICS_CONFIG.METRICS.XP_EARNED, xpMetrics);
  report.addMetric(ANALYTICS_CONFIG.METRICS.STREAK_PERFORMANCE, streakMetrics);

  // Generate insights
  const allMetrics = { quests: questMetrics, xp: xpMetrics, streaks: streakMetrics };
  const insights = generateInsights(allMetrics);
  insights.forEach(insight => {
    report.addInsight(insight.type, insight.title, insight.description, insight.data);
  });

  // Generate recommendations
  const recommendations = generateRecommendations(allMetrics, familyData.userProfile);
  recommendations.forEach(rec => {
    report.addRecommendation(rec.title, rec.description, rec.actionType, rec.priority);
  });

  return report;
};

// Export configuration
export const AnalyticsConfig = {
  ANALYTICS_CONFIG
};

export default {
  AnalyticsReport,
  generateAnalyticsReport,
  calculateQuestMetrics,
  calculateXPMetrics,
  calculateStreakMetrics,
  generateInsights,
  generateRecommendations,
  generateComprehensiveReport,
  AnalyticsConfig
};