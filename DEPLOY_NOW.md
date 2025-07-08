# Deploy KiddoQuest to Production - Step-by-Step Guide

Follow these steps in order to deploy your application to production.

## Prerequisites Check

First, ensure you have the necessary tools installed:

```bash
# Check if Firebase CLI is installed
firebase --version

# Check if Node.js is installed (should be 18+)
node --version

# Check if EAS CLI is installed (for mobile builds)
eas --version
```

If any are missing, install them:
```bash
npm install -g firebase-tools eas-cli
```

## Step 1: Firebase Web App Deployment

### 1.1 Login to Firebase
```bash
cd /Users/Kailor_1/Desktop/Projects/kq_v0.5/Kiddo_Quest
firebase login
```

### 1.2 Select Your Firebase Project
```bash
# List available projects
firebase projects:list

# Select your project (replace with your actual project ID)
firebase use kiddo-quest-de7b0
```

### 1.3 Deploy Security Rules First
```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage
```

### 1.4 Deploy Cloud Functions
```bash
# Install function dependencies
cd functions
npm install
cd ..

# Deploy functions
firebase deploy --only functions
```

### 1.5 Build and Deploy Web App
```bash
# Install dependencies
npm install

# Build production version
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

Your web app should now be live at: https://kiddo-quest-de7b0.web.app

## Step 2: Mobile App Builds

### 2.1 Prepare Mobile App
```bash
cd /Users/Kailor_1/Desktop/Projects/kq_v0.5/KiddoQuest_mobile

# Install dependencies
npm install
```

### 2.2 Configure EAS Build
```bash
# Login to Expo account
eas login

# Initialize EAS Build (if not done)
eas build:configure
```

### 2.3 Create Development Builds (for Testing)
```bash
# iOS Development Build
eas build --platform ios --profile development

# Android Development Build  
eas build --platform android --profile development
```

### 2.4 Create Production Builds (for App Stores)
```bash
# iOS Production Build
eas build --platform ios --profile production

# Android Production Build
eas build --platform android --profile production
```

## Step 3: Test Your Deployments

### Web App Testing
1. Visit https://kiddo-quest-de7b0.web.app
2. Test login/registration
3. Test Amazon product search
4. Verify all features work

### Mobile App Testing
1. Download development builds from EAS dashboard
2. Install on test devices
3. Test all screens and features

## Step 4: App Store Submission

### iOS App Store
```bash
# Submit to TestFlight first
eas submit --platform ios --latest

# Then submit to App Store from App Store Connect
```

### Google Play Store
```bash
# Submit to internal testing track
eas submit --platform android --latest
```

## Common Issues & Solutions

### Issue: Firebase deployment fails
```bash
# Clear cache and retry
rm -rf node_modules package-lock.json
npm install
firebase deploy
```

### Issue: EAS build fails
```bash
# Clear cache
eas build --clear-cache --platform all
```

### Issue: Authentication not working
- Check Firebase Console > Authentication > Settings > Authorized domains
- Add your hosting URL if missing

## Monitoring Your Deployment

### Check Firebase Functions Logs
```bash
firebase functions:log
```

### Check Hosting Status
```bash
firebase hosting:sites:list
```

### Monitor Usage
- Visit Firebase Console > Usage and billing
- Check Firestore reads/writes
- Monitor function invocations

## Next Steps

1. **Set up custom domain** (optional)
   - Firebase Console > Hosting > Add custom domain

2. **Enable monitoring**
   - Firebase Console > Performance Monitoring
   - Firebase Console > Crashlytics (for mobile)

3. **Configure backups**
   - Firestore > Backups > Schedule daily backups

## Need Help?

If you encounter any issues during deployment:
1. Check the Firebase Console for error messages
2. Run `firebase deploy --debug` for detailed logs
3. Check EAS build logs at https://expo.dev

Remember to keep your API keys and credentials secure!