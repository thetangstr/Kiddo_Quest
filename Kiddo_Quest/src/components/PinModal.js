import React, { useState, useEffect } from 'react';
import { X, Check, Key } from 'lucide-react';

/**
 * PIN Modal component for parent authentication
 * Used when transitioning from child view to parent dashboard
 */
const PinModal = ({ isOpen, onClose, onSubmit, error: externalError, pinLength = 4 }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  
  // Reset pin when modal opens or when external error changes
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(externalError || '');
    }
  }, [isOpen, externalError]);
  
  // Update internal error when external error changes
  useEffect(() => {
    if (externalError) {
      setError(externalError);
    }
  }, [externalError]);
  
  // Handle pin input
  const handlePinChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and limit to pinLength
    if (/^\d*$/.test(value) && value.length <= pinLength) {
      setPin(value);
      setError('');
    }
  };
  
  // Handle pin submission
  const handleSubmit = () => {
    if (pin.length < pinLength) {
      setError(`PIN must be ${pinLength} digits`);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    
    onSubmit(pin);
  };
  
  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className={`bg-white rounded-lg p-6 w-full max-w-sm mx-4 shadow-xl transform transition-all ${shake ? 'animate-shake' : ''}`}
        style={{ 
          animation: shake ? 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' : 'none' 
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Key className="mr-2 text-indigo-600" size={20} />
            Enter Parent PIN
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <p className="text-gray-600 mb-4">
          Please enter your PIN to access the parent dashboard.
        </p>
        
        <div className="mb-4">
          <input
            type="password"
            value={pin}
            onChange={handlePinChange}
            onKeyPress={handleKeyPress}
            placeholder="Enter PIN"
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-center text-2xl tracking-widest"
            autoFocus
          />
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
            disabled={pin.length < pinLength}
          >
            <Check size={18} className="mr-1" />
            Verify
          </button>
        </div>
        
        {/* Shake animation */}
        <style jsx="true">{`
          @keyframes shake {
            10%, 90% { transform: translate3d(-1px, 0, 0); }
            20%, 80% { transform: translate3d(2px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
            40%, 60% { transform: translate3d(4px, 0, 0); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default PinModal;
