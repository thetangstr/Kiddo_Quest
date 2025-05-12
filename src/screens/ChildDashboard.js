import React, { useState, useEffect, useRef } from 'react';
import { Shield, Gift, CheckCircle, ArrowLeft, Award, Lock, Star, Sparkles, Trophy, Zap, MapPin, Rocket } from 'lucide-react';
import useKiddoQuestStore from '../store';
import { Button, Card, XPProgressBar, LoadingSpinner, renderLucideIcon } from '../components/UI';
import ReactConfetti from 'react-confetti';
import PinModal from '../components/PinModal';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [animatedPoints, setAnimatedPoints] = useState(0);
  const [showQuestCompleteDialog, setShowQuestCompleteDialog] = useState(false);
  const [completedQuest, setCompletedQuest] = useState(null);
  const [showStreakBadge, setShowStreakBadge] = useState(false);
  const [achievementUnlocked, setAchievementUnlocked] = useState(null);
  
  // Refs for animations
  const questListRef = useRef(null);
  const rewardListRef = useRef(null);
  
  const { 
    childProfiles, 
    quests,
    questCompletions,
    rewards,
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
  
  // Filter quests and rewards for this child
  const availableQuests = quests.filter(quest => {
    // Check if quest is assigned to this child
    const isAssigned = quest.assignedTo?.includes(selectedChildIdForDashboard);
    if (!isAssigned) return false;
    
    // Check if this child has already claimed this quest
    const hasClaimedQuest = questCompletions?.some(completion => 
      completion.questId === quest.id && 
      completion.childId === selectedChildIdForDashboard
    );
    
    // Only show quests that are new and not yet claimed by this child
    return quest.status === 'new' && !hasClaimedQuest;
  });
  
  // Get pending quests from the completions collection
  const pendingQuests = (questCompletions || []).filter(completion => 
    completion.status === 'pending_verification' && 
    completion.childId === selectedChildIdForDashboard
  ).map(completion => {
    // Find the original quest details
    const quest = quests.find(q => q.id === completion.questId);
    // Return a combined object with completion status and quest details
    return quest ? {
      ...quest,
      completionId: completion.id,
      status: completion.status,
      claimedAt: completion.claimedAt
    } : null;
  }).filter(Boolean); // Remove any null values
  
  const availableRewards = rewards.filter(reward => 
    reward.status === 'available' && 
    reward.assignedTo?.includes(selectedChildIdForDashboard)
  );
  
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
  
  // Handle quest claiming with enhanced gamification
  const handleClaimQuest = async (questId) => {
    if (!selectedChildIdForDashboard) return;
    
    // Find the quest being claimed
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;
    
    // Play sound effect
    const claimSound = new Audio('/sounds/quest-claim.mp3');
    claimSound.volume = 0.5;
    claimSound.play().catch(e => console.log('Audio play failed:', e));
    
    // Show quest complete dialog with animation
    setCompletedQuest(quest);
    setShowQuestCompleteDialog(true);
    
    // Animate the quest card
    if (questListRef.current) {
      const questCard = questListRef.current.querySelector(`[data-quest-id="${questId}"]`);
      if (questCard) {
        questCard.classList.add('animate-pulse', 'border-green-500', 'border-4');
      }
    }
    
    // Submit the claim after animation
    setTimeout(async () => {
      const success = await claimQuest(questId, selectedChildIdForDashboard);
      
      if (success) {
        // Show confetti for small celebration
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        
        // Check if this completes a streak
        const completedQuestsCount = pendingQuests.length + 1; // Including this one
        if (completedQuestsCount % 3 === 0) { // Every 3 quests
          setShowStreakBadge(true);
          setTimeout(() => setShowStreakBadge(false), 5000);
        }
        
        // Show notification
        setNotification({
          type: 'success',
          message: 'Quest claimed! Waiting for parent verification.'
        });
        
        // Close dialog after delay
        setTimeout(() => {
          setShowQuestCompleteDialog(false);
          setNotification(null);
        }, 3000);
      } else {
        setNotification({
          type: 'error',
          message: 'Failed to claim quest. Please try again.'
        });
        
        setShowQuestCompleteDialog(false);
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      }
    }, 1000);
  };
  
  // Handle reward claiming with enhanced gamification
  const handleClaimReward = async (rewardId) => {
    if (!selectedChildIdForDashboard) return;
    
    // Find the reward being claimed
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return;
    
    // Check if child has enough points
    if ((childProfile.xp || 0) < reward.cost) {
      setNotification({
        type: 'error',
        message: `You need ${reward.cost - (childProfile.xp || 0)} more stars to claim this reward!`
      });
      
      // Play "not enough" sound
      const errorSound = new Audio('/sounds/error.mp3');
      errorSound.volume = 0.3;
      errorSound.play().catch(e => console.log('Audio play failed:', e));
      
      setTimeout(() => {
        setNotification(null);
      }, 3000);
      return;
    }
    
    // Play reward claim sound
    const rewardSound = new Audio('/sounds/reward-claim.mp3');
    rewardSound.volume = 0.5;
    rewardSound.play().catch(e => console.log('Audio play failed:', e));
    
    // Animate the reward card
    if (rewardListRef.current) {
      const rewardCard = rewardListRef.current.querySelector(`[data-reward-id="${rewardId}"]`);
      if (rewardCard) {
        rewardCard.classList.add('animate-bounce', 'border-purple-500', 'border-4');
      }
    }
    
    // Show animated points being deducted
    setAnimatedPoints(-reward.cost);
    setShowRewardAnimation(true);
    
    // Submit the claim after animation
    setTimeout(async () => {
      const result = await claimReward(rewardId, selectedChildIdForDashboard);
      
      setNotification({
        type: result.success ? 'success' : 'error',
        message: result.message
      });
      
      if (result.success) {
        // Big celebration for reward claim
        setShowConfetti(true);
        
        // Set achievement if this is a milestone reward
        if (reward.cost >= 50) {
          setAchievementUnlocked({
            title: "Big Spender!",
            description: `You claimed a premium reward worth ${reward.cost} stars!`,
            icon: "Trophy"
          });
          
          setTimeout(() => {
            setAchievementUnlocked(null);
          }, 5000);
        }
        
        setTimeout(() => {
          setShowConfetti(false);
        }, 6000);
      }
      
      // Clear animations
      setTimeout(() => {
        setShowRewardAnimation(false);
        setNotification(null);
        
        if (rewardListRef.current) {
          const rewardCard = rewardListRef.current.querySelector(`[data-reward-id="${rewardId}"]`);
          if (rewardCard) {
            rewardCard.classList.remove('animate-bounce', 'border-purple-500', 'border-4');
          }
        }
      }, 3000);
    }, 1500);
  };
  
  // Handle parent access button click
  const handleParentAccess = () => {
    if (onViewChange) {
      onViewChange('parentDashboard');
    }
  };
  
  if (isLoadingData || !childProfile) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl bg-gradient-to-b from-blue-100 via-purple-100 to-pink-100 min-h-screen rounded-lg relative overflow-hidden" data-tutorial="child-dashboard">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating stars */}
        {Array(10).fill(0).map((_, i) => (
          <motion.div 
            key={`star-${i}`}
            className="absolute text-yellow-400"
            initial={{ 
              x: Math.random() * windowSize.width, 
              y: Math.random() * windowSize.height,
              opacity: Math.random() * 0.5 + 0.3,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              y: [null, '-20px', null, '20px', null],
              opacity: [null, 1, 0.5, 1, null],
              scale: [null, 1.2, 1, 1.2, null]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 5 + i * 2, 
              ease: "easeInOut" 
            }}
          >
            <Star size={20} fill="currentColor" />
          </motion.div>
        ))}
        
        {/* Decorative elements */}
        <motion.div 
          className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-indigo-100 to-transparent opacity-50"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>
      
      {/* Parent Access Button */}
      <motion.div 
        className="fixed bottom-4 right-4 z-10"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <button
          onClick={handleParentAccess}
          className="bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
          aria-label="Parent Access"
          data-tutorial="parent-link"
        >
          <Lock size={24} />
        </button>
      </motion.div>
      {/* Confetti effect when claiming rewards */}
      {showConfetti && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.2}
          onConfettiComplete={() => setShowConfetti(false)}
        />
      )}
      
      {/* Enhanced Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            className={`fixed top-4 right-4 p-4 rounded-xl shadow-lg z-50 flex items-center ${
              notification.type === 'success' ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' : 'bg-gradient-to-r from-red-400 to-red-500 text-white'
            }`}
            initial={{ opacity: 0, y: -50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {notification.type === 'success' ? 
              <CheckCircle className="mr-2" size={20} /> : 
              <Shield className="mr-2" size={20} />
            }
            <span className="font-bold">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Achievement Unlocked */}
      <AnimatePresence>
        {achievementUnlocked && (
          <motion.div 
            className="fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white p-6 rounded-xl shadow-2xl z-50 flex flex-col items-center max-w-md w-full"
            initial={{ opacity: 0, y: -100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="bg-yellow-300 p-4 rounded-full mb-3">
              {renderLucideIcon(achievementUnlocked.icon || 'Trophy', { size: 40, className: 'text-yellow-700' })}
            </div>
            <h3 className="text-2xl font-bold mb-2">Achievement Unlocked!</h3>
            <h4 className="text-xl font-bold mb-1">{achievementUnlocked.title}</h4>
            <p className="text-center">{achievementUnlocked.description}</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Streak Badge */}
      <AnimatePresence>
        {showStreakBadge && (
          <motion.div 
            className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-full shadow-2xl z-50 flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ 
              opacity: 1, 
              scale: [1, 1.2, 1], 
              rotate: [0, 5, 0, -5, 0],
              y: [0, -20, 0, -10, 0]
            }}
            exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
            transition={{ 
              duration: 2,
              times: [0, 0.2, 0.5, 0.8, 1],
              ease: "easeInOut" 
            }}
          >
            <div className="relative">
              <Sparkles className="absolute -top-2 -right-2 text-yellow-300" size={20} />
              <Sparkles className="absolute -bottom-2 -left-2 text-yellow-300" size={20} />
              <div className="bg-white p-3 rounded-full">
                <Zap size={40} className="text-purple-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold mt-3">Quest Streak!</h3>
            <p className="text-center text-sm mt-1">Keep it up!</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Quest Complete Dialog */}
      <AnimatePresence>
        {showQuestCompleteDialog && completedQuest && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-gradient-to-r from-green-400 to-blue-500 p-8 rounded-2xl shadow-2xl max-w-md w-full text-white text-center"
              initial={{ scale: 0.5, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 100 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <motion.div 
                className="mb-4 text-6xl mx-auto bg-white text-green-500 w-24 h-24 rounded-full flex items-center justify-center"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, 0, -10, 0]
                }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
              >
                {renderLucideIcon(completedQuest.iconName || 'CheckCircle', { size: 50 })}
              </motion.div>
              <motion.h2 
                className="text-3xl font-bold mb-2"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Quest Completed!
              </motion.h2>
              <h3 className="text-xl font-bold mb-4">{completedQuest.title}</h3>
              <p className="mb-6">{completedQuest.description}</p>
              <div className="flex items-center justify-center bg-white bg-opacity-20 p-3 rounded-xl mb-4">
                <Award className="text-yellow-300 mr-2" size={24} />
                <span className="text-xl font-bold">{completedQuest.xp} Stars Pending!</span>
              </div>
              <p className="text-sm">Waiting for parent approval...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Points Animation */}
      <AnimatePresence>
        {showRewardAnimation && (
          <motion.div 
            className="fixed top-1/4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 0], y: [-50, -100, -150], scale: [0.5, 1.5, 2, 2.5] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, times: [0, 0.2, 0.8, 1] }}
          >
            <div className={`text-4xl font-bold ${animatedPoints > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {animatedPoints > 0 ? '+' : ''}{animatedPoints} ⭐
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* PIN Modal */}
      <PinModal 
        isOpen={showPinModal} 
        onClose={() => setShowPinModal(false)} 
        onSubmit={handlePinSubmit}
        error={pinError}
      />
      
      <div className="flex justify-between items-center mb-6">
        <motion.div 
          className="flex items-center"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button 
              variant="ghost" 
              icon={ArrowLeft} 
              onClick={handleParentDashboardNavigation}
              className="mr-3 bg-gradient-to-r from-yellow-200 to-yellow-300 hover:from-yellow-300 hover:to-yellow-400 text-yellow-800 rounded-full flex items-center shadow-md"
              aria-label="Go back to parent dashboard"
            >
              <Lock size={14} className="ml-1" />
            </Button>
          </motion.div>
          <motion.h1 
            className="text-3xl font-bold text-pink-600 bg-gradient-to-r from-yellow-100 to-orange-100 px-6 py-2 rounded-full shadow-md border-2 border-yellow-200"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {childProfile.name}'s Adventure
          </motion.h1>
        </motion.div>
      </div>
      
      {/* XP Progress - Enhanced with animations and game elements */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Card className="p-6 mb-8 bg-gradient-to-r from-yellow-200 via-orange-100 to-pink-100 rounded-xl shadow-lg border-2 border-yellow-300 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-300 to-transparent opacity-30 rounded-full transform translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-300 to-transparent opacity-30 rounded-full transform -translate-x-12 translate-y-12"></div>
          
          <div className="flex flex-col md:flex-row md:items-center mb-4 relative z-10">
            <motion.div 
              className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-4xl mr-6 overflow-hidden shadow-lg border-4 border-yellow-300"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {typeof childProfile.avatar === 'string' && childProfile.avatar.startsWith('http') 
                ? <img src={childProfile.avatar} alt={childProfile.name} className="w-full h-full object-cover" />
                : childProfile.avatar || '👶'}
              
              {/* Decorative sparkle effect */}
              <motion.div 
                className="absolute top-0 right-0 text-yellow-400"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles size={15} />
              </motion.div>
            </motion.div>
            
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h2 className="text-2xl font-bold text-purple-700 mr-2">{childProfile.name}</h2>
                <motion.div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Level {Math.floor((childProfile.xp || 0) / 30) + 1}
                </motion.div>
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <motion.div 
                  className="flex items-center bg-white px-4 py-2 rounded-full shadow-md border-2 border-yellow-200"
                  whileHover={{ scale: 1.05 }}
                >
                  <Award className="text-yellow-500 mr-2" size={20} />
                  <span className="font-bold text-pink-600 text-xl">{childProfile.xp || 0} Stars</span>
                </motion.div>
                
                <div className="flex space-x-2">
                  <motion.div 
                    className="bg-green-100 p-2 rounded-full shadow-md flex items-center justify-center border-2 border-green-200"
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    title="Quests Completed"
                  >
                    <CheckCircle size={18} className="text-green-500" />
                    <span className="ml-1 font-bold text-green-700">{pendingQuests.length}</span>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-purple-100 p-2 rounded-full shadow-md flex items-center justify-center border-2 border-purple-200"
                    whileHover={{ scale: 1.1, rotate: -10 }}
                    title="Rewards Claimed"
                  >
                    <Gift size={18} className="text-purple-500" />
                    <span className="ml-1 font-bold text-purple-700">{Math.floor((childProfile.xp || 0) / 15)}</span>
                  </motion.div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-xl shadow-md border-2 border-yellow-100">
                <XPProgressBar currentXP={childProfile.xp || 0} nextLevelXP={30} />
              </div>
            </div>
          </div>
          
          {/* Motivational message */}
          <motion.div 
            className="bg-gradient-to-r from-blue-100 to-indigo-100 p-3 rounded-lg mt-2 border border-blue-200 shadow-inner text-center"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <p className="text-indigo-700 font-medium">
              {childProfile.xp < 10 ? 
                "Complete quests to earn stars and unlock awesome rewards!" :
                childProfile.xp < 30 ? 
                "You're doing great! Keep completing quests to level up!" :
                childProfile.xp < 60 ? 
                "Amazing progress! You're becoming a quest master!" :
                "Wow! You're a superstar! Keep up the fantastic work!"}
            </p>
          </motion.div>
        </Card>
      </motion.div>
      
      {/* Available Quests - Enhanced with animations and game elements */}
      <motion.section 
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        ref={questListRef}
        data-tutorial="available-quests"
      >
        <motion.div 
          className="flex items-center mb-4"
          whileHover={{ scale: 1.02 }}
        >
          <motion.h2 
            className="text-2xl font-bold flex items-center bg-gradient-to-r from-green-200 to-green-300 text-green-700 px-6 py-3 rounded-full shadow-md inline-block border-2 border-green-300"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          >
            <MapPin className="mr-2" /> 
            <span>My Quest Map</span>
            <Rocket className="ml-2" size={20} />
          </motion.h2>
          
          {availableQuests.length > 0 && (
            <motion.div 
              className="ml-3 bg-yellow-100 px-3 py-1 rounded-full shadow-md border border-yellow-200 flex items-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-yellow-700 font-bold">{availableQuests.length} Quest{availableQuests.length !== 1 ? 's' : ''} Available</span>
            </motion.div>
          )}
        </motion.div>
        
        {availableQuests.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-8 text-center bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl shadow-lg border-2 border-blue-200">
              <div className="flex flex-col items-center">
                <motion.div 
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-md"
                  animate={{ rotate: [0, 10, 0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                >
                  <MapPin size={40} className="text-blue-500" />
                </motion.div>
                <h3 className="text-xl font-bold text-blue-700 mb-2">No Quests Available</h3>
                <p className="text-blue-600 mb-4">Your adventure map is empty for now!</p>
                <p className="text-blue-500 bg-white px-4 py-2 rounded-full shadow-inner">Check back soon for new exciting quests!</p>
              </div>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableQuests.map((quest, index) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="h-full"
              >
                <Card 
                  className="p-6 bg-gradient-to-r from-blue-100 via-blue-50 to-green-100 rounded-xl shadow-lg h-full flex flex-col relative overflow-hidden border-2 border-blue-200"
                  data-quest-id={quest.id}
                >
                  {/* Quest type badge */}
                  <div className="absolute top-2 right-2 z-10">
                    {quest.type === 'recurring' ? (
                      <motion.div 
                        className="bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md"
                        animate={{ rotate: [0, 5, 0, -5, 0] }}
                        transition={{ duration: 5, repeat: Infinity }}
                      >
                        {quest.frequency}
                      </motion.div>
                    ) : (
                      <motion.div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md"
                      >
                        One-time
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="flex items-start mb-4">
                    <motion.div 
                      className="mr-4 p-3 bg-white rounded-full shadow-md text-blue-500 border-2 border-blue-200"
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      {renderLucideIcon(quest.iconName || 'CheckCircle', { size: 28 })}
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold text-blue-700">{quest.title}</h3>
                      <p className="text-md text-blue-600 mb-3 font-medium">{quest.description}</p>
                      <motion.div 
                        className="flex items-center bg-yellow-100 px-3 py-1 rounded-full shadow-inner inline-block border border-yellow-200"
                        whileHover={{ scale: 1.05 }}
                      >
                        <Award className="text-yellow-500 mr-1" size={18} />
                        <span className="text-md font-bold text-pink-600">{quest.xp} Stars!</span>
                      </motion.div>
                    </div>
                  </div>
                  
                  {quest.image && (
                    <motion.div 
                      className="mb-4 rounded-xl overflow-hidden border-4 border-yellow-300 shadow-md"
                      whileHover={{ scale: 1.03 }}
                    >
                      <img 
                        src={quest.image} 
                        alt={quest.title} 
                        className="w-full h-48 object-cover"
                      />
                    </motion.div>
                  )}
                  
                  <div className="mt-auto pt-3">
                    <motion.button
                      onClick={() => handleClaimQuest(quest.id)}
                      className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-xl border-2 border-green-300 shadow-lg text-lg flex items-center justify-center"
                      whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <CheckCircle className="mr-2" size={20} />
                      I Did This! 🎉
                    </motion.button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>
      
      {/* Pending Verification */}
      {pendingQuests.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Shield className="mr-2" /> Waiting for Verification
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingQuests.map(quest => (
              <Card key={quest.id} className="p-6 border-l-4 border-yellow-400">
                <div className="flex items-start">
                  <div className="mr-4 text-yellow-500">
                    {renderLucideIcon(quest.iconName || 'CheckCircle', { size: 24 })}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{quest.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{quest.description}</p>
                    <div className="flex items-center">
                      <Award className="text-yellow-500 mr-1" size={16} />
                      <span className="text-sm font-medium text-indigo-600">{quest.xp} XP</span>
                    </div>
                    <p className="text-sm text-yellow-600 mt-2">
                      Waiting for parent to verify completion
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
      
      {/* Available Rewards - Enhanced with animations and game elements */}
      <motion.section 
        className="mb-8" 
        data-tutorial="rewards-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        ref={rewardListRef}
      >
        <motion.div 
          className="flex items-center mb-4"
          whileHover={{ scale: 1.02 }}
        >
          <motion.h2 
            className="text-2xl font-bold flex items-center bg-gradient-to-r from-purple-200 to-pink-200 text-purple-700 px-6 py-3 rounded-full shadow-md inline-block border-2 border-purple-300"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          >
            <Gift className="mr-2" /> 
            <span>Treasure Chest</span>
            <Sparkles className="ml-2" size={20} />
          </motion.h2>
          
          {availableRewards.length > 0 && (
            <motion.div 
              className="ml-3 bg-purple-100 px-3 py-1 rounded-full shadow-md border border-purple-200 flex items-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-purple-700 font-bold">{availableRewards.length} Reward{availableRewards.length !== 1 ? 's' : ''} Available</span>
            </motion.div>
          )}
        </motion.div>
        
        {availableRewards.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-8 text-center bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl shadow-lg border-2 border-purple-200">
              <div className="flex flex-col items-center">
                <motion.div 
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-md"
                  animate={{ rotate: [0, 10, 0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                >
                  <Gift size={40} className="text-purple-500" />
                </motion.div>
                <h3 className="text-xl font-bold text-purple-700 mb-2">Treasure Chest is Empty</h3>
                <p className="text-purple-600 mb-4">Complete quests to earn stars!</p>
                <motion.div 
                  className="text-purple-500 bg-white px-4 py-2 rounded-full shadow-inner"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="font-bold">Unlock amazing rewards with your stars!</span>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableRewards.map((reward, index) => {
              const canAfford = (childProfile.xp || 0) >= reward.cost;
              
              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="h-full"
                >
                  <Card 
                    className="p-6 bg-gradient-to-r from-purple-100 via-pink-50 to-purple-100 rounded-xl shadow-lg h-full flex flex-col relative overflow-hidden border-2 border-purple-200"
                    data-reward-id={reward.id}
                  >
                    {/* Premium badge for expensive rewards */}
                    {reward.cost >= 50 && (
                      <motion.div 
                        className="absolute top-2 right-2 z-10 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center"
                        animate={{ rotate: [0, 5, 0, -5, 0], scale: [1, 1.1, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <Trophy size={12} className="mr-1" />
                        <span>Premium</span>
                      </motion.div>
                    )}
                    
                    <div className="flex items-start mb-4">
                      <motion.div 
                        className="mr-4 p-3 bg-white rounded-full shadow-md text-pink-500 border-2 border-pink-200"
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        {renderLucideIcon(reward.iconName || 'Gift', { size: 28 })}
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-bold text-purple-700">{reward.title}</h3>
                        <p className="text-md text-pink-600 mb-3 font-medium">{reward.description}</p>
                        <motion.div 
                          className="flex items-center bg-yellow-100 px-3 py-1 rounded-full shadow-inner inline-block border border-yellow-200"
                          whileHover={{ scale: 1.05 }}
                          animate={canAfford ? { y: [0, -2, 0], x: [0, 1, 0, -1, 0] } : {}}
                          transition={canAfford ? { duration: 1.5, repeat: Infinity } : {}}
                        >
                          <Award className="text-yellow-500 mr-1" size={18} />
                          <span className="text-md font-bold text-purple-600">{reward.cost} Stars needed</span>
                        </motion.div>
                      </div>
                    </div>
                    
                    {reward.image && (
                      <motion.div 
                        className={`mb-4 rounded-xl overflow-hidden shadow-md border-4 ${canAfford ? 'border-yellow-300' : 'border-gray-200'}`}
                        whileHover={{ scale: 1.03 }}
                      >
                        <img 
                          src={reward.image} 
                          alt={reward.title} 
                          className="w-full h-48 object-cover"
                        />
                      </motion.div>
                    )}
                    
                    <div className="mt-auto pt-3">
                      {canAfford ? (
                        <motion.button
                          onClick={() => handleClaimReward(reward.id)}
                          className="w-full bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-xl border-2 border-purple-300 shadow-lg text-lg flex items-center justify-center"
                          whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                          whileTap={{ scale: 0.95 }}
                          animate={{ boxShadow: ["0px 0px 0px rgba(0,0,0,0.1)", "0px 10px 15px rgba(0,0,0,0.1)", "0px 0px 0px rgba(0,0,0,0.1)"] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Gift className="mr-2" size={20} />
                          Get My Treasure! 🎁
                        </motion.button>
                      ) : (
                        <motion.div 
                          className="w-full mt-3 bg-gradient-to-r from-gray-100 to-gray-200 text-center py-3 px-4 rounded-xl shadow-inner border border-gray-300"
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <div className="flex items-center justify-center">
                            <Lock size={16} className="text-gray-500 mr-2" />
                            <p className="text-purple-600 font-bold">
                              Need <span className="text-pink-500">{reward.cost - (childProfile.xp || 0)}</span> more stars ⭐
                            </p>
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            Complete more quests to earn stars!
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.section>
      
      {/* Pending Quests Section - Enhanced with animations */}
      {pendingQuests.length > 0 && (
        <motion.section 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div 
            className="flex items-center mb-4"
            whileHover={{ scale: 1.02 }}
          >
            <motion.h2 
              className="text-2xl font-bold flex items-center bg-gradient-to-r from-orange-200 to-yellow-200 text-orange-700 px-6 py-3 rounded-full shadow-md inline-block border-2 border-orange-300"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            >
              <Shield className="mr-2" /> 
              <span>Pending Approval</span>
              <span className="ml-2 bg-orange-500 text-white text-sm px-2 py-1 rounded-full">{pendingQuests.length}</span>
            </motion.h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingQuests.map((quest, index) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.1, duration: 0.5 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <Card className="p-6 bg-gradient-to-r from-orange-100 via-yellow-50 to-orange-100 rounded-xl shadow-lg border-2 border-orange-200 relative overflow-hidden">
                  {/* Pulsing approval badge */}
                  <motion.div 
                    className="absolute top-2 right-2 z-10 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Shield size={12} className="mr-1" />
                    <span>Pending</span>
                  </motion.div>
                  
                  <div className="flex items-start mb-4">
                    <motion.div 
                      className="mr-4 p-3 bg-white rounded-full shadow-md text-orange-500 border-2 border-orange-200"
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      animate={{ rotate: [0, 5, 0, -5, 0] }}
                      transition={{ duration: 10, repeat: Infinity, type: 'spring' }}
                    >
                      {renderLucideIcon(quest.iconName || 'CheckCircle', { size: 28 })}
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold text-orange-700">{quest.title}</h3>
                      <p className="text-md text-orange-600 mb-3 font-medium">{quest.description}</p>
                      <motion.div 
                        className="flex items-center bg-yellow-100 px-3 py-1 rounded-full shadow-inner inline-block border border-yellow-200"
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Award className="text-yellow-500 mr-1" size={18} />
                        <span className="text-md font-bold text-orange-600">{quest.xp} Stars waiting</span>
                      </motion.div>
                    </div>
                  </div>
                  
                  {quest.image && (
                    <motion.div 
                      className="mb-4 rounded-xl overflow-hidden border-4 border-yellow-300 shadow-md"
                      whileHover={{ scale: 1.03 }}
                    >
                      <img 
                        src={quest.image} 
                        alt={quest.title} 
                        className="w-full h-48 object-cover"
                      />
                    </motion.div>
                  )}
                  
                  <motion.div 
                    className="w-full mt-3 bg-gradient-to-r from-orange-50 to-yellow-50 text-center py-3 px-4 rounded-xl shadow-inner border border-orange-200"
                    animate={{ boxShadow: ["inset 0 2px 4px rgba(0,0,0,0.1)", "inset 0 4px 8px rgba(0,0,0,0.2)", "inset 0 2px 4px rgba(0,0,0,0.1)"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="flex items-center justify-center">
                      <Shield className="text-orange-500 mr-2" size={18} />
                      <p className="text-orange-600 font-bold">
                        Waiting for parent approval
                      </p>
                    </div>
                    <div className="mt-2 flex justify-center">
                      <motion.div 
                        className="bg-orange-100 h-1.5 w-24 rounded-full overflow-hidden"
                      >
                        <motion.div 
                          className="bg-orange-500 h-full"
                          animate={{ width: ["0%", "100%", "0%"] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        />
                      </motion.div>
                    </div>
                  </motion.div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
};

export default ChildDashboard;
