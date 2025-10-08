# Gamification Components

This directory contains React components for the KiddoQuest gamification system. These components provide an engaging and interactive experience for children completing quests and earning rewards.

## Components Overview

### 1. BadgeGallery.js
Displays earned badges and progress towards unlocking new ones.

**Props:**
- `badges` (array): Array of badge objects
- `userStats` (object): User statistics for calculating progress
- `showProgress` (boolean): Show progress bars for locked badges
- `showCategories` (boolean): Show category filters
- `compact` (boolean): Compact display mode
- `maxDisplay` (number): Maximum number of badges to show
- `className` (string): Additional CSS classes

**Features:**
- Filter by category, rarity, or unlock status
- Progress tracking for locked badges
- Tooltips with badge details
- Responsive grid layout
- Compact mode for dashboard widgets

**Usage:**
```jsx
import { BadgeGallery } from './components/gamification';

<BadgeGallery 
  badges={userBadges}
  userStats={userStats}
  showProgress={true}
  maxDisplay={12}
/>
```

### 2. StreakCounter.js
Shows current quest streak with fire animations and milestone tracking.

**Props:**
- `streak` (object): Streak object from streakTracker utility
- `compact` (boolean): Compact display mode
- `showFire` (boolean): Show fire icon animations
- `showMessage` (boolean): Show encouragement messages
- `showNextMilestone` (boolean): Show progress to next milestone
- `animated` (boolean): Enable animations
- `className` (string): Additional CSS classes

**Features:**
- Dynamic fire icons based on streak length
- Milestone progress tracking
- Streak protection (freeze) options
- Animated spark effects for long streaks
- Status messages and warnings

**Usage:**
```jsx
import { StreakCounter } from './components/gamification';

<StreakCounter 
  streak={userStreak}
  showFire={true}
  showNextMilestone={true}
/>
```

### 3. XPProgressBar.js
Animated XP progress bar with level information.

**Props:**
- `currentXP` (number): Current XP amount
- `showLevel` (boolean): Show level badge
- `showXPNumbers` (boolean): Show XP numbers
- `showNextLevel` (boolean): Show next level info
- `animated` (boolean): Enable animations
- `compact` (boolean): Compact display mode
- `recentXPGain` (number): Recent XP gain for animation
- `className` (string): Additional CSS classes

**Features:**
- Smooth XP counting animations
- Level progress visualization
- Recent XP gain highlighting
- Shimmer effects on progress bar
- Max level achievement display

**Usage:**
```jsx
import { XPProgressBar } from './components/gamification';

<XPProgressBar 
  currentXP={1250}
  recentXPGain={50}
  animated={true}
/>
```

### 4. LevelUpCelebration.js
Full-screen celebration animation for level ups.

**Props:**
- `newLevel` (number): The new level achieved
- `oldLevel` (number): Previous level
- `newPrivileges` (array): New privileges unlocked
- `isVisible` (boolean): Show/hide the celebration
- `onComplete` (function): Callback when animation completes
- `duration` (number): Animation duration in milliseconds
- `className` (string): Additional CSS classes

**Features:**
- Confetti particle effects
- Special animations for milestone levels
- New privilege reveals
- Auto-dismissal with customizable duration
- Responsive design for all screen sizes

**Usage:**
```jsx
import { LevelUpCelebration } from './components/gamification';

<LevelUpCelebration 
  newLevel={5}
  oldLevel={4}
  newPrivileges={['bonus_multiplier', 'quest_templates']}
  isVisible={showCelebration}
  onComplete={() => setShowCelebration(false)}
/>
```

### 5. QuestOfDay.js
Featured daily quest component with special bonuses.

**Props:**
- `quest` (object): Quest object with special daily properties
- `onAccept` (function): Callback when quest is accepted
- `onComplete` (function): Callback when quest is completed
- `isCompleted` (boolean): Whether the quest is completed
- `isAvailable` (boolean): Whether the quest is available
- `timeUntilReset` (number): Milliseconds until quest resets
- `className` (string): Additional CSS classes

**Features:**
- Special daily quest styling
- Countdown timer until reset
- Bonus XP calculation and display
- Different states (available, accepted, completed)
- Special reward highlights

**Usage:**
```jsx
import { QuestOfDay } from './components/gamification';

<QuestOfDay 
  quest={dailyQuest}
  isAvailable={true}
  timeUntilReset={18 * 60 * 60 * 1000}
  onAccept={handleAcceptQuest}
  onComplete={handleCompleteQuest}
/>
```

### 6. PhotoUpload.js
Photo upload and verification component for quest completion.

**Props:**
- `onUpload` (function): Callback when photos are uploaded
- `onVerificationSubmit` (function): Callback for verification submission
- `questId` (string): ID of the associated quest
- `questTitle` (string): Title of the quest
- `allowMultiple` (boolean): Allow multiple photo uploads
- `maxFiles` (number): Maximum number of files allowed
- `isRequired` (boolean): Whether photo verification is required
- `currentPhotos` (array): Currently uploaded photos
- `isVerificationMode` (boolean): Enable verification workflow
- `className` (string): Additional CSS classes

**Features:**
- Drag and drop support
- Automatic image compression
- Progress tracking during upload
- File preview with remove functionality
- Mobile camera integration
- Verification workflow for quest completion

**Usage:**
```jsx
import { PhotoUpload } from './components/gamification';

<PhotoUpload 
  questTitle="Clean Your Room"
  allowMultiple={true}
  maxFiles={3}
  isVerificationMode={true}
  onUpload={handlePhotoUpload}
  onVerificationSubmit={handleVerification}
/>
```

## Styling

All components use Tailwind CSS for styling with custom animations defined in `gamification.css`. The styling includes:

- Responsive breakpoints for mobile, tablet, and desktop
- Dark mode support where applicable
- Accessibility considerations (reduced motion support)
- Print styles for relevant components

## Dependencies

- React (hooks and functional components)
- Tailwind CSS (styling)
- browser-image-compression (PhotoUpload component)
- Utility functions from `../../utils/` directory

## Integration with Store

Components are designed to work with the Zustand store pattern used in KiddoQuest:

```jsx
// Example integration
import { useKiddoQuestStore } from '../../store';
import { XPProgressBar, StreakCounter } from './components/gamification';

const Dashboard = () => {
  const { childProfiles, selectedChildIdForDashboard } = useKiddoQuestStore();
  const currentChild = childProfiles.find(c => c.id === selectedChildIdForDashboard);
  
  return (
    <div>
      <XPProgressBar currentXP={currentChild.totalXP} />
      <StreakCounter streak={currentChild.streak} />
    </div>
  );
};
```

## Animation Performance

Components include performance optimizations:

- CSS transforms for better performance
- RequestAnimationFrame for smooth animations
- Reduced motion support for accessibility
- Debounced state updates for rapid changes

## Testing

To test components, use the `GamificationDemo.js` component which provides an interactive showcase of all features:

```jsx
import GamificationDemo from './components/gamification/GamificationDemo';

// Use in development to test all components
<GamificationDemo />
```

## Browser Support

Components are designed to work in modern browsers with:
- ES6+ support
- CSS Grid and Flexbox
- FileReader API (PhotoUpload)
- Canvas API (image compression)