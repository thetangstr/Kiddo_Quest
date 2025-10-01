import React, { useState, useEffect } from 'react';
import { PlusCircle, ArrowLeft, Edit3, Trash2, Repeat, Image as ImageIcon } from 'lucide-react';
import useKiddoQuestStore from '../store';
import { 
  Button, 
  Card, 
  InputField, 
  TextareaField, 
  SelectField, 
  CheckboxGroupField, 
  LoadingSpinner,
  renderLucideIcon,
  IconPickerModal
} from '../components/UI';

// Manage Quests Screen Component
export const ManageQuestsScreen = () => {
  const { 
    quests, 
    childProfiles, 
    navigateTo, 
    setEditingQuest, 
    deleteQuest, 
    isLoadingData 
  } = useKiddoQuestStore();
  
  // Filter out completed quests
  const activeQuests = quests.filter(quest => quest.status !== 'completed');
  
  const handleDeleteQuest = (questId) => {
    if (window.confirm('Are you sure you want to delete this quest?')) {
      deleteQuest(questId);
    }
  };
  
  if (isLoadingData) {
    return <LoadingSpinner message="Loading quests..." />;
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
        <h1 className="text-2xl font-bold text-indigo-600">Manage Quests</h1>
        <Button 
          variant="primary" 
          icon={PlusCircle} 
          onClick={() => navigateTo('questForm')}
          data-tutorial="create-quest"
        >
          Create New Quest
        </Button>
      </div>
      
      {activeQuests.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-gray-500 mb-4">No quests yet.</p>
          <Button 
            variant="primary" 
            icon={PlusCircle} 
            onClick={() => navigateTo('questForm')}
          >
            Create Your First Quest
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeQuests.map(quest => {
            // Find assigned children names
            const assignedChildren = childProfiles
              .filter(child => quest.assignedTo?.includes(child.id))
              .map(child => child.name);
            
            // Determine status badge
            let statusBadge;
            switch(quest.status) {
              case 'pending_verification':
                statusBadge = (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                    Pending Verification
                  </span>
                );
                break;
              case 'new':
              default:
                statusBadge = (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Available
                  </span>
                );
            }
            
            return (
              <Card key={quest.id} className="p-6">
                <div className="flex justify-between mb-4">
                  <div className="text-indigo-600">
                    {renderLucideIcon(quest.iconName || 'CheckCircle', { size: 24 })}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingQuest(quest.id)}
                      className="text-gray-500 hover:text-indigo-600"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteQuest(quest.id)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mb-2">{quest.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{quest.description}</p>
                
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-indigo-600 mr-2">
                    {quest.xp} XP
                  </span>
                  {quest.type === 'recurring' && (
                    <span className="flex items-center text-xs text-gray-500">
                      <Repeat size={14} className="mr-1" />
                      {quest.frequency}
                    </span>
                  )}
                </div>
                
                <div className="mb-3">
                  {statusBadge}
                </div>
                
                {quest.image && (
                  <div className="mb-3 rounded-md overflow-hidden">
                    <img 
                      src={quest.image} 
                      alt={quest.title} 
                      className="w-full h-24 object-cover"
                    />
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  Assigned to: {assignedChildren.length > 0 
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

// Quest Form Screen Component
export const QuestFormScreen = () => {
  const { 
    quests, 
    childProfiles, 
    editingQuestId, 
    addQuest, 
    updateQuest, 
    navigateTo, 
    isLoadingData
  } = useKiddoQuestStore();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    xp: 10,
    type: 'one-time',
    frequency: null,
    assignedTo: [],
    iconName: 'CheckCircle',
    image: null,
    imageFile: null
  });
  
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  
  // Load quest data if editing
  useEffect(() => {
    if (editingQuestId) {
      const questToEdit = quests.find(q => q.id === editingQuestId);
      if (questToEdit) {
        setFormData({
          title: questToEdit.title || '',
          description: questToEdit.description || '',
          xp: questToEdit.xp || 10,
          type: questToEdit.type || 'one-time',
          frequency: questToEdit.frequency || null,
          assignedTo: questToEdit.assignedTo || [],
          iconName: questToEdit.iconName || 'CheckCircle',
          image: questToEdit.image || null,
          imageFile: null
        });
      }
    }
  }, [editingQuestId, quests]);
  
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingQuestId) {
      await updateQuest(editingQuestId, formData);
    } else {
      await addQuest(formData);
    }
  };
  
  if (isLoadingData) {
    return <LoadingSpinner message={editingQuestId ? "Updating quest..." : "Creating quest..."} />;
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
        onClick={() => navigateTo('manageQuests')}
        className="mb-6"
      >
        Back to Quests
      </Button>
      
      <Card className="p-6">
        <h1 className="text-2xl font-bold text-indigo-600 mb-6">
          {editingQuestId ? 'Edit Quest' : 'Create New Quest'}
        </h1>
        
        <form onSubmit={handleSubmit} data-tutorial="quest-form">
          <InputField
            label="Quest Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Clean Your Room"
            required
          />
          
          <TextareaField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe what needs to be done"
            required
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <InputField
              label="XP Reward"
              name="xp"
              type="number"
              value={formData.xp}
              onChange={handleNumberChange}
              placeholder="10"
              required
            />
            
            <SelectField
              label="Quest Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="one-time">One-time</option>
              <option value="recurring">Recurring</option>
            </SelectField>
          </div>
          
          {formData.type === 'recurring' && (
            <SelectField
              label="Frequency"
              name="frequency"
              value={formData.frequency || ''}
              onChange={handleChange}
              required
            >
              <option value="">Select Frequency</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </SelectField>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Quest Icon
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
              Quest Image (Optional)
            </label>
            
            {formData.image ? (
              <div className="mb-3">
                <div className="relative rounded-md overflow-hidden">
                  <img 
                    src={formData.image} 
                    alt="Quest" 
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
                  onClick={() => document.getElementById('quest-image').click()}
                >
                  Upload Image
                </Button>
                <input
                  id="quest-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            )}
          </div>
          
          <CheckboxGroupField
            label="Assign To"
            name="assignedTo"
            options={childOptions}
            selectedOptions={formData.assignedTo}
            onChange={handleAssignedToChange}
          />
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button 
              variant="outline" 
              type="button"
              onClick={() => navigateTo('manageQuests')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              icon={editingQuestId ? Edit3 : PlusCircle}
            >
              {editingQuestId ? 'Update Quest' : 'Create Quest'}
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
