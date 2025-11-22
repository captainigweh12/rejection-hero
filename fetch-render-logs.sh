#!/bin/bash
# Script to fetch Render logs using the API

RENDER_API_KEY="${RENDER_API_KEY:-rnd_5En3T02nYH74oVfvyyxaAYt2v6aW}"
RENDER_API_URL="https://api.render.com/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Render Logs Fetcher${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Function to list services
list_services() {
    echo -e "${YELLOW}Fetching services...${NC}"
    echo ""
    
    SERVICES=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
        "$RENDER_API_URL/services" | jq -r '.[] | "\(.service.id)|\(.service.name)|\(.service.type)|\(.service.serviceDetails.url || "N/A")"')
    
    if [ -z "$SERVICES" ] || [ "$SERVICES" = "null" ]; then
        echo -e "${RED}❌ No services found or API error${NC}"
        echo "Trying different endpoint format..."
        
        # Try alternative endpoint
        SERVICES=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
            "$RENDER_API_URL/owners" | jq -r '.')
        echo "Response: $SERVICES"
        return 1
    fi
    
    echo -e "${GREEN}Available Services:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    IFS=$'\n'
    i=1
    for service in $SERVICES; do
        IFS='|' read -r id name type url <<< "$service"
        echo -e "${GREEN}$i.${NC} $name (ID: $id)"
        echo "   Type: $type"
        echo "   URL: $url"
        echo ""
        ((i++))
    done
}

# Function to fetch logs for a service
fetch_logs() {
    SERVICE_ID=$1
    LIMIT=${2:-100}  # Default to last 100 log entries
    
    if [ -z "$SERVICE_ID" ]; then
        echo -e "${RED}❌ Service ID required${NC}"
        echo "Usage: fetch_logs <service-id> [limit]"
        return 1
    fi
    
    echo -e "${YELLOW}Fetching last $LIMIT log entries for service $SERVICE_ID...${NC}"
    echo ""
    
    # Fetch logs - note: Render API might have different endpoint structure
    LOGS=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
        "$RENDER_API_URL/services/$SERVICE_ID/logs?limit=$LIMIT" 2>&1)
    
    if echo "$LOGS" | grep -q "error\|Error\|ERROR"; then
        echo -e "${RED}❌ Error fetching logs:${NC}"
        echo "$LOGS" | jq -r '.message // .error // .' 2>/dev/null || echo "$LOGS"
        echo ""
        echo -e "${YELLOW}Note: Render API endpoints may vary.${NC}"
        echo -e "${YELLOW}Alternative: View logs at https://dashboard.render.com${NC}"
        return 1
    fi
    
    # Try to parse logs
    if command -v jq &> /dev/null; then
        echo "$LOGS" | jq -r '.entries[]? | "\(.timestamp // .createdAt // "") | \(.message // .text // .)"' 2>/dev/null || echo "$LOGS"
    else
        echo "$LOGS"
    fi
}

# Main menu
if [ "$1" = "list" ] || [ -z "$1" ]; then
    list_services
elif [ "$1" = "logs" ] && [ -n "$2" ]; then
    fetch_logs "$2" "${3:-100}"
else
    echo -e "${YELLOW}Usage:${NC}"
    echo "  $0 list                          - List all services"
    echo "  $0 logs <service-id> [limit]     - Fetch logs for a service"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 list"
    echo "  $0 logs srv-abc123 50"
    echo ""
    echo -e "${YELLOW}Note:${NC} You can also set RENDER_API_KEY as an environment variable"
    echo "  export RENDER_API_KEY='your-key-here'"
    echo ""
    echo -e "${BLUE}Quick access: https://dashboard.render.com${NC}"
fi

