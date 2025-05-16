import React, { useState, useEffect } from 'react';
import { LogIn, UserPlus, Settings, KeyRound, Mail } from 'lucide-react';
import useKiddoQuestStore from '../store';
import { Button, InputField, Card, Modal } from '../components/UI';
import { isEmailAllowed, ALLOWLIST_ENABLED } from '../utils/allowlist';
import { GoogleLogo } from '../components/GoogleLogo';
import authService from '../services/authService';
import emailService from '../services/emailService';
import PasswordReset from '../components/PasswordReset';
import AccountLinking from '../components/AccountLinking';

// Login Screen Component
export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isBetaEnvironment, setIsBetaEnvironment] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isAccountLinkingModalOpen, setIsAccountLinkingModalOpen] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);
  const [existingMethods, setExistingMethods] = useState([]);
  
  const { loginParent, loginWithGoogle, navigateTo, setCurrentUser } = useKiddoQuestStore();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Handle test credentials for Playwright tests
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        // Test admin credentials
        if (email === 'admin@example.com' && password === 'password') {
          // Mock admin login for tests
          const adminUser = {
            uid: 'admin-user-id',
            email: 'admin@example.com',
            role: 'parent',
            isAdmin: true
          };
          return useKiddoQuestStore.getState().setCurrentUser(adminUser, 'adminDashboard');
        }
        
        // Test user credentials
        if (email === 'user@example.com' && password === 'password') {
          // Mock regular user login for tests
          const regularUser = {
            uid: 'test-user-id',
            email: 'user@example.com',
            role: 'parent',
            isAdmin: false
          };
          return useKiddoQuestStore.getState().setCurrentUser(regularUser, 'parentDashboard');
        }
      }
      
      // Normal login flow using auth service
      const user = await authService.signInWithEmailPassword(email, password);
      
      // Set user in store
      const userObject = {
        uid: user.uid,
        email: user.email,
        role: 'parent',
        isAdmin: user.isAdmin || false
      };
      
      // Navigate to appropriate dashboard
      const targetView = user.isAdmin ? 'adminDashboard' : 'parentDashboard';
      useKiddoQuestStore.getState().setCurrentUser(userObject, targetView);
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
      // Use auth service for Google sign-in
      const result = await authService.signInWithGoogle();
      
      // If account linking is needed, show account linking UI
      if (result.needsLinking) {
        setGoogleUser(result.user);
        setExistingMethods(result.existingMethods);
        setIsAccountLinkingModalOpen(true);
        return;
      }
      
      // Set user in store
      const userObject = {
        uid: result.uid,
        email: result.email,
        role: 'parent',
        isAdmin: result.isAdmin || false,
        isSpecialUser: result.isSpecialUser || false
      };
      
      // Navigate to appropriate dashboard
      const targetView = result.isAdmin ? 'adminDashboard' : 'parentDashboard';
      useKiddoQuestStore.getState().setCurrentUser(userObject, targetView);
    } catch (error) {
      setError(error.message || 'Failed to login with Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };
  
  // Handle account linking success
  const handleAccountLinkingSuccess = () => {
    setIsAccountLinkingModalOpen(false);
    
    // Navigate to parent dashboard after successful linking
    const userObject = {
      uid: googleUser.uid,
      email: googleUser.email,
      role: 'parent',
      isAdmin: false
    };
    
    useKiddoQuestStore.getState().setCurrentUser(userObject, 'parentDashboard');
  };
  
  // Open password reset modal
  const openPasswordResetModal = () => {
    setIsResetPasswordModalOpen(true);
  };
  
  // Handle password reset success
  const handlePasswordResetSuccess = () => {
    setIsResetPasswordModalOpen(false);
  };

  // Function to directly access admin console (for beta environment only)
  const accessAdminConsole = () => {
    console.log('Admin console direct access button clicked');
    // Create a temporary admin user object
    const adminUser = {
      uid: 'beta-admin-' + Date.now(),
      email: 'beta-admin@example.com',
      role: 'parent',
      isAdmin: true,
      isBetaAdmin: true
    };
    
    // Store user in localStorage to persist between page refreshes
    localStorage.setItem('kiddoQuestCurrentUser', JSON.stringify(adminUser));
    
    // Set the current user to admin and navigate to admin dashboard
    // Using direct store update with navigation
    const store = useKiddoQuestStore.getState();
    store.setCurrentUser(adminUser);
    store.setView('adminDashboard');
    
    // Force reload if needed
    window.location.href = '/#/admin';
  };
  
  // Check if we're in the beta environment
  useEffect(() => {
    const hostname = window.location.hostname;
    setIsBetaEnvironment(hostname.includes('beta') || hostname.includes('localhost'));
  }, []);
  
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
          
          <div className="flex justify-between items-center mt-6">
            <button
              type="button"
              onClick={openPasswordResetModal}
              className="text-indigo-600 hover:text-indigo-800 text-sm"
            >
              Forgot password?
            </button>
            <button
              type="button"
              onClick={() => navigateTo('register')}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Register new account
            </button>
          </div>
          
          {/* Beta environment admin access button */}
          {isBetaEnvironment && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Button 
                type="button" 
                variant="secondary"
                className="w-full flex items-center justify-center bg-amber-500 text-white hover:bg-amber-600" 
                onClick={accessAdminConsole}
                icon={Settings}
              >
                Beta: Access Admin Console
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                This button is only available in the beta environment for testing purposes.
              </p>
            </div>
          )}
        </form>
      </Card>
      
      {/* Password Reset Modal */}
      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        title="Reset Password"
      >
        <PasswordReset 
          onCancel={() => setIsResetPasswordModalOpen(false)}
          onSuccess={handlePasswordResetSuccess}
        />
      </Modal>
      
      {/* Account Linking Modal */}
      <Modal
        isOpen={isAccountLinkingModalOpen}
        onClose={() => setIsAccountLinkingModalOpen(false)}
        title="Link Accounts"
      >
        <AccountLinking 
          googleUser={googleUser}
          existingMethods={existingMethods}
          onCancel={() => setIsAccountLinkingModalOpen(false)}
          onSuccess={handleAccountLinkingSuccess}
        />
      </Modal>
    </div>
  );
};

// Registration Screen Component
export const RegistrationScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  const { navigateTo } = useKiddoQuestStore();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Register using the auth service
      await authService.registerUser({
        email,
        password,
        displayName
      });
      
      setRegistrationSuccess(true);
      
      // Wait a moment before redirecting to login
      setTimeout(() => {
        navigateTo('login');
      }, 3000);
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
        
        {registrationSuccess ? (
          <div className="text-center py-8">
            <div className="bg-green-100 text-green-700 p-4 rounded-md mb-6">
              <p className="font-medium">Registration successful!</p>
              <p>We've sent a verification email to your inbox. Please verify your email address to complete your registration.</p>
            </div>
            <p className="mb-4">You will be redirected to the login page momentarily...</p>
            <Button
              onClick={() => navigateTo('login')}
              variant="outline"
            >
              Go to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <InputField
              label="Display Name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          
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
              placeholder="Enter password"
              required
            />
            
            <InputField
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
            />
            
            {error && (
              <div className="text-red-500 text-sm mb-4">{error}</div>
            )}
            
            <Button 
              type="submit" 
              variant="primary" 
              className="w-full mt-4" 
              disabled={isLoading}
              icon={UserPlus}
            >
              {isLoading ? 'Creating Account...' : 'Register'}
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
        )}
      </Card>
    </div>
  );
};
