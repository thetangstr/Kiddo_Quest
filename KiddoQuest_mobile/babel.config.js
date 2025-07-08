module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo']
    // NativeWind temporarily removed due to configuration issues
    // Will implement styling with React Native StyleSheet API for initial testing
  };
};
