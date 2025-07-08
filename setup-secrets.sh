#!/bin/bash

echo "🔧 KiddoQuest GitHub Secrets Setup"
echo "=================================="
echo ""

echo "1. Firebase Token Setup:"
echo "   Run: cd Kiddo_Quest && firebase login:ci"
echo "   Copy the generated token and add as FIREBASE_TOKEN in GitHub secrets"
echo ""

echo "2. Expo Token Setup:"
echo "   Run: cd KiddoQuest_mobile && npx expo login"
echo "   Then: npx expo token:create"
echo "   Copy the generated token and add as EXPO_TOKEN in GitHub secrets"
echo ""

echo "3. Slack Webhook (optional):"
echo "   Create a Slack webhook at https://api.slack.com/messaging/webhooks"
echo "   Add the webhook URL as SLACK_WEBHOOK in GitHub secrets"
echo ""

echo "GitHub Secrets Location:"
echo "https://github.com/thetangstr/Kiddo_Quest/settings/secrets/actions"
echo ""

echo "4. After adding secrets, you can test the pipeline by making a commit to the develop branch"
echo ""

# Check if Firebase CLI is available
if command -v firebase &> /dev/null; then
    echo "✅ Firebase CLI is available"
    echo "   Current project: $(firebase projects:list --format=table | grep kiddo-quest-de7b0 || echo 'Not found')"
else
    echo "❌ Firebase CLI not found. Install with: npm install -g firebase-tools"
fi

# Check if Expo CLI is available
if command -v expo &> /dev/null; then
    echo "✅ Expo CLI is available"
else
    echo "❌ Expo CLI not found. Install with: npm install -g @expo/cli"
fi

echo ""
echo "🎯 Next steps:"
echo "1. Add the three secrets to GitHub"
echo "2. Run: git checkout develop && git commit --allow-empty -m 'Test CI/CD pipeline' && git push"
echo "3. Check GitHub Actions at: https://github.com/thetangstr/Kiddo_Quest/actions"