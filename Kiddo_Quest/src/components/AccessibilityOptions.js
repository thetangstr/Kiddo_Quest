import React, { useState, useEffect } from 'react';
import { Switch, EyeIcon, ZapIcon, TypeIcon, SettingsIcon } from 'lucide-react';
import { getThemeById, getThemeAccessibilityOptions, setChildTheme } from '../utils/themeManager';
import { Button, Modal } from './UI';
import useKiddoQuestStore from '../store';

/**
 * AccessibilityOptions component
 * Provides controls for accessibility settings like high contrast, reduced motion, and text size
 * @param {object} props - Component props
 * @param {string} props.childId - ID of the child profile
 * @param {string} props.themeId - Current theme ID
 * @param {function} props.onUpdate - Callback when settings are updated
 */
export const AccessibilityOptions = ({ childId, themeId, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    highContrast: false,
    reducedMotion: false,
    largeText: false,
  });
  const [dirty, setDirty] = useState(false);
  const { childProfiles, updateChildProfile } = useKiddoQuestStore(state => ({ 
    childProfiles: state.childProfiles,
    updateChildProfile: state.updateChildProfile
  }));

  // Get current child profile
  const childProfile = childProfiles.find(child => child.id === childId);
  
  // Load initial accessibility settings from theme and child profile
  useEffect(() => {
    if (themeId) {
      const theme = getThemeById(themeId);
      const accessOptions = getThemeAccessibilityOptions(themeId);
      
      if (theme && accessOptions) {
        // Get child's custom accessibility settings or use theme defaults
        setSettings({
          highContrast: childProfile?.accessibility?.highContrast ?? accessOptions.highContrast,
          reducedMotion: childProfile?.accessibility?.reducedMotion ?? accessOptions.reducedMotion,
          largeText: childProfile?.accessibility?.largeText ?? accessOptions.largeText,
        });
      }
    }
  }, [themeId, childId, childProfile]);

  // Handle setting changes
  const handleChange = (setting, value) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    setDirty(true);
  };

  // Save settings
  const handleSave = async () => {
    if (childId && dirty) {
      try {
        // Update child profile with new accessibility settings
        await updateChildProfile(childId, {
          accessibility: settings
        });
        
        // Notify parent component
        if (onUpdate) {
          onUpdate(settings);
        }
        
        // Close modal
        setIsOpen(false);
        setDirty(false);
      } catch (error) {
        console.error('Error saving accessibility settings:', error);
      }
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 text-sm"
        variant="outline"
        icon={SettingsIcon}
      >
        Accessibility
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Accessibility Settings"
      >
        <div className="space-y-6 py-2">
          <p className="text-sm text-gray-500 mb-4">
            Customize the display settings to make the app more accessible. These settings will be applied when {childProfile?.name} uses the app.
          </p>
          
          {/* High Contrast Setting */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <EyeIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-medium">High Contrast Mode</h3>
                <p className="text-sm text-gray-500">Increases visibility with stronger contrasting colors</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={settings.highContrast}
                onChange={(e) => handleChange('highContrast', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Reduced Motion Setting */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <ZapIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-base font-medium">Reduced Motion</h3>
                <p className="text-sm text-gray-500">Decreases animations for less visual distractions</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={settings.reducedMotion}
                onChange={(e) => handleChange('reducedMotion', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Large Text Setting */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <TypeIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-base font-medium">Larger Text</h3>
                <p className="text-sm text-gray-500">Increases text size for better readability</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={settings.largeText}
                onChange={(e) => handleChange('largeText', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {/* Preview Section */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium mb-2">Preview</h3>
            <div 
              className={`p-4 rounded-lg ${
                settings.highContrast ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'
              } ${
                settings.largeText ? 'text-lg' : 'text-base'
              }`}
            >
              <p className="mb-2">This is how text will appear.</p>
              <button 
                className={`px-4 py-2 rounded-lg ${
                  settings.highContrast ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                } ${
                  settings.largeText ? 'text-lg' : 'text-base'
                } ${
                  settings.reducedMotion ? '' : 'transition-transform hover:scale-105'
                }`}
              >
                Example Button
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </Modal>
    </>
  );
};
