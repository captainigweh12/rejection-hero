#!/bin/bash
set -e

# Script to sync Prisma schema to Neon PostgreSQL database
# This runs prisma db push directly against Neon

echo "🔗 Syncing Prisma schema to Neon..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set!"
  echo ""
  echo "📋 Usage:"
  echo "   export DATABASE_URL='postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require'"
  echo "   ./sync-neon-schema.sh"
  echo ""
  echo "💡 Get your connection string from:"
  echo "   Neon Console → Your Project → Connection Details"
  exit 1
fi

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

echo "📋 Configuration:"
echo "   Connection: $(echo "${DATABASE_URL}" | sed 's/:[^:]*@/:***@/' | sed 's/@.*:/@***/')"
echo ""

# Ensure DATABASE_URL has sslmode=require
if echo "${DATABASE_URL}" | grep -q "postgresql://" && ! echo "${DATABASE_URL}" | grep -q "sslmode="; then
  if echo "${DATABASE_URL}" | grep -q "?"; then
    DATABASE_URL="${DATABASE_URL}&sslmode=require"
  else
    DATABASE_URL="${DATABASE_URL}?sslmode=require"
  fi
  echo "🔒 Added sslmode=require to connection string"
fi

echo ""
echo "🔄 Pushing Prisma schema to Neon..."
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
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ Schema sync complete!"
  echo ""
  echo "📋 Next steps:"
  echo "   1. Check Neon Console to verify tables"
  echo "   2. Deploy to Railway (it will use these tables)"
  echo "   3. Verify Railway DATABASE_URL matches this connection"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
  echo ""
  echo "❌ Schema sync failed!"
  echo "   Exit code: ${PUSH_RESULT}"
  echo ""
  echo "🔍 Troubleshooting:"
  echo "   1. Verify DATABASE_URL is correct"
  echo "   2. Check Neon credentials are valid"
  echo "   3. Ensure database is accessible"
  echo "   4. Verify connection string format:"
  echo "      postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require"
  echo ""
  echo "💡 Get connection string from:"
  echo "   Neon Console → Your Project → Connection Details"
  exit 1
fi

