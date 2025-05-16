import React, { useState } from 'react';
import { Button, Card, InputField } from './UI';
import authService from '../services/authService';

/**
 * Password Reset Component
 * Allows users to request a password reset email
 */
const PasswordReset = ({ onCancel, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Handle reset password request
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setIsSending(true);
    
    try {
      await authService.resetPassword(email);
      setSuccess(true);
      
      // Notify parent component
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 5000); // Give user time to read the success message
      }
    } catch (error) {
      console.error('Error requesting password reset:', error);
      setError(error.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-indigo-600">Reset Your Password</h2>
        <p className="text-gray-600 mt-2">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>
      
      {success ? (
        <div className="text-center">
          <div className="bg-green-100 text-green-700 p-4 rounded-md mb-4">
            <p className="font-medium">Password reset email sent!</p>
            <p>Please check your email for instructions to reset your password.</p>
          </div>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={onCancel}
          >
            Return to Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleResetPassword}>
          <InputField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            autoComplete="email"
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
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Reset Password'}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
};

export default PasswordReset;
