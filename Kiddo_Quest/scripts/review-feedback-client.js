// This script uses the client SDK to review feedback
// Run it in a browser environment or with proper Firebase config

const reviewScript = `
async function reviewFeedback() {
  console.log('📋 Fetching all feedback reports from Firestore...\\n');
  
  try {
    const { collection, getDocs, query, orderBy } = window.firebase.firestore;
    const db = window.firebase.firestore();
    
    // Query all feedback reports
    const feedbackQuery = query(
      collection(db, 'feedbackReports'),
      orderBy('createdAt', 'desc')
    );
    
    const feedbackSnapshot = await getDocs(feedbackQuery);
    
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
    
    console.log(\`Found \${feedbackItems.length} feedback report(s)\\n\`);
    console.log('=' .repeat(80));
    
    // Group by status
    const openItems = feedbackItems.filter(item => item.status === 'open' || !item.status);
    const closedItems = feedbackItems.filter(item => item.status === 'closed');
    const inProgressItems = feedbackItems.filter(item => item.status === 'in_progress');
    
    // Display open items first
    if (openItems.length > 0) {
      console.log(\`\\n🔴 OPEN FEEDBACK (\${openItems.length} items):\`);
      console.log('-'.repeat(80));
      
      openItems.forEach((item, index) => {
        console.log(\`\\n\${index + 1}. [\${item.severity || 'N/A'}] \${item.id}\`);
        console.log(\`   User: \${item.userEmail || item.userId || 'anonymous'}\`);
        console.log(\`   Date: \${item.createdAt ? item.createdAt.toLocaleString() : 'Unknown'}\`);
        console.log(\`   Description: \${item.description || 'No description'}\`);
        if (item.steps) {
          console.log(\`   Steps to Reproduce:\`);
          item.steps.split('\\n').forEach(step => {
            if (step.trim()) console.log(\`     - \${step.trim()}\`);
          });
        }
      });
    }
    
    // Summary statistics
    console.log('\\n' + '='.repeat(80));
    console.log('📈 SUMMARY STATISTICS:');
    console.log('='.repeat(80));
    console.log(\`Total Feedback: \${feedbackItems.length}\`);
    console.log(\`Open: \${openItems.length}\`);
    console.log(\`In Progress: \${inProgressItems.length}\`);
    console.log(\`Closed: \${closedItems.length}\`);
    
    return feedbackItems;
    
  } catch (error) {
    console.error('Error fetching feedback:', error);
  }
}

// Execute the review
reviewFeedback();
`;

console.log('To review feedback, paste this script in the browser console at https://kiddo-quest-de7b0.web.app');
console.log('Make sure you are logged in as an admin user first.');
console.log('\n' + '='.repeat(80));
console.log('SCRIPT TO PASTE:');
console.log('='.repeat(80));
console.log(reviewScript);