import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useStore from '../store/useStore';
import TextInput from '../components/TextInput';
import Button from '../components/Button';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { loginParent, isLoading, error } = useStore((state) => ({
    loginParent: state.loginParent,
    isLoading: state.isLoading,
    error: state.error,
  }));
  
  const navigation = useNavigation();
  
  const handleLogin = async () => {
    await loginParent(email, password);
    // Navigation will be handled by the store's currentView state
  };
  
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#F9FAFB',
    }}>
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <View style={{ padding: 24 }}>
          <Text style={{ 
            fontSize: 24, 
            fontWeight: 'bold', 
            color: '#4F46E5',
            marginBottom: 8,
            textAlign: 'center',
          }}>
            Kiddo Quest
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: '#6B7280',
            marginBottom: 24,
            textAlign: 'center',
          }}>
            Log in to your parent account
          </Text>
          
          {error && (
            <View style={{ 
              backgroundColor: '#FEE2E2', 
              borderRadius: 4,
              padding: 12,
              marginBottom: 16,
            }}>
              <Text style={{ color: '#B91C1C' }}>{error}</Text>
            </View>
          )}
          
          <View style={{ marginBottom: 16 }}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              disabled={isLoading}
            />
          </View>
          
          <View style={{ marginBottom: 24 }}>
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              disabled={isLoading}
            />
          </View>
          
          <Button
            onPress={handleLogin}
            variant="primary"
            disabled={isLoading || !email || !password}
            isLoading={isLoading}
          >
            Log In
          </Button>
          
          <TouchableOpacity 
            style={{ marginTop: 16, alignItems: 'center' }}
            disabled={isLoading}
            onPress={() => {
              if (Platform.OS === 'web') {
                // Web navigation
                // This would be handled by the navigation prop in a full implementation
              } else {
                // React Navigation for mobile
                // @ts-ignore - we'll add the proper navigation typing in a complete implementation
                navigation.navigate('Registration');
              }
            }}
          >
            <Text style={{ color: '#4F46E5', textDecorationLine: 'underline' }}>
              Don't have an account? Sign up
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
      
      {isLoading && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.7)',
        }}>
          <LoadingSpinner message="Logging in..." />
        </View>
      )}
    </View>
  );
};

export default LoginScreen;
