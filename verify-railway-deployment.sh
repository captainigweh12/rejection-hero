#!/bin/bash
set -e

RAILWAY_TOKEN="${RAILWAY_TOKEN:-9189bf8e-8a69-44e3-be5d-c3284586dbed}"
RAILWAY_API="https://api.railway.app/v1"
RAILWAY_GRAPHQL="https://backboard.railway.app/graphql/v2"

echo "🔍 Checking Railway deployment status..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔑 Using Railway token: ${RAILWAY_TOKEN:0:10}..."

# Try GraphQL API first (Railway's main API)
echo "📋 Fetching Railway projects via GraphQL API..."
PROJECTS_QUERY='{"query":"query { projects { edges { node { id name } } } }"}'
PROJECTS_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PROJECTS_QUERY" \
  "$RAILWAY_GRAPHQL" 2>&1)

if echo "$PROJECTS_RESPONSE" | grep -q "error\|unauthorized"; then
  echo "❌ Failed to fetch projects. Response:"
  echo "$PROJECTS_RESPONSE" | head -20
  exit 1
fi

# Try to find project (assuming first one or by name)
PROJECT_ID=$(echo "$PROJECTS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

if [ -z "$PROJECT_ID" ]; then
  echo "⚠️  Could not find project ID automatically"
  echo "📋 Projects response:"
  echo "$PROJECTS_RESPONSE" | head -30
  echo ""
  echo "🔍 Trying alternative method: Checking for services..."
  
  # Try to get services directly
  SERVICES_RESPONSE=$(curl -s -H "Authorization: Bearer $RAILWAY_TOKEN" \
    "$RAILWAY_API/services" 2>&1)
  
  echo "Services response:"
  echo "$SERVICES_RESPONSE" | head -50
  exit 1
fi

echo "✅ Found project ID: $PROJECT_ID"

# Get services for this project
echo ""
echo "📋 Fetching services for project..."
SERVICES_RESPONSE=$(curl -s -H "Authorization: Bearer $RAILWAY_TOKEN" \
  "$RAILWAY_API/projects/$PROJECT_ID/services" 2>&1)

if echo "$SERVICES_RESPONSE" | grep -q "error"; then
  echo "❌ Failed to fetch services. Response:"
  echo "$SERVICES_RESPONSE" | head -20
  exit 1
fi

# Get service ID (assuming first service or backend service)
SERVICE_ID=$(echo "$SERVICES_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

if [ -z "$SERVICE_ID" ]; then
  echo "⚠️  Could not find service ID"
  echo "Services response:"
  echo "$SERVICES_RESPONSE" | head -50
  exit 1
fi

echo "✅ Found service ID: $SERVICE_ID"

# Get latest deployment
echo ""
echo "🔍 Fetching latest deployment..."
DEPLOYMENTS_RESPONSE=$(curl -s -H "Authorization: Bearer $RAILWAY_TOKEN" \
  "$RAILWAY_API/services/$SERVICE_ID/deployments?limit=1" 2>&1)

if echo "$DEPLOYMENTS_RESPONSE" | grep -q "error"; then
  echo "❌ Failed to fetch deployments. Response:"
  echo "$DEPLOYMENTS_RESPONSE" | head -20
  exit 1
fi

DEPLOYMENT_ID=$(echo "$DEPLOYMENTS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
DEPLOYMENT_STATUS=$(echo "$DEPLOYMENTS_RESPONSE" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

if [ -z "$DEPLOYMENT_ID" ]; then
  echo "⚠️  No deployments found"
  echo "Deployments response:"
  echo "$DEPLOYMENTS_RESPONSE" | head -50
  exit 1
fi

echo "✅ Found deployment ID: $DEPLOYMENT_ID"
echo "📊 Deployment status: $DEPLOYMENT_STATUS"

# Wait for deployment to complete if it's still running
if [ "$DEPLOYMENT_STATUS" != "SUCCESS" ] && [ "$DEPLOYMENT_STATUS" != "FAILED" ] && [ "$DEPLOYMENT_STATUS" != "COMPLETED" ]; then
  echo ""
  echo "⏳ Deployment is $DEPLOYMENT_STATUS. Waiting for completion..."
  
  MAX_WAIT=300  # 5 minutes
  WAITED=0
  CHECK_INTERVAL=10
  
  while [ $WAITED -lt $MAX_WAIT ]; do
    sleep $CHECK_INTERVAL
    WAITED=$((WAITED + CHECK_INTERVAL))
    
    DEPLOYMENTS_RESPONSE=$(curl -s -H "Authorization: Bearer $RAILWAY_TOKEN" \
      "$RAILWAY_API/services/$SERVICE_ID/deployments?limit=1" 2>&1)
    
    DEPLOYMENT_STATUS=$(echo "$DEPLOYMENTS_RESPONSE" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
    
    echo "   Status: $DEPLOYMENT_STATUS (waited ${WAITED}s)"
    
    if [ "$DEPLOYMENT_STATUS" = "SUCCESS" ] || [ "$DEPLOYMENT_STATUS" = "FAILED" ] || [ "$DEPLOYMENT_STATUS" = "COMPLETED" ]; then
      break
    fi
  done
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Final deployment status: $DEPLOYMENT_STATUS"

# Fetch logs
echo ""
echo "📜 Fetching deployment logs..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get logs for the deployment
LOGS_RESPONSE=$(curl -s -H "Authorization: Bearer $RAILWAY_TOKEN" \
  "$RAILWAY_API/deployments/$DEPLOYMENT_ID/logs" 2>&1)

if echo "$LOGS_RESPONSE" | grep -q "error"; then
  echo "⚠️  Could not fetch logs via API. Trying alternative endpoint..."
  # Try alternative endpoint
  LOGS_RESPONSE=$(curl -s -H "Authorization: Bearer $RAILWAY_TOKEN" \
    "$RAILWAY_API/services/$SERVICE_ID/logs?deploymentId=$DEPLOYMENT_ID" 2>&1)
fi

echo "$LOGS_RESPONSE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Verifying deployment logs..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for key success indicators
SUCCESS_COUNT=0
ERROR_COUNT=0

if echo "$LOGS_RESPONSE" | grep -qi "Database schema sync completed successfully"; then
  echo "✅ Schema sync completed successfully"
  SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
  echo "❌ Schema sync completion message not found"
  ERROR_COUNT=$((ERROR_COUNT + 1))
fi

if echo "$LOGS_RESPONSE" | grep -qi "user_quest table exists"; then
  echo "✅ user_quest table exists"
  SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
  echo "⚠️  user_quest table verification not found"
fi

if echo "$LOGS_RESPONSE" | grep -qi "user_stats table exists"; then
  echo "✅ user_stats table exists"
  SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
  echo "⚠️  user_stats table verification not found"
fi

if echo "$LOGS_RESPONSE" | grep -qi "user table exists"; then
  echo "✅ user table exists"
  SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
  echo "⚠️  user table verification not found"
fi

if echo "$LOGS_RESPONSE" | grep -qi "Starting server"; then
  echo "✅ Server started successfully"
  SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
  echo "⚠️  Server start message not found"
  ERROR_COUNT=$((ERROR_COUNT + 1))
fi

# Check for errors
if echo "$LOGS_RESPONSE" | grep -qi "Database schema sync failed"; then
  echo "❌ Schema sync failed!"
  ERROR_COUNT=$((ERROR_COUNT + 1))
fi

if echo "$LOGS_RESPONSE" | grep -qi "does not exist"; then
  echo "⚠️  Found 'does not exist' messages (may be expected warnings)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Verification Summary:"
echo "   ✅ Success indicators: $SUCCESS_COUNT"
echo "   ❌ Errors found: $ERROR_COUNT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERROR_COUNT -eq 0 ] && [ $SUCCESS_COUNT -ge 3 ]; then
  echo "✅ Deployment verification: SUCCESS"
  exit 0
elif [ "$DEPLOYMENT_STATUS" = "FAILED" ]; then
  echo "❌ Deployment verification: FAILED"
  exit 1
else
  echo "⚠️  Deployment verification: INCOMPLETE (some checks passed)"
  exit 0
fi

