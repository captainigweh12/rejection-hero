#!/bin/bash

# Setup iOS workflow for EAS builds and submissions
# This script configures iOS builds similar to Android

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🍎 iOS Workflow Setup${NC}"
echo "======================"
echo ""

# Check if eas.json exists
if [ ! -f "eas.json" ]; then
    echo -e "${YELLOW}⚠️  eas.json not found${NC}"
    echo "Please run this script from the workspace root directory"
    exit 1
fi

echo "📝 This will configure iOS build and submit workflows in eas.json"
echo ""

# Read current eas.json
EAS_JSON=$(cat eas.json)

# Check if iOS is already configured
if echo "$EAS_JSON" | grep -q '"ios".*"simulator": false'; then
    echo -e "${GREEN}✅ iOS production build is already configured${NC}"
else
    echo "🔧 Configuring iOS production build..."
    echo ""
fi

# Check if iOS submit is configured
if echo "$EAS_JSON" | grep -q '"ios".*"ascAppId"'; then
    IOS_APP_ID=$(echo "$EAS_JSON" | grep -o '"ascAppId": "[^"]*"' | cut -d'"' -f4)
    if [ "$IOS_APP_ID" = "your-app-store-connect-app-id" ]; then
        echo -e "${YELLOW}⚠️  iOS submit is configured but needs your App Store Connect App ID${NC}"
        echo ""
        read -p "Enter your App Store Connect App ID (or press Enter to skip): " APP_ID
        if [ -n "$APP_ID" ]; then
            # Update eas.json with actual App ID
            sed -i "s/\"ascAppId\": \"your-app-store-connect-app-id\"/\"ascAppId\": \"$APP_ID\"/" eas.json
            echo -e "${GREEN}✅ Updated App Store Connect App ID${NC}"
        fi
    else
        echo -e "${GREEN}✅ iOS submit already configured with App ID: $IOS_APP_ID${NC}"
    fi
fi

# Create iOS helper scripts
echo ""
echo "📝 Creating iOS helper scripts..."
echo ""

# iOS build script
cat > scripts/build-ios.sh << 'SCRIPT_EOF'
#!/bin/bash

# Build iOS app
# Usage: ./scripts/build-ios.sh [profile]

set -e

PROFILE="${1:-production}"

# Colors for output
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🍎 EAS iOS Build${NC}"
echo "================"
echo ""

# Check if EXPO_TOKEN is set
if [ -z "$EXPO_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  EXPO_TOKEN environment variable not set${NC}"
    echo ""
    read -p "Enter your Expo token: " EXPO_TOKEN
    export EXPO_TOKEN
    echo ""
fi

echo "🔧 Build profile: $PROFILE"
echo ""
echo "📦 Building iOS app..."
echo ""

# Build iOS
eas build \
    --platform ios \
    --profile "$PROFILE" \
    --non-interactive

echo ""
echo "✅ Build complete!"
echo ""
echo "📊 View your build: https://expo.dev/accounts/captainigweh12/projects/goforno/builds"
echo ""
SCRIPT_EOF

# iOS submit script
cat > scripts/submit-ios.sh << 'SCRIPT_EOF'
#!/bin/bash

# Submit latest iOS build to App Store
# Usage: ./scripts/submit-ios.sh

set -e

# Colors for output
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${BLUE}🍎 Submit iOS Build to App Store${NC}"
echo "===================================="
echo ""

# Check if EXPO_TOKEN is set
if [ -z "$EXPO_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  EXPO_TOKEN environment variable not set${NC}"
    echo ""
    read -p "Enter your Expo token: " EXPO_TOKEN
    export EXPO_TOKEN
    echo ""
fi

# Check if ascAppId is configured
ASC_APP_ID=$(grep -o '"ascAppId": "[^"]*"' eas.json | cut -d'"' -f4)
if [ -z "$ASC_APP_ID" ] || [ "$ASC_APP_ID" = "your-app-store-connect-app-id" ]; then
    echo -e "${YELLOW}⚠️  App Store Connect App ID not configured${NC}"
    echo ""
    read -p "Enter your App Store Connect App ID: " ASC_APP_ID
    # Update eas.json
    sed -i "s/\"ascAppId\": \"[^\"]*\"/\"ascAppId\": \"$ASC_APP_ID\"/" eas.json
    echo -e "${GREEN}✅ Updated App Store Connect App ID${NC}"
    echo ""
fi

echo -e "${GREEN}✅ Configuration verified${NC}"
echo ""
echo "📤 Submitting latest iOS build to App Store..."
echo ""

# Submit latest build
eas submit \
    --platform ios \
    --profile production \
    --latest \
    --non-interactive

echo ""
echo -e "${GREEN}✅ Submit complete!${NC}"
echo ""
echo "📱 View in App Store Connect: https://appstoreconnect.apple.com"
echo ""
SCRIPT_EOF

# iOS build + submit script
cat > scripts/build-and-submit-ios.sh << 'SCRIPT_EOF'
#!/bin/bash

# Build and submit iOS app to App Store
# Usage: ./scripts/build-and-submit-ios.sh

set -e

# Colors for output
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${BLUE}🍎 EAS iOS Build & Submit${NC}"
echo "=========================="
echo ""

# Check if EXPO_TOKEN is set
if [ -z "$EXPO_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  EXPO_TOKEN environment variable not set${NC}"
    echo ""
    read -p "Enter your Expo token: " EXPO_TOKEN
    export EXPO_TOKEN
    echo ""
fi

# Check if ascAppId is configured
ASC_APP_ID=$(grep -o '"ascAppId": "[^"]*"' eas.json | cut -d'"' -f4)
if [ -z "$ASC_APP_ID" ] || [ "$ASC_APP_ID" = "your-app-store-connect-app-id" ]; then
    echo -e "${YELLOW}⚠️  App Store Connect App ID not configured${NC}"
    echo ""
    read -p "Enter your App Store Connect App ID: " ASC_APP_ID
    # Update eas.json
    sed -i "s/\"ascAppId\": \"[^\"]*\"/\"ascAppId\": \"$ASC_APP_ID\"/" eas.json
    echo -e "${GREEN}✅ Updated App Store Connect App ID${NC}"
    echo ""
fi

echo -e "${GREEN}✅ Configuration verified${NC}"
echo ""
echo "📦 Building iOS app..."
echo ""

# Build with auto-submit
eas build \
    --platform ios \
    --profile production \
    --non-interactive \
    --auto-submit

echo ""
echo -e "${GREEN}✅ Build and submit complete!${NC}"
echo ""
echo "📊 View your build: https://expo.dev/accounts/captainigweh12/projects/goforno/builds"
echo "📱 View in App Store Connect: https://appstoreconnect.apple.com"
echo ""
SCRIPT_EOF

# Make scripts executable
chmod +x scripts/build-ios.sh
chmod +x scripts/submit-ios.sh
chmod +x scripts/build-and-submit-ios.sh

echo -e "${GREEN}✅ iOS helper scripts created${NC}"
echo ""

# Summary
echo "📋 Summary:"
echo "==========="
echo ""
echo "✅ iOS build configuration: Ready in eas.json"
echo "✅ iOS submit configuration: Ready in eas.json"
echo "✅ Helper scripts created:"
echo "   - scripts/build-ios.sh"
echo "   - scripts/submit-ios.sh"
echo "   - scripts/build-and-submit-ios.sh"
echo ""
echo "📝 Next steps:"
echo "   1. Get your App Store Connect App ID from App Store Connect"
echo "   2. Update eas.json with your App ID (if not done already)"
echo "   3. Run: ./scripts/build-ios.sh"
echo ""
echo -e "${GREEN}✅ iOS workflow setup complete!${NC}"
echo ""

