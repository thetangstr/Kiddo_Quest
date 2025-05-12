import React, { useState } from 'react';
import { X, Key } from 'lucide-react';
import useKiddoQuestStore from '../store';
import { Button, InputField } from './UI';

const PasscodeChangeModal = ({ isOpen, onClose }) => {
  const [currentPasscode, setCurrentPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { updateParentPasscode } = useKiddoQuestStore();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate inputs
    if (!currentPasscode || !newPasscode || !confirmPasscode) {
      setError('All fields are required');
      return;
    }
    
    if (newPasscode !== confirmPasscode) {
      setError('New passcodes do not match');
      return;
    }
    
    if (newPasscode.length < 4) {
      setError('Passcode must be at least 4 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await updateParentPasscode(currentPasscode, newPasscode);
      
      if (result.success) {
        setSuccess(result.message);
        // Reset form
        setCurrentPasscode('');
        setNewPasscode('');
        setConfirmPasscode('');
        
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to update passcode. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center">
            <Key className="mr-2" size={20} />
            Change Parent Passcode
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md">
              {success}
            </div>
          )}
          
          <InputField
            label="Current Passcode"
            type="password"
            value={currentPasscode}
            onChange={(e) => setCurrentPasscode(e.target.value)}
            placeholder="Enter your current passcode"
            className="mb-4"
          />
          
          <InputField
            label="New Passcode"
            type="password"
            value={newPasscode}
            onChange={(e) => setNewPasscode(e.target.value)}
            placeholder="Enter your new passcode"
            className="mb-4"
          />
          
          <InputField
            label="Confirm New Passcode"
            type="password"
            value={confirmPasscode}
            onChange={(e) => setConfirmPasscode(e.target.value)}
            placeholder="Confirm your new passcode"
            className="mb-4"
          />
          
          <div className="flex justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="mr-2"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Passcode'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasscodeChangeModal;
