#!/bin/bash

# Build Android app only (no submit)
# Usage: ./scripts/build-only.sh [profile]

set -e

PROFILE="${1:-production}"

# Colors for output
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 EAS Build Only${NC}"
echo "=================="
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

echo "🔧 Build profile: $PROFILE"
echo ""
echo "📦 Building Android app bundle..."
echo ""

# Build without submit
eas build \
    --platform android \
    --profile "$PROFILE" \
    --non-interactive

echo ""
echo "✅ Build complete!"
echo ""
echo "📊 View your build: https://expo.dev/accounts/captainigweh12/projects/goforno/builds"
echo ""
echo "💡 To submit this build later, run:"
echo "   ./scripts/submit-latest.sh"
echo ""

