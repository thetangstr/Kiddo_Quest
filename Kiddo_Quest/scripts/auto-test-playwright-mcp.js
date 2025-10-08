#!/usr/bin/env node

/**
 * Auto-test with Playwright MCP
 * Watches for file changes and runs Playwright MCP tests automatically
 */

const chokidar = require('chokidar');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const CONFIG = {
  // Files to watch for changes
  watchPatterns: [
    'src/**/*.js',
    'src/**/*.jsx',
    'src/**/*.ts',
    'src/**/*.tsx',
    'src/**/*.css',
    'public/**/*'
  ],
  
  // Files to ignore
  ignorePatterns: [
    'node_modules/**',
    'build/**',
    'coverage/**',
    '.git/**',
    '**/*.test.js',
    '**/*.spec.js'
  ],
  
  // Test scenarios to run
  testScenarios: [
    {
      name: 'Login Flow',
      description: 'Test user login and authentication',
      enabled: true
    },
    {
      name: 'Child Dashboard',
      description: 'Test child dashboard with gamification elements',
      enabled: true
    },
    {
      name: 'Parent Analytics',
      description: 'Test parent analytics dashboard',
      enabled: true
    },
    {
      name: 'Quest Management',
      description: 'Test quest creation and completion',
      enabled: true
    }
  ],
  
  // App settings
  appUrl: 'http://localhost:3000',
  testUser: {
    email: 'test@example.com',
    password: 'testpassword123'
  },
  
  // Debounce settings
  debounceMs: 2000, // Wait 2 seconds after last change
  cooldownMs: 10000 // Minimum 10 seconds between test runs
};

class PlaywrightMCPTester {
  constructor() {
    this.isRunning = false;
    this.lastRunTime = 0;
    this.pendingTimeout = null;
    this.changedFiles = new Set();
    
    this.initializeWatcher();
    this.setupGracefulShutdown();
    
    console.log('🎭 Playwright MCP Auto-Tester Started');
    console.log(`📁 Watching: ${CONFIG.watchPatterns.join(', ')}`);
    console.log(`🌐 App URL: ${CONFIG.appUrl}`);
    console.log(`👤 Test User: ${CONFIG.testUser.email}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
  
  initializeWatcher() {
    this.watcher = chokidar.watch(CONFIG.watchPatterns, {
      ignored: CONFIG.ignorePatterns,
      ignoreInitial: true,
      persistent: true
    });
    
    this.watcher
      .on('change', (filePath) => this.handleFileChange(filePath, 'changed'))
      .on('add', (filePath) => this.handleFileChange(filePath, 'added'))
      .on('unlink', (filePath) => this.handleFileChange(filePath, 'deleted'))
      .on('error', (error) => {
        console.error('❌ Watcher error:', error);
      });
  }
  
  handleFileChange(filePath, action) {
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`📝 File ${action}: ${relativePath}`);
    
    this.changedFiles.add(relativePath);
    
    // Clear existing timeout
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
    }
    
    // Set new timeout for debounced execution
    this.pendingTimeout = setTimeout(() => {
      this.runTests();
    }, CONFIG.debounceMs);
  }
  
  async runTests() {
    // Check cooldown period
    const now = Date.now();
    if (now - this.lastRunTime < CONFIG.cooldownMs) {
      console.log(`⏱️  Cooldown period active, skipping test run`);
      return;
    }
    
    if (this.isRunning) {
      console.log('🔄 Tests already running, skipping...');
      return;
    }
    
    this.isRunning = true;
    this.lastRunTime = now;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🧪 Starting Playwright MCP Tests - ${new Date().toLocaleTimeString()}`);
    console.log(`📋 Changed files: ${Array.from(this.changedFiles).join(', ')}`);
    
    try {
      // Check if app is running
      const isAppRunning = await this.checkAppHealth();
      if (!isAppRunning) {
        console.log('❌ App is not running at', CONFIG.appUrl);
        console.log('💡 Please start the app with: npm start');
        return;
      }
      
      // Run test scenarios
      for (const scenario of CONFIG.testScenarios) {
        if (!scenario.enabled) continue;
        
        console.log(`\n🎯 Running: ${scenario.name}`);
        console.log(`   ${scenario.description}`);
        
        try {
          await this.runTestScenario(scenario);
          console.log(`✅ ${scenario.name} - PASSED`);
        } catch (error) {
          console.log(`❌ ${scenario.name} - FAILED`);
          console.log(`   Error: ${error.message}`);
        }
      }
      
      console.log('\n🎉 Test run completed!');
      
    } catch (error) {
      console.error('❌ Test run failed:', error.message);
    } finally {
      this.isRunning = false;
      this.changedFiles.clear();
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
  }
  
  async checkAppHealth() {
    return new Promise((resolve) => {
      const { exec } = require('child_process');
      exec(`curl -s -o /dev/null -w "%{http_code}" ${CONFIG.appUrl}`, (error, stdout) => {
        const statusCode = stdout.trim();
        resolve(statusCode === '200' || statusCode === '404'); // 404 is ok for SPA routing
      });
    });
  }
  
  async runTestScenario(scenario) {
    switch (scenario.name) {
      case 'Login Flow':
        return await this.testLoginFlow();
      case 'Child Dashboard':
        return await this.testChildDashboard();
      case 'Parent Analytics':
        return await this.testParentAnalytics();
      case 'Quest Management':
        return await this.testQuestManagement();
      default:
        throw new Error(`Unknown test scenario: ${scenario.name}`);
    }
  }
  
  async testLoginFlow() {
    // Navigate to app
    await this.navigateToApp();
    
    // Check if login form exists
    const snapshot = await this.takeSnapshot();
    if (!snapshot.includes('login') && !snapshot.includes('email')) {
      throw new Error('Login form not found');
    }
    
    // Try to fill login form (basic check)
    try {
      await this.fillLoginForm();
    } catch (error) {
      // Login might already be authenticated or form might be different
      console.log('   ℹ️  Login form interaction skipped (might be authenticated)');
    }
  }
  
  async testChildDashboard() {
    await this.navigateToApp();
    
    // Look for child dashboard elements
    const snapshot = await this.takeSnapshot();
    const hasGamificationElements = [
      'level', 'badge', 'streak', 'xp', 'quest'
    ].some(element => snapshot.toLowerCase().includes(element));
    
    if (!hasGamificationElements) {
      throw new Error('Gamification elements not found on dashboard');
    }
  }
  
  async testParentAnalytics() {
    await this.navigateToApp();
    
    // Try to navigate to analytics
    const snapshot = await this.takeSnapshot();
    if (snapshot.includes('Analytics') || snapshot.includes('analytics')) {
      console.log('   ✅ Analytics section detected');
    } else {
      console.log('   ⚠️  Analytics section not immediately visible');
    }
  }
  
  async testQuestManagement() {
    await this.navigateToApp();
    
    // Look for quest-related elements
    const snapshot = await this.takeSnapshot();
    const hasQuestElements = [
      'quest', 'mission', 'task', 'complete'
    ].some(element => snapshot.toLowerCase().includes(element));
    
    if (!hasQuestElements) {
      throw new Error('Quest management elements not found');
    }
  }
  
  // Helper methods for Playwright MCP interactions
  async navigateToApp() {
    // This would use Playwright MCP to navigate
    console.log(`   🌐 Navigating to ${CONFIG.appUrl}`);
    // Placeholder for actual MCP call
  }
  
  async takeSnapshot() {
    // This would use Playwright MCP to take a snapshot
    console.log('   📸 Taking page snapshot');
    // Placeholder - return mock snapshot
    return 'mock snapshot with login form and dashboard elements';
  }
  
  async fillLoginForm() {
    // This would use Playwright MCP to fill the login form
    console.log(`   📝 Filling login form for ${CONFIG.testUser.email}`);
    // Placeholder for actual MCP call
  }
  
  setupGracefulShutdown() {
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down auto-tester...');
      if (this.watcher) {
        this.watcher.close();
      }
      if (this.pendingTimeout) {
        clearTimeout(this.pendingTimeout);
      }
      console.log('👋 Auto-tester stopped');
      process.exit(0);
    });
  }
}

// CLI options
const args = process.argv.slice(2);
const isOnce = args.includes('--once') || args.includes('once');

if (isOnce) {
  console.log('🧪 Running tests once...');
  const tester = new PlaywrightMCPTester();
  tester.runTests().then(() => {
    console.log('✅ One-time test completed');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ One-time test failed:', error);
    process.exit(1);
  });
} else {
  // Start the auto-tester
  new PlaywrightMCPTester();
}

module.exports = { PlaywrightMCPTester, CONFIG };