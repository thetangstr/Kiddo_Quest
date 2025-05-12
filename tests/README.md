# Kiddo Quest Testing Documentation

This directory contains automated tests for the Kiddo Quest application using Playwright. These tests help ensure that the application functions correctly and that new features don't break existing functionality.

## Test Structure

The tests are organized into several files, each focusing on a specific area of the application:

- **auth.spec.js**: Tests for authentication functionality
- **dashboard.spec.js**: Tests for dashboard components and basic app structure
- **feedback.spec.js**: Tests for the feedback submission system
- **pin-protection.spec.js**: Tests for the PIN protection system for parent dashboard
- **recurring-quest-features.spec.js**: Tests for recurring quest features including penalties and limits
- **admin-console.spec.js**: Tests for admin console features including bug management and user invitations
- **quest-management.spec.js**: Comprehensive tests for quest management features

## Running Tests

### Using NPM Scripts

The following npm scripts are available for running tests:

```bash
# Run all tests
npm run test:e2e

# Run tests with UI mode (interactive test explorer)
npm run test:e2e:ui

# Run tests in headed mode (visible browser)
npm run test:e2e:headed

# Run tests and generate HTML report
npm run test:e2e:report

# Run tests in debug mode
npm run test:e2e:debug

# Run specific test suites
npm run test:e2e:pin      # Run PIN protection tests
npm run test:e2e:quests   # Run recurring quest features tests
npm run test:e2e:admin    # Run admin console tests
```

### Using Custom Test Runner

A custom test runner script is available for more flexibility:

```bash
# Run all tests
node tests/run-tests.js --all

# Run specific test suites
node tests/run-tests.js auth dashboard

# Run tests in headed mode
node tests/run-tests.js --headed pin-protection

# Generate HTML report
node tests/run-tests.js --report

# Show help
node tests/run-tests.js --help
```

## Test Reports

When running tests with the `--report` flag, an HTML report will be generated. You can view this report by running:

```bash
npx playwright show-report
```

## Test Screenshots

Test screenshots are saved in the `test-results` directory. These can be useful for debugging test failures or for visual verification of UI components.

## Mocking Strategy

Since these tests run against the actual application but can't rely on Firebase authentication or database access, they use localStorage mocking to simulate authenticated states and data. This approach allows testing of UI components and user flows without requiring actual backend connectivity.

## CI/CD Integration

Tests are automatically run before deployment using the `predeploy` npm script. This ensures that all tests pass before the application is deployed.

## Adding New Tests

When adding new features to the application, consider adding corresponding tests to ensure the feature works as expected and continues to work in the future.

1. Create a new test file or add to an existing one
2. Follow the existing patterns for mocking data and user state
3. Test both happy paths and edge cases
4. Include screenshots where helpful for visual verification

## Best Practices

- Keep tests focused on specific functionality
- Use descriptive test names
- Mock only what's necessary
- Use page objects for complex pages
- Keep tests independent of each other
