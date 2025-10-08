import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Users, Award, ArrowLeft, Download, Filter, BarChart3 } from 'lucide-react';
import useKiddoQuestStore from '../store';
import { Button, Card, LoadingSpinner } from '../components/UI';
import { 
  CompletionChart, 
  CategoryBreakdown, 
  TimeHeatmap, 
  InsightCards, 
  ChildComparison 
} from '../components/analytics';
import { AnalyticsReport, generateAnalyticsReport } from '../utils/analyticsEngine';

const ParentAnalytics = ({ onViewChange }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('weekly');
  const [selectedChildren, setSelectedChildren] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const { 
    childProfiles, 
    quests,
    questCompletions,
    navigateTo,
    isLoadingData 
  } = useKiddoQuestStore();
  
  // Initialize selected children to all children
  useEffect(() => {
    if (childProfiles.length > 0 && selectedChildren.length === 0) {
      setSelectedChildren(childProfiles.map(child => child.id));
    }
  }, [childProfiles, selectedChildren.length]);
  
  // Generate analytics report when data changes
  useEffect(() => {
    if (childProfiles.length > 0 && questCompletions.length > 0) {
      generateReport();
    }
  }, [selectedTimeRange, selectedChildren, childProfiles, questCompletions]);
  
  const generateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const report = await generateAnalyticsReport({
        childProfiles: childProfiles.filter(child => selectedChildren.includes(child.id)),
        quests,
        questCompletions,
        timeRange: selectedTimeRange
      });
      setAnalyticsData(report);
    } catch (error) {
      console.error('Error generating analytics report:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };
  
  const handleChildToggle = (childId) => {
    setSelectedChildren(prev => 
      prev.includes(childId) 
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  };
  
  const handleExportReport = () => {
    if (!analyticsData) return;
    
    // Create CSV data
    const csvData = [
      ['Metric', 'Value'],
      ['Completion Rate', `${analyticsData.metrics.completionRate}%`],
      ['Total Quests', analyticsData.metrics.totalQuests],
      ['Completed Quests', analyticsData.metrics.completedQuests],
      ['Total XP Earned', analyticsData.metrics.totalXPEarned],
      ['Engagement Score', analyticsData.metrics.trends.engagementScore]
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `family-analytics-${selectedTimeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  const timeRangeOptions = [
    { value: 'daily', label: 'Daily', icon: Calendar },
    { value: 'weekly', label: 'Weekly', icon: Calendar },
    { value: 'monthly', label: 'Monthly', icon: Calendar },
    { value: 'quarterly', label: 'Quarterly', icon: TrendingUp }
  ];
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'completion', label: 'Completion', icon: Award },
    { id: 'comparison', label: 'Comparison', icon: Users },
    { id: 'insights', label: 'Insights', icon: TrendingUp }
  ];
  
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            icon={ArrowLeft} 
            onClick={() => navigateTo('parentDashboard')}
            className="mr-3 bg-white shadow-sm hover:shadow-md"
          />
          <h1 className="text-3xl font-bold text-gray-900">Family Analytics</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            icon={Download}
            onClick={handleExportReport}
            disabled={!analyticsData}
          >
            Export Report
          </Button>
          <Button
            variant="primary"
            icon={TrendingUp}
            onClick={generateReport}
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? 'Generating...' : 'Refresh Data'}
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Time Range Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Time Range:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {timeRangeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setSelectedTimeRange(option.value)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    selectedTimeRange === option.value
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Children Filter */}
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Children:</span>
            <div className="flex gap-2">
              {childProfiles.map(child => (
                <button
                  key={child.id}
                  onClick={() => handleChildToggle(child.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedChildren.includes(child.id)
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {child.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Tab Navigation */}
      <div className="flex bg-white rounded-lg p-1 mb-6 shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      {isGeneratingReport ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="large" />
          <span className="ml-3 text-lg text-gray-600">Generating analytics report...</span>
        </div>
      ) : !analyticsData ? (
        <Card className="p-12 text-center">
          <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Data Available</h3>
          <p className="text-gray-500 mb-4">Start completing quests to see analytics.</p>
          <Button onClick={generateReport}>Generate Report</Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Completion Rate</p>
                      <p className="text-2xl font-bold text-green-600">{analyticsData.metrics.completionRate}%</p>
                    </div>
                    <Award className="text-green-500" size={24} />
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Quests</p>
                      <p className="text-2xl font-bold text-blue-600">{analyticsData.metrics.totalQuests}</p>
                    </div>
                    <BarChart3 className="text-blue-500" size={24} />
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">XP Earned</p>
                      <p className="text-2xl font-bold text-purple-600">{analyticsData.metrics.totalXPEarned}</p>
                    </div>
                    <TrendingUp className="text-purple-500" size={24} />
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Engagement</p>
                      <p className="text-2xl font-bold text-orange-600">{analyticsData.metrics.trends.engagementScore}/100</p>
                    </div>
                    <Users className="text-orange-500" size={24} />
                  </div>
                </Card>
              </div>
              
              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CompletionChart 
                  completions={questCompletions}
                  timeRange={selectedTimeRange}
                />
                <CategoryBreakdown 
                  completions={questCompletions}
                  quests={quests}
                />
              </div>
            </>
          )}
          
          {/* Completion Tab */}
          {activeTab === 'completion' && (
            <div className="space-y-6">
              <CompletionChart 
                completions={questCompletions}
                timeRange={selectedTimeRange}
                showDetailed={true}
              />
              <TimeHeatmap 
                completions={questCompletions}
                timeRange={selectedTimeRange}
              />
            </div>
          )}
          
          {/* Comparison Tab */}
          {activeTab === 'comparison' && (
            <ChildComparison 
              childProfiles={childProfiles.filter(child => selectedChildren.includes(child.id))}
              questCompletions={questCompletions}
              timeRange={selectedTimeRange}
            />
          )}
          
          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <InsightCards 
              insights={analyticsData.insights}
              childProfiles={childProfiles}
              timeRange={selectedTimeRange}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ParentAnalytics;