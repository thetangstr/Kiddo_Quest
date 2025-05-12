import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import useKiddoQuestStore from '../store';
import { Shield, Gift, CheckCircle, ArrowLeft, Award, Key } from 'lucide-react';

// Custom styles for Shepherd
const shepherdStyles = `
  .shepherd-element {
    max-width: 400px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    font-family: 'Inter', sans-serif;
  }
  
  .shepherd-header {
    background-color: #6366f1;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    padding: 16px;
  }
  
  .shepherd-title {
    color: white;
    font-size: 18px;
    font-weight: 600;
  }
  
  .shepherd-text {
    padding: 16px;
    font-size: 15px;
    line-height: 1.5;
    color: #4b5563;
  }
  
  .shepherd-footer {
    padding: 12px 16px;
    border-top: 1px solid #e5e7eb;
  }
  
  .shepherd-button {
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.2s;
    margin-left: 8px;
  }
  
  .shepherd-button-primary {
    background-color: #6366f1;
    color: white;
  }
  
  .shepherd-button-primary:hover {
    background-color: #4f46e5;
  }
  
  .shepherd-button-secondary {
    background-color: #f3f4f6;
    color: #4b5563;
  }
  
  .shepherd-button-secondary:hover {
    background-color: #e5e7eb;
  }
  
  .shepherd-highlight {
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.3);
    border-radius: 4px;
    transition: all 0.2s;
  }
  
  .shepherd-target {
    position: relative;
    z-index: 9999;
  }
  
  .shepherd-modal-overlay-container {
    background-color: rgba(0, 0, 0, 0.5);
  }
`;

// Custom tutorial component using Shepherd.js
const ShepherdTutorial = ({ onComplete }) => {
  const [tour, setTour] = useState(null);
  const [childId, setChildId] = useState(null);
  const [questId, setQuestId] = useState(null);
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  
  const { 
    navigateTo, 
    currentUser,
    childProfiles,
    quests,
    rewards,
    addChildProfile,
    fetchParentData,
    setSelectedChildId,
    approveQuest,
    claimQuest,
    createDefaultQuestsAndRewards
  } = useKiddoQuestStore();
  
  // Create sample data if none exists
  useEffect(() => {
    const setupSampleData = async () => {
      if (currentUser && currentUser.uid) {
        try {
          console.log('Checking for existing data...');
          
          // Check if we already have child profiles
          if (childProfiles.length === 0) {
            console.log('Creating sample child profile...');
            const childData = {
              name: 'Alex',
              age: 8,
              avatar: '👧',
              points: 0
            };
            
            const result = await addChildProfile(childData);
            if (result.success) {
              console.log('Sample child created with ID:', result.childId);
              setChildId(result.childId);
              setSelectedChildId(result.childId);
            }
          } else {
            // Use the first child profile
            setChildId(childProfiles[0].id);
            setSelectedChildId(childProfiles[0].id);
          }
          
          // Check if we need to create sample quests and rewards
          if (quests.length === 0 || rewards.length === 0) {
            console.log('Creating sample quests and rewards...');
            // Make sure we have a valid childId before calling createDefaultQuestsAndRewards
            const validChildId = childId || (childProfiles && childProfiles.length > 0 ? childProfiles[0].id : null);
            
            if (currentUser.uid && validChildId) {
              await createDefaultQuestsAndRewards(currentUser.uid, validChildId);
            } else {
              console.log('Cannot create sample data - missing userId or childId');
            }
          }
          
          // Refresh data to ensure we have everything
          await fetchParentData(currentUser.uid);
          
          // Set a quest ID for the tutorial
          if (quests.length > 0 && !questId) {
            const sampleQuest = quests.find(q => q.status === 'active');
            if (sampleQuest) {
              setQuestId(sampleQuest.id);
            }
          }
        } catch (error) {
          console.error('Error setting up sample data:', error);
        }
      }
    };
    
    setupSampleData();
  }, [currentUser, childProfiles, quests, rewards, questId, childId, addChildProfile, fetchParentData, setSelectedChildId, createDefaultQuestsAndRewards]);
  
  // Handle simulation of child claiming quest
  const simulateChildClaimingQuest = useCallback(async () => {
    if (!childId || !questId) return;
    
    if (tour) {
      tour.pause(); // Pause the tour during simulation
    }
    
    setShowSimulation(true);
    
    // Step 1: Show child view
    setSimulationStep(1);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Highlight the "I did it!" button
    setSimulationStep(2);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Simulate clicking the button
    setSimulationStep(3);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 4: Actually claim the quest
    await claimQuest(questId, childId);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Step 5: Return to parent view
    setShowSimulation(false);
    navigateTo('parentDashboard');
    
    // Resume the tour
    if (tour) {
      setTimeout(() => {
        tour.show('approve-quest');
      }, 500);
    }
  }, [childId, questId, claimQuest, navigateTo, tour]);
  
  // Initialize Shepherd tour
  useEffect(() => {
    // Add custom styles
    if (!document.getElementById('shepherd-custom-styles')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'shepherd-custom-styles';
      styleElement.textContent = shepherdStyles;
      document.head.appendChild(styleElement);
    }
    
    // Create new tour
    const newTour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: {
          enabled: true
        },
        classes: 'shepherd-theme-custom',
        scrollTo: true,
        modalOverlayOpeningPadding: 10,
        highlightClass: 'shepherd-highlight',
        exitOnEsc: false,
        canClickTarget: false
      },
      useModalOverlay: true
    });
    
    // Define tour steps
    newTour.addStep({
      id: 'welcome',
      text: 'Welcome to Kiddo Quest! Let\'s get you started with a quick tour of the key features.',
      buttons: [
        {
          text: 'Skip Tour',
          action: newTour.complete,
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Next',
          action: newTour.next,
          classes: 'shepherd-button-primary'
        }
      ],
      classes: 'shepherd-welcome-step',
      scrollTo: false
    });
    
    newTour.addStep({
      id: 'add-child',
      attachTo: {
        element: '.add-child-button',
        on: 'bottom'
      },
      title: 'Add Child Profiles',
      text: 'First, let\'s add a child profile. We\'ve created a sample profile named "Alex" for you.',
      buttons: [
        {
          text: 'Back',
          action: newTour.back,
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Next',
          action: newTour.next,
          classes: 'shepherd-button-primary'
        }
      ]
    });
    
    newTour.addStep({
      id: 'manage-quests',
      attachTo: {
        element: '.manage-quests-button',
        on: 'bottom'
      },
      title: 'Manage Quests',
      text: 'Now, let\'s see how to manage quests. Click "Next" and we\'ll simulate a child completing a quest.',
      buttons: [
        {
          text: 'Back',
          action: newTour.back,
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Next',
          action: () => {
            simulateChildClaimingQuest();
          },
          classes: 'shepherd-button-primary'
        }
      ]
    });
    
    newTour.addStep({
      id: 'approve-quest',
      attachTo: {
        element: '.pending-approvals-section',
        on: 'bottom'
      },
      title: 'Approve Completed Quests',
      text: 'Great! Now you can approve Alex\'s completed quest to award them points.',
      buttons: [
        {
          text: 'Back',
          action: newTour.back,
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Next',
          action: newTour.next,
          classes: 'shepherd-button-primary'
        }
      ]
    });
    
    newTour.addStep({
      id: 'change-pin',
      attachTo: {
        element: '.change-pin-button',
        on: 'bottom'
      },
      title: 'Set Security PIN',
      text: 'Finally, you can set a PIN to protect the parent dashboard when your child is using the app.',
      buttons: [
        {
          text: 'Back',
          action: newTour.back,
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Next',
          action: newTour.next,
          classes: 'shepherd-button-primary'
        }
      ]
    });
    
    newTour.addStep({
      id: 'finish',
      title: 'You\'re All Set!',
      text: 'You\'re all set! You can now start using Kiddo Quest with your family. The sample data we created will remain for you to explore.',
      buttons: [
        {
          text: 'Finish',
          action: () => {
            newTour.complete();
            if (onComplete) onComplete();
          },
          classes: 'shepherd-button-primary'
        }
      ],
      scrollTo: false
    });
    
    // Save tour to state
    setTour(newTour);
    
    // Start tour
    newTour.start();
    
    // Cleanup on unmount
    return () => {
      if (newTour) {
        newTour.complete();
      }
      
      // Remove custom styles
      const styleElement = document.getElementById('shepherd-custom-styles');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, [simulateChildClaimingQuest, onComplete]);
  
  // Render simulation overlay
  const renderSimulation = () => {
    if (!showSimulation) return null;
    
    return (
      <div className="fixed inset-0 bg-white z-[10000] flex flex-col">
        <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Alex's Dashboard</h1>
          <div className="text-sm">Simulation Mode</div>
        </div>
        
        <div className="flex-grow p-6 flex flex-col items-center justify-center">
          {simulationStep === 1 && (
            <div className="text-center mb-8 animate-fade-in">
              <h2 className="text-2xl font-bold mb-4">This is what your child will see</h2>
              <p className="text-gray-600">We're simulating the child's view</p>
            </div>
          )}
          
          {simulationStep >= 2 && (
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl mr-4">
                  👧
                </div>
                <div>
                  <h3 className="text-lg font-medium">Clean your room</h3>
                  <p className="text-sm text-gray-600">50 points</p>
                </div>
              </div>
              
              <button 
                className={`w-full py-3 px-4 rounded-lg font-medium ${
                  simulationStep === 2 
                    ? 'bg-green-500 text-white animate-pulse' 
                    : simulationStep === 3 
                      ? 'bg-green-700 text-white' 
                      : 'bg-green-500 text-white'
                }`}
              >
                {simulationStep === 3 ? 'Done! ✓' : 'I did it!'}
              </button>
            </div>
          )}
          
          {simulationStep === 3 && (
            <div className="text-center text-green-600 animate-bounce">
              Quest completed! Returning to parent view...
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <>
      {renderSimulation()}
      
      {/* Add some global styles for animations */}
      <style jsx="true">{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        .animate-pulse {
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(72, 187, 120, 0.7);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 0 10px rgba(72, 187, 120, 0);
            transform: scale(1.05);
          }
        }
        
        .animate-bounce {
          animation: bounce 1s infinite;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </>
  );
};

export default ShepherdTutorial;
