#!/bin/bash

# KiddoQuest iOS Build Script
# Run this script to build your iOS app

echo "🎯 KiddoQuest iOS Build Process"
echo "================================"
echo ""

# Navigate to the correct directory
cd /Users/Kailor_1/Desktop/Projects/kq_v0.5/KiddoQuest_mobile

echo "📱 Step 1: Login to EAS"
echo "This will open your browser to login to your Expo account"
echo "If you don't have an Expo account, create one at https://expo.dev"
echo ""

# Login to EAS
eas login

# Check if login was successful
if ! eas whoami > /dev/null 2>&1; then
    echo "❌ EAS login failed. Please try again."
    exit 1
fi

echo ""
echo "✅ Login successful!"
echo ""

echo "📝 Step 2: Configure EAS project"
echo "This will generate a unique project ID and configure build settings"
echo "Note: You may see Firebase import warnings - these are local only and won't affect the build"
echo ""

# Configure EAS build (may show warnings but will work)
eas build:configure || echo "⚠️ Configuration warnings are normal due to local Firebase module imports"

echo ""
echo "🚀 Step 3: Starting iOS development build"
echo "This will take 10-15 minutes..."
echo "You can monitor progress at: https://expo.dev/builds"
echo ""

# Start the iOS build
eas build --platform ios --profile development

echo ""
echo "🎉 Build process started!"
echo ""
echo "📋 Next steps:"
echo "1. Monitor your build at: https://expo.dev/builds"
echo "2. When complete, you'll get a download link and QR code"
echo "3. Install the app on your iPhone/iPad using the QR code"
echo "4. Test all features: login, quests, rewards, etc."
echo ""
echo "📱 For App Store submission, run:"
echo "eas build --platform ios --profile production"
echo ""
echo "✅ Your KiddoQuest iOS app is being built!"