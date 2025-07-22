# KiddoQuest Mobile Production Setup Guide

This guide covers the production setup required before deploying to app stores.

## Critical Security Changes Made

1. **Removed Hardcoded Firebase Credentials**
   - Removed fallback values from `src/utils/firebase.ts`
   - Now requires environment variables to be set

2. **Added Production Environment File**
   - Created `.env.production` with placeholder values
   - You MUST update with actual production values

## Android Production Keystore Setup

### Generate Production Keystore

```bash
cd android/app
keytool -genkey -v -keystore kiddoquest-release.keystore \
  -alias kiddoquest \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### Store Keystore Securely

1. **Save keystore password** in a secure password manager
2. **Backup keystore file** - You CANNOT recover if lost!
3. **Never commit** the keystore to version control

### Configure EAS for Production Keystore

```bash
# Let EAS manage your credentials
eas credentials

# Select Android → Production → Keystore
# Upload your keystore when prompted
```

## iOS Production Setup

### Configure App Store Connect

1. Create app in [App Store Connect](https://appstoreconnect.apple.com)
2. Set Bundle ID: `com.kiddoquest.app`
3. Configure app metadata:
   - App name
   - Description
   - Keywords
   - Screenshots
   - Privacy policy URL

### Set Up Code Signing

```bash
# EAS will handle certificates
eas credentials

# Select iOS → Production → Distribution Certificate
# Let EAS create and manage certificates
```

## Environment Variables Setup

### Update .env.production

```bash
# Replace placeholder values in .env.production
EXPO_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
EXPO_PUBLIC_FIREBASE_APP_ID=your_actual_app_id
```

### Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings
4. Copy configuration values
5. Update `.env.production`

## App Store Metadata

### Update app.json

Add these fields before submission:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.kiddoquest.app",
      "config": {
        "usesNonExemptEncryption": false
      },
      "infoPlist": {
        "NSCameraUsageDescription": "...",
        "NSPhotoLibraryUsageDescription": "..."
      }
    },
    "android": {
      "package": "com.kiddoquest.app",
      "versionCode": 1,
      "permissions": ["INTERNET", "CAMERA", ...]
    }
  }
}
```

## Production Checklist

### Before First Build

- [ ] Generate Android production keystore
- [ ] Upload keystore to EAS
- [ ] Configure iOS certificates in EAS
- [ ] Update `.env.production` with real values
- [ ] Add privacy policy URL
- [ ] Add terms of service URL
- [ ] Create app in App Store Connect
- [ ] Create app in Google Play Console

### Before Each Release

- [ ] Test on real devices
- [ ] Check crash reports
- [ ] Review app permissions
- [ ] Update version number
- [ ] Create release notes
- [ ] Test payment flows (if applicable)

## Build Commands

### Manual Production Build

```bash
# Build for both platforms
eas build --platform all --profile production

# Build iOS only
eas build --platform ios --profile production

# Build Android only  
eas build --platform android --profile production
```

### Submit to Stores

```bash
# Submit both platforms
eas submit --platform all

# Submit iOS only
eas submit --platform ios

# Submit Android only
eas submit --platform android
```

## Security Best Practices

1. **Never commit sensitive data**
   - Keep `.env.production` in `.gitignore`
   - Never commit keystores
   - Use EAS secrets for CI/CD

2. **Rotate credentials regularly**
   - Update API keys periodically
   - Rotate signing certificates before expiry

3. **Monitor production**
   - Set up crash reporting
   - Monitor Firebase usage
   - Track user analytics

## Troubleshooting

### Build Failures

1. Check EAS dashboard for detailed logs
2. Verify credentials are uploaded
3. Ensure environment variables are set
4. Check native dependencies

### Submission Failures

1. Verify app metadata is complete
2. Check screenshot requirements
3. Ensure privacy policy is accessible
4. Review platform-specific guidelines

---

For support:
- [EAS Documentation](https://docs.expo.dev/eas/)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Guidelines](https://play.google.com/console/about/guides/)