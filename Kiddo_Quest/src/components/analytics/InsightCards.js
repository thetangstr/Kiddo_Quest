import React, { useState, useEffect } from 'react';
import { generateInsights, generateRecommendations, AnalyticsConfig } from '../../utils/analyticsEngine';

const InsightCards = ({ 
  familyData = {},
  timeRange = 'weekly',
  isLoading = false,
  className = '' 
}) => {
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [activeTab, setActiveTab] = useState('insights');
  const [filter, setFilter] = useState('all'); // 'all', 'high', 'achievement', 'warning'

  useEffect(() => {
    if (!familyData.completions || familyData.completions.length === 0) {
      setInsights([]);
      setRecommendations([]);
      return;
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case 'daily':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    const dateRange = { startDate, endDate };

    // Calculate metrics for current period
    const currentMetrics = {
      quests: {
        totalCompleted: familyData.completions?.length || 0,
        averagePerDay: (familyData.completions?.length || 0) / Math.max(1, (endDate - startDate) / (1000 * 60 * 60 * 24)),
        completionRate: 85, // Mock data
        difficultyBreakdown: familyData.completions?.reduce((acc, completion) => {
          const difficulty = completion.difficulty || 'easy';
          acc[difficulty] = (acc[difficulty] || 0) + 1;
          return acc;
        }, {}) || {}
      },
      xp: {
        totalXP: familyData.completions?.reduce((sum, c) => sum + (c.xpEarned || 100), 0) || 0,
        averagePerDay: (familyData.completions?.reduce((sum, c) => sum + (c.xpEarned || 100), 0) || 0) / Math.max(1, (endDate - startDate) / (1000 * 60 * 60 * 24)),
        xpSources: familyData.completions?.reduce((acc, completion) => {
          const source = completion.source || 'quest';
          acc[source] = (acc[source] || 0) + (completion.xpEarned || 100);
          return acc;
        }, {}) || {}
      },
      streaks: {
        activeStreaks: familyData.streaks?.filter(s => s.isActive)?.length || 0,
        longestStreak: Math.max(...(familyData.streaks?.map(s => s.longestStreak) || [0])),
        streakBreaks: familyData.streaks?.filter(s => !s.isActive && s.longestStreak > 0)?.length || 0
      }
    };

    // Generate insights and recommendations
    const generatedInsights = generateInsights(currentMetrics);
    const generatedRecommendations = generateRecommendations(currentMetrics, familyData.userProfile);

    setInsights(generatedInsights);
    setRecommendations(generatedRecommendations);
  }, [familyData, timeRange]);

  // Get insight icon based on type
  const getInsightIcon = (type) => {
    switch (type) {
      case AnalyticsConfig.ANALYTICS_CONFIG.INSIGHT_TYPES.ACHIEVEMENT:
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case AnalyticsConfig.ANALYTICS_CONFIG.INSIGHT_TYPES.WARNING:
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case AnalyticsConfig.ANALYTICS_CONFIG.INSIGHT_TYPES.CELEBRATION:
        return (
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      case AnalyticsConfig.ANALYTICS_CONFIG.INSIGHT_TYPES.RECOMMENDATION:
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case AnalyticsConfig.ANALYTICS_CONFIG.INSIGHT_TYPES.TREND:
        return (
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  // Get insight card styling based on type
  const getInsightCardStyle = (type) => {
    switch (type) {
      case AnalyticsConfig.ANALYTICS_CONFIG.INSIGHT_TYPES.ACHIEVEMENT:
        return 'border-l-4 border-green-500 bg-green-50';
      case AnalyticsConfig.ANALYTICS_CONFIG.INSIGHT_TYPES.WARNING:
        return 'border-l-4 border-red-500 bg-red-50';
      case AnalyticsConfig.ANALYTICS_CONFIG.INSIGHT_TYPES.CELEBRATION:
        return 'border-l-4 border-purple-500 bg-purple-50';
      case AnalyticsConfig.ANALYTICS_CONFIG.INSIGHT_TYPES.RECOMMENDATION:
        return 'border-l-4 border-blue-500 bg-blue-50';
      case AnalyticsConfig.ANALYTICS_CONFIG.INSIGHT_TYPES.TREND:
        return 'border-l-4 border-indigo-500 bg-indigo-50';
      default:
        return 'border-l-4 border-gray-500 bg-gray-50';
    }
  };

  // Get recommendation icon based on action type
  const getRecommendationIcon = (actionType) => {
    switch (actionType) {
      case 'increase_quest_frequency':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case 'increase_difficulty':
        return (
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'start_streak':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
    }
  };

  // Filter insights based on selected filter
  const filteredInsights = insights.filter(insight => {
    if (filter === 'all') return true;
    if (filter === 'high') return insight.priority <= 2;
    if (filter === 'achievement') return insight.type === AnalyticsConfig.ANALYTICS_CONFIG.INSIGHT_TYPES.ACHIEVEMENT;
    if (filter === 'warning') return insight.type === AnalyticsConfig.ANALYTICS_CONFIG.INSIGHT_TYPES.WARNING;
    return true;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg p-6 shadow-sm ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Analytics Insights</h3>
          <p className="text-sm text-gray-500 mt-1">
            AI-powered insights and recommendations ({timeRange})
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              activeTab === 'insights' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Insights ({insights.length})
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              activeTab === 'recommendations' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Recommendations ({recommendations.length})
          </button>
        </div>
      </div>

      {/* Filters for insights */}
      {activeTab === 'insights' && (
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded ${
              filter === 'all' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`px-3 py-1 text-sm rounded ${
              filter === 'high' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            High Priority
          </button>
          <button
            onClick={() => setFilter('achievement')}
            className={`px-3 py-1 text-sm rounded ${
              filter === 'achievement' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Achievements
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`px-3 py-1 text-sm rounded ${
              filter === 'warning' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Warnings
          </button>
        </div>
      )}

      {/* Content */}
      {activeTab === 'insights' ? (
        <div className="space-y-4">
          {filteredInsights.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-lg font-medium">No insights available</p>
              <p className="text-sm">Complete more activities to generate insights</p>
            </div>
          ) : (
            filteredInsights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${getInsightCardStyle(insight.type)} transition-all hover:shadow-md`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{insight.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        insight.priority <= 2 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {insight.priority <= 2 ? 'High' : 'Normal'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{insight.description}</p>
                    {insight.data && Object.keys(insight.data).length > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        {Object.entries(insight.data).map(([key, value]) => (
                          <span key={key} className="mr-4">
                            {key}: {typeof value === 'number' ? value.toFixed(1) : value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium">No recommendations</p>
              <p className="text-sm">You're doing great! Keep up the good work.</p>
            </div>
          ) : (
            recommendations.map((recommendation, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 transition-all hover:shadow-md"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getRecommendationIcon(recommendation.actionType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{recommendation.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        recommendation.priority === 'high' ? 'bg-red-100 text-red-800' :
                        recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {recommendation.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{recommendation.description}</p>
                    <div className="mt-2">
                      <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                        Take Action →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-600">
              {insights.filter(i => i.type === AnalyticsConfig.ANALYTICS_CONFIG.INSIGHT_TYPES.ACHIEVEMENT).length}
            </div>
            <div className="text-xs text-gray-600">Achievements</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">
              {insights.filter(i => i.type === AnalyticsConfig.ANALYTICS_CONFIG.INSIGHT_TYPES.WARNING).length}
            </div>
            <div className="text-xs text-gray-600">Warnings</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">{recommendations.length}</div>
            <div className="text-xs text-gray-600">Recommendations</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600">
              {insights.filter(i => i.priority <= 2).length}
            </div>
            <div className="text-xs text-gray-600">High Priority</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightCards;