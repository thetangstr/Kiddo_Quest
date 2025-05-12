import React, { useState, useEffect } from 'react';
import { Users, Shield, LogOut, PlusCircle, Edit3, Gift, CheckCircle, Crown, Key } from 'lucide-react';
import useKiddoQuestStore from '../store';
import { Button, Card, LoadingSpinner, renderLucideIcon } from '../components/UI';
import AdminConsole from './AdminConsole';
import PinSetup from '../components/PinSetup';

// Parent Dashboard Component
const ParentDashboard = () => {
  const { 
    childProfiles, 
    quests,
    questCompletions,
    navigateTo, 
    logout, 
    isLoadingData,
    selectChildForDashboard,
    approveQuest,
    currentUser,
    hasParentPin
  } = useKiddoQuestStore();
  const [showAdminConsole, setShowAdminConsole] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [hasPinSet, setHasPinSet] = useState(false);
  
  // Check if user has a PIN set
  useEffect(() => {
    const checkPin = async () => {
      const hasPin = await hasParentPin();
      setHasPinSet(hasPin);
    };
    
    checkPin();
  }, [hasParentPin]);
  
  if (isLoadingData) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }
  
  if (showAdminConsole) {
    return <AdminConsole user={currentUser} onBack={() => setShowAdminConsole(false)} />;
  }
  
  if (showPinSetup) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="mb-6 flex items-center">
          <Button 
            variant="outline" 
            onClick={() => setShowPinSetup(false)}
            className="mr-4"
          >
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-indigo-600">Parent PIN Setup</h1>
        </div>
        <PinSetup />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-indigo-600">Parent Dashboard</h1>
        <div className="flex space-x-3">
          {(currentUser?.email === 'thetangstr@gmail.com' || currentUser?.isAdmin) && (
            <Button 
              variant="outline" 
              onClick={() => setShowAdminConsole(true)}
              className="border-indigo-500 text-indigo-700"
            >
              Admin Console
            </Button>
          )}
          <Button 
            variant="outline" 
            icon={Key} 
            onClick={() => setShowPinSetup(true)}
            className="border-purple-500 text-purple-700"
            data-tutorial="pin-setup"
          >
            {hasPinSet ? 'Change PIN' : 'Set Up PIN'}
          </Button>
          <Button 
            variant="secondary" 
            icon={Crown} 
            onClick={() => navigateTo('subscription')}
          >
            Subscription
          </Button>
          <Button variant="outline" icon={LogOut} onClick={logout}>
            Sign Out
          </Button>
        </div>
      </div>
      
      {/* Child Profiles Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4" data-tutorial="child-profiles">
          <h2 className="text-xl font-semibold flex items-center">
            <Users className="mr-2" /> Child Profiles
          </h2>
          <Button 
            variant="primary" 
            icon={PlusCircle} 
            onClick={() => navigateTo('addChild')}
            data-tutorial="add-child"
          >
            Add Child
          </Button>
        </div>
        
        {childProfiles.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-500 mb-4">No child profiles yet.</p>
            <Button 
              variant="primary" 
              icon={PlusCircle} 
              onClick={() => navigateTo('addChild')}
            >
              Add Your First Child
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {childProfiles.map(child => (
              <Card key={child.id} className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl mr-4">
                    {typeof child.avatar === 'string' && child.avatar.startsWith('http') 
                      ? <img src={child.avatar} alt={child.name} className="w-12 h-12 rounded-full object-cover" />
                      : child.avatar || '👶'}
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-medium">{child.name}</h3>
                    <p className="text-indigo-600 font-medium">{child.xp || 0} XP</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    icon={Edit3}
                    className="text-gray-500 hover:text-indigo-600"
                    onClick={() => {
                      selectChildForDashboard(child.id);
                      navigateTo('editChild');
                    }}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => selectChildForDashboard(child.id)}
                  >
                    View Dashboard
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
      
      {/* Pending Verification Section */}
      {/* Get pending quest completions from the questCompletions collection */}
      {(() => {
        // Get all pending completions
        const pendingCompletions = (questCompletions || []).filter(completion => 
          completion.status === 'pending_verification'
        );
        
        // Only render this section if there are pending completions
        if (pendingCompletions.length === 0) return null;
        
        return (
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Shield className="mr-2" />
              <h2 className="text-xl font-semibold">Quests Pending Verification</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingCompletions.map(completion => {
                // Find the original quest details
                const quest = quests.find(q => q.id === completion.questId);
                if (!quest) return null;
                
                // Find the child who claimed it
                const child = childProfiles.find(c => c.id === completion.childId);
                
                return (
                  <Card key={completion.id} className="p-6">
                    <div className="flex items-start mb-4">
                      <div className="mr-4 text-indigo-600">
                        {renderLucideIcon(quest.iconName || 'CheckCircle', { size: 24 })}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">{quest.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{quest.description}</p>
                        <p className="text-sm text-indigo-600 font-medium">
                          {quest.xp} XP • Claimed by {child?.name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="success" 
                      icon={CheckCircle} 
                      className="w-full"
                      onClick={() => approveQuest(completion.id)}
                    >
                      Approve Completion
                    </Button>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })()}
      
      {/* Security Settings */}
      <section className="mb-8">
        <div className="flex items-center mb-4">
          <Key className="mr-2" />
          <h2 className="text-xl font-semibold">Security Settings</h2>
        </div>
        
        <Card className="p-6" data-tutorial="pin-setup">
          <h3 className="text-lg font-medium flex items-center mb-4">
            <Key className="mr-2 text-indigo-600" /> Parent PIN Protection
          </h3>
          <p className="text-gray-500 mb-4">
            {hasPinSet ? 
              "You have set up a PIN to protect your parent dashboard. This prevents children from accessing parent features." :
              "Set up a 4-digit PIN to protect your parent dashboard. This prevents children from approving their own quests."}
          </p>
          <Button 
            variant={hasPinSet ? "outline" : "primary"} 
            onClick={() => setShowPinSetup(true)}
          >
            {hasPinSet ? "Change PIN" : "Set Up PIN"}
          </Button>
        </Card>
      </section>
      
      {/* Management Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="p-6">
          <h3 className="text-lg font-medium flex items-center mb-4">
            <CheckCircle className="mr-2 text-indigo-600" /> Quests
          </h3>
          <p className="text-gray-500 mb-4">
            Create and manage tasks for your children to complete.
          </p>
          <Button 
            variant="primary" 
            onClick={() => navigateTo('manageQuests')}
            data-tutorial="manage-quests"
          >
            Manage Quests
          </Button>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-medium flex items-center mb-4">
            <Gift className="mr-2 text-indigo-600" /> Rewards
          </h3>
          <p className="text-gray-500 mb-4">
            Create and manage rewards that children can redeem with XP.
          </p>
          <Button 
            variant="primary" 
            onClick={() => navigateTo('manageRewards')}
            data-tutorial="rewards-section"
          >
            Manage Rewards
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default ParentDashboard;
