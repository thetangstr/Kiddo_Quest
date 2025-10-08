import React, { useState, useEffect } from 'react';
import { getLevelDetails, formatXP, getLevelProgress } from '../../utils/xpCalculator';

const XPProgressBar = ({ 
  currentXP = 0, 
  showLevel = true, 
  showXPNumbers = true, 
  showNextLevel = true,
  animated = true, 
  compact = false,
  recentXPGain = 0,
  className = ''
}) => {
  const [displayXP, setDisplayXP] = useState(currentXP);
  const [isAnimatingGain, setIsAnimatingGain] = useState(false);
  const [levelDetails, setLevelDetails] = useState(getLevelDetails(currentXP));

  useEffect(() => {
    const newLevelDetails = getLevelDetails(currentXP);
    setLevelDetails(newLevelDetails);

    // Animate XP increase
    if (currentXP > displayXP) {
      setIsAnimatingGain(true);
      
      // Animate the number counting up
      const startXP = displayXP;
      const endXP = currentXP;
      const duration = 1500; // 1.5 seconds
      const startTime = Date.now();

      const animateXP = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Use easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startXP + (endXP - startXP) * easeOutQuart);
        
        setDisplayXP(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animateXP);
        } else {
          setIsAnimatingGain(false);
        }
      };
      
      requestAnimationFrame(animateXP);
    } else {
      setDisplayXP(currentXP);
    }
  }, [currentXP, displayXP]);

  const progress = getLevelProgress(displayXP);
  const progressWidth = Math.min(100, Math.max(0, progress));

  if (compact) {
    return (
      <div className={`xp-progress-bar-compact ${className}`}>
        <div className="flex items-center gap-2">
          {showLevel && (
            <div 
              className="level-badge w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: levelDetails.color }}
            >
              {levelDetails.level}
            </div>
          )}
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ${
                  isAnimatingGain ? 'animate-pulse' : ''
                }`}
                style={{ 
                  width: `${progressWidth}%`,
                  background: `linear-gradient(90deg, ${levelDetails.color}, ${levelDetails.color}dd)`
                }}
              />
            </div>
            {showXPNumbers && (
              <div className="text-xs text-gray-500 mt-1">
                {formatXP(levelDetails.currentXP)} / {formatXP(levelDetails.xpToNext)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`xp-progress-bar bg-white rounded-lg p-4 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {showLevel && (
            <div 
              className="level-display w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: levelDetails.color }}
            >
              {levelDetails.level}
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold">{levelDetails.title}</h3>
            <p className="text-sm text-gray-600">Level {levelDetails.level}</p>
          </div>
        </div>
        
        {/* XP Display */}
        <div className="text-right">
          <div className={`text-2xl font-bold ${isAnimatingGain ? 'animate-pulse' : ''}`}>
            {formatXP(displayXP)}
          </div>
          <p className="text-xs text-gray-500">Total XP</p>
        </div>
      </div>

      {/* Recent XP Gain Animation */}
      {recentXPGain > 0 && isAnimatingGain && (
        <div className="recent-xp-gain mb-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 animate-bounce">
            <div className="text-center">
              <span className="text-green-600 font-medium">+{recentXPGain} XP</span>
              <div className="text-xs text-green-500">Great job!</div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Section */}
      {!levelDetails.isMaxLevel && (
        <div className="progress-section mb-3">
          {showNextLevel && (
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress to Level {levelDetails.level + 1}</span>
              {showXPNumbers && (
                <span>
                  {formatXP(levelDetails.currentXP)} / {formatXP(levelDetails.xpToNext)}
                </span>
              )}
            </div>
          )}

          {/* Main progress bar */}
          <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            {/* Background gradient */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                background: `linear-gradient(90deg, ${levelDetails.color}40, ${levelDetails.color}20)`
              }}
            />
            
            {/* Progress fill */}
            <div 
              className={`relative h-full rounded-full transition-all duration-1000 ${
                animated ? 'ease-out' : ''
              } ${isAnimatingGain ? 'animate-pulse' : ''}`}
              style={{ 
                width: `${progressWidth}%`,
                background: `linear-gradient(90deg, ${levelDetails.color}, ${levelDetails.color}cc)`,
                boxShadow: `0 0 10px ${levelDetails.color}40`
              }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 rounded-full animate-shimmer" />
            </div>

            {/* XP numbers overlay */}
            {showXPNumbers && progressWidth > 20 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {Math.round(progressWidth)}%
                </span>
              </div>
            )}
          </div>

          {/* Progress message */}
          <div className="text-center mt-2">
            {progressWidth >= 80 ? (
              <p className="text-sm text-green-600 font-medium">
                🎉 Almost there! Just {formatXP(levelDetails.xpToNext - levelDetails.currentXP)} XP to level up!
              </p>
            ) : progressWidth >= 50 ? (
              <p className="text-sm text-blue-600">
                Halfway to level {levelDetails.level + 1}! Keep going!
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                {formatXP(levelDetails.xpToNext - levelDetails.currentXP)} XP until next level
              </p>
            )}
          </div>
        </div>
      )}

      {/* Max level indicator */}
      {levelDetails.isMaxLevel && (
        <div className="max-level bg-gradient-to-r from-yellow-400 to-gold-500 text-white rounded-lg p-3 text-center">
          <div className="text-lg font-bold">🏆 MAX LEVEL ACHIEVED! 🏆</div>
          <div className="text-sm opacity-90">You've reached the ultimate level!</div>
        </div>
      )}

      {/* Mini stats */}
      <div className="stats-row grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
        <div className="stat text-center">
          <div className="text-lg font-bold" style={{ color: levelDetails.color }}>
            {levelDetails.level}
          </div>
          <div className="text-xs text-gray-500">Current Level</div>
        </div>
        <div className="stat text-center">
          <div className="text-lg font-bold text-blue-600">
            {Math.round(progressWidth)}%
          </div>
          <div className="text-xs text-gray-500">Progress</div>
        </div>
        <div className="stat text-center">
          <div className="text-lg font-bold text-purple-600">
            {levelDetails.privileges.length}
          </div>
          <div className="text-xs text-gray-500">Privileges</div>
        </div>
      </div>
    </div>
  );
};

export default XPProgressBar;