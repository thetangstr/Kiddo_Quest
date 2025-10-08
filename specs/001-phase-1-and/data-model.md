# Data Model: Phase 1 & 2 Implementation

**Feature**: Core Experience Enhancement and Parent Tools  
**Date**: 2025-01-02  
**Based On**: Feature spec requirements and research findings

## Entity Relationship Diagram
```
User (extended)
  ├── ChildProfile (extended) 1:N
  │   ├── Level 1:1
  │   ├── Badge N:M
  │   ├── Streak 1:N
  │   └── QuestCompletion N:M
  ├── Quest (extended) N:M
  │   ├── QuestCategory 1:1
  │   ├── QuestDifficulty 1:1
  │   ├── QuestSchedule 1:1
  │   └── PhotoVerification 1:N
  ├── Reward (extended) N:M
  │   └── DynamicPricing 1:1
  ├── FamilyGoal 1:N
  ├── AnalyticsReport 1:N
  └── PenaltyRule 1:N
```

## Core Entities

### ChildProfile (Extended)
```javascript
{
  id: string,
  parentId: string,
  name: string,
  avatar: string,
  // NEW FIELDS
  age: number,                    // Required for theming
  birthDate: timestamp,           // For age calculation
  level: number,                  // Current level (1-20+)
  currentXP: number,              // XP in current level
  totalXP: number,                // All-time XP earned
  badges: string[],               // Array of badge IDs
  activeStreak: number,           // Current daily streak
  longestStreak: number,          // Personal record
  theme: string,                  // 'adventure' | 'hero' | 'champion'
  soundEnabled: boolean,          // Sound effects preference
  notificationsEnabled: boolean,  // Push notifications
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Level
```javascript
{
  id: string,
  number: number,               // 1-20+
  title: string,                // "Beginner", "Expert", etc.
  xpRequired: number,           // XP needed to reach this level
  xpToNext: number,            // XP needed for next level
  privileges: string[],         // Unlocked features
  icon: string,                // Level badge image URL
  color: string,               // Theme color for level
  celebrationAnimation: string // Animation type on level up
}
```

### Badge
```javascript
{
  id: string,
  name: string,                // "Week Warrior"
  description: string,         // "Complete quests 7 days in a row"
  category: string,            // 'consistency' | 'achievement' | 'helping' | 'speed' | 'teamwork'
  tier: number,                // 1 (bronze), 2 (silver), 3 (gold)
  criteria: {
    type: string,              // 'streak' | 'xp' | 'quests' | 'time' | 'family'
    target: number,            // Numeric target
    period?: string            // 'daily' | 'weekly' | 'alltime'
  },
  icon: string,                // Badge image URL
  rarity: string,              // 'common' | 'rare' | 'epic'
  earnedBy: string[],          // Array of child IDs who earned it
  createdAt: timestamp
}
```

### Streak
```javascript
{
  id: string,
  childId: string,
  type: string,                // 'daily' | 'weekly' | 'category'
  startDate: timestamp,        // When streak began
  lastActivityDate: timestamp, // Last quest completion
  count: number,               // Current streak count
  category?: string,           // Optional: specific category
  broken: boolean,             // If streak was broken
  brokenDate?: timestamp       // When streak was broken
}
```

### Quest (Extended)
```javascript
{
  id: string,
  title: string,
  description: string,
  xpReward: number,
  // NEW FIELDS
  category: string,            // 'chores' | 'homework' | 'behavior' | 'creativity'
  difficulty: string,          // 'easy' | 'medium' | 'hard'
  xpMultiplier: number,        // Based on difficulty (1.0, 1.5, 2.0)
  templateId?: string,         // If created from template
  schedule: {
    type: string,              // 'once' | 'daily' | 'weekly' | 'custom'
    daysOfWeek?: number[],     // [0-6] for Sunday-Saturday
    time?: string,             // "14:00" for 2 PM
    reminder: boolean,         // Send notification reminder
    reminderMinutes: number    // Minutes before due time
  },
  photoRequired: boolean,      // Requires photo verification
  isQuestOfDay: boolean,       // Featured quest with bonus
  createdAt: timestamp,
  dueDate?: timestamp,
  completedAt?: timestamp
}
```

### QuestTemplate
```javascript
{
  id: string,
  title: string,
  description: string,
  category: string,
  suggestedXP: number,
  suggestedDifficulty: string,
  suggestedSchedule: object,
  ageRange: {
    min: number,
    max: number
  },
  popularity: number,          // Usage count
  icon: string
}
```

### PhotoVerification
```javascript
{
  id: string,
  questId: string,
  childId: string,
  imageUrl: string,            // Firebase Storage URL
  thumbnailUrl: string,        // Smaller version
  caption?: string,            // Optional child comment
  verifiedBy?: string,         // Parent who verified
  verifiedAt?: timestamp,
  uploadedAt: timestamp
}
```

### Reward (Extended)
```javascript
{
  id: string,
  title: string,
  description: string,
  xpCost: number,
  // NEW FIELDS
  dynamicPricing: {
    enabled: boolean,
    minCost: number,
    maxCost: number,
    currentMultiplier: number  // Adjustable by parent
  },
  availableCount?: number,     // Limited quantity
  expiresAt?: timestamp,       // Time-limited rewards
  requiredLevel?: number,      // Minimum level to redeem
  category: string,            // For analytics
  redemptionCount: number,     // Times redeemed
  lastRedeemedAt?: timestamp
}
```

### PenaltyRule
```javascript
{
  id: string,
  familyId: string,
  name: string,                // "Missed homework penalty"
  enabled: boolean,
  trigger: {
    type: string,              // 'missed_quest' | 'behavior' | 'manual'
    questCategory?: string,    // Specific category
    timeframe: string          // 'immediately' | 'daily' | 'weekly'
  },
  penalty: {
    type: string,              // 'xp_deduction' | 'reward_lock' | 'redemption_quest'
    amount?: number,           // XP to deduct
    lockedRewardId?: string,   // Specific reward to lock
    redemptionQuestId?: string // Quest to complete for redemption
  },
  appliedTo: string[],         // Child IDs affected
  createdBy: string,           // Parent ID
  createdAt: timestamp
}
```

### FamilyGoal
```javascript
{
  id: string,
  familyId: string,
  title: string,               // "Complete 100 quests together"
  description: string,
  target: {
    type: string,              // 'quests' | 'xp' | 'streak' | 'custom'
    value: number,
    period: string             // 'week' | 'month' | 'alltime'
  },
  progress: {
    current: number,
    contributions: [{
      childId: string,
      amount: number
    }]
  },
  reward: {
    type: string,              // 'badge' | 'xp_bonus' | 'special_reward'
    value: any
  },
  startDate: timestamp,
  endDate?: timestamp,
  completedAt?: timestamp,
  active: boolean
}
```

### AnalyticsReport
```javascript
{
  id: string,
  familyId: string,
  period: {
    type: string,              // 'daily' | 'weekly' | 'monthly'
    startDate: timestamp,
    endDate: timestamp
  },
  metrics: {
    completionRate: number,    // Percentage
    totalQuests: number,
    completedQuests: number,
    totalXPEarned: number,
    categoryBreakdown: [{
      category: string,
      count: number,
      percentage: number
    }],
    timeDistribution: [{
      hour: number,
      completions: number
    }],
    childPerformance: [{
      childId: string,
      completionRate: number,
      xpEarned: number,
      streakDays: number,
      badgesEarned: number
    }],
    trends: {
      completionTrend: string, // 'up' | 'down' | 'stable'
      xpTrend: string,
      engagementScore: number  // 0-100
    }
  },
  insights: [{
    type: string,              // 'suggestion' | 'achievement' | 'concern'
    message: string,
    priority: string           // 'low' | 'medium' | 'high'
  }],
  generatedAt: timestamp
}
```

### NotificationPreference
```javascript
{
  id: string,
  userId: string,              // Parent or child ID
  channel: {
    push: boolean,
    email: boolean,
    inApp: boolean
  },
  types: {
    morningMotivation: boolean,
    questReminders: boolean,
    eveningSummary: boolean,
    achievements: boolean,
    weeklyReport: boolean
  },
  schedule: {
    morningTime: string,       // "07:00"
    eveningTime: string,       // "19:00"
    timezone: string           // "America/New_York"
  },
  quietHours: {
    enabled: boolean,
    start: string,             // "21:00"
    end: string                // "07:00"
  }
}
```

## State Transitions

### Level Progression
```
XP Earned → Check Threshold → Level Up? → 
  Yes: Update Level, Show Celebration, Check Unlocks
  No: Update Current XP
```

### Streak Tracking
```
Quest Completed → Check Last Activity → 
  Same Day: Maintain Streak
  Next Day: Increment Streak, Check Badge
  Missed Day: Break Streak, Start New
```

### Badge Earning
```
Activity → Check Criteria → Met? →
  Yes: Award Badge, Notification, Update Profile
  No: Track Progress
```

### Penalty Application
```
Quest Due → Missed? → Check Rules →
  Rule Exists: Apply Penalty, Create Redemption
  No Rule: Log Only
```

## Validation Rules

### ChildProfile
- Age: 4-18 years
- Name: 1-50 characters
- Theme: Must match age group
- Level: Cannot decrease
- XP: Cannot be negative

### Quest
- Title: Required, 1-100 characters
- XP Reward: 5-500 range
- Category: Must be valid enum
- Schedule: Valid cron expression
- Due date: Must be future

### Badge
- Unique per child
- Tier progression required (1→2→3)
- Criteria must be measurable
- Cannot be removed once earned

### Streak
- Only one active per type
- Cannot be manually edited
- Breaks reset to 0

### Analytics
- Period cannot exceed 90 days
- Metrics calculated async
- Reports cached for 24 hours

## Indexes (Firestore)

```javascript
// Composite indexes needed
childProfiles: [parentId, level]
quests: [familyId, category, dueDate]
badges: [category, tier]
streaks: [childId, type, broken]
analyticsReports: [familyId, period.type, generatedAt]
penaltyRules: [familyId, enabled]
familyGoals: [familyId, active]
```

## Migration Strategy

1. Add new fields with defaults
2. Backfill age from existing data
3. Calculate initial levels from totalXP
4. Create starter badges retroactively
5. Initialize streaks from recent activity
6. Generate first analytics reports

---
*Data model complete. Ready for API contract generation.*