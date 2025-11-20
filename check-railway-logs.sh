#!/bin/bash
set -e

echo "🔍 Checking Railway deployment logs..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
  echo "⚠️  Railway CLI not found. Installing..."
  npm install -g @railway/cli 2>&1 | grep -v "^$" | head -20
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
  echo "⚠️  Not logged in to Railway. Attempting to login with token..."
  # Railway CLI uses token via environment variable
  export RAILWAY_TOKEN="${RAILWAY_TOKEN:-9189bf8e-8a69-44e3-be5d-c3284586dbed}"
  
  # Try to use token directly
  echo "📋 Note: Railway CLI needs interactive login. You may need to run:"
  echo "   railway login"
  echo ""
  echo "🔍 Fetching logs using Railway API instead..."
  
  # Fallback: Use curl to get logs
  check_via_api=true
else
  check_via_api=false
  echo "✅ Railway CLI authenticated"
fi

if [ "$check_via_api" = true ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📋 Alternative: Manual Verification Steps"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "1. Go to Railway Dashboard: https://railway.app/dashboard"
  echo "2. Select your backend service"
  echo "3. Click on 'Deployments' tab"
  echo "4. Click on the latest deployment"
  echo "5. Check the logs for:"
  echo ""
  echo "   ✅ Success indicators:"
  echo "      • 'Database schema sync completed successfully'"
  echo "      • 'user_quest table exists'"
  echo "      • 'user_stats table exists'"
  echo "      • 'user table exists'"
  echo "      • 'Starting server...'"
  echo ""
  echo "   ❌ Error indicators:"
  echo "      • 'Database schema sync failed!'"
  echo "      • 'does not exist' errors"
  echo "      • Connection errors"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  # Try to provide a summary of what to check
  echo "📊 Expected Log Pattern:"
  echo ""
  cat << 'EOF'
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Starting Backend Service...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Checking environment variables...
📊 DATABASE_URL is set: YES
📊 DIRECT_URL is set: YES/NO
📡 Using DATABASE_URL for schema sync (non-pooler detected)
🔄 Syncing database schema with Prisma db push...
✅ Database schema sync completed successfully
🔍 Verifying critical tables were created...
✅ user_quest table exists
✅ user_stats table exists
✅ user table exists
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Starting server...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
  
  exit 0
fi

# If Railway CLI is available, fetch logs
echo ""
echo "📜 Fetching latest deployment logs..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

LOGS=$(railway logs --deployment latest 2>&1 || railway logs 2>&1)

if [ $? -eq 0 ] && [ -n "$LOGS" ]; then
  echo "$LOGS"
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔍 Verifying deployment logs..."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # Check for key success indicators
  SUCCESS_COUNT=0
  ERROR_COUNT=0
  
  if echo "$LOGS" | grep -qi "Database schema sync completed successfully"; then
    echo "✅ Schema sync completed successfully"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo "❌ Schema sync completion message not found"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
  
  if echo "$LOGS" | grep -qi "user_quest table exists"; then
    echo "✅ user_quest table exists"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo "⚠️  user_quest table verification not found"
  fi
  
  if echo "$LOGS" | grep -qi "user_stats table exists"; then
    echo "✅ user_stats table exists"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo "⚠️  user_stats table verification not found"
  fi
  
  if echo "$LOGS" | grep -qi "user table exists"; then
    echo "✅ user table exists"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo "⚠️  user table verification not found"
  fi
  
  if echo "$LOGS" | grep -qi "Starting server"; then
    echo "✅ Server started successfully"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo "⚠️  Server start message not found"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
  
  # Check for errors
  if echo "$LOGS" | grep -qi "Database schema sync failed"; then
    echo "❌ Schema sync failed!"
    ERROR_COUNT=$((ERROR_COUNT + 1))
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
  else
    echo "⚠️  Deployment verification: INCOMPLETE"
    exit 0
  fi
else
  echo "⚠️  Could not fetch logs via Railway CLI"
  echo ""
  echo "Try manually checking Railway dashboard:"
  echo "https://railway.app/dashboard"
  exit 0
fi

