import React, { useState, useEffect } from 'react';
import { Mail, Check, AlertCircle, X, UserPlus, ArrowLeft, Loader } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import useKiddoQuestStore from '../store';
import { Button, Card, LoadingSpinner } from '../components/UI';
import { verifyInvitation, acceptInvitation, rejectInvitation, INVITATION_STATUS } from '../utils/invitationManager';

export const InvitationVerification = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('loading'); // loading, valid, invalid, accepted, expired
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState('');
  
  const { 
    currentUser, 
    loginWithGoogle, 
    registerParent,
    navigateTo
  } = useKiddoQuestStore();
  
  // Verify the invitation token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('invalid');
        setError('Invalid invitation link. No token provided.');
        return;
      }
      
      try {
        // Verify the invitation
        const result = await verifyInvitation(token);
        
        if (!result.success) {
          setStatus('invalid');
          setError(result.error || 'Invalid or expired invitation.');
          return;
        }
        
        // Store the invitation details
        setInvitation(result.invitation);
        setStatus('valid');
      } catch (error) {
        setStatus('invalid');
        setError(error.message || 'Failed to verify invitation.');
      }
    };
    
    verifyToken();
  }, [token]);
  
  const handleAccept = async () => {
    if (currentUser && invitation) {
      try {
        setStatus('processing');
        
        // Accept the invitation with the current user's ID
        const result = await acceptInvitation(invitation.id, currentUser.uid);
        
        if (result.success) {
          setStatus('accepted');
          
          // Refresh the user's data to get updated family information
          // This would be implemented in store.js
          // await refreshUserData();
          
          // Navigate to the appropriate dashboard
          setTimeout(() => {
            navigateTo('parentDashboard');
          }, 2000);
        } else {
          setStatus('valid'); // Reset to valid state to allow retry
          setError(result.error || 'Failed to accept invitation.');
        }
      } catch (error) {
        setStatus('valid');
        setError(error.message || 'An error occurred while accepting the invitation.');
      }
    }
  };
  
  const handleReject = async () => {
    if (invitation) {
      try {
        setStatus('processing');
        
        await rejectInvitation(invitation.id);
        setStatus('rejected');
        
        // Navigate back to login after a delay
        setTimeout(() => {
          navigateTo('login');
        }, 2000);
      } catch (error) {
        setStatus('valid');
        setError(error.message || 'An error occurred while rejecting the invitation.');
      }
    }
  };
  
  const renderContent = () => {
    switch (status) {
      case 'loading':
        return <LoadingSpinner message="Verifying invitation..." />;
        
      case 'processing':
        return <LoadingSpinner message="Processing..." />;
        
      case 'valid':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-indigo-600 mb-4">You're Invited!</h2>
            
            {invitation && (
              <>
                <p className="mb-4">
                  You've been invited to join Kiddo Quest as a{' '}
                  <span className="font-semibold">
                    {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                  </span>
                </p>
                
                {invitation.inviterName && (
                  <p className="mb-6">
                    Invitation from: <span className="font-semibold">{invitation.inviterName}</span>
                  </p>
                )}
                
                {currentUser ? (
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      You are currently signed in as <span className="font-semibold">{currentUser.email}</span>
                    </p>
                    
                    <div className="flex justify-center space-x-4">
                      <Button 
                        variant="outline" 
                        icon={X} 
                        onClick={handleReject}
                      >
                        Decline
                      </Button>
                      
                      <Button 
                        variant="primary" 
                        icon={Check} 
                        onClick={handleAccept}
                      >
                        Accept Invitation
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Please sign in or create an account to accept this invitation
                    </p>
                    
                    <div className="flex flex-col space-y-3">
                      <Button
                        variant="primary"
                        icon={UserPlus}
                        onClick={() => navigateTo('register', { invitationToken: token })}
                      >
                        Create New Account
                      </Button>
                      
                      <Button
                        variant="outline"
                        icon={Mail}
                        onClick={() => navigateTo('login', { invitationToken: token })}
                      >
                        Sign In with Email
                      </Button>
                      
                      <button
                        onClick={() => loginWithGoogle()}
                        className="w-full flex items-center justify-center bg-white text-gray-700 border border-gray-300 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300 shadow-sm"
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Sign in with Google
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4 flex items-center">
                <AlertCircle size={18} className="mr-2" />
                <span>{error}</span>
              </div>
            )}
          </div>
        );
        
      case 'accepted':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} />
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Invitation Accepted!</h2>
            <p className="text-gray-600 mb-6">
              You've successfully accepted the invitation.
              Redirecting to your dashboard...
            </p>
            <div className="flex justify-center">
              <Loader size={24} className="animate-spin text-indigo-500" />
            </div>
          </div>
        );
        
      case 'rejected':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <X size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-600 mb-2">Invitation Declined</h2>
            <p className="text-gray-600 mb-6">
              You've declined the invitation.
              Redirecting...
            </p>
            <div className="flex justify-center">
              <Loader size={24} className="animate-spin text-indigo-500" />
            </div>
          </div>
        );
        
      case 'invalid':
      case 'expired':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              {status === 'invalid' ? 'Invalid Invitation' : 'Expired Invitation'}
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'This invitation link is no longer valid. Please request a new invitation.'}
            </p>
            <Button
              variant="primary"
              icon={ArrowLeft}
              onClick={() => navigateTo('login')}
            >
              Return to Login
            </Button>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-100 to-purple-100 px-4 py-12">
      <Card className="w-full max-w-md p-8">
        {renderContent()}
      </Card>
    </div>
  );
};

export default InvitationVerification;
