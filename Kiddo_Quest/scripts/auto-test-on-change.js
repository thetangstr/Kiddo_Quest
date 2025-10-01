#!/usr/bin/env node

/**
 * Automated Testing Hook for KiddoQuest
 * 
 * This script automatically runs Playwright tests whenever code changes are made.
 * It specifically tests critical user flows to ensure nothing is broken.
 * 
 * Usage:
 *   node scripts/auto-test-on-change.js
 *   
 * Or add to package.json:
 *   "test:auto": "node scripts/auto-test-on-change.js"
 */

const { spawn } = require('child_process');
const chokidar = require('chokidar');
const path = require('path');

// Configuration
const TEST_ENVIRONMENTS = {
  development: 'http://localhost:3000',
  beta: 'https://kiddo-quest-beta.web.app',
  production: 'https://kiddo-quest-de7b0.web.app'
};

const CRITICAL_TESTS = [
  'tests/critical-flows.spec.js'  // We'll create this test file
];

const WATCH_PATHS = [
  'src/**/*.js',
  'src/**/*.jsx',
  'functions/**/*.js',
  '!src/**/*.test.js',
  '!functions/node_modules/**'
];

let testInProgress = false;
let pendingTest = false;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

async function runTests(environment = 'beta') {
  if (testInProgress) {
    pendingTest = true;
    log('⏳ Test already in progress. Will run again after completion.', 'yellow');
    return;
  }

  testInProgress = true;
  logSection(`🧪 Running Automated Tests on ${environment.toUpperCase()}`);
  
  const startTime = Date.now();
  
  try {
    // Set the base URL for tests
    process.env.BASE_URL = TEST_ENVIRONMENTS[environment];
    
    // Run the critical flow tests
    const testProcess = spawn('npx', [
      'playwright',
      'test',
      ...CRITICAL_TESTS,
      '--reporter=list',
      '--project=chromium'
    ], {
      stdio: 'pipe',
      env: { ...process.env, BASE_URL: TEST_ENVIRONMENTS[environment] }
    });

    let output = '';
    
    testProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      
      // Parse and display relevant test information
      if (text.includes('✓') || text.includes('✔')) {
        log(text.trim(), 'green');
      } else if (text.includes('✗') || text.includes('✘')) {
        log(text.trim(), 'red');
      } else if (text.includes('Running')) {
        log(text.trim(), 'cyan');
      }
    });

    testProcess.stderr.on('data', (data) => {
      log(`Error: ${data}`, 'red');
    });

    await new Promise((resolve) => {
      testProcess.on('close', (code) => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        if (code === 0) {
          logSection(`✅ All Tests Passed in ${duration}s`);
          log('Your changes are safe to deploy!', 'green');
        } else {
          logSection(`❌ Tests Failed in ${duration}s`);
          log('Please fix the failing tests before deploying.', 'red');
          
          // Extract failure details from output
          const failures = output.match(/\d+ failed/);
          if (failures) {
            log(`\nFailure Summary: ${failures[0]}`, 'red');
          }
        }
        
        resolve();
      });
    });

  } catch (error) {
    log(`\n❌ Error running tests: ${error.message}`, 'red');
  } finally {
    testInProgress = false;
    
    // Run pending test if there was another change while testing
    if (pendingTest) {
      pendingTest = false;
      setTimeout(() => runTests(environment), 1000);
    }
  }
}

function startWatching() {
  logSection('👀 Watching for Code Changes');
  log(`Monitoring: ${WATCH_PATHS.join(', ')}`, 'cyan');
  log('Press Ctrl+C to stop\n', 'yellow');
  
  // Run initial test
  runTests('beta');
  
  // Set up file watcher
  const watcher = chokidar.watch(WATCH_PATHS, {
    persistent: true,
    ignored: /node_modules|\.git|\.test\.js$/,
    ignoreInitial: true
  });

  let debounceTimer;
  
  watcher.on('change', (filepath) => {
    log(`\n📝 File changed: ${path.basename(filepath)}`, 'yellow');
    
    // Debounce to avoid multiple rapid tests
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      runTests('beta');
    }, 1000);
  });

  watcher.on('error', (error) => {
    log(`Watcher error: ${error}`, 'red');
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('\n\n👋 Stopping auto-test watcher...', 'yellow');
    watcher.close();
    process.exit(0);
  });
}

// Command line interface
const args = process.argv.slice(2);
const command = args[0];

if (command === 'once') {
  // Run tests once and exit
  const env = args[1] || 'beta';
  runTests(env).then(() => process.exit(0));
} else if (command === 'help') {
  console.log(`
Auto Test Runner for KiddoQuest

Usage:
  node scripts/auto-test-on-change.js          # Watch mode (default)
  node scripts/auto-test-on-change.js once     # Run once on beta
  node scripts/auto-test-on-change.js once production  # Run once on production
  node scripts/auto-test-on-change.js help     # Show this help

This tool automatically runs critical tests whenever you make changes to the code.
It helps ensure that your changes don't break core functionality.
  `);
} else {
  // Default: watch mode
  startWatching();
}