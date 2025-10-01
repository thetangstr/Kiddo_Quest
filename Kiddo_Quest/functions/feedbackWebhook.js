const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Octokit } = require('@octokit/rest');

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * HTTP Cloud Function to trigger feedback sync
 * Can be called from the Admin UI or via cron job
 */
exports.triggerFeedbackSync = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Verify admin token if provided
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (authToken) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(authToken);
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        
        if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
          res.status(403).json({ error: 'Unauthorized: Admin access required' });
          return;
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        res.status(401).json({ error: 'Invalid authentication token' });
        return;
      }
    }

    // Initialize GitHub API
    const octokit = new Octokit({
      auth: functions.config().github?.token || process.env.GITHUB_TOKEN
    });

    const REPO_OWNER = 'thetangstr';
    const REPO_NAME = 'Kiddo_Quest';

    // Query feedback marked as ready for development
    const feedbackQuery = await db.collection('feedbackReports')
      .where('status', '==', 'ready_for_dev')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    if (feedbackQuery.empty) {
      res.json({ 
        success: true, 
        message: 'No feedback items marked as ready_for_dev',
        synced: 0 
      });
      return;
    }

    let synced = 0;
    let errors = [];

    for (const doc of feedbackQuery.docs) {
      const feedback = { id: doc.id, ...doc.data() };
      
      try {
        // Create issue title and body
        const issueTitle = `[Feedback ${feedback.id}] ${feedback.title || feedback.description.substring(0, 50)}`;
        const issueBody = `
## User Feedback Report

**Submitted by:** ${feedback.userEmail || 'Anonymous'}
**Severity:** ${feedback.severity || 'Not specified'}
**Category:** ${feedback.category || 'General'}

### Description
${feedback.description}

${feedback.steps ? `### Steps to Reproduce\n${feedback.steps}` : ''}

---
*Feedback ID: ${feedback.id}*
`;

        // Check if issue already exists
        const existingIssues = await octokit.issues.listForRepo({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          labels: 'from-feedback',
          state: 'all'
        });

        const existingIssue = existingIssues.data.find(issue => 
          issue.title.includes(`[Feedback ${feedback.id}]`)
        );

        let issueNumber;
        
        if (existingIssue) {
          // Update existing issue
          await octokit.issues.update({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            issue_number: existingIssue.number,
            body: issueBody,
            state: 'open'
          });
          issueNumber = existingIssue.number;
        } else {
          // Create new issue
          const newIssue = await octokit.issues.create({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            title: issueTitle,
            body: issueBody,
            labels: ['from-feedback', feedback.severity === 'high' ? 'priority: high' : 'priority: medium']
          });
          issueNumber = newIssue.data.number;
        }

        // Update feedback document
        await doc.ref.update({
          githubIssueNumber: issueNumber,
          githubSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'in_development'
        });
        
        synced++;
      } catch (error) {
        console.error(`Error syncing feedback ${feedback.id}:`, error);
        errors.push({ id: feedback.id, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Synced ${synced} feedback items to GitHub`,
      synced,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Fatal error in feedback sync:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Firestore trigger to auto-sync when feedback status changes to ready_for_dev
 */
exports.onFeedbackStatusChange = functions.firestore
  .document('feedbackReports/{feedbackId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    
    // Only proceed if status changed to ready_for_dev
    if (oldData.status === 'ready_for_dev' || newData.status !== 'ready_for_dev') {
      return null;
    }

    try {
      // Initialize GitHub API
      const octokit = new Octokit({
        auth: functions.config().github?.token || process.env.GITHUB_TOKEN
      });

      const REPO_OWNER = 'thetangstr';
      const REPO_NAME = 'Kiddo_Quest';
      
      // Create GitHub issue
      const issueTitle = `[Feedback ${context.params.feedbackId}] ${newData.title || newData.description.substring(0, 50)}`;
      const issueBody = `
## User Feedback Report

**Auto-synced from Firebase**

**Submitted by:** ${newData.userEmail || 'Anonymous'}
**Severity:** ${newData.severity || 'Not specified'}
**Category:** ${newData.category || 'General'}

### Description
${newData.description}

${newData.steps ? `### Steps to Reproduce\n${newData.steps}` : ''}
${newData.developerNotes ? `### Developer Notes\n${newData.developerNotes}` : ''}

---
*Feedback ID: ${context.params.feedbackId}*
*Auto-synced at: ${new Date().toISOString()}*
`;

      const newIssue = await octokit.issues.create({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        title: issueTitle,
        body: issueBody,
        labels: [
          'from-feedback',
          'auto-synced',
          newData.severity === 'critical' || newData.severity === 'high' ? 'priority: high' : 'priority: medium',
          newData.category === 'bug' ? 'bug' : 'enhancement'
        ]
      });

      // Update feedback with issue number
      await change.after.ref.update({
        githubIssueNumber: newIssue.data.number,
        githubSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'in_development'
      });

      console.log(`Auto-synced feedback ${context.params.feedbackId} to GitHub issue #${newIssue.data.number}`);
    } catch (error) {
      console.error(`Failed to auto-sync feedback ${context.params.feedbackId}:`, error);
    }

    return null;
  });