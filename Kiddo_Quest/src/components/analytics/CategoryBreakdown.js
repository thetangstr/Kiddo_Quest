import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

const CategoryBreakdown = ({ 
  completions = [], 
  quests = [],
  timeRange = 'weekly',
  isLoading = false,
  className = '' 
}) => {
  const [chartData, setChartData] = useState([]);
  const [viewType, setViewType] = useState('pie'); // 'pie' or 'bar'
  const [sortBy, setSortBy] = useState('completions'); // 'completions' or 'percentage'

  // Color palette for categories
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
    '#6b7280', // Gray
    '#14b8a6', // Teal
    '#a855f7'  // Violet
  ];

  useEffect(() => {
    if (completions.length === 0) {
      setChartData([]);
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

    // Filter completions by date range
    const filteredCompletions = completions.filter(completion => {
      const completionDate = completion.completedAt?.toDate?.() || new Date(completion.completedAt);
      return completionDate >= startDate && completionDate <= endDate;
    });

    // Create quest lookup map
    const questMap = {};
    quests.forEach(quest => {
      questMap[quest.id] = quest;
    });

    // Group completions by category
    const categoryStats = {};
    let totalCompletions = 0;

    filteredCompletions.forEach(completion => {
      const quest = questMap[completion.questId];
      const category = quest?.category || completion.category || 'Uncategorized';
      
      if (!categoryStats[category]) {
        categoryStats[category] = {
          name: category,
          completions: 0,
          uniqueQuests: new Set(),
          totalXP: 0
        };
      }
      
      categoryStats[category].completions += 1;
      categoryStats[category].uniqueQuests.add(completion.questId);
      categoryStats[category].totalXP += completion.xpEarned || quest?.xpReward || 0;
      totalCompletions += 1;
    });

    // Convert to array and add percentages
    const chartDataArray = Object.values(categoryStats).map((category, index) => ({
      ...category,
      uniqueQuests: category.uniqueQuests.size,
      percentage: totalCompletions > 0 ? ((category.completions / totalCompletions) * 100).toFixed(1) : 0,
      color: COLORS[index % COLORS.length]
    }));

    // Sort data
    const sortedData = chartDataArray.sort((a, b) => {
      if (sortBy === 'completions') {
        return b.completions - a.completions;
      } else {
        return b.percentage - a.percentage;
      }
    });

    setChartData(sortedData);
  }, [completions, quests, timeRange, sortBy]);

  // Custom tooltip for pie chart
  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">Completions: {data.completions}</p>
          <p className="text-sm text-gray-600">Percentage: {data.percentage}%</p>
          <p className="text-sm text-gray-600">Unique Quests: {data.uniqueQuests}</p>
          <p className="text-sm text-gray-600">Total XP: {data.totalXP}</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for bar chart
  const BarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">Completions: {data.completions}</p>
          <p className="text-sm text-gray-600">Percentage: {data.percentage}%</p>
          <p className="text-sm text-gray-600">Total XP: {data.totalXP}</p>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const CustomLegend = ({ payload }) => {
    return (
      <div className="flex flex-wrap justify-center mt-4 gap-2">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center space-x-1 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-700">{entry.value}</span>
          </div>
        ))}
      </div>
    );
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
  if (chartData.length === 0) {
    return (
      <div className={`bg-white rounded-lg p-6 shadow-sm ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Category Breakdown</h3>
        </div>
        
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <div className="w-16 h-16 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <p className="text-lg font-medium">No category data</p>
          <p className="text-sm">Complete quests to see category breakdown</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Category Breakdown</h3>
          <p className="text-sm text-gray-500 mt-1">
            Quest completions by category ({timeRange})
          </p>
        </div>
        
        <div className="flex space-x-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="completions">Sort by Completions</option>
            <option value="percentage">Sort by Percentage</option>
          </select>
          
          <button
            onClick={() => setViewType('pie')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              viewType === 'pie' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pie
          </button>
          <button
            onClick={() => setViewType('bar')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              viewType === 'bar' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Bar
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{chartData.length}</div>
          <div className="text-sm text-blue-800">Categories</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {chartData.reduce((sum, cat) => sum + cat.completions, 0)}
          </div>
          <div className="text-sm text-green-800">Total Completions</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {chartData.reduce((sum, cat) => sum + cat.uniqueQuests, 0)}
          </div>
          <div className="text-sm text-purple-800">Unique Quests</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {chartData.reduce((sum, cat) => sum + cat.totalXP, 0)}
          </div>
          <div className="text-sm text-orange-800">Total XP</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {viewType === 'pie' ? (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="completions"
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                stroke="#666"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <Tooltip content={<BarTooltip />} />
              <Bar 
                dataKey="completions" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`bar-cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Top Categories List */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Top Categories</h4>
        <div className="space-y-2">
          {chartData.slice(0, 5).map((category, index) => (
            <div key={category.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-sm font-medium text-gray-900">{category.name}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{category.completions} completions</span>
                <span>{category.percentage}%</span>
                <span>{category.totalXP} XP</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryBreakdown;