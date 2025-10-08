import React, { useState } from 'react';
import {
  BadgeGallery,
  StreakCounter,
  XPProgressBar,
  LevelUpCelebration,
  QuestOfDay,
  PhotoUpload
} from './index';
import { initializeUserBadges, checkBadgeUnlocks } from '../../utils/badgeManager';
import { initializeUserStreak, Streak } from '../../utils/streakTracker';

const GamificationDemo = () => {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [currentXP, setCurrentXP] = useState(750);
  const [demoPhotos, setDemoPhotos] = useState([]);

  // Mock data for demonstration
  const mockUserStats = {
    questsCompleted: 15,
    currentStreak: 5,
    totalXP: currentXP,
    level: 3,
    familyGoalsCompleted: 2,
    hardQuestsCompleted: 1,
    weekendQuests: 3
  };

  const mockBadges = initializeUserBadges();
  const { allBadges } = checkBadgeUnlocks(mockUserStats, mockBadges);

  const mockStreak = new Streak({
    userId: 'demo-user',
    currentStreak: 5,
    longestStreak: 12,
    isActive: true,
    lastCompletionDate: new Date(),
    streakStartDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    streakMultiplier: 1.1,
    totalQuestsInStreak: 8
  });

  const mockQuestOfDay = {
    id: 'qod-demo',
    title: 'Clean Your Room Thoroughly',
    description: 'Make your bed, organize your desk, and put away all clothes. Take a photo when complete!',
    icon: '🧹',
    baseXP: 100,
    difficulty: 'medium',
    category: 'Chores',
    specialReward: {
      type: 'Bonus Points',
      amount: '50'
    }
  };

  const handleXPIncrease = () => {
    setCurrentXP(prev => prev + 150);
  };

  const handleLevelUpTest = () => {
    setShowLevelUp(true);
  };

  const handlePhotoUpload = (photos) => {
    setDemoPhotos(photos);
    console.log('Photos uploaded:', photos);
  };

  return (
    <div className="gamification-demo p-6 max-w-7xl mx-auto">
      <div className="demo-header mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🎮 Gamification Components Demo
        </h1>
        <p className="text-gray-600">
          Interactive showcase of all gamification components
        </p>
      </div>

      {/* Demo Controls */}
      <div className="demo-controls bg-gray-50 rounded-lg p-4 mb-8">
        <h2 className="text-lg font-semibold mb-3">Demo Controls</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleXPIncrease}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            +150 XP
          </button>
          <button
            onClick={handleLevelUpTest}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
          >
            Test Level Up
          </button>
          <button
            onClick={() => setCurrentXP(0)}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            Reset XP
          </button>
        </div>
      </div>

      {/* Component Showcase Grid */}
      <div className="components-showcase space-y-8">
        
        {/* XP Progress Bar */}
        <section className="component-section">
          <h2 className="text-xl font-bold mb-4">XP Progress Bar</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Full Version</h3>
              <XPProgressBar 
                currentXP={currentXP}
                recentXPGain={currentXP > 750 ? currentXP - 750 : 0}
                animated={true}
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Compact Version</h3>
              <XPProgressBar 
                currentXP={currentXP}
                compact={true}
                showXPNumbers={true}
              />
            </div>
          </div>
        </section>

        {/* Streak Counter */}
        <section className="component-section">
          <h2 className="text-xl font-bold mb-4">Streak Counter</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Full Version</h3>
              <StreakCounter 
                streak={mockStreak}
                showFire={true}
                showMessage={true}
                showNextMilestone={true}
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Compact Version</h3>
              <StreakCounter 
                streak={mockStreak}
                compact={true}
              />
            </div>
          </div>
        </section>

        {/* Badge Gallery */}
        <section className="component-section">
          <h2 className="text-xl font-bold mb-4">Badge Gallery</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Full Gallery</h3>
              <BadgeGallery 
                badges={allBadges}
                userStats={mockUserStats}
                showProgress={true}
                maxDisplay={12}
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Compact Version</h3>
              <BadgeGallery 
                badges={allBadges.filter(b => b.isUnlocked)}
                compact={true}
              />
            </div>
          </div>
        </section>

        {/* Quest of the Day */}
        <section className="component-section">
          <h2 className="text-xl font-bold mb-4">Quest of the Day</h2>
          <QuestOfDay 
            quest={mockQuestOfDay}
            isAvailable={true}
            timeUntilReset={18 * 60 * 60 * 1000} // 18 hours
            onAccept={(quest) => console.log('Quest accepted:', quest)}
            onComplete={(quest) => console.log('Quest completed:', quest)}
          />
        </section>

        {/* Photo Upload */}
        <section className="component-section">
          <h2 className="text-xl font-bold mb-4">Photo Upload</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Single Photo Mode</h3>
              <PhotoUpload 
                questTitle="Clean Your Room"
                allowMultiple={false}
                onUpload={handlePhotoUpload}
                currentPhotos={demoPhotos.slice(0, 1)}
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Multi Photo with Verification</h3>
              <PhotoUpload 
                questTitle="Complete Chores"
                allowMultiple={true}
                maxFiles={3}
                isVerificationMode={true}
                isRequired={true}
                onUpload={handlePhotoUpload}
                onVerificationSubmit={(data) => console.log('Verification submitted:', data)}
                currentPhotos={demoPhotos}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Level Up Celebration */}
      <LevelUpCelebration 
        newLevel={4}
        oldLevel={3}
        newPrivileges={['bonus_multiplier', 'quest_templates']}
        isVisible={showLevelUp}
        onComplete={() => setShowLevelUp(false)}
      />

      {/* Demo Info */}
      <div className="demo-info mt-12 bg-blue-50 rounded-lg p-6">
        <h2 className="text-lg font-bold text-blue-800 mb-3">
          📋 Component Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <h3 className="font-semibold text-blue-700 mb-2">BadgeGallery</h3>
            <ul className="text-blue-600 space-y-1">
              <li>• Filter by category/rarity</li>
              <li>• Progress tracking</li>
              <li>• Tooltips with details</li>
              <li>• Compact mode available</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-blue-700 mb-2">StreakCounter</h3>
            <ul className="text-blue-600 space-y-1">
              <li>• Fire animations</li>
              <li>• Milestone tracking</li>
              <li>• Streak protection</li>
              <li>• Status messages</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-blue-700 mb-2">XPProgressBar</h3>
            <ul className="text-blue-600 space-y-1">
              <li>• Animated counting</li>
              <li>• Level progress</li>
              <li>• Recent XP gain effects</li>
              <li>• Responsive design</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-blue-700 mb-2">LevelUpCelebration</h3>
            <ul className="text-blue-600 space-y-1">
              <li>• Confetti animation</li>
              <li>• Privilege reveals</li>
              <li>• Special milestone effects</li>
              <li>• Auto-dismissal</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-blue-700 mb-2">QuestOfDay</h3>
            <ul className="text-blue-600 space-y-1">
              <li>• Special daily bonuses</li>
              <li>• Countdown timer</li>
              <li>• Reward preview</li>
              <li>• Difficulty indicators</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-blue-700 mb-2">PhotoUpload</h3>
            <ul className="text-blue-600 space-y-1">
              <li>• Drag & drop support</li>
              <li>• Image compression</li>
              <li>• Multiple file modes</li>
              <li>• Verification workflow</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamificationDemo;