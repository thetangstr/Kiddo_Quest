const { test, expect } = require('@playwright/test');

test.describe('Fetch and Review Feedback', () => {
  test('Get all feedback items from production', async ({ page }) => {
    console.log('📋 Fetching feedback reports from production...\n');
    
    // Navigate to production site
    await page.goto('https://kiddo-quest-de7b0.web.app');
    await page.waitForLoadState('networkidle');
    
    // Wait for Firebase to be available
    await page.waitForTimeout(3000);
    
    // Execute script in browser context to fetch feedback
    const feedbackData = await page.evaluate(async () => {
      // Try to access Firestore through the global db object used by the app
      try {
        // First check if we can use the app's db directly
        if (window.db) {
          const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js');
          const snapshot = await getDocs(query(collection(window.db, 'feedbackReports'), orderBy('createdAt', 'desc')));
          
          const items = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            items.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt ? data.createdAt.toMillis() : null
            });
          });
          
          return { success: true, items };
        }
        
        // Fallback: try to use firebase global
        if (window.firebase && window.firebase.firestore) {
          const db = window.firebase.firestore();
          const snapshot = await db.collection('feedbackReports')
            .orderBy('createdAt', 'desc')
            .get();
          
          const items = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            items.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt ? data.createdAt.toMillis() : null
            });
          });
          
          return { success: true, items };
        }
        
        return { error: 'Firebase not available' };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    if (feedbackData.error) {
      console.log('❌ Error fetching feedback:', feedbackData.error);
      console.log('\nNote: You may need admin permissions to view all feedback.');
      return;
    }
    
    const items = feedbackData.items || [];
    console.log(`Found ${items.length} feedback report(s)\n`);
    
    if (items.length === 0) {
      console.log('No feedback reports found.');
      return;
    }
    
    // Group by status
    const openItems = items.filter(item => item.status === 'open' || !item.status);
    const closedItems = items.filter(item => item.status === 'closed');
    const inProgressItems = items.filter(item => item.status === 'in_progress');
    
    console.log('='.repeat(80));
    console.log('📊 FEEDBACK REVIEW REPORT');
    console.log('='.repeat(80));
    
    // Display open items
    if (openItems.length > 0) {
      console.log(`\n🔴 OPEN FEEDBACK (${openItems.length} items):`);
      console.log('-'.repeat(80));
      
      openItems.forEach((item, index) => {
        const date = item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown';
        console.log(`\n${index + 1}. [${item.severity || 'N/A'}] Feedback ID: ${item.id.substring(0, 8)}...`);
        console.log(`   User: ${item.userEmail || item.userId || 'anonymous'}`);
        console.log(`   Date: ${date}`);
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
        const date = item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown';
        console.log(`\n${index + 1}. [${item.severity || 'N/A'}] ${item.id.substring(0, 8)}...`);
        console.log(`   User: ${item.userEmail || item.userId || 'anonymous'}`);
        console.log(`   Date: ${date}`);
        console.log(`   Description: ${item.description?.substring(0, 100) || 'No description'}...`);
      });
    }
    
    // Summary
    if (closedItems.length > 0) {
      console.log(`\n🟢 CLOSED: ${closedItems.length} items (not shown)`);
    }
    
    // Categorize issues
    console.log('\n' + '='.repeat(80));
    console.log('📁 ISSUES BY CATEGORY:');
    console.log('='.repeat(80));
    
    const categories = {
      authentication: [],
      questClaiming: [],
      navigation: [],
      ui: [],
      performance: [],
      other: []
    };
    
    openItems.forEach(item => {
      const text = ((item.description || '') + ' ' + (item.steps || '')).toLowerCase();
      
      if (text.includes('login') || text.includes('sign') || text.includes('auth')) {
        categories.authentication.push(item);
      } else if (text.includes('quest') || text.includes('claim')) {
        categories.questClaiming.push(item);
      } else if (text.includes('navigat') || text.includes('back') || text.includes('crash')) {
        categories.navigation.push(item);
      } else if (text.includes('button') || text.includes('modal') || text.includes('display')) {
        categories.ui.push(item);
      } else if (text.includes('slow') || text.includes('loading') || text.includes('performance')) {
        categories.performance.push(item);
      } else {
        categories.other.push(item);
      }
    });
    
    // Display categories with issues
    Object.entries(categories).forEach(([category, items]) => {
      if (items.length > 0) {
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        console.log(`\n${categoryName} (${items.length}):`);
        items.forEach(item => {
          console.log(`  - ${item.description?.substring(0, 60) || 'No description'}...`);
        });
      }
    });
    
    // Priority recommendations
    console.log('\n' + '='.repeat(80));
    console.log('🎯 PRIORITY RECOMMENDATIONS:');
    console.log('='.repeat(80));
    
    const highSeverity = openItems.filter(item => item.severity === 'high');
    const mediumSeverity = openItems.filter(item => item.severity === 'medium');
    
    if (highSeverity.length > 0) {
      console.log(`\n🔴 HIGH PRIORITY (${highSeverity.length} items):`);
      highSeverity.forEach((item, index) => {
        console.log(`${index + 1}. ${item.description?.substring(0, 80) || 'No description'}`);
      });
    }
    
    if (mediumSeverity.length > 0) {
      console.log(`\n🟡 MEDIUM PRIORITY (${mediumSeverity.length} items):`);
      mediumSeverity.slice(0, 5).forEach((item, index) => {
        console.log(`${index + 1}. ${item.description?.substring(0, 80) || 'No description'}`);
      });
    }
    
    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('📈 SUMMARY STATISTICS:');
    console.log('='.repeat(80));
    console.log(`Total Feedback Reports: ${items.length}`);
    console.log(`  🔴 Open: ${openItems.length}`);
    console.log(`  🟡 In Progress: ${inProgressItems.length}`);
    console.log(`  🟢 Closed: ${closedItems.length}`);
    console.log(`\nSeverity Breakdown (Open Items):`);
    console.log(`  High: ${openItems.filter(i => i.severity === 'high').length}`);
    console.log(`  Medium: ${openItems.filter(i => i.severity === 'medium').length}`);
    console.log(`  Low: ${openItems.filter(i => i.severity === 'low').length}`);
    console.log(`  Unspecified: ${openItems.filter(i => !i.severity).length}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Feedback review complete');
    console.log('='.repeat(80));
  });
});