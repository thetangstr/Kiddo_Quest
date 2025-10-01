const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });
}

const db = admin.firestore();

async function getFeedbackItems() {
  console.log('📋 Retrieving all feedback from Firestore...\n');
  
  try {
    const feedbackSnapshot = await db.collection('feedbackReports')
      .orderBy('createdAt', 'desc')
      .get();
    
    if (feedbackSnapshot.empty) {
      console.log('No feedback reports found.');
      return [];
    }
    
    const feedbackItems = [];
    feedbackSnapshot.forEach(doc => {
      const data = doc.data();
      feedbackItems.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : null
      });
    });
    
    return feedbackItems;
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return [];
  }
}

async function displayFeedback() {
  const items = await getFeedbackItems();
  
  console.log('='.repeat(80));
  console.log('📊 FEEDBACK MANAGEMENT SYSTEM');
  console.log('='.repeat(80));
  console.log(`Total Items: ${items.length}\n`);
  
  // Group by status
  const statusGroups = {
    open: items.filter(i => !i.status || i.status === 'open'),
    ready_for_development: items.filter(i => i.status === 'ready_for_development'),
    in_progress: items.filter(i => i.status === 'in_progress'),
    completed: items.filter(i => i.status === 'completed'),
    closed: items.filter(i => i.status === 'closed')
  };
  
  // Display each status group
  for (const [status, groupItems] of Object.entries(statusGroups)) {
    if (groupItems.length > 0) {
      const emoji = {
        open: '🔴',
        ready_for_development: '🚀',
        in_progress: '🔧',
        completed: '✅',
        closed: '📦'
      }[status];
      
      console.log(`\n${emoji} ${status.toUpperCase().replace(/_/g, ' ')} (${groupItems.length}):`);
      console.log('-'.repeat(60));
      
      groupItems.forEach((item, idx) => {
        const date = item.createdAt ? item.createdAt.toLocaleDateString() : 'Unknown';
        console.log(`\n${idx + 1}. [${item.severity || 'normal'}] ${item.id.substring(0, 8)}...`);
        console.log(`   User: ${item.userEmail || item.userId || 'anonymous'}`);
        console.log(`   Date: ${date}`);
        console.log(`   Description: ${item.description || 'No description'}`);
        
        if (item.adminNotes) {
          console.log(`   📝 Admin Notes: ${item.adminNotes}`);
        }
        
        if (item.priority) {
          console.log(`   ⚡ Priority: ${item.priority}`);
        }
      });
    }
  }
  
  // Create sprint items from ready_for_development
  const readyItems = statusGroups.ready_for_development;
  if (readyItems.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('🏃 SPRINT READY ITEMS');
    console.log('='.repeat(80));
    console.log('\nThe following items are marked "ready for development":');
    
    const sprintItems = readyItems.map(item => ({
      id: item.id,
      title: item.description?.substring(0, 50) || 'Untitled',
      description: item.description,
      severity: item.severity,
      priority: item.priority || 'medium',
      steps: item.steps,
      userEmail: item.userEmail
    }));
    
    // Save to sprint file
    const sprintPath = path.join(__dirname, '../CURRENT_SPRINT.json');
    fs.writeFileSync(sprintPath, JSON.stringify(sprintItems, null, 2));
    
    console.log(`\n✅ Created sprint file with ${sprintItems.length} items`);
    console.log(`📄 Sprint file: CURRENT_SPRINT.json`);
    
    return sprintItems;
  }
  
  return [];
}

async function updateFeedbackStatus(feedbackId, newStatus, adminNotes = null) {
  try {
    const updateData = {
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }
    
    await db.collection('feedbackReports').doc(feedbackId).update(updateData);
    console.log(`✅ Updated feedback ${feedbackId} to status: ${newStatus}`);
    return true;
  } catch (error) {
    console.error('Error updating feedback:', error);
    return false;
  }
}

// Command-line interface
const command = process.argv[2];
const feedbackId = process.argv[3];
const statusOrNotes = process.argv[4];

async function main() {
  switch (command) {
    case 'list':
      await displayFeedback();
      break;
      
    case 'ready':
      if (feedbackId) {
        await updateFeedbackStatus(feedbackId, 'ready_for_development', statusOrNotes);
        const sprintItems = await displayFeedback();
        if (sprintItems.length > 0) {
          console.log('\n🎯 Sprint items are ready for development!');
        }
      } else {
        console.log('Usage: node admin-feedback-manager.js ready <feedbackId> [adminNotes]');
      }
      break;
      
    case 'close':
      if (feedbackId) {
        await updateFeedbackStatus(feedbackId, 'closed', statusOrNotes);
      } else {
        console.log('Usage: node admin-feedback-manager.js close <feedbackId> [adminNotes]');
      }
      break;
      
    case 'progress':
      if (feedbackId) {
        await updateFeedbackStatus(feedbackId, 'in_progress', statusOrNotes);
      } else {
        console.log('Usage: node admin-feedback-manager.js progress <feedbackId> [adminNotes]');
      }
      break;
      
    default:
      console.log('📚 Admin Feedback Manager');
      console.log('========================');
      console.log('\nCommands:');
      console.log('  node admin-feedback-manager.js list              - List all feedback');
      console.log('  node admin-feedback-manager.js ready <id> [note] - Mark as ready for development');
      console.log('  node admin-feedback-manager.js close <id> [note] - Close feedback item');
      console.log('  node admin-feedback-manager.js progress <id>     - Mark as in progress');
      console.log('\n💡 When items are marked "ready for development", they are automatically');
      console.log('   added to CURRENT_SPRINT.json for the development agent to work on.');
  }
  
  // Cleanup
  await admin.app().delete();
}

main();