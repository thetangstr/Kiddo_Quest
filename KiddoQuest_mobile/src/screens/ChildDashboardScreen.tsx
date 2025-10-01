import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import useStore from '../store/useStore';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'ChildDashboard'>;

export default function ChildDashboardScreen({ navigation, route }: Props) {
  const { childId } = route.params;
  const { 
    children, 
    quests, 
    rewards, 
    selectedChild,
    selectChild,
    completeQuest,
    redeemReward,
    isLoading 
  } = useStore();

  const [child, setChild] = useState(null);
  const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null);
  const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(null);

  useEffect(() => {
    // Find the child by ID
    const foundChild = children.find(c => c.id === childId);
    if (foundChild) {
      setChild(foundChild);
      selectChild(foundChild);
    }
  }, [childId, children, selectChild]);

  // Helper function to check if child has completed quest in current period
  const hasCompletedInCurrentPeriod = (quest: any, childId: string): boolean => {
    if (!quest.isRecurring || !quest.completions) {
      return false;
    }
    
    const getPeriodString = (date: Date, frequency: 'daily' | 'weekly' | 'monthly'): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      switch (frequency) {
        case 'daily':
          return `${year}-${month}-${day}`;
        case 'weekly':
          const startOfYear = new Date(year, 0, 1);
          const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
          const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
          return `${year}-W${String(weekNumber).padStart(2, '0')}`;
        case 'monthly':
          return `${year}-${month}`;
        default:
          return `${year}-${month}-${day}`;
      }
    };
    
    const currentPeriod = getPeriodString(new Date(), quest.frequency || 'daily');
    return quest.completions.some((completion: any) => 
      completion.childId === childId && completion.period === currentPeriod
    );
  };

  // Filter quests and rewards for this child
  const childQuests = quests.filter(quest => 
    quest.childId === childId || quest.availableToAllChildren
  );
  const childRewards = rewards.filter(reward => reward.childId === childId);
  
  const availableQuests = childQuests.filter(quest => {
    if (quest.isRecurring) {
      // For recurring quests, check if child has completed it in current period
      return !hasCompletedInCurrentPeriod(quest, childId);
    }
    // For one-time quests, check global completion status
    return !quest.completed;
  });
  
  const completedQuests = childQuests.filter(quest => {
    if (quest.isRecurring) {
      // For recurring quests, check if child has completed it in current period
      return hasCompletedInCurrentPeriod(quest, childId);
    }
    // For one-time quests, check global completion status
    return quest.completed;
  });
  const availableRewards = childRewards.filter(reward => !reward.redeemed);

  // Calculate total points
  const totalPoints = completedQuests.reduce((sum, quest) => sum + quest.points, 0);

  const handleCompleteQuest = async (questId: string) => {
    setClaimingQuestId(questId);
    try {
      await completeQuest(questId);
      Alert.alert('Congratulations!', 'Quest completed! You earned points!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete quest');
    } finally {
      setClaimingQuestId(null);
    }
  };

  const handleRedeemReward = async (rewardId: string, rewardCost: number) => {
    if (totalPoints < rewardCost) {
      Alert.alert(
        'Not Enough Points',
        `You need ${rewardCost} points to redeem this reward. You have ${totalPoints} points.`
      );
      return;
    }

    Alert.alert(
      'Redeem Reward',
      'Are you sure you want to redeem this reward?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            setRedeemingRewardId(rewardId);
            try {
              await redeemReward(rewardId);
              Alert.alert('Success!', 'Reward redeemed successfully!');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to redeem reward');
            } finally {
              setRedeemingRewardId(null);
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (!child) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center px-6">
        <Text className="text-xl text-gray-600 text-center">Child not found</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          variant="secondary"
          className="mt-4"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-indigo-600 px-6 py-8">
          <Text className="text-white text-2xl font-bold">Welcome, {child.name}!</Text>
          <Text className="text-indigo-100 text-lg mt-1">
            You have {totalPoints} points
          </Text>
        </View>

        <View className="px-6 py-6 space-y-6">
          {/* Available Quests */}
          <View>
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Available Quests ({availableQuests.length})
            </Text>
            
            {availableQuests.length === 0 ? (
              <Card className="p-4">
                <Text className="text-gray-600 text-center">
                  No quests available right now. Check back later!
                </Text>
              </Card>
            ) : (
              <View className="space-y-3">
                {availableQuests.map((quest) => (
                  <Card key={quest.id} className="p-4">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1 mr-4">
                        <Text className="text-lg font-semibold text-gray-900">
                          {quest.title}
                        </Text>
                        {quest.description && (
                          <Text className="text-gray-600 mt-1">
                            {quest.description}
                          </Text>
                        )}
                        <Text className="text-indigo-600 font-medium mt-2">
                          Reward: {quest.points} points
                        </Text>
                      </View>
                      <Button
                        title={claimingQuestId === quest.id ? "Claiming..." : "I Did It! ✨"}
                        onPress={() => handleCompleteQuest(quest.id)}
                        variant="completion"
                        size="medium"
                        disabled={claimingQuestId === quest.id}
                      />
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </View>

          {/* Available Rewards */}
          <View>
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Rewards Store ({availableRewards.length})
            </Text>
            
            {availableRewards.length === 0 ? (
              <Card className="p-4">
                <Text className="text-gray-600 text-center">
                  No rewards available right now.
                </Text>
              </Card>
            ) : (
              <View className="space-y-3">
                {availableRewards.map((reward) => (
                  <Card key={reward.id} className="p-4">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1 mr-4">
                        <Text className="text-lg font-semibold text-gray-900">
                          {reward.title}
                        </Text>
                        {reward.description && (
                          <Text className="text-gray-600 mt-1">
                            {reward.description}
                          </Text>
                        )}
                        <Text className="text-orange-600 font-medium mt-2">
                          Cost: {reward.points} points
                        </Text>
                      </View>
                      <Button
                        title={redeemingRewardId === reward.id ? "Redeeming..." : "Redeem"}
                        onPress={() => handleRedeemReward(reward.id, reward.points)}
                        variant={totalPoints >= reward.points ? "primary" : "secondary"}
                        size="small"
                        disabled={totalPoints < reward.points || redeemingRewardId === reward.id}
                      />
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </View>

          {/* Completed Quests */}
          {completedQuests.length > 0 && (
            <View>
              <Text className="text-xl font-bold text-gray-900 mb-4">
                Completed Quests ({completedQuests.length})
              </Text>
              
              <View className="space-y-3">
                {completedQuests.slice(0, 5).map((quest) => (
                  <Card key={quest.id} className="p-4 bg-green-50 border-green-200">
                    <View className="flex-row justify-between items-center">
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-gray-900">
                          {quest.title}
                        </Text>
                        <Text className="text-green-600 font-medium mt-1">
                          ✓ Earned {quest.points} points
                        </Text>
                      </View>
                    </View>
                  </Card>
                ))}
                
                {completedQuests.length > 5 && (
                  <Text className="text-gray-500 text-center text-sm">
                    ... and {completedQuests.length - 5} more completed quests
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="border-t border-gray-200 bg-white px-6 py-4">
        <Button
          title="Back to Parent Dashboard"
          onPress={() => navigation.navigate('ParentDashboard')}
          variant="secondary"
        />
      </View>
    </SafeAreaView>
  );
}