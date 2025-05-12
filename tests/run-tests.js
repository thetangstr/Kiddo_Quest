const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get all test files
const testDir = path.join(__dirname);
const testFiles = fs.readdirSync(testDir)
  .filter(file => file.endsWith('.spec.js'))
  .map(file => path.basename(file, '.spec.js'));

// Parse command line arguments
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');
const runAll = args.includes('--all') || args.length === 0;
const headless = !args.includes('--headed');
const generateReport = args.includes('--report');
const specificTests = args.filter(arg => !arg.startsWith('-') && testFiles.includes(arg));

// Show help
if (showHelp) {
  console.log(`
Kiddo Quest Test Runner

Usage:
  node run-tests.js [options] [test-names]

Options:
  --all             Run all tests (default if no test names provided)
  --headed          Run tests in headed mode (shows browser)
  --report          Generate HTML report
  --help, -h        Show this help message

Test Names:
  ${testFiles.join('\n  ')}

Examples:
  node run-tests.js --all                  Run all tests
  node run-tests.js auth dashboard         Run only auth and dashboard tests
  node run-tests.js --headed pin-protection Run pin-protection tests with browser visible
  `);
  process.exit(0);
}

// Determine which tests to run
const testsToRun = runAll ? testFiles : specificTests;

if (testsToRun.length === 0) {
  console.log('No tests to run. Use --help to see available options.');
  process.exit(1);
}

// Build the command
let command = 'npx playwright test';

// Add test files
if (!runAll) {
  command += ' ' + testsToRun.map(test => `${test}.spec.js`).join(' ');
}

// Add options
if (!headless) {
  command += ' --headed';
}

if (generateReport) {
  command += ' --reporter=html';
}

// Run the tests
console.log(`Running tests: ${testsToRun.join(', ')}`);
console.log(`Command: ${command}`);

try {
  execSync(command, { stdio: 'inherit' });
  
  if (generateReport) {
    console.log('\nTest report generated. Open it with:');
    console.log('npx playwright show-report');
  }
} catch (error) {
  console.error('Tests failed with error code:', error.status);
  process.exit(error.status);
}
