#!/bin/bash
# Start Production Android Build

export EXPO_TOKEN=eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv

echo "🚀 Starting Production Android Build..."
echo ""
echo "Project: @captainigweh12/goforno"
echo "Profile: production"
echo ""
echo "⚠️  IMPORTANT: When prompted 'Generate a new Android Keystore?'"
echo "   Answer: 'No' or 'N' (you already have one uploaded)"
echo ""
echo "Build will take 10-20 minutes..."
echo ""

cd /home/user/workspace

# Start the build
npx eas-cli build --platform android --profile production

echo ""
echo "✅ Build started!"
echo ""
echo "Monitor your build at:"
echo "https://expo.dev/accounts/captainigweh12/projects/goforno/builds"
echo ""
echo "Check status with:"
echo "npx eas-cli build:list --platform android"

