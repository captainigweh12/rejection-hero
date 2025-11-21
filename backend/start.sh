#!/bin/sh
set -e
cd /app/backend

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Starting Backend Service..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Checking environment variables..."
echo "📊 DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo "YES (using for migrations)" || echo "NO ⚠️")"
echo "📊 DIRECT_URL is set: $([ -n "$DIRECT_URL" ] && echo "YES (for Prisma Client)" || echo "NO ⚠️")"

# Validate DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is required but not set!"
  echo "❌ Please set DATABASE_URL in environment variables"
  echo "❌ Use non-pooler connection with SSL:"
  echo "❌ postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres?sslmode=require"
  exit 1
fi

# Ensure DATABASE_URL has sslmode=require for PostgreSQL (Supabase requires SSL)
SCHEMA_SYNC_URL="$DATABASE_URL"
if echo "$DATABASE_URL" | grep -q "postgresql://" && ! echo "$DATABASE_URL" | grep -q "sslmode="; then
  # Add sslmode=require if not present
  if echo "$DATABASE_URL" | grep -q "?"; then
    SCHEMA_SYNC_URL="${DATABASE_URL}&sslmode=require"
  else
    SCHEMA_SYNC_URL="${DATABASE_URL}?sslmode=require"
  fi
  echo "🔒 Added sslmode=require to DATABASE_URL for Supabase SSL connection"
fi

# Determine which URL to use for schema sync (prefer non-pooler)
# For migrations, we want the direct connection (not pooler)
# If DATABASE_URL is pooler, check DIRECT_URL, otherwise use DATABASE_URL
if echo "$SCHEMA_SYNC_URL" | grep -q "pooler"; then
  if [ -n "$DIRECT_URL" ]; then
    # Ensure DIRECT_URL also has SSL
    if echo "$DIRECT_URL" | grep -q "postgresql://" && ! echo "$DIRECT_URL" | grep -q "sslmode="; then
      if echo "$DIRECT_URL" | grep -q "?"; then
        SCHEMA_SYNC_URL="${DIRECT_URL}&sslmode=require"
      else
        SCHEMA_SYNC_URL="${DIRECT_URL}?sslmode=require"
      fi
    else
      SCHEMA_SYNC_URL="$DIRECT_URL"
    fi
    echo "📡 Using DIRECT_URL for schema sync (DATABASE_URL is pooler)"
  else
    echo "⚠️  WARNING: DATABASE_URL uses pooler, but DIRECT_URL not set"
    echo "⚠️  Using DATABASE_URL anyway - migrations may fail"
    echo "⚠️  Recommendation: Set DIRECT_URL to non-pooler connection"
  fi
else
  echo "📡 Using DATABASE_URL for schema sync (non-pooler detected)"
fi

echo "   Connection: $(echo "$SCHEMA_SYNC_URL" | sed "s/:[^:]*@/:***@/" | sed "s/@.*:/@***/" | sed "s/sslmode=require/sslmode=***/")"

echo ""
echo "🔍 Testing database connection..."
# Test connection before attempting schema sync
TEST_RESULT=$(echo "SELECT 1;" | DATABASE_URL="$SCHEMA_SYNC_URL" timeout 10 bunx prisma db execute --stdin 2>&1 || echo "FAILED")
if echo "$TEST_RESULT" | grep -qi "error\|failed\|can't reach\|can not reach"; then
  echo "❌ Database connection test failed!"
  echo "❌ Error: $(echo "$TEST_RESULT" | head -5)"
  echo ""
  echo "🔍 Troubleshooting:"
  echo "   1. Verify DATABASE_URL is correct in environment variables"
  echo "   2. Format: postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres?sslmode=require"
  echo "   3. Check database credentials are valid"
  echo "   4. Ensure database is accessible (check network settings)"
  echo "   5. Verify no .env files in repo are overriding environment variables"
  exit 1
else
  echo "✅ Database connection test successful"
fi

echo ""
echo "🔄 Syncing database schema with Prisma db push..."
echo "   Working directory: $(pwd)"
echo "   Prisma schema: prisma/schema.prisma"

# Run prisma db push (this generates PostgreSQL-compatible SQL from schema)
# Use SCHEMA_SYNC_URL (should be non-pooler for schema operations)
echo "   Running: bun run db:push"
DATABASE_URL="$SCHEMA_SYNC_URL" bun run db:push 2>&1
SYNC_RESULT=$?

echo ""
if [ $SYNC_RESULT -eq 0 ]; then
  echo "✅ Database schema sync completed successfully"
  echo "🔍 Verifying critical tables were created..."
  
  # Check for user_quest table
  TABLE_CHECK=$(echo "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_quest';" | DATABASE_URL="$SCHEMA_SYNC_URL" bunx prisma db execute --stdin 2>&1 || echo "")
  if echo "$TABLE_CHECK" | grep -q "[1-9]"; then
    echo "✅ user_quest table exists"
  else
    echo "⚠️  user_quest table not found in database"
    echo "   This may indicate the schema sync did not complete properly"
  fi
  
  # Check for user_stats table
  STATS_CHECK=$(echo "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_stats';" | DATABASE_URL="$SCHEMA_SYNC_URL" bunx prisma db execute --stdin 2>&1 || echo "")
  if echo "$STATS_CHECK" | grep -q "[1-9]"; then
    echo "✅ user_stats table exists"
  else
    echo "⚠️  user_stats table not found in database"
    echo "   This may indicate the schema sync did not complete properly"
  fi
  
  # Check for user table (basic table)
  USER_CHECK=$(echo "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user';" | DATABASE_URL="$SCHEMA_SYNC_URL" bunx prisma db execute --stdin 2>&1 || echo "")
  if echo "$USER_CHECK" | grep -q "[1-9]"; then
    echo "✅ user table exists"
  else
    echo "❌ CRITICAL: user table not found!"
    echo "   Schema sync appears to have failed"
    exit 1
  fi
else
  echo "❌ Database schema sync failed!"
  echo "❌ Exit code: $SYNC_RESULT"
  echo ""
  echo "🔍 Troubleshooting:"
  echo "   1. Verify DATABASE_URL is correct in environment variables"
  echo "   2. Use non-pooler connection: postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"
  echo "   3. Check database credentials are valid"
  echo "   4. Ensure database is accessible"
  echo "   5. Check connection pooling settings"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Starting server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
exec bun run start

