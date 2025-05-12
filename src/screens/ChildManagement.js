import React, { useState, useEffect } from 'react';
import { UserPlus, ArrowLeft, Camera, Smile } from 'lucide-react';
import useKiddoQuestStore from '../store';
import { Button, InputField, Card, LoadingSpinner } from '../components/UI';

// Add Child Screen Component
export const AddChildScreen = () => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('👦');
  const [avatarFile, setAvatarFile] = useState(null);
  const [error, setError] = useState('');
  
  const { addChildProfile, navigateTo, isLoadingData } = useKiddoQuestStore();
  
  const avatarOptions = ['👦', '👧', '👶', '🧒', '👼', '🦸‍♂️', '🦸‍♀️', '🧚', '🦊', '🐱', '🐶', '🐼', '🐯', '🦁', '🐨', '🐵'];
  
  // Check if we're in tutorial mode when component mounts
  useEffect(() => {
    // Set tutorial mode flag if this is part of the tutorial flow
    const isTutorial = window.location.hash.includes('tutorial') || 
                      document.querySelector('[data-tutorial="child-form"]') !== null;
    
    if (isTutorial) {
      localStorage.setItem('kiddoquest_in_tutorial', 'true');
    }
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Please enter a name for the child.');
      return;
    }
    
    try {
      // Set tutorial mode flag
      localStorage.setItem('kiddoquest_in_tutorial', 'true');
      
      const newChildProfile = await addChildProfile({ 
        name, 
        avatar: avatarFile ? URL.createObjectURL(avatarFile) : avatar,
        avatarFile,
        xp: 0 
      });
      
      // Store the newly created child ID in localStorage for highlighting
      if (newChildProfile && newChildProfile.id) {
        localStorage.setItem('kiddoquest_last_added_child', newChildProfile.id);
        localStorage.setItem('kiddoquest_last_added_child_name', name);
        localStorage.setItem('kiddoquest_highlight_child', newChildProfile.id);
        localStorage.setItem('kiddoquest_highlight_timestamp', Date.now().toString());
        
        // Navigate back to parent dashboard
        console.log('Child created, navigating back to parent dashboard');
        
        // Give a clear visual indication that the action was successful
        setError('');
        
        setTimeout(() => {
          navigateTo('parentDashboard');
        }, 800); // Slightly longer delay for better UX
      }
    } catch (error) {
      setError(error.message || 'Failed to add child profile. Please try again.');
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      setAvatarFile(file);
      setAvatar(URL.createObjectURL(file));
    }
  };
  
  if (isLoadingData) {
    return <LoadingSpinner message="Adding child profile..." />;
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
        <h1 className="text-2xl font-bold text-indigo-600 mb-6 flex items-center">
          <UserPlus className="mr-2" /> Add Child Profile
        </h1>
        
        <form onSubmit={handleSubmit} data-tutorial="child-form">
          <InputField
            label="Child's Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter child's name"
            required
          />
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Avatar
            </label>
            
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-3xl overflow-hidden">
                {avatarFile ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{avatar}</span>
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
                <p className="text-xs text-gray-500">Or select an emoji below</p>
              </div>
            </div>
            
            <div className="grid grid-cols-8 gap-2">
              {avatarOptions.map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setAvatar(emoji);
                    setAvatarFile(null);
                  }}
                  className={`w-10 h-10 text-xl flex items-center justify-center rounded-full hover:bg-indigo-100 ${
                    avatar === emoji && !avatarFile ? 'bg-indigo-200' : 'bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm mb-4">{error}</div>
          )}
          
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              type="button"
              onClick={() => navigateTo('parentDashboard')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              icon={UserPlus}
            >
              Add Child
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// Child Selection Screen Component
export const ChildSelectionScreen = () => {
  const { childProfiles, selectChildForDashboard, navigateTo, isLoadingData } = useKiddoQuestStore();
  
  if (isLoadingData) {
    return <LoadingSpinner message="Loading child profiles..." />;
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
        <h1 className="text-2xl font-bold text-indigo-600 mb-6 flex items-center">
          <Smile className="mr-2" /> Select Child
        </h1>
        
        {childProfiles.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No child profiles yet.</p>
            <Button 
              variant="primary" 
              icon={UserPlus} 
              onClick={() => navigateTo('addChild')}
            >
              Add Your First Child
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {childProfiles.map(child => (
              <button
                key={child.id}
                onClick={() => selectChildForDashboard(child.id)}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all flex items-center"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl mr-4">
                  {typeof child.avatar === 'string' && child.avatar.startsWith('http') 
                    ? <img src={child.avatar} alt={child.name} className="w-12 h-12 rounded-full object-cover" />
                    : child.avatar || '👶'}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-medium">{child.name}</h3>
                  <p className="text-indigo-600 font-medium">{child.xp || 0} XP</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
