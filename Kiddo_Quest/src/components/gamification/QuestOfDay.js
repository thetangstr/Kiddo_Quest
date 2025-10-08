import React, { useState, useEffect } from 'react';
import { calculateXPWithBonuses } from '../../utils/xpCalculator';

const QuestOfDay = ({ 
  quest = null, 
  onAccept = () => {}, 
  onComplete = () => {}, 
  isCompleted = false,
  isAvailable = true,
  timeUntilReset = null,
  className = ''
}) => {
  const [timeRemaining, setTimeRemaining] = useState(timeUntilReset);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!timeUntilReset) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1000) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeUntilReset]);

  useEffect(() => {
    if (quest && isAvailable && !isCompleted) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000);
    }
  }, [quest, isAvailable, isCompleted]);

  if (!quest) {
    return (
      <div className={`quest-of-day ${className}`}>
        <div className="no-quest bg-white rounded-lg p-6 shadow-sm text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Quest of the Day</h3>
          <p className="text-gray-600 text-sm">No special quest available today.</p>
          <p className="text-gray-500 text-xs mt-2">Check back tomorrow for a new challenge!</p>
        </div>
      </div>
    );
  }

  const bonusXP = calculateXPWithBonuses(quest.baseXP || 0, { isQuestOfDay: true }) - (quest.baseXP || 0);

  return (
    <div className={`quest-of-day ${className}`}>
      <div className={`quest-card bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6 shadow-lg border-2 border-yellow-200 relative overflow-hidden ${
        isAnimating ? 'animate-pulse' : ''
      }`}>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-yellow-200 to-transparent rounded-bl-full opacity-50" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-orange-200 to-transparent rounded-tr-full opacity-50" />
        
        {/* Special badge */}
        <div className="absolute top-3 right-3">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            ⭐ DAILY
          </div>
        </div>

        {/* Header */}
        <div className="quest-header mb-4">
          <div className="flex items-start gap-3">
            <div className={`quest-icon text-3xl ${isAnimating ? 'animate-bounce' : ''}`}>
              {quest.icon || '🎯'}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800 mb-1">
                Quest of the Day
              </h3>
              <h4 className="text-lg font-semibold text-yellow-700">
                {quest.title}
              </h4>
            </div>
          </div>
        </div>

        {/* Quest description */}
        <div className="quest-description mb-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            {quest.description}
          </p>
        </div>

        {/* Rewards section */}
        <div className="rewards-section mb-4">
          <div className="bg-white bg-opacity-70 rounded-lg p-3">
            <h5 className="text-sm font-semibold text-gray-700 mb-2">🎁 Special Rewards</h5>
            <div className="grid grid-cols-2 gap-3">
              <div className="reward-item text-center">
                <div className="text-lg font-bold text-blue-600">
                  {quest.baseXP + bonusXP} XP
                </div>
                <div className="text-xs text-gray-600">
                  Base: {quest.baseXP} <span className="text-orange-600">+{bonusXP} Bonus!</span>
                </div>
              </div>
              {quest.specialReward && (
                <div className="reward-item text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {quest.specialReward.amount}
                  </div>
                  <div className="text-xs text-gray-600">
                    {quest.specialReward.type}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Difficulty and category */}
        <div className="quest-meta mb-4">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Difficulty:</span>
              <div className={`difficulty-badge px-2 py-1 rounded-full text-xs font-medium ${
                quest.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                quest.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {quest.difficulty?.toUpperCase() || 'MEDIUM'}
              </div>
            </div>
            <div className="text-gray-600">
              📂 {quest.category || 'General'}
            </div>
          </div>
        </div>

        {/* Time remaining */}
        {timeRemaining && timeRemaining > 0 && (
          <div className="time-remaining mb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
              <div className="text-sm font-medium text-red-700">
                ⏰ Time Remaining: {formatTimeRemaining(timeRemaining)}
              </div>
              <div className="text-xs text-red-600">
                Complete before it resets!
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="action-section">
          {isCompleted ? (
            <div className="completed-state bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <div className="text-green-600 font-medium mb-1">
                ✅ Quest Completed!
              </div>
              <div className="text-green-700 text-sm">
                Great job! You earned the daily bonus!
              </div>
            </div>
          ) : isAvailable ? (
            <div className="available-actions space-y-2">
              <button
                onClick={() => onAccept(quest)}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 hover:from-yellow-500 hover:to-orange-600 transform hover:scale-105 active:scale-95"
              >
                🚀 Accept Daily Quest
              </button>
              <div className="text-center text-xs text-gray-600">
                Complete for 50% bonus XP!
              </div>
            </div>
          ) : (
            <div className="unavailable-state bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <div className="text-gray-600 font-medium mb-1">
                ⏳ Quest Already Accepted
              </div>
              <div className="text-gray-500 text-sm">
                Complete your current quest to finish this challenge
              </div>
              <button
                onClick={() => onComplete(quest)}
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
              >
                Mark Complete
              </button>
            </div>
          )}
        </div>

        {/* Quest of the day explanation */}
        <div className="explanation mt-4 pt-3 border-t border-yellow-200">
          <div className="text-xs text-gray-600 text-center">
            💡 Daily quests reset every 24 hours and offer special bonuses!
          </div>
        </div>
      </div>
    </div>
  );
};

const formatTimeRemaining = (milliseconds) => {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

export default QuestOfDay;