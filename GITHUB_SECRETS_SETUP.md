# GitHub Secrets Setup Guide

This guide helps you configure GitHub secrets for the multi-environment CI/CD pipeline.

## 🔐 Required Secrets for Beta/Production Pipeline

Go to: https://github.com/thetangstr/Kiddo_Quest/settings/secrets/actions

### 1. FIREBASE_SERVICE_ACCOUNT_PRODUCTION
**Purpose**: Deploy to production Firebase project (`kiddo-quest-de7b0`)

**To get the service account key**:
1. Go to [Firebase Console - Production](https://console.firebase.google.com/project/kiddo-quest-de7b0)
2. Click gear icon → "Project settings"
3. Go to "Service accounts" tab
4. Click "Generate new private key"
5. Download the JSON file
6. Copy the ENTIRE JSON content and paste as secret value

### 2. FIREBASE_SERVICE_ACCOUNT_BETA
**Purpose**: Deploy to beta Firebase project (`kiddo-quest-beta`)

**First, create the beta project**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" 
3. Name it: `kiddo-quest-beta`
4. Enable the same services as production:
   - Authentication (Email/Password + Google)
   - Firestore Database
   - Cloud Storage  
   - Cloud Functions
   - Hosting

**Then get the service account key**:
1. Follow same steps as production project above
2. Copy JSON content as `FIREBASE_SERVICE_ACCOUNT_BETA`

### 2. EXPO_TOKEN (for mobile builds)
**Method 1 - Via Expo Website**:
1. Go to https://expo.dev/accounts/[your-username]/settings/access-tokens
2. Click "Create Token"
3. Name it "GitHub Actions CI/CD" 
4. Copy the generated token

**Method 2 - Via EAS CLI**:
1. `npm install -g @expo/cli`
2. `npx @expo/cli login` (if not already logged in)
3. Go to https://expo.dev/accounts/thetangstr/settings/access-tokens to create token manually

**Note**: The new Expo CLI doesn't support `token:create` command. Use the web interface instead.

### 3. SLACK_WEBHOOK (optional - for notifications)
**To generate**:
1. Go to https://api.slack.com/messaging/webhooks
2. Create a new webhook for your workspace
3. Copy the webhook URL

## Alternative Firebase Setup (if above doesn't work)

If you need a fresh Firebase token:
1. Open a new terminal
2. Run: `firebase logout`
3. Run: `firebase login:ci`
4. Copy the generated token and use it as FIREBASE_TOKEN

## Testing the Setup

After adding the secrets:
1. `git checkout develop`
2. `git commit --allow-empty -m "Test CI/CD pipeline"`
3. `git push origin develop`
4. Check GitHub Actions at: https://github.com/thetangstr/Kiddo_Quest/actions

## Environment Protection

Set up production environment protection:
1. Go to: https://github.com/thetangstr/Kiddo_Quest/settings/environments
2. Create environment named "production"
3. Add protection rules:
   - Required reviewers: Add yourself
   - Wait timer: 5 minutes
   - Deployment branches: Only main branch