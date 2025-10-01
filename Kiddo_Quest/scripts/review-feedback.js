const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

async function reviewFeedback() {
  console.log('📋 Fetching all feedback reports from Firestore...\n');
  
  try {
    // Query all feedback reports
    const feedbackSnapshot = await db.collection('feedbackReports')
      .orderBy('createdAt', 'desc')
      .get();
    
    if (feedbackSnapshot.empty) {
      console.log('No feedback reports found.');
      return;
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
    
    console.log(`Found ${feedbackItems.length} feedback report(s)\n`);
    console.log('=' .repeat(80));
    
    // Group by status
    const openItems = feedbackItems.filter(item => item.status === 'open' || !item.status);
    const closedItems = feedbackItems.filter(item => item.status === 'closed');
    const inProgressItems = feedbackItems.filter(item => item.status === 'in_progress');
    
    // Display open items first
    if (openItems.length > 0) {
      console.log(`\n🔴 OPEN FEEDBACK (${openItems.length} items):`);
      console.log('-'.repeat(80));
      
      openItems.forEach((item, index) => {
        console.log(`\n${index + 1}. [${item.severity || 'N/A'}] ${item.id}`);
        console.log(`   User: ${item.userEmail || item.userId || 'anonymous'}`);
        console.log(`   Date: ${item.createdAt ? item.createdAt.toLocaleString() : 'Unknown'}`);
        console.log(`   Description: ${item.description || 'No description'}`);
        if (item.steps) {
          console.log(`   Steps to Reproduce:`);
          item.steps.split('\n').forEach(step => {
            if (step.trim()) console.log(`     - ${step.trim()}`);
          });
        }
        console.log('-'.repeat(40));
      });
    }
    
    // Display in-progress items
    if (inProgressItems.length > 0) {
      console.log(`\n🟡 IN PROGRESS (${inProgressItems.length} items):`);
      console.log('-'.repeat(80));
      
      inProgressItems.forEach((item, index) => {
        console.log(`\n${index + 1}. [${item.severity || 'N/A'}] ${item.id}`);
        console.log(`   User: ${item.userEmail || item.userId || 'anonymous'}`);
        console.log(`   Date: ${item.createdAt ? item.createdAt.toLocaleString() : 'Unknown'}`);
        console.log(`   Description: ${item.description || 'No description'}`);
      });
    }
    
    // Summary of closed items
    if (closedItems.length > 0) {
      console.log(`\n🟢 CLOSED (${closedItems.length} items) - Not displaying details`);
    }
    
    // Analysis and recommendations
    console.log('\n' + '='.repeat(80));
    console.log('📊 ANALYSIS & RECOMMENDATIONS:');
    console.log('='.repeat(80));
    
    // Categorize issues
    const categories = {
      authentication: [],
      questClaiming: [],
      navigation: [],
      ui: [],
      performance: [],
      other: []
    };
    
    openItems.forEach(item => {
      const desc = (item.description || '').toLowerCase();
      const steps = (item.steps || '').toLowerCase();
      const combined = desc + ' ' + steps;
      
      if (combined.includes('login') || combined.includes('sign') || combined.includes('auth')) {
        categories.authentication.push(item);
      } else if (combined.includes('quest') || combined.includes('claim')) {
        categories.questClaiming.push(item);
      } else if (combined.includes('navigat') || combined.includes('back') || combined.includes('forward')) {
        categories.navigation.push(item);
      } else if (combined.includes('button') || combined.includes('modal') || combined.includes('display')) {
        categories.ui.push(item);
      } else if (combined.includes('slow') || combined.includes('loading') || combined.includes('performance')) {
        categories.performance.push(item);
      } else {
        categories.other.push(item);
      }
    });
    
    // Display categorized issues
    console.log('\n📁 ISSUES BY CATEGORY:');
    
    if (categories.authentication.length > 0) {
      console.log(`\n🔐 Authentication Issues (${categories.authentication.length}):`);
      categories.authentication.forEach(item => {
        console.log(`   - ${item.description?.substring(0, 60)}...`);
      });
    }
    
    if (categories.questClaiming.length > 0) {
      console.log(`\n🎯 Quest/Claiming Issues (${categories.questClaiming.length}):`);
      categories.questClaiming.forEach(item => {
        console.log(`   - ${item.description?.substring(0, 60)}...`);
      });
    }
    
    if (categories.navigation.length > 0) {
      console.log(`\n🧭 Navigation Issues (${categories.navigation.length}):`);
      categories.navigation.forEach(item => {
        console.log(`   - ${item.description?.substring(0, 60)}...`);
      });
    }
    
    if (categories.ui.length > 0) {
      console.log(`\n🎨 UI/Display Issues (${categories.ui.length}):`);
      categories.ui.forEach(item => {
        console.log(`   - ${item.description?.substring(0, 60)}...`);
      });
    }
    
    if (categories.performance.length > 0) {
      console.log(`\n⚡ Performance Issues (${categories.performance.length}):`);
      categories.performance.forEach(item => {
        console.log(`   - ${item.description?.substring(0, 60)}...`);
      });
    }
    
    if (categories.other.length > 0) {
      console.log(`\n❓ Other Issues (${categories.other.length}):`);
      categories.other.forEach(item => {
        console.log(`   - ${item.description?.substring(0, 60)}...`);
      });
    }
    
    // Priority recommendations
    console.log('\n' + '='.repeat(80));
    console.log('🎯 PRIORITY RECOMMENDATIONS:');
    console.log('='.repeat(80));
    
    const highSeverity = openItems.filter(item => item.severity === 'high');
    const mediumSeverity = openItems.filter(item => item.severity === 'medium');
    
    if (highSeverity.length > 0) {
      console.log(`\n🔴 HIGH PRIORITY (${highSeverity.length} items):`);
      highSeverity.forEach((item, index) => {
        console.log(`${index + 1}. ${item.description?.substring(0, 100)}`);
      });
    }
    
    if (mediumSeverity.length > 0) {
      console.log(`\n🟡 MEDIUM PRIORITY (${mediumSeverity.length} items):`);
      mediumSeverity.slice(0, 3).forEach((item, index) => {
        console.log(`${index + 1}. ${item.description?.substring(0, 100)}`);
      });
    }
    
    // Summary statistics
    console.log('\n' + '='.repeat(80));
    console.log('📈 SUMMARY STATISTICS:');
    console.log('='.repeat(80));
    console.log(`Total Feedback: ${feedbackItems.length}`);
    console.log(`Open: ${openItems.length}`);
    console.log(`In Progress: ${inProgressItems.length}`);
    console.log(`Closed: ${closedItems.length}`);
    console.log(`\nSeverity Breakdown (Open Items):`);
    console.log(`  High: ${openItems.filter(i => i.severity === 'high').length}`);
    console.log(`  Medium: ${openItems.filter(i => i.severity === 'medium').length}`);
    console.log(`  Low: ${openItems.filter(i => i.severity === 'low').length}`);
    console.log(`  Unspecified: ${openItems.filter(i => !i.severity).length}`);
    
  } catch (error) {
    console.error('Error fetching feedback:', error);
  } finally {
    // Clean up
    await admin.app().delete();
    console.log('\n✅ Feedback review complete');
  }
}

// Run the review
reviewFeedback();