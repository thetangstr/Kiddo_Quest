import React, { useState, useEffect } from 'react';
import { Mail, UserPlus, AlertCircle, Check, X, Clock } from 'lucide-react';
import useKiddoQuestStore from '../store';
import { Button, InputField, Card, LoadingSpinner } from './UI';
import { 
  createInvitation, 
  INVITATION_STATUS, 
  USER_ROLES,
  getFamilyInvitations,
  deleteInvitation
} from '../utils/invitationManager';

export const InvitationForm = ({ onComplete }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(USER_ROLES.PARENT);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { currentUser } = useKiddoQuestStore();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setSuccess(false);
    
    try {
      // Family ID is currently the user's ID until we implement proper family structures
      const familyId = currentUser.uid;
      
      const result = await createInvitation(
        email,
        role,
        familyId,
        currentUser.uid,
        currentUser.displayName || currentUser.email
      );
      
      if (result.success) {
        setSuccess(true);
        setEmail('');
        if (onComplete) onComplete(result);
      } else {
        setError(result.error || 'Failed to send invitation. Please try again.');
      }
    } catch (error) {
      setError(error.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold text-indigo-600 mb-4">Invite Someone</h2>
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
          <Check size={18} className="mr-2" />
          <span>Invitation sent successfully!</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <InputField
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          required
        />
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Role
          </label>
          <div className="mt-1">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value={USER_ROLES.PARENT}>Parent</option>
              <option value={USER_ROLES.GUARDIAN}>Guardian</option>
              <option value={USER_ROLES.CHILD}>Child</option>
            </select>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {role === USER_ROLES.PARENT && "Parents have full access to manage quests and rewards."}
            {role === USER_ROLES.GUARDIAN && "Guardians can verify completed quests but cannot create new ones."}
            {role === USER_ROLES.CHILD && "Children can view and complete quests to earn rewards."}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
            <AlertCircle size={18} className="mr-2" />
            <span>{error}</span>
          </div>
        )}
        
        <Button 
          type="submit" 
          variant="primary" 
          className="w-full" 
          disabled={isLoading}
          icon={Mail}
        >
          {isLoading ? 'Sending...' : 'Send Invitation'}
        </Button>
      </form>
    </div>
  );
};

export const InvitationsList = () => {
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { currentUser } = useKiddoQuestStore();
  
  const fetchInvitations = async () => {
    try {
      setIsLoading(true);
      // Family ID is currently the user's ID until we implement proper family structures
      const familyId = currentUser.uid;
      const invitationsList = await getFamilyInvitations(familyId);
      setInvitations(invitationsList);
    } catch (error) {
      setError('Failed to load invitations');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (currentUser) {
      fetchInvitations();
    }
  }, [currentUser]);
  
  const handleDeleteInvitation = async (id) => {
    try {
      await deleteInvitation(id);
      // Refresh the list
      fetchInvitations();
    } catch (error) {
      setError('Failed to delete invitation');
    }
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case INVITATION_STATUS.PENDING:
        return (
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center">
            <Clock size={12} className="mr-1" /> Pending
          </span>
        );
      case INVITATION_STATUS.ACCEPTED:
        return (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
            <Check size={12} className="mr-1" /> Accepted
          </span>
        );
      case INVITATION_STATUS.REJECTED:
        return (
          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center">
            <X size={12} className="mr-1" /> Rejected
          </span>
        );
      case INVITATION_STATUS.EXPIRED:
        return (
          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full flex items-center">
            <Clock size={12} className="mr-1" /> Expired
          </span>
        );
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return <LoadingSpinner message="Loading invitations..." />;
  }
  
  return (
    <div>
      <h2 className="text-xl font-semibold text-indigo-600 mb-4">Sent Invitations</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <AlertCircle size={18} className="mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      {invitations.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-md">
          <p className="text-gray-500">No invitations sent yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invitations.map(invitation => (
            <Card key={invitation.id} className="p-3 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{invitation.email}</p>
                  <p className="text-xs text-gray-500">
                    Role: {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Sent: {invitation.createdAt ? new Date(invitation.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(invitation.status)}
                  
                  {invitation.status === INVITATION_STATUS.PENDING && (
                    <button
                      onClick={() => handleDeleteInvitation(invitation.id)}
                      className="text-gray-500 hover:text-red-600"
                      title="Cancel invitation"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      <div className="mt-4">
        <Button 
          variant="outline" 
          icon={UserPlus}
          onClick={fetchInvitations}
          className="w-full"
        >
          Refresh List
        </Button>
      </div>
    </div>
  );
};

export const InvitationManager = () => {
  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold text-indigo-600 mb-6 flex items-center">
        <UserPlus className="mr-2" /> Manage Invitations
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <InvitationForm />
        <InvitationsList />
      </div>
    </Card>
  );
};
