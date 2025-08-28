// Script to create test account for production testing
// Run with: node scripts/create-test-account.js

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, addDoc, collection, serverTimestamp } = require('firebase/firestore');

// Firebase configuration for production
const firebaseConfig = {
  apiKey: "AIzaSyCJP2evMxm1_lX-Hdf6C4sV_nO0c89DL00",
  authDomain: "kiddo-quest-de7b0.firebaseapp.com",
  projectId: "kiddo-quest-de7b0",
  storageBucket: "kiddo-quest-de7b0.firebasestorage.app",
  messagingSenderId: "303359892497",
  appId: "1:303359892497:web:4c9ac1ede46cc8d7d6e5b0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createTestAccount() {
  const timestamp = new Date().getTime();
  const testEmail = `test${timestamp}@kiddoquest.com`;
  const testPassword = 'TestKiddo123!';
  
  try {
    console.log('🔧 Creating test account...');
    
    let userId;
    
    try {
      // Try to create the user
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      userId = userCredential.user.uid;
      console.log('✅ Test account created:', userId);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('ℹ️ Test account already exists, signing in...');
        const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
        userId = userCredential.user.uid;
        console.log('✅ Signed in successfully:', userId);
      } else {
        throw error;
      }
    }
    
    // Create/update user document in Firestore
    await setDoc(doc(db, 'users', userId), {
      email: testEmail,
      createdAt: serverTimestamp(),
      isAdmin: false,
      status: 'active',
      role: 'parent',
      hasCompletedTutorial: true
    }, { merge: true });
    
    console.log('✅ User document created/updated');
    
    // Create test child profiles
    const childProfiles = [
      { name: 'Alice', avatar: '👧', xp: 50, theme: 'princess' },
      { name: 'Bob', avatar: '👦', xp: 30, theme: 'superhero' }
    ];
    
    for (const child of childProfiles) {
      const childRef = await addDoc(collection(db, 'childProfiles'), {
        ...child,
        parentId: userId,
        createdAt: serverTimestamp()
      });
      console.log(`✅ Created child profile: ${child.name} (${childRef.id})`);
    }
    
    // Create test quests
    const quests = [
      {
        title: 'Clean Your Room',
        description: 'Make your bed and tidy up toys',
        xp: 10,
        status: 'new',
        type: 'recurring',
        frequency: 'daily',
        iconName: 'Home',
        assignedTo: []
      },
      {
        title: 'Brush Teeth',
        description: 'Brush your teeth for 2 minutes',
        xp: 5,
        status: 'new',
        type: 'recurring',
        frequency: 'daily',
        iconName: 'Smile',
        assignedTo: []
      },
      {
        title: 'Read a Book',
        description: 'Read for 15 minutes',
        xp: 15,
        status: 'new',
        type: 'one-time',
        iconName: 'BookOpen',
        assignedTo: []
      }
    ];
    
    for (const quest of quests) {
      const questRef = await addDoc(collection(db, 'quests'), {
        ...quest,
        parentId: userId,
        createdAt: serverTimestamp()
      });
      console.log(`✅ Created quest: ${quest.title} (${questRef.id})`);
    }
    
    // Create test rewards
    const rewards = [
      {
        title: 'Extra Screen Time',
        description: '30 minutes of tablet/TV time',
        cost: 20,
        status: 'available',
        iconName: 'Monitor',
        assignedTo: []
      },
      {
        title: 'Ice Cream Treat',
        description: 'Choose your favorite ice cream',
        cost: 30,
        status: 'available',
        iconName: 'Gift',
        assignedTo: []
      },
      {
        title: 'Stay Up Late',
        description: 'Stay up 30 minutes past bedtime',
        cost: 40,
        status: 'available',
        iconName: 'Moon',
        assignedTo: []
      }
    ];
    
    for (const reward of rewards) {
      const rewardRef = await addDoc(collection(db, 'rewards'), {
        ...reward,
        parentId: userId,
        createdAt: serverTimestamp()
      });
      console.log(`✅ Created reward: ${reward.title} (${rewardRef.id})`);
    }
    
    console.log('\n🎉 Test account setup complete!');
    console.log('=====================================');
    console.log('📧 Email:', testEmail);
    console.log('🔑 Password:', testPassword);
    console.log('🌐 URL: https://kiddo-quest-de7b0.web.app/');
    console.log('=====================================');
    console.log('\nTest data created:');
    console.log('- 2 child profiles (Alice & Bob)');
    console.log('- 3 quests (2 daily, 1 one-time)');
    console.log('- 3 rewards');
    console.log('\nYou can now test the app with this account!');
    
  } catch (error) {
    console.error('❌ Error creating test account:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

createTestAccount().then(() => {
  console.log('\n✅ Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
