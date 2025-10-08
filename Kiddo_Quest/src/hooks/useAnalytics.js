import { useState, useEffect, useCallback, useMemo } from 'react';
import useKiddoQuestStore from '../store';
import { 
  AnalyticsReport,
  generateAnalyticsReport,
  calculateQuestMetrics,
  calculateXPMetrics,
  calculateStreakMetrics,
  generateInsights,
  generateRecommendations,
  generateComprehensiveReport,
  AnalyticsConfig 
} from '../utils/analyticsEngine';
import { collection, query, where, orderBy, limit, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Custom hook for analytics management
 * Provides analytics data fetching, caching, report generation, filtering, and real-time metrics
 */
const useAnalytics = (childId = null, reportType = 'weekly') => {
  const { 
    currentUser,
    childProfiles, 
    selectedChildIdForDashboard,
    quests,
    questCompletions,
    rewards 
  } = useKiddoQuestStore();

  // State management
  const [reports, setReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [metrics, setMetrics] = useState({});
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [cachedData, setCachedData] = useState({});

  // Determine target child or family-wide analytics
  const targetChildId = childId || selectedChildIdForDashboard;
  const targetChild = childProfiles.find(child => child.id === targetChildId);
  const isFamily = !targetChildId;

  // Real-time analytics data listener
  useEffect(() => {
    if (!currentUser?.uid) return;

    setLoading(true);
    
    // Listen to quest completions for real-time metrics
    const completionsQuery = query(
      collection(db, 'questCompletions'),
      where('parentId', '==', currentUser.uid),
      orderBy('completedAt', 'desc'),
      limit(1000)
    );

    const unsubscribe = onSnapshot(completionsQuery, (snapshot) => {
      const completions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter for target child if specified
      const filteredCompletions = targetChildId 
        ? completions.filter(c => c.childId === targetChildId)
        : completions;

      updateMetrics(filteredCompletions);
      setLastUpdated(new Date());
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid, targetChildId]);

  // Listen to stored analytics reports
  useEffect(() => {
    if (!currentUser?.uid) return;

    const reportsQuery = query(
      collection(db, 'analyticsReports'),
      where('familyId', '==', currentUser.uid),
      where('userId', '==', targetChildId || null),
      orderBy('generatedAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
      const reportData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const parsedReports = reportData.map(data => AnalyticsReport.fromFirestore(data));
      setReports(parsedReports);
    });

    return () => unsubscribe();
  }, [currentUser?.uid, targetChildId]);

  // Calculate and update metrics
  const updateMetrics = useCallback((completions) => {
    const dateRange = getDateRange(reportType);
    
    // Calculate metrics
    const questMetrics = calculateQuestMetrics(completions, dateRange);
    const xpEvents = generateXPEvents(completions);
    const xpMetrics = calculateXPMetrics(xpEvents, dateRange);
    
    // Calculate streak metrics (simplified)
    const streakData = targetChild ? [{
      isActive: targetChild.activeStreak > 0,
      longestStreak: targetChild.longestStreak || 0,
      streakStartDate: new Date() // Simplified
    }] : [];
    const streakMetrics = calculateStreakMetrics(streakData, dateRange);

    const newMetrics = {
      quests: questMetrics,
      xp: xpMetrics,
      streaks: streakMetrics,
      lastCalculated: new Date()
    };

    setMetrics(newMetrics);
    
    // Generate insights and recommendations
    const newInsights = generateInsights(newMetrics);
    const newRecommendations = generateRecommendations(newMetrics, targetChild);
    
    setInsights(newInsights);
    setRecommendations(newRecommendations);

    // Cache the data
    setCachedData(prev => ({
      ...prev,
      [targetChildId || 'family']: {
        metrics: newMetrics,
        insights: newInsights,
        recommendations: newRecommendations,
        timestamp: new Date()
      }
    }));
  }, [reportType, targetChild, targetChildId]);

  // Generate XP events from quest completions
  const generateXPEvents = useCallback((completions) => {
    return completions.map(completion => ({
      timestamp: completion.completedAt,
      xpGained: completion.xp || 0,
      source: 'quest',
      questId: completion.questId
    }));
  }, []);

  // Get date range for report type
  const getDateRange = useCallback((type) => {
    const endDate = new Date();
    const startDate = new Date();

    switch (type) {
      case 'daily':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    return { startDate, endDate };
  }, []);

  // Generate a new report
  const generateReport = useCallback(async (customReportType = reportType, customRange = null) => {
    if (!currentUser?.uid) return null;

    setLoading(true);
    
    try {
      const familyData = {
        familyId: currentUser.uid,
        completions: questCompletions,
        xpEvents: generateXPEvents(questCompletions),
        streaks: targetChild ? [{
          isActive: targetChild.activeStreak > 0,
          longestStreak: targetChild.longestStreak || 0
        }] : [],
        userProfile: targetChild
      };

      const report = generateComprehensiveReport(familyData, customReportType);
      
      // Save report to Firestore
      const reportRef = doc(collection(db, 'analyticsReports'));
      await setDoc(reportRef, {
        ...report.toFirestore(),
        id: reportRef.id
      });

      setCurrentReport(report);
      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, reportType, questCompletions, targetChild, generateXPEvents]);

  // Get metrics for specific date range
  const getMetricsForRange = useCallback((startDate, endDate) => {
    const relevantCompletions = questCompletions.filter(completion => {
      const completionDate = completion.completedAt?.toDate?.() || new Date(completion.completedAt);
      return completionDate >= startDate && completionDate <= endDate;
    });

    const targetCompletions = targetChildId 
      ? relevantCompletions.filter(c => c.childId === targetChildId)
      : relevantCompletions;

    const dateRange = { startDate, endDate };
    
    return {
      quests: calculateQuestMetrics(targetCompletions, dateRange),
      xp: calculateXPMetrics(generateXPEvents(targetCompletions), dateRange),
      streaks: calculateStreakMetrics([], dateRange), // Simplified
      dateRange
    };
  }, [questCompletions, targetChildId, generateXPEvents]);

  // Compare metrics between periods
  const compareMetrics = useCallback((period1, period2) => {
    const metrics1 = getMetricsForRange(period1.startDate, period1.endDate);
    const metrics2 = getMetricsForRange(period2.startDate, period2.endDate);

    return {
      questCompletion: {
        current: metrics1.quests.totalCompleted,
        previous: metrics2.quests.totalCompleted,
        change: metrics1.quests.totalCompleted - metrics2.quests.totalCompleted,
        percentChange: metrics2.quests.totalCompleted > 0 
          ? ((metrics1.quests.totalCompleted - metrics2.quests.totalCompleted) / metrics2.quests.totalCompleted) * 100
          : 0
      },
      xpEarned: {
        current: metrics1.xp.totalXP,
        previous: metrics2.xp.totalXP,
        change: metrics1.xp.totalXP - metrics2.xp.totalXP,
        percentChange: metrics2.xp.totalXP > 0 
          ? ((metrics1.xp.totalXP - metrics2.xp.totalXP) / metrics2.xp.totalXP) * 100
          : 0
      },
      averagePerDay: {
        current: metrics1.quests.averagePerDay,
        previous: metrics2.quests.averagePerDay,
        change: metrics1.quests.averagePerDay - metrics2.quests.averagePerDay,
        percentChange: metrics2.quests.averagePerDay > 0 
          ? ((metrics1.quests.averagePerDay - metrics2.quests.averagePerDay) / metrics2.quests.averagePerDay) * 100
          : 0
      }
    };
  }, [getMetricsForRange]);

  // Get trend data for charts
  const getTrendData = useCallback((days = 7, metric = 'questCompletion') => {
    const trendData = [];
    const endDate = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayMetrics = getMetricsForRange(date, nextDate);
      
      let value = 0;
      switch (metric) {
        case 'questCompletion':
          value = dayMetrics.quests.totalCompleted;
          break;
        case 'xpEarned':
          value = dayMetrics.xp.totalXP;
          break;
        case 'averagePerDay':
          value = dayMetrics.quests.averagePerDay;
          break;
      }
      
      trendData.push({
        date: date.toISOString().split('T')[0],
        value,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    
    return trendData;
  }, [getMetricsForRange]);

  // Get performance insights
  const getPerformanceInsights = useCallback(() => {
    if (!metrics.quests) return [];

    const performanceInsights = [];
    const { quests: questMetrics, xp: xpMetrics } = metrics;

    // Quest completion insights
    if (questMetrics.averagePerDay >= 2) {
      performanceInsights.push({
        type: 'positive',
        title: 'High Activity',
        message: `Excellent! Completing ${questMetrics.averagePerDay.toFixed(1)} quests per day.`,
        icon: '🚀'
      });
    } else if (questMetrics.averagePerDay < 0.5) {
      performanceInsights.push({
        type: 'warning',
        title: 'Low Activity',
        message: 'Consider setting easier goals or providing more motivation.',
        icon: '⚠️'
      });
    }

    // XP insights
    if (xpMetrics.totalXP > 500) {
      performanceInsights.push({
        type: 'achievement',
        title: 'XP Milestone',
        message: `Great progress! Earned ${xpMetrics.totalXP} XP this period.`,
        icon: '⭐'
      });
    }

    return performanceInsights;
  }, [metrics]);

  // Get family comparison (if multiple children)
  const getFamilyComparison = useCallback(() => {
    if (isFamily || childProfiles.length <= 1) return null;

    const comparison = childProfiles.map(child => {
      const childCompletions = questCompletions.filter(c => c.childId === child.id);
      const dateRange = getDateRange(reportType);
      const childMetrics = calculateQuestMetrics(childCompletions, dateRange);
      
      return {
        childId: child.id,
        name: child.name,
        avatar: child.avatar,
        questsCompleted: childMetrics.totalCompleted,
        averagePerDay: childMetrics.averagePerDay,
        totalXP: child.totalXP || child.xp || 0
      };
    });

    // Sort by performance
    return comparison.sort((a, b) => b.questsCompleted - a.questsCompleted);
  }, [isFamily, childProfiles, questCompletions, reportType, getDateRange]);

  // Export data
  const exportData = useCallback((format = 'json') => {
    const exportData = {
      metrics,
      insights,
      recommendations,
      reports: reports.slice(0, 5), // Last 5 reports
      generatedAt: new Date(),
      child: targetChild ? {
        id: targetChild.id,
        name: targetChild.name
      } : null
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    }
    
    // CSV format for basic metrics
    if (format === 'csv') {
      const csvData = [
        ['Metric', 'Value'],
        ['Quests Completed', metrics.quests?.totalCompleted || 0],
        ['Total XP', metrics.xp?.totalXP || 0],
        ['Average Quests/Day', metrics.quests?.averagePerDay || 0],
        ['Completion Rate', metrics.quests?.completionRate || 0]
      ];
      
      return csvData.map(row => row.join(',')).join('\n');
    }
    
    return exportData;
  }, [metrics, insights, recommendations, reports, targetChild]);

  // Memoized computed values
  const computedMetrics = useMemo(() => ({
    totalQuestsCompleted: metrics.quests?.totalCompleted || 0,
    totalXPEarned: metrics.xp?.totalXP || 0,
    averageQuestsPerDay: metrics.quests?.averagePerDay || 0,
    currentStreak: targetChild?.activeStreak || 0,
    completionRate: metrics.quests?.completionRate || 0
  }), [metrics, targetChild]);

  const dashboardSummary = useMemo(() => ({
    questsThisWeek: computedMetrics.totalQuestsCompleted,
    xpThisWeek: computedMetrics.totalXPEarned,
    currentStreak: computedMetrics.currentStreak,
    topInsight: insights[0] || null,
    topRecommendation: recommendations[0] || null,
    isImproving: metrics.quests?.averagePerDay > 1
  }), [computedMetrics, insights, recommendations, metrics]);

  return {
    // Core data
    metrics,
    insights,
    recommendations,
    reports,
    currentReport,
    
    // Computed metrics
    computedMetrics,
    dashboardSummary,
    
    // Analysis functions
    generateReport,
    getMetricsForRange,
    compareMetrics,
    getTrendData,
    getPerformanceInsights,
    getFamilyComparison,
    
    // Data management
    exportData,
    lastUpdated,
    loading,
    
    // Real-time updates
    forceRefresh: () => updateMetrics(questCompletions),
    
    // Configuration
    reportTypes: AnalyticsConfig.ANALYTICS_CONFIG.REPORT_TYPES,
    metrics: AnalyticsConfig.ANALYTICS_CONFIG.METRICS,
    
    // State
    isFamily,
    targetChild,
    cachedData,
    
    // Utility functions
    AnalyticsReport,
    generateAnalyticsReport: (familyId, userId, type, range) => 
      generateAnalyticsReport(familyId, userId, type, range)
  };
};

export default useAnalytics;