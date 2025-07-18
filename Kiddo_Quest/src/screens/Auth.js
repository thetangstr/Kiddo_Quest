import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LogIn, UserPlus, Mail, Check, AlertCircle, Link } from 'lucide-react';
import useKiddoQuestStore from '../store';
import { Button, InputField, Card } from '../components/UI';
import { isEmailAllowed, ALLOWLIST_ENABLED } from '../utils/allowlist';
import { GoogleLogo } from '../components/GoogleLogo';
import { verifyInvitation } from '../utils/invitationManager';

// Login Screen Component
export const LoginScreen = () => {
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('token');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAllowlisted, setIsAllowlisted] = useState(false);
  const [hasInvitation, setHasInvitation] = useState(false);
  const [invitationDetails, setInvitationDetails] = useState(null);
  
  // Check invitation token if present
  useEffect(() => {
    const checkInvitation = async () => {
      if (invitationToken) {
        try {
          const result = await verifyInvitation(invitationToken);
          if (result.success) {
            setHasInvitation(true);
            setInvitationDetails(result.invitation);
            // Pre-fill email if invitation is valid
            setEmail(result.invitation.email);
            // Skip allowlist check for users with valid invitations
            setIsAllowlisted(true);
          }
        } catch (error) {
          console.error('Error verifying invitation:', error);
        }
      }
    };
    
    checkInvitation();
  }, [invitationToken]);
  
  // Check if email is in allowlist as user types (skip if we have a valid invitation)
  useEffect(() => {
    if (!hasInvitation && email && ALLOWLIST_ENABLED) {
      setIsAllowlisted(isEmailAllowed(email));
    } else if (hasInvitation) {
      setIsAllowlisted(true);
    } else {
      setIsAllowlisted(false);
    }
  }, [email, hasInvitation]);
  
  const { loginParent, loginWithGoogle, navigateTo, processInvitationAfterAuth } = useKiddoQuestStore();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Login the user
      const user = await loginParent(email, password);
      
      // Process invitation if present
      if (invitationToken && user) {
        await processInvitationAfterAuth(invitationToken, user.uid);
      }
    } catch (error) {
      setError(error.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    
    try {
      // Login with Google
      const user = await loginWithGoogle();
      
      // Process invitation if present
      if (invitationToken && user) {
        await processInvitationAfterAuth(invitationToken, user.uid);
      }
    } catch (error) {
      setError(error.message || 'Failed to login with Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-100 to-purple-100 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">Kiddo Quest</h1>
          <p className="text-gray-600 mt-2">Sign in to manage quests and rewards</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
          
          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
          
          {error && (
            <div className="text-red-500 text-sm mb-4">{error}</div>
          )}
          
          <Button 
            type="submit" 
            variant="primary" 
            className="w-full mt-2" 
            disabled={isLoading || isGoogleLoading}
            icon={LogIn}
          >
            {isLoading ? 'Signing in...' : 'Sign In with Email'}
          </Button>
          
          <div className="my-4 flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-4 text-gray-500 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
          
          <button 
            type="button" 
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
            className="w-full flex items-center justify-center bg-white text-gray-700 border border-gray-300 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300 shadow-sm"
          >
            {isGoogleLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-3"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <GoogleLogo className="w-5 h-5 mr-3" />
                <span>Sign in with Google</span>
              </>
            )}
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigateTo('register')}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Register
              </button>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
};

// Registration Screen Component
export const RegistrationScreen = () => {
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('token');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInvitation, setHasInvitation] = useState(false);
  const [invitationDetails, setInvitationDetails] = useState(null);
  
  const { registerParent, navigateTo, processInvitationAfterAuth } = useKiddoQuestStore();
  
  // Check invitation token if present
  useEffect(() => {
    const checkInvitation = async () => {
      if (invitationToken) {
        try {
          const result = await verifyInvitation(invitationToken);
          if (result.success) {
            setHasInvitation(true);
            setInvitationDetails(result.invitation);
            // Pre-fill email if invitation is valid
            setEmail(result.invitation.email);
          }
        } catch (error) {
          console.error('Error verifying invitation:', error);
        }
      }
    };
    
    checkInvitation();
  }, [invitationToken]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Register the user
      const user = await registerParent(email, password);
      
      // Process invitation if present
      if (invitationToken && user) {
        await processInvitationAfterAuth(invitationToken, user.uid);
      }
    } catch (error) {
      setError(error.message || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-100 to-purple-100 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">Kiddo Quest</h1>
          <p className="text-gray-600 mt-2">Create a new parent account</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
          
          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            required
          />
          
          <InputField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
          />
          
          {error && (
            <div className="text-red-500 text-sm mb-4">{error}</div>
          )}
          
          <Button 
            type="submit" 
            variant="primary" 
            className="w-full mt-2" 
            disabled={isLoading}
            icon={UserPlus}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigateTo('login')}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Sign In
              </button>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
};
