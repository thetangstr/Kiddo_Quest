import React, { useState, useEffect, useCallback } from 'react';
import useKiddoQuestStore from '../store';
import { X, ArrowRight, Check } from 'lucide-react';

// Custom simplified tutorial component
const SimpleTutorial = ({ onComplete }) => {
  const [step, setStep] = useState(0);
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
      if (currentUser && currentUser.uid && step === 0 && childProfiles.length === 0) {
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
  }, [currentUser, step, childProfiles, addChildProfile, fetchParentData, setSelectedChildId, createDefaultQuestsAndRewards]);
  
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
    setStep(3);
  }, [childId, questId, claimQuest, navigateTo]);
  
  // Handle next step
  const handleNext = () => {
    if (step === 2) {
      // After manage quests step, simulate child completing quest
      simulateChildClaimingQuest();
    } else if (step === 4) {
      // After approving quest, approve it in the system
      if (questId) {
        approveQuest(questId);
        setStep(step + 1);
      }
    } else {
      setStep(step + 1);
    }
  };
  
  // Handle skip
  const handleSkip = () => {
    if (onComplete) onComplete();
  };
  
  // Get content for current step
  const getStepContent = () => {
    switch (step) {
      case 0:
        return {
          title: 'Welcome to Kiddo Quest!',
          content: 'Let\'s get you started with a quick tour of the key features.',
          target: null
        };
      case 1:
        return {
          title: 'Add a Child',
          content: 'First, let\'s add a child profile. We\'ve created a sample profile named "Alex" for you.',
          target: '.add-child-button'
        };
      case 2:
        return {
          title: 'Manage Quests',
          content: 'Now, let\'s assign a quest to Alex. We\'ve created some sample quests for you.',
          target: '.manage-quests-button'
        };
      case 3:
        return {
          title: 'Approve Completed Quests',
          content: 'Great! Now you can approve Alex\'s completed quest to award them points.',
          target: '.pending-approvals-section'
        };
      case 4:
        return {
          title: 'Set a PIN',
          content: 'Finally, let\'s set a PIN to protect the parent dashboard when your child is using the app.',
          target: '.pin-setup-section'
        };
      case 5:
        return {
          title: 'All Done!',
          content: 'You\'re all set! You can now start using Kiddo Quest with your family. The sample data we created will remain for you to explore.',
          target: null
        };
      default:
        return { title: '', content: '', target: null };
    }
  };
  
  // Get element position for highlighting
  const getTargetPosition = () => {
    const { target } = getStepContent();
    if (!target) return null;
    
    const element = document.querySelector(target);
    if (!element) return null;
    
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height
    };
  };
  
  // Scroll to target element
  useEffect(() => {
    const { target } = getStepContent();
    if (!target) return;
    
    const element = document.querySelector(target);
    if (!element) return;
    
    // Scroll element into view with some padding
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [step]);
  
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
  
  // Final step - complete tutorial
  useEffect(() => {
    if (step === 6 && onComplete) {
      onComplete();
    }
  }, [step, onComplete]);
  
  const { title, content } = getStepContent();
  const targetPosition = getTargetPosition();
  
  return (
    <>
      {/* Tutorial card */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 z-40 max-w-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-indigo-700">{title}</h3>
          <button 
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
        
        <p className="text-gray-600 mb-4">{content}</p>
        
        <div className="flex justify-between items-center">
          <div className="flex space-x-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div 
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i === step ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={handleNext}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {step === 5 ? (
              <>
                Finish <Check size={16} className="ml-1" />
              </>
            ) : (
              <>
                Next <ArrowRight size={16} className="ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Highlight overlay */}
      {targetPosition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 pointer-events-none">
          <div 
            className="absolute bg-transparent border-2 border-indigo-500 rounded-md animate-pulse-border"
            style={{
              top: targetPosition.top - 4,
              left: targetPosition.left - 4,
              width: targetPosition.width + 8,
              height: targetPosition.height + 8
            }}
          />
        </div>
      )}
      
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
        
        @keyframes pulseBorder {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
          }
          50% { 
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.3);
          }
        }
        
        .animate-pulse-border {
          animation: pulseBorder 1.5s infinite;
        }
      `}</style>
    </>
  );
};

export default SimpleTutorial;
