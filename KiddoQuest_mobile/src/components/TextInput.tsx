import React from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface TextInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  testID?: string;
}

export const TextInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = true,
  maxLength,
  multiline = false,
  numberOfLines = 1,
  required = false,
  disabled = false,
  error,
  style,
  inputStyle,
  labelStyle,
  testID,
}: TextInputProps) => {
  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, labelStyle]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}
      
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={Platform.OS === 'ios' ? undefined : numberOfLines}
        style={[
          styles.input,
          multiline && styles.multiline,
          error && styles.inputError,
          disabled && styles.inputDisabled,
          inputStyle
        ]}
        editable={!disabled}
        testID={testID}
        accessibilityLabel={label || placeholder}
        accessibilityHint={placeholder}
        accessibilityRequired={required}
        accessibilityInvalid={!!error}
      />
      
      {error && (
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563', // gray-600
  },
  required: {
    color: '#EF4444', // red-500
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB', // gray-300
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    color: '#1F2937', // gray-800
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        transition: 'border-color 0.2s ease',
      },
    }),
  },
  multiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#EF4444', // red-500
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6', // gray-100
    color: '#9CA3AF', // gray-400
    ...Platform.select({
      web: {
        cursor: 'not-allowed',
      },
    }),
  },
  errorText: {
    color: '#EF4444', // red-500
    fontSize: 12,
    marginTop: 4,
  },
});

export default TextInput;
