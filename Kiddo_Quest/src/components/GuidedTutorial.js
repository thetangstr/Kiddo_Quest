import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, Info, Star } from 'lucide-react';
import { Button } from './UI';
import useKiddoQuestStore from '../store';

// Guided Tutorial Component
export const GuidedTutorial = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [targetElement, setTargetElement] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [tooltipSize, setTooltipSize] = useState({ width: 300, height: 150 });
  const tooltipRef = useRef(null);
  const highlightRef = useRef(null);
  
  const { navigateTo, currentView } = useKiddoQuestStore();
  
  // Tutorial steps with their content and selectors
  const TUTORIAL_STEPS = [
    {
      id: 'welcome',
      title: 'Welcome to Kiddo Quest!',
      content: 'This tutorial will guide you through creating and managing quests for your children. Let\'s get started!',
      selector: null, // No specific element to highlight for welcome
      view: 'parentDashboard',
      position: 'center',
      action: null
    },
    {
      id: 'manage_quests',
      title: 'Step 1: Manage Quests',
      content: 'Click on "Manage Quests" to start creating fun missions for your child.',
      selector: '[data-tutorial="manage-quests"]',
      view: 'parentDashboard',
      position: 'bottom',
      action: () => navigateTo('manageQuests')
    },
    {
      id: 'create_quest',
      title: 'Step 2: Create a New Quest',
      content: 'Click "Create New Quest" to add a new activity for your child.',
      selector: '[data-tutorial="create-quest"]',
      view: 'manageQuests',
      position: 'bottom',
      action: () => navigateTo('questForm')
    },
    {
      id: 'fill_quest_form',
      title: 'Step 3: Fill Quest Details',
      content: 'Enter a title, description, and XP reward for the quest. Then click "Create Quest" to save it.',
      selector: '[data-tutorial="quest-form"]',
      view: 'questForm',
      position: 'right',
      action: null // User needs to fill out the form
    },
    {
      id: 'child_dashboard',
      title: 'Step 4: Child Dashboard',
      content: 'Your child will see their quests here. They can click "Complete" when they finish a task.',
      selector: '[data-tutorial="child-dashboard"]',
      view: 'childDashboard',
      position: 'top',
      action: null
    },
    {
      id: 'parent_approve',
      title: 'Step 5: Parent Approval',
      content: 'Once your child marks a quest as complete, you\'ll see it here for approval. Click "Approve" to award XP.',
      selector: '[data-tutorial="pending-quests"]',
      view: 'parentDashboard',
      position: 'bottom',
      action: null
    },
    {
      id: 'claim_reward',
      title: 'Step 6: Claim Rewards',
      content: 'Your child can use earned XP to claim rewards you\'ve created. They\'ll see available rewards in their dashboard.',
      selector: '[data-tutorial="rewards-section"]',
      view: 'childDashboard',
      position: 'bottom',
      action: null
    },
    {
      id: 'setup_pin',
      title: 'Step 7: Set Up Your PIN',
      content: 'Set up a 4-digit PIN to protect your parent dashboard. This PIN will be required when accessing parent features from the child dashboard.',
      selector: '[data-tutorial="pin-setup"]',
      view: 'parentDashboard',
      position: 'bottom',
      action: null
    },
    {
      id: 'complete',
      title: 'You\'re Ready!',
      content: 'That\'s it! You now know how to use Kiddo Quest. Explore the app to discover more features!',
      selector: null,
      view: 'parentDashboard',
      position: 'center',
      action: null
    }
  ];
  
  const currentStepData = TUTORIAL_STEPS[currentStep];
  
  // Position tooltip based on target element
  const positionTooltip = () => {
    if (!currentStepData.selector || currentStepData.position === 'center') {
      // Center the tooltip on screen
      setTooltipPosition({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      });
      setTargetElement(null);
      return;
    }
    
    const element = document.querySelector(currentStepData.selector);
    if (!element) {
      console.warn(`Element with selector ${currentStepData.selector} not found`);
      setTooltipPosition({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      });
      setTargetElement(null);
      return;
    }
    
    setTargetElement(element);
    const rect = element.getBoundingClientRect();
    const tooltipWidth = tooltipSize.width;
    const tooltipHeight = tooltipSize.height;
    
    // Position based on specified position
    switch (currentStepData.position) {
      case 'top':
        setTooltipPosition({
          top: rect.top - tooltipHeight - 10,
          left: rect.left + (rect.width / 2) - (tooltipWidth / 2)
        });
        break;
      case 'bottom':
        setTooltipPosition({
          top: rect.bottom + 10,
          left: rect.left + (rect.width / 2) - (tooltipWidth / 2)
        });
        break;
      case 'left':
        setTooltipPosition({
          top: rect.top + (rect.height / 2) - (tooltipHeight / 2),
          left: rect.left - tooltipWidth - 10
        });
        break;
      case 'right':
        setTooltipPosition({
          top: rect.top + (rect.height / 2) - (tooltipHeight / 2),
          left: rect.right + 10
        });
        break;
      default:
        setTooltipPosition({
          top: rect.bottom + 10,
          left: rect.left + (rect.width / 2) - (tooltipWidth / 2)
        });
    }
  };
  
  // Create highlight element around target
  const highlightTarget = () => {
    if (!targetElement || !highlightRef.current) return;
    
    const rect = targetElement.getBoundingClientRect();
    
    highlightRef.current.style.top = `${rect.top - 5}px`;
    highlightRef.current.style.left = `${rect.left - 5}px`;
    highlightRef.current.style.width = `${rect.width + 10}px`;
    highlightRef.current.style.height = `${rect.height + 10}px`;
    highlightRef.current.style.display = 'block';
  };
  
  // Update tooltip size after render
  useEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      setTooltipSize({
        width: rect.width,
        height: rect.height
      });
    }
  }, [currentStep]);
  
  // Position tooltip whenever step changes or view changes
  useEffect(() => {
    // Check if we're on the correct view for this step
    if (currentView !== currentStepData.view) {
      // If we need to navigate to a different view
      if (currentStepData.view) {
        navigateTo(currentStepData.view);
      }
    }
    
    // Position tooltip after a short delay to ensure DOM is updated
    const timer = setTimeout(() => {
      positionTooltip();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [currentStep, currentView, currentStepData.view]);
  
  // Update highlight when target element changes
  useEffect(() => {
    if (targetElement) {
      highlightTarget();
      
      // Add pulse effect to target element
      targetElement.classList.add('tutorial-pulse');
      
      return () => {
        targetElement.classList.remove('tutorial-pulse');
      };
    }
  }, [targetElement, tooltipPosition]);
  
  // Handle next step
  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      // Execute action if defined
      if (currentStepData.action) {
        currentStepData.action();
      }
      
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };
  
  // Handle tutorial completion
  const handleComplete = () => {
    localStorage.setItem('kiddoquest_tutorial_seen', 'true');
    setIsVisible(false);
    navigateTo('parentDashboard');
  };
  
  // Skip tutorial
  const handleSkip = () => {
    localStorage.setItem('kiddoquest_tutorial_seen', 'true');
    setIsVisible(false);
    navigateTo('parentDashboard');
  };
  
  if (!isVisible) return null;
  
  return (
    <>
      {/* Semi-transparent overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleSkip} />
      
      {/* Highlight for target element */}
      <div 
        ref={highlightRef}
        className="fixed border-2 border-indigo-500 rounded-md z-50 pointer-events-none"
        style={{
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          display: targetElement ? 'block' : 'none'
        }}
      />
      
      {/* Tooltip */}
      <div 
        ref={tooltipRef}
        className="fixed bg-white rounded-lg shadow-xl z-50 w-80 p-4"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: tooltipPosition.transform || 'none'
        }}
      >
        {/* Tooltip Header */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-indigo-600 flex items-center">
            <Info size={20} className="mr-2" />
            {currentStepData.title}
          </h3>
          <button 
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Tooltip Content */}
        <p className="text-gray-700 mb-4">
          {currentStepData.content}
        </p>
        
        {/* Progress Indicators */}
        <div className="flex justify-center mb-4">
          {TUTORIAL_STEPS.map((_, index) => (
            <div 
              key={index}
              className={`w-2 h-2 rounded-full mx-1 ${
                index === currentStep ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="text-sm px-3 py-1"
          >
            Skip Tutorial
          </Button>
          
          <Button
            variant="primary"
            onClick={handleNext}
            icon={currentStep < TUTORIAL_STEPS.length - 1 ? ChevronRight : undefined}
            iconPosition="right"
            className="text-sm px-3 py-1"
          >
            {currentStep < TUTORIAL_STEPS.length - 1 ? 'Next' : 'Finish'}
          </Button>
        </div>
      </div>
    </>
  );
};

// Function to check if tutorial should be shown
export const shouldShowGuidedTutorial = () => {
  return localStorage.getItem('kiddoquest_tutorial_seen') !== 'true';
};
