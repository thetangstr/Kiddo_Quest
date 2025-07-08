import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import useStore from './src/store/useStore';
import { Platform } from 'react-native';
import { onAuthStateChanged } from './src/utils/firebase';

// Import Firebase configuration
import './src/utils/firebase';

export default function App() {
  const { setAuthState, loadUserData } = useStore();

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in, load their data
        try {
          await loadUserData(user.uid);
        } catch (error) {
          console.error('Error loading user data:', error);
          setAuthState(false, null);
        }
      } else {
        // User is signed out
        setAuthState(false, null);
      }
    });

    return unsubscribe;
  }, [setAuthState, loadUserData]);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // gray-50
  },
});
