# KiddoQuest - Family Chore Management System

Transform daily chores into exciting adventures with KiddoQuest. A comprehensive family app that motivates children through gamification, rewards, and progress tracking.

## 🌟 Overview

KiddoQuest is a full-stack application ecosystem consisting of:
- **Web Application** (React + Firebase)
- **Mobile Apps** (React Native + Expo)
- **Marketing Homepage** (Static HTML)
- **Cloud Functions** (Firebase Functions)
- **Amazon Integration** (Product Advertising API)

## 🚀 Features

### Core Functionality
- ✅ **Quest System** - Turn chores into engaging quests with points and rewards
- ✅ **Multi-Child Support** - Manage multiple children with individual profiles
- ✅ **Reward Store** - Real Amazon product integration for reward redemption
- ✅ **Progress Tracking** - Monitor completion rates and achievements
- ✅ **Family Collaboration** - Parents and children working together
- ✅ **Cross-Platform** - Web, iOS, Android, and PWA support

### Security & Privacy
- ✅ **Role-Based Access Control** - Admin, parent, and child roles
- ✅ **Secure Authentication** - Firebase Auth with proper session management
- ✅ **Data Protection** - Encrypted PIN storage with bcrypt
- ✅ **Privacy First** - COPPA-compliant design for children

### Technical Features
- ✅ **Real-time Sync** - Firestore real-time database
- ✅ **Offline Support** - Works without internet connection
- ✅ **Push Notifications** - Quest reminders and celebrations
- ✅ **Amazon Integration** - Browse and add real products as rewards
- ✅ **Analytics** - Usage tracking and performance monitoring

## 📁 Project Structure

```
kq_v0.5/
├── Kiddo_Quest/                 # Web Application (React)
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── screens/             # Main application screens
│   │   ├── utils/               # Helper functions and utilities
│   │   └── store.js             # Zustand state management
│   ├── functions/               # Firebase Cloud Functions
│   ├── public/                  # Static assets
│   └── package.json
│
├── KiddoQuest_mobile/           # Mobile Application (React Native)
│   ├── src/
│   │   ├── components/          # Mobile-optimized components
│   │   ├── screens/             # Mobile screens
│   │   ├── navigation/          # Navigation configuration
│   │   ├── store/               # Mobile state management
│   │   └── utils/               # Cross-platform utilities
│   ├── google-services.json     # Android Firebase config
│   ├── GoogleService-Info.plist # iOS Firebase config
│   └── app.json                 # Expo configuration
│
├── marketing-homepage/          # Marketing Website
│   └── index.html               # Landing page
│
├── KiddoQuest_expo/            # Expo template (unused)
├── KiddoQuest_expo_web/        # Expo web template (unused)
│
└── Documentation/
    ├── README.md               # This file
    ├── DEPLOYMENT_GUIDE.md     # Deployment instructions
    └── BUILD_GUIDE.md          # Mobile build instructions
```

## 🛠 Technology Stack

### Frontend
- **Web**: React 19.1.0 + Tailwind CSS
- **Mobile**: React Native 0.79.4 + Expo 53.0.12
- **State Management**: Zustand 5.0.4
- **Navigation**: React Navigation 7.x

### Backend
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Functions**: Firebase Cloud Functions (Node.js 18)

### Third-Party Integrations
- **Amazon**: Product Advertising API 5.0
- **Email**: Nodemailer with Gmail SMTP
- **Analytics**: Firebase Analytics
- **Monitoring**: Firebase Performance

### Development Tools
- **Build System**: Expo Application Services (EAS)
- **Testing**: Playwright (E2E), Jest (Unit)
- **Deployment**: Firebase Hosting, Netlify
- **CI/CD**: GitHub Actions (optional)

## 🏁 Quick Start

### Prerequisites
```bash
# Required software
Node.js >= 18.0.0
npm >= 8.0.0

# Development tools
npm install -g firebase-tools @expo/cli eas-cli
```

### 1. Clone and Setup
```bash
git clone <repository-url>
cd kq_v0.5
```

### 2. Web Application Setup
```bash
cd Kiddo_Quest/
npm install
cp .env.example .env
# Fill in your Firebase credentials in .env

# Start development server
npm start
```

### 3. Mobile Application Setup
```bash
cd KiddoQuest_mobile/
npm install
cp .env.example .env
# Fill in your Expo and Firebase credentials

# Start development server
npm start
```

### 4. Firebase Setup
```bash
cd Kiddo_Quest/
firebase login
firebase use --add  # Select your Firebase project
firebase deploy --only firestore:rules
firebase deploy --only functions
```

## 🔧 Configuration

### Environment Variables

**Web App (.env):**
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Amazon Product Advertising API
REACT_APP_AMAZON_ACCESS_KEY=your_access_key
REACT_APP_AMAZON_SECRET_KEY=your_secret_key
REACT_APP_AMAZON_PARTNER_TAG=your_partner_tag
```

**Mobile App (.env):**
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Firebase Configuration
```bash
# Set Amazon API credentials for Cloud Functions
firebase functions:config:set amazon.access_key="YOUR_ACCESS_KEY"
firebase functions:config:set amazon.secret_key="YOUR_SECRET_KEY"
firebase functions:config:set amazon.partner_tag="YOUR_PARTNER_TAG"
firebase functions:config:set amazon.region="us-east-1"
```

## 🧪 Testing

### Web Application
```bash
cd Kiddo_Quest/
npm test                    # Unit tests
npm run test:e2e           # End-to-end tests
npm run test:e2e:ui        # Interactive E2E tests
```

### Mobile Application
```bash
cd KiddoQuest_mobile/
npm test                   # Unit tests
expo start                 # Test in Expo Go app
```

## 🚀 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

### Quick Deploy

**Web Application:**
```bash
cd Kiddo_Quest/
npm run build
firebase deploy
```

**Mobile Applications:**
```bash
cd KiddoQuest_mobile/
eas build --platform all --profile production
eas submit --platform all
```

## 📱 Mobile App Features

### Implemented Screens
- ✅ **Home Screen** - Landing page with features overview
- ✅ **Login Screen** - Email/password authentication
- ✅ **Registration Screen** - New user signup
- ✅ **Parent Dashboard** - Main parent interface
- ✅ **Child Dashboard** - Kid-friendly quest interface
- ✅ **Manage Quests** - Create, edit, delete quests
- ✅ **Quest Form** - Add/edit individual quests

### In Progress
- 🔄 **Add Child Screen** - Add new child profiles
- 🔄 **Edit Child Screen** - Modify child settings
- 🔄 **Reward Management** - Create and manage rewards
- 🔄 **Settings Screen** - App preferences

## 🛡 Security Features

### Authentication
- Email/password authentication with Firebase Auth
- Secure session management with automatic token refresh
- Role-based access control (admin, parent, child)

### Data Protection
- Firestore security rules preventing unauthorized access
- PIN protection with bcrypt hashing (not Base64)
- Environment variable protection for API keys
- No hardcoded credentials in source code

### Privacy Compliance
- COPPA-compliant data handling for children
- Minimal data collection
- Secure data transmission (HTTPS/TLS)
- Optional data deletion capabilities

## 🔌 API Integrations

### Amazon Product Advertising API
- Real product search and browsing
- Product information retrieval (title, price, images)
- Direct Amazon purchase links
- Fallback to mock data when API unavailable

### Firebase Services
- **Firestore**: Real-time database for quests, rewards, users
- **Auth**: User authentication and session management
- **Storage**: Image and file storage
- **Functions**: Server-side logic and API proxying
- **Hosting**: Web application deployment

## 🎨 UI/UX Design

### Design System
- **Colors**: Indigo primary, amber secondary, semantic colors
- **Typography**: Inter font family with clear hierarchy
- **Components**: Consistent button, input, card components
- **Accessibility**: Screen reader support, keyboard navigation

### Mobile-First Design
- Responsive layouts for all screen sizes
- Touch-optimized interactions
- Native platform conventions (iOS/Android)
- Smooth animations and transitions

## 📈 Analytics & Monitoring

### Performance Monitoring
- Firebase Performance for web and mobile
- Bundle size analysis and optimization
- Database query optimization
- Error tracking and reporting

### User Analytics
- Firebase Analytics for user behavior
- Quest completion rates
- Feature usage statistics
- Retention and engagement metrics

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- **JavaScript/TypeScript**: ESLint + Prettier
- **React**: Functional components with hooks
- **Testing**: Jest for unit, Playwright for E2E
- **Documentation**: JSDoc for functions, README for features

## 🐛 Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Clear all caches
rm -rf node_modules package-lock.json
npm install

# Expo specific
expo r -c
```

**Firebase Auth Issues:**
- Check authorized domains in Firebase Console
- Verify API keys in environment variables
- Ensure Firestore rules allow user operations

**Mobile App Issues:**
- Update Expo CLI: `npm install -g @expo/cli@latest`
- Clear Metro cache: `npx expo start -c`
- Check React Native Firebase compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Firebase team for excellent backend services
- Expo team for React Native development tools
- Amazon for Product Advertising API
- React and React Native communities
- Tailwind CSS for utility-first styling

## 📞 Support

For questions, issues, or feature requests:
- 📧 Email: support@kiddoquest.app
- 🐛 Issues: [GitHub Issues](link-to-issues)
- 📖 Documentation: [Wiki](link-to-wiki)

---

**KiddoQuest** - Making chores fun for the whole family! 🎮👨‍👩‍👧‍👦