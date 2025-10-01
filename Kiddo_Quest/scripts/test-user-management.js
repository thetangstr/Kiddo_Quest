// Test script for user management functionality
// Run this with: node scripts/test-user-management.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query } = require('firebase/firestore');

// Firebase configuration (same as in your app)
const firebaseConfig = {
  apiKey: "AIzaSyCJP2evMxm1_lX-Hdf6C4sV_nO0c89DL00",
  authDomain: "kiddo-quest-de7b0.firebaseapp.com",
  projectId: "kiddo-quest-de7b0",
  storageBucket: "kiddo-quest-de7b0.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef1234567890"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testUserManagement() {
  console.log('🧪 Testing User Management System...\n');
  
  try {
    // Test 1: Fetch all users and check for duplicates
    console.log('Test 1: Checking for duplicate users...');
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    
    const usersByEmail = new Map();
    const allUsers = [];
    
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      const email = userData.email?.toLowerCase().trim();
      
      if (email) {
        if (!usersByEmail.has(email)) {
          usersByEmail.set(email, []);
        }
        usersByEmail.get(email).push({
          id: doc.id,
          email: userData.email,
          status: userData.status,
          lastLogin: userData.lastLogin,
          isAdmin: userData.isAdmin
        });
        
        allUsers.push({
          id: doc.id,
          email: userData.email,
          status: userData.status,
          lastLogin: userData.lastLogin,
          isAdmin: userData.isAdmin
        });
      }
    });
    
    console.log(`📊 Total user documents: ${usersSnapshot.docs.length}`);
    console.log(`📧 Unique email addresses: ${usersByEmail.size}`);
    
    // Check for duplicates
    let duplicatesFound = 0;
    for (const [email, users] of usersByEmail) {
      if (users.length > 1) {
        duplicatesFound += users.length - 1;
        console.log(`⚠️  Duplicate found for ${email}: ${users.length} entries`);
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ID: ${user.id}, Status: ${user.status}, Admin: ${user.isAdmin}`);
        });
      }
    }
    
    if (duplicatesFound === 0) {
      console.log('✅ No duplicates found!');
    } else {
      console.log(`❌ Found ${duplicatesFound} duplicate user entries`);
    }
    
    // Test 2: Check admin users
    console.log('\nTest 2: Checking admin users...');
    const adminUsers = allUsers.filter(user => user.isAdmin);
    console.log(`👑 Admin users found: ${adminUsers.length}`);
    adminUsers.forEach(admin => {
      console.log(`   - ${admin.email} (ID: ${admin.id}, Status: ${admin.status})`);
    });
    
    // Test 3: Check user statuses
    console.log('\nTest 3: User status distribution...');
    const statusCounts = allUsers.reduce((acc, user) => {
      const status = user.status || 'undefined';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} users`);
    });
    
    // Test 4: Check for users with recent activity
    console.log('\nTest 4: Recent user activity...');
    const recentUsers = allUsers.filter(user => user.lastLogin);
    console.log(`🔄 Users with login history: ${recentUsers.length}`);
    
    if (recentUsers.length > 0) {
      console.log('Recent logins:');
      recentUsers
        .sort((a, b) => {
          if (!a.lastLogin || !b.lastLogin) return 0;
          return b.lastLogin.toDate() - a.lastLogin.toDate();
        })
        .slice(0, 5)
        .forEach(user => {
          const loginDate = user.lastLogin ? user.lastLogin.toDate().toLocaleString() : 'Never';
          console.log(`   - ${user.email}: ${loginDate}`);
        });
    }
    
    console.log('\n🎉 User management test completed!');
    
  } catch (error) {
    console.error('❌ Error testing user management:', error);
  }
}

testUserManagement().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
