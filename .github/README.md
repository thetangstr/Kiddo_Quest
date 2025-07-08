# GitHub Actions CI/CD Setup

This repository uses GitHub Actions for continuous integration and deployment across multiple platforms and environments.

## Workflows

### 1. Web Application CI/CD (`ci-cd.yml`)
- **Triggers**: Push to `main`/`develop` branches, PRs to `main`
- **Jobs**:
  - `test`: Unit tests, linting, and build
  - `e2e-test`: End-to-end testing with Playwright
  - `deploy-staging`: Deploy to staging environment (develop branch)
  - `deploy-production`: Deploy to production (main branch)
  - `security-scan`: Security audit and CodeQL analysis

### 2. Mobile Application CI/CD (`mobile-ci-cd.yml`)
- **Triggers**: Push to `main`/`develop` branches with mobile changes
- **Jobs**:
  - `mobile-test`: TypeScript checking, linting, unit tests
  - `mobile-e2e-test`: Mobile E2E testing
  - `mobile-build-staging`: Development builds for staging
  - `mobile-build-production`: Production builds for app stores

### 3. Firebase Functions CI/CD (`functions-ci-cd.yml`)
- **Triggers**: Push to `main`/`develop` branches with functions changes
- **Jobs**:
  - `functions-test`: Linting, unit tests, security audit
  - `functions-deploy-staging`: Deploy to staging environment
  - `functions-deploy-production`: Deploy to production

## Required Secrets

Add these secrets to your GitHub repository settings:

### Firebase
- `FIREBASE_TOKEN`: Firebase CLI token for deployments
  ```bash
  firebase login:ci
  ```

### Expo/EAS (for mobile builds)
- `EXPO_TOKEN`: Expo authentication token
  ```bash
  npx expo login
  npx expo whoami
  ```

### Notifications (optional)
- `SLACK_WEBHOOK`: Slack webhook URL for deployment notifications

## Environment Configuration

### Production Environment
- Protected environment requiring manual approval
- All production deployments require review
- Automatic notifications on deployment status

### Staging Environment
- Automatic deployment from `develop` branch
- Used for testing before production release

## Branch Strategy

```
main (production) ← merge from develop
  ↑
develop (staging) ← merge from feature branches
  ↑
feature/* (development)
```

## Deployment Process

1. **Development**: Create feature branch from `develop`
2. **Testing**: Push changes trigger automated tests
3. **Staging**: Merge to `develop` triggers staging deployment
4. **Production**: Merge to `main` triggers production deployment (with approval)

## Manual Deployment

If needed, you can still deploy manually:

```bash
# Web application
cd Kiddo_Quest
npm run deploy

# Mobile application
cd KiddoQuest_mobile
npx eas build --platform all --profile production

# Firebase functions
cd Kiddo_Quest
firebase deploy --only functions
```

## Troubleshooting

### Common Issues
1. **Build failures**: Check Node.js version compatibility
2. **Test failures**: Ensure all tests pass locally first
3. **Firebase deployment issues**: Verify Firebase token is valid
4. **Mobile build issues**: Check Expo/EAS configuration

### Logs
- Check GitHub Actions logs for detailed error messages
- Firebase deployment logs available in Firebase Console
- Mobile build logs available in Expo dashboard

## Security

- All secrets are encrypted in GitHub
- CodeQL analysis runs on every push
- Dependency security audits included
- Service account keys excluded from repository

## Monitoring

- Deployment status notifications via Slack
- Build artifacts retained for 7-30 days
- Test results uploaded for failed builds
- Performance metrics tracked