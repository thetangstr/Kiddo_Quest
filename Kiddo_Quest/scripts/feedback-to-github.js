#!/usr/bin/env node

/**
 * Feedback to GitHub Issues Sync Script
 * 
 * This script syncs feedback from Firestore that's marked as "ready_for_dev"
 * and automatically creates GitHub issues for tracking.
 * 
 * Can be run manually or via CI/CD pipeline.
 */

const admin = require('firebase-admin');
const { Octokit } = require('@octokit/rest');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : require('../serviceAccountKey.json');
    
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Initialize GitHub API
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const REPO_OWNER = process.env.GITHUB_OWNER || 'thetangstr';
const REPO_NAME = process.env.GITHUB_REPO || 'Kiddo_Quest';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Map feedback severity to GitHub issue labels
 */
function getSeverityLabel(severity) {
  switch (severity) {
    case 'critical':
    case 'high':
      return ['bug', 'priority: high', 'needs-triage'];
    case 'medium':
      return ['bug', 'priority: medium'];
    case 'low':
      return ['enhancement', 'priority: low'];
    default:
      return ['feedback', 'needs-triage'];
  }
}

/**
 * Create or update GitHub issue from feedback
 */
async function createGitHubIssue(feedback) {
  try {
    // Check if issue already exists (using feedback ID in title)
    const existingIssues = await octokit.issues.listForRepo({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      labels: 'from-feedback',
      state: 'all'
    });

    const issueTitle = `[Feedback ${feedback.id}] ${feedback.title || feedback.description.substring(0, 50)}`;
    const existingIssue = existingIssues.data.find(issue => 
      issue.title.includes(`[Feedback ${feedback.id}]`)
    );

    // Format issue body
    const issueBody = `
## User Feedback Report

**Submitted by:** ${feedback.userEmail || 'Anonymous'}
**Date:** ${feedback.createdAt.toDate().toISOString()}
**Severity:** ${feedback.severity || 'Not specified'}
**Category:** ${feedback.category || 'General'}

### Description
${feedback.description}

${feedback.steps ? `### Steps to Reproduce\n${feedback.steps}` : ''}

${feedback.expectedBehavior ? `### Expected Behavior\n${feedback.expectedBehavior}` : ''}

${feedback.actualBehavior ? `### Actual Behavior\n${feedback.actualBehavior}` : ''}

${feedback.browserInfo ? `### Browser Information\n\`\`\`json\n${JSON.stringify(feedback.browserInfo, null, 2)}\n\`\`\`` : ''}

${feedback.url ? `### URL\n${feedback.url}` : ''}

---
*This issue was automatically created from user feedback.*
*Feedback ID: ${feedback.id}*
`;

    const labels = [
      'from-feedback',
      ...getSeverityLabel(feedback.severity),
      feedback.category === 'bug' ? 'bug' : 'enhancement'
    ];

    if (existingIssue) {
      // Update existing issue
      log(`Updating existing issue #${existingIssue.number} for feedback ${feedback.id}`, 'yellow');
      
      await octokit.issues.update({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        issue_number: existingIssue.number,
        body: issueBody,
        labels: labels,
        state: feedback.status === 'resolved' ? 'closed' : 'open'
      });

      return existingIssue.number;
    } else {
      // Create new issue
      log(`Creating new GitHub issue for feedback ${feedback.id}`, 'green');
      
      const newIssue = await octokit.issues.create({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        title: issueTitle,
        body: issueBody,
        labels: labels
      });

      return newIssue.data.number;
    }
  } catch (error) {
    log(`Error creating/updating GitHub issue: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Update feedback document with GitHub issue number
 */
async function updateFeedbackWithIssue(feedbackId, issueNumber) {
  try {
    await db.collection('feedbackReports').doc(feedbackId).update({
      githubIssueNumber: issueNumber,
      githubSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'in_development'
    });
    
    log(`Updated feedback ${feedbackId} with GitHub issue #${issueNumber}`, 'green');
  } catch (error) {
    log(`Error updating feedback: ${error.message}`, 'red');
  }
}

/**
 * Main sync function
 */
async function syncFeedbackToGitHub() {
  log('\n========================================', 'bright');
  log('  Feedback to GitHub Issues Sync', 'bright');
  log('========================================\n', 'bright');

  try {
    // Query feedback marked as ready for development
    const feedbackQuery = await db.collection('feedbackReports')
      .where('status', '==', 'ready_for_dev')
      .orderBy('createdAt', 'desc')
      .limit(10) // Process up to 10 at a time
      .get();

    if (feedbackQuery.empty) {
      log('No feedback items marked as ready_for_dev', 'cyan');
      return { synced: 0, errors: 0 };
    }

    log(`Found ${feedbackQuery.size} feedback items to sync`, 'cyan');
    
    let synced = 0;
    let errors = 0;

    for (const doc of feedbackQuery.docs) {
      const feedback = { id: doc.id, ...doc.data() };
      
      try {
        log(`\nProcessing: ${feedback.description.substring(0, 50)}...`, 'blue');
        
        const issueNumber = await createGitHubIssue(feedback);
        await updateFeedbackWithIssue(feedback.id, issueNumber);
        
        synced++;
        log(`✓ Successfully synced to GitHub issue #${issueNumber}`, 'green');
      } catch (error) {
        errors++;
        log(`✗ Failed to sync feedback ${feedback.id}: ${error.message}`, 'red');
      }
    }

    log('\n========================================', 'bright');
    log(`Sync Complete: ${synced} synced, ${errors} errors`, synced > 0 ? 'green' : 'yellow');
    log('========================================\n', 'bright');

    return { synced, errors };
  } catch (error) {
    log(`Fatal error during sync: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Check GitHub issue status and update feedback
 */
async function syncGitHubStatusBack() {
  try {
    // Get all feedback with GitHub issues
    const feedbackWithIssues = await db.collection('feedbackReports')
      .where('githubIssueNumber', '>', 0)
      .where('status', '!=', 'resolved')
      .get();

    for (const doc of feedbackWithIssues.docs) {
      const feedback = doc.data();
      
      try {
        const issue = await octokit.issues.get({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          issue_number: feedback.githubIssueNumber
        });

        // Update status based on GitHub issue state
        let newStatus = feedback.status;
        if (issue.data.state === 'closed') {
          newStatus = 'resolved';
        } else if (issue.data.labels.some(l => l.name === 'in-progress')) {
          newStatus = 'in_progress';
        }

        if (newStatus !== feedback.status) {
          await doc.ref.update({
            status: newStatus,
            githubSyncedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          log(`Updated feedback ${doc.id} status to ${newStatus}`, 'cyan');
        }
      } catch (error) {
        log(`Error syncing status for feedback ${doc.id}: ${error.message}`, 'yellow');
      }
    }
  } catch (error) {
    log(`Error in status sync: ${error.message}`, 'red');
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    if (command === '--sync-back' || command === '-b') {
      // Sync GitHub status back to Firebase
      await syncGitHubStatusBack();
    } else if (command === '--help' || command === '-h') {
      console.log(`
Feedback to GitHub Issues Sync

Usage:
  node scripts/feedback-to-github.js          # Sync new feedback to GitHub
  node scripts/feedback-to-github.js -b       # Sync GitHub status back
  node scripts/feedback-to-github.js -h       # Show this help

Environment Variables Required:
  GITHUB_TOKEN          # GitHub personal access token
  FIREBASE_SERVICE_ACCOUNT  # Firebase service account JSON (for CI/CD)

This script syncs feedback marked as 'ready_for_dev' to GitHub issues.
      `);
    } else {
      // Default: sync feedback to GitHub
      const result = await syncFeedbackToGitHub();
      process.exit(result.errors > 0 ? 1 : 0);
    }
  } catch (error) {
    log(`\nFatal error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { syncFeedbackToGitHub, syncGitHubStatusBack };