#!/bin/bash
# EAS Login Helper Script
# This script helps automate EAS login with credentials

echo "🔐 Attempting EAS Login..."
echo "📧 Email: captainigweh12@gmail.com"
echo ""

# Note: EAS CLI typically uses OAuth/browser-based login
# This script will attempt to login, but may still require browser interaction

cd /home/user/workspace

# Check if already logged in
if npx eas-cli whoami > /dev/null 2>&1; then
    echo "✅ Already logged in!"
    npx eas-cli whoami
    exit 0
fi

# Attempt login
echo "🚀 Starting EAS login process..."
echo "⚠️  Note: EAS CLI uses browser-based OAuth authentication."
echo "   A browser window may open, or you'll need to enter a code manually."
echo ""

npx eas-cli login

# Verify login
if npx eas-cli whoami > /dev/null 2>&1; then
    echo ""
    echo "✅ Login successful!"
    npx eas-cli whoami
    exit 0
else
    echo ""
    echo "❌ Login failed or not completed."
    echo "   Please try running: npx eas-cli login"
    exit 1
fi

