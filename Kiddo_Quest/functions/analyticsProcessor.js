const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onCall } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { logger } = require('firebase-functions');

// Initialize Firebase Admin
if (!process.env.FIREBASE_CONFIG) {
  initializeApp();
}
const db = getFirestore();

/**
 * Scheduled function to generate daily analytics reports
 * Runs every day at 3 AM UTC
 */
exports.generateDailyAnalytics = onSchedule('0 3 * * *', async (event) => {
  logger.info('Starting daily analytics generation');
  
  try {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    // Get all families to generate analytics for
    const familiesSnapshot = await db.collection('users')
      .where('role', '==', 'admin')
      .get();
    
    if (familiesSnapshot.empty) {
      logger.info('No families found for analytics generation');
      return;
    }
    
    let reportsGenerated = 0;
    
    for (const familyDoc of familiesSnapshot.docs) {
      const familyId = familyDoc.id;
      logger.info(`Generating analytics for family: ${familyId}`);
      
      try {
        await generateFamilyDailyReport(familyId, yesterday);
        reportsGenerated++;
      } catch (error) {
        logger.error(`Error generating analytics for family ${familyId}:`, error);
      }
    }
    
    logger.info(`Daily analytics generation completed. Generated ${reportsGenerated} reports.`);
    
    // Log the execution
    await db.collection('systemLogs').add({
      type: 'scheduled_analytics_generation',
      executedAt: FieldValue.serverTimestamp(),
      reportsGenerated: reportsGenerated,
      familiesProcessed: familiesSnapshot.size
    });
    
  } catch (error) {
    logger.error('Error in daily analytics generation:', error);
    throw error;
  }
});

/**
 * Scheduled function to generate weekly analytics reports
 * Runs every Sunday at 4 AM UTC
 */
exports.generateWeeklyAnalytics = onSchedule('0 4 * * 0', async (event) => {
  logger.info('Starting weekly analytics generation');
  
  try {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Get all families
    const familiesSnapshot = await db.collection('users')
      .where('role', '==', 'admin')
      .get();
    
    if (familiesSnapshot.empty) {
      logger.info('No families found for weekly analytics generation');
      return;
    }
    
    let reportsGenerated = 0;
    
    for (const familyDoc of familiesSnapshot.docs) {
      const familyId = familyDoc.id;
      logger.info(`Generating weekly analytics for family: ${familyId}`);
      
      try {
        await generateFamilyWeeklyReport(familyId, lastWeek, today);
        reportsGenerated++;
      } catch (error) {
        logger.error(`Error generating weekly analytics for family ${familyId}:`, error);
      }
    }
    
    logger.info(`Weekly analytics generation completed. Generated ${reportsGenerated} reports.`);
    
    // Log the execution
    await db.collection('systemLogs').add({
      type: 'scheduled_weekly_analytics_generation',
      executedAt: FieldValue.serverTimestamp(),
      reportsGenerated: reportsGenerated,
      familiesProcessed: familiesSnapshot.size
    });
    
  } catch (error) {
    logger.error('Error in weekly analytics generation:', error);
    throw error;
  }
});

/**
 * Real-time analytics calculation trigger for quest completions
 */
exports.updateAnalyticsOnQuestCompletion = onDocumentWritten('questCompletions/{completionId}', async (event) => {
  const change = event.data;
  
  if (!change.after.exists) {
    // Document was deleted, skip analytics update
    return;
  }
  
  const completion = change.after.data();
  const completionId = event.params.completionId;
  
  logger.info(`Updating real-time analytics for quest completion: ${completionId}`);
  
  try {
    await updateRealTimeAnalytics(completion, 'quest_completion');
    await updateChildStreaks(completion);
    await updateFamilyGoalProgress(completion);
  } catch (error) {
    logger.error(`Error updating real-time analytics for completion ${completionId}:`, error);
  }
});

/**
 * Real-time analytics calculation trigger for reward redemptions
 */
exports.updateAnalyticsOnRewardRedemption = onDocumentWritten('rewardRedemptions/{redemptionId}', async (event) => {
  const change = event.data;
  
  if (!change.after.exists) {
    return;
  }
  
  const redemption = change.after.data();
  const redemptionId = event.params.redemptionId;
  
  logger.info(`Updating real-time analytics for reward redemption: ${redemptionId}`);
  
  try {
    await updateRealTimeAnalytics(redemption, 'reward_redemption');
  } catch (error) {
    logger.error(`Error updating real-time analytics for redemption ${redemptionId}:`, error);
  }
});

/**
 * Generate daily analytics report for a family
 */
async function generateFamilyDailyReport(familyId, reportDate) {
  const startOfDay = new Date(reportDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(reportDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Get family's child profiles
  const childProfilesSnapshot = await db.collection('childProfiles')
    .where('parentId', '==', familyId)
    .get();
  
  const childIds = childProfilesSnapshot.docs.map(doc => doc.id);
  
  if (childIds.length === 0) {
    logger.info(`No children found for family ${familyId}`);
    return;
  }
  
  // Calculate daily metrics
  const metrics = await calculateDailyMetrics(familyId, childIds, startOfDay, endOfDay);
  
  // Generate insights
  const insights = generateDailyInsights(metrics);
  
  // Create the report
  const report = {
    familyId: familyId,
    reportType: 'daily',
    reportDate: reportDate,
    generatedAt: FieldValue.serverTimestamp(),
    metrics: metrics,
    insights: insights,
    childProfiles: childProfilesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      avatar: doc.data().avatar
    }))
  };
  
  // Save the report
  await db.collection('analyticsReports').add(report);
  
  logger.info(`Daily report generated for family ${familyId}`);
}

/**
 * Generate weekly analytics report for a family
 */
async function generateFamilyWeeklyReport(familyId, startDate, endDate) {
  // Get family's child profiles
  const childProfilesSnapshot = await db.collection('childProfiles')
    .where('parentId', '==', familyId)
    .get();
  
  const childIds = childProfilesSnapshot.docs.map(doc => doc.id);
  
  if (childIds.length === 0) {
    logger.info(`No children found for family ${familyId}`);
    return;
  }
  
  // Calculate weekly metrics
  const metrics = await calculateWeeklyMetrics(familyId, childIds, startDate, endDate);
  
  // Generate insights
  const insights = generateWeeklyInsights(metrics);
  
  // Create the report
  const report = {
    familyId: familyId,
    reportType: 'weekly',
    startDate: startDate,
    endDate: endDate,
    generatedAt: FieldValue.serverTimestamp(),
    metrics: metrics,
    insights: insights,
    childProfiles: childProfilesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      avatar: doc.data().avatar
    }))
  };
  
  // Save the report
  await db.collection('analyticsReports').add(report);
  
  logger.info(`Weekly report generated for family ${familyId}`);
}

/**
 * Calculate daily metrics for a family
 */
async function calculateDailyMetrics(familyId, childIds, startOfDay, endOfDay) {
  const metrics = {
    questsCompleted: 0,
    totalXPEarned: 0,
    rewardsRedeemed: 0,
    totalXPSpent: 0,
    averageCompletionTime: 0,
    mostActiveChild: null,
    popularQuestCategory: null,
    childMetrics: {}
  };
  
  // Quest completions for the day
  const completionsSnapshot = await db.collection('questCompletions')
    .where('childId', 'in', childIds)
    .where('completedAt', '>=', startOfDay)
    .where('completedAt', '<=', endOfDay)
    .get();
  
  let totalCompletionTime = 0;
  const categoryCount = {};
  const childCompletions = {};
  
  for (const doc of completionsSnapshot.docs) {
    const completion = doc.data();
    metrics.questsCompleted++;
    metrics.totalXPEarned += completion.xpEarned || 0;
    
    // Track completion time if available
    if (completion.timeToComplete) {
      totalCompletionTime += completion.timeToComplete;
    }
    
    // Track category popularity
    if (completion.questCategory) {
      categoryCount[completion.questCategory] = (categoryCount[completion.questCategory] || 0) + 1;
    }
    
    // Track child activity
    const childId = completion.childId;
    childCompletions[childId] = (childCompletions[childId] || 0) + 1;
    
    if (!metrics.childMetrics[childId]) {
      metrics.childMetrics[childId] = {
        questsCompleted: 0,
        xpEarned: 0,
        rewardsRedeemed: 0,
        xpSpent: 0
      };
    }
    
    metrics.childMetrics[childId].questsCompleted++;
    metrics.childMetrics[childId].xpEarned += completion.xpEarned || 0;
  }
  
  // Calculate average completion time
  if (metrics.questsCompleted > 0 && totalCompletionTime > 0) {
    metrics.averageCompletionTime = Math.round(totalCompletionTime / metrics.questsCompleted);
  }
  
  // Find most popular quest category
  if (Object.keys(categoryCount).length > 0) {
    metrics.popularQuestCategory = Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b
    );
  }
  
  // Find most active child
  if (Object.keys(childCompletions).length > 0) {
    metrics.mostActiveChild = Object.keys(childCompletions).reduce((a, b) => 
      childCompletions[a] > childCompletions[b] ? a : b
    );
  }
  
  // Reward redemptions for the day
  const redemptionsSnapshot = await db.collection('rewardRedemptions')
    .where('childId', 'in', childIds)
    .where('redeemedAt', '>=', startOfDay)
    .where('redeemedAt', '<=', endOfDay)
    .get();
  
  for (const doc of redemptionsSnapshot.docs) {
    const redemption = doc.data();
    metrics.rewardsRedeemed++;
    metrics.totalXPSpent += redemption.xpCost || 0;
    
    const childId = redemption.childId;
    if (metrics.childMetrics[childId]) {
      metrics.childMetrics[childId].rewardsRedeemed++;
      metrics.childMetrics[childId].xpSpent += redemption.xpCost || 0;
    }
  }
  
  return metrics;
}

/**
 * Calculate weekly metrics for a family
 */
async function calculateWeeklyMetrics(familyId, childIds, startDate, endDate) {
  const metrics = {
    questsCompleted: 0,
    totalXPEarned: 0,
    rewardsRedeemed: 0,
    totalXPSpent: 0,
    averageCompletionTime: 0,
    streaksCount: 0,
    longestStreak: 0,
    mostActiveChild: null,
    mostImprovedChild: null,
    popularQuestCategory: null,
    dailyBreakdown: [],
    childMetrics: {}
  };
  
  // Get weekly quest completions
  const completionsSnapshot = await db.collection('questCompletions')
    .where('childId', 'in', childIds)
    .where('completedAt', '>=', startDate)
    .where('completedAt', '<=', endDate)
    .get();
  
  let totalCompletionTime = 0;
  const categoryCount = {};
  const childCompletions = {};
  const dailyActivity = {};
  
  for (const doc of completionsSnapshot.docs) {
    const completion = doc.data();
    const completionDate = completion.completedAt.toDate().toDateString();
    
    metrics.questsCompleted++;
    metrics.totalXPEarned += completion.xpEarned || 0;
    
    if (completion.timeToComplete) {
      totalCompletionTime += completion.timeToComplete;
    }
    
    if (completion.questCategory) {
      categoryCount[completion.questCategory] = (categoryCount[completion.questCategory] || 0) + 1;
    }
    
    const childId = completion.childId;
    childCompletions[childId] = (childCompletions[childId] || 0) + 1;
    
    // Track daily activity
    if (!dailyActivity[completionDate]) {
      dailyActivity[completionDate] = { questsCompleted: 0, xpEarned: 0 };
    }
    dailyActivity[completionDate].questsCompleted++;
    dailyActivity[completionDate].xpEarned += completion.xpEarned || 0;
    
    if (!metrics.childMetrics[childId]) {
      metrics.childMetrics[childId] = {
        questsCompleted: 0,
        xpEarned: 0,
        rewardsRedeemed: 0,
        xpSpent: 0,
        improvement: 0
      };
    }
    
    metrics.childMetrics[childId].questsCompleted++;
    metrics.childMetrics[childId].xpEarned += completion.xpEarned || 0;
  }
  
  // Calculate average completion time
  if (metrics.questsCompleted > 0 && totalCompletionTime > 0) {
    metrics.averageCompletionTime = Math.round(totalCompletionTime / metrics.questsCompleted);
  }
  
  // Find most popular quest category
  if (Object.keys(categoryCount).length > 0) {
    metrics.popularQuestCategory = Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b
    );
  }
  
  // Find most active child
  if (Object.keys(childCompletions).length > 0) {
    metrics.mostActiveChild = Object.keys(childCompletions).reduce((a, b) => 
      childCompletions[a] > childCompletions[b] ? a : b
    );
  }
  
  // Create daily breakdown
  metrics.dailyBreakdown = Object.keys(dailyActivity).map(date => ({
    date: date,
    ...dailyActivity[date]
  })).sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Get weekly reward redemptions
  const redemptionsSnapshot = await db.collection('rewardRedemptions')
    .where('childId', 'in', childIds)
    .where('redeemedAt', '>=', startDate)
    .where('redeemedAt', '<=', endDate)
    .get();
  
  for (const doc of redemptionsSnapshot.docs) {
    const redemption = doc.data();
    metrics.rewardsRedeemed++;
    metrics.totalXPSpent += redemption.xpCost || 0;
    
    const childId = redemption.childId;
    if (metrics.childMetrics[childId]) {
      metrics.childMetrics[childId].rewardsRedeemed++;
      metrics.childMetrics[childId].xpSpent += redemption.xpCost || 0;
    }
  }
  
  // Calculate streaks
  const streaksSnapshot = await db.collection('streaks')
    .where('childId', 'in', childIds)
    .where('startDate', '>=', startDate)
    .where('startDate', '<=', endDate)
    .get();
  
  metrics.streaksCount = streaksSnapshot.size;
  
  for (const doc of streaksSnapshot.docs) {
    const streak = doc.data();
    if (streak.currentLength > metrics.longestStreak) {
      metrics.longestStreak = streak.currentLength;
    }
  }
  
  return metrics;
}

/**
 * Generate insights from daily metrics
 */
function generateDailyInsights(metrics) {
  const insights = [];
  
  if (metrics.questsCompleted === 0) {
    insights.push({
      type: 'low_activity',
      message: 'No quests were completed today. Consider encouraging your children to engage with their tasks.',
      priority: 'high'
    });
  } else if (metrics.questsCompleted >= 5) {
    insights.push({
      type: 'high_activity',
      message: `Great job! Your family completed ${metrics.questsCompleted} quests today.`,
      priority: 'positive'
    });
  }
  
  if (metrics.averageCompletionTime > 0) {
    const hours = Math.floor(metrics.averageCompletionTime / 60);
    const minutes = metrics.averageCompletionTime % 60;
    
    if (metrics.averageCompletionTime < 30) {
      insights.push({
        type: 'quick_completion',
        message: `Tasks are being completed quickly (avg ${minutes} min). Consider adding more challenging quests.`,
        priority: 'medium'
      });
    }
  }
  
  if (metrics.totalXPEarned > metrics.totalXPSpent * 3) {
    insights.push({
      type: 'xp_accumulation',
      message: 'Children are earning more XP than they\'re spending. Consider adding more attractive rewards.',
      priority: 'medium'
    });
  }
  
  return insights;
}

/**
 * Generate insights from weekly metrics
 */
function generateWeeklyInsights(metrics) {
  const insights = [];
  
  const averageQuestsPerDay = metrics.questsCompleted / 7;
  
  if (averageQuestsPerDay < 1) {
    insights.push({
      type: 'low_weekly_activity',
      message: 'Quest completion is below recommended levels. Consider adjusting difficulty or adding more engaging tasks.',
      priority: 'high'
    });
  } else if (averageQuestsPerDay >= 3) {
    insights.push({
      type: 'excellent_weekly_activity',
      message: `Outstanding week! Your family is averaging ${averageQuestsPerDay.toFixed(1)} quests per day.`,
      priority: 'positive'
    });
  }
  
  if (metrics.streaksCount > 0) {
    insights.push({
      type: 'streak_success',
      message: `${metrics.streaksCount} streaks were started this week! The longest streak is ${metrics.longestStreak} days.`,
      priority: 'positive'
    });
  }
  
  // Check for consistency
  const dailyVariance = calculateDailyVariance(metrics.dailyBreakdown);
  if (dailyVariance > 2) {
    insights.push({
      type: 'inconsistent_activity',
      message: 'Quest completion varies significantly day-to-day. Try establishing a more consistent routine.',
      priority: 'medium'
    });
  }
  
  return insights;
}

/**
 * Calculate variance in daily activity
 */
function calculateDailyVariance(dailyBreakdown) {
  if (dailyBreakdown.length === 0) return 0;
  
  const questCounts = dailyBreakdown.map(day => day.questsCompleted);
  const mean = questCounts.reduce((sum, count) => sum + count, 0) / questCounts.length;
  const variance = questCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / questCounts.length;
  
  return Math.sqrt(variance);
}

/**
 * Update real-time analytics
 */
async function updateRealTimeAnalytics(data, eventType) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const analyticsId = `${data.familyId || data.parentId}_${today.toISOString().split('T')[0]}`;
  
  const analyticsRef = db.collection('dailyAnalytics').doc(analyticsId);
  
  const updateData = {};
  
  if (eventType === 'quest_completion') {
    updateData.questsCompleted = FieldValue.increment(1);
    updateData.totalXPEarned = FieldValue.increment(data.xpEarned || 0);
    updateData.lastUpdated = FieldValue.serverTimestamp();
  } else if (eventType === 'reward_redemption') {
    updateData.rewardsRedeemed = FieldValue.increment(1);
    updateData.totalXPSpent = FieldValue.increment(data.xpCost || 0);
    updateData.lastUpdated = FieldValue.serverTimestamp();
  }
  
  await analyticsRef.set(updateData, { merge: true });
}

/**
 * Update child streaks based on quest completion
 */
async function updateChildStreaks(completion) {
  const childId = completion.childId;
  const completionDate = completion.completedAt.toDate();
  
  // Get or create daily streak for this child
  const streakRef = db.collection('streaks').doc(`${childId}_daily`);
  const streakDoc = await streakRef.get();
  
  if (streakDoc.exists) {
    const streak = streakDoc.data();
    const lastActivityDate = streak.lastActivityDate.toDate();
    
    // Check if this is the same day or consecutive day
    const daysDiff = Math.floor((completionDate - lastActivityDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      // Same day, just update last activity
      await streakRef.update({
        lastActivityDate: FieldValue.serverTimestamp()
      });
    } else if (daysDiff === 1) {
      // Consecutive day, increment streak
      await streakRef.update({
        currentLength: FieldValue.increment(1),
        lastActivityDate: FieldValue.serverTimestamp(),
        totalActiveDays: FieldValue.increment(1)
      });
    } else if (daysDiff > 1) {
      // Streak broken, reset
      await streakRef.update({
        currentLength: 1,
        lastActivityDate: FieldValue.serverTimestamp(),
        broken: true,
        brokenDate: FieldValue.serverTimestamp(),
        totalActiveDays: FieldValue.increment(1)
      });
    }
  } else {
    // Create new streak
    await streakRef.set({
      childId: childId,
      type: 'daily',
      currentLength: 1,
      startDate: FieldValue.serverTimestamp(),
      lastActivityDate: FieldValue.serverTimestamp(),
      totalActiveDays: 1,
      broken: false
    });
  }
}

/**
 * Update family goal progress
 */
async function updateFamilyGoalProgress(completion) {
  const familyId = completion.parentId || completion.familyId;
  
  if (!familyId) return;
  
  // Get active family goals
  const goalsSnapshot = await db.collection('familyGoals')
    .where('familyId', '==', familyId)
    .where('status', '==', 'active')
    .get();
  
  for (const goalDoc of goalsSnapshot.docs) {
    const goal = goalDoc.data();
    
    // Check if this completion contributes to the goal
    let contributes = false;
    let contributionValue = 0;
    
    switch (goal.type) {
      case 'total_quests':
        contributes = true;
        contributionValue = 1;
        break;
      case 'total_xp':
        contributes = true;
        contributionValue = completion.xpEarned || 0;
        break;
      case 'category_quests':
        if (completion.questCategory === goal.targetCategory) {
          contributes = true;
          contributionValue = 1;
        }
        break;
    }
    
    if (contributes) {
      const newProgress = (goal.currentProgress || 0) + contributionValue;
      const isCompleted = newProgress >= goal.targetValue;
      
      const updateData = {
        currentProgress: newProgress,
        lastUpdated: FieldValue.serverTimestamp()
      };
      
      if (isCompleted && !goal.completed) {
        updateData.completed = true;
        updateData.completedAt = FieldValue.serverTimestamp();
        updateData.status = 'completed';
      }
      
      await db.collection('familyGoals').doc(goalDoc.id).update(updateData);
    }
  }
}

/**
 * Manual analytics generation function (callable from client)
 */
exports.generateAnalyticsReport = onCall(async (request) => {
  const { auth, data } = request;
  
  if (!auth) {
    throw new Error('Authentication required');
  }
  
  const { reportType, startDate, endDate } = data;
  
  try {
    const familyId = auth.uid;
    
    if (reportType === 'daily') {
      const reportDate = startDate ? new Date(startDate) : new Date();
      await generateFamilyDailyReport(familyId, reportDate);
    } else if (reportType === 'weekly') {
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      await generateFamilyWeeklyReport(familyId, start, end);
    } else {
      throw new Error('Invalid report type. Must be "daily" or "weekly"');
    }
    
    return { success: true, message: 'Analytics report generated successfully' };
    
  } catch (error) {
    logger.error('Error in manual analytics generation:', error);
    throw new Error(error.message);
  }
});

module.exports = {
  generateDailyAnalytics: exports.generateDailyAnalytics,
  generateWeeklyAnalytics: exports.generateWeeklyAnalytics,
  updateAnalyticsOnQuestCompletion: exports.updateAnalyticsOnQuestCompletion,
  updateAnalyticsOnRewardRedemption: exports.updateAnalyticsOnRewardRedemption,
  generateAnalyticsReport: exports.generateAnalyticsReport
};