#!/bin/bash
# EAS Login using Access Token

echo "🔐 EAS Login with Access Token"
echo ""

# Check if token is provided
if [ -z "$EXPO_TOKEN" ]; then
    echo "❌ EXPO_TOKEN environment variable not set"
    echo ""
    echo "To get your token:"
    echo "1. Go to https://expo.dev and log in"
    echo "2. Navigate to Account Settings → Access Tokens"
    echo "3. Create a new access token"
    echo "4. Copy the token (starts with 'exp_...')"
    echo ""
    echo "Then run:"
    echo "  export EXPO_TOKEN=your_token_here"
    echo "  ./login-with-token.sh"
    exit 1
fi

cd /home/user/workspace

# Verify login with token
export EXPO_TOKEN=$EXPO_TOKEN

# Check if logged in
if npx eas-cli whoami > /dev/null 2>&1; then
    echo "✅ Login successful!"
    npx eas-cli whoami
    exit 0
else
    echo "❌ Login failed. Please check your token."
    exit 1
fi

