import React, { useState, useEffect } from 'react';
import { PlusCircle, ArrowLeft, Edit3, Trash2, Image as ImageIcon } from 'lucide-react';
import useKiddoQuestStore from '../store';
import { 
  Button, 
  Card, 
  InputField, 
  TextareaField, 
  CheckboxGroupField, 
  LoadingSpinner,
  renderLucideIcon,
  IconPickerModal
} from '../components/UI';

// Manage Rewards Screen Component
export const ManageRewardsScreen = () => {
  const { 
    rewards, 
    childProfiles, 
    navigateTo, 
    setEditingReward, 
    deleteReward, 
    isLoadingData 
  } = useKiddoQuestStore();
  
  // Filter out claimed rewards
  const availableRewards = rewards.filter(reward => reward.status === 'available');
  
  const handleDeleteReward = (rewardId) => {
    if (window.confirm('Are you sure you want to delete this reward?')) {
      deleteReward(rewardId);
    }
  };
  
  if (isLoadingData) {
    return <LoadingSpinner message="Loading rewards..." />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Button 
        variant="link" 
        icon={ArrowLeft} 
        onClick={() => navigateTo('parentDashboard')}
        className="mb-6"
      >
        Back to Dashboard
      </Button>
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-indigo-600">Manage Rewards</h1>
        <Button 
          variant="primary" 
          icon={PlusCircle} 
          onClick={() => navigateTo('rewardForm')}
        >
          Create New Reward
        </Button>
      </div>
      
      {availableRewards.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-gray-500 mb-4">No rewards yet.</p>
          <Button 
            variant="primary" 
            icon={PlusCircle} 
            onClick={() => navigateTo('rewardForm')}
          >
            Create Your First Reward
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableRewards.map(reward => {
            // Find assigned children names
            const assignedChildren = childProfiles
              .filter(child => reward.assignedTo?.includes(child.id))
              .map(child => child.name);
            
            return (
              <Card key={reward.id} className="p-6">
                <div className="flex justify-between mb-4">
                  <div className="text-indigo-600">
                    {renderLucideIcon(reward.iconName || 'Gift', { size: 24 })}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingReward(reward.id)}
                      className="text-gray-500 hover:text-indigo-600"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteReward(reward.id)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mb-2">{reward.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                
                <div className="flex items-center mb-3">
                  <span className="text-sm font-medium text-indigo-600">
                    Cost: {reward.cost} XP
                  </span>
                </div>
                
                {reward.image && (
                  <div className="mb-3 rounded-md overflow-hidden">
                    <img 
                      src={reward.image} 
                      alt={reward.title} 
                      className="w-full h-24 object-cover"
                    />
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  Available to: {assignedChildren.length > 0 
                    ? assignedChildren.join(', ') 
                    : 'No one yet'}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Reward Form Screen Component
export const RewardFormScreen = () => {
  const { 
    rewards, 
    childProfiles, 
    editingRewardId, 
    addReward, 
    updateReward, 
    navigateTo, 
    isLoadingData
  } = useKiddoQuestStore();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cost: 50,
    assignedTo: [],
    iconName: 'Gift',
    image: null,
    imageFile: null,
  });
  
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  
  // Load reward data if editing
  useEffect(() => {
    if (editingRewardId) {
      const rewardToEdit = rewards.find(r => r.id === editingRewardId);
      if (rewardToEdit) {
        setFormData({
          title: rewardToEdit.title || '',
          description: rewardToEdit.description || '',
          cost: rewardToEdit.cost || 50,
          assignedTo: rewardToEdit.assignedTo || [],
          iconName: rewardToEdit.iconName || 'Gift',
          image: rewardToEdit.image || null,
          imageFile: null
        });
      }
    }
  }, [editingRewardId, rewards]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };
  
  const handleAssignedToChange = (selectedIds) => {
    setFormData(prev => ({ ...prev, assignedTo: selectedIds }));
  };
  
  const handleIconSelect = (iconName) => {
    setFormData(prev => ({ ...prev, iconName }));
    setIsIconPickerOpen(false);
  };

  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      setFormData(prev => ({ 
        ...prev, 
        image: URL.createObjectURL(file),
        imageFile: file
      }));
    }
  };
  
  const handleRemoveImage = () => {
    setFormData(prev => ({ 
      ...prev, 
      image: null,
      imageFile: null
    }));
  };
  
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    
    // Basic validation
    if (!formData.title.trim()) {
      setSubmitError('Reward title is required');
      return;
    }
    
    if (!formData.description.trim()) {
      setSubmitError('Reward description is required');
      return;
    }
    
    if (formData.cost < 1) {
      setSubmitError('XP cost must be at least 1');
      return;
    }
    
    try {
      console.log('🎁 Submitting reward form...', { editingRewardId, formData });
      
      if (editingRewardId) {
        const result = await updateReward(editingRewardId, formData);
        setSubmitSuccess('Reward updated successfully! 🎉');
        console.log('✅ Reward update result:', result);
      } else {
        const result = await addReward(formData);
        setSubmitSuccess('Reward created successfully! 🎉');
        console.log('✅ Reward creation result:', result);
      }
      
      // Navigate back after a short delay to show success message
      setTimeout(() => {
        navigateTo('manageRewards');
      }, 1500);
      
    } catch (error) {
      console.error('❌ Form submission error:', error);
      setSubmitError(error.message || 'An error occurred. Please try again.');
    }
  };
  
  if (isLoadingData) {
    return <LoadingSpinner message={editingRewardId ? "Updating reward..." : "Creating reward..."} />;
  }
  
  // Create options for child checkbox group
  const childOptions = childProfiles.map(child => ({
    value: child.id,
    label: child.name
  }));
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button 
        variant="link" 
        icon={ArrowLeft} 
        onClick={() => navigateTo('manageRewards')}
        className="mb-6"
      >
        Back to Rewards
      </Button>
      
      <Card className="p-6">
        <h1 className="text-2xl font-bold text-indigo-600 mb-6">
          {editingRewardId ? 'Edit Reward' : 'Create New Reward'}
        </h1>
        
        <form onSubmit={handleSubmit}>
          <InputField
            label="Reward Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Extra Screen Time"
            required
          />
          
          <TextareaField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the reward"
            required
          />
          
          <InputField
            label="XP Cost"
            name="cost"
            type="number"
            value={formData.cost}
            onChange={handleNumberChange}
            placeholder="50"
            required
          />
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Reward Icon
            </label>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-md flex items-center justify-center text-indigo-600">
                {renderLucideIcon(formData.iconName, { size: 24 })}
              </div>
              <Button 
                variant="outline" 
                type="button"
                onClick={() => setIsIconPickerOpen(true)}
              >
                Change Icon
              </Button>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Reward Image (Optional)
            </label>
            
            {formData.image ? (
              <div className="mb-3">
                <div className="relative rounded-md overflow-hidden">
                  <img 
                    src={formData.image} 
                    alt="Reward" 
                    className="w-full h-40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  icon={ImageIcon} 
                  type="button"
                  onClick={() => document.getElementById('reward-image').click()}
                >
                  Upload Image
                </Button>
                <input
                  id="reward-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            )}
          </div>
          
          <CheckboxGroupField
            label="Available To"
            name="assignedTo"
            options={childOptions}
            selectedOptions={formData.assignedTo}
            onChange={handleAssignedToChange}
          />
          
          {/* Error and Success Messages */}
          {submitError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              ❌ {submitError}
            </div>
          )}
          
          {submitSuccess && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg">
              ✅ {submitSuccess}
            </div>
          )}
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button 
              variant="outline" 
              type="button"
              onClick={() => navigateTo('manageRewards')}
              disabled={isLoadingData}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              icon={editingRewardId ? Edit3 : PlusCircle}
              disabled={isLoadingData}
            >
              {isLoadingData 
                ? (editingRewardId ? 'Updating...' : 'Creating...') 
                : (editingRewardId ? 'Update Reward' : 'Create Reward')
              }
            </Button>
          </div>
        </form>
      </Card>
      
      {/* Icon Picker Modal */}
      <IconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        onSelect={handleIconSelect}
      />
      
    </div>
  );
};
