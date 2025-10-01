import React, { useState, useEffect, useCallback } from 'react';
import Joyride, { STATUS, ACTIONS } from 'react-joyride';
import useKiddoQuestStore from '../store';

// Custom tutorial component using React Joyride
const JoyrideTutorial = ({ onComplete }) => {
  const [runTutorial, setRunTutorial] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [childId, setChildId] = useState(null);
  const [questId, setQuestId] = useState(null);
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  
  const { 
    navigateTo, 
    currentUser,
    currentView,
    childProfiles,
    quests,
    addChildProfile,
    fetchParentData,
    setSelectedChildId,
    approveQuest,
    claimQuest,
    createDefaultQuestsAndRewards
  } = useKiddoQuestStore();
  
  // Create a sample child if none exists
  useEffect(() => {
    const setupSampleData = async () => {
      if (currentUser && currentUser.uid && stepIndex === 0 && childProfiles.length === 0) {
        try {
          console.log('Creating sample child for tutorial...');
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
            
            // Create default quests and rewards
            await createDefaultQuestsAndRewards(currentUser.uid, result.childId);
            await fetchParentData(currentUser.uid);
          }
        } catch (error) {
          console.error('Error creating sample child:', error);
        }
      }
    };
    
    setupSampleData();
  }, [currentUser, stepIndex, childProfiles, addChildProfile, fetchParentData, setSelectedChildId, createDefaultQuestsAndRewards]);
  
  // Set quest ID when quests are loaded
  useEffect(() => {
    if (quests.length > 0 && !questId && childId) {
      const sampleQuest = quests.find(q => 
        q.status === 'active' && 
        q.assignedTo?.includes(childId)
      );
      
      if (sampleQuest) {
        setQuestId(sampleQuest.id);
      }
    }
  }, [quests, questId, childId]);
  
  // Handle simulation of child claiming quest
  const simulateChildClaimingQuest = useCallback(async () => {
    if (!childId || !questId) return;
    
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
    setStepIndex(prevIndex => prevIndex + 1);
  }, [childId, questId, claimQuest, navigateTo]);
  
  // Tutorial steps
  const steps = [
    // Step 1: Welcome
    {
      target: 'body',
      content: 'Welcome to Kiddo Quest! Let\'s get you started with a quick tour of the key features.',
      placement: 'center',
      disableBeacon: true,
      styles: {
        options: {
          width: 400,
        }
      }
    },
    // Step 2: Add a child
    {
      target: '.add-child-button',
      content: 'First, let\'s add a child profile. We\'ve created a sample profile named "Alex" for you.',
      placement: 'bottom',
      disableBeacon: true,
      spotlightClicks: false
    },
    // Step 3: Manage quests
    {
      target: '.manage-quests-button',
      content: 'Now, let\'s assign a quest to Alex. We\'ve created some sample quests for you.',
      placement: 'bottom',
      disableBeacon: true,
      spotlightClicks: true
    },
    // Step 4: Simulate child completing quest
    {
      target: '.child-profile-card',
      content: 'Let\'s see what happens when Alex completes a quest. We\'ll simulate this for you.',
      placement: 'bottom',
      disableBeacon: true,
      spotlightClicks: false
    },
    // Step 5: Approve quest
    {
      target: '.pending-approvals-section',
      content: 'Great! Now you can approve Alex\'s completed quest to award them points.',
      placement: 'bottom',
      disableBeacon: true,
      spotlightClicks: true
    },
    // Step 6: Set a PIN
    {
      target: '.pin-setup-section',
      content: 'Finally, let\'s set a PIN to protect the parent dashboard when your child is using the app.',
      placement: 'top',
      disableBeacon: true,
      spotlightClicks: true
    },
    // Step 7: All done
    {
      target: 'body',
      content: 'You\'re all set! You can now start using Kiddo Quest with your family. The sample data we created will remain for you to explore.',
      placement: 'center',
      disableBeacon: true
    }
  ];
  
  // Handle Joyride callback
  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data;
    
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Tutorial complete
      setRunTutorial(false);
      if (onComplete) onComplete();
    } else if (type === 'step:after' && action === ACTIONS.NEXT) {
      // Handle special cases when moving to next step
      if (index === 2) {
        // After manage quests step, simulate child completing quest
        simulateChildClaimingQuest();
        return; // Don't increment step index yet
      } else if (index === 4) {
        // After approving quest, approve it in the system
        if (questId) {
          approveQuest(questId);
        }
      }
      
      // Move to next step
      setStepIndex(index + 1);
    } else if (type === 'step:after' && action === ACTIONS.PREV) {
      // Move to previous step
      setStepIndex(index - 1);
    }
  };
  
  // Render simulation overlay
  const renderSimulation = () => {
    if (!showSimulation) return null;
    
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
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
      <Joyride
        steps={steps}
        run={runTutorial}
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#6366F1', // Indigo color
            zIndex: 1000,
          },
          buttonNext: {
            backgroundColor: '#6366F1'
          },
          buttonBack: {
            color: '#6366F1'
          }
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
      `}</style>
    </>
  );
};

export default JoyrideTutorial;
