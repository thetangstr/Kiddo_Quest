# GitHub Secrets Setup Guide

## Required Secrets for CI/CD Pipeline

Go to: https://github.com/thetangstr/Kiddo_Quest/settings/secrets/actions

### 1. FIREBASE_TOKEN
**To get your Firebase token**:
1. Run: `firebase login:ci` in your terminal
2. Copy the generated token
3. Add it as `FIREBASE_TOKEN` in GitHub secrets

**Alternative method** (if you're already logged in):
1. Find your Firebase credentials at: `~/.config/firebase/`
2. Look for files like `thetangstr_gmail_com_application_default_credentials.json`
3. Copy the entire JSON content and add as `FIREBASE_TOKEN`

### 2. EXPO_TOKEN (for mobile builds)
**To generate**:
1. `cd KiddoQuest_mobile`
2. `npx expo login` (if not already logged in)
3. `npx expo token:create --name "GitHub Actions CI/CD"`
4. Copy the generated token

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