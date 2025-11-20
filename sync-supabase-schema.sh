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

# Test connection first
echo ""
echo "🔍 Testing database connection..."
if echo "SELECT 1;" | DATABASE_URL="${DATABASE_URL}" timeout 10 bunx prisma db execute --stdin 2>&1 | grep -qi "error\|failed"; then
  echo "❌ Database connection failed!"
  echo ""
  echo "🔍 Troubleshooting:"
  echo "   1. Verify DATABASE_URL is correct"
  echo "   2. Check Supabase password is correct"
  echo "   3. Ensure database is accessible"
  exit 1
else
  echo "✅ Database connection successful"
fi

echo ""
echo "🔄 Pushing Prisma schema to Supabase..."
echo "   This will create/update tables based on schema.prisma"
echo ""

# Run prisma db push
export DATABASE_URL="${DATABASE_URL}"
bunx prisma db push --accept-data-loss --skip-generate 2>&1
PUSH_RESULT=$?

if [ $PUSH_RESULT -eq 0 ]; then
  echo ""
  echo "✅ Schema sync completed successfully!"
  echo ""
  echo "🔍 Verifying tables were created..."
  
  # Check for key tables
  for table in "user" "user_quest" "user_stats" "account" "session"; do
    TABLE_CHECK=$(echo "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${table}';" | DATABASE_URL="${DATABASE_URL}" bunx prisma db execute --stdin 2>&1 || echo "")
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

