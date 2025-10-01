const { test, expect } = require('@playwright/test');

test.describe('Admin Feedback Extraction', () => {
  test('Extract all feedback data from admin panel', async ({ page }) => {
    console.log('🔐 Accessing KiddoQuest admin panel to extract feedback...\n');
    
    // Navigate to production site
    await page.goto('https://kiddo-quest-de7b0.web.app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check if we're already logged in or need to login
    const loginButton = await page.locator('button:has-text("Login with Google")').first();
    const isLoginVisible = await loginButton.isVisible().catch(() => false);
    
    if (isLoginVisible) {
      console.log('Not logged in. Note: This script requires admin access to view all feedback.');
      console.log('Please log in with admin credentials first.');
      return;
    }
    
    // Try to access admin console
    console.log('Attempting to access admin panel...');
    
    // Look for admin-related elements
    const adminElements = await page.locator('[data-testid*="admin"], button:has-text("Admin"), a:has-text("Admin")').all();
    
    if (adminElements.length === 0) {
      console.log('Admin access not found. Trying to access feedback data directly...');
      
      // Try to execute script in browser context to access Firestore directly
      const feedbackData = await page.evaluate(async () => {
        try {
          // Check if Firebase is loaded
          if (!window.firebase || !window.firebase.firestore) {
            return { error: 'Firebase not loaded' };
          }
          
          const db = window.firebase.firestore();
          console.log('Attempting to fetch feedback from Firestore...');
          
          // Try to get feedback reports
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
        } catch (error) {
          return { error: error.message };
        }
      });
      
      if (feedbackData.error) {
        console.log(`❌ Error: ${feedbackData.error}`);
        console.log('\nTo extract feedback data, you need:');
        console.log('1. Admin login credentials');
        console.log('2. Access to the admin panel in the app');
        console.log('3. Or direct Firebase Admin SDK access');
        return;
      }
      
      // Process and display feedback data
      const items = feedbackData.items || [];
      console.log(`✅ Successfully extracted ${items.length} feedback reports\n`);
      
      if (items.length === 0) {
        console.log('No feedback reports found in the database.');
        return;
      }
      
      // Group by status
      const openItems = items.filter(item => !item.status || item.status === 'open');
      const inProgressItems = items.filter(item => item.status === 'in_progress');
      const closedItems = items.filter(item => item.status === 'closed');
      const readyItems = items.filter(item => item.status === 'ready_for_development');
      
      console.log('='.repeat(80));
      console.log('📊 FEEDBACK EXTRACTION REPORT');
      console.log('='.repeat(80));
      
      // Display all feedback items
      console.log(`\n📋 ALL FEEDBACK (${items.length} total):`);
      console.log('-'.repeat(80));
      
      items.forEach((item, index) => {
        const date = item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown';
        const status = item.status || 'open';
        const severity = item.severity || 'unspecified';
        
        console.log(`\n${index + 1}. [${severity.toUpperCase()}] [${status.toUpperCase()}] ID: ${item.id}`);
        console.log(`   User: ${item.userEmail || item.userId || 'anonymous'}`);
        console.log(`   Date: ${date}`);
        console.log(`   Description: ${item.description || 'No description'}`);
        
        if (item.steps) {
          console.log(`   Steps to Reproduce:`);
          item.steps.split('\n').forEach(step => {
            if (step.trim()) console.log(`     • ${step.trim()}`);
          });
        }
        
        if (item.adminNotes) {
          console.log(`   📝 Admin Notes: ${item.adminNotes}`);
        }
        
        if (item.priority) {
          console.log(`   ⚡ Priority: ${item.priority}`);
        }
        
        console.log('-'.repeat(40));
      });
      
      // Summary by status
      console.log('\n' + '='.repeat(80));
      console.log('📈 FEEDBACK BREAKDOWN BY STATUS:');
      console.log('='.repeat(80));
      console.log(`🔴 Open: ${openItems.length}`);
      console.log(`🚀 Ready for Development: ${readyItems.length}`);
      console.log(`🔧 In Progress: ${inProgressItems.length}`);
      console.log(`✅ Closed: ${closedItems.length}`);
      
      // Severity breakdown
      console.log('\n📊 SEVERITY BREAKDOWN (All Items):');
      console.log('-'.repeat(40));
      const severityCounts = {
        high: items.filter(i => i.severity === 'high').length,
        medium: items.filter(i => i.severity === 'medium').length,
        low: items.filter(i => i.severity === 'low').length,
        unspecified: items.filter(i => !i.severity).length
      };
      
      Object.entries(severityCounts).forEach(([severity, count]) => {
        if (count > 0) {
          console.log(`${severity.charAt(0).toUpperCase() + severity.slice(1)}: ${count}`);
        }
      });
      
      // Recent feedback (last 30 days)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const recentItems = items.filter(item => 
        item.createdAt && item.createdAt > thirtyDaysAgo
      );
      
      if (recentItems.length > 0) {
        console.log('\n📅 RECENT FEEDBACK (Last 30 days):');
        console.log('-'.repeat(40));
        console.log(`${recentItems.length} items received in the last 30 days`);
      }
      
      // Categorize issues by keywords
      console.log('\n🏷️ ISSUE CATEGORIES:');
      console.log('-'.repeat(40));
      
      const categories = {
        authentication: [],
        quests: [],
        rewards: [],
        navigation: [],
        ui: [],
        performance: [],
        crashes: [],
        other: []
      };
      
      items.forEach(item => {
        const text = ((item.description || '') + ' ' + (item.steps || '')).toLowerCase();
        
        if (text.includes('login') || text.includes('sign') || text.includes('auth')) {
          categories.authentication.push(item);
        } else if (text.includes('quest') || text.includes('task') || text.includes('claim')) {
          categories.quests.push(item);
        } else if (text.includes('reward') || text.includes('redeem') || text.includes('prize')) {
          categories.rewards.push(item);
        } else if (text.includes('navigat') || text.includes('back') || text.includes('menu')) {
          categories.navigation.push(item);
        } else if (text.includes('button') || text.includes('modal') || text.includes('display') || text.includes('ui')) {
          categories.ui.push(item);
        } else if (text.includes('slow') || text.includes('loading') || text.includes('performance')) {
          categories.performance.push(item);
        } else if (text.includes('crash') || text.includes('error') || text.includes('freeze')) {
          categories.crashes.push(item);
        } else {
          categories.other.push(item);
        }
      });
      
      Object.entries(categories).forEach(([category, items]) => {
        if (items.length > 0) {
          const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
          console.log(`${categoryName}: ${items.length} items`);
        }
      });
      
      console.log('\n' + '='.repeat(80));
      console.log('✅ FEEDBACK EXTRACTION COMPLETE');
      console.log('='.repeat(80));
      console.log(`📊 Total items extracted: ${items.length}`);
      console.log(`🕒 Extraction completed at: ${new Date().toLocaleString()}`);
      
    } else {
      console.log('Attempting to navigate to admin panel...');
      
      // Click on admin element
      await adminElements[0].click();
      await page.waitForTimeout(2000);
      
      // Look for feedback/bug list
      const feedbackButton = await page.locator('button:has-text("Bug"), button:has-text("Feedback"), a:has-text("Bug"), a:has-text("Feedback")').first();
      
      if (await feedbackButton.isVisible().catch(() => false)) {
        await feedbackButton.click();
        await page.waitForTimeout(3000);
        
        // Extract feedback from the admin panel UI
        const feedbackFromUI = await page.evaluate(() => {
          const feedbackElements = document.querySelectorAll('[data-testid*="feedback"], .feedback-item, .bug-report');
          const items = [];
          
          feedbackElements.forEach(element => {
            const text = element.textContent || '';
            if (text.trim()) {
              items.push(text.trim());
            }
          });
          
          return items;
        });
        
        if (feedbackFromUI.length > 0) {
          console.log('📋 Feedback found in admin panel:');
          feedbackFromUI.forEach((item, index) => {
            console.log(`${index + 1}. ${item}`);
          });
        } else {
          console.log('No feedback found in admin panel UI.');
        }
      }
    }
  });
});