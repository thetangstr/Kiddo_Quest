// Setup script to create test account for UAT testing
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://kiddo-quest-de7b0.firebaseio.com"
});

const db = admin.firestore();
const auth = admin.auth();

async function setupTestAccount() {
  const testEmail = 'test1756485868624@kiddoquest.com';
  const testPassword = 'TestKiddo123!';
  
  try {
    console.log('Setting up test account...');
    
    // Delete user if exists
    try {
      const existingUser = await auth.getUserByEmail(testEmail);
      await auth.deleteUser(existingUser.uid);
      console.log('Deleted existing user');
    } catch (error) {
      console.log('User does not exist, creating new one');
    }
    
    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email: testEmail,
      password: testPassword,
      emailVerified: true
    });
    
    console.log('Created Firebase Auth user:', userRecord.uid);
    
    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: testEmail,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active',
      role: 'parent',
      isAdmin: false
    });
    
    console.log('Created user document in Firestore');
    
    // Create test child profiles
    const aliceChild = await db.collection('childProfiles').add({
      parentId: userRecord.uid,
      name: 'Alice',
      age: 8,
      avatar: '👧',
      xp: 150,
      level: 2,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const bobChild = await db.collection('childProfiles').add({
      parentId: userRecord.uid,
      name: 'Bob',
      age: 10,
      avatar: '👦',
      xp: 200,
      level: 3,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Created child profiles:', { alice: aliceChild.id, bob: bobChild.id });
    
    // Create test quests
    const quests = [
      {
        parentId: userRecord.uid,
        title: 'Make Your Bed',
        description: 'Make your bed neatly every morning',
        xpReward: 10,
        frequency: 'daily',
        assignedChildren: [aliceChild.id, bobChild.id],
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        parentId: userRecord.uid,
        title: 'Clean Your Room',
        description: 'Tidy up your room and put toys away',
        xpReward: 25,
        frequency: 'weekly',
        assignedChildren: [aliceChild.id],
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        parentId: userRecord.uid,
        title: 'Help with Dishes',
        description: 'Help load or unload the dishwasher',
        xpReward: 15,
        frequency: 'daily',
        assignedChildren: [bobChild.id],
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    for (const quest of quests) {
      const questDoc = await db.collection('quests').add(quest);
      console.log('Created quest:', questDoc.id, '-', quest.title);
    }
    
    // Create test rewards
    const rewards = [
      {
        parentId: userRecord.uid,
        name: '30 Minutes Extra Screen Time',
        description: 'Extra 30 minutes of TV or games',
        xpCost: 50,
        assignedChildren: [aliceChild.id, bobChild.id],
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        parentId: userRecord.uid,
        name: 'Choose Family Movie',
        description: 'Pick what movie the family watches',
        xpCost: 75,
        assignedChildren: [aliceChild.id, bobChild.id],
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        parentId: userRecord.uid,
        name: 'Special Treat',
        description: 'Pick a special snack or dessert',
        xpCost: 100,
        assignedChildren: [bobChild.id],
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    for (const reward of rewards) {
      const rewardDoc = await db.collection('rewards').add(reward);
      console.log('Created reward:', rewardDoc.id, '-', reward.name);
    }
    
    console.log('\\n✅ Test account setup completed successfully!');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    console.log('Children: Alice (8 years), Bob (10 years)');
    console.log('Sample quests and rewards created');
    
  } catch (error) {
    console.error('Error setting up test account:', error);
  } finally {
    process.exit(0);
  }
}

setupTestAccount();