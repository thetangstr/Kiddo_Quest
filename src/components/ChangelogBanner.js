import React, { useState } from 'react';
import { X, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './UI';

const ChangelogModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div 
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-indigo-700">Kiddo Quest 1.1 - What's New</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto max-h-[60vh]">
          <div className="prose prose-indigo max-w-none">
            <h3 className="text-lg font-medium text-indigo-600 mb-2">Added</h3>
            <ul className="space-y-1 mb-4">
              <li><strong>New Authentication Features</strong>
                <ul>
                  <li>Account linking functionality for connecting parent and child accounts</li>
                  <li>Password reset component with email verification</li>
                  <li>Enhanced user authentication utilities</li>
                  <li>Email service for sending password reset and invitation emails</li>
                </ul>
              </li>
            </ul>
            
            <h3 className="text-lg font-medium text-indigo-600 mb-2">Fixed</h3>
            <ul className="space-y-1 mb-4">
              <li><strong>Quest Management</strong>
                <ul>
                  <li>Fixed daily recurring quests not showing up in children's dashboard when configured for multiple completions per day</li>
                  <li>Properly handles maxPerCadence for daily, weekly, and monthly recurring quests</li>
                  <li>Quests now remain visible until reaching their maximum allowed completions for the period</li>
                </ul>
              </li>
            </ul>
            
            <h3 className="text-lg font-medium text-indigo-600 mb-2">Changed</h3>
            <ul className="space-y-1 mb-4">
              <li><strong>Admin Console</strong>
                <ul>
                  <li>Updated admin interface with improved user management capabilities</li>
                  <li>Enhanced visualization of parent-child relationships</li>
                  <li>Added ability to manage linked accounts</li>
                </ul>
              </li>
            </ul>
            
            <h3 className="text-lg font-medium text-indigo-600 mb-2">Updated</h3>
            <ul className="space-y-1">
              <li>Firebase configuration and hosting cache</li>
              <li>Firestore security rules for better protection of user data</li>
              <li>Store implementation with improved authentication state management</li>
            </ul>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <Button 
            variant="primary" 
            onClick={onClose} 
            className="w-full sm:w-auto"
          >
            Got it!
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

const ChangelogBanner = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Check local storage to see if the banner was dismissed
  React.useEffect(() => {
    const dismissed = localStorage.getItem('changelog_1_1_dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);
  
  const handleDismiss = () => {
    localStorage.setItem('changelog_1_1_dismissed', 'true');
    setIsDismissed(true);
  };
  
  if (isDismissed) {
    return null;
  }
  
  return (
    <>
      <motion.div 
        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 shadow-md relative z-20"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center mb-2 sm:mb-0">
            <Info size={20} className="mr-2 flex-shrink-0" />
            <span className="font-medium">Kiddo Quest 1.1 is here! Check out what's new</span>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-1 rounded-full text-sm font-medium transition-colors"
            >
              See Changes
            </button>
            <button
              onClick={handleDismiss}
              className="text-white text-opacity-70 hover:text-opacity-100"
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </motion.div>
      
      <ChangelogModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default ChangelogBanner;
