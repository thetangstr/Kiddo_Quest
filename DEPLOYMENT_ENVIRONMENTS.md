# Multi-Environment Deployment Guide

This document outlines the beta/production deployment system for KiddoQuest.

## 🏗️ Architecture Overview

```
Feature Development → Beta Environment → Production Environment
      ↓                     ↓                    ↓
   develop branch      kiddo-quest-beta    kiddo-quest-de7b0
                      (beta.web.app)       (web.app)
```

## 🌍 Environments

### Beta Environment
- **Purpose**: Testing, staging, QA
- **Firebase Project**: `kiddo-quest-beta`
- **URL**: `https://kiddo-quest-beta.web.app`
- **Branch**: `develop`, `feature/*`, `hotfix/*`
- **Data**: Isolated test data

### Production Environment  
- **Purpose**: Live user-facing application
- **Firebase Project**: `kiddo-quest-de7b0`
- **URL**: `https://kiddo-quest-de7b0.web.app`
- **Branch**: `main`
- **Data**: Real user data

## 🚀 Deployment Workflows

### 1. Beta Deployment (Automatic)
**Triggers:**
- Push to `develop`, `feature/*`, `hotfix/*` branches
- Pull requests to `main`

**Process:**
```yaml
Test Suite → Security Scan → Build → Deploy to Beta → Validate
```

**Workflow:** `.github/workflows/beta-deploy.yml`

### 2. Production Deployment (Automatic)
**Triggers:**
- Push to `main` branch
- Manual workflow dispatch

**Process:**
```yaml
Full Test Suite → Security Audit → Build → Deploy to Production → Tag → Validate
```

**Workflow:** `.github/workflows/production-deploy.yml`

### 3. Beta to Production Promotion (Manual)
**Trigger:** Manual workflow dispatch

**Process:**
```yaml
Validate Beta → Test Beta Version → Deploy to Production → Merge to Main → Tag Release
```

**Workflow:** `.github/workflows/promote-beta-to-prod.yml`

## 🎯 GitHub Secrets Configuration

You need to set up these secrets in your GitHub repository:

### Required Secrets

```bash
# Production Firebase Service Account
FIREBASE_SERVICE_ACCOUNT_PRODUCTION

# Beta Firebase Service Account (when beta project is created)
FIREBASE_SERVICE_ACCOUNT_BETA
```

### How to Generate Service Account Keys

1. **Go to Firebase Console**
   - Production: https://console.firebase.google.com/project/kiddo-quest-de7b0
   - Beta: https://console.firebase.google.com/project/kiddo-quest-beta

2. **Navigate to Project Settings → Service Accounts**

3. **Generate New Private Key**
   - Download the JSON file
   - Copy the entire JSON content

4. **Add to GitHub Secrets**
   - Go to GitHub repository → Settings → Secrets and Variables → Actions
   - Create new secret with the JSON content

## 🛠️ Local Development Commands

```bash
# Start development server
npm start

# Build for specific environments
npm run build:beta        # Build for beta
npm run build:production  # Build for production

# Deploy to specific environments (requires Firebase CLI setup)
npm run deploy:beta        # Deploy to beta
npm run deploy:production  # Deploy to production

# Testing
npm test                   # Unit tests
npm run test:coverage      # Unit tests with coverage
npm run test:e2e          # E2E tests
npm run test:e2e:minimal  # Minimal E2E tests
```

## 🚨 Emergency Procedures

### Rollback Production
1. Go to GitHub Actions
2. Run "Emergency Rollback" workflow
3. Select production environment
4. Enter the tag to rollback to
5. Provide rollback reason

### Promote Urgent Beta Fix
1. Go to GitHub Actions
2. Run "Promote Beta to Production" workflow  
3. Enter beta version (or leave empty for latest)
4. Check "Skip tests" for emergencies only
5. Provide deployment notes

## 📋 Development Workflow

### Feature Development
1. Create feature branch from `develop`
2. Develop and test locally
3. Push to feature branch → Triggers beta deployment
4. Test in beta environment
5. Create PR to `develop`
6. Merge to `develop` → Updates beta deployment
7. When ready, promote beta to production

### Hotfixes
1. Create hotfix branch from `main`
2. Fix the issue
3. Push to hotfix branch → Deploys to beta
4. Test the fix in beta
5. Promote to production via workflow
6. Merge hotfix to both `main` and `develop`

## 🔍 Environment Detection

The app automatically detects its environment and shows:
- **Beta**: Orange banner "🧪 BETA ENVIRONMENT"
- **Development**: Green banner "🛠️ DEVELOPMENT"  
- **Production**: No banner

Environment is determined by `REACT_APP_ENVIRONMENT` variable.

## 📊 Monitoring

### Beta Environment
- Lower uptime requirements
- Can have experimental features
- Test data only

### Production Environment  
- High availability required
- Stable features only
- Real user data
- Automated alerts on failures

## 🎛️ Firebase Project Setup

When setting up the beta Firebase project:

1. **Create New Project**: `kiddo-quest-beta`
2. **Enable Services**:
   - Authentication (Email/Password, Google)
   - Firestore Database
   - Cloud Storage
   - Cloud Functions
   - Hosting
3. **Configure Security Rules**: Copy from production
4. **Set Up Service Account**: For GitHub Actions
5. **Update Environment Files**: Add beta configuration

## 🔄 Continuous Integration

### Pull Request Checks
- Unit tests must pass
- E2E tests must pass  
- Security scan must pass
- Build must succeed

### Deployment Gates
- Beta: Basic tests + build validation
- Production: Full test suite + security audit + manual approval

### Automated Testing
- **Unit Tests**: Jest with coverage reporting
- **E2E Tests**: Playwright with real browser testing
- **Security**: npm audit + secret scanning
- **Build Validation**: Multi-environment builds