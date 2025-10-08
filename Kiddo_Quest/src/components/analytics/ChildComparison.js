import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line
} from 'recharts';
import { calculateQuestMetrics, calculateXPMetrics } from '../../utils/analyticsEngine';

const ChildComparison = ({ 
  children = [],
  completions = [],
  timeRange = 'weekly',
  isLoading = false,
  className = '' 
}) => {
  const [comparisonData, setComparisonData] = useState([]);
  const [chartType, setChartType] = useState('bar'); // 'bar', 'radar', 'line'
  const [metric, setMetric] = useState('completions'); // 'completions', 'xp', 'streaks', 'all'
  const [selectedChildren, setSelectedChildren] = useState([]);

  // Color palette for children
  const COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Yellow
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#84cc16', // Lime
    '#ec4899', // Pink
    '#6b7280'  // Gray
  ];

  useEffect(() => {
    if (children.length === 0 || completions.length === 0) {
      setComparisonData([]);
      return;
    }

    // Initialize selected children if empty
    if (selectedChildren.length === 0) {
      setSelectedChildren(children.map(child => child.id));
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

    // Calculate metrics for each child
    const childrenData = children
      .filter(child => selectedChildren.includes(child.id))
      .map((child, index) => {
        const childCompletions = completions.filter(completion => 
          completion.childId === child.id
        );

        const questMetrics = calculateQuestMetrics(childCompletions, dateRange);
        const xpMetrics = calculateXPMetrics(
          childCompletions.map(c => ({
            ...c,
            xpGained: c.xpEarned || 100,
            timestamp: c.completedAt
          })),
          dateRange
        );

        return {
          name: child.name || child.displayName || `Child ${index + 1}`,
          id: child.id,
          color: COLORS[index % COLORS.length],
          completions: questMetrics.totalCompleted,
          xp: xpMetrics.totalXP,
          averagePerDay: questMetrics.averagePerDay,
          uniqueQuests: questMetrics.uniqueQuests,
          streaks: child.activeStreaks || 0,
          level: child.level || 1,
          completionRate: questMetrics.completionRate,
          // Radar chart metrics (normalized to 0-100 scale)
          consistency: Math.min(100, (questMetrics.averagePerDay / 2) * 100),
          diversity: Math.min(100, (questMetrics.uniqueQuests / 10) * 100),
          difficulty: Math.min(100, ((questMetrics.difficultyBreakdown?.hard || 0) / Math.max(1, questMetrics.totalCompleted)) * 200),
          engagement: Math.min(100, (questMetrics.completionRate / 100) * 100),
          growth: Math.min(100, (xpMetrics.averagePerDay / 200) * 100)
        };
      });

    setComparisonData(childrenData);
  }, [children, completions, timeRange, selectedChildren]);

  // Toggle child selection
  const toggleChild = (childId) => {
    setSelectedChildren(prev => 
      prev.includes(childId) 
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Get chart data based on selected metric
  const getChartData = () => {
    if (metric === 'all') {
      return comparisonData;
    }
    
    return comparisonData.map(child => ({
      name: child.name,
      [metric]: child[metric],
      color: child.color
    }));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg p-6 shadow-sm ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Empty state
  if (comparisonData.length === 0) {
    return (
      <div className={`bg-white rounded-lg p-6 shadow-sm ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Child Performance Comparison</h3>
        </div>
        
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <div className="w-16 h-16 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-lg font-medium">No comparison data</p>
          <p className="text-sm">Add children and track their activities to compare performance</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Child Performance Comparison</h3>
          <p className="text-sm text-gray-500 mt-1">
            Compare performance across children ({timeRange})
          </p>
        </div>
        
        <div className="flex space-x-2">
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="completions">Completions</option>
            <option value="xp">XP Earned</option>
            <option value="averagePerDay">Daily Average</option>
            <option value="uniqueQuests">Unique Quests</option>
            <option value="streaks">Active Streaks</option>
            <option value="all">All Metrics</option>
          </select>
          
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              chartType === 'bar' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Bar
          </button>
          <button
            onClick={() => setChartType('radar')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              chartType === 'radar' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Radar
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              chartType === 'line' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Line
          </button>
        </div>
      </div>

      {/* Child Selection */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Select Children to Compare</h4>
        <div className="flex flex-wrap gap-2">
          {children.map((child, index) => (
            <button
              key={child.id}
              onClick={() => toggleChild(child.id)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                selectedChildren.includes(child.id)
                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                  : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span>{child.name || child.displayName || `Child ${index + 1}`}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{comparisonData.length}</div>
          <div className="text-sm text-blue-800">Children Compared</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {comparisonData.reduce((sum, child) => sum + child.completions, 0)}
          </div>
          <div className="text-sm text-green-800">Total Completions</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {comparisonData.reduce((sum, child) => sum + child.xp, 0)}
          </div>
          <div className="text-sm text-purple-800">Total XP</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {comparisonData.length > 0 ? 
              (comparisonData.reduce((sum, child) => sum + child.averagePerDay, 0) / comparisonData.length).toFixed(1) 
              : 0}
          </div>
          <div className="text-sm text-orange-800">Avg Daily Completions</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={getChartData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {metric === 'all' ? (
                <>
                  <Bar dataKey="completions" fill="#3b82f6" name="Completions" />
                  <Bar dataKey="xp" fill="#10b981" name="XP" />
                  <Bar dataKey="streaks" fill="#f59e0b" name="Streaks" />
                </>
              ) : (
                <Bar dataKey={metric} fill="#3b82f6" name={metric.charAt(0).toUpperCase() + metric.slice(1)} />
              )}
            </BarChart>
          ) : chartType === 'radar' ? (
            <RadarChart data={comparisonData}>
              <PolarGrid />
              <PolarAngleAxis tick={{ fontSize: 10 }} />
              <PolarRadiusAxis tick={{ fontSize: 8 }} />
              {comparisonData.map((child, index) => (
                <Radar
                  key={child.id}
                  name={child.name}
                  dataKey={child.id}
                  stroke={child.color}
                  fill={child.color}
                  fillOpacity={0.1}
                  data={[
                    { subject: 'Consistency', [child.id]: child.consistency },
                    { subject: 'Diversity', [child.id]: child.diversity },
                    { subject: 'Difficulty', [child.id]: child.difficulty },
                    { subject: 'Engagement', [child.id]: child.engagement },
                    { subject: 'Growth', [child.id]: child.growth }
                  ]}
                />
              ))}
              <Tooltip />
              <Legend />
            </RadarChart>
          ) : (
            <LineChart data={getChartData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={metric} 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Performance Rankings */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Performance Rankings</h4>
        
        {/* Top Performers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Most Completions */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <h5 className="text-xs font-medium text-blue-800 mb-2">Most Completions</h5>
            {comparisonData
              .sort((a, b) => b.completions - a.completions)
              .slice(0, 3)
              .map((child, index) => (
                <div key={child.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: child.color }}
                    />
                    <span className="text-gray-700">{child.name}</span>
                  </div>
                  <span className="text-blue-600 font-medium">{child.completions}</span>
                </div>
              ))}
          </div>

          {/* Most XP */}
          <div className="p-3 bg-green-50 rounded-lg">
            <h5 className="text-xs font-medium text-green-800 mb-2">Most XP</h5>
            {comparisonData
              .sort((a, b) => b.xp - a.xp)
              .slice(0, 3)
              .map((child, index) => (
                <div key={child.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: child.color }}
                    />
                    <span className="text-gray-700">{child.name}</span>
                  </div>
                  <span className="text-green-600 font-medium">{child.xp}</span>
                </div>
              ))}
          </div>

          {/* Most Consistent */}
          <div className="p-3 bg-purple-50 rounded-lg">
            <h5 className="text-xs font-medium text-purple-800 mb-2">Most Consistent</h5>
            {comparisonData
              .sort((a, b) => b.averagePerDay - a.averagePerDay)
              .slice(0, 3)
              .map((child, index) => (
                <div key={child.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: child.color }}
                    />
                    <span className="text-gray-700">{child.name}</span>
                  </div>
                  <span className="text-purple-600 font-medium">{child.averagePerDay.toFixed(1)}/day</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildComparison;