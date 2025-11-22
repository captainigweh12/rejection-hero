#!/bin/bash
# Script to fetch logs for the rejection-hero service

RENDER_API_KEY="${RENDER_API_KEY:-rnd_5En3T02nYH74oVfvyyxaAYt2v6aW}"
SERVICE_ID="${SERVICE_ID:-srv-d4gd5onpm1nc73f8r010}"  # rejection-hero service ID
RENDER_API_URL="https://api.render.com/v1"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Fetching Render Logs for: rejection-hero"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Service ID: $SERVICE_ID"
echo ""

# Note: Render API doesn't have a direct logs endpoint
# Logs are typically accessed via SSH or the dashboard
echo "ℹ️  Note: Render API doesn't provide a direct logs endpoint."
echo "   Logs are available via:"
echo ""
echo "   1. Web Dashboard (Recommended):"
echo "      https://dashboard.render.com/web/$SERVICE_ID"
echo ""
echo "   2. SSH into the service:"
echo "      ssh $SERVICE_ID@ssh.oregon.render.com"
echo "      Then view logs in the container"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Service Information:"
echo ""

# Fetch service details
SERVICE_INFO=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
    "$RENDER_API_URL/services/$SERVICE_ID")

if command -v jq &> /dev/null; then
    echo "$SERVICE_INFO" | jq -r '.service | 
        "Name: \(.name // "N/A")
ID: \(.id // "N/A")
Type: \(.type // "N/A")
URL: \(.serviceDetails.url // "N/A")
Status: \(.suspended // "active")
Region: \(.serviceDetails.region // "N/A")
Plan: \(.serviceDetails.plan // "N/A")
Updated: \(.updatedAt // "N/A")
Dashboard: \(.dashboardUrl // "N/A")"'
else
    echo "$SERVICE_INFO"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 Quick Links:"
echo "   Dashboard: https://dashboard.render.com/web/$SERVICE_ID"
echo "   Logs Tab: https://dashboard.render.com/web/$SERVICE_ID/logs"
echo ""
echo "   SSH Address: $SERVICE_ID@ssh.oregon.render.com"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

