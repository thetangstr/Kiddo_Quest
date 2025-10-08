import React, { useState, useEffect } from 'react';
import { 
  getBadgesByCategory, 
  getBadgesByRarity, 
  getBadgeStats,
  getNextBadgesToUnlock,
  formatBadgeRarity,
  getBadgeColor 
} from '../../utils/badgeManager';

const BadgeGallery = ({ 
  badges = [], 
  userStats = {},
  showProgress = true,
  showCategories = true,
  showRarity = true,
  compact = false,
  maxDisplay = null,
  className = ''
}) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // date, rarity, category, progress
  const [badgeStats, setBadgeStats] = useState(null);
  const [nextBadges, setNextBadges] = useState([]);

  useEffect(() => {
    setBadgeStats(getBadgeStats(badges));
    setNextBadges(getNextBadgesToUnlock(userStats, badges, 5));
  }, [badges, userStats]);

  const filteredBadges = React.useMemo(() => {
    let filtered = [...badges];

    // Apply filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'unlocked') {
        filtered = filtered.filter(badge => badge.isUnlocked);
      } else if (activeFilter === 'locked') {
        filtered = filtered.filter(badge => !badge.isUnlocked);
      } else {
        // Category or rarity filter
        filtered = filtered.filter(badge => 
          badge.category === activeFilter || badge.rarity === activeFilter
        );
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          if (a.isUnlocked && b.isUnlocked) {
            const dateA = a.dateEarned?.toMillis?.() || 0;
            const dateB = b.dateEarned?.toMillis?.() || 0;
            return dateB - dateA; // Most recent first
          }
          return b.isUnlocked - a.isUnlocked; // Unlocked first
        case 'rarity':
          const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
          return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'progress':
          return (b.progress || 0) - (a.progress || 0);
        default:
          return 0;
      }
    });

    return maxDisplay ? filtered.slice(0, maxDisplay) : filtered;
  }, [badges, activeFilter, sortBy, maxDisplay]);

  const categories = ['all', 'unlocked', 'locked', 'quest', 'streak', 'xp', 'social', 'special', 'milestone'];
  const rarities = ['legendary', 'epic', 'rare', 'uncommon', 'common'];

  if (compact) {
    return (
      <div className={`badge-gallery-compact ${className}`}>
        <div className="grid grid-cols-6 gap-2">
          {filteredBadges.slice(0, 6).map((badge) => (
            <BadgeIcon key={badge.id} badge={badge} size="sm" />
          ))}
        </div>
        {badgeStats && (
          <div className="text-xs text-gray-500 mt-2 text-center">
            {badgeStats.totalUnlocked} / {badgeStats.totalBadges} badges earned
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`badge-gallery bg-white rounded-lg p-4 shadow-sm ${className}`}>
      {/* Header with stats */}
      {badgeStats && (
        <div className="gallery-header mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold">Badge Gallery</h3>
            <div className="text-sm text-gray-600">
              {badgeStats.totalUnlocked} / {badgeStats.totalBadges} earned
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${badgeStats.completionPercentage}%` }}
            />
          </div>
          
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="stat-item">
              <div className="text-lg font-bold text-purple-600">
                {badgeStats.totalXPFromBadges}
              </div>
              <div className="text-xs text-gray-500">Total XP</div>
            </div>
            <div className="stat-item">
              <div className="text-lg font-bold text-blue-600">
                {Math.round(badgeStats.completionPercentage)}%
              </div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
            <div className="stat-item">
              <div className="text-lg font-bold text-green-600">
                {badgeStats.mostRecentBadge ? 'Latest' : 'None'}
              </div>
              <div className="text-xs text-gray-500">Recent</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and sorting */}
      <div className="controls mb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveFilter(category)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeFilter === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </button>
          ))}
        </div>
        
        <div className="flex justify-between items-center">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="date">Sort by Date</option>
            <option value="rarity">Sort by Rarity</option>
            <option value="category">Sort by Category</option>
            <option value="progress">Sort by Progress</option>
          </select>
          
          <div className="text-sm text-gray-500">
            {filteredBadges.length} badge{filteredBadges.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Badge grid */}
      <div className="badge-grid grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 mb-4">
        {filteredBadges.map((badge) => (
          <BadgeCard 
            key={badge.id} 
            badge={badge} 
            userStats={userStats}
            showProgress={showProgress}
          />
        ))}
      </div>

      {/* Next badges to unlock */}
      {nextBadges.length > 0 && activeFilter === 'all' && (
        <div className="next-badges mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-md font-semibold text-gray-700 mb-3">Coming Up Next</h4>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {nextBadges.map((badge) => (
              <BadgeCard 
                key={badge.id} 
                badge={badge} 
                userStats={userStats}
                showProgress={true}
                isPreview={true}
              />
            ))}
          </div>
        </div>
      )}

      {filteredBadges.length === 0 && (
        <div className="empty-state text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🏆</div>
          <p>No badges found for the selected filter.</p>
          <p className="text-sm">Complete quests to earn your first badge!</p>
        </div>
      )}
    </div>
  );
};

const BadgeCard = ({ badge, userStats = {}, showProgress = true, isPreview = false }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const rarityInfo = badge.getRarityInfo();
  
  return (
    <div 
      className={`badge-card relative group cursor-pointer ${
        badge.isUnlocked ? 'badge-unlocked' : 'badge-locked'
      }`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`badge-icon-container relative p-2 rounded-lg border-2 transition-all duration-300 ${
        badge.isUnlocked 
          ? 'border-transparent shadow-md hover:shadow-lg transform hover:scale-105' 
          : 'border-gray-300 border-dashed opacity-60 grayscale hover:opacity-80'
      }`}
      style={{
        backgroundColor: badge.isUnlocked ? `${rarityInfo.color}20` : '#f9f9f9'
      }}>
        
        {/* Badge icon */}
        <div className="badge-icon w-12 h-12 mx-auto mb-2 relative">
          {badge.icon ? (
            <img 
              src={badge.icon} 
              alt={badge.name}
              className={`w-full h-full object-contain ${
                badge.isUnlocked ? '' : 'filter grayscale'
              }`}
            />
          ) : (
            <div 
              className={`w-full h-full rounded-full flex items-center justify-center text-white font-bold ${
                badge.isUnlocked ? '' : 'bg-gray-400'
              }`}
              style={{ backgroundColor: badge.isUnlocked ? rarityInfo.color : undefined }}
            >
              🏆
            </div>
          )}
          
          {/* Rarity indicator */}
          <div 
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
            style={{ backgroundColor: rarityInfo.color }}
          />
        </div>

        {/* Badge name */}
        <div className="text-xs font-medium text-center text-gray-700 mb-1 truncate">
          {badge.name}
        </div>

        {/* Progress bar for locked badges */}
        {!badge.isUnlocked && showProgress && badge.progress > 0 && (
          <div className="progress-container">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-blue-400 h-1 rounded-full transition-all duration-500"
                style={{ width: `${badge.progress}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 text-center mt-1">
              {Math.round(badge.progress)}%
            </div>
          </div>
        )}

        {/* Date earned for unlocked badges */}
        {badge.isUnlocked && badge.dateEarned && (
          <div className="text-xs text-gray-500 text-center">
            {new Date(badge.dateEarned.toMillis?.() || badge.dateEarned).toLocaleDateString()}
          </div>
        )}

        {/* Tooltip */}
        {showTooltip && (
          <div className="tooltip absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10">
            <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap max-w-48">
              <div className="font-semibold">{badge.name}</div>
              <div className="text-gray-300">{badge.description}</div>
              <div className="text-yellow-300 text-xs mt-1">
                {formatBadgeRarity(badge.rarity)} • {badge.xpReward} XP
              </div>
              {!badge.isUnlocked && badge.progress > 0 && (
                <div className="text-blue-300 text-xs">
                  Progress: {Math.round(badge.progress)}%
                </div>
              )}
            </div>
            <div className="tooltip-arrow"></div>
          </div>
        )}
      </div>
    </div>
  );
};

const BadgeIcon = ({ badge, size = 'md' }) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  const rarityInfo = badge.getRarityInfo();
  
  return (
    <div className={`badge-icon ${sizes[size]} relative`}>
      {badge.icon ? (
        <img 
          src={badge.icon} 
          alt={badge.name}
          className={`w-full h-full object-contain ${
            badge.isUnlocked ? '' : 'filter grayscale opacity-50'
          }`}
        />
      ) : (
        <div 
          className={`w-full h-full rounded-full flex items-center justify-center text-white text-xs font-bold ${
            badge.isUnlocked ? '' : 'bg-gray-400'
          }`}
          style={{ backgroundColor: badge.isUnlocked ? rarityInfo.color : undefined }}
        >
          🏆
        </div>
      )}
      
      {badge.isUnlocked && (
        <div 
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white"
          style={{ backgroundColor: rarityInfo.color }}
        />
      )}
    </div>
  );
};

export default BadgeGallery;