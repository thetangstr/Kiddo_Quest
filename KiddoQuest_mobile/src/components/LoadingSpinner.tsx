import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
  testID?: string;
}

export const LoadingSpinner = ({
  message = 'Loading...',
  size = 'large',
  color = '#4F46E5', // indigo-600
  style,
  testID,
}: LoadingSpinnerProps) => {
  return (
    <View style={[styles.container, style]} testID={testID}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    color: '#4B5563', // gray-600
    textAlign: 'center',
  },
});

export default LoadingSpinner;
