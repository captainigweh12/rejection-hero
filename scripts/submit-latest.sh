#!/bin/bash

# Submit the latest EAS build to Google Play
# Usage: ./scripts/submit-latest.sh

set -e

# Colors for output
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${BLUE}📤 Submit Latest Build to Google Play${NC}"
echo "========================================"
echo ""

# Check if EXPO_TOKEN is set
if [ -z "$EXPO_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  EXPO_TOKEN environment variable not set${NC}"
    echo ""
    echo "Set it with:"
    echo "  export EXPO_TOKEN='your-token-here'"
    echo ""
    read -p "Enter your Expo token: " EXPO_TOKEN
    export EXPO_TOKEN
    echo ""
fi

# Check if service account key exists
KEY_FILE="./secrets/google-play-service-account.json"
if [ ! -f "$KEY_FILE" ]; then
    echo -e "${YELLOW}⚠️  Service account key not found at: $KEY_FILE${NC}"
    echo ""
    echo "Run the setup script first:"
    echo "  ./scripts/setup-service-account.sh"
    echo ""
    exit 1
fi

# Verify key has correct permissions
KEY_PERMS=$(stat -c "%a" "$KEY_FILE" 2>/dev/null || stat -f "%OLp" "$KEY_FILE" 2>/dev/null)
if [ "$KEY_PERMS" != "600" ]; then
    echo -e "${YELLOW}⚠️  Setting correct permissions on service account key...${NC}"
    chmod 600 "$KEY_FILE"
fi

echo -e "${GREEN}✅ Configuration verified${NC}"
echo ""
echo "📤 Submitting latest build to Google Play (internal track)..."
echo ""

# Submit latest build
eas submit \
    --platform android \
    --profile production \
    --latest \
    --non-interactive

echo ""
echo -e "${GREEN}✅ Submit complete!${NC}"
echo ""
echo "📱 View in Play Console: https://play.google.com/console/developers"
echo ""

