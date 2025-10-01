# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KiddoQuest is a family chore management system with multiple deployment targets:
- **Web Application**: React app with Firebase backend (`Kiddo_Quest/`)
- **Mobile Application**: React Native/Expo app (`KiddoQuest_mobile/`)
- **Marketing Homepage**: Static HTML site (`marketing-homepage/`)
- **Cloud Functions**: Firebase Functions for backend logic (`Kiddo_Quest/functions/`)

## Development Commands

### Web Application (`Kiddo_Quest/`)
```bash
# Development
npm start                    # Start development server (port 3000)
npm run build               # Production build
npm test                    # Unit tests
npm run test:e2e           # End-to-end tests with Playwright
npm run test:e2e:ui        # Interactive E2E tests

# Deployment
npm run predeploy          # Runs E2E tests before deploy
npm run deploy             # Build and deploy to Firebase
firebase deploy            # Deploy to Firebase hosting
firebase deploy --only functions  # Deploy only Cloud Functions
```

### Mobile Application (`KiddoQuest_mobile/`)
```bash
# Development
npm start                  # Start Expo development server
npm run ios               # Run on iOS simulator
npm run android           # Run on Android emulator
npm run web               # Run in web browser

# Building
eas build --platform ios --profile development     # iOS dev build
eas build --platform android --profile development # Android dev build
eas build --platform all --profile production      # Production builds
eas submit --platform all                          # Submit to app stores
```

### Firebase Functions (`Kiddo_Quest/functions/`)
```bash
npm install               # Install function dependencies
npm run lint             # Lint functions code
firebase functions:config:get  # View environment config
firebase deploy --only functions  # Deploy functions only
```

## Architecture Overview

### State Management
- **Web**: Zustand store (`Kiddo_Quest/src/store.js`) - centralized global state
- **Mobile**: Zustand store (`KiddoQuest_mobile/src/store/useStore.ts`) - persisted with AsyncStorage

### Firebase Integration
- **Authentication**: Firebase Auth with email/password and Google OAuth
- **Database**: Firestore for real-time data sync
- **Storage**: Firebase Storage for images (avatars, quest/reward images)
- **Functions**: Node.js functions for Amazon API integration and server-side logic

### Core Data Models
- **Users**: Parent/admin accounts with role-based access
- **Child Profiles**: Individual child accounts with XP tracking
- **Quests**: Tasks with XP rewards (one-time or recurring)
- **Rewards**: Redeemable items using earned XP
- **Completions**: Quest completion tracking for recurring quests

### Key Features
- **Role-based Access**: Admin, parent, and child user types
- **Amazon Integration**: Product search via Amazon Product Advertising API
- **PIN Security**: Bcrypt-hashed PINs for parent verification
- **Real-time Sync**: Firestore real-time listeners for live updates
- **Cross-platform**: Shared component patterns between web and mobile

## File Structure

```
Kiddo_Quest/                    # Web application
├── src/
│   ├── store.js               # Zustand global state management
│   ├── firebase.js            # Firebase configuration
│   ├── components/            # Reusable UI components
│   ├── screens/               # Main application screens
│   ├── utils/                 # Helper functions and utilities
│   └── styles/                # CSS and styling
├── functions/                 # Firebase Cloud Functions
├── tests/                     # Playwright E2E tests
└── public/                    # Static assets

KiddoQuest_mobile/             # Mobile application
├── src/
│   ├── store/useStore.ts      # Mobile-specific Zustand store
│   ├── utils/firebase.ts      # Firebase configuration for mobile
│   ├── components/            # Mobile-optimized components
│   ├── screens/               # Mobile screens
│   └── navigation/            # React Navigation setup
├── app.json                   # Expo configuration
├── eas.json                   # EAS Build configuration
└── google-services.json       # Firebase Android config
```

## Development Patterns

### State Management Patterns
- Actions are async and update both Firestore and local state
- Loading states (`isLoadingData`, `isLoadingAuth`) for UX feedback
- Error handling with try/catch and state updates
- PIN verification flows for sensitive parent actions

### Firebase Patterns
- Use `serverTimestamp()` for consistent timestamps
- Query with `where()` clauses for parent-scoped data
- Real-time listeners for live updates (web app)
- Offline support with Firestore persistence

### Component Patterns
- Shared component library between web and mobile where possible
- Responsive design with Tailwind CSS (web) and NativeWind (mobile)
- Accessibility support with proper ARIA labels and screen reader support

## Testing Strategy

### E2E Testing (Web)
- Playwright tests in `Kiddo_Quest/tests/`
- Test files named `*.spec.js`
- Run with `npm run test:e2e`
- Base URL: `http://localhost:3000`

### Mobile Testing
- Development builds for device testing
- Expo Go for quick iteration
- EAS Build for production-like testing

## Environment Configuration

### Required Environment Variables
**Web App (.env)**:
- `REACT_APP_FIREBASE_*` - Firebase configuration
- `REACT_APP_AMAZON_*` - Amazon Product Advertising API

**Mobile App (.env)**:
- `EXPO_PUBLIC_FIREBASE_*` - Firebase configuration

### Firebase Configuration
- Development and production environments supported
- Cloud Functions environment config for API keys
- Security rules for data access control

## Common Development Tasks

### Adding New Features
1. Update data models in Firestore if needed
2. Add actions to appropriate Zustand store
3. Create UI components following existing patterns
4. Add tests for critical user flows
5. Update security rules if new data access patterns

### Debugging Firebase Issues
1. Check Firebase Console for quota limits and errors
2. Verify security rules allow intended operations
3. Check network tab for failed requests
4. Use Firebase emulator for local development

### Amazon Integration
- Product search handled via Firebase Functions
- Fallback to mock data when API unavailable
- Partner tag required for affiliate links

## Security Considerations

- Role-based access control (admin/parent/child)
- PIN protection with bcrypt hashing (not Base64)
- Environment variables for sensitive data
- Firestore security rules prevent unauthorized access
- COPPA-compliant data handling for children

## Deployment Process

### Automated CI/CD (GitHub Actions)

#### Web Application
- **Beta**: Push to `develop` → Auto-deploy to https://kiddo-quest-beta.web.app
- **Production**: Push to `main` → Auto-deploy to https://kiddo-quest-de7b0.web.app

#### Mobile Application  
- **Beta**: Push to `develop` → Auto-build & deploy to TestFlight/Play Console (Beta)
- **Production**: Push to `main` → Auto-build & submit to App Store/Play Store

#### Manual Deployment
1. **Web**: Run E2E tests → Build → Deploy to Firebase Hosting
2. **Mobile**: EAS Build → Submit to app stores
3. **Functions**: Deploy with `firebase deploy --only functions`

### CI/CD Configuration
- **Web Workflows**: `.github/workflows/deploy-beta.yml`, `deploy-prod.yml`
- **Mobile Workflows**: `.github/workflows/deploy-mobile-beta.yml`, `deploy-mobile-prod.yml`
- **Required Secrets**: `FIREBASE_TOKEN` (service account JSON), `EXPO_TOKEN`

Use deployment guides in `DEPLOYMENT_GUIDE.md`, `KiddoQuest_mobile/BUILD_GUIDE.md`, and `MOBILE_CI_CD_SETUP.md` for detailed instructions.