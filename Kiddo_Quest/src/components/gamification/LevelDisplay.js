import React, { useEffect, useState, memo } from 'react';
import { getLevelDetails, formatXP, getLevelProgress } from '../../utils/xpCalculator';
import { useSpring, animated } from 'react-spring';

const LevelDisplay = ({ 
  totalXP = 0, 
  showProgress = true, 
  showPrivileges = false,
  compact = false,
  animated: isAnimated = true,
  className = ''
}) => {
  const [levelDetails, setLevelDetails] = useState(getLevelDetails(totalXP));
  const [prevXP, setPrevXP] = useState(totalXP);
  
  // Animation for XP changes
  const xpSpring = useSpring({
    from: { xp: prevXP },
    to: { xp: totalXP },
    config: { tension: 200, friction: 30 },
    onRest: () => setPrevXP(totalXP)
  });
  
  // Animation for progress bar
  const progressSpring = useSpring({
    from: { width: '0%' },
    to: { width: `${getLevelProgress(totalXP)}%` },
    config: { tension: 120, friction: 14 }
  });
  
  useEffect(() => {
    setLevelDetails(getLevelDetails(totalXP));
  }, [totalXP]);
  
  if (compact) {
    return (
      <div className={`level-display-compact flex items-center gap-2 ${className}`}>
        <div 
          className="level-badge w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
          style={{ backgroundColor: levelDetails.color }}
        >
          {levelDetails.level}
        </div>
        <div className="level-info">
          <div className="text-sm font-medium">{levelDetails.title}</div>
          {showProgress && (
            <div className="text-xs text-gray-500">
              {formatXP(levelDetails.currentXP)} / {formatXP(levelDetails.xpToNext)} XP
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`level-display bg-white rounded-lg p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="level-icon w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: levelDetails.color }}
          >
            {levelDetails.level}
          </div>
          <div>
            <h3 className="text-lg font-bold">{levelDetails.title}</h3>
            <p className="text-sm text-gray-600">Level {levelDetails.level}</p>
          </div>
        </div>
        <div className="text-right">
          {isAnimated ? (
            <animated.div className="text-2xl font-bold">
              {xpSpring.xp.to(val => formatXP(Math.floor(val)))}
            </animated.div>
          ) : (
            <div className="text-2xl font-bold">{formatXP(totalXP)}</div>
          )}
          <p className="text-xs text-gray-500">Total XP</p>
        </div>
      </div>
      
      {showProgress && !levelDetails.isMaxLevel && (
        <div className="level-progress">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress to Level {levelDetails.level + 1}</span>
            <span>{formatXP(levelDetails.currentXP)} / {formatXP(levelDetails.xpToNext)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            {isAnimated ? (
              <animated.div 
                className="h-full rounded-full transition-all"
                style={{ 
                  ...progressSpring,
                  backgroundColor: levelDetails.color 
                }}
              />
            ) : (
              <div 
                className="h-full rounded-full transition-all"
                style={{ 
                  width: `${levelDetails.progress}%`,
                  backgroundColor: levelDetails.color 
                }}
              />
            )}
          </div>
          {levelDetails.progress >= 80 && (
            <p className="text-xs text-green-600 mt-1 font-medium">
              Almost there! {formatXP(levelDetails.xpToNext - levelDetails.currentXP)} XP to next level!
            </p>
          )}
        </div>
      )}
      
      {levelDetails.isMaxLevel && (
        <div className="max-level-badge bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-lg p-3 mt-3">
          <p className="text-center font-bold">MAX LEVEL ACHIEVED!</p>
          <p className="text-center text-sm">You've reached the ultimate level!</p>
        </div>
      )}
      
      {showPrivileges && levelDetails.privileges.length > 0 && (
        <div className="privileges mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Unlocked Privileges:</h4>
          <div className="flex flex-wrap gap-2">
            {levelDetails.privileges.map((privilege, index) => (
              <span 
                key={index}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
              >
                {privilege.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(LevelDisplay);