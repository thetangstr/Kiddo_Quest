import React, { useState, useEffect } from 'react';
import { getLevelUpCelebration } from '../../utils/xpCalculator';

const LevelUpCelebration = ({ 
  newLevel = 1, 
  oldLevel = 0, 
  newPrivileges = [], 
  isVisible = false, 
  onComplete = () => {}, 
  duration = 4000,
  className = ''
}) => {
  const [animationStage, setAnimationStage] = useState('enter');
  const [showPrivileges, setShowPrivileges] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState([]);

  const celebrationType = getLevelUpCelebration(newLevel);

  useEffect(() => {
    if (!isVisible) return;

    // Generate confetti particles
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10,
      rotation: Math.random() * 360,
      color: getRandomColor(),
      size: Math.random() * 6 + 4,
      velocity: Math.random() * 3 + 1
    }));
    setConfettiParticles(particles);

    // Animation sequence
    const sequence = [
      { stage: 'enter', delay: 0 },
      { stage: 'celebrate', delay: 500 },
      { stage: 'showPrivileges', delay: 1500 },
      { stage: 'exit', delay: duration - 1000 }
    ];

    const timeouts = sequence.map(({ stage, delay }) =>
      setTimeout(() => {
        setAnimationStage(stage);
        if (stage === 'showPrivileges') setShowPrivileges(true);
        if (stage === 'exit') {
          setTimeout(onComplete, 1000);
        }
      }, delay)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [isVisible, newLevel, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={`level-up-celebration fixed inset-0 z-50 flex items-center justify-center ${className}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />

      {/* Confetti */}
      <div className="confetti-container absolute inset-0 overflow-hidden pointer-events-none">
        {confettiParticles.map(particle => (
          <ConfettiParticle 
            key={particle.id} 
            particle={particle} 
            animationStage={animationStage}
          />
        ))}
      </div>

      {/* Main celebration content */}
      <div className={`celebration-content relative z-10 text-center transform transition-all duration-1000 ${
        animationStage === 'enter' ? 'scale-50 opacity-0' :
        animationStage === 'celebrate' ? 'scale-100 opacity-100' :
        animationStage === 'exit' ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
      }`}>
        
        {/* Main level up display */}
        <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
          
          {/* Level up header */}
          <div className="level-up-header mb-6">
            <div className={`celebration-icon text-6xl mb-4 ${
              animationStage === 'celebrate' ? 'animate-bounce' : ''
            }`}>
              {getCelebrationIcon(celebrationType)}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              LEVEL UP!
            </h1>
            
            <div className="level-progression flex items-center justify-center gap-4 mb-4">
              <div className="old-level">
                <div className="text-2xl font-bold text-gray-400">{oldLevel}</div>
                <div className="text-xs text-gray-500">Previous</div>
              </div>
              
              <div className="arrow text-2xl text-blue-500 animate-pulse">→</div>
              
              <div className="new-level">
                <div className={`text-4xl font-bold text-blue-600 ${
                  animationStage === 'celebrate' ? 'animate-pulse' : ''
                }`}>
                  {newLevel}
                </div>
                <div className="text-xs text-blue-500">New Level!</div>
              </div>
            </div>

            <div className="celebration-message text-gray-600">
              {getCelebrationMessage(newLevel, celebrationType)}
            </div>
          </div>

          {/* Privileges section */}
          <div className={`privileges-section transition-all duration-500 ${
            showPrivileges ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0'
          } overflow-hidden`}>
            {newPrivileges.length > 0 && (
              <div className="new-privileges bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  🎉 New Privileges Unlocked!
                </h3>
                <div className="privileges-list space-y-2">
                  {newPrivileges.map((privilege, index) => (
                    <div 
                      key={index}
                      className={`privilege-item flex items-center gap-2 transform transition-all duration-300 ${
                        showPrivileges ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                      }`}
                      style={{ transitionDelay: `${index * 100}ms` }}
                    >
                      <span className="text-green-500">✓</span>
                      <span className="text-sm text-gray-700">
                        {privilege.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special milestone messages */}
            {getSpecialMilestoneMessage(newLevel) && (
              <div className="milestone-message bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl mb-2">{getSpecialMilestoneIcon(newLevel)}</div>
                  <div className="text-sm text-gray-700">
                    {getSpecialMilestoneMessage(newLevel)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action button */}
          <button
            onClick={onComplete}
            className={`continue-button w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 ${
              animationStage === 'celebrate' ? 'animate-pulse' : ''
            }`}
          >
            Awesome! Continue
          </button>
        </div>
      </div>

      {/* Additional visual effects */}
      <div className="visual-effects absolute inset-0 pointer-events-none">
        {celebrationType === 'epic_fireworks' && (
          <div className="fireworks-container">
            <Firework delay={0} />
            <Firework delay={300} />
            <Firework delay={600} />
          </div>
        )}
        
        {celebrationType === 'legendary_celebration' && (
          <div className="legendary-effects">
            <div className="golden-rays animate-spin-slow">✨</div>
            <div className="starfield">
              {Array.from({ length: 20 }, (_, i) => (
                <div 
                  key={i}
                  className="star animate-twinkle"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`
                  }}
                >
                  ⭐
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ConfettiParticle = ({ particle, animationStage }) => {
  const [position, setPosition] = useState({ x: particle.x, y: particle.y });

  useEffect(() => {
    if (animationStage !== 'celebrate') return;

    const interval = setInterval(() => {
      setPosition(prev => ({
        x: prev.x + (Math.random() - 0.5) * 2,
        y: prev.y + particle.velocity
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [animationStage, particle.velocity]);

  return (
    <div
      className="confetti-particle absolute pointer-events-none transform transition-transform duration-100"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${particle.size}px`,
        height: `${particle.size}px`,
        backgroundColor: particle.color,
        transform: `rotate(${particle.rotation}deg)`,
        opacity: animationStage === 'celebrate' ? 1 : 0
      }}
    />
  );
};

const Firework = ({ delay = 0 }) => {
  const [isExploding, setIsExploding] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsExploding(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`firework absolute top-1/4 left-1/2 transform -translate-x-1/2 ${
      isExploding ? 'animate-ping' : ''
    }`}>
      <div className="text-4xl">🎆</div>
    </div>
  );
};

const getCelebrationIcon = (type) => {
  switch (type) {
    case 'ultimate_celebration': return '👑';
    case 'legendary_celebration': return '🌟';
    case 'epic_fireworks': return '🎆';
    case 'special_celebration': return '🎉';
    case 'fireworks': return '🎊';
    default: return '🎯';
  }
};

const getCelebrationMessage = (level, type) => {
  if (level === 20) return "You've achieved the ultimate level! You are now a KiddoQuest legend!";
  if (level === 15) return "Legendary status achieved! You're among the elite!";
  if (level === 10) return "Double digits! You're becoming a true quest master!";
  if (level === 5) return "Great progress! You're really getting the hang of this!";
  if (level % 5 === 0) return `Level ${level}! You're on fire!`;
  return `Level ${level} achieved! Keep up the amazing work!`;
};

const getSpecialMilestoneMessage = (level) => {
  switch (level) {
    case 5: return "You can now create your own quest templates!";
    case 10: return "Elite status unlocked! Enjoy your reward discounts!";
    case 15: return "You can now mentor other family members!";
    case 20: return "Ultimate privileges unlocked! You have access to everything!";
    default: return null;
  }
};

const getSpecialMilestoneIcon = (level) => {
  switch (level) {
    case 5: return '📝';
    case 10: return '💎';
    case 15: return '🎓';
    case 20: return '👑';
    default: return '🎯';
  }
};

const getRandomColor = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FFB347'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export default LevelUpCelebration;