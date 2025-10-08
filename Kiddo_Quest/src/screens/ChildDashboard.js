import React, { useState, useEffect } from 'react';
import { Shield, Gift, CheckCircle, ArrowLeft, Award, Lock, Palette, Star, Fire } from 'lucide-react';
import useKiddoQuestStore from '../store';
import { Button, Card, XPProgressBar, LoadingSpinner, renderLucideIcon } from '../components/UI';
import ReactConfetti from 'react-confetti';
import PinModal from '../components/PinModal';
import { getThemeById, getThemeClasses, getThemeAccessibilityOptions, THEMES } from '../utils/themeManager';
import { respectReducedMotion, addFocusStyles } from '../utils/accessibilityUtils';
// NEW GAMIFICATION IMPORTS
import LevelDisplay from '../components/gamification/LevelDisplay';
import BadgeGallery from '../components/gamification/BadgeGallery';
import StreakCounter from '../components/gamification/StreakCounter';
import QuestOfDay from '../components/gamification/QuestOfDay';
import { getLevelDetails } from '../utils/xpCalculator';

// Child Dashboard Component
const ChildDashboard = ({ onViewChange }) => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinError, setPinError] = useState('');
  const [claimingQuestId, setClaimingQuestId] = useState(null); // Track which quest is being claimed
  
  const { 
    childProfiles, 
    quests,
    rewards,
    questCompletions,
    selectedChildIdForDashboard,
    claimQuest,
    claimReward,
    isLoadingData,
    navigateTo,
    verifyParentPin,
    hasParentPin
  } = useKiddoQuestStore();
  
  // Find the selected child profile
  const childProfile = childProfiles.find(child => child.id === selectedChildIdForDashboard);
  
  // Get the child's theme or use default
  const childTheme = childProfile?.theme || THEMES.DEFAULT;
  const theme = getThemeById(childTheme);
  
  // Get accessibility options
  const accessOptions = getThemeAccessibilityOptions(childTheme);
  const accessSettings = childProfile?.accessibility || {
    highContrast: false,
    reducedMotion: false,
    largeText: false
  };
  
  // Apply theme classes with accessibility enhancements
  const backgroundClasses = getThemeClasses(childTheme, 'background');
  const cardClasses = `${getThemeClasses(childTheme, 'card')} ${accessSettings.highContrast ? 'border-2 border-gray-800' : ''}`;
  const buttonClasses = `${getThemeClasses(childTheme, 'button')} ${accessSettings.highContrast ? '!font-bold' : ''}`;
  const textClasses = `${getThemeClasses(childTheme, 'text')} ${accessSettings.largeText ? 'text-lg' : ''}`;
  
  // Apply reduced motion settings if needed
  const animationClasses = accessSettings.reducedMotion ? 'transition-none transform-none' : 'transition-all duration-300';
  
  // Filter quests and rewards for this child
  const availableQuests = quests.filter(quest => {
    // Check if quest is new
    if (quest.status !== 'new') return false;
    
    // Check if quest is assigned to this child (or no assignment means available to all)
    const isAssignedToChild = !quest.assignedTo || quest.assignedTo.length === 0 || quest.assignedTo.includes(selectedChildIdForDashboard);
    if (!isAssignedToChild) return false;
    
    // For daily quests, check if already completed today
    if (quest.type === 'recurring' && quest.frequency === 'daily') {
      const completedToday = questCompletions.some(completion => 
        completion.questId === quest.id && 
        completion.childId === selectedChildIdForDashboard
      );
      return !completedToday;
    }
    
    return true;
  });
  
  // Get pending quests including both one-time quests and daily quest completions
  const pendingOneTimeQuests = quests.filter(quest => 
    quest.status === 'pending_verification' && 
    quest.claimedBy === selectedChildIdForDashboard
  );
  
  const pendingDailyQuests = questCompletions
    .filter(completion => 
      completion.childId === selectedChildIdForDashboard && 
      completion.status === 'pending_verification'
    )
    .map(completion => ({
      id: completion.id,
      title: completion.questTitle,
      xp: completion.xp,
      type: 'recurring',
      frequency: 'daily',
      isCompletion: true // Flag to identify this is a completion record
    }));
  
  const pendingQuests = [...pendingOneTimeQuests, ...pendingDailyQuests];
  
  const availableRewards = rewards.filter(reward => {
    // Check if reward is available
    if (reward.status !== 'available') return false;
    
    // Check if reward is assigned to this child (or no assignment means available to all)
    const isAssignedToChild = !reward.assignedTo || reward.assignedTo.length === 0 || reward.assignedTo.includes(selectedChildIdForDashboard);
    return isAssignedToChild;
  });
  
  // Update window size for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle navigation to parent dashboard with PIN protection
  const handleParentDashboardNavigation = async () => {
    try {
      // Check if parent has set a PIN
      const hasPinSet = await hasParentPin();
      
      if (hasPinSet) {
        // If PIN is set, show the PIN modal
        setShowPinModal(true);
        setPinError('');
      } else {
        // If no PIN is set, navigate directly
        navigateTo('parentDashboard');
      }
    } catch (error) {
      console.error('Error checking for PIN:', error);
      // If there's an error, navigate directly as a fallback
      navigateTo('parentDashboard');
    }
  };
  
  // Handle PIN verification
  const handlePinSubmit = async (pin) => {
    try {
      const result = await verifyParentPin(pin);
      
      if (result.success) {
        // PIN is correct, navigate to parent dashboard
        setShowPinModal(false);
        navigateTo('parentDashboard');
      } else {
        // PIN is incorrect
        setPinError(result.error || 'Incorrect PIN');
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      setPinError('An error occurred. Please try again.');
    }
  };
  
  // Handle quest claiming
  const handleClaimQuest = async (questId) => {
    if (!selectedChildIdForDashboard) return;
    
    // Set loading state for this specific quest
    setClaimingQuestId(questId);
    
    try {
      const result = await claimQuest(questId, selectedChildIdForDashboard);
      
      // Handle both old boolean return and new object return
      const success = typeof result === 'boolean' ? result : result.success;
      const message = typeof result === 'object' && result.message 
        ? result.message 
        : success 
          ? 'Quest claimed! Waiting for parent verification.' 
          : 'Failed to claim quest. Please try again.';
      
      setNotification({
        type: success ? 'success' : 'error',
        message: message
      });
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } finally {
      // Always clear loading state
      setClaimingQuestId(null);
    }
  };
  
  // Handle reward claiming
  const handleClaimReward = async (rewardId) => {
    if (!selectedChildIdForDashboard) return;
    
    const result = await claimReward(rewardId, selectedChildIdForDashboard);
    
    setNotification({
      type: result.success ? 'success' : 'error',
      message: result.message
    });
    
    if (result.showConfetti) {
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
    }
    
    // Clear notification after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };
  
  // Handle parent access button click
  const handleParentAccess = () => {
    if (onViewChange) {
      onViewChange('parentDashboard');
    }
  };
  
  if (isLoadingData) {
    return <LoadingSpinner message="Loading child dashboard..." />;
  }
  
  if (!childProfile) {
    return <div className="p-4">Child profile not found</div>;
  }
  
  return (
    <div 
      className={`min-h-screen ${backgroundClasses} p-4 ${accessSettings.largeText ? 'text-lg' : ''}`}
      style={accessSettings.highContrast ? { filter: 'contrast(1.2)' } : {}}>
      {/* Parent Access Button */}
      <div className="fixed bottom-4 right-4 z-10">
        <button
          onClick={handleParentAccess}
          className={`bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center ${accessSettings.highContrast ? '!font-bold' : ''}`}
          aria-label="Parent Access"
        >
          <Lock size={24} />
        </button>
      </div>
      {/* Confetti effect when claiming rewards */}
      {showConfetti && !accessSettings.reducedMotion && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={accessSettings.reducedMotion ? 50 : 200}
          gravity={0.2}
          onConfettiComplete={() => setShowConfetti(false)}
        />
      )}
      
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-md z-50 ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {notification.message}
        </div>
      )}
      
      {/* PIN Modal */}
      <PinModal 
        isOpen={showPinModal} 
        onClose={() => setShowPinModal(false)} 
        onSubmit={handlePinSubmit}
        error={pinError}
      />
      
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            icon={ArrowLeft} 
            onClick={handleParentDashboardNavigation}
            className="mr-3 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 rounded-full flex items-center"
            aria-label="Go back to parent dashboard"
          >
            <Lock size={14} className="ml-1" />
          </Button>
          <h1 className={`text-3xl font-bold ${textClasses}`}>{childProfile.name}'s Adventure</h1>
        </div>
      </div>
      
      {/* NEW GAMIFICATION SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Level Display */}
        <div className="md:col-span-2">
          <LevelDisplay 
            totalXP={childProfile.totalXP || childProfile.xp || 0}
            showProgress={true}
            animated={!accessSettings.reducedMotion}
            className="h-full"
          />
        </div>
        
        {/* Streak Counter */}
        <div>
          <StreakCounter 
            currentStreak={childProfile.activeStreak || 0}
            longestStreak={childProfile.longestStreak || 0}
            animated={!accessSettings.reducedMotion}
            size="medium"
            className="h-full"
          />
        </div>
      </div>
      
      {/* Quest of the Day */}
      {pendingQuests.length > 0 && (
        <div className="mb-6">
          <QuestOfDay 
            quest={pendingQuests[0]} // Featured quest
            onClaim={handleClaimQuest}
            isLoading={claimingQuestId === pendingQuests[0]?.id}
            childProfile={childProfile}
          />
        </div>
      )}
      
      {/* Recent Badges */}
      {childProfile.badges && childProfile.badges.length > 0 && (
        <div className="mb-6">
          <BadgeGallery 
            earnedBadges={childProfile.badges.slice(-3)} // Show last 3 earned badges
            compact={true}
            showProgress={false}
            title="Recent Achievements"
            className="bg-gradient-to-r from-purple-50 to-pink-50"
          />
        </div>
      )}
      
      {/* XP Progress */}
      <Card className={`${cardClasses} shadow-md p-4 mb-6 flex justify-between items-center rounded-b-lg`}>
        <div className="flex items-center">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-4xl mr-4 overflow-hidden shadow-md">
            {typeof childProfile.avatar === 'string' && childProfile.avatar.startsWith('http') 
              ? <img src={childProfile.avatar} alt={childProfile.name} className="w-full h-full object-cover" />
              : childProfile.avatar || '👶'}
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${textClasses}`}>{childProfile.name}</h2>
            <div className="flex items-center bg-white px-3 py-1 rounded-full shadow-inner mt-1">
              <Award className="text-yellow-500 mr-1" size={20} />
              <span className="font-bold text-pink-600 text-xl">{childProfile.xp || 0} Stars</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-2 rounded-lg shadow-inner">
          <XPProgressBar currentXP={childProfile.xp || 0} nextLevelXP={30} />
        </div>
      </Card>
      
      {/* Available Quests */}
      <section className="mb-8">
        <h2 className={`text-2xl font-bold mb-4 flex items-center ${textClasses}`}>
          <CheckCircle className="mr-2" /> My Fun Missions
        </h2>
        
        {availableQuests.length === 0 ? (
          <Card className={`${cardClasses} p-6 text-center`}>
            <p className={`text-blue-600 font-bold text-lg ${textClasses}`}>No missions available right now.</p>
            <p className={`text-blue-500 ${textClasses}`}>Check back soon for new adventures!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableQuests.map(quest => (
              <Card key={quest.id} className={`${cardClasses} p-6 bg-gradient-to-r from-blue-100 to-green-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 child-profile-card`}>
                <div className="flex items-start mb-4">
                  <div className="mr-4 p-3 bg-white rounded-full shadow-md text-pink-500">
                    {renderLucideIcon(quest.iconName || 'CheckCircle', { size: 28 })}
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${textClasses}`}>{quest.title}</h3>
                    <p className={`text-md text-blue-600 mb-3 font-medium ${textClasses}`}>{quest.description}</p>
                    <div className="flex items-center bg-yellow-100 px-3 py-1 rounded-full shadow-inner inline-block">
                      <Award className="text-yellow-500 mr-1" size={18} />
                      <span className={`text-md font-bold text-pink-600 ${textClasses}`}>{quest.xp} Stars!</span>
                      {quest.type === 'recurring' && (
                        <span className="ml-2 text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                          {quest.frequency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {quest.image && (
                  <div className="mb-4 rounded-xl overflow-hidden border-4 border-yellow-300 shadow-md">
                    <img 
                      src={quest.image} 
                      alt={quest.title} 
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
                <Button
                  variant="primary"
                  className="mt-auto w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-lg py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                  onClick={() => handleClaimQuest(quest.id)}
                  disabled={claimingQuestId === quest.id}
                >
                  {claimingQuestId === quest.id ? 'Claiming...' : 'I Did This! 🎉'}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>
      
      {/* Pending Verification */}
      {pendingQuests.length > 0 && (
        <section className="mb-8">
          <h2 className={`text-xl font-semibold mb-4 flex items-center ${textClasses}`}>
            <Shield className="mr-2" /> Waiting for Verification
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingQuests.map(quest => (
              <Card key={quest.id} className={`${cardClasses} p-6 border-l-4 border-yellow-400`}>
                <div className="flex items-start">
                  <div className="mr-4 text-yellow-500">
                    {renderLucideIcon(quest.iconName || 'CheckCircle', { size: 24 })}
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium ${textClasses}`}>{quest.title}</h3>
                    <p className={`text-sm text-gray-600 mb-2 ${textClasses}`}>{quest.description}</p>
                    <div className="flex items-center">
                      <Award className="text-yellow-500 mr-1" size={16} />
                      <span className={`text-sm font-medium text-indigo-600 ${textClasses}`}>{quest.xp} XP</span>
                    </div>
                    <p className={`text-sm text-yellow-600 mt-2 ${textClasses}`}>
                      Waiting for parent to verify completion
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
      
      {/* Available Rewards */}
      <section className="mb-8" data-tutorial="rewards-section">
        <h2 className={`text-2xl font-bold mb-4 flex items-center ${textClasses}`}>
          <Gift className="mr-2" /> Treasure Chest
        </h2>
        
        {availableRewards.length === 0 ? (
          <Card className={`${cardClasses} p-6 text-center`}>
            <p className={`text-purple-600 font-bold text-lg ${textClasses}`}>No treasures available right now.</p>
            <p className={`text-purple-500 ${textClasses}`}>Complete missions to earn stars and unlock treasures!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableRewards.map(reward => {
              const canAfford = (childProfile.xp || 0) >= reward.cost;
              
              return (
                <Card key={reward.id} className={`${cardClasses} p-6 bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl shadow-lg`}>
                  <div className="flex items-start mb-4">
                    <div className="mr-4 p-3 bg-white rounded-full shadow-md text-pink-500">
                      {renderLucideIcon(reward.iconName || 'Gift', { size: 28 })}
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${textClasses}`}>{reward.title}</h3>
                      <p className={`text-md text-pink-600 mb-3 font-medium ${textClasses}`}>{reward.description}</p>
                      <div className="flex items-center bg-yellow-100 px-3 py-1 rounded-full shadow-inner inline-block">
                        <Award className="text-yellow-500 mr-1" size={18} />
                        <span className={`text-md font-bold text-purple-600 ${textClasses}`}>{reward.cost} Stars needed</span>
                      </div>
                    </div>
                  </div>
                  
                  {reward.image && (
                    <div className="mb-4 rounded-xl overflow-hidden shadow-md">
                      <img 
                        src={reward.image} 
                        alt={reward.title} 
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                  
                  {canAfford ? (
                    <Button 
                      variant="primary"
                      className="mt-auto w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold text-lg py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                      onClick={() => handleClaimReward(reward.id)}
                    >
                      Get My Treasure! 🎁
                    </Button>
                  ) : (
                    <div className="w-full mt-3 bg-gray-100 text-center py-3 px-4 rounded-xl shadow-inner">
                      <p className={`text-purple-600 font-bold ${textClasses}`}>
                        Need {reward.cost - (childProfile.xp || 0)} more stars ⭐
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>
      
    </div>
  );
};

export default ChildDashboard;
