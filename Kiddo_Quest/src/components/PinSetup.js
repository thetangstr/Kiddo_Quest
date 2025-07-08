import React, { useState, useEffect } from 'react';
import { Key, Save, AlertCircle } from 'lucide-react';
import useKiddoQuestStore from '../store';
import { Card } from './UI';

/**
 * Component for setting up or changing the parent PIN
 */
const PinSetup = () => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasExistingPin, setHasExistingPin] = useState(false);
  
  const { setParentPin, hasParentPin } = useKiddoQuestStore();
  
  // Check if user already has a PIN
  useEffect(() => {
    const checkForPin = async () => {
      const hasPin = await hasParentPin();
      setHasExistingPin(hasPin);
    };
    
    checkForPin();
  }, [hasParentPin]);
  
  // Handle PIN input
  const handlePinChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and limit to 4 digits
    if (/^\d*$/.test(value) && value.length <= 4) {
      setPin(value);
      setError('');
      setSuccess(false);
    }
  };
  
  // Handle confirm PIN input
  const handleConfirmPinChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and limit to 4 digits
    if (/^\d*$/.test(value) && value.length <= 4) {
      setConfirmPin(value);
      setError('');
      setSuccess(false);
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
    
    // Validate PIN confirmation
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    
    // Save PIN
    try {
      const result = await setParentPin(pin);
      if (result.success) {
        setSuccess(true);
        setError('');
        setHasExistingPin(true);
      } else {
        setError(result.error || 'Failed to set PIN');
      }
    } catch (error) {
      setError('An error occurred while setting the PIN');
      console.error('Error setting PIN:', error);
    }
  };
  
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Key className="mr-2 text-indigo-600" size={20} />
        {hasExistingPin ? 'Change Parent PIN' : 'Set Up Parent PIN'}
      </h2>
      
      <p className="text-gray-600 mb-4">
        {hasExistingPin 
          ? 'Your PIN protects access to the parent dashboard. You can change it below.'
          : 'Set a 4-digit PIN to protect access to the parent dashboard from the child view.'}
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            {hasExistingPin ? 'New PIN' : 'PIN'} (4 digits)
          </label>
          <input
            type="password"
            value={pin}
            onChange={handlePinChange}
            placeholder="Enter 4-digit PIN"
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-center text-xl tracking-widest"
            maxLength={4}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Confirm PIN
          </label>
          <input
            type="password"
            value={confirmPin}
            onChange={handleConfirmPinChange}
            placeholder="Confirm PIN"
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-center text-xl tracking-widest"
            maxLength={4}
            required
          />
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
            <AlertCircle size={16} className="mr-2" />
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-md flex items-center text-green-700">
            <Save size={16} className="mr-2" />
            PIN successfully {hasExistingPin ? 'updated' : 'set'}!
          </div>
        )}
        
        <button
          type="submit"
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center"
          disabled={pin.length !== 4 || confirmPin.length !== 4}
        >
          <Save size={18} className="mr-2" />
          {hasExistingPin ? 'Update PIN' : 'Set PIN'}
        </button>
      </form>
    </Card>
  );
};

export default PinSetup;
