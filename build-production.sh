#!/bin/bash
# Build Production Android App Bundle

export EXPO_TOKEN=eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv

echo "🚀 Building Production Android App Bundle..."
echo ""
echo "The build process will:"
echo "  1. Ask if you want to generate a new keystore"
echo "  2. Select 'No' (since you already uploaded it)"
echo "  3. Use existing keystore from Expo account"
echo "  4. Start the build (takes 10-20 minutes)"
echo ""
echo "⚠️  When prompted: 'Generate a new Android Keystore?'"
echo "   Answer: 'No' or 'N' to use existing keystore"
echo ""

cd /home/user/workspace

# Start the build - will prompt for keystore confirmation
npx eas-cli build --platform android --profile production

echo ""
echo "✅ Build started!"
echo ""
echo "To check build status:"
echo "  npx eas-cli build:list"
echo ""
echo "To view build details:"
echo "  npx eas-cli build:view [BUILD_ID]"

