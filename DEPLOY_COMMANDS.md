# 🚀 Deploy KiddoQuest - Execute These Commands

Your system is ready for deployment! Follow these commands in order.

## Step 1: Deploy Web Application to Firebase

### Login and Setup Firebase
```bash
cd /Users/Kailor_1/Desktop/Projects/kq_v0.5/Kiddo_Quest

# Login to Firebase (will open browser)
firebase login

# Select your project
firebase use kiddo-quest-de7b0
```

### Deploy Security Rules First
```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Verify rules deployed
firebase firestore:databases:list
```

### Deploy Cloud Functions
```bash
# Navigate to functions directory and install dependencies
cd functions
npm install
cd ..

# Deploy functions with Amazon integration
firebase deploy --only functions
```

### Build and Deploy Web App
```bash
# Install web app dependencies
npm install

# Build production version
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Your web app will be live at: https://kiddo-quest-de7b0.web.app
```

## Step 2: Test Web Deployment

Open your browser and visit: https://kiddo-quest-de7b0.web.app

Test these features:
- [ ] User registration works
- [ ] Login/logout functions
- [ ] Amazon product search (should show mock data initially)
- [ ] Quest creation and management
- [ ] Child profile creation

## Step 3: Build Mobile Apps

### Setup Mobile Build Environment
```bash
cd /Users/Kailor_1/Desktop/Projects/kq_v0.5/KiddoQuest_mobile

# Install dependencies
npm install

# Login to Expo account (create one at expo.dev if needed)
eas login
```

### Build Development Versions (for Testing)
```bash
# Build iOS development version
eas build --platform ios --profile development

# Build Android development version  
eas build --platform android --profile development
```

Wait for builds to complete (usually 10-15 minutes). You'll get download links to install on test devices.

### Build Production Versions (for App Stores)
```bash
# Build iOS production version
eas build --platform ios --profile production

# Build Android production version
eas build --platform android --profile production
```

## Step 4: Submit to App Stores

### iOS App Store
```bash
# Submit to TestFlight and App Store
eas submit --platform ios --latest
```

### Google Play Store
```bash
# Submit to Google Play Console
eas submit --platform android --latest
```

## Step 5: Deploy Marketing Homepage

### Option 1: Deploy to Netlify (Recommended)
1. Go to https://netlify.com
2. Drag and drop the `/marketing-homepage/` folder
3. Site will be live instantly with auto-generated URL

### Option 2: Deploy to Firebase Hosting
```bash
# Create new Firebase site for marketing
firebase hosting:sites:create kiddoquest-marketing

# Deploy marketing homepage
firebase deploy --only hosting:kiddoquest-marketing --public marketing-homepage
```

## Monitoring Your Deployment

### Check Web App Status
```bash
# View Firebase hosting status
firebase hosting:sites:list

# Check function logs
firebase functions:log

# Monitor Firestore usage
# Visit: https://console.firebase.google.com/project/kiddo-quest-de7b0/usage
```

### Check Mobile Build Status
```bash
# Check build status
eas build:list

# View specific build details
eas build:view [BUILD_ID]
```

## Post-Deployment Setup

### 1. Set Up Admin User
After web app is deployed, create your first admin user:

```bash
cd /Users/Kailor_1/Desktop/Projects/kq_v0.5/Kiddo_Quest

# Edit scripts/setup-admin.js with your user ID
# Get user ID from Firebase Console > Authentication after creating account
node scripts/setup-admin.js
```

### 2. Configure Amazon API (Optional)
If you have Amazon Product Advertising API access:

```bash
# Set Amazon API credentials for production
firebase functions:config:set amazon.access_key="YOUR_ACCESS_KEY"
firebase functions:config:set amazon.secret_key="YOUR_SECRET_KEY" 
firebase functions:config:set amazon.partner_tag="YOUR_PARTNER_TAG"
firebase functions:config:set amazon.region="us-east-1"

# Redeploy functions
firebase deploy --only functions
```

### 3. Configure Custom Domain (Optional)
1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Follow DNS setup instructions
4. Wait for SSL certificate provisioning

## Troubleshooting

### If Firebase deployment fails:
```bash
# Clear cache and retry
rm -rf node_modules package-lock.json
npm install
firebase deploy
```

### If mobile build fails:
```bash
# Clear EAS cache
eas build --clear-cache

# Check EAS build logs for specific errors
eas build:view [BUILD_ID]
```

### If authentication isn't working:
1. Check Firebase Console > Authentication > Settings > Authorized domains
2. Add your hosting domain if missing
3. Verify environment variables are set correctly

## Success Metrics

After deployment, you should have:

✅ **Web App**: Live at https://kiddo-quest-de7b0.web.app  
✅ **iOS App**: Built and ready for App Store submission  
✅ **Android App**: Built and ready for Play Store submission  
✅ **Marketing Site**: Live on Netlify or Firebase  
✅ **Cloud Functions**: Running Amazon integration  
✅ **Security**: All vulnerabilities fixed  

## Next Steps

1. **Test thoroughly** on all platforms
2. **Submit apps** to stores for review
3. **Set up analytics** monitoring
4. **Configure backups** for Firestore
5. **Plan feature updates** based on user feedback

Your KiddoQuest application is now ready for users! 🎉