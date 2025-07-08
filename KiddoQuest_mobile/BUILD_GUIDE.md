# KiddoQuest Mobile App Build Guide

This guide covers building the KiddoQuest mobile app for iOS and Android platforms.

## Prerequisites

1. **Expo CLI & EAS CLI**
   ```bash
   npm install -g @expo/cli eas-cli
   ```

2. **Developer Accounts**
   - Apple Developer Account (for iOS builds)
   - Google Play Console Account (for Android builds)

3. **Environment Setup**
   - Xcode (for iOS development)
   - Android Studio (for Android development)

## Configuration Steps

### 1. Firebase Setup

The app is already configured with Firebase, but you may need to:

1. **Update Firebase Configuration Files:**
   - Replace `google-services.json` with your actual Android config
   - Replace `GoogleService-Info.plist` with your actual iOS config
   - Get these files from Firebase Console > Project Settings > Your Apps

2. **Environment Variables:**
   - Create `.env` file with your Firebase credentials
   - Use the `.env.example` as a template

### 2. EAS Configuration

1. **Login to EAS:**
   ```bash
   eas login
   ```

2. **Initialize EAS Build:**
   ```bash
   eas build:configure
   ```

3. **Update EAS Project ID:**
   - Update `extra.eas.projectId` in `app.json`
   - Get project ID from `eas project:info`

### 3. iOS Build Setup

1. **Update Apple Developer Info in `eas.json`:**
   ```json
   {
     "submit": {
       "production": {
         "ios": {
           "appleId": "your-apple-id@example.com",
           "ascAppId": "your-app-store-connect-app-id",
           "appleTeamId": "your-apple-team-id"
         }
       }
     }
   }
   ```

2. **Set Bundle Identifier:**
   - Already set to `com.kiddoquest.app` in `app.json`
   - Make sure this matches your Apple Developer Account

### 4. Android Build Setup

1. **Create Service Account Key:**
   - Go to Google Cloud Console
   - Create service account for Google Play Console
   - Download JSON key file as `service-account-key.json`
   - Add to `.gitignore`

2. **Update Package Name:**
   - Already set to `com.kiddoquest.app` in `app.json`
   - Make sure this matches your Google Play Console app

## Building the App

### Development Builds

For testing on devices:

```bash
# iOS Development Build
eas build --platform ios --profile development

# Android Development Build  
eas build --platform android --profile development
```

### Preview Builds

For internal testing:

```bash
# iOS Preview Build
eas build --platform ios --profile preview

# Android Preview Build
eas build --platform android --profile preview
```

### Production Builds

For app store submission:

```bash
# iOS Production Build
eas build --platform ios --profile production

# Android Production Build
eas build --platform android --profile production
```

### Build Both Platforms

```bash
# Build for both iOS and Android
eas build --platform all --profile production
```

## Local Development

### Running on Expo Go

```bash
# Start development server
npm start

# For specific platforms
npm run ios     # iOS Simulator
npm run android # Android Emulator
npm run web     # Web browser
```

### Development Build Testing

1. **Install Development Build on Device:**
   - Download from EAS build dashboard
   - Install on device

2. **Start Dev Server:**
   ```bash
   npx expo start --dev-client
   ```

## App Store Submission

### iOS App Store

1. **Build Production Version:**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Submit to App Store:**
   ```bash
   eas submit --platform ios
   ```

3. **Manual Steps:**
   - Create app listing in App Store Connect
   - Add screenshots, description, keywords
   - Set pricing and availability
   - Submit for review

### Google Play Store

1. **Build Production Version:**
   ```bash
   eas build --platform android --profile production
   ```

2. **Submit to Play Store:**
   ```bash
   eas submit --platform android
   ```

3. **Manual Steps:**
   - Create app listing in Google Play Console
   - Add store listing assets
   - Set content rating
   - Submit for review

## Troubleshooting

### Common Issues

1. **Firebase Configuration Errors:**
   - Ensure Firebase files are in root directory
   - Check bundle IDs match Firebase project
   - Verify Firebase plugins in app.json

2. **Build Failures:**
   - Check EAS build logs for specific errors
   - Ensure all dependencies are compatible
   - Verify signing certificates

3. **React Native Firebase Issues:**
   - Disable new architecture if having issues (`"newArchEnabled": false`)
   - Check React Native Firebase version compatibility

### Useful Commands

```bash
# Check build status
eas build:list

# View build logs
eas build:view [build-id]

# Clear EAS cache
eas build --clear-cache

# Check project info
eas project:info
```

## Security Notes

- Never commit `.env` files or service account keys
- Use EAS Secrets for sensitive environment variables
- Regularly rotate API keys and certificates
- Keep Firebase configuration files secure

## Additional Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [React Native Firebase Documentation](https://rnfirebase.io/)
- [App Store Guidelines](https://developer.apple.com/app-store/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)