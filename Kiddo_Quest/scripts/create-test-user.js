const admin = require('firebase-admin');
const bcrypt = require('bcrypt');

// Initialize Firebase Admin (using existing service account)
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://kiddo-quest-de7b0.firebaseio.com"
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function createTestUser() {
  console.log('🧪 Creating test user for CRUD testing...');
  
  const testUserData = {
    email: 'crudtest@example.com',
    password: 'CRUDTest123!',
    displayName: 'CRUD Test User',
    pin: '1234' // For parent verification
  };
  
  try {
    // Check if user already exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(testUserData.email);
      console.log('📧 Test user already exists, using existing account...');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('🆕 Creating new test user...');
        
        // Create user in Firebase Auth
        userRecord = await auth.createUser({
          email: testUserData.email,
          password: testUserData.password,
          displayName: testUserData.displayName,
          emailVerified: true
        });
        
        console.log(`✅ Created Firebase Auth user: ${userRecord.uid}`);
      } else {
        throw error;
      }
    }
    
    // Create/update user document in Firestore
    const hashedPin = await bcrypt.hash(testUserData.pin, 10);
    
    const userDoc = {
      email: testUserData.email,
      name: testUserData.displayName,
      role: 'parent',
      pin: hashedPin,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isTestUser: true // Flag for identification
    };
    
    await db.collection('users').doc(userRecord.uid).set(userDoc, { merge: true });
    console.log('✅ Created/updated Firestore user document');
    
    // Create a test child profile
    const childDoc = {
      name: 'Test Child',
      parentId: userRecord.uid,
      xp: 150,
      level: 2,
      avatar: '👦',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isTestData: true
    };
    
    const childRef = await db.collection('childProfiles').add(childDoc);
    console.log(`✅ Created test child profile: ${childRef.id}`);
    
    // Create sample quest
    const questDoc = {
      title: 'Test Quest for CRUD',
      description: 'This is a test quest created for CRUD operations testing',
      xpReward: 50,
      parentId: userRecord.uid,
      assignedTo: [childRef.id],
      status: 'active',
      iconName: 'Star',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isTestData: true
    };
    
    const questRef = await db.collection('quests').add(questDoc);
    console.log(`✅ Created test quest: ${questRef.id}`);
    
    // Create sample reward (testing our source field fix)
    const rewardDoc = {
      title: 'Test Reward for CRUD',
      description: 'This is a test reward created for CRUD operations testing',
      cost: 100,
      parentId: userRecord.uid,
      assignedTo: [childRef.id],
      status: 'available',
      iconName: 'Gift',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isTestData: true
      // Note: No 'source' field - this tests our undefined source fix
    };
    
    const rewardRef = await db.collection('rewards').add(rewardDoc);
    console.log(`✅ Created test reward: ${rewardRef.id}`);
    
    // Create another reward WITH source field (Amazon product)
    const amazonRewardDoc = {
      title: 'Amazon Test Reward',
      description: 'Test reward with Amazon source field',
      cost: 200,
      parentId: userRecord.uid,
      assignedTo: [childRef.id],
      status: 'available',
      iconName: 'ShoppingCart',
      source: {
        type: 'amazon',
        productId: 'B08N5WRWNW',
        title: 'Test Amazon Product',
        price: '$29.99',
        url: 'https://amazon.com/test'
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isTestData: true
    };
    
    const amazonRewardRef = await db.collection('rewards').add(amazonRewardDoc);
    console.log(`✅ Created Amazon test reward: ${amazonRewardRef.id}`);
    
    console.log('\\n🎉 Test user and data setup complete!');
    console.log('\\n📋 Test Credentials:');
    console.log(`   Email: ${testUserData.email}`);
    console.log(`   Password: ${testUserData.password}`);
    console.log(`   PIN: ${testUserData.pin}`);
    console.log(`   User ID: ${userRecord.uid}`);
    console.log(`   Child ID: ${childRef.id}`);
    console.log(`   Quest ID: ${questRef.id}`);
    console.log(`   Reward ID: ${rewardRef.id}`);
    console.log(`   Amazon Reward ID: ${amazonRewardRef.id}`);
    
    return {
      user: {
        uid: userRecord.uid,
        email: testUserData.email,
        password: testUserData.password,
        pin: testUserData.pin
      },
      child: { id: childRef.id, name: 'Test Child' },
      quest: { id: questRef.id, title: 'Test Quest for CRUD' },
      reward: { id: rewardRef.id, title: 'Test Reward for CRUD' },
      amazonReward: { id: amazonRewardRef.id, title: 'Amazon Test Reward' }
    };
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  }
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up existing test data...');
  
  try {
    // Find test user
    const testUser = await auth.getUserByEmail('crudtest@example.com').catch(() => null);
    
    if (testUser) {
      // Delete test data from Firestore
      const batch = db.batch();
      
      // Delete test child profiles
      const childQuery = await db.collection('childProfiles')
        .where('parentId', '==', testUser.uid)
        .get();
      
      childQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete test quests
      const questQuery = await db.collection('quests')
        .where('parentId', '==', testUser.uid)
        .get();
      
      questQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete test rewards
      const rewardQuery = await db.collection('rewards')
        .where('parentId', '==', testUser.uid)
        .get();
      
      rewardQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete user document
      batch.delete(db.collection('users').doc(testUser.uid));
      
      await batch.commit();
      console.log('✅ Deleted Firestore test data');
      
      // Delete from Firebase Auth
      await auth.deleteUser(testUser.uid);
      console.log('✅ Deleted test user from Auth');
    }
    
  } catch (error) {
    console.log('⚠️ Cleanup warning:', error.message);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  if (command === 'cleanup') {
    await cleanupTestData();
  } else {
    await cleanupTestData(); // Clean up first
    const testData = await createTestUser();
    
    // Write test credentials to a file for Playwright to use
    const fs = require('fs');
    fs.writeFileSync('./test-credentials.json', JSON.stringify(testData, null, 2));
    console.log('✅ Test credentials saved to test-credentials.json');
  }
  
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { createTestUser, cleanupTestData };