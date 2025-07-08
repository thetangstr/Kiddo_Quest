import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { Platform } from 'react-native';
import useStore from '../store/useStore';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import ParentDashboardScreen from '../screens/ParentDashboardScreen';
import ChildDashboardScreen from '../screens/ChildDashboardScreen';
import ManageQuestsScreen from '../screens/ManageQuestsScreen';
import QuestFormScreen from '../screens/QuestFormScreen';
import PenaltyManagementScreen from '../screens/PenaltyManagementScreen';
import ManageRewardsScreen from '../screens/ManageRewardsScreen';
import RewardFormScreen from '../screens/RewardFormScreen';

// Create navigation stack
const Stack = createStackNavigator<RootStackParamList>();

// App Navigator configuration
const linking = {
  prefixes: ['kiddoquest://'],
  config: {
    screens: {
      Login: 'login',
      Registration: 'register',
      ParentDashboard: 'parent',
      ChildDashboard: 'child/:childId',
      AddChild: 'add-child',
      EditChild: 'edit-child/:childId',
      ChildSelection: 'select-child',
      ManageQuests: 'quests',
      QuestForm: 'quest/:questId?',
      ManageRewards: 'rewards',
      RewardForm: 'reward/:rewardId?',
      ManagePenalties: 'penalties',
      InvitationVerification: 'invite/:token?',
      SubscriptionManagement: 'subscription',
    }
  },
};

// Define our custom theme based on DefaultTheme
const theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4F46E5', // indigo-600
    background: '#F9FAFB', // gray-50
    card: '#FFFFFF',
    text: '#1F2937', // gray-800
    border: '#E5E7EB', // gray-200
    notification: '#EF4444', // red-500
  },
};

export const AppNavigator = () => {
  // Get authentication state from the store
  const { isAuthenticated, currentView } = useStore(state => ({
    isAuthenticated: state.isAuthenticated,
    currentView: state.currentView
  }));

  return (
    <NavigationContainer
      linking={Platform.OS === 'web' ? linking : undefined}
      theme={theme}
      documentTitle={{
        formatter: (options, route) => 
          `${options?.title || route?.name || 'KiddoQuest'} - Kiddo Quest`
      }}
    >
      {!isAuthenticated ? (
        // Auth Stack - screens for unauthenticated users
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#F9FAFB' },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Welcome to Kiddo Quest' }}
          />
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ title: 'Login' }}
          />
          <Stack.Screen 
            name="Registration" 
            component={RegistrationScreen}
            options={{ title: 'Sign Up' }}
          />
          <Stack.Screen 
            name="InvitationVerification" 
            component={LoginScreen} // TODO: Create proper Invitation screen later
            options={{ title: 'Verify Invitation' }}
          />
        </Stack.Navigator>
      ) : (
        // Main Stack - screens for authenticated users
        <Stack.Navigator
          initialRouteName="ParentDashboard"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#F9FAFB' },
          }}
        >
          <Stack.Screen 
            name="ParentDashboard" 
            component={ParentDashboardScreen}
            options={{ title: 'Parent Dashboard' }}
          />
          <Stack.Screen 
            name="ChildDashboard" 
            component={ChildDashboardScreen}
            options={{ title: 'Child Dashboard' }}
          />
          <Stack.Screen 
            name="ManageQuests" 
            component={ManageQuestsScreen}
            options={{ title: 'Manage Quests' }}
          />
          <Stack.Screen 
            name="QuestForm" 
            component={QuestFormScreen}
            options={{ title: 'Quest Form' }}
          />
          <Stack.Screen 
            name="ManageRewards" 
            component={ManageRewardsScreen}
            options={{ title: 'Manage Rewards' }}
          />
          <Stack.Screen 
            name="RewardForm" 
            component={RewardFormScreen}
            options={{ title: 'Reward Form' }}
          />
          <Stack.Screen 
            name="ManagePenalties" 
            component={PenaltyManagementScreen}
            options={{ title: 'Manage Penalties' }}
          />
          <Stack.Screen 
            name="AddChild" 
            component={AddChildScreen}
            options={{ title: 'Add Child' }}
          />
          <Stack.Screen 
            name="EditChild" 
            component={EditChildScreen}
            options={{ title: 'Edit Child' }}
          />
          {/* TODO: Add remaining screens - AddChild, EditChild, etc. */}
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
