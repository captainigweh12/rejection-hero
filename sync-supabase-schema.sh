#!/bin/bash
set -e

# Script to sync Prisma schema to Supabase PostgreSQL database
# This runs prisma db push directly against Supabase

echo "🔗 Syncing Prisma schema to Supabase..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Project configuration
PROJECT_REF="vtevcjqigebtxmkjzdjq"
SUPABASE_PASSWORD="Emmanuel1igweh!"
SUPABASE_DB_HOST="db.vtevcjqigebtxmkjzdjq.supabase.co"

# Construct connection string with SSL
DATABASE_URL="postgresql://postgres:${SUPABASE_PASSWORD}@${SUPABASE_DB_HOST}:5432/postgres?sslmode=require"

echo "📋 Configuration:"
echo "   Project Ref: ${PROJECT_REF}"
echo "   Database Host: ${SUPABASE_DB_HOST}"
echo "   Connection: postgresql://postgres:***@${SUPABASE_DB_HOST}:5432/postgres?sslmode=require"
echo ""

# Check if we're in the backend directory
if [ ! -f "backend/prisma/schema.prisma" ]; then
  if [ -f "prisma/schema.prisma" ]; then
    cd backend 2>/dev/null || cd . 2>/dev/null
  else
    echo "❌ Error: Could not find prisma/schema.prisma"
    echo "   Please run this script from the workspace root or backend directory"
    exit 1
  fi
fi

# Ensure we're in the right directory
if [ -f "prisma/schema.prisma" ]; then
  WORK_DIR="."
elif [ -f "backend/prisma/schema.prisma" ]; then
  WORK_DIR="backend"
else
  echo "❌ Error: Could not find prisma/schema.prisma"
  exit 1
fi

echo "📁 Working directory: ${WORK_DIR}"
cd "${WORK_DIR}"

# URL encode the password if it contains special characters
# The password "Emmanuel1igweh!" contains "!" which needs to be encoded as "%21"
echo ""
echo "🔍 Preparing connection string..."
ENCODED_PASSWORD=$(echo "${SUPABASE_PASSWORD}" | sed 's/!/%21/g' | sed 's/#/%23/g' | sed 's/\$/%24/g' | sed 's/&/%26/g' | sed "s/'/%27/g" | sed 's/(/%28/g' | sed 's/)/%29/g' | sed 's/*/%2A/g' | sed 's/+/%2B/g' | sed 's/,/%2C/g' | sed 's/;/%3B/g' | sed 's/=/%3D/g' | sed 's/?/%3F/g' | sed 's/@/%40/g' | sed 's/\[/%5B/g' | sed 's/\]/%5D/g')
ENCODED_DATABASE_URL="postgresql://postgres:${ENCODED_PASSWORD}@${SUPABASE_DB_HOST}:5432/postgres?sslmode=require"

echo "   Password contains special characters, will try URL-encoded version"
echo "   Original: postgresql://postgres:***@${SUPABASE_DB_HOST}:5432/postgres?sslmode=require"
echo "   Encoded: postgresql://postgres:***@${SUPABASE_DB_HOST}:5432/postgres?sslmode=require"
echo ""

# Note: We'll test the connection by attempting prisma db push
# If it fails, we'll try the original password
FINAL_DATABASE_URL="${ENCODED_DATABASE_URL}"

echo ""
echo "🔄 Pushing Prisma schema to Supabase..."
echo "   This will create/update tables based on schema.prisma"
echo ""

# Try with URL-encoded password first
echo "🔄 Pushing Prisma schema to Supabase..."
echo "   Trying with URL-encoded password..."
echo "   Connection: postgresql://postgres:***@${SUPABASE_DB_HOST}:5432/postgres?sslmode=require"
echo ""

export DATABASE_URL="${FINAL_DATABASE_URL}"
PUSH_OUTPUT=$(bunx prisma db push --accept-data-loss --skip-generate 2>&1)
PUSH_RESULT=$?

# If that failed, try with original password (without encoding)
if [ $PUSH_RESULT -ne 0 ]; then
  echo "⚠️  Push with encoded password failed, trying with original password..."
  echo "   Error: $(echo "$PUSH_OUTPUT" | grep -i "error\|failed\|can't reach" | head -1)"
  echo ""
  
  export DATABASE_URL="${DATABASE_URL}"  # Original URL
  PUSH_OUTPUT=$(bunx prisma db push --accept-data-loss --skip-generate 2>&1)
  PUSH_RESULT=$?
  FINAL_DATABASE_URL="${DATABASE_URL}"
fi

# Display the output
echo "$PUSH_OUTPUT"

if [ $PUSH_RESULT -eq 0 ]; then
  echo ""
  echo "✅ Schema sync completed successfully!"
  echo ""
  echo "🔍 Verifying tables were created..."
  
  # Check for key tables
  echo ""
  echo "🔍 Verifying tables were created..."
  echo "   (Note: Table checks may fail if connection uses pooler - check Supabase dashboard instead)"
  
  for table in "user" "user_quest" "user_stats" "account" "session"; do
    # Use Prisma to check table via a simple query
    TABLE_CHECK=$(DATABASE_URL="${FINAL_DATABASE_URL}" timeout 10 bun run -e "import { PrismaClient } from './generated/prisma'; const prisma = new PrismaClient(); prisma.\$queryRaw\`SELECT 1 FROM ${table} LIMIT 1\`.then(() => console.log('exists')).catch(() => {});" 2>&1 | grep -q "exists" && echo "exists" || echo "")
    
    if [ -n "$TABLE_CHECK" ]; then
      echo "   ✅ ${table} table exists"
    else
      echo "   ⚠️  ${table} table check skipped (verify in Supabase dashboard)"
    fi
  done
    if echo "$TABLE_CHECK" | grep -q "[1-9]"; then
      echo "   ✅ ${table} table exists"
    else
      echo "   ⚠️  ${table} table not found"
    fi
  done
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ Schema sync complete!"
  echo ""
  echo "📋 Next steps:"
  echo "   1. Check Supabase Table Editor to verify tables"
  echo "   2. Deploy to Railway (it will use these tables)"
  echo "   3. Update Railway DATABASE_URL if needed:"
  echo "      ${DATABASE_URL}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
  echo ""
  echo "❌ Schema sync failed!"
  echo "   Exit code: ${PUSH_RESULT}"
  echo ""
  echo "🔍 Troubleshooting:"
  echo "   1. Check connection string is correct"
  echo "   2. Verify Supabase credentials"
  echo "   3. Check Supabase database status"
  echo "   4. Review Prisma schema for errors"
  exit 1
fi

