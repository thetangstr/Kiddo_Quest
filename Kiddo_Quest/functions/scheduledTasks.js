const { onSchedule } = require('firebase-functions/v2/scheduler');
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
 * Scheduled function to apply daily penalties
 * Runs every day at 2 AM UTC to check for missed quests and apply penalties
 */
exports.applyDailyPenalties = onSchedule('0 2 * * *', async (event) => {
  logger.info('Starting daily penalty application');
  
  try {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    // Get all active penalty rules
    const penaltyRulesSnapshot = await db.collection('penaltyRules')
      .where('enabled', '==', true)
      .get();
    
    if (penaltyRulesSnapshot.empty) {
      logger.info('No active penalty rules found');
      return;
    }
    
    const penaltyRules = penaltyRulesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    let totalPenaltiesApplied = 0;
    
    // Process each family with penalty rules
    for (const rule of penaltyRules) {
      logger.info(`Processing penalty rule: ${rule.name} for family: ${rule.familyId}`);
      
      try {
        const applied = await applyPenaltyRule(rule, yesterday, today);
        totalPenaltiesApplied += applied;
      } catch (error) {
        logger.error(`Error applying penalty rule ${rule.id}:`, error);
      }
    }
    
    logger.info(`Daily penalty application completed. Applied ${totalPenaltiesApplied} penalties.`);
    
    // Log the execution for analytics
    await db.collection('systemLogs').add({
      type: 'scheduled_penalty_application',
      executedAt: FieldValue.serverTimestamp(),
      penaltiesApplied: totalPenaltiesApplied,
      rulesProcessed: penaltyRules.length
    });
    
  } catch (error) {
    logger.error('Error in daily penalty application:', error);
    throw error;
  }
});

/**
 * Apply a specific penalty rule
 */
async function applyPenaltyRule(rule, checkDate, currentDate) {
  let penaltiesApplied = 0;
  
  try {
    // Get child profiles for this family
    const childProfilesSnapshot = await db.collection('childProfiles')
      .where('parentId', '==', rule.familyId)
      .where('id', 'in', rule.appliedTo || [])
      .get();
    
    if (childProfilesSnapshot.empty) {
      logger.info(`No child profiles found for rule ${rule.id}`);
      return 0;
    }
    
    for (const childDoc of childProfilesSnapshot.docs) {
      const childProfile = childDoc.data();
      const childId = childDoc.id;
      
      logger.info(`Checking penalties for child: ${childProfile.name} (${childId})`);
      
      // Check if penalty should be applied based on rule trigger
      const shouldApplyPenalty = await checkPenaltyTrigger(rule, childId, checkDate);
      
      if (shouldApplyPenalty) {
        await applyPenaltyToChild(rule, childId, childProfile, currentDate);
        penaltiesApplied++;
        logger.info(`Applied penalty to child: ${childProfile.name}`);
      }
    }
    
  } catch (error) {
    logger.error(`Error in applyPenaltyRule for rule ${rule.id}:`, error);
  }
  
  return penaltiesApplied;
}

/**
 * Check if penalty trigger conditions are met
 */
async function checkPenaltyTrigger(rule, childId, checkDate) {
  const trigger = rule.trigger;
  
  switch (trigger.type) {
    case 'missed_quest':
      return await checkMissedQuestTrigger(rule, childId, checkDate, trigger);
    
    case 'streak_break':
      return await checkStreakBreakTrigger(childId, checkDate);
    
    case 'behavior':
      return await checkBehaviorTrigger(rule, childId, checkDate, trigger);
    
    default:
      logger.warn(`Unknown penalty trigger type: ${trigger.type}`);
      return false;
  }
}

/**
 * Check for missed quest triggers
 */
async function checkMissedQuestTrigger(rule, childId, checkDate, trigger) {
  try {
    const startOfDay = new Date(checkDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(checkDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Get quests due on the check date
    const questsSnapshot = await db.collection('quests')
      .where('assignedTo', 'array-contains', childId)
      .where('dueDate', '>=', startOfDay)
      .where('dueDate', '<=', endOfDay)
      .get();
    
    if (questsSnapshot.empty) {
      return false;
    }
    
    // Check if any quests were not completed
    for (const questDoc of questsSnapshot.docs) {
      const quest = questDoc.data();
      const questId = questDoc.id;
      
      // Skip if quest category doesn't match trigger (if specified)
      if (trigger.questCategory && quest.category !== trigger.questCategory) {
        continue;
      }
      
      // Check if quest was completed on time
      const completionsSnapshot = await db.collection('questCompletions')
        .where('questId', '==', questId)
        .where('childId', '==', childId)
        .where('completedAt', '>=', startOfDay)
        .where('completedAt', '<=', endOfDay)
        .get();
      
      if (completionsSnapshot.empty) {
        logger.info(`Missed quest detected: ${quest.title} for child: ${childId}`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    logger.error('Error checking missed quest trigger:', error);
    return false;
  }
}

/**
 * Check for streak break triggers
 */
async function checkStreakBreakTrigger(childId, checkDate) {
  try {
    // Get active streaks for the child
    const streaksSnapshot = await db.collection('streaks')
      .where('childId', '==', childId)
      .where('type', '==', 'daily')
      .where('broken', '==', false)
      .get();
    
    if (streaksSnapshot.empty) {
      return false;
    }
    
    for (const streakDoc of streaksSnapshot.docs) {
      const streak = streakDoc.data();
      const lastActivityDate = streak.lastActivityDate.toDate();
      
      // Check if streak was broken (no activity for more than 24 hours)
      const hoursSinceLastActivity = (checkDate - lastActivityDate) / (1000 * 60 * 60);
      
      if (hoursSinceLastActivity > 24) {
        logger.info(`Streak break detected for child: ${childId}`);
        
        // Mark streak as broken
        await db.collection('streaks').doc(streakDoc.id).update({
          broken: true,
          brokenDate: FieldValue.serverTimestamp()
        });
        
        return true;
      }
    }
    
    return false;
  } catch (error) {
    logger.error('Error checking streak break trigger:', error);
    return false;
  }
}

/**
 * Check for behavior triggers (manual flags)
 */
async function checkBehaviorTrigger(rule, childId, checkDate, trigger) {
  try {
    const startOfDay = new Date(checkDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(checkDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Check for behavior flags created by parents
    const behaviorFlagsSnapshot = await db.collection('behaviorFlags')
      .where('childId', '==', childId)
      .where('type', '==', trigger.behaviorType || 'general')
      .where('flaggedAt', '>=', startOfDay)
      .where('flaggedAt', '<=', endOfDay)
      .where('processed', '==', false)
      .get();
    
    if (!behaviorFlagsSnapshot.empty) {
      // Mark flags as processed
      const batch = db.batch();
      behaviorFlagsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { processed: true });
      });
      await batch.commit();
      
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Error checking behavior trigger:', error);
    return false;
  }
}

/**
 * Apply penalty to a specific child
 */
async function applyPenaltyToChild(rule, childId, childProfile, currentDate) {
  try {
    const penalty = rule.penalty;
    const penaltyId = db.collection('appliedPenalties').doc().id;
    
    // Create applied penalty record
    const appliedPenalty = {
      id: penaltyId,
      ruleId: rule.id,
      ruleName: rule.name,
      childId: childId,
      childName: childProfile.name,
      familyId: rule.familyId,
      penaltyType: penalty.type,
      appliedAt: FieldValue.serverTimestamp(),
      status: 'active',
      appealWindow: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000), // 24 hour appeal window
      details: {
        originalAmount: penalty.amount,
        description: `Penalty applied: ${rule.name}`
      }
    };
    
    // Apply the specific penalty
    switch (penalty.type) {
      case 'xp_deduction':
        await applyXPDeduction(childId, penalty.amount, appliedPenalty);
        break;
      
      case 'reward_lock':
        await applyRewardLock(childId, penalty.lockedRewardId, appliedPenalty);
        break;
      
      case 'redemption_quest':
        await applyRedemptionQuest(childId, penalty.redemptionQuestId, appliedPenalty);
        break;
      
      default:
        logger.warn(`Unknown penalty type: ${penalty.type}`);
        return;
    }
    
    // Save the applied penalty record
    await db.collection('appliedPenalties').doc(penaltyId).set(appliedPenalty);
    
    logger.info(`Penalty applied successfully to child ${childId}: ${penalty.type}`);
    
  } catch (error) {
    logger.error(`Error applying penalty to child ${childId}:`, error);
    throw error;
  }
}

/**
 * Apply XP deduction penalty
 */
async function applyXPDeduction(childId, amount, penaltyRecord) {
  const childRef = db.collection('childProfiles').doc(childId);
  
  await db.runTransaction(async (transaction) => {
    const childDoc = await transaction.get(childRef);
    
    if (!childDoc.exists) {
      throw new Error(`Child profile not found: ${childId}`);
    }
    
    const currentXP = childDoc.data().totalXP || childDoc.data().xp || 0;
    const newXP = Math.max(0, currentXP - amount); // Don't allow negative XP
    
    transaction.update(childRef, {
      totalXP: newXP,
      xp: newXP, // Update legacy field too
      updatedAt: FieldValue.serverTimestamp()
    });
    
    // Update penalty record with actual deduction
    penaltyRecord.details.actualDeduction = currentXP - newXP;
    penaltyRecord.details.newXP = newXP;
  });
}

/**
 * Apply reward lock penalty
 */
async function applyRewardLock(childId, rewardId, penaltyRecord) {
  // Create a reward lock record
  await db.collection('rewardLocks').add({
    childId: childId,
    rewardId: rewardId,
    lockedAt: FieldValue.serverTimestamp(),
    lockedBy: 'penalty_system',
    penaltyId: penaltyRecord.id,
    reason: penaltyRecord.details.description
  });
  
  penaltyRecord.details.lockedRewardId = rewardId;
}

/**
 * Apply redemption quest penalty
 */
async function applyRedemptionQuest(childId, questTemplateId, penaltyRecord) {
  // Get the quest template
  const templateDoc = await db.collection('questTemplates').doc(questTemplateId).get();
  
  if (!templateDoc.exists) {
    throw new Error(`Quest template not found: ${questTemplateId}`);
  }
  
  const template = templateDoc.data();
  
  // Create redemption quest
  const redemptionQuest = {
    title: `Redemption: ${template.title}`,
    description: template.description,
    category: 'redemption',
    xpReward: 0, // No XP reward for redemption quests
    assignedTo: [childId],
    createdAt: FieldValue.serverTimestamp(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days to complete
    isRedemptionQuest: true,
    penaltyId: penaltyRecord.id,
    status: 'available'
  };
  
  const questRef = await db.collection('quests').add(redemptionQuest);
  penaltyRecord.details.redemptionQuestId = questRef.id;
}

/**
 * Manual penalty application function (callable from client)
 */
exports.applyPenalty = onCall(async (request) => {
  const { auth, data } = request;
  
  if (!auth) {
    throw new Error('Authentication required');
  }
  
  const { ruleId, childId, reason } = data;
  
  try {
    // Get the penalty rule
    const ruleDoc = await db.collection('penaltyRules').doc(ruleId).get();
    
    if (!ruleDoc.exists) {
      throw new Error('Penalty rule not found');
    }
    
    const rule = { id: ruleDoc.id, ...ruleDoc.data() };
    
    // Verify the caller has permission to apply this penalty
    if (rule.familyId !== auth.uid) {
      throw new Error('Permission denied');
    }
    
    // Get child profile
    const childDoc = await db.collection('childProfiles').doc(childId).get();
    
    if (!childDoc.exists) {
      throw new Error('Child profile not found');
    }
    
    const childProfile = childDoc.data();
    
    // Apply the penalty
    await applyPenaltyToChild(rule, childId, childProfile, new Date());
    
    return { success: true, message: 'Penalty applied successfully' };
    
  } catch (error) {
    logger.error('Error in manual penalty application:', error);
    throw new Error(error.message);
  }
});

/**
 * Penalty appeal function
 */
exports.appealPenalty = onCall(async (request) => {
  const { auth, data } = request;
  
  if (!auth) {
    throw new Error('Authentication required');
  }
  
  const { penaltyId, appealReason } = data;
  
  try {
    const penaltyRef = db.collection('appliedPenalties').doc(penaltyId);
    const penaltyDoc = await penaltyRef.get();
    
    if (!penaltyDoc.exists) {
      throw new Error('Penalty not found');
    }
    
    const penalty = penaltyDoc.data();
    
    // Verify caller has permission
    if (penalty.familyId !== auth.uid) {
      throw new Error('Permission denied');
    }
    
    // Check if still within appeal window
    if (new Date() > penalty.appealWindow.toDate()) {
      throw new Error('Appeal window has expired');
    }
    
    // Update penalty status
    await penaltyRef.update({
      status: 'appealed',
      appealedAt: FieldValue.serverTimestamp(),
      appealReason: appealReason,
      updatedAt: FieldValue.serverTimestamp()
    });
    
    return { success: true, message: 'Appeal submitted successfully' };
    
  } catch (error) {
    logger.error('Error in penalty appeal:', error);
    throw new Error(error.message);
  }
});

module.exports = {
  applyDailyPenalties: exports.applyDailyPenalties,
  applyPenalty: exports.applyPenalty,
  appealPenalty: exports.appealPenalty
};