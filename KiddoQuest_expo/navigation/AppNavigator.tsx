import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ParentDashboard from '../screens/ParentDashboard';
import ChildDashboard from '../screens/ChildDashboard';
import CreateQuest from '../screens/CreateQuest';
import QuestApprovals from '../screens/QuestApprovals';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="ParentDashboard" component={ParentDashboard} options={{ headerShown: false }} />
        <Stack.Screen name="ChildDashboard" component={ChildDashboard} options={{ headerShown: false }} />
        <Stack.Screen name="CreateQuest" component={CreateQuest} options={{ headerShown: false }} />
        <Stack.Screen name="QuestApprovals" component={QuestApprovals} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
