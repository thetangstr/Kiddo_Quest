import React, { useState } from 'react';
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

type Props = StackScreenProps<RootStackParamList, 'ManageQuests'>;

export default function ManageQuestsScreen({ navigation }: Props) {
  const { 
    children, 
    quests, 
    selectedChild,
    deleteQuest,
    isLoading 
  } = useStore();

  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Get quests for selected child or all children
  const filteredQuests = quests.filter(quest => {
    const childMatch = !selectedChild || quest.childId === selectedChild.id;
    
    switch (filter) {
      case 'pending':
        return childMatch && !quest.completed;
      case 'completed':
        return childMatch && quest.completed;
      default:
        return childMatch;
    }
  });

  const getChildName = (childId: string) => {
    const child = children.find(c => c.id === childId);
    return child?.name || 'Unknown Child';
  };

  const handleDeleteQuest = (questId: string, questTitle: string) => {
    Alert.alert(
      'Delete Quest',
      `Are you sure you want to delete "${questTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteQuest(questId);
              Alert.alert('Success', 'Quest deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete quest');
            }
          }
        }
      ]
    );
  };

  const handleCreateQuest = () => {
    navigation.navigate('QuestForm');
  };

  const handleEditQuest = (questId: string) => {
    navigation.navigate('QuestForm', { questId });
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-6 py-4">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-gray-900">
              Manage Quests
            </Text>
            {selectedChild && (
              <Text className="text-gray-600 mt-1">
                For {selectedChild.name}
              </Text>
            )}
          </View>
          <Button
            title="Create Quest"
            onPress={handleCreateQuest}
            variant="primary"
            size="small"
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="bg-white border-b border-gray-200 px-6 py-3">
        <View className="flex-row space-x-4">
          {[
            { key: 'all', label: 'All', count: quests.length },
            { key: 'pending', label: 'Pending', count: quests.filter(q => !q.completed).length },
            { key: 'completed', label: 'Completed', count: quests.filter(q => q.completed).length }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-full ${
                filter === tab.key 
                  ? 'bg-indigo-100 border border-indigo-300' 
                  : 'bg-gray-100 border border-gray-300'
              }`}
            >
              <Text className={`font-medium ${
                filter === tab.key ? 'text-indigo-700' : 'text-gray-700'
              }`}>
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          {filteredQuests.length === 0 ? (
            <Card className="p-8">
              <Text className="text-center text-gray-600 text-lg">
                {filter === 'all' ? 'No quests created yet' : 
                 filter === 'pending' ? 'No pending quests' : 
                 'No completed quests'}
              </Text>
              <Text className="text-center text-gray-500 mt-2">
                {filter === 'all' && 'Create your first quest to get started!'}
              </Text>
              {filter === 'all' && (
                <Button
                  title="Create First Quest"
                  onPress={handleCreateQuest}
                  variant="primary"
                  className="mt-4"
                />
              )}
            </Card>
          ) : (
            <View className="space-y-4">
              {filteredQuests.map((quest) => (
                <Card key={quest.id} className="p-4">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 mr-4">
                      <View className="flex-row items-center mb-2">
                        <Text className="text-lg font-semibold text-gray-900">
                          {quest.title}
                        </Text>
                        {quest.completed && (
                          <View className="ml-2 bg-green-100 px-2 py-1 rounded-full">
                            <Text className="text-green-700 text-xs font-medium">
                              Completed
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      {quest.description && (
                        <Text className="text-gray-600 mb-2">
                          {quest.description}
                        </Text>
                      )}
                      
                      <View className="flex-row items-center justify-between">
                        <Text className="text-indigo-600 font-medium">
                          {quest.points} points
                        </Text>
                        <Text className="text-gray-500 text-sm">
                          For: {getChildName(quest.childId)}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="flex-col space-y-2">
                      <TouchableOpacity
                        onPress={() => handleEditQuest(quest.id)}
                        className="bg-blue-50 px-3 py-2 rounded-md"
                      >
                        <Text className="text-blue-700 text-sm font-medium">
                          Edit
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => handleDeleteQuest(quest.id, quest.title)}
                        className="bg-red-50 px-3 py-2 rounded-md"
                      >
                        <Text className="text-red-700 text-sm font-medium">
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="border-t border-gray-200 bg-white px-6 py-4">
        <Button
          title="Back to Dashboard"
          onPress={() => navigation.navigate('ParentDashboard')}
          variant="secondary"
        />
      </View>
    </SafeAreaView>
  );
}