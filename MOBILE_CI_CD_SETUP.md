# Mobile CI/CD Setup Guide

This guide will help you set up automated mobile builds using GitHub Actions and EAS (Expo Application Services).

## Prerequisites

1. **Expo Account**: Create an account at [expo.dev](https://expo.dev)
2. **EAS Subscription**: Free tier available for public projects
3. **Apple Developer Account**: Required for iOS builds ($99/year)
4. **Google Play Console Account**: Required for Android builds ($25 one-time)

## Step 1: Generate Expo Token

1. Go to [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens)
2. Click "Create Token"
3. Name it "GitHub Actions"
4. Copy the token (starts with `expo_...`)

## Step 2: Add GitHub Secret

1. Go to your GitHub repo settings
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `EXPO_TOKEN`
5. Value: Paste your Expo token
6. Click "Add secret"

## Step 3: Configure EAS Credentials (One-time Setup)

### First-time Setup (Interactive)

Run these commands locally to set up credentials:

```bash
cd KiddoQuest_mobile

# Login to Expo
expo login

# Configure iOS credentials
eas credentials

# Select iOS → production → Set up new credentials
# Follow prompts to create certificates and provisioning profiles

# Configure Android credentials  
eas credentials

# Select Android → production → Set up new keystore
# EAS will generate and store the keystore
```

### Store Credentials in EAS

EAS automatically stores your credentials securely. The CI/CD pipeline will use these stored credentials.

## Step 4: Configure App Store Connect (iOS)

1. Create app in App Store Connect
2. Configure app metadata
3. Set up TestFlight for beta testing
4. Note your Apple ID and Team ID

## Step 5: Configure Google Play Console (Android)

1. Create app in Play Console
2. Set up internal testing track
3. Configure app metadata
4. Upload first APK manually (required by Google)

## Step 6: Update EAS Configuration

Edit `KiddoQuest_mobile/eas.json` if needed:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "XXXXXXXXXX"
      },
      "android": {
        "serviceAccountKeyPath": "./path-to-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

## Step 7: Test the Pipeline

1. Make a small change in `KiddoQuest_mobile/`
2. Commit and push to `develop` branch
3. Check GitHub Actions tab
4. Monitor builds in [Expo Dashboard](https://expo.dev)

## Workflow Overview

### Beta Builds (develop branch)
- Triggered on push to `develop`
- Builds iOS (TestFlight) and Android (Internal Testing)
- Uses `preview` profile from eas.json

### Production Builds (main branch)
- Triggered on push to `main`
- Auto-increments version
- Builds and auto-submits to stores
- Creates release tag

## Monitoring Builds

1. **GitHub Actions**: Shows workflow status
2. **Expo Dashboard**: Shows detailed build logs
3. **App Store Connect**: iOS build status
4. **Google Play Console**: Android build status

## Troubleshooting

### Common Issues

1. **"Credentials not found"**
   - Run `eas credentials` locally first
   - Ensure EXPO_TOKEN is set correctly

2. **"Build failed"**
   - Check Expo dashboard for detailed logs
   - Verify all dependencies are installed
   - Check for iOS/Android specific issues

3. **"Submission failed"**
   - Ensure app metadata is complete
   - First APK must be uploaded manually to Play Console
   - Check store-specific requirements

## Best Practices

1. **Version Management**
   - Let CI/CD auto-increment versions
   - Use semantic versioning
   - Tag releases appropriately

2. **Testing**
   - Always test beta builds first
   - Use TestFlight and Play Console beta tracks
   - Get team feedback before production

3. **Security**
   - Never commit credentials
   - Use EAS credential storage
   - Rotate tokens periodically

## Next Steps

1. Complete credential setup
2. Test beta workflow
3. Submit first production build
4. Set up monitoring and alerts

---

For more information:
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase Documentation](https://firebase.google.com/docs)