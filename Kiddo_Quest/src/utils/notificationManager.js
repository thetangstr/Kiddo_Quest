// Notification preference model and manager for KiddoQuest communication system

import { serverTimestamp } from 'firebase/firestore';

// Notification configuration
const NOTIFICATION_CONFIG = {
  TYPES: {
    QUEST_REMINDER: 'quest_reminder',
    QUEST_COMPLETION: 'quest_completion',
    LEVEL_UP: 'level_up',
    BADGE_EARNED: 'badge_earned',
    STREAK_WARNING: 'streak_warning',
    STREAK_MILESTONE: 'streak_milestone',
    FAMILY_GOAL: 'family_goal',
    REWARD_AVAILABLE: 'reward_available',
    PENALTY_APPLIED: 'penalty_applied',
    PARENT_APPROVAL: 'parent_approval',
    ACHIEVEMENT: 'achievement',
    DAILY_SUMMARY: 'daily_summary',
    WEEKLY_REPORT: 'weekly_report',
    SYSTEM_UPDATE: 'system_update',
    CUSTOM: 'custom'
  },
  CHANNELS: {
    IN_APP: 'in_app',
    EMAIL: 'email',
    PUSH: 'push',
    SMS: 'sms'
  },
  PRIORITY: {
    LOW: { name: 'Low', value: 1, color: '#4CAF50' },
    MEDIUM: { name: 'Medium', value: 2, color: '#FF9800' },
    HIGH: { name: 'High', value: 3, color: '#F44336' },
    URGENT: { name: 'Urgent', value: 4, color: '#B71C1C' }
  },
  FREQUENCY: {
    IMMEDIATE: 'immediate',
    HOURLY: 'hourly',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    NEVER: 'never'
  },
  STATUS: {
    PENDING: 'pending',
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  },
  QUIET_HOURS: {
    DEFAULT_START: '22:00',
    DEFAULT_END: '07:00'
  }
};

// Default notification preferences
const DEFAULT_PREFERENCES = {
  // Quest-related notifications
  [NOTIFICATION_CONFIG.TYPES.QUEST_REMINDER]: {
    enabled: true,
    channels: ['in_app', 'push'],
    frequency: 'daily',
    quietHours: true,
    priority: 'medium',
    advanceHours: 2 // Remind 2 hours before deadline
  },
  [NOTIFICATION_CONFIG.TYPES.QUEST_COMPLETION]: {
    enabled: true,
    channels: ['in_app'],
    frequency: 'immediate',
    quietHours: false,
    priority: 'low'
  },
  
  // Achievement notifications
  [NOTIFICATION_CONFIG.TYPES.LEVEL_UP]: {
    enabled: true,
    channels: ['in_app', 'push'],
    frequency: 'immediate',
    quietHours: false,
    priority: 'high'
  },
  [NOTIFICATION_CONFIG.TYPES.BADGE_EARNED]: {
    enabled: true,
    channels: ['in_app', 'push'],
    frequency: 'immediate',
    quietHours: false,
    priority: 'medium'
  },
  [NOTIFICATION_CONFIG.TYPES.ACHIEVEMENT]: {
    enabled: true,
    channels: ['in_app', 'push'],
    frequency: 'immediate',
    quietHours: false,
    priority: 'medium'
  },
  
  // Streak notifications
  [NOTIFICATION_CONFIG.TYPES.STREAK_WARNING]: {
    enabled: true,
    channels: ['in_app', 'push'],
    frequency: 'daily',
    quietHours: true,
    priority: 'high',
    advanceHours: 3 // Warn 3 hours before streak breaks
  },
  [NOTIFICATION_CONFIG.TYPES.STREAK_MILESTONE]: {
    enabled: true,
    channels: ['in_app', 'push'],
    frequency: 'immediate',
    quietHours: false,
    priority: 'high'
  },
  
  // Family and social notifications
  [NOTIFICATION_CONFIG.TYPES.FAMILY_GOAL]: {
    enabled: true,
    channels: ['in_app'],
    frequency: 'immediate',
    quietHours: true,
    priority: 'medium'
  },
  
  // Reward notifications
  [NOTIFICATION_CONFIG.TYPES.REWARD_AVAILABLE]: {
    enabled: true,
    channels: ['in_app'],
    frequency: 'immediate',
    quietHours: true,
    priority: 'low'
  },
  
  // Administrative notifications
  [NOTIFICATION_CONFIG.TYPES.PENALTY_APPLIED]: {
    enabled: true,
    channels: ['in_app', 'push'],
    frequency: 'immediate',
    quietHours: false,
    priority: 'high'
  },
  [NOTIFICATION_CONFIG.TYPES.PARENT_APPROVAL]: {
    enabled: true,
    channels: ['in_app', 'push'],
    frequency: 'immediate',
    quietHours: true,
    priority: 'medium'
  },
  
  // Summary notifications
  [NOTIFICATION_CONFIG.TYPES.DAILY_SUMMARY]: {
    enabled: true,
    channels: ['in_app'],
    frequency: 'daily',
    quietHours: true,
    priority: 'low',
    scheduledHour: 19 // 7 PM
  },
  [NOTIFICATION_CONFIG.TYPES.WEEKLY_REPORT]: {
    enabled: true,
    channels: ['in_app', 'email'],
    frequency: 'weekly',
    quietHours: true,
    priority: 'low',
    scheduledDay: 0, // Sunday
    scheduledHour: 10 // 10 AM
  },
  
  // System notifications
  [NOTIFICATION_CONFIG.TYPES.SYSTEM_UPDATE]: {
    enabled: true,
    channels: ['in_app'],
    frequency: 'immediate',
    quietHours: true,
    priority: 'low'
  }
};

// Notification preference model class
export class NotificationPreference {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.userId = data.userId;
    this.familyId = data.familyId;
    this.type = data.type;
    this.enabled = data.enabled !== undefined ? data.enabled : true;
    this.channels = data.channels || ['in_app'];
    this.frequency = data.frequency || 'immediate';
    this.priority = data.priority || 'medium';
    this.quietHours = data.quietHours !== undefined ? data.quietHours : true;
    this.quietHoursStart = data.quietHoursStart || NOTIFICATION_CONFIG.QUIET_HOURS.DEFAULT_START;
    this.quietHoursEnd = data.quietHoursEnd || NOTIFICATION_CONFIG.QUIET_HOURS.DEFAULT_END;
    this.advanceHours = data.advanceHours || 0;
    this.scheduledHour = data.scheduledHour || null;
    this.scheduledDay = data.scheduledDay || null;
    this.customConditions = data.customConditions || {};
    this.lastSent = data.lastSent || null;
    this.createdAt = data.createdAt || serverTimestamp();
    this.updatedAt = data.updatedAt || serverTimestamp();
  }

  generateId() {
    return `notification_pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check if notification should be sent based on frequency
  shouldSend(lastNotificationTime = null) {
    if (!this.enabled) return false;
    
    const now = new Date();
    
    // Check quiet hours
    if (this.quietHours && this.isInQuietHours(now)) {
      return false;
    }
    
    // Check frequency
    if (!lastNotificationTime) return true;
    
    const lastTime = lastNotificationTime.toDate ? 
      lastNotificationTime.toDate() : 
      new Date(lastNotificationTime);
    
    const timeDiff = now - lastTime;
    
    switch (this.frequency) {
      case NOTIFICATION_CONFIG.FREQUENCY.IMMEDIATE:
        return true;
        
      case NOTIFICATION_CONFIG.FREQUENCY.HOURLY:
        return timeDiff >= 60 * 60 * 1000; // 1 hour
        
      case NOTIFICATION_CONFIG.FREQUENCY.DAILY:
        return timeDiff >= 24 * 60 * 60 * 1000; // 24 hours
        
      case NOTIFICATION_CONFIG.FREQUENCY.WEEKLY:
        return timeDiff >= 7 * 24 * 60 * 60 * 1000; // 7 days
        
      case NOTIFICATION_CONFIG.FREQUENCY.NEVER:
        return false;
        
      default:
        return true;
    }
  }

  // Check if current time is in quiet hours
  isInQuietHours(currentTime = new Date()) {
    if (!this.quietHours) return false;
    
    const current = currentTime.getHours() * 100 + currentTime.getMinutes();
    const start = this.parseTimeString(this.quietHoursStart);
    const end = this.parseTimeString(this.quietHoursEnd);
    
    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (start > end) {
      return current >= start || current <= end;
    } else {
      return current >= start && current <= end;
    }
  }

  // Parse time string to number (HHMM format)
  parseTimeString(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 100 + minutes;
  }

  // Check if scheduled notification should be sent
  shouldSendScheduled(currentTime = new Date()) {
    if (!this.enabled) return false;
    
    // Check if it's the scheduled time
    if (this.scheduledHour !== null) {
      if (currentTime.getHours() !== this.scheduledHour) return false;
    }
    
    if (this.scheduledDay !== null) {
      if (currentTime.getDay() !== this.scheduledDay) return false;
    }
    
    return this.shouldSend();
  }

  // Get priority information
  getPriorityInfo() {
    return NOTIFICATION_CONFIG.PRIORITY[this.priority.toUpperCase()] || 
           NOTIFICATION_CONFIG.PRIORITY.MEDIUM;
  }

  // Update preference
  update(updates) {
    Object.keys(updates).forEach(key => {
      if (this.hasOwnProperty(key)) {
        this[key] = updates[key];
      }
    });
    this.updatedAt = serverTimestamp();
    return this;
  }

  // Convert to Firebase document
  toFirestore() {
    return {
      id: this.id,
      userId: this.userId,
      familyId: this.familyId,
      type: this.type,
      enabled: this.enabled,
      channels: this.channels,
      frequency: this.frequency,
      priority: this.priority,
      quietHours: this.quietHours,
      quietHoursStart: this.quietHoursStart,
      quietHoursEnd: this.quietHoursEnd,
      advanceHours: this.advanceHours,
      scheduledHour: this.scheduledHour,
      scheduledDay: this.scheduledDay,
      customConditions: this.customConditions,
      lastSent: this.lastSent,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Create from Firebase document
  static fromFirestore(data) {
    return new NotificationPreference(data);
  }

  // Validate notification preference data
  static validate(data) {
    const errors = [];
    
    if (!data.userId && !data.familyId) {
      errors.push('Either user ID or family ID is required');
    }
    if (!data.type || !Object.values(NOTIFICATION_CONFIG.TYPES).includes(data.type)) {
      errors.push('Valid notification type is required');
    }
    if (data.channels && !Array.isArray(data.channels)) {
      errors.push('Channels must be an array');
    }
    if (data.frequency && !Object.values(NOTIFICATION_CONFIG.FREQUENCY).includes(data.frequency)) {
      errors.push('Valid frequency is required');
    }
    if (data.priority && !Object.keys(NOTIFICATION_CONFIG.PRIORITY).includes(data.priority.toUpperCase())) {
      errors.push('Valid priority is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      familyId: this.familyId,
      type: this.type,
      enabled: this.enabled,
      channels: this.channels,
      frequency: this.frequency,
      priority: this.priority,
      priorityInfo: this.getPriorityInfo(),
      quietHours: this.quietHours,
      quietHoursStart: this.quietHoursStart,
      quietHoursEnd: this.quietHoursEnd,
      advanceHours: this.advanceHours,
      scheduledHour: this.scheduledHour,
      scheduledDay: this.scheduledDay,
      customConditions: this.customConditions,
      lastSent: this.lastSent,
      isInQuietHours: this.isInQuietHours(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Notification instance class
export class Notification {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.userId = data.userId;
    this.familyId = data.familyId;
    this.type = data.type;
    this.title = data.title;
    this.message = data.message;
    this.data = data.data || {};
    this.channels = data.channels || ['in_app'];
    this.priority = data.priority || 'medium';
    this.status = data.status || NOTIFICATION_CONFIG.STATUS.PENDING;
    this.scheduledFor = data.scheduledFor || null;
    this.sentAt = data.sentAt || null;
    this.deliveredAt = data.deliveredAt || null;
    this.readAt = data.readAt || null;
    this.failedAt = data.failedAt || null;
    this.failureReason = data.failureReason || null;
    this.actionable = data.actionable || false;
    this.actionUrl = data.actionUrl || null;
    this.actionData = data.actionData || {};
    this.expiresAt = data.expiresAt || null;
    this.createdAt = data.createdAt || serverTimestamp();
  }

  generateId() {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Mark notification as sent
  markAsSent(channel = null) {
    this.status = NOTIFICATION_CONFIG.STATUS.SENT;
    this.sentAt = serverTimestamp();
    if (channel) {
      this.sentChannel = channel;
    }
    return this;
  }

  // Mark notification as delivered
  markAsDelivered() {
    this.status = NOTIFICATION_CONFIG.STATUS.DELIVERED;
    this.deliveredAt = serverTimestamp();
    return this;
  }

  // Mark notification as read
  markAsRead() {
    this.status = NOTIFICATION_CONFIG.STATUS.READ;
    this.readAt = serverTimestamp();
    return this;
  }

  // Mark notification as failed
  markAsFailed(reason) {
    this.status = NOTIFICATION_CONFIG.STATUS.FAILED;
    this.failedAt = serverTimestamp();
    this.failureReason = reason;
    return this;
  }

  // Check if notification is expired
  isExpired() {
    if (!this.expiresAt) return false;
    const expiryTime = this.expiresAt.toDate ? this.expiresAt.toDate() : new Date(this.expiresAt);
    return new Date() > expiryTime;
  }

  // Check if notification should be sent now
  shouldSendNow() {
    if (this.status !== NOTIFICATION_CONFIG.STATUS.PENDING) return false;
    if (this.isExpired()) return false;
    
    if (!this.scheduledFor) return true;
    
    const scheduledTime = this.scheduledFor.toDate ? 
      this.scheduledFor.toDate() : 
      new Date(this.scheduledFor);
    
    return new Date() >= scheduledTime;
  }

  // Get priority information
  getPriorityInfo() {
    return NOTIFICATION_CONFIG.PRIORITY[this.priority.toUpperCase()] || 
           NOTIFICATION_CONFIG.PRIORITY.MEDIUM;
  }

  // Convert to Firebase document
  toFirestore() {
    return {
      id: this.id,
      userId: this.userId,
      familyId: this.familyId,
      type: this.type,
      title: this.title,
      message: this.message,
      data: this.data,
      channels: this.channels,
      priority: this.priority,
      status: this.status,
      scheduledFor: this.scheduledFor,
      sentAt: this.sentAt,
      deliveredAt: this.deliveredAt,
      readAt: this.readAt,
      failedAt: this.failedAt,
      failureReason: this.failureReason,
      actionable: this.actionable,
      actionUrl: this.actionUrl,
      actionData: this.actionData,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt
    };
  }

  // Create from Firebase document
  static fromFirestore(data) {
    return new Notification(data);
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      familyId: this.familyId,
      type: this.type,
      title: this.title,
      message: this.message,
      data: this.data,
      channels: this.channels,
      priority: this.priority,
      priorityInfo: this.getPriorityInfo(),
      status: this.status,
      scheduledFor: this.scheduledFor,
      sentAt: this.sentAt,
      deliveredAt: this.deliveredAt,
      readAt: this.readAt,
      failedAt: this.failedAt,
      failureReason: this.failureReason,
      actionable: this.actionable,
      actionUrl: this.actionUrl,
      actionData: this.actionData,
      expiresAt: this.expiresAt,
      isExpired: this.isExpired(),
      shouldSendNow: this.shouldSendNow(),
      createdAt: this.createdAt
    };
  }
}

// Initialize default notification preferences for a user
export const initializeUserNotificationPreferences = (userId, familyId) => {
  const preferences = [];
  
  Object.entries(DEFAULT_PREFERENCES).forEach(([type, defaultSettings]) => {
    const preference = new NotificationPreference({
      userId,
      familyId,
      type,
      ...defaultSettings
    });
    preferences.push(preference);
  });
  
  return preferences;
};

// Create notification based on event and preferences
export const createNotification = (eventData, userPreferences) => {
  const { type, userId, familyId, title, message, data = {} } = eventData;
  
  // Find user preference for this notification type
  const preference = userPreferences.find(pref => 
    pref.type === type && 
    pref.userId === userId
  );
  
  if (!preference || !preference.enabled) {
    return null; // User has disabled this notification type
  }
  
  // Check if notification should be sent based on frequency
  if (!preference.shouldSend(preference.lastSent)) {
    return null;
  }
  
  // Create the notification
  const notification = new Notification({
    userId,
    familyId,
    type,
    title,
    message,
    data,
    channels: preference.channels,
    priority: preference.priority,
    actionable: data.actionable || false,
    actionUrl: data.actionUrl,
    actionData: data.actionData,
    expiresAt: data.expiresAt
  });
  
  // Schedule notification if needed
  if (preference.advanceHours > 0 && data.scheduledTime) {
    const scheduledTime = new Date(data.scheduledTime);
    scheduledTime.setHours(scheduledTime.getHours() - preference.advanceHours);
    notification.scheduledFor = scheduledTime;
  }
  
  return notification;
};

// Batch create notifications for family
export const createFamilyNotifications = (eventData, familyPreferences) => {
  const { type, familyId, title, message, data = {}, excludeUsers = [] } = eventData;
  
  const notifications = [];
  
  // Find all users in family with preferences for this notification type
  const relevantPreferences = familyPreferences.filter(pref => 
    pref.type === type && 
    pref.familyId === familyId &&
    pref.enabled &&
    !excludeUsers.includes(pref.userId)
  );
  
  relevantPreferences.forEach(preference => {
    if (preference.shouldSend(preference.lastSent)) {
      const notification = new Notification({
        userId: preference.userId,
        familyId,
        type,
        title,
        message,
        data,
        channels: preference.channels,
        priority: preference.priority,
        actionable: data.actionable || false,
        actionUrl: data.actionUrl,
        actionData: data.actionData,
        expiresAt: data.expiresAt
      });
      
      notifications.push(notification);
    }
  });
  
  return notifications;
};

// Get pending notifications to send
export const getPendingNotifications = (notifications) => {
  return notifications.filter(notification => 
    notification.shouldSendNow() && 
    !notification.isExpired()
  ).sort((a, b) => {
    // Sort by priority (higher first) then by creation time
    const priorityA = a.getPriorityInfo().value;
    const priorityB = b.getPriorityInfo().value;
    
    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }
    
    const timeA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const timeB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    
    return timeA - timeB;
  });
};

// Get notification statistics
export const getNotificationStats = (notifications, dateRange = null) => {
  let relevantNotifications = notifications;
  
  if (dateRange) {
    const { startDate, endDate } = dateRange;
    relevantNotifications = notifications.filter(notification => {
      const createdDate = notification.createdAt.toDate ? 
        notification.createdAt.toDate() : 
        new Date(notification.createdAt);
      return createdDate >= startDate && createdDate <= endDate;
    });
  }
  
  const stats = {
    total: relevantNotifications.length,
    byStatus: {},
    byType: {},
    byPriority: {},
    byChannel: {},
    deliveryRate: 0,
    readRate: 0,
    averageDeliveryTime: 0
  };
  
  relevantNotifications.forEach(notification => {
    // Count by status
    stats.byStatus[notification.status] = (stats.byStatus[notification.status] || 0) + 1;
    
    // Count by type
    stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
    
    // Count by priority
    stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
    
    // Count by channels
    notification.channels.forEach(channel => {
      stats.byChannel[channel] = (stats.byChannel[channel] || 0) + 1;
    });
  });
  
  // Calculate rates
  const sentNotifications = relevantNotifications.filter(n => 
    [NOTIFICATION_CONFIG.STATUS.SENT, NOTIFICATION_CONFIG.STATUS.DELIVERED, NOTIFICATION_CONFIG.STATUS.READ]
    .includes(n.status)
  );
  
  const deliveredNotifications = relevantNotifications.filter(n => 
    [NOTIFICATION_CONFIG.STATUS.DELIVERED, NOTIFICATION_CONFIG.STATUS.READ]
    .includes(n.status)
  );
  
  const readNotifications = relevantNotifications.filter(n => 
    n.status === NOTIFICATION_CONFIG.STATUS.READ
  );
  
  stats.deliveryRate = sentNotifications.length > 0 ? 
    (deliveredNotifications.length / sentNotifications.length) * 100 : 0;
  
  stats.readRate = deliveredNotifications.length > 0 ? 
    (readNotifications.length / deliveredNotifications.length) * 100 : 0;
  
  // Calculate average delivery time
  const deliveryTimes = deliveredNotifications
    .filter(n => n.sentAt && n.deliveredAt)
    .map(n => {
      const sent = n.sentAt.toDate ? n.sentAt.toDate() : new Date(n.sentAt);
      const delivered = n.deliveredAt.toDate ? n.deliveredAt.toDate() : new Date(n.deliveredAt);
      return delivered - sent;
    });
  
  if (deliveryTimes.length > 0) {
    stats.averageDeliveryTime = deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length;
  }
  
  return stats;
};

// Update notification preference
export const updateNotificationPreference = (preferences, userId, type, updates) => {
  const preference = preferences.find(pref => 
    pref.userId === userId && pref.type === type
  );
  
  if (preference) {
    preference.update(updates);
    return preference;
  }
  
  return null;
};

// Format notification message with dynamic data
export const formatNotificationMessage = (template, data) => {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key] || match;
  });
};

// Generate notification templates
export const getNotificationTemplate = (type, eventData) => {
  const templates = {
    [NOTIFICATION_CONFIG.TYPES.QUEST_REMINDER]: {
      title: 'Quest Reminder',
      message: 'Don\'t forget to complete "{questTitle}" before {deadline}!',
      actionable: true,
      actionUrl: '/quests/{questId}'
    },
    [NOTIFICATION_CONFIG.TYPES.LEVEL_UP]: {
      title: 'Level Up!',
      message: 'Congratulations! You\'ve reached level {newLevel} - {levelTitle}!',
      actionable: true,
      actionUrl: '/profile'
    },
    [NOTIFICATION_CONFIG.TYPES.BADGE_EARNED]: {
      title: 'New Badge Earned!',
      message: 'You\'ve earned the "{badgeName}" badge! {badgeDescription}',
      actionable: true,
      actionUrl: '/badges'
    },
    [NOTIFICATION_CONFIG.TYPES.STREAK_WARNING]: {
      title: 'Streak at Risk!',
      message: 'Your {streakLength}-day streak will break in {hoursRemaining} hours. Complete a quest to keep it going!',
      actionable: true,
      actionUrl: '/quests'
    },
    [NOTIFICATION_CONFIG.TYPES.FAMILY_GOAL]: {
      title: 'Family Goal Update',
      message: '{goalTitle}: {progressMessage}',
      actionable: true,
      actionUrl: '/family-goals/{goalId}'
    }
  };
  
  const template = templates[type];
  if (!template) return null;
  
  return {
    title: formatNotificationMessage(template.title, eventData),
    message: formatNotificationMessage(template.message, eventData),
    actionable: template.actionable,
    actionUrl: template.actionUrl ? formatNotificationMessage(template.actionUrl, eventData) : null
  };
};

// Export configuration and defaults
export const NotificationConfig = {
  NOTIFICATION_CONFIG,
  DEFAULT_PREFERENCES
};

export default {
  NotificationPreference,
  Notification,
  initializeUserNotificationPreferences,
  createNotification,
  createFamilyNotifications,
  getPendingNotifications,
  getNotificationStats,
  updateNotificationPreference,
  formatNotificationMessage,
  getNotificationTemplate,
  NotificationConfig
};