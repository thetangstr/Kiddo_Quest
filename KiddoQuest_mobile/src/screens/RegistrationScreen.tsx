import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { LoadingSpinner } from '../components/LoadingSpinner';
import useStore from '../store/useStore';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'Registration'>;

export default function RegistrationScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const { registerParent, isLoading, error } = useStore();

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      await registerParent(email.trim().toLowerCase(), password);
      // Navigation will be handled automatically by auth state change
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Failed to create account');
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center px-6 py-12">
            {/* Header */}
            <View className="mb-8">
              <Text className="text-3xl font-bold text-gray-900 text-center">
                Create Account
              </Text>
              <Text className="text-base text-gray-600 text-center mt-2">
                Join KiddoQuest and start your family's adventure
              </Text>
            </View>

            {/* Form */}
            <View className="space-y-4">
              <TextInput
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
              />

              <TextInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                secureTextEntry={!isPasswordVisible}
                onToggleSecureEntry={() => setIsPasswordVisible(!isPasswordVisible)}
                showSecureToggle
                autoComplete="new-password"
                textContentType="newPassword"
              />

              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                secureTextEntry={!isConfirmPasswordVisible}
                onToggleSecureEntry={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                showSecureToggle
                autoComplete="new-password"
                textContentType="newPassword"
              />

              {error && (
                <View className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <Text className="text-red-700 text-sm text-center">{error}</Text>
                </View>
              )}

              <Button
                title={isLoading ? 'Creating Account...' : 'Create Account'}
                onPress={handleRegister}
                disabled={isLoading}
                variant="primary"
                className="mt-6"
              />
            </View>

            {/* Footer */}
            <View className="mt-8">
              <View className="flex-row justify-center items-center">
                <Text className="text-gray-600">Already have an account? </Text>
                <TouchableOpacity onPress={navigateToLogin}>
                  <Text className="text-indigo-600 font-semibold">Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms */}
            <View className="mt-6">
              <Text className="text-xs text-gray-500 text-center leading-4">
                By creating an account, you agree to our{' '}
                <Text className="text-indigo-600">Terms of Service</Text> and{' '}
                <Text className="text-indigo-600">Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {isLoading && (
        <View className="absolute inset-0 bg-black bg-opacity-20 justify-center items-center">
          <LoadingSpinner />
        </View>
      )}
    </SafeAreaView>
  );
}