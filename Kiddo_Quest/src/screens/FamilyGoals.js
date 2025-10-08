import React, { useState, useEffect } from 'react';
import useKiddoQuestStore from '../store';
import { 
  FamilyGoal, 
  createFamilyGoal, 
  getActiveFamilyGoals, 
  getFamilyGoalStats,
  formatFamilyGoalProgress,
  getSuggestedFamilyGoals,
  FamilyGoalConfig 
} from '../utils/familyGoalTracker';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const FamilyGoals = () => {
  const { 
    currentUser, 
    childProfiles, 
    navigateTo,
    isLoadingData 
  } = useKiddoQuestStore();

  const [familyGoals, setFamilyGoals] = useState([]);
  const [activeGoals, setActiveGoals] = useState([]);
  const [goalStats, setGoalStats] = useState({});
  const [suggestedGoals, setSuggestedGoals] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Form state for creating/editing goals
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'collective',
    metric: 'quest_count',
    target: 10,
    difficulty: 'medium',
    participants: [],
    rewards: [],
    endDate: '',
    milestones: []
  });

  // Real-time listener for family goals
  useEffect(() => {
    if (!currentUser?.uid) return;

    setLoading(true);
    const goalsQuery = query(
      collection(db, 'familyGoals'),
      where('familyId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(goalsQuery, (snapshot) => {
      const goals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).map(data => FamilyGoal.fromFirestore(data));

      setFamilyGoals(goals);
      setActiveGoals(getActiveFamilyGoals(goals));
      setGoalStats(getFamilyGoalStats(goals, currentUser.uid));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Generate suggested goals when child profiles change
  useEffect(() => {
    if (childProfiles.length > 0 && goalStats.total !== undefined) {
      const familyStats = {
        averageQuestsPerDay: goalStats.averageDuration || 1.5,
        totalXP: childProfiles.reduce((sum, child) => sum + (child.xp || 0), 0)
      };
      const participants = [currentUser.uid, ...childProfiles.map(child => child.id)];
      const suggestions = getSuggestedFamilyGoals(familyStats, participants);
      setSuggestedGoals(suggestions);
    }
  }, [childProfiles, goalStats, currentUser?.uid]);

  const handleCreateGoal = async (goalData) => {
    try {
      setLoading(true);
      const participants = [currentUser.uid, ...goalData.participants];
      
      const newGoal = createFamilyGoal({
        ...goalData,
        familyId: currentUser.uid,
        participants
      }, currentUser.uid);

      const goalRef = await addDoc(collection(db, 'familyGoals'), newGoal.toFirestore());
      
      // Start the goal if it should be active immediately
      if (goalData.startImmediately) {
        const startedGoal = newGoal.start();
        await updateDoc(doc(db, 'familyGoals', goalRef.id), startedGoal.toFirestore());
      }

      setShowCreateForm(false);
      resetForm();
    } catch (error) {
      console.error('Error creating family goal:', error);
      alert('Failed to create family goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartGoal = async (goalId) => {
    try {
      const goal = familyGoals.find(g => g.id === goalId);
      if (!goal) return;

      const startedGoal = goal.start();
      await updateDoc(doc(db, 'familyGoals', goalId), startedGoal.toFirestore());
    } catch (error) {
      console.error('Error starting goal:', error);
      alert('Failed to start goal. Please try again.');
    }
  };

  const handleCompleteGoal = async (goalId) => {
    try {
      const goal = familyGoals.find(g => g.id === goalId);
      if (!goal) return;

      const completedGoal = goal.complete();
      await updateDoc(doc(db, 'familyGoals', goalId), completedGoal.toFirestore());
    } catch (error) {
      console.error('Error completing goal:', error);
      alert('Failed to complete goal. Please try again.');
    }
  };

  const handleCancelGoal = async (goalId, reason = '') => {
    try {
      const goal = familyGoals.find(g => g.id === goalId);
      if (!goal) return;

      const cancelledGoal = goal.cancel(reason, currentUser.uid);
      await updateDoc(doc(db, 'familyGoals', goalId), cancelledGoal.toFirestore());
    } catch (error) {
      console.error('Error cancelling goal:', error);
      alert('Failed to cancel goal. Please try again.');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'familyGoals', goalId));
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Failed to delete goal. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'collective',
      metric: 'quest_count',
      target: 10,
      difficulty: 'medium',
      participants: [],
      rewards: [],
      endDate: '',
      milestones: []
    });
  };

  const applyTemplate = (template) => {
    setFormData({
      ...formData,
      ...template,
      participants: childProfiles.map(child => child.id)
    });
    setShowTemplates(false);
    setShowCreateForm(true);
  };

  const filteredGoals = familyGoals.filter(goal => {
    switch (filter) {
      case 'active':
        return goal.status === 'active';
      case 'completed':
        return goal.status === 'completed';
      case 'draft':
        return goal.status === 'draft';
      default:
        return true;
    }
  });

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: '#4CAF50',
      medium: '#FF9800',
      hard: '#F44336',
      epic: '#9C27B0'
    };
    return colors[difficulty] || colors.medium;
  };

  const getTypeIcon = (type) => {
    const icons = {
      collective: '🤝',
      individual: '👤',
      competitive: '🏆',
      cooperative: '⚡'
    };
    return icons[type] || '🎯';
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: '#9E9E9E',
      active: '#4CAF50',
      paused: '#FF9800',
      completed: '#2196F3',
      cancelled: '#F44336',
      expired: '#795548'
    };
    return colors[status] || colors.draft;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Loading family goals...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Family Goals</h1>
              <p className="text-gray-600">Work together to achieve shared objectives</p>
            </div>
            <button
              onClick={() => navigateTo('parentDashboard')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{goalStats.active || 0}</div>
              <div className="text-sm text-blue-500">Active Goals</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{goalStats.completed || 0}</div>
              <div className="text-sm text-green-500">Completed</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{Math.round(goalStats.completionRate || 0)}%</div>
              <div className="text-sm text-orange-500">Success Rate</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{Math.round(goalStats.averageDuration || 0)}</div>
              <div className="text-sm text-purple-500">Avg Duration (days)</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              + Create New Goal
            </button>
            <button
              onClick={() => setShowTemplates(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              📋 Use Template
            </button>
            <div className="flex border rounded-lg overflow-hidden">
              {['all', 'active', 'completed', 'draft'].map(filterType => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    filter === filterType
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Goals Quick View */}
        {activeGoals.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🎯 Active Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeGoals.slice(0, 3).map(goal => (
                <div key={goal.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{getTypeIcon(goal.type)}</span>
                    <span 
                      className="px-2 py-1 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: getDifficultyColor(goal.difficulty) }}
                    >
                      {goal.difficulty}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">{goal.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{formatFamilyGoalProgress(goal)}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, goal.progress?.percentage || 0)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round(goal.progress?.percentage || 0)}% complete
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Goals */}
        {suggestedGoals.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">💡 Suggested Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestedGoals.map((suggestion, index) => (
                <div key={index} className="border border-dashed border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{getTypeIcon(suggestion.type)}</span>
                    <button
                      onClick={() => applyTemplate(suggestion)}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      Use Template
                    </button>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">{suggestion.title}</h3>
                  <p className="text-sm text-gray-600">{suggestion.description}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    Target: {suggestion.target} • {suggestion.difficulty} difficulty
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goals List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">All Family Goals</h2>
          
          {filteredGoals.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No goals found</h3>
              <p className="text-gray-500 mb-6">Create your first family goal to start working together!</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Create Your First Goal
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGoals.map(goal => (
                <div key={goal.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{getTypeIcon(goal.type)}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{goal.title}</h3>
                        <p className="text-gray-600">{goal.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span 
                        className="px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: getStatusColor(goal.status) }}
                      >
                        {goal.status}
                      </span>
                      <span 
                        className="px-2 py-1 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: getDifficultyColor(goal.difficulty) }}
                      >
                        {goal.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{formatFamilyGoalProgress(goal)}</span>
                      <span>{Math.round(goal.progress?.percentage || 0)}% complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, goal.progress?.percentage || 0)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Goal Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      <span className="font-medium">Type:</span> {goal.type}
                    </div>
                    <div>
                      <span className="font-medium">Metric:</span> {goal.metric.replace('_', ' ')}
                    </div>
                    <div>
                      <span className="font-medium">Target:</span> {goal.target}
                    </div>
                    <div>
                      <span className="font-medium">Participants:</span> {goal.participants.length}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {goal.status === 'draft' && (
                      <button
                        onClick={() => handleStartGoal(goal.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                      >
                        Start Goal
                      </button>
                    )}
                    {goal.status === 'active' && (
                      <>
                        <button
                          onClick={() => setSelectedGoal(goal)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleCompleteGoal(goal.id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                        >
                          Mark Complete
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleCancelGoal(goal.id, 'Cancelled by user')}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                      disabled={goal.status === 'completed' || goal.status === 'cancelled'}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Goal Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Create Family Goal</h2>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      resetForm();
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateGoal(formData);
                  }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Goal Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter goal title..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows="3"
                      placeholder="Describe the goal..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Goal Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="collective">Collective (work together)</option>
                        <option value="individual">Individual (everyone achieves)</option>
                        <option value="competitive">Competitive (compete)</option>
                        <option value="cooperative">Cooperative (phases)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Metric
                      </label>
                      <select
                        value={formData.metric}
                        onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="quest_count">Quest Count</option>
                        <option value="xp_total">XP Total</option>
                        <option value="streak_days">Streak Days</option>
                        <option value="badges_earned">Badges Earned</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target
                      </label>
                      <input
                        type="number"
                        value={formData.target}
                        onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        min="1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Difficulty
                      </label>
                      <select
                        value={formData.difficulty}
                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                        <option value="epic">Epic</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Participants
                    </label>
                    <div className="space-y-2">
                      {childProfiles.map(child => (
                        <label key={child.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.participants.includes(child.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  participants: [...formData.participants, child.id]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  participants: formData.participants.filter(p => p !== child.id)
                                });
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">{child.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date (optional)
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        resetForm();
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Create Goal'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Goal Templates Modal */}
        {showTemplates && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Goal Templates</h2>
                  <button
                    onClick={() => setShowTemplates(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestedGoals.map((template, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{getTypeIcon(template.type)}</span>
                        <span 
                          className="px-2 py-1 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: getDifficultyColor(template.difficulty) }}
                        >
                          {template.difficulty}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-2">{template.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                      <div className="text-xs text-gray-500 mb-4">
                        Type: {template.type} • Target: {template.target}
                      </div>
                      <button
                        onClick={() => applyTemplate(template)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-medium transition-colors"
                      >
                        Use Template
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Goal Details Modal */}
        {selectedGoal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Goal Details</h2>
                  <button
                    onClick={() => setSelectedGoal(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <span className="text-4xl">{getTypeIcon(selectedGoal.type)}</span>
                    <div>
                      <h3 className="text-xl font-semibold">{selectedGoal.title}</h3>
                      <p className="text-gray-600">{selectedGoal.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-medium">Status:</span> {selectedGoal.status}
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-medium">Type:</span> {selectedGoal.type}
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-medium">Difficulty:</span> {selectedGoal.difficulty}
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-medium">Target:</span> {selectedGoal.target}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Progress</h4>
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, selectedGoal.progress?.percentage || 0)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">{formatFamilyGoalProgress(selectedGoal)}</p>
                  </div>

                  {selectedGoal.progress?.contributions && (
                    <div>
                      <h4 className="font-semibold mb-2">Contributions</h4>
                      <div className="space-y-2">
                        {Object.entries(selectedGoal.progress.contributions).map(([userId, contribution]) => {
                          const child = childProfiles.find(c => c.id === userId);
                          const name = child ? child.name : (userId === currentUser.uid ? 'You' : 'Unknown');
                          return (
                            <div key={userId} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                              <span>{name}</span>
                              <span className="font-medium">{contribution}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setSelectedGoal(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    {selectedGoal.status === 'active' && (
                      <button
                        onClick={() => {
                          handleCompleteGoal(selectedGoal.id);
                          setSelectedGoal(null);
                        }}
                        className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyGoals;