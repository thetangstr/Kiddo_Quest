import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useKiddoQuestStore from './store';
import { LoadingSpinner } from './components/UI';
import { GuidedTutorial, shouldShowGuidedTutorial } from './components/GuidedTutorial';
import PinVerification from './components/PinVerification';
import EnvironmentBanner from './components/EnvironmentBanner';

// Import screens
import { LoginScreen, RegistrationScreen } from './screens/Auth';
import ParentDashboard from './screens/ParentDashboard';
import InvitationVerification from './screens/InvitationAcceptance';
import { InvitationManager } from './components/InvitationManager';
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

function App() {
  const { 
    currentView, 
    isLoadingAuth, 
    checkAuthStatus,
    currentUser,
    requirePin,
    setRequirePin,
    hasParentPin,
    navigateTo
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
  
  // Handle invitation tokens in URL
  useEffect(() => {
    const checkForInvitationToken = () => {
      const queryParams = new URLSearchParams(window.location.search);
      const token = queryParams.get('token');
      
      if (token) {
        navigateTo('inviteVerify');
      }
    };
    
    checkForInvitationToken();
    
    // Listen for URL changes
    window.addEventListener('popstate', checkForInvitationToken);
    return () => {
      window.removeEventListener('popstate', checkForInvitationToken);
    };
  }, [navigateTo]);
  
  // Show tutorial for first-time users after login
  useEffect(() => {
    if (currentUser && currentView === 'parentDashboard') {
      // Check if user should see the tutorial
      if (shouldShowGuidedTutorial()) {
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
          // Apply the pending view change - use navigateTo from store props instead
          navigateTo(pendingView);
          setPendingView(null);
        }
      } else {
        // For other transitions, just apply the change directly
        // Use navigateTo from props instead of directly accessing the store
        navigateTo(pendingView);
        setPendingView(null);
      }
    };
    
    if (pendingView) {
      checkPinRequirement();
    }
  }, [pendingView, currentView, currentUser, hasParentPin, setRequirePin, navigateTo]);
  
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
      // Use navigateTo from props instead of directly accessing the store
      navigateTo(pendingView);
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
    // Add debugging to help troubleshoot view rendering
    console.log('Rendering view:', { 
      currentView, 
      isLoadingAuth, 
      hasCurrentUser: !!currentUser,
      userEmail: currentUser?.email
    });
    
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
      return <LoadingSpinner message="Loading Kiddo Quest..." data-testid="loading-spinner" />;
    }
    
    switch(currentView) {
      case 'login':
        return <LoginScreen />;
      case 'register':
        return <RegistrationScreen />;
      case 'adminDashboard':
        // Admin users still see ParentDashboard but with additional admin controls
        console.log('Rendering admin dashboard for admin user:', currentUser?.email);
        return <ParentDashboard />;
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
      case 'inviteVerify':
        return <InvitationVerification />;
      case 'manageInvitations':
        // Only admin users can manage invitations
        if (currentUser?.role === 'admin') {
          return <InvitationManager />;
        } else {
          // Redirect non-admin users
          return <Navigate to="/" replace />;
        }
      default:
        return <LoginScreen />;
    }
  };
  
  console.log('App render state:', { 
    currentView, 
    isLoadingAuth, 
    hasCurrentUser: !!currentUser,
    userEmail: currentUser?.email
  });

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans">
        {/* Environment banner for non-production environments */}
        <EnvironmentBanner />
        
        {/* Authentication status marker for testing */}
        {currentUser && !isLoadingAuth && (
          <div id="auth-success-marker" data-testid="auth-success-marker" style={{ display: 'none' }}>
            Authentication successful: {currentUser.email}
            Current view: {currentView}
          </div>
        )}
        
        {/* Show loading spinner while auth is initializing */}
        {isLoadingAuth ? (
          <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner message="Loading..." data-testid="loading-spinner" />
          </div>
        ) : (
          <>
            {showTutorial && <GuidedTutorial onClose={() => setShowTutorial(false)} />}
            {renderView()}
            
            {/* Show feedback button in bottom right */}
            <FeedbackButton onClick={() => setFeedbackOpen(true)} />
            
            {/* PIN Verification Modal */}
            {showPinVerification && (
              <PinVerification
                onSuccess={handlePinSuccess}
                onCancel={handlePinCancel}
              />
            )}
            
            {/* Feedback Modal */}
            {feedbackOpen && (
              <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} user={currentUser} />
            )}
          </>
        )}      
      </div>
    </Router>
  );
}

export default App;
// Test beta deployment pipeline Tue Jul 22 13:29:03 PDT 2025
