#!/bin/bash
# Setup EAS Credentials for Android Production

export EXPO_TOKEN=eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv

echo "🔐 Setting up Android production credentials..."
echo ""
echo "Follow these prompts:"
echo "1. Select: Android"
echo "2. Select: Production"
echo "3. Select: Keystore: Set up a new keystore"
echo "4. Select: Generate new keystore"
echo ""
echo "⚠️  IMPORTANT: Save the passwords securely when shown!"
echo ""

cd /home/user/workspace
npx eas-cli credentials --platform android

echo ""
echo "After keystore is created, get SHA-1 fingerprint:"
echo "  npx eas-cli credentials --platform android"
echo "  → Production → Keystore → Show fingerprints"

