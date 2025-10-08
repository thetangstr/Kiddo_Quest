import React, { useState, useEffect } from 'react';
import { 
  getStreakMessage, 
  formatStreakDays, 
  getStreakMilestones,
  calculateStreakBonus 
} from '../../utils/streakTracker';

const StreakCounter = ({ 
  streak = null, 
  compact = false, 
  showFire = true, 
  showMessage = true,
  showNextMilestone = true,
  animated = true,
  className = ''
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousStreak, setPreviousStreak] = useState(0);

  useEffect(() => {
    if (streak && streak.currentStreak > previousStreak) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }
    setPreviousStreak(streak?.currentStreak || 0);
  }, [streak?.currentStreak, previousStreak]);

  if (!streak) {
    return (
      <div className={`streak-counter ${compact ? 'compact' : ''} ${className}`}>
        <div className="no-streak text-center py-4">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-gray-600">Start your quest streak today!</p>
        </div>
      </div>
    );
  }

  const status = streak.getStatus();
  const nextMilestone = streak.getNextMilestone();
  const message = getStreakMessage(streak);

  if (compact) {
    return (
      <div className={`streak-counter-compact flex items-center gap-3 ${className}`}>
        {showFire && (
          <div className={`fire-icon text-2xl ${isAnimating ? 'animate-bounce' : ''}`}>
            {streak.isActive ? getFireIcon(streak.currentStreak) : '🔥'}
          </div>
        )}
        <div className="streak-info">
          <div className="text-lg font-bold">
            {streak.isActive ? streak.currentStreak : 0} day{streak.currentStreak !== 1 ? 's' : ''}
          </div>
          <div className="text-xs text-gray-500">
            {streak.isActive ? 'Current Streak' : 'No Active Streak'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`streak-counter bg-white rounded-lg p-4 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Quest Streak</h3>
        {streak.isActive && (
          <div className="flex items-center gap-1 text-sm text-green-600">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Active
          </div>
        )}
      </div>

      {/* Main streak display */}
      <div className="streak-display text-center mb-4">
        {showFire && (
          <div className={`fire-container mb-3 ${isAnimating ? 'animate-bounce' : ''} ${animated ? 'transition-all duration-300' : ''}`}>
            <div className="fire-icon text-6xl">
              {streak.isActive ? getFireIcon(streak.currentStreak) : '🌙'}
            </div>
            {streak.isActive && streak.currentStreak >= 7 && (
              <div className="fire-effects">
                <div className="spark spark-1">✨</div>
                <div className="spark spark-2">⭐</div>
                <div className="spark spark-3">💫</div>
              </div>
            )}
          </div>
        )}

        <div className={`streak-number ${isAnimating ? 'animate-pulse' : ''}`}>
          <div className="text-4xl font-bold text-gray-800 mb-1">
            {streak.isActive ? streak.currentStreak : 0}
          </div>
          <div className="text-sm text-gray-600">
            {formatStreakDays(streak.currentStreak || 0)}
          </div>
        </div>

        {/* Streak multiplier */}
        {streak.isActive && streak.streakMultiplier > 1 && (
          <div className="multiplier-badge bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium mt-2 inline-block">
            {streak.streakMultiplier}x XP Bonus!
          </div>
        )}
      </div>

      {/* Status message */}
      {showMessage && (
        <div className={`streak-message text-center mb-4 ${getMessageStyle(status.status)}`}>
          <p className="text-sm">{message}</p>
          
          {status.status === 'active' && status.daysUntilBreak === 0 && (
            <div className="warning mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              ⚠️ Complete a quest today to keep your streak alive!
            </div>
          )}
        </div>
      )}

      {/* Progress to next milestone */}
      {showNextMilestone && nextMilestone && streak.isActive && (
        <div className="next-milestone mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Next: {nextMilestone.title}</span>
            <span>{streak.currentStreak} / {nextMilestone.days}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(streak.currentStreak / nextMilestone.days) * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1 text-center">
            {nextMilestone.days - streak.currentStreak} more days to earn {nextMilestone.reward} XP
            {nextMilestone.badge && ' + badge!'}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="stats-row grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        <div className="stat text-center">
          <div className="text-lg font-bold text-purple-600">
            {streak.longestStreak}
          </div>
          <div className="text-xs text-gray-500">Best Streak</div>
        </div>
        <div className="stat text-center">
          <div className="text-lg font-bold text-blue-600">
            {streak.totalQuestsInStreak || 0}
          </div>
          <div className="text-xs text-gray-500">Total Quests</div>
        </div>
      </div>

      {/* Freeze option */}
      {streak.isActive && status.canFreeze && (
        <div className="freeze-option mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-800">Streak Protection</div>
              <div className="text-xs text-blue-600">Freeze your streak for 50 XP</div>
            </div>
            <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">
              ❄️ Freeze
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const getFireIcon = (streakDays) => {
  if (streakDays >= 100) return '🌟'; // Star for 100+ days
  if (streakDays >= 30) return '🔥'; // Fire for 30+ days
  if (streakDays >= 14) return '🚀'; // Rocket for 14+ days
  if (streakDays >= 7) return '⚡'; // Lightning for 7+ days
  if (streakDays >= 3) return '🔥'; // Fire for 3+ days
  return '🟡'; // Yellow circle for starting streak
};

const getMessageStyle = (status) => {
  switch (status) {
    case 'completed_today':
      return 'text-green-600';
    case 'active':
      return 'text-blue-600';
    case 'broken':
    case 'inactive':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
};

export default StreakCounter;