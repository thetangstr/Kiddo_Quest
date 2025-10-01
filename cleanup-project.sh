#!/bin/bash

# KiddoQuest Project Cleanup Script
# This script removes unused files and directories from previous iterations
# Run with: bash cleanup-project.sh

echo "🧹 Starting KiddoQuest project cleanup..."
echo "⚠️  This will remove files permanently. Make sure you have a backup!"
echo ""
read -p "Do you want to proceed? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cleanup cancelled."
    exit 1
fi

# Create a cleanup log
CLEANUP_LOG="cleanup_$(date +%Y%m%d_%H%M%S).log"
echo "Cleanup started at $(date)" > "$CLEANUP_LOG"

# Function to safely remove files/directories
safe_remove() {
    if [ -e "$1" ]; then
        echo "Removing: $1"
        echo "Removing: $1" >> "$CLEANUP_LOG"
        rm -rf "$1"
    else
        echo "Not found (skipping): $1"
    fi
}

echo ""
echo "1️⃣ Removing unused Expo template directories..."
safe_remove "KiddoQuest_expo"
safe_remove "KiddoQuest_expo_web"

echo ""
echo "2️⃣ Removing sensitive files (add to .gitignore!)..."
safe_remove "kiddo-quest-de7b0-firebase-adminsdk-fbsvc-67a2b742c0.json"
safe_remove "Kiddo_Quest/serviceAccountKey.json"
safe_remove "keys"

echo ""
echo "3️⃣ Removing test artifacts..."
safe_remove "Kiddo_Quest/playwright-report"
safe_remove "Kiddo_Quest/test-results"
safe_remove "KiddoQuest_mobile/test-results"
safe_remove "Kiddo_Quest/test-auth.html"

echo ""
echo "4️⃣ Removing redundant documentation..."
safe_remove "KiddoQuest_mobile/BUILD_BOTH_PLATFORMS.md"
safe_remove "KiddoQuest_mobile/BUILD_NOW_FIXED.md"
safe_remove "KiddoQuest_mobile/BUILD_READY.md"
safe_remove "KiddoQuest_mobile/FINAL_BUILD_COMMAND.md"
safe_remove "KiddoQuest_mobile/IOS_BUILD_INSTRUCTIONS.md"
safe_remove "KiddoQuest_mobile/MANUAL_BUILD_GUIDE.md"
safe_remove "KiddoQuest_mobile/MANUAL_BUILD_STEPS.md"
safe_remove "KiddoQuest_mobile/PRODUCTION_SETUP.md"
safe_remove "DEPLOY_COMMANDS.md"
safe_remove "DEPLOY_NOW.md"

echo ""
echo "5️⃣ Removing old debug test files..."
cd Kiddo_Quest/tests
safe_remove "auth-debug.spec.js"
safe_remove "bug-fix-final-verification.spec.js"
safe_remove "bug-fixes-verification.spec.js"
safe_remove "debug-auth-issues.spec.js"
safe_remove "debug-amazon-modal.spec.js"
safe_remove "debug-modal-state.spec.js"
safe_remove "debug-test.spec.js"
safe_remove "deployed-site-debug.spec.js"
safe_remove "production-error-fix.spec.js"
safe_remove "test-deployed-fix.spec.js"
safe_remove "test-with-debug.spec.js"
safe_remove "reward-debug-test.spec.js"
safe_remove "amazon-debug.spec.js"
safe_remove "amazon-manual-test.spec.js"
safe_remove "simple-bug-check.spec.js"
safe_remove "test-after-domain-fix.spec.js"
safe_remove "find-amazon-button.spec.js"
safe_remove "live-site-reward-test.spec.js"
safe_remove "manual-navigation-test.spec.js"
safe_remove "production-login-test.spec.js"
safe_remove "reward-complete-test.spec.js"
safe_remove "reward-save-test.spec.js"
safe_remove "simple-amazon-test.spec.js"
safe_remove "test-with-debug.spec.js"
safe_remove "ui-test.spec.js"
safe_remove "neumorphic-ui-test.spec.js"
safe_remove "final-ui-test.spec.js"
safe_remove "feedback-fix-test.spec.js"
safe_remove "amazon-component-test.spec.js"
safe_remove "amazon-feature-complete.spec.js"
safe_remove "confirm-amazon-working.spec.js"
safe_remove "navigation-debug.spec.js"
safe_remove "reward-with-login-test.spec.js"
safe_remove "invitation-flow.js"
safe_remove "mcp-invitation-flow.js"
cd ../..

echo ""
echo "6️⃣ Removing build artifacts..."
safe_remove "KiddoQuest_mobile/kiddoquest.aab"
safe_remove "KiddoQuest_mobile/dist"
safe_remove "KiddoQuest_mobile/web-build"
safe_remove "Kiddo_Quest/build"

echo ""
echo "7️⃣ Removing temporary files..."
safe_remove "Kiddo_Quest/users.json"
safe_remove "Screenshot 2025-06-21 at 11.34.08 PM.png"
safe_remove "gemini.md"

echo ""
echo "8️⃣ Removing old configuration files..."
safe_remove "Kiddo_Quest/fix-auth-domains.md"
safe_remove "KiddoQuest_mobile/windsurf_deployment.yaml"

echo ""
echo "9️⃣ Cleaning up old test screenshots..."
# Keep only essential screenshots
cd Kiddo_Quest/tests/screenshots
find . -name "*.png" -mtime +7 -delete 2>/dev/null || true
cd ../../..

echo ""
echo "✅ Cleanup completed!"
echo "📄 Cleanup log saved to: $CLEANUP_LOG"
echo ""
echo "⚠️  IMPORTANT: Add these entries to your .gitignore:"
echo "serviceAccountKey.json"
echo "*firebase-adminsdk*.json"
echo "keys/"
echo "playwright-report/"
echo "test-results/"
echo "*.aab"
echo "dist/"
echo "build/"
echo "web-build/"
echo ""
echo "🔒 For security, ensure all service account keys are properly secured!"