#!/bin/bash

# KiddoQuest iOS & Android Build Script
echo "📱 KiddoQuest Mobile App Build Process"
echo "======================================"
echo ""

# Navigate to the correct directory
cd /Users/Kailor_1/Desktop/Projects/kq_v0.5/KiddoQuest_mobile

echo "✅ Current Configuration:"
echo "   - EAS Project: b1de6edc-e799-44d9-bce3-c9eedf49b27d"
echo "   - Bundle ID: com.kiddoquest.app"
echo "   - App Name: KiddoQuest"
echo "   - Version: 1.0.0"
echo ""

echo "🔑 Credential Setup Required"
echo "Each platform needs signing credentials to be set up interactively."
echo ""

echo "📱 Starting iOS Build..."
echo "You'll be asked about Apple account and certificates."
echo "RECOMMENDED ANSWERS:"
echo "  - Apple account login: No (use Expo managed)"
echo "  - Generate Provisioning Profile: Yes"
echo "  - Generate Distribution Certificate: Yes"
echo ""

echo "Starting iOS build in 3 seconds..."
sleep 1
echo "2..."
sleep 1 
echo "1..."
sleep 1

# Start iOS build
echo "🚀 Building iOS app..."
eas build --platform ios --profile development

echo ""
echo "✅ iOS build started! Now starting Android build..."
echo ""

echo "🤖 Starting Android Build..."
echo "You'll be asked about Android keystore."
echo "RECOMMENDED ANSWERS:"
echo "  - Generate new keystore: Yes"
echo "  - Enter a secure password and remember it"
echo ""

echo "Starting Android build in 3 seconds..."
sleep 3

# Start Android build  
echo "🚀 Building Android app..."
eas build --platform android --profile development

echo ""
echo "🎉 Both builds started!"
echo ""
echo "📊 Monitor your builds at: https://expo.dev/builds"
echo ""
echo "⏱️ Expected completion time:"
echo "  - iOS: 10-15 minutes"
echo "  - Android: 8-12 minutes"
echo ""
echo "📱 Installation:"
echo "  - You'll get QR codes and download links"
echo "  - Scan with your phone to install directly"
echo ""
echo "✅ Your KiddoQuest mobile apps are being built!"