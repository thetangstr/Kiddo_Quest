import React, { useState } from 'react';
import { Button, Card, InputField } from './UI';
import authService from '../services/authService';

/**
 * Account Linking Component
 * Handles linking Google authentication with existing email/password accounts
 */
const AccountLinking = ({ googleUser, existingMethods, onSuccess, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Handle account linking
  const handleLinkAccounts = async (e) => {
    e.preventDefault();
    setError('');
    setIsLinking(true);
    
    try {
      if (existingMethods.includes('password')) {
        // If email/password auth exists, link Google to existing account
        await authService.linkGoogleWithExistingAccount(googleUser, password);
        setSuccess(true);
        
        // Notify parent component
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else {
        throw new Error('Cannot link accounts. Email/password authentication is not enabled for this account.');
      }
    } catch (error) {
      console.error('Error linking accounts:', error);
      setError(error.message || 'Failed to link accounts. Please try again.');
    } finally {
      setIsLinking(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-indigo-600">Account Linking Required</h2>
        <p className="text-gray-600 mt-2">
          An account with the email {googleUser?.email} already exists.
          Enter your password to link your Google account.
        </p>
      </div>
      
      {success ? (
        <div className="text-center">
          <div className="bg-green-100 text-green-700 p-4 rounded-md mb-4">
            <p className="font-medium">Accounts linked successfully!</p>
            <p>You can now sign in with either method.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleLinkAccounts}>
          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your existing account password"
            required
            autoComplete="current-password"
          />
          
          {error && (
            <div className="text-red-500 text-sm mb-4">{error}</div>
          )}
          
          <div className="flex space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isLinking}
            >
              {isLinking ? 'Linking...' : 'Link Accounts'}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
};

export default AccountLinking;
