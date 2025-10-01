import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import useStore from '../store/useStore';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'QuestForm'>;

export default function QuestFormScreen({ navigation, route }: Props) {
  const { questId } = route.params || {};
  const { 
    children, 
    selectedChild,
    quests, 
    addQuest, 
    updateQuest,
    isLoading 
  } = useStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('10');
  const [selectedChildId, setSelectedChildId] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (questId) {
      // Editing existing quest
      const quest = quests.find(q => q.id === questId);
      if (quest) {
        setTitle(quest.title);
        setDescription(quest.description || '');
        setPoints(quest.points.toString());
        setSelectedChildId(quest.childId);
        setIsEditing(true);
      }
    } else if (selectedChild) {
      // Creating new quest for selected child
      setSelectedChildId(selectedChild.id);
    }
  }, [questId, quests, selectedChild]);

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a quest title');
      return false;
    }

    if (!selectedChildId) {
      Alert.alert('Error', 'Please select a child for this quest');
      return false;
    }

    const pointsValue = parseInt(points);
    if (isNaN(pointsValue) || pointsValue < 1 || pointsValue > 1000) {
      Alert.alert('Error', 'Points must be a number between 1 and 1000');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const questData = {
        title: title.trim(),
        description: description.trim(),
        points: parseInt(points),
        childId: selectedChildId,
      };

      if (isEditing && questId) {
        await updateQuest({ id: questId, ...questData, completed: false });
        Alert.alert('Success', 'Quest updated successfully');
      } else {
        await addQuest(questData);
        Alert.alert('Success', 'Quest created successfully');
      }
      
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save quest');
    }
  };

  const getChildName = (childId: string) => {
    const child = children.find(c => c.id === childId);
    return child?.name || 'Unknown Child';
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
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-6 py-4">
          <Text className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Quest' : 'Create New Quest'}
          </Text>
          {selectedChildId && (
            <Text className="text-gray-600 mt-1">
              For {getChildName(selectedChildId)}
            </Text>
          )}
        </View>

        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 py-6 space-y-6">
            {/* Quest Details Form */}
            <Card className="p-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Quest Details
              </Text>
              
              <View className="space-y-4">
                <TextInput
                  label="Quest Title"
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter quest title"
                  maxLength={100}
                />

                <TextInput
                  label="Description (Optional)"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe what needs to be done"
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                />

                <TextInput
                  label="Points Reward"
                  value={points}
                  onChangeText={setPoints}
                  placeholder="10"
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
            </Card>

            {/* Child Selection */}
            {!selectedChild && children.length > 1 && (
              <Card className="p-6">
                <Text className="text-lg font-semibold text-gray-900 mb-4">
                  Assign to Child
                </Text>
                
                <View className="space-y-3">
                  {children.map((child) => (
                    <Button
                      key={child.id}
                      title={child.name}
                      onPress={() => setSelectedChildId(child.id)}
                      variant={selectedChildId === child.id ? "primary" : "secondary"}
                    />
                  ))}
                </View>
              </Card>
            )}

            {/* Quest Guidelines */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <Text className="text-lg font-semibold text-blue-900 mb-3">
                💡 Quest Tips
              </Text>
              
              <View className="space-y-2">
                <Text className="text-blue-800 text-sm">
                  • Make the title clear and specific
                </Text>
                <Text className="text-blue-800 text-sm">
                  • Include step-by-step instructions in the description
                </Text>
                <Text className="text-blue-800 text-sm">
                  • Set appropriate point values (5-50 for daily tasks, 50+ for big projects)
                </Text>
                <Text className="text-blue-800 text-sm">
                  • Consider your child's age and abilities
                </Text>
              </View>
            </Card>

            {/* Point Value Guide */}
            <Card className="p-6 bg-green-50 border-green-200">
              <Text className="text-lg font-semibold text-green-900 mb-3">
                🎯 Point Value Guide
              </Text>
              
              <View className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-green-800 text-sm">Simple tasks (5-15 mins):</Text>
                  <Text className="text-green-800 text-sm font-medium">5-15 points</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-green-800 text-sm">Medium tasks (15-30 mins):</Text>
                  <Text className="text-green-800 text-sm font-medium">20-40 points</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-green-800 text-sm">Big projects (30+ mins):</Text>
                  <Text className="text-green-800 text-sm font-medium">50+ points</Text>
                </View>
              </View>
            </Card>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View className="border-t border-gray-200 bg-white px-6 py-4 space-y-3">
          <Button
            title={isEditing ? 'Update Quest' : 'Create Quest'}
            onPress={handleSave}
            variant="primary"
            disabled={isLoading}
          />
          
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="secondary"
            disabled={isLoading}
          />
        </View>
      </KeyboardAvoidingView>

      {isLoading && (
        <View className="absolute inset-0 bg-black bg-opacity-20 justify-center items-center">
          <LoadingSpinner />
        </View>
      )}
    </SafeAreaView>
  );
}