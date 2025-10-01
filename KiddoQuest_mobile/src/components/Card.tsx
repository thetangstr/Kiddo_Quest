import React from 'react';
import { 
  View, 
  StyleSheet, 
  Platform,
  ViewStyle 
} from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
}

export const Card = ({
  children,
  style,
  testID,
  accessibilityLabel
}: CardProps) => {
  return (
    <View 
      style={[styles.card, style]} 
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
});

export default Card;
