# KiddoQuest Complete Deployment Guide

This comprehensive guide covers deploying all components of the KiddoQuest ecosystem: web app, mobile apps, Firebase functions, and marketing homepage.

## Project Structure Overview

```
kq_v0.5/
├── Kiddo_Quest/               # Main web application (React)
├── KiddoQuest_mobile/         # Mobile application (React Native/Expo)
├── marketing-homepage/        # Marketing website (Static HTML)
├── functions/                 # Firebase Cloud Functions
└── DEPLOYMENT_GUIDE.md       # This guide
```

## Prerequisites

### Required Accounts
- Firebase project with Blaze plan (for Cloud Functions)
- Amazon Associates account + Product Advertising API access
- Apple Developer Account ($99/year)
- Google Play Console Account ($25 one-time)
- Domain name (optional but recommended)

### Required Tools
```bash
# Core tools
npm install -g firebase-tools @expo/cli eas-cli

# Verify installations
firebase --version
expo --version
eas --version
```

## Phase 1: Firebase Setup & Security

### 1.1 Configure Firebase Project

```bash
# Login to Firebase
firebase login

# Initialize project (if not already done)
cd Kiddo_Quest/
firebase init

# Select:
# - Firestore
# - Functions  
# - Hosting
# - Storage
```

### 1.2 Set Up Environment Variables

**Web App (.env):**
```bash
cd Kiddo_Quest/
cp .env.example .env
# Fill in your Firebase credentials
```

**Mobile App (.env):**
```bash
cd KiddoQuest_mobile/
cp .env.example .env
# Fill in your Expo and Firebase credentials
```

### 1.3 Deploy Security Rules

```bash
cd Kiddo_Quest/
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### 1.4 Set Up First Admin User

```bash
# Update scripts/setup-admin.js with actual user UID
node scripts/setup-admin.js
```

## Phase 2: Amazon Integration

### 2.1 Set Up Amazon Product Advertising API

1. **Get API Credentials:**
   - Apply for Amazon Associates account
   - Apply for Product Advertising API access
   - Obtain: Access Key, Secret Key, Partner Tag

2. **Configure Firebase Functions:**
```bash
cd Kiddo_Quest/
firebase functions:config:set amazon.access_key="YOUR_ACCESS_KEY"
firebase functions:config:set amazon.secret_key="YOUR_SECRET_KEY" 
firebase functions:config:set amazon.partner_tag="YOUR_PARTNER_TAG"
firebase functions:config:set amazon.region="us-east-1"
```

3. **Deploy Functions:**
```bash
cd functions/
npm install
cd ..
firebase deploy --only functions
```

## Phase 3: Web Application Deployment

### 3.1 Build and Deploy Web App

```bash
cd Kiddo_Quest/
npm install
npm run build
firebase deploy --only hosting
```

### 3.2 Set Up Custom Domain (Optional)

```bash
# Add custom domain in Firebase Console
firebase hosting:sites:list
# Follow Firebase Console instructions for domain verification
```

### 3.3 Configure Environment-Specific Builds

**Production:**
```bash
NODE_ENV=production npm run build
firebase deploy --only hosting --project production
```

**Staging:**
```bash
NODE_ENV=staging npm run build  
firebase deploy --only hosting --project staging
```

## Phase 4: Mobile App Deployment

### 4.1 Configure EAS Build

```bash
cd KiddoQuest_mobile/
eas login
eas build:configure
```

### 4.2 Update Firebase Configuration Files

Replace placeholder files with real Firebase config:
- `google-services.json` (Android)
- `GoogleService-Info.plist` (iOS)

Download from Firebase Console > Project Settings > Your Apps.

### 4.3 Development Builds

```bash
# Build for testing
eas build --platform all --profile development
```

### 4.4 Production Builds

```bash
# iOS Production Build
eas build --platform ios --profile production

# Android Production Build  
eas build --platform android --profile production
```

### 4.5 App Store Submission

**iOS App Store:**
```bash
# Submit to App Store
eas submit --platform ios

# Manual steps in App Store Connect:
# - Create app listing
# - Add screenshots and metadata
# - Submit for review
```

**Google Play Store:**
```bash
# Submit to Play Store
eas submit --platform android

# Manual steps in Play Console:
# - Create app listing  
# - Add store assets
# - Submit for review
```

## Phase 5: Marketing Homepage Deployment

### 5.1 Deploy to Netlify

```bash
# Option 1: Drag and drop in Netlify Dashboard
# Option 2: Git integration
cd marketing-homepage/
git init
git add .
git commit -m "Initial homepage"
# Connect to Netlify via Git
```

### 5.2 Configure Custom Domain

```bash
# In Netlify Dashboard:
# - Domain settings > Add custom domain
# - Configure DNS records
# - Enable HTTPS
```

### 5.3 Add Contact Form (Optional)

```html
<!-- Add to index.html -->
<form name="contact" method="POST" data-netlify="true">
  <input type="email" name="email" placeholder="Your email" required>
  <textarea name="message" placeholder="Your message" required></textarea>
  <button type="submit">Send Message</button>
</form>
```

## Phase 6: Testing & Quality Assurance

### 6.1 Web App Testing

```bash
cd Kiddo_Quest/
npm run test
npm run test:e2e
```

### 6.2 Mobile App Testing

```bash
cd KiddoQuest_mobile/
npm test
# Test on physical devices using development builds
```

### 6.3 End-to-End Testing

1. **User Registration Flow**
2. **Amazon Product Search**
3. **Quest Creation & Completion**
4. **Reward Redemption**
5. **Multi-device Sync**

## Phase 7: Monitoring & Analytics

### 7.1 Set Up Firebase Analytics

```bash
# Enable in Firebase Console
# - Analytics
# - Performance Monitoring
# - Crashlytics (mobile)
```

### 7.2 Set Up Error Monitoring

```bash
# Web app
npm install @sentry/react

# Mobile app  
expo install sentry-expo
```

### 7.3 Monitor Usage

```bash
# Firebase Console:
# - Analytics Dashboard
# - Performance tab
# - Usage and billing
```

## Phase 8: Backup & Security

### 8.1 Database Backups

```bash
# Set up automated backups in Firebase Console
# - Firestore > Backup
# - Schedule daily backups
```

### 8.2 Security Monitoring

```bash
# Regular security checks:
firebase projects:list
firebase auth:export backup.json
```

### 8.3 API Key Rotation

**Quarterly rotation schedule:**
1. Amazon API keys
2. Firebase API keys
3. Any third-party service keys

## Troubleshooting Common Issues

### Build Failures

```bash
# Clear all caches
rm -rf node_modules package-lock.json
npm install

# Expo cache
expo r -c

# EAS cache
eas build --clear-cache
```

### Authentication Issues

```bash
# Check Firebase Auth settings
# Verify authorized domains
# Check security rules
```

### Performance Issues

```bash
# Analyze bundle size
npm run build -- --analyze

# Mobile performance
# Use React DevTools Profiler
```

## Post-Deployment Checklist

### Immediate (Day 1)
- [ ] Web app loads and functions correctly
- [ ] Mobile apps approved and published
- [ ] Amazon integration working
- [ ] Email notifications working
- [ ] Analytics tracking enabled

### Short Term (Week 1)
- [ ] User feedback collected
- [ ] Performance metrics reviewed
- [ ] Error rates under 1%
- [ ] App store ratings monitored

### Long Term (Month 1)
- [ ] User acquisition metrics
- [ ] Feature usage analytics
- [ ] Cost monitoring and optimization
- [ ] Security audit completed

## Support & Maintenance

### Regular Tasks
- **Weekly:** Monitor error logs and user feedback
- **Monthly:** Update dependencies and security patches  
- **Quarterly:** Review analytics and plan features
- **Annually:** Renew certificates and developer accounts

### Emergency Procedures
1. **App Store Rejection:** Review guidelines and resubmit
2. **Critical Bug:** Deploy hotfix and notify users
3. **Security Issue:** Rotate keys and audit access
4. **API Limits:** Monitor usage and upgrade plans

## Cost Estimation

### Monthly Operating Costs
- Firebase Blaze Plan: $0-25 (depending on usage)
- Apple Developer: $8.25/month ($99/year)
- Google Play: $2.08/month ($25 one-time)
- Domain: $1-2/month
- **Total: ~$11-35/month**

### One-Time Setup Costs
- Developer accounts: $124
- Domain registration: $10-15/year
- SSL certificates: Free (Let's Encrypt)

This guide provides a complete roadmap for deploying KiddoQuest across all platforms. Follow each phase sequentially for the best results.