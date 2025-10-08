import React from 'react';

const EnvironmentBanner = () => {
  const environment = process.env.REACT_APP_ENVIRONMENT || 'development';
  
  // Don't show banner in production
  if (environment === 'production') {
    return null;
  }
  
  const getBannerConfig = () => {
    switch (environment) {
      case 'beta':
        return {
          color: 'bg-orange-500',
          text: '🧪 BETA ENVIRONMENT',
          description: 'This is the beta testing environment'
        };
      case 'development':
        return {
          color: 'bg-green-500',
          text: '🛠️ DEVELOPMENT',
          description: 'Local development environment'
        };
      default:
        return {
          color: 'bg-gray-500',
          text: `📍 ${environment.toUpperCase()}`,
          description: `Environment: ${environment}`
        };
    }
  };
  
  const config = getBannerConfig();
  
  return (
    <div className={`${config.color} text-white text-center py-2 px-4 text-sm font-medium shadow-md`}>
      <div className="flex items-center justify-center space-x-2">
        <span>{config.text}</span>
        <span className="text-xs opacity-75">•</span>
        <span className="text-xs opacity-90">{config.description}</span>
      </div>
    </div>
  );
};

export default EnvironmentBanner;