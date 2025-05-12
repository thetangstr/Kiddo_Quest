import React, { useState } from 'react';
import { Key, AlertCircle } from 'lucide-react';
import useKiddoQuestStore from '../store';
import { Card } from './UI';

/**
 * Component for verifying the parent PIN
 */
const PinVerification = ({ onSuccess, onCancel }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  const { verifyParentPin } = useKiddoQuestStore();
  
  // Handle PIN input
  const handlePinChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and limit to 4 digits
    if (/^\d*$/.test(value) && value.length <= 4) {
      setPin(value);
      setError('');
    }
  };
  
  // Handle PIN submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate PIN
    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    
    // Verify PIN
    try {
      setIsVerifying(true);
      const result = await verifyParentPin(pin);
      
      if (result.success) {
        if (onSuccess) onSuccess();
      } else {
        setError(result.error || 'Incorrect PIN');
      }
    } catch (error) {
      setError('An error occurred while verifying the PIN');
      console.error('Error verifying PIN:', error);
    } finally {
      setIsVerifying(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Key className="mr-2 text-indigo-600" size={20} />
          Parent Access Required
        </h2>
        
        <p className="text-gray-600 mb-4">
          Please enter your 4-digit PIN to access the parent dashboard.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              PIN (4 digits)
            </label>
            <input
              type="password"
              value={pin}
              onChange={handlePinChange}
              placeholder="Enter 4-digit PIN"
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-center text-xl tracking-widest"
              maxLength={4}
              required
              autoFocus
            />
          </div>
          
          {error && (
            <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
              <AlertCircle size={16} className="mr-2" />
              {error}
            </div>
          )}
          
          <div className="flex space-x-3">
            <button
              type="button"
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center"
              disabled={pin.length !== 4 || isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Verify PIN'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default PinVerification;
