import React, { useState, useEffect } from 'react';
import { X, Camera, Smile, Check, ArrowLeft, Shield, Star } from 'lucide-react';
import { Button, InputField, Card } from './UI';
import useKiddoQuestStore from '../store';
import { auth } from '../firebase';

// Enhanced Wizard Tutorial Component
export const GuidedTutorial = () => {
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0); // 0 = Welcome, 1 = Add Child, 2 = Set PIN
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Child profile form state
  const [childName, setChildName] = useState('');
  const [childAvatar, setChildAvatar] = useState('👦');
  const [avatarFile, setAvatarFile] = useState(null);
  
  // PIN setup state
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);
  const [showFinalDialog, setShowFinalDialog] = useState(false);
  
  // Store access
  const { 

    addChildProfile, 
    setParentPin,

    navigateTo 
  } = useKiddoQuestStore();

  // Available avatar options
  const avatarOptions = ['👦', '👧', '👶', '🧒', '👼', '🦸‍♂️', '🦸‍♀️', '🧚', '🦊', '🐱', '🐶', '🐼', '🐯', '🦁', '🐨', '🐵'];

  // Check tutorial visibility and handle reset flags
  useEffect(() => {
    // Get current tutorial status
    const tutorialSeen = localStorage.getItem('kiddoquest_tutorial_seen') === 'true';
    
    // Check reset flags
    const globalResetFlag = localStorage.getItem('kiddoquest_global_tutorial_reset') === 'true';
    const userEmail = auth.currentUser?.email;
    const userResetFlag = userEmail ? 
      localStorage.getItem(`kiddoquest_tutorial_reset_${userEmail.replace(/[.@]/g, '_')}`) === 'true' : false;
    
    // If there are any reset flags, clear them and show the tutorial
    if (globalResetFlag || userResetFlag) {
      // Clear the reset flags immediately
      localStorage.removeItem('kiddoquest_global_tutorial_reset');
      if (userEmail) {
        localStorage.removeItem(`kiddoquest_tutorial_reset_${userEmail.replace(/[.@]/g, '_')}`);
      }
      
      // Show the tutorial (override the tutorialSeen flag)
      setIsVisible(true);
      // Reset the localStorage flag to ensure it's not marked as seen
      localStorage.removeItem('kiddoquest_tutorial_seen');
    } else if (tutorialSeen) {
      // If tutorial has been seen and there are no reset flags, don't show
      setIsVisible(false);
    }
  }, []);

  // Mark tutorial as complete and close it
  const completeTutorial = () => {
    localStorage.setItem('kiddoquest_tutorial_seen', 'true');
    
    // Clear any reset flags
    localStorage.removeItem('kiddoquest_global_tutorial_reset');
    
    // Clear user-specific reset flag if applicable
    const userEmail = auth.currentUser?.email;
    if (userEmail) {
      localStorage.removeItem(`kiddoquest_tutorial_reset_${userEmail.replace(/[.@]/g, '_')}`);
    }
    
    setIsVisible(false);
  };

  // Handle child profile submission
  const handleAddChild = async () => {
    if (!childName.trim()) {
      setError('Please enter a name for your child');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await addChildProfile({
        name: childName,
        avatar: avatarFile ? URL.createObjectURL(avatarFile) : childAvatar,
        avatarFile,
        xp: 0
      });
      
      setSuccess('Child profile created successfully!');
      setTimeout(() => {
        setSuccess('');
        setCurrentStep(2); // Move to PIN setup step
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to create child profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle PIN setup
  const handleSetPin = async () => {
    setPinError('');
    
    if (pin.length !== 4) {
      setPinError('PIN must be 4 digits');
      return;
    }
    
    if (pin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await setParentPin(pin);
      if (result.success) {
        setPinSuccess(true);
        setTimeout(() => {
          setShowFinalDialog(true);
        }, 1500);
      } else {
        setPinError(result.error || 'Failed to set PIN');
      }
    } catch (err) {
      setPinError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload for avatar
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setAvatarFile(file);
    }
  };

  // Handle PIN input
  const handlePinChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and limit to 4 digits
    if (/^\d*$/.test(value) && value.length <= 4) {
      setPin(value);
      setPinError('');
    }
  };

  // Handle confirm PIN input
  const handleConfirmPinChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and limit to 4 digits
    if (/^\d*$/.test(value) && value.length <= 4) {
      setConfirmPin(value);
      setPinError('');
    }
  };

  // Skip the tutorial
  const handleSkip = () => {
    if (window.confirm('Are you sure you want to skip the setup? You can always access these settings later.')) {
      completeTutorial();
    }
  };

  if (!isVisible) return null;

  // Render the appropriate step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome screen
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center">
                <Star size={48} className="text-indigo-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4">Welcome to Kiddo Quest!</h2>
            <p className="mb-6 text-gray-600">
              Let's get you set up in just two simple steps:
            </p>
            <div className="flex flex-col space-y-4 mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                  <span className="font-bold text-indigo-600">1</span>
                </div>
                <p className="text-left">Create your first child profile</p>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                  <span className="font-bold text-indigo-600">2</span>
                </div>
                <p className="text-left">Set up your parent PIN for security</p>
              </div>
            </div>
            <Button 
              onClick={() => setCurrentStep(1)}
              className="w-full"
            >
              Let's Get Started
            </Button>
          </div>
        );
        
      case 1: // Add Child step
        return (
          <div>
            <div className="flex items-center mb-4">
              <ArrowLeft 
                className="mr-2 cursor-pointer text-gray-500 hover:text-indigo-600" 
                onClick={() => setCurrentStep(0)}
              />
              <h2 className="text-xl font-bold">Create Child Profile</h2>
            </div>
            
            {success ? (
              <div className="bg-green-50 text-green-700 p-4 rounded-md mb-4 flex items-center">
                <Check size={20} className="mr-2" />
                {success}
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleAddChild(); }}>
                {error && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
                    {error}
                  </div>
                )}
                
                <div className="mb-4">
                  <InputField
                    label="Child's Name"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="Enter name"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Choose an Avatar
                  </label>
                  
                  <div className="flex items-center mb-3">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-3xl mr-4">
                      {avatarFile ? (
                        <img 
                          src={URL.createObjectURL(avatarFile)} 
                          alt="Avatar Preview" 
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        childAvatar
                      )}
                    </div>
                    
                    <div>
                      <label className="cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-2 rounded-md inline-flex items-center mr-2">
                        <Camera size={16} className="mr-1" />
                        Upload Photo
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileChange} 
                          className="hidden"
                        />
                      </label>
                      
                      <button
                        type="button"
                        className="bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-2 rounded-md inline-flex items-center"
                        onClick={() => setAvatarFile(null)}
                      >
                        <Smile size={16} className="mr-1" />
                        Use Icon
                      </button>
                    </div>
                  </div>
                  
                  {!avatarFile && (
                    <div className="grid grid-cols-8 gap-2">
                      {avatarOptions.map(avatar => (
                        <button
                          key={avatar}
                          type="button"
                          onClick={() => setChildAvatar(avatar)}
                          className={`text-2xl p-2 rounded-md hover:bg-indigo-100 ${
                            childAvatar === avatar ? 'bg-indigo-100 border border-indigo-300' : ''
                          }`}
                        >
                          {avatar}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !childName.trim()}
                >
                  {isLoading ? 'Creating...' : 'Create Child Profile'}
                </Button>
              </form>
            )}
          </div>
        );
        
      case 2: // Set PIN step
        return (
          <div>
            <div className="flex items-center mb-4">
              <ArrowLeft 
                className="mr-2 cursor-pointer text-gray-500 hover:text-indigo-600" 
                onClick={() => setCurrentStep(1)}
              />
              <h2 className="text-xl font-bold">Set Parent PIN</h2>
            </div>
            
            {showFinalDialog ? (
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Star size={32} className="text-indigo-600" />
                  </div>
                </div>
                <h3 className="text-lg font-medium mb-2">Ready for Adventure!</h3>
                <p className="text-gray-600 mb-6">
                  Everything is set up! Now it's time to assign your first quest to your child and start their adventure.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
                  <p className="text-amber-700 text-sm">
                    <strong>Pro Tip:</strong> Assign a simple quest to get started. When your child completes it, they'll earn XP and rewards!
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    completeTutorial();
                    navigateTo('manageQuests');
                  }} 
                  className="w-full mb-3"
                >
                  Assign a Quest
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={completeTutorial} 
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            ) : pinSuccess ? (
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <Check size={32} className="text-green-600" />
                  </div>
                </div>
                <h3 className="text-lg font-medium mb-2">PIN Setup Complete!</h3>
                <p className="text-gray-600 mb-6">
                  Your PIN has been set successfully. Just one more step to get you started!
                </p>
                <Button onClick={() => setShowFinalDialog(true)} className="w-full">
                  Continue
                </Button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleSetPin(); }}>
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">
                    Set a 4-digit PIN to protect your parent dashboard. This ensures only you can approve quests and manage rewards.
                  </p>
                  <div className="flex items-center justify-center mb-4">
                    <Shield size={24} className="text-indigo-600 mr-2" />
                    <span className="text-indigo-600 font-medium">Security Feature</span>
                  </div>
                </div>
                
                {pinError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
                    {pinError}
                  </div>
                )}
                
                <div className="mb-4">
                  <InputField
                    label="Enter 4-digit PIN"
                    value={pin}
                    onChange={handlePinChange}
                    placeholder="Enter PIN"
                    type="password"
                    maxLength={4}
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <InputField
                    label="Confirm PIN"
                    value={confirmPin}
                    onChange={handleConfirmPinChange}
                    placeholder="Confirm PIN"
                    type="password"
                    maxLength={4}
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || pin.length !== 4 || confirmPin.length !== 4}
                >
                  {isLoading ? 'Setting PIN...' : 'Set PIN'}
                </Button>
              </form>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <Card className="max-w-md w-full p-6 relative">
        {/* Skip button */}
        {!pinSuccess && (
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            onClick={handleSkip}
            aria-label="Skip tutorial"
          >
            <X size={20} />
          </button>
        )}
        
        {/* Progress indicator */}
        {currentStep > 0 && !pinSuccess && (
          <div className="flex justify-center mb-6">
            <div className="flex space-x-2">
              <div className={`w-2 h-2 rounded-full ${currentStep >= 1 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
              <div className={`w-2 h-2 rounded-full ${currentStep >= 2 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
            </div>
          </div>
        )}
        
        {/* Step content */}
        {renderStepContent()}
      </Card>
    </div>
  );
};

// Function to check if tutorial should be shown
export const shouldShowGuidedTutorial = () => {
  // Check if tutorial has been seen before
  const tutorialSeen = localStorage.getItem('kiddoquest_tutorial_seen') === 'true';
  
  // Check if there's a global reset flag
  const globalResetFlag = localStorage.getItem('kiddoquest_global_tutorial_reset') === 'true';
  
  // Check if there's a specific reset flag for this user
  const userEmail = auth.currentUser?.email;
  const userResetFlag = userEmail ? localStorage.getItem(`kiddoquest_tutorial_reset_${userEmail.replace(/[.@]/g, '_')}`) === 'true' : false;
  
  // If tutorial hasn't been seen OR there's a reset flag, show the tutorial
  return !tutorialSeen || globalResetFlag || userResetFlag;
};
