import React, { useState, useEffect, useCallback } from 'react';
import { Steps } from 'intro.js-react';
import 'intro.js/introjs.css';
import useKiddoQuestStore from '../store';
import { Shield, Gift, CheckCircle, ArrowLeft, Award } from 'lucide-react';

// Custom tutorial component using Intro.js
const IntroJsTutorial = ({ onComplete }) => {
  const [enabled, setEnabled] = useState(true);
  const [initialStep, setInitialStep] = useState(0);
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
            await createDefaultQuestsAndRewards(currentUser.uid, childId || childProfiles[0]?.id);
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
    
    setEnabled(false); // Pause the tutorial
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
    
    // Continue to next step in tutorial
    setInitialStep(3); // Move to the approve quest step
    setEnabled(true); // Resume the tutorial
  }, [childId, questId, claimQuest, navigateTo]);
  
  // Tutorial steps for Intro.js
  const steps = [
    {
      element: '.intro-welcome',
      intro: 'Welcome to Kiddo Quest! Let\'s get you started with a quick tour of the key features.',
      position: 'center'
    },
    {
      element: '.add-child-button',
      intro: 'First, let\'s add a child profile. We\'ve created a sample profile named "Alex" for you.',
      position: 'bottom'
    },
    {
      element: '.manage-quests-button',
      intro: 'Now, let\'s see how to manage quests. Click "Next" and we\'ll simulate a child completing a quest.',
      position: 'bottom',
      tooltipClass: 'intro-highlight-tooltip',
      highlightClass: 'intro-highlight-element'
    },
    {
      element: '.pending-approvals-section',
      intro: 'Great! Now you can approve Alex\'s completed quest to award them points.',
      position: 'bottom',
      tooltipClass: 'intro-highlight-tooltip',
      highlightClass: 'intro-highlight-element'
    },
    {
      element: '.change-pin-button',
      intro: 'Finally, you can set a PIN to protect the parent dashboard when your child is using the app.',
      position: 'left',
      tooltipClass: 'intro-highlight-tooltip',
      highlightClass: 'intro-highlight-element'
    },
    {
      element: '.intro-welcome',
      intro: 'You\'re all set! You can now start using Kiddo Quest with your family. The sample data we created will remain for you to explore.',
      position: 'center'
    }
  ];
  
  // Handle Intro.js events
  const onExit = () => {
    setEnabled(false);
    if (onComplete) onComplete();
  };
  
  const onChange = (nextStepIndex) => {
    // If moving to the simulation step
    if (nextStepIndex === 3 && initialStep === 2) {
      simulateChildClaimingQuest();
    }
  };
  
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
  
  // Add a hidden element for the welcome step
  useEffect(() => {
    // Create a hidden element for intro steps that don't have a specific target
    if (!document.querySelector('.intro-welcome')) {
      const welcomeEl = document.createElement('div');
      welcomeEl.className = 'intro-welcome';
      welcomeEl.style.position = 'fixed';
      welcomeEl.style.top = '50%';
      welcomeEl.style.left = '50%';
      welcomeEl.style.width = '1px';
      welcomeEl.style.height = '1px';
      welcomeEl.style.opacity = '0';
      welcomeEl.style.pointerEvents = 'none';
      document.body.appendChild(welcomeEl);
      
      return () => {
        if (document.querySelector('.intro-welcome')) {
          document.body.removeChild(welcomeEl);
        }
      };
    }
  }, []);
  
  return (
    <>
      <Steps
        enabled={enabled}
        steps={steps}
        initialStep={initialStep}
        onExit={onExit}
        onChange={onChange}
        options={{
          doneLabel: 'Finish',
          showBullets: true,
          showProgress: true,
          hideNext: false,
          hidePrev: false,
          exitOnOverlayClick: false,
          scrollToElement: true,
          disableInteraction: false
        }}
      />
      
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
        
        .intro-highlight-element {
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5) !important;
          border-radius: 4px !important;
        }
        
        .intro-highlight-tooltip {
          max-width: 300px !important;
        }
        
        .introjs-tooltip {
          min-width: 250px !important;
        }
      `}</style>
    </>
  );
};

export default IntroJsTutorial;
