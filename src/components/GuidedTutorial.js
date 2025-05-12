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
  
  // Tutorial steps with their content and selectors - simplified for first-run experience
  const TUTORIAL_STEPS = [
    {
      id: 'welcome',
      title: 'Welcome to Kiddo Quest!',
      content: 'This quick tutorial will help you get started with Kiddo Quest. We\'ll walk through the 4 essential steps to set up your family reward system.',
      selector: null, // No specific element to highlight for welcome
      view: 'parentDashboard',
      position: 'center',
      action: null
    },
    {
      id: 'add_child',
      title: 'Step 1: Create a Child Profile',
      content: 'First, let\'s add a child profile. Click the "Add Child" button to create your first child profile.',
      selector: '[data-tutorial="add-child"]',
      view: 'parentDashboard',
      position: 'bottom',
      action: () => navigateTo('addChild')
    },
    {
      id: 'child_profile_form',
      title: 'Create Your Child Profile',
      content: 'Enter your child\'s name and optionally upload an avatar. This profile will track their progress and rewards.',
      selector: '[data-tutorial="child-form"]',
      view: 'addChild',
      position: 'right',
      action: null // User needs to fill out the form
    },
    {
      id: 'pre_populated_quests',
      title: 'Step 2: Assign Quests to Your Child',
      content: 'We\'ve created some starter quests for you! Click "Manage Quests" to see them and assign them to your child.',
      selector: '[data-tutorial="manage-quests"]',
      view: 'parentDashboard',
      position: 'bottom',
      action: () => navigateTo('manageQuests')
    },
    {
      id: 'assign_quests',
      title: 'Assign Quests',
      content: 'Select a quest and click "Edit" to assign it to your child. Make sure to check their name in the "Assign To" section.',
      selector: '[data-tutorial="quest-list"]',
      view: 'manageQuests',
      position: 'right',
      action: null
    },
    {
      id: 'child_completes',
      title: 'Step 3: Child Quest Completion',
      content: 'Now let\'s see how your child completes quests. Click "View Dashboard" next to your child\'s profile to see their view.',
      selector: '[data-tutorial="child-profiles"]',
      view: 'parentDashboard',
      position: 'bottom',
      action: null // User needs to select a child
    },
    {
      id: 'child_view',
      title: 'Child\'s Dashboard',
      content: 'This is what your child will see. They can complete quests by clicking the "Complete" button. Try it now!',
      selector: '[data-tutorial="available-quests"]',
      view: 'childDashboard',
      position: 'top',
      action: null
    },
    {
      id: 'parent_approval',
      title: 'Parent Approval',
      content: 'After your child completes a quest, you\'ll need to approve it. Return to the parent dashboard to see pending approvals.',
      selector: '[data-tutorial="parent-link"]',
      view: 'childDashboard',
      position: 'top',
      action: null
    },
    {
      id: 'setup_pin',
      title: 'Step 4: Set Up Your Parent PIN',
      content: 'Important! Set up a 4-digit PIN to protect your parent dashboard. This prevents children from approving their own quests.',
      selector: '[data-tutorial="pin-setup"]',
      view: 'parentDashboard',
      position: 'bottom',
      action: null
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      content: 'Great job! You\'ve completed the essential setup for Kiddo Quest. Explore the app to discover more features like custom rewards and recurring quests!',
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
  
  // Handle next step or close
  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      // Execute action if defined
      if (currentStepData.action) {
        currentStepData.action();
      }
      
      setCurrentStep(currentStep + 1);
    } else {
      // Mark tutorial as seen when completed
      localStorage.setItem('kiddoquest_tutorial_seen', 'true');
      setIsVisible(false);
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
