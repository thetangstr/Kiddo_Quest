import React, { useState, useEffect } from 'react';
import { UserCog, ArrowLeft, Camera, Trash2, Save, Palette } from 'lucide-react';
import useKiddoQuestStore from '../store';
import { Button, InputField, Card, LoadingSpinner, AccessibilityOptions } from '../components/UI';
import { getAllThemes, THEME_CONFIGS, THEMES } from '../utils/themeManager';

// Edit Child Profile Screen Component
export const EditChildProfileScreen = () => {
  const { 
    childProfiles, 
    selectedChildId,
    updateChildProfile, 
    deleteChildProfile,
    navigateTo, 
    isLoadingData 
  } = useKiddoQuestStore();
  
  const [formData, setFormData] = useState({
    name: '',
    avatar: '',
    avatarFile: null,
    theme: THEMES.DEFAULT
  });
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Load child data
  useEffect(() => {
    if (selectedChildId) {
      const childToEdit = childProfiles.find(child => child.id === selectedChildId);
      if (childToEdit) {
        setFormData({
          name: childToEdit.name || '',
          avatar: childToEdit.avatar || '👦',
          avatarFile: null,
          theme: childToEdit.theme || THEMES.DEFAULT
        });
      }
    }
  }, [selectedChildId, childProfiles]);
  
  const avatarOptions = ['👦', '👧', '👶', '🧒', '👼', '🦸‍♂️', '🦸‍♀️', '🧚', '🦊', '🐱', '🐶', '🐼', '🐯', '🦁', '🐨', '🐵'];
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name.trim()) {
      setError('Please enter a name for the child.');
      return;
    }
    
    try {
      await updateChildProfile(selectedChildId, formData);
      navigateTo('parentDashboard');
    } catch (error) {
      setError(error.message || 'Failed to update child profile. Please try again.');
    }
  };
  
  const handleDeleteProfile = async () => {
    try {
      await deleteChildProfile(selectedChildId);
      navigateTo('parentDashboard');
    } catch (error) {
      setError(error.message || 'Failed to delete child profile. Please try again.');
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        avatarFile: file,
        avatar: URL.createObjectURL(file)
      }));
    }
  };
  
  const handleAvatarSelect = (avatar) => {
    setFormData(prev => ({
      ...prev,
      avatar,
      avatarFile: null
    }));
  };
  
  if (isLoadingData) {
    return <LoadingSpinner message="Loading child profile..." />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button 
        variant="link" 
        icon={ArrowLeft} 
        onClick={() => navigateTo('parentDashboard')}
        className="mb-6"
      >
        Back to Dashboard
      </Button>
      
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-indigo-600 flex items-center">
            <UserCog className="mr-2" /> Edit Child Profile
          </h1>
          {selectedChildId && (
            <AccessibilityOptions 
              childId={selectedChildId}
              themeId={formData.theme}
              onUpdate={(settings) => console.log('Accessibility settings updated:', settings)}
            />
          )}
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <InputField
            label="Child's Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter child's name"
            required
          />
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Avatar
            </label>
            
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-3xl overflow-hidden">
                {typeof formData.avatar === 'string' && formData.avatar.startsWith('http') ? (
                  <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{formData.avatar}</span>
                )}
              </div>
              
              <div>
                <Button 
                  variant="outline" 
                  icon={Camera} 
                  type="button"
                  onClick={() => document.getElementById('avatar-upload').click()}
                  className="mb-2"
                >
                  Upload Photo
                </Button>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2 mb-4">
              {avatarOptions.map(avatar => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => handleAvatarSelect(avatar)}
                  className={`text-2xl p-2 rounded-md hover:bg-indigo-100 ${
                    formData.avatar === avatar ? 'bg-indigo-100 border border-indigo-300' : ''
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>
          
          {/* Theme Selection */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2 flex items-center">
              <Palette className="h-4 w-4 mr-1" /> Theme Customization
            </label>
            <p className="text-sm text-gray-600 mb-2">Pick a fun theme for your child's dashboard!</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {getAllThemes().map(theme => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, theme: theme.id }))}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all
                    ${formData.theme === theme.id 
                    ? `ring-2 ring-offset-2 ring-${THEME_CONFIGS[theme.id].colors.primary} shadow-md` 
                    : 'hover:bg-gray-50 border border-gray-200'}`}
                >
                  <div className={`text-3xl mb-2 ${theme.id === THEMES.DEFAULT ? '' : 'animate-pulse'}`}>
                    {theme.icon}
                  </div>
                  <div className="text-sm font-medium">{theme.name}</div>
                  <div 
                    className={`w-full h-2 rounded-full mt-2 bg-gradient-to-r from-${theme.colors.primary} via-${theme.colors.secondary} to-${theme.colors.accent}`}
                  />
                </button>
              ))}
            </div>
            
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-medium text-sm mb-1 flex items-center">
                <span className="text-lg mr-2">{THEME_CONFIGS[formData.theme].icon}</span> 
                {THEME_CONFIGS[formData.theme].name}
              </h4>
              <p className="text-xs text-gray-600">
                {THEME_CONFIGS[formData.theme].description}
              </p>
            </div>
          </div>
          
          <div className="flex justify-between mt-6">
            <div>
              {!showDeleteConfirm ? (
                <Button 
                  variant="danger" 
                  type="button"
                  icon={Trash2}
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Profile
                </Button>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-red-600 text-sm">Are you sure?</span>
                  <Button 
                    variant="danger" 
                    type="button"
                    onClick={handleDeleteProfile}
                    className="text-sm px-2 py-1"
                  >
                    Yes, Delete
                  </Button>
                  <Button 
                    variant="outline" 
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-sm px-2 py-1"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            
            <Button 
              type="submit" 
              variant="primary" 
              icon={Save}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
