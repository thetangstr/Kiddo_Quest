import React, { useState, useEffect } from 'react';

const TimeHeatmap = ({ 
  completions = [], 
  timeRange = 'weekly',
  isLoading = false,
  className = '' 
}) => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [viewType, setViewType] = useState('hourly'); // 'hourly' or 'daily'
  const [maxActivity, setMaxActivity] = useState(0);

  // Days of the week
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Hours of the day
  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  useEffect(() => {
    if (completions.length === 0) {
      setHeatmapData([]);
      setMaxActivity(0);
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

    if (viewType === 'hourly') {
      // Create hourly heatmap data (24 hours x 7 days)
      const hourlyData = [];
      let maxCount = 0;

      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const activityCount = filteredCompletions.filter(completion => {
            const date = completion.completedAt?.toDate?.() || new Date(completion.completedAt);
            return date.getDay() === day && date.getHours() === hour;
          }).length;

          maxCount = Math.max(maxCount, activityCount);
          
          hourlyData.push({
            day,
            hour,
            count: activityCount,
            dayName: DAYS[day],
            hourDisplay: hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`
          });
        }
      }

      setHeatmapData(hourlyData);
      setMaxActivity(maxCount);
    } else {
      // Create daily heatmap data (days of the month)
      const dailyData = [];
      let maxCount = 0;

      // Get all days in the range
      const current = new Date(startDate);
      while (current <= endDate) {
        const activityCount = filteredCompletions.filter(completion => {
          const date = completion.completedAt?.toDate?.() || new Date(completion.completedAt);
          return date.toDateString() === current.toDateString();
        }).length;

        maxCount = Math.max(maxCount, activityCount);
        
        dailyData.push({
          date: new Date(current),
          count: activityCount,
          dayOfMonth: current.getDate(),
          dayOfWeek: current.getDay(),
          month: current.getMonth(),
          year: current.getFullYear()
        });

        current.setDate(current.getDate() + 1);
      }

      setHeatmapData(dailyData);
      setMaxActivity(maxCount);
    }
  }, [completions, timeRange, viewType]);

  // Get intensity class based on activity count
  const getIntensityClass = (count) => {
    if (maxActivity === 0) return 'bg-gray-100';
    
    const intensity = count / maxActivity;
    
    if (intensity === 0) return 'bg-gray-100';
    if (intensity <= 0.25) return 'bg-green-200';
    if (intensity <= 0.5) return 'bg-green-300';
    if (intensity <= 0.75) return 'bg-green-400';
    return 'bg-green-500';
  };

  // Get text color based on intensity
  const getTextColor = (count) => {
    if (maxActivity === 0) return 'text-gray-600';
    
    const intensity = count / maxActivity;
    return intensity > 0.5 ? 'text-white' : 'text-gray-700';
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
  if (heatmapData.length === 0) {
    return (
      <div className={`bg-white rounded-lg p-6 shadow-sm ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Activity Heatmap</h3>
        </div>
        
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <div className="w-16 h-16 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <p className="text-lg font-medium">No activity data</p>
          <p className="text-sm">Complete activities to see patterns here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Activity Heatmap</h3>
          <p className="text-sm text-gray-500 mt-1">
            Activity patterns by {viewType === 'hourly' ? 'time of day' : 'date'} ({timeRange})
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setViewType('hourly')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              viewType === 'hourly' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Hourly
          </button>
          <button
            onClick={() => setViewType('daily')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              viewType === 'daily' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Daily
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{maxActivity}</div>
          <div className="text-sm text-blue-800">Peak Activity</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {heatmapData.reduce((sum, item) => sum + item.count, 0)}
          </div>
          <div className="text-sm text-green-800">Total Activities</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {heatmapData.filter(item => item.count > 0).length}
          </div>
          <div className="text-sm text-purple-800">Active {viewType === 'hourly' ? 'Hours' : 'Days'}</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {heatmapData.length > 0 ? 
              (heatmapData.reduce((sum, item) => sum + item.count, 0) / heatmapData.filter(item => item.count > 0).length || 0).toFixed(1) 
              : 0}
          </div>
          <div className="text-sm text-orange-800">Avg per Active Period</div>
        </div>
      </div>

      {/* Heatmap */}
      {viewType === 'hourly' ? (
        <div className="space-y-4">
          {/* Hour labels */}
          <div className="grid grid-cols-25 gap-1 text-xs text-gray-500">
            <div></div> {/* Empty corner */}
            {[0, 3, 6, 9, 12, 15, 18, 21].map(hour => (
              <div key={hour} className="col-span-3 text-center">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          {DAYS.map(day => (
            <div key={day} className="grid grid-cols-25 gap-1 items-center">
              <div className="text-xs text-gray-600 font-medium w-8">{day}</div>
              {HOURS.map(hour => {
                const dataPoint = heatmapData.find(d => d.day === DAYS.indexOf(day) && d.hour === hour);
                const count = dataPoint?.count || 0;
                
                return (
                  <div
                    key={hour}
                    className={`h-4 w-4 rounded-sm ${getIntensityClass(count)} flex items-center justify-center cursor-pointer transition-all hover:scale-110`}
                    title={`${day} ${hour}:00 - ${count} activities`}
                  >
                    {count > 0 && (
                      <span className={`text-xs font-bold ${getTextColor(count)}`}>
                        {count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Calendar view for daily heatmap */}
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map(day => (
              <div key={day} className="text-xs text-gray-600 font-medium text-center p-1">
                {day}
              </div>
            ))}
          </div>
          
          {/* Group days by week */}
          {(() => {
            const weeks = [];
            let currentWeek = [];
            
            heatmapData.forEach((item, index) => {
              if (currentWeek.length === 0) {
                // Fill empty days at the beginning of the first week
                for (let i = 0; i < item.dayOfWeek; i++) {
                  currentWeek.push(null);
                }
              }
              
              currentWeek.push(item);
              
              if (currentWeek.length === 7 || index === heatmapData.length - 1) {
                // Fill empty days at the end of the last week
                while (currentWeek.length < 7) {
                  currentWeek.push(null);
                }
                weeks.push(currentWeek);
                currentWeek = [];
              }
            });
            
            return weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-2">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`h-12 w-full rounded ${
                      day ? getIntensityClass(day.count) : 'bg-gray-50'
                    } flex items-center justify-center cursor-pointer transition-all hover:scale-105`}
                    title={day ? `${day.date.toLocaleDateString()} - ${day.count} activities` : ''}
                  >
                    {day && (
                      <div className={`text-center ${getTextColor(day.count)}`}>
                        <div className="text-xs font-medium">{day.dayOfMonth}</div>
                        {day.count > 0 && (
                          <div className="text-xs font-bold">{day.count}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ));
          })()}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {viewType === 'hourly' ? 'Time of day activity patterns' : 'Daily activity calendar'}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-600">Less</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
          </div>
          <span className="text-xs text-gray-600">More</span>
        </div>
      </div>

      {/* Peak Activity Insights */}
      {maxActivity > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-1">Peak Activity Insights</h4>
          <p className="text-sm text-blue-700">
            {viewType === 'hourly' 
              ? `Highest activity occurs with ${maxActivity} completions in a single hour.`
              : `Most active day had ${maxActivity} completions.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default TimeHeatmap;