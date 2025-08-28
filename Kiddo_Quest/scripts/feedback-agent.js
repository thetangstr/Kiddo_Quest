// Feedback Review Agent System
// This agent reviews feedback from users, proposes fixes, and integrates with CI/CD

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, doc, serverTimestamp } = require('firebase/firestore');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Firebase configuration
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
const db = getFirestore(app);

class FeedbackAgent {
  constructor() {
    this.feedbackCollection = 'feedbackReports';
    this.proposedFixes = [];
  }

  // Fetch all open feedback reports
  async fetchOpenFeedback() {
    console.log('🔍 Fetching open feedback reports...');
    const q = query(
      collection(db, this.feedbackCollection),
      where('status', '==', 'open')
    );
    
    const snapshot = await getDocs(q);
    const feedback = [];
    
    snapshot.forEach((doc) => {
      feedback.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`📋 Found ${feedback.length} open feedback reports`);
    return feedback;
  }

  // Analyze feedback and categorize issues
  analyzeFeedback(feedbackList) {
    console.log('🤖 Analyzing feedback...');
    
    const categories = {
      ui: [],
      functionality: [],
      performance: [],
      security: [],
      other: []
    };
    
    feedbackList.forEach(feedback => {
      const description = feedback.description.toLowerCase();
      
      if (description.includes('button') || description.includes('ui') || description.includes('display') || description.includes('layout')) {
        categories.ui.push(feedback);
      } else if (description.includes('claim') || description.includes('quest') || description.includes('reward') || description.includes('can\'t') || description.includes('cannot')) {
        categories.functionality.push(feedback);
      } else if (description.includes('slow') || description.includes('loading') || description.includes('performance')) {
        categories.performance.push(feedback);
      } else if (description.includes('login') || description.includes('security') || description.includes('access')) {
        categories.security.push(feedback);
      } else {
        categories.other.push(feedback);
      }
    });
    
    return categories;
  }

  // Generate fix proposals based on feedback
  async generateFixProposals(categories) {
    console.log('💡 Generating fix proposals...');
    const proposals = [];
    
    // Handle functionality issues (like quest claiming)
    if (categories.functionality.length > 0) {
      const questIssues = categories.functionality.filter(f => 
        f.description.toLowerCase().includes('claim') || 
        f.description.toLowerCase().includes('quest')
      );
      
      if (questIssues.length > 0) {
        proposals.push({
          type: 'functionality',
          priority: 'high',
          issue: 'Quest claiming issues reported by multiple users',
          proposedFix: [
            'Add better error handling in claimQuest function',
            'Ensure Firebase security rules allow quest completion creation',
            'Add retry mechanism for failed claims',
            'Improve error messages shown to users'
          ],
          affectedFiles: [
            'src/store.js',
            'firestore.rules',
            'src/screens/ChildDashboard.js'
          ],
          feedbackIds: questIssues.map(f => f.id)
        });
      }
    }
    
    // Handle UI issues
    if (categories.ui.length > 0) {
      proposals.push({
        type: 'ui',
        priority: 'medium',
        issue: 'UI/UX issues reported',
        proposedFix: [
          'Review button sizes and touch targets',
          'Ensure proper responsive design',
          'Add loading states for all async operations'
        ],
        affectedFiles: [
          'src/components/UI.js',
          'src/styles/global.css'
        ],
        feedbackIds: categories.ui.map(f => f.id)
      });
    }
    
    // Handle performance issues
    if (categories.performance.length > 0) {
      proposals.push({
        type: 'performance',
        priority: 'medium',
        issue: 'Performance issues reported',
        proposedFix: [
          'Implement lazy loading for images',
          'Add caching for frequently accessed data',
          'Optimize Firebase queries'
        ],
        affectedFiles: [
          'src/store.js',
          'src/firebase.js'
        ],
        feedbackIds: categories.performance.map(f => f.id)
      });
    }
    
    return proposals;
  }

  // Create a fix branch and implement changes
  async implementFixes(proposals) {
    console.log('🔧 Implementing fixes...');
    
    for (const proposal of proposals) {
      if (proposal.priority === 'high') {
        console.log(`\n📌 High priority fix: ${proposal.issue}`);
        console.log('Proposed solutions:');
        proposal.proposedFix.forEach(fix => console.log(`  - ${fix}`));
        console.log('Affected files:');
        proposal.affectedFiles.forEach(file => console.log(`  - ${file}`));
        
        // Mark related feedback as in-progress
        for (const feedbackId of proposal.feedbackIds) {
          await this.updateFeedbackStatus(feedbackId, 'in-progress', proposal);
        }
      }
    }
    
    return proposals;
  }

  // Update feedback status in Firebase
  async updateFeedbackStatus(feedbackId, status, proposal = null) {
    const updates = {
      status,
      updatedAt: serverTimestamp()
    };
    
    if (proposal) {
      updates.proposedFix = proposal.proposedFix.join('; ');
      updates.priority = proposal.priority;
    }
    
    await updateDoc(doc(db, this.feedbackCollection, feedbackId), updates);
    console.log(`✅ Updated feedback ${feedbackId} to ${status}`);
  }

  // Generate a deployment report
  async generateReport(proposals) {
    console.log('\n📊 Generating feedback report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      totalProposals: proposals.length,
      highPriority: proposals.filter(p => p.priority === 'high').length,
      mediumPriority: proposals.filter(p => p.priority === 'medium').length,
      lowPriority: proposals.filter(p => p.priority === 'low').length,
      proposals: proposals
    };
    
    // Save report to file
    const reportPath = path.join(__dirname, '..', 'feedback-reports', `report-${Date.now()}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Report saved to: ${reportPath}`);
    
    return report;
  }

  // Main execution flow
  async run() {
    try {
      console.log('🚀 Starting Feedback Review Agent...');
      console.log('=====================================\n');
      
      // 1. Fetch feedback
      const feedback = await this.fetchOpenFeedback();
      
      if (feedback.length === 0) {
        console.log('✨ No open feedback to process');
        return;
      }
      
      // 2. Analyze and categorize
      const categories = this.analyzeFeedback(feedback);
      
      console.log('\n📊 Feedback Categories:');
      console.log(`  UI Issues: ${categories.ui.length}`);
      console.log(`  Functionality Issues: ${categories.functionality.length}`);
      console.log(`  Performance Issues: ${categories.performance.length}`);
      console.log(`  Security Issues: ${categories.security.length}`);
      console.log(`  Other: ${categories.other.length}`);
      
      // 3. Generate proposals
      const proposals = await this.generateFixProposals(categories);
      
      // 4. Implement fixes (or prepare for manual implementation)
      await this.implementFixes(proposals);
      
      // 5. Generate report
      const report = await this.generateReport(proposals);
      
      console.log('\n✅ Feedback review complete!');
      console.log('=====================================');
      
      // Output summary for CI/CD integration
      if (proposals.some(p => p.priority === 'high')) {
        console.log('\n⚠️  HIGH PRIORITY FIXES REQUIRED');
        console.log('Please review the proposals and create fix branches.');
        process.exit(1); // Exit with error code to trigger CI/CD attention
      }
      
    } catch (error) {
      console.error('❌ Error in feedback agent:', error);
      process.exit(1);
    }
  }
}

// Run the agent
const agent = new FeedbackAgent();
agent.run().then(() => {
  console.log('\n🎯 Agent execution completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Agent failed:', error);
  process.exit(1);
});
