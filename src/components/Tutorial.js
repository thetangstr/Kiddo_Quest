import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Star, CheckCircle, Award, Gift } from 'lucide-react';
import { Button } from './UI';

// Tutorial steps with their content
const TUTORIAL_STEPS = {
  WELCOME: {
    id: 'welcome',
    title: 'Welcome to Kiddo Quest!',
    content: 'This quick tutorial will show you how to use the app. Let\'s learn how quests and rewards work!',
    icon: Star
  },
  PARENT_QUEST: {
    id: 'parent_quest',
    title: 'Step 1: Create a Quest',
    content: 'As a parent, you can create fun missions (quests) for your child to complete. Click "Manage Quests" and then "Create New Quest" to add activities like "Clean your room" or "Read a book".',
    icon: CheckCircle
  },
  CHILD_COMPLETE: {
    id: 'child_complete',
    title: 'Step 2: Child Completes the Quest',
    content: 'Your child can see their quests in their dashboard. When they finish a quest, they click "Complete" to let you know it\'s done!',
    icon: CheckCircle
  },
  PARENT_APPROVE: {
    id: 'parent_approve',
    title: 'Step 3: Parent Approves',
    content: 'You\'ll see completed quests in the "Pending Verification" section of your dashboard. Check that the quest is done, then click "Approve" to award XP to your child!',
    icon: Award
  },
  CHILD_REWARD: {
    id: 'child_reward',
    title: 'Step 4: Claim Rewards',
    content: 'Your child earns XP for each completed quest. They can use this XP to claim rewards you\'ve created, like "Extra screen time" or "Choose dinner".',
    icon: Gift
  },
  COMPLETE: {
    id: 'complete',
    title: 'You\'re Ready!',
    content: 'That\'s it! You now know the basics of Kiddo Quest. Explore the app to discover more features and make chores fun for your kids!',
    icon: Star
  }
};

// Main Tutorial Component
export const Tutorial = ({ onClose, initialStep = 'WELCOME' }) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isVisible, setIsVisible] = useState(true);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  
  const steps = Object.keys(TUTORIAL_STEPS);
  const currentStepIndex = steps.indexOf(currentStep);
  const currentStepData = TUTORIAL_STEPS[currentStep];
  
  const IconComponent = currentStepData.icon;
  
  // Check if user has seen the tutorial before
  useEffect(() => {
    const tutorialSeen = localStorage.getItem('kiddoquest_tutorial_seen');
    if (tutorialSeen === 'true') {
      setHasSeenTutorial(true);
    }
  }, []);
  
  // Handle next step
  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1]);
    } else {
      handleComplete();
    }
  };
  
  // Handle previous step
  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };
  
  // Handle tutorial completion
  const handleComplete = () => {
    localStorage.setItem('kiddoquest_tutorial_seen', 'true');
    setIsVisible(false);
    
    // Allow animation to complete before calling onClose
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };
  
  // Skip tutorial
  const handleSkip = () => {
    localStorage.setItem('kiddoquest_tutorial_seen', 'true');
    setIsVisible(false);
    
    // Allow animation to complete before calling onClose
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };
  
  if (hasSeenTutorial && initialStep === 'WELCOME') {
    return null;
  }
  
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden transform transition-transform duration-300 scale-100">
        {/* Tutorial Header */}
        <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-medium">
            {currentStepData.title}
          </h3>
          <button 
            onClick={handleSkip}
            className="text-white hover:text-indigo-100 focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Tutorial Content */}
        <div className="p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-indigo-100 rounded-full p-4 mb-4">
              <IconComponent size={48} className="text-indigo-600" />
            </div>
            <p className="text-gray-700 text-center">
              {currentStepData.content}
            </p>
          </div>
          
          {/* Progress Indicators */}
          <div className="flex justify-center mb-6">
            {steps.map((step, index) => (
              <div 
                key={step}
                className={`w-2 h-2 rounded-full mx-1 ${
                  index === currentStepIndex ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
              icon={ChevronLeft}
              className={currentStepIndex === 0 ? 'invisible' : ''}
            >
              Previous
            </Button>
            
            <Button
              variant="primary"
              onClick={handleNext}
              icon={currentStepIndex < steps.length - 1 ? ChevronRight : undefined}
              iconPosition="right"
            >
              {currentStepIndex < steps.length - 1 ? 'Next' : 'Got it!'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mini Tutorial Component (for specific features)
export const MiniTutorial = ({ title, content, onClose, icon: Icon = Star }) => {
  const [isVisible, setIsVisible] = useState(true);
  
  const handleClose = () => {
    setIsVisible(false);
    
    // Allow animation to complete before calling onClose
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };
  
  return (
    <div className={`fixed bottom-4 right-4 max-w-xs w-full bg-white rounded-lg shadow-lg transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="bg-indigo-600 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
        <h3 className="text-sm font-medium flex items-center">
          <Icon size={16} className="mr-2" />
          {title}
        </h3>
        <button 
          onClick={handleClose}
          className="text-white hover:text-indigo-100 focus:outline-none"
        >
          <X size={16} />
        </button>
      </div>
      <div className="p-4">
        <p className="text-gray-700 text-sm">
          {content}
        </p>
        <div className="mt-3 flex justify-end">
          <Button
            variant="primary"
            onClick={handleClose}
            className="text-xs py-1 px-2"
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
};

// Function to check if tutorial should be shown
export const shouldShowTutorial = () => {
  return localStorage.getItem('kiddoquest_tutorial_seen') !== 'true';
};
