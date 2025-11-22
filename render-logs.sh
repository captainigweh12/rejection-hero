#!/bin/bash
# Simple script to fetch Render logs using the API

RENDER_API_KEY="${RENDER_API_KEY:-rnd_5En3T02nYH74oVfvyyxaAYt2v6aW}"
RENDER_API_URL="https://api.render.com/v1"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Fetching Render Services..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Fetch services
echo "Fetching services..."
SERVICES_JSON=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
    "$RENDER_API_URL/services")

if [ $? -ne 0 ] || [ -z "$SERVICES_JSON" ]; then
    echo "❌ Error fetching services from Render API"
    echo "Response: $SERVICES_JSON"
    exit 1
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "⚠️  jq not found. Installing jq or showing raw response..."
    echo ""
    echo "$SERVICES_JSON" | head -50
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Install jq to parse JSON:"
    echo "  sudo apt-get install jq  # Debian/Ubuntu"
    echo "  or"
    echo "  brew install jq          # macOS"
    exit 0
fi

# Parse services
echo "✅ Services found:"
echo ""
SERVICE_COUNT=$(echo "$SERVICES_JSON" | jq '. | length' 2>/dev/null || echo "0")

if [ "$SERVICE_COUNT" = "0" ] || [ "$SERVICE_COUNT" = "null" ]; then
    echo "⚠️  No services found in response"
    echo "Raw response:"
    echo "$SERVICES_JSON" | jq '.' | head -30
    exit 0
fi

# Display services
echo "$SERVICES_JSON" | jq -r '.[] | "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nService: \(.service.name // .name // "Unknown")\nID: \(.service.id // .id // "Unknown")\nType: \(.service.type // .type // "Unknown")\nURL: \(.service.serviceDetails.url // .serviceDetails.url // "N/A")\nState: \(.service.updatedAt // .updatedAt // "N/A")\n"'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 To view logs:"
echo "   1. Go to: https://dashboard.render.com"
echo "   2. Click on your service"
echo "   3. Click on 'Logs' tab"
echo ""
echo "Or use the service ID above to fetch logs via API"
echo ""
echo "Service IDs found:"
echo "$SERVICES_JSON" | jq -r '.[] | "  - \(.service.id // .id)"' 2>/dev/null || echo "  Could not parse service IDs"

