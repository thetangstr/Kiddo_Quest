#!/bin/bash

# Pre-deployment checklist script for KiddoQuest
echo "🚀 KiddoQuest Pre-Deployment Checklist"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a file exists
file_exists() {
    [ -f "$1" ]
}

echo -e "\n📋 Checking Required Tools..."

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not installed"
fi

# Check Firebase CLI
if command_exists firebase; then
    FIREBASE_VERSION=$(firebase --version)
    echo -e "${GREEN}✓${NC} Firebase CLI installed: $FIREBASE_VERSION"
else
    echo -e "${RED}✗${NC} Firebase CLI not installed - run: npm install -g firebase-tools"
fi

# Check EAS CLI
if command_exists eas; then
    EAS_VERSION=$(eas --version)
    echo -e "${GREEN}✓${NC} EAS CLI installed: $EAS_VERSION"
else
    echo -e "${RED}✗${NC} EAS CLI not installed - run: npm install -g eas-cli"
fi

echo -e "\n📁 Checking Web App Files..."

# Check web app files
cd Kiddo_Quest 2>/dev/null || { echo -e "${RED}✗${NC} Kiddo_Quest directory not found"; exit 1; }

if file_exists ".env"; then
    echo -e "${GREEN}✓${NC} Web app .env file exists"
else
    echo -e "${YELLOW}⚠${NC} Web app .env file missing - copy from .env.example"
fi

if file_exists "firebase.json"; then
    echo -e "${GREEN}✓${NC} firebase.json exists"
else
    echo -e "${RED}✗${NC} firebase.json missing - run: firebase init"
fi

if file_exists "firestore.rules"; then
    echo -e "${GREEN}✓${NC} Firestore rules file exists"
else
    echo -e "${RED}✗${NC} firestore.rules missing"
fi

echo -e "\n📱 Checking Mobile App Files..."

cd ../KiddoQuest_mobile 2>/dev/null || { echo -e "${RED}✗${NC} KiddoQuest_mobile directory not found"; exit 1; }

if file_exists ".env"; then
    echo -e "${GREEN}✓${NC} Mobile app .env file exists"
else
    echo -e "${YELLOW}⚠${NC} Mobile app .env file missing - copy from .env.example"
fi

if file_exists "google-services.json"; then
    echo -e "${GREEN}✓${NC} google-services.json exists"
else
    echo -e "${YELLOW}⚠${NC} google-services.json missing - download from Firebase Console"
fi

if file_exists "GoogleService-Info.plist"; then
    echo -e "${GREEN}✓${NC} GoogleService-Info.plist exists"
else
    echo -e "${YELLOW}⚠${NC} GoogleService-Info.plist missing - download from Firebase Console"
fi

if file_exists "eas.json"; then
    echo -e "${GREEN}✓${NC} eas.json exists"
else
    echo -e "${RED}✗${NC} eas.json missing - run: eas build:configure"
fi

echo -e "\n🔐 Checking Security..."

# Check for exposed API keys
cd ..
if grep -r "AIzaSy" --include="*.js" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.git . 2>/dev/null | grep -v "process.env" | grep -v "||" > /dev/null; then
    echo -e "${YELLOW}⚠${NC} Potential hardcoded API keys found - review and move to environment variables"
else
    echo -e "${GREEN}✓${NC} No hardcoded API keys detected"
fi

echo -e "\n📊 Deployment Readiness Summary:"
echo "================================"

# Check if we're ready to deploy
READY=true

if ! command_exists firebase; then
    echo -e "${RED}Install Firebase CLI before deploying${NC}"
    READY=false
fi

if [ ! -f "Kiddo_Quest/.env" ]; then
    echo -e "${YELLOW}Create web app .env file before deploying${NC}"
    READY=false
fi

if [ ! -f "KiddoQuest_mobile/.env" ]; then
    echo -e "${YELLOW}Create mobile app .env file before building${NC}"
    READY=false
fi

if $READY; then
    echo -e "\n${GREEN}✅ Ready to deploy!${NC}"
    echo -e "\nNext steps:"
    echo "1. Run deployment commands from DEPLOY_NOW.md"
    echo "2. Test all features after deployment"
    echo "3. Submit mobile apps to stores"
else
    echo -e "\n${YELLOW}⚠️  Fix the issues above before deploying${NC}"
fi

echo -e "\n🎯 Quick Deploy Commands:"
echo "========================"
echo "Web App:    cd Kiddo_Quest && firebase deploy"
echo "iOS Build:  cd KiddoQuest_mobile && eas build --platform ios"
echo "Android:    cd KiddoQuest_mobile && eas build --platform android"