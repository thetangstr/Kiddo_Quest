import React, { useState } from 'react';
import { ArrowLeft, Check, Crown, Lock, Star, AlertCircle } from 'lucide-react';
import useKiddoQuestStore from '../store';
import { Button, Card, LoadingSpinner } from '../components/UI';
import { SUBSCRIPTION_TIERS, getPremiumOnlyFeatures } from '../utils/subscriptionManager';

// Subscription Management Screen Component
export const SubscriptionManagementScreen = () => {
  const { 
    navigateTo, 
    subscriptionTier,
    updateSubscriptionTier,
    getSubscriptionDetails,
    isLoadingData 
  } = useKiddoQuestStore();
  
  const [upgradeStatus, setUpgradeStatus] = useState({
    loading: false,
    success: false,
    error: null
  });
  
  const subscriptionDetails = getSubscriptionDetails();
  const premiumFeatures = getPremiumOnlyFeatures();
  
  const handleUpgradeSubscription = async () => {
    if (subscriptionTier === SUBSCRIPTION_TIERS.PREMIUM) {
      return; // Already premium
    }
    
    setUpgradeStatus({ loading: true, success: false, error: null });
    
    try {
      // In a real app, this would integrate with a payment processor
      // For demo purposes, we'll just update the subscription tier directly
      await updateSubscriptionTier(SUBSCRIPTION_TIERS.PREMIUM);
      setUpgradeStatus({ loading: false, success: true, error: null });
    } catch (error) {
      setUpgradeStatus({ 
        loading: false, 
        success: false, 
        error: error.message || 'Failed to upgrade subscription. Please try again.' 
      });
    }
  };
  
  if (isLoadingData) {
    return <LoadingSpinner message="Loading subscription details..." />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button 
        variant="link" 
        icon={ArrowLeft} 
        onClick={() => navigateTo('parentDashboard')}
        className="mb-6"
      >
        Back to Dashboard
      </Button>
      
      <h1 className="text-3xl font-bold text-indigo-600 mb-8 flex items-center">
        <Crown className="mr-3" /> Subscription Management
      </h1>
      
      {/* Current Plan */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-medium">
              {subscriptionTier === SUBSCRIPTION_TIERS.PREMIUM ? 'Premium Plan' : 'Free Plan'}
            </p>
            <p className="text-gray-500">
              {subscriptionTier === SUBSCRIPTION_TIERS.PREMIUM 
                ? 'You have access to all premium features!' 
                : 'Upgrade to unlock premium features'}
            </p>
          </div>
          
          {subscriptionTier === SUBSCRIPTION_TIERS.FREE && (
            <Button 
              variant="primary" 
              icon={Crown} 
              onClick={handleUpgradeSubscription}
              disabled={upgradeStatus.loading}
            >
              {upgradeStatus.loading ? 'Processing...' : 'Upgrade to Premium'}
            </Button>
          )}
          
          {subscriptionTier === SUBSCRIPTION_TIERS.PREMIUM && (
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full flex items-center">
              <Check className="mr-1" size={18} />
              <span>Active</span>
            </div>
          )}
        </div>
        
        {upgradeStatus.error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <div className="flex items-center">
              <AlertCircle className="mr-2" size={18} />
              <span>{upgradeStatus.error}</span>
            </div>
          </div>
        )}
        
        {upgradeStatus.success && (
          <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <div className="flex items-center">
              <Check className="mr-2" size={18} />
              <span>Successfully upgraded to Premium! Enjoy all the premium features.</span>
            </div>
          </div>
        )}
      </Card>
      
      {/* Plan Comparison */}
      <h2 className="text-xl font-semibold mb-4">Plan Comparison</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse mb-8">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-4 border">Feature</th>
              <th className="text-center p-4 border">Free Plan</th>
              <th className="text-center p-4 border bg-indigo-50">Premium Plan</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(subscriptionDetails.features).map(feature => (
              <tr key={feature.id} className="border-b">
                <td className="p-4 border">
                  <div className="font-medium">{feature.name}</div>
                  <div className="text-sm text-gray-500">{feature.description}</div>
                </td>
                <td className="text-center p-4 border">
                  {feature.limits[SUBSCRIPTION_TIERS.FREE].limit === 0 ? (
                    <div className="flex items-center justify-center text-red-500">
                      <Lock size={18} />
                    </div>
                  ) : feature.limits[SUBSCRIPTION_TIERS.FREE].limit === null ? (
                    <div className="flex items-center justify-center text-green-500">
                      <Check size={18} />
                    </div>
                  ) : (
                    <div className="text-gray-700">
                      {feature.limits[SUBSCRIPTION_TIERS.FREE].description}
                    </div>
                  )}
                </td>
                <td className="text-center p-4 border bg-indigo-50">
                  <div className="flex items-center justify-center text-green-500">
                    {feature.limits[SUBSCRIPTION_TIERS.PREMIUM].description}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Premium Features Highlight */}
      {subscriptionTier === SUBSCRIPTION_TIERS.FREE && (
        <div className="bg-indigo-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-indigo-700">
            <Star className="mr-2" /> Premium Features You're Missing Out On
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {premiumFeatures.map(feature => (
              <div key={feature.id} className="flex items-start">
                <div className="bg-indigo-100 p-2 rounded-full mr-3">
                  <Lock className="text-indigo-600" size={18} />
                </div>
                <div>
                  <h3 className="font-medium">{feature.name}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Button 
              variant="primary" 
              icon={Crown} 
              onClick={handleUpgradeSubscription}
              disabled={upgradeStatus.loading}
              className="px-8"
            >
              {upgradeStatus.loading ? 'Processing...' : 'Upgrade to Premium Now'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
