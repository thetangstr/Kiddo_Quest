import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  View,
  Platform,
  ActivityIndicator
} from 'react-native';

// Define button variants 
type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'link' | 'custom' | 'completion';

// Define button sizes
type ButtonSize = 'small' | 'medium' | 'large';

// Button props interface
interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: any; // For custom styling
  icon?: React.ReactNode;
  disabled?: boolean;
  isLoading?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

// Button component that works across platforms
export const Button = ({
  onPress,
  children,
  variant = 'primary',
  size = 'medium',
  style,
  icon,
  disabled = false,
  isLoading = false,
  accessibilityLabel,
  testID
}: ButtonProps) => {
  // Get the styles for the current variant
  const variantStyle = styles[variant] || {};
  const variantTextStyle = textStyles[variant] || {};
  
  // Determine if we should show the loading indicator
  const showLoading = isLoading && !disabled;
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      style={[
        styles.button,
        styles[size],
        variantStyle,
        disabled ? styles.disabled : {},
        style
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      testID={testID}
    >
      <View style={styles.contentContainer}>
        {showLoading ? (
          <ActivityIndicator 
            size="small" 
            color={variant === 'outline' || variant === 'link' ? '#4F46E5' : '#FFFFFF'} 
          />
        ) : (
          <>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text style={[
              styles.text,
              variantTextStyle,
              disabled ? styles.disabledText : {}
            ]}>
              {children}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Styles
const styles: any = StyleSheet.create({
  button: {
    borderRadius: 8,
    ...(Platform.OS === 'web' ? {
      // Using type assertion to fix TypeScript errors with web-specific properties
      // @ts-ignore - These web-specific styles cause TypeScript errors but work correctly
    } : {}),
  },
  // Size variants
  small: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 80,
  },
  medium: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    minWidth: 120,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    minWidth: 120,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '500',
    textAlign: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  disabled: {
    backgroundColor: '#E5E7EB',
    borderColor: '#E5E7EB',
    opacity: 1, // Remove transparency
  },
  disabledText: {
    color: '#9CA3AF', // gray-400 - better than opacity
  },
  // Button variants
  primary: {
    backgroundColor: '#3B82F6', // blue-500 - better contrast
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // Android shadow
  },
  secondary: {
    backgroundColor: '#E5E7EB', // gray-200
  },
  success: {
    backgroundColor: '#059669', // green-600 - more vibrant
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8, // Android shadow - more prominent
    borderWidth: 2,
    borderColor: '#34D399', // green-400 border for extra pop
  },
  danger: {
    backgroundColor: '#EF4444', // red-500
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB', // gray-300
  },
  link: {
    backgroundColor: 'transparent',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  custom: {
    // Empty to allow for complete style customization via style prop
  },
  completion: {
    backgroundColor: '#16A34A', // green-600 
    shadowColor: '#16A34A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 12, // Very prominent shadow
    borderWidth: 3,
    borderColor: '#22C55E', // green-500 bright border
    transform: [{ scale: 1.05 }], // Slightly larger
  },
});

// Text styles for different button variants
const textStyles: any = StyleSheet.create({
  primary: {
    color: '#FFFFFF',
  },
  secondary: {
    color: '#1F2937', // gray-800
  },
  success: {
    color: '#FFFFFF',
  },
  danger: {
    color: '#FFFFFF',
  },
  outline: {
    color: '#4B5563', // gray-600
  },
  link: {
    color: '#4F46E5', // indigo-600
    textDecorationLine: 'underline',
  },
  custom: {
    // Empty to allow for custom styling
  },
  completion: {
    color: '#FFFFFF',
    fontWeight: '700', // Extra bold
    fontSize: 16,
  },
});

export default Button;
