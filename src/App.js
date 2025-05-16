import React, { useEffect, useState } from 'react';
import useKiddoQuestStore from './store';
import { LoadingSpinner } from './components/UI';
import { GuidedTutorial, shouldShowGuidedTutorial } from './components/GuidedTutorial';
import PinVerification from './components/PinVerification';
import ChangelogBanner from './components/ChangelogBanner';

// Import screens
import { LoginScreen, RegistrationScreen } from './screens/Auth';
import ParentDashboard from './screens/ParentDashboard';
import { AddChildScreen, ChildSelectionScreen } from './screens/ChildManagement';
import { EditChildProfileScreen } from './screens/EditChildProfile';
import ChildDashboard from './screens/ChildDashboard';
import { ManageQuestsScreen, QuestFormScreen } from './screens/QuestManagement';
import { ManageRewardsScreen, RewardFormScreen } from './screens/RewardManagement';
import { SubscriptionManagementScreen } from './screens/SubscriptionManagement';

// Import Tailwind CSS
import './index.css';
import FeedbackButton from './components/FeedbackButton';
import FeedbackModal from './components/FeedbackModal';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const { 
    currentView, 
    isLoadingAuth, 
    checkAuthStatus,
    currentUser,

    setRequirePin,
    hasParentPin
  } = useKiddoQuestStore();
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [pendingView, setPendingView] = useState(null);
  
  // Check auth status on app load
  useEffect(() => {
    const unsubscribe = checkAuthStatus();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [checkAuthStatus]);
  
  // Show tutorial for first-time users after login
  useEffect(() => {
    if (currentUser && currentView === 'parentDashboard') {
      // Check if user should see the tutorial
      const shouldShow = shouldShowGuidedTutorial();
      if (shouldShow) {
        setShowTutorial(true);
      }
    }
  }, [currentUser, currentView]);
  
  // Handle PIN verification for transitions between views
  useEffect(() => {
    const checkPinRequirement = async () => {
      // Only check when user is authenticated and there's a pending view
      if (!currentUser || !pendingView) return;
      
      // Check if we're transitioning from child to parent view
      const childViews = ['childDashboard'];
      const parentViews = ['parentDashboard', 'manageQuests', 'manageRewards', 'addChild', 'editChild'];
      
      // If we're coming from a child view to a parent view
      if (childViews.includes(pendingView) && parentViews.includes(currentView)) {
        // Reset pending view since we've handled the transition
        setPendingView(null);
        return;
      }
      
      // If we're trying to go from a child view to a parent view
      if (childViews.includes(currentView) && parentViews.includes(pendingView)) {
        // Check if user has a PIN set
        const hasPinSet = await hasParentPin();
        
        if (hasPinSet) {
          // Show PIN verification
          setRequirePin(true);
          setShowPinVerification(true);
          // Don't change the view yet - wait for PIN verification
        } else {
          // No PIN set, allow direct access
          setRequirePin(false);
          // Apply the pending view change
          const { setCurrentView } = useKiddoQuestStore.getState();
          setCurrentView(pendingView);
          setPendingView(null);
        }
      } else {
        // For other transitions, just apply the change directly
        const { setCurrentView } = useKiddoQuestStore.getState();
        setCurrentView(pendingView);
        setPendingView(null);
      }
    };
    
    if (pendingView) {
      checkPinRequirement();
    }
  }, [pendingView, currentView, currentUser, hasParentPin, setRequirePin]);
  
  // Handle view changes with PIN verification
  const handleViewChange = (newView) => {
    const childViews = ['childDashboard'];
    const parentViews = ['parentDashboard', 'manageQuests', 'manageRewards', 'addChild', 'editChild'];
    
    // If transitioning from child to parent view, set pending view
    if (childViews.includes(currentView) && parentViews.includes(newView)) {
      setPendingView(newView);
    } else {
      // For other transitions, set pending view (will be handled by useEffect)
      setPendingView(newView);
    }
  };
  
  // Handle PIN verification success
  const handlePinSuccess = () => {
    setShowPinVerification(false);
    setRequirePin(false);
    
    // Apply the pending view change
    if (pendingView) {
      const { setCurrentView } = useKiddoQuestStore.getState();
      setCurrentView(pendingView);
      setPendingView(null);
    }
  };
  
  // Handle PIN verification cancel
  const handlePinCancel = () => {
    setShowPinVerification(false);
    setRequirePin(false);
    setPendingView(null);
  };
  
  // Render the appropriate view based on currentView state
  const renderView = () => {
    // Wrap components with PIN verification if needed
    const wrapWithPinCheck = (Component) => {
      return (
        <Component 
          onViewChange={handleViewChange} 
        />
      );
    };
    
    // Show loading spinner while checking auth
    if (isLoadingAuth) {
      return <LoadingSpinner message="Loading..." />;
    }
    
    switch(currentView) {
      case 'login':
        return <LoginScreen />;
      case 'register':
        return <RegistrationScreen />;
      case 'parentDashboard':
        return <ParentDashboard />;
      case 'addChild':
        return <AddChildScreen />;
      case 'editChild':
        return <EditChildProfileScreen />;
      case 'childSelection':
        return <ChildSelectionScreen />;
      case 'childDashboard':
        return wrapWithPinCheck(ChildDashboard);
      case 'manageQuests':
        return <ManageQuestsScreen />;
      case 'questForm':
        return <QuestFormScreen />;
      case 'manageRewards':
        return <ManageRewardsScreen />;
      case 'rewardForm':
        return <RewardFormScreen />;
      case 'subscription':
        return <SubscriptionManagementScreen />;
      default:
        return <LoginScreen />;
    }
  };
  
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 font-sans">
        <ChangelogBanner />
        {showTutorial && <GuidedTutorial onClose={() => setShowTutorial(false)} />}
        {renderView()}
        {showPinVerification && (
          <PinVerification 
            onSuccess={handlePinSuccess} 
            onCancel={handlePinCancel} 
          />
        )}
        <FeedbackButton onClick={() => setFeedbackOpen(true)} />
        <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} user={currentUser} />
      </div>
    </ErrorBoundary>
  );
}

export default App;
