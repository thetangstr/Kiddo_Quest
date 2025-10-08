const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentWritten, onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onCall } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { logger } = require('firebase-functions');

// Initialize Firebase Admin
if (!process.env.FIREBASE_CONFIG) {
  initializeApp();
}
const db = getFirestore();
const messaging = getMessaging();

/**
 * Scheduled function to send quest reminder notifications
 * Runs every hour to check for upcoming quest deadlines
 */
exports.sendQuestReminders = onSchedule('0 * * * *', async (event) => {
  logger.info('Starting quest reminder notifications');
  
  try {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Get quests due within the next 2 hours or tomorrow
    const upcomingQuestsSnapshot = await db.collection('quests')
      .where('status', '==', 'available')
      .where('dueDate', '>=', now)
      .where('dueDate', '<=', tomorrow)
      .get();
    
    if (upcomingQuestsSnapshot.empty) {
      logger.info('No upcoming quests found for reminders');
      return;
    }
    
    let remindersSent = 0;
    
    for (const questDoc of upcomingQuestsSnapshot.docs) {
      const quest = questDoc.data();
      const questId = questDoc.id;
      const dueDate = quest.dueDate.toDate();
      
      // Check if quest is due within 2 hours (urgent) or tomorrow (daily reminder)
      const isUrgent = dueDate <= twoHoursFromNow;
      const reminderType = isUrgent ? 'urgent' : 'daily';
      
      // Check if reminder already sent today for this quest
      const reminderKey = `${questId}_${reminderType}_${now.toDateString()}`;
      const reminderDoc = await db.collection('notificationLog').doc(reminderKey).get();
      
      if (reminderDoc.exists) {
        continue; // Skip if reminder already sent
      }
      
      try {
        await sendQuestReminderToAssignees(quest, questId, reminderType);
        remindersSent++;
        
        // Log that reminder was sent
        await db.collection('notificationLog').doc(reminderKey).set({
          questId: questId,
          type: 'quest_reminder',
          subType: reminderType,
          sentAt: FieldValue.serverTimestamp(),
          assignedTo: quest.assignedTo || []
        });
        
      } catch (error) {
        logger.error(`Error sending reminder for quest ${questId}:`, error);
      }
    }
    
    logger.info(`Quest reminder notifications completed. Sent ${remindersSent} reminders.`);
    
  } catch (error) {
    logger.error('Error in quest reminder notifications:', error);
    throw error;
  }
});

/**
 * Scheduled function to send daily motivation notifications
 * Runs every day at 8 AM local time (adjust timezone as needed)
 */
exports.sendDailyMotivation = onSchedule('0 8 * * *', async (event) => {
  logger.info('Starting daily motivation notifications');
  
  try {
    // Get all active child profiles
    const childProfilesSnapshot = await db.collection('childProfiles')
      .where('active', '==', true)
      .get();
    
    if (childProfilesSnapshot.empty) {
      logger.info('No active child profiles found');
      return;
    }
    
    let motivationsSent = 0;
    
    for (const childDoc of childProfilesSnapshot.docs) {
      const child = childDoc.data();
      const childId = childDoc.id;
      
      try {
        const motivationMessage = await generateMotivationMessage(child, childId);
        await sendNotificationToChild(childId, {
          title: 'Good Morning! 🌟',
          body: motivationMessage,
          type: 'daily_motivation',
          data: {
            childId: childId,
            type: 'daily_motivation'
          }
        });
        
        motivationsSent++;
        
      } catch (error) {
        logger.error(`Error sending motivation to child ${childId}:`, error);
      }
    }
    
    logger.info(`Daily motivation notifications completed. Sent ${motivationsSent} messages.`);
    
  } catch (error) {
    logger.error('Error in daily motivation notifications:', error);
    throw error;
  }
});

/**
 * Scheduled function to send evening summary notifications
 * Runs every day at 8 PM local time
 */
exports.sendEveningSummary = onSchedule('0 20 * * *', async (event) => {
  logger.info('Starting evening summary notifications');
  
  try {
    // Get all families (parent users)
    const parentsSnapshot = await db.collection('users')
      .where('role', 'in', ['admin', 'parent'])
      .get();
    
    if (parentsSnapshot.empty) {
      logger.info('No parent users found');
      return;
    }
    
    let summariesSent = 0;
    
    for (const parentDoc of parentsSnapshot.docs) {
      const parent = parentDoc.data();
      const parentId = parentDoc.id;
      
      try {
        const summary = await generateDailySummary(parentId);
        
        if (summary.hasActivity) {
          await sendNotificationToUser(parentId, {
            title: 'Daily Summary 📊',
            body: summary.message,
            type: 'daily_summary',
            data: {
              familyId: parentId,
              type: 'daily_summary',
              questsCompleted: summary.questsCompleted.toString(),
              xpEarned: summary.xpEarned.toString()
            }
          });
          
          summariesSent++;
        }
        
      } catch (error) {
        logger.error(`Error sending summary to parent ${parentId}:`, error);
      }
    }
    
    logger.info(`Evening summary notifications completed. Sent ${summariesSent} summaries.`);
    
  } catch (error) {
    logger.error('Error in evening summary notifications:', error);
    throw error;
  }
});

/**
 * Trigger notification when quest is completed
 */
exports.sendQuestCompletionNotification = onDocumentCreated('questCompletions/{completionId}', async (event) => {
  const completion = event.data.data();
  const completionId = event.params.completionId;
  
  logger.info(`Sending quest completion notification for: ${completionId}`);
  
  try {
    // Get quest details
    const questDoc = await db.collection('quests').doc(completion.questId).get();
    if (!questDoc.exists) {
      logger.error(`Quest not found: ${completion.questId}`);
      return;
    }
    
    const quest = questDoc.data();
    
    // Get child profile
    const childDoc = await db.collection('childProfiles').doc(completion.childId).get();
    if (!childDoc.exists) {
      logger.error(`Child profile not found: ${completion.childId}`);
      return;
    }
    
    const child = childDoc.data();
    
    // Send notification to child
    await sendNotificationToChild(completion.childId, {
      title: 'Quest Completed! 🎉',
      body: `Great job completing "${quest.title}"! You earned ${completion.xpEarned || 0} XP.`,
      type: 'quest_completion',
      data: {
        questId: completion.questId,
        childId: completion.childId,
        xpEarned: (completion.xpEarned || 0).toString(),
        type: 'quest_completion'
      }
    });
    
    // Send notification to parents
    await sendNotificationToParents(child.parentId, {
      title: 'Quest Completed! ✅',
      body: `${child.name} completed "${quest.title}" and earned ${completion.xpEarned || 0} XP!`,
      type: 'child_achievement',
      data: {
        questId: completion.questId,
        childId: completion.childId,
        childName: child.name,
        questTitle: quest.title,
        xpEarned: (completion.xpEarned || 0).toString(),
        type: 'child_achievement'
      }
    });
    
    // Check for achievements and level ups
    await checkForAchievements(completion, child);
    
  } catch (error) {
    logger.error(`Error sending quest completion notification:`, error);
  }
});

/**
 * Trigger notification when child levels up
 */
exports.sendLevelUpNotification = onDocumentWritten('childProfiles/{childId}', async (event) => {
  const change = event.data;
  
  if (!change.before.exists || !change.after.exists) {
    return; // Skip if document was created or deleted
  }
  
  const before = change.before.data();
  const after = change.after.data();
  const childId = event.params.childId;
  
  // Check if level increased
  const oldLevel = before.level || 1;
  const newLevel = after.level || 1;
  
  if (newLevel > oldLevel) {
    logger.info(`Child ${childId} leveled up from ${oldLevel} to ${newLevel}`);
    
    try {
      // Send notification to child
      await sendNotificationToChild(childId, {
        title: 'Level Up! 🚀',
        body: `Congratulations! You've reached level ${newLevel}!`,
        type: 'level_up',
        data: {
          childId: childId,
          newLevel: newLevel.toString(),
          oldLevel: oldLevel.toString(),
          type: 'level_up'
        }
      });
      
      // Send notification to parents
      await sendNotificationToParents(after.parentId, {
        title: 'Level Up Achievement! 🌟',
        body: `${after.name} has reached level ${newLevel}!`,
        type: 'child_level_up',
        data: {
          childId: childId,
          childName: after.name,
          newLevel: newLevel.toString(),
          type: 'child_level_up'
        }
      });
      
    } catch (error) {
      logger.error(`Error sending level up notification:`, error);
    }
  }
});

/**
 * Trigger notification when family goal progress is made
 */
exports.sendFamilyGoalProgressNotification = onDocumentWritten('familyGoals/{goalId}', async (event) => {
  const change = event.data;
  
  if (!change.after.exists) {
    return;
  }
  
  const goal = change.after.data();
  const goalId = event.params.goalId;
  
  // Check if goal was just completed
  if (goal.completed && (!change.before.exists || !change.before.data().completed)) {
    logger.info(`Family goal completed: ${goalId}`);
    
    try {
      // Send notification to all family members
      await sendNotificationToFamily(goal.familyId, {
        title: 'Family Goal Achieved! 🏆',
        body: `Congratulations! Your family completed the goal: ${goal.title}`,
        type: 'family_goal_completed',
        data: {
          goalId: goalId,
          goalTitle: goal.title,
          type: 'family_goal_completed'
        }
      });
      
    } catch (error) {
      logger.error(`Error sending family goal completion notification:`, error);
    }
  }
  
  // Check for significant progress milestones
  else if (change.before.exists) {
    const oldProgress = change.before.data().currentProgress || 0;
    const newProgress = goal.currentProgress || 0;
    const targetValue = goal.targetValue || 1;
    
    const oldPercentage = Math.floor((oldProgress / targetValue) * 100);
    const newPercentage = Math.floor((newProgress / targetValue) * 100);
    
    // Send notification for 25%, 50%, 75% milestones
    const milestones = [25, 50, 75];
    
    for (const milestone of milestones) {
      if (oldPercentage < milestone && newPercentage >= milestone) {
        logger.info(`Family goal ${goalId} reached ${milestone}% completion`);
        
        await sendNotificationToFamily(goal.familyId, {
          title: 'Family Goal Progress! 📈',
          body: `Your family is ${milestone}% of the way to completing: ${goal.title}`,
          type: 'family_goal_progress',
          data: {
            goalId: goalId,
            goalTitle: goal.title,
            progress: milestone.toString(),
            type: 'family_goal_progress'
          }
        });
        
        break; // Only send one milestone notification per update
      }
    }
  }
});

/**
 * Trigger notification when penalty is applied
 */
exports.sendPenaltyNotification = onDocumentCreated('appliedPenalties/{penaltyId}', async (event) => {
  const penalty = event.data.data();
  const penaltyId = event.params.penaltyId;
  
  logger.info(`Sending penalty notification for: ${penaltyId}`);
  
  try {
    // Send notification to child
    await sendNotificationToChild(penalty.childId, {
      title: 'Penalty Applied ⚠️',
      body: `A penalty has been applied: ${penalty.ruleName}. You have 24 hours to appeal if needed.`,
      type: 'penalty_applied',
      data: {
        penaltyId: penaltyId,
        childId: penalty.childId,
        penaltyType: penalty.penaltyType,
        type: 'penalty_applied'
      }
    });
    
    // Send notification to parents
    await sendNotificationToParents(penalty.familyId, {
      title: 'Penalty Applied 📋',
      body: `Penalty "${penalty.ruleName}" was applied to ${penalty.childName}`,
      type: 'penalty_applied_parent',
      data: {
        penaltyId: penaltyId,
        childId: penalty.childId,
        childName: penalty.childName,
        penaltyType: penalty.penaltyType,
        type: 'penalty_applied_parent'
      }
    });
    
  } catch (error) {
    logger.error(`Error sending penalty notification:`, error);
  }
});

/**
 * Trigger notification when streak is broken
 */
exports.sendStreakNotification = onDocumentWritten('streaks/{streakId}', async (event) => {
  const change = event.data;
  
  if (!change.after.exists) {
    return;
  }
  
  const streak = change.after.data();
  const streakId = event.params.streakId;
  
  // Check if streak was just broken
  if (streak.broken && (!change.before.exists || !change.before.data().broken)) {
    logger.info(`Streak broken: ${streakId}`);
    
    try {
      // Send notification to child
      await sendNotificationToChild(streak.childId, {
        title: 'Streak Broken 💔',
        body: `Your ${streak.currentLength}-day streak has been broken. Don't give up - start a new one today!`,
        type: 'streak_broken',
        data: {
          streakId: streakId,
          childId: streak.childId,
          streakLength: streak.currentLength.toString(),
          type: 'streak_broken'
        }
      });
      
    } catch (error) {
      logger.error(`Error sending streak broken notification:`, error);
    }
  }
  
  // Check for streak milestones (3, 7, 14, 30 days)
  else if (change.before.exists && streak.currentLength > change.before.data().currentLength) {
    const milestones = [3, 7, 14, 30];
    
    for (const milestone of milestones) {
      if (streak.currentLength === milestone) {
        logger.info(`Streak milestone reached: ${milestone} days`);
        
        await sendNotificationToChild(streak.childId, {
          title: 'Streak Milestone! 🔥',
          body: `Amazing! You've maintained your streak for ${milestone} days!`,
          type: 'streak_milestone',
          data: {
            streakId: streakId,
            childId: streak.childId,
            streakLength: milestone.toString(),
            type: 'streak_milestone'
          }
        });
        
        break;
      }
    }
  }
});

/**
 * Send quest reminder to assigned children
 */
async function sendQuestReminderToAssignees(quest, questId, reminderType) {
  if (!quest.assignedTo || quest.assignedTo.length === 0) {
    return;
  }
  
  const dueDate = quest.dueDate.toDate();
  const timeUntilDue = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60)); // hours
  
  let title, body;
  
  if (reminderType === 'urgent') {
    title = 'Quest Due Soon! ⏰';
    body = `"${quest.title}" is due in ${timeUntilDue} hour${timeUntilDue !== 1 ? 's' : ''}!`;
  } else {
    title = 'Quest Reminder 📝';
    body = `Don't forget about your quest: "${quest.title}" - due tomorrow!`;
  }
  
  for (const childId of quest.assignedTo) {
    await sendNotificationToChild(childId, {
      title: title,
      body: body,
      type: 'quest_reminder',
      data: {
        questId: questId,
        childId: childId,
        reminderType: reminderType,
        type: 'quest_reminder'
      }
    });
  }
}

/**
 * Generate personalized motivation message for a child
 */
async function generateMotivationMessage(child, childId) {
  const messages = [
    `Ready for another awesome day, ${child.name}? Your quests await! 🌟`,
    `Good morning, ${child.name}! What amazing things will you accomplish today? 🚀`,
    `Rise and shine, ${child.name}! Time to level up with some fun quests! ⭐`,
    `Hello ${child.name}! Your XP is waiting to grow - let's get started! 💪`,
    `Morning, ${child.name}! Today is perfect for completing some quests! 🎯`
  ];
  
  // Try to get recent activity to personalize further
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);
    
    const recentCompletionsSnapshot = await db.collection('questCompletions')
      .where('childId', '==', childId)
      .where('completedAt', '>=', yesterday)
      .where('completedAt', '<=', endOfYesterday)
      .limit(1)
      .get();
    
    if (!recentCompletionsSnapshot.empty) {
      return `Great job yesterday, ${child.name}! Ready to keep the momentum going today? 🔥`;
    }
    
    // Check for active streaks
    const streaksSnapshot = await db.collection('streaks')
      .where('childId', '==', childId)
      .where('broken', '==', false)
      .limit(1)
      .get();
    
    if (!streaksSnapshot.empty) {
      const streak = streaksSnapshot.docs[0].data();
      return `Keep your ${streak.currentLength}-day streak alive, ${child.name}! You're doing amazing! 🔥`;
    }
    
  } catch (error) {
    logger.error('Error personalizing motivation message:', error);
  }
  
  // Return random message if personalization fails
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Generate daily summary for a parent
 */
async function generateDailySummary(parentId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);
  
  // Get child profiles for this family
  const childProfilesSnapshot = await db.collection('childProfiles')
    .where('parentId', '==', parentId)
    .get();
  
  const childIds = childProfilesSnapshot.docs.map(doc => doc.id);
  
  if (childIds.length === 0) {
    return { hasActivity: false };
  }
  
  // Get today's quest completions
  const completionsSnapshot = await db.collection('questCompletions')
    .where('childId', 'in', childIds)
    .where('completedAt', '>=', today)
    .where('completedAt', '<=', endOfToday)
    .get();
  
  const questsCompleted = completionsSnapshot.size;
  const totalXPEarned = completionsSnapshot.docs.reduce((sum, doc) => {
    return sum + (doc.data().xpEarned || 0);
  }, 0);
  
  if (questsCompleted === 0) {
    return { hasActivity: false };
  }
  
  let message;
  if (questsCompleted === 1) {
    message = `Your family completed 1 quest today and earned ${totalXPEarned} XP!`;
  } else {
    message = `Your family completed ${questsCompleted} quests today and earned ${totalXPEarned} XP!`;
  }
  
  return {
    hasActivity: true,
    message: message,
    questsCompleted: questsCompleted,
    xpEarned: totalXPEarned
  };
}

/**
 * Check for achievements after quest completion
 */
async function checkForAchievements(completion, child) {
  // Check for first quest completion
  const previousCompletionsSnapshot = await db.collection('questCompletions')
    .where('childId', '==', completion.childId)
    .limit(2)
    .get();
  
  if (previousCompletionsSnapshot.size === 1) {
    // This is their first quest completion
    await sendNotificationToChild(completion.childId, {
      title: 'First Quest Complete! 🌟',
      body: 'Congratulations on completing your very first quest!',
      type: 'first_achievement',
      data: {
        achievementType: 'first_quest',
        childId: completion.childId,
        type: 'first_achievement'
      }
    });
  }
  
  // Check for XP milestones (100, 500, 1000, etc.)
  const milestones = [100, 500, 1000, 2500, 5000, 10000];
  const currentXP = child.totalXP || child.xp || 0;
  
  for (const milestone of milestones) {
    if (currentXP >= milestone && (currentXP - (completion.xpEarned || 0)) < milestone) {
      await sendNotificationToChild(completion.childId, {
        title: 'XP Milestone Reached! 🏆',
        body: `Amazing! You've earned ${milestone} total XP!`,
        type: 'xp_milestone',
        data: {
          achievementType: 'xp_milestone',
          milestone: milestone.toString(),
          childId: completion.childId,
          type: 'xp_milestone'
        }
      });
      break;
    }
  }
}

/**
 * Send notification to a specific child
 */
async function sendNotificationToChild(childId, notification) {
  // Get the child's device tokens
  const tokensSnapshot = await db.collection('deviceTokens')
    .where('userId', '==', childId)
    .where('active', '==', true)
    .get();
  
  if (tokensSnapshot.empty) {
    logger.info(`No device tokens found for child: ${childId}`);
    return;
  }
  
  const tokens = tokensSnapshot.docs.map(doc => doc.data().token);
  
  const message = {
    notification: {
      title: notification.title,
      body: notification.body
    },
    data: notification.data || {},
    tokens: tokens
  };
  
  try {
    const response = await messaging.sendEachForMulticast(message);
    logger.info(`Notification sent to child ${childId}: ${response.successCount}/${response.responses.length} successful`);
    
    // Clean up invalid tokens
    if (response.failureCount > 0) {
      await cleanupInvalidTokens(tokens, response.responses);
    }
    
  } catch (error) {
    logger.error(`Error sending notification to child ${childId}:`, error);
  }
}

/**
 * Send notification to all parents in a family
 */
async function sendNotificationToParents(familyId, notification) {
  // Get parent user tokens
  const tokensSnapshot = await db.collection('deviceTokens')
    .where('familyId', '==', familyId)
    .where('userRole', 'in', ['admin', 'parent'])
    .where('active', '==', true)
    .get();
  
  if (tokensSnapshot.empty) {
    logger.info(`No parent device tokens found for family: ${familyId}`);
    return;
  }
  
  const tokens = tokensSnapshot.docs.map(doc => doc.data().token);
  
  const message = {
    notification: {
      title: notification.title,
      body: notification.body
    },
    data: notification.data || {},
    tokens: tokens
  };
  
  try {
    const response = await messaging.sendEachForMulticast(message);
    logger.info(`Notification sent to family ${familyId}: ${response.successCount}/${response.responses.length} successful`);
    
    // Clean up invalid tokens
    if (response.failureCount > 0) {
      await cleanupInvalidTokens(tokens, response.responses);
    }
    
  } catch (error) {
    logger.error(`Error sending notification to family ${familyId}:`, error);
  }
}

/**
 * Send notification to all family members
 */
async function sendNotificationToFamily(familyId, notification) {
  const tokensSnapshot = await db.collection('deviceTokens')
    .where('familyId', '==', familyId)
    .where('active', '==', true)
    .get();
  
  if (tokensSnapshot.empty) {
    logger.info(`No device tokens found for family: ${familyId}`);
    return;
  }
  
  const tokens = tokensSnapshot.docs.map(doc => doc.data().token);
  
  const message = {
    notification: {
      title: notification.title,
      body: notification.body
    },
    data: notification.data || {},
    tokens: tokens
  };
  
  try {
    const response = await messaging.sendEachForMulticast(message);
    logger.info(`Notification sent to family ${familyId}: ${response.successCount}/${response.responses.length} successful`);
    
    // Clean up invalid tokens
    if (response.failureCount > 0) {
      await cleanupInvalidTokens(tokens, response.responses);
    }
    
  } catch (error) {
    logger.error(`Error sending notification to family ${familyId}:`, error);
  }
}

/**
 * Send notification to a specific user
 */
async function sendNotificationToUser(userId, notification) {
  const tokensSnapshot = await db.collection('deviceTokens')
    .where('userId', '==', userId)
    .where('active', '==', true)
    .get();
  
  if (tokensSnapshot.empty) {
    logger.info(`No device tokens found for user: ${userId}`);
    return;
  }
  
  const tokens = tokensSnapshot.docs.map(doc => doc.data().token);
  
  const message = {
    notification: {
      title: notification.title,
      body: notification.body
    },
    data: notification.data || {},
    tokens: tokens
  };
  
  try {
    const response = await messaging.sendEachForMulticast(message);
    logger.info(`Notification sent to user ${userId}: ${response.successCount}/${response.responses.length} successful`);
    
    // Clean up invalid tokens
    if (response.failureCount > 0) {
      await cleanupInvalidTokens(tokens, response.responses);
    }
    
  } catch (error) {
    logger.error(`Error sending notification to user ${userId}:`, error);
  }
}

/**
 * Clean up invalid device tokens
 */
async function cleanupInvalidTokens(tokens, responses) {
  const batch = db.batch();
  
  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];
    if (!response.success) {
      const token = tokens[i];
      
      // Mark token as inactive if it's invalid
      if (response.error?.code === 'messaging/invalid-registration-token' ||
          response.error?.code === 'messaging/registration-token-not-registered') {
        
        const tokenQuery = await db.collection('deviceTokens')
          .where('token', '==', token)
          .limit(1)
          .get();
        
        if (!tokenQuery.empty) {
          const tokenDoc = tokenQuery.docs[0];
          batch.update(tokenDoc.ref, { active: false, updatedAt: FieldValue.serverTimestamp() });
        }
      }
    }
  }
  
  if (batch._writes && batch._writes.length > 0) {
    await batch.commit();
    logger.info('Cleaned up invalid device tokens');
  }
}

/**
 * Manual notification sending function (callable from client)
 */
exports.sendCustomNotification = onCall(async (request) => {
  const { auth, data } = request;
  
  if (!auth) {
    throw new Error('Authentication required');
  }
  
  const { targetType, targetId, title, body, notificationType, customData } = data;
  
  try {
    const notification = {
      title: title,
      body: body,
      type: notificationType || 'custom',
      data: {
        ...customData,
        type: notificationType || 'custom',
        sentBy: auth.uid
      }
    };
    
    switch (targetType) {
      case 'child':
        await sendNotificationToChild(targetId, notification);
        break;
      case 'family':
        await sendNotificationToFamily(targetId, notification);
        break;
      case 'user':
        await sendNotificationToUser(targetId, notification);
        break;
      default:
        throw new Error('Invalid target type. Must be "child", "family", or "user"');
    }
    
    return { success: true, message: 'Notification sent successfully' };
    
  } catch (error) {
    logger.error('Error in custom notification sending:', error);
    throw new Error(error.message);
  }
});

module.exports = {
  sendQuestReminders: exports.sendQuestReminders,
  sendDailyMotivation: exports.sendDailyMotivation,
  sendEveningSummary: exports.sendEveningSummary,
  sendQuestCompletionNotification: exports.sendQuestCompletionNotification,
  sendLevelUpNotification: exports.sendLevelUpNotification,
  sendFamilyGoalProgressNotification: exports.sendFamilyGoalProgressNotification,
  sendPenaltyNotification: exports.sendPenaltyNotification,
  sendStreakNotification: exports.sendStreakNotification,
  sendCustomNotification: exports.sendCustomNotification
};