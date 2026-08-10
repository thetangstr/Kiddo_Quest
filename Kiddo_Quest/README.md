# Kiddo Quest

> ## ⚠️ DEPRECATED — do not deploy
>
> This is the **old Firebase/Create React App version** of KiddoQuest (Firebase project `kiddo-quest-de7b0`). It was replaced by the self-hosted NAS app (Express + Vite + SQLite, served at `192.168.86.31:8088`), which is the live product and shares **no** code or data with this version.
>
> - The Firebase deploy pipelines for this app have been removed (KQ-4). Pushing to GitHub no longer deploys anything.
> - `firestore.rules` / `storage.rules` here are retained for reference only, pending archival of the Firebase project.
> - Kept in git for history. Do not merge changes from here into the NAS app.

## 🌟 Features

### User Management
- Parent and child user modes
- Multiple child profiles can be managed by a parent
- User authentication via Firebase

### Quest System
- Parents can create quests (tasks) for children
- Quests have titles, descriptions, XP rewards, and optional images
- Quests can be one-time or recurring
- Children can claim quests when completed
- Parents can verify quest completion

### Reward System
- Children earn XP by completing quests
- Parents can create rewards that children can redeem with earned XP
- Rewards have titles, descriptions, XP costs, and optional images
- Celebration effects (confetti) when rewards are claimed

### Dashboard & UI
- Child dashboard showing available quests, XP balance, and available rewards
- Parent dashboard for managing quests, rewards, and verifying completions
- XP progress bar for children to track their progress
- Mobile-responsive design

## 🚀 Technology Stack

- **Frontend**: React, Tailwind CSS, Zustand (state management)
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Deployment**: Firebase App Hosting

## 📋 Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Firebase account

## 🔧 Installation & Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/kiddo-quest.git
cd kiddo-quest
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure Firebase**

Create a Firebase project at [Firebase Console](https://console.firebase.google.com/) and enable:
- Authentication (Email/Password)
- Firestore Database
- Storage

Update the Firebase configuration in `src/firebase.js` with your project details:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

4. **Start the development server**

```bash
npm start
```

## 🚀 Deployment

### Deploy to Firebase App Hosting

1. **Install Firebase CLI**

```bash
npm install -g firebase-tools
```

2. **Login to Firebase**

```bash
firebase login
```

3. **Initialize Firebase in your project (if not already done)**

```bash
firebase init
```

Select Hosting, Firestore, and Storage options when prompted.

4. **Build the project**

```bash
npm run build
```

5. **Deploy to Firebase**

```bash
firebase deploy
```

## 📁 Project Structure

```
src/
├── components/         # Reusable UI components
├── screens/            # Application screens/pages
├── firebase.js         # Firebase configuration
├── store.js            # Zustand state management
├── App.js              # Main application component
└── index.js            # Application entry point
```

## 🔒 Security Rules

The application uses Firebase security rules to protect data:

- **Firestore Rules**: Ensures users can only access their own data
- **Storage Rules**: Controls access to uploaded images

## 📱 Using the Application

### Parent Mode
1. Register or log in as a parent
2. Add child profiles
3. Create quests and rewards
4. Verify completed quests

### Child Mode
1. Parent selects a child profile
2. Child views and claims quests
3. Child earns XP and redeems rewards

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [React](https://reactjs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Lucide Icons](https://lucide.dev/)
