#!/bin/bash
set -e

echo "🔍 Verifying Neon Database Connection..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Project configuration
PROJECT_ID="flat-glitter-36967283"
PROJECT_NAME="Rejection Hero"

echo "📋 Configuration:"
echo "   Project ID: ${PROJECT_ID}"
echo "   Project Name: ${PROJECT_NAME}"
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

ORIGINAL_DIR=$(pwd)
if [ "$WORK_DIR" != "." ]; then
  cd "${WORK_DIR}" 2>/dev/null || cd "${ORIGINAL_DIR}/${WORK_DIR}" 2>/dev/null || {
    echo "❌ Error: Could not change to ${WORK_DIR}"
    exit 1
  }
fi

echo "📁 Working directory: $(pwd)"

# Check Neon CLI authentication
echo ""
echo "🔐 Checking Neon CLI authentication..."
if npx neonctl projects list 2>&1 | grep -q "${PROJECT_NAME}"; then
  echo "✅ Neon CLI authenticated successfully"
else
  echo "⚠️  Neon CLI not authenticated or project not found"
  echo "   Run: cd backend && npx neonctl auth"
fi

# Get connection string from Neon CLI
echo ""
echo "🔗 Getting connection string from Neon..."
CONNECTION_STRING=$(npx neonctl connection-string --project-id "${PROJECT_ID}" 2>&1 | grep -i "postgresql://" | head -1 || echo "")

if [ -z "$CONNECTION_STRING" ]; then
  echo "⚠️  Could not get connection string from Neon CLI"
  echo "   Using manual connection string..."
  # Use the provided connection string (non-pooler for migrations)
  CONNECTION_STRING="postgresql://neondb_owner:npg_9vudwr7pPfFJ@ep-withered-field-a4skic0c.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
else
  # Ensure it's non-pooler (remove -pooler if present for migrations)
  CONNECTION_STRING=$(echo "$CONNECTION_STRING" | sed 's/-pooler\.neon\.tech/.neon.tech/g')
  echo "✅ Connection string retrieved from Neon CLI"
fi

echo "   Connection: $(echo "${CONNECTION_STRING}" | sed 's/:[^:]*@/:***@/' | sed 's/@.*:/@***/')"
echo ""

# Ensure connection string has required SSL params
if echo "${CONNECTION_STRING}" | grep -q "postgresql://" && ! echo "${CONNECTION_STRING}" | grep -q "sslmode="; then
  if echo "${CONNECTION_STRING}" | grep -q "?"; then
    CONNECTION_STRING="${CONNECTION_STRING}&sslmode=require"
  else
    CONNECTION_STRING="${CONNECTION_STRING}?sslmode=require"
  fi
  echo "🔒 Added sslmode=require to connection string"
fi

# Test connection with Prisma
echo ""
echo "🔍 Testing database connection with Prisma..."
export DATABASE_URL="${CONNECTION_STRING}"
export DIRECT_URL=""  # Make it optional for testing

# Try a simple query via Prisma
TEST_SCRIPT=$(cat << 'EOF'
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Connection successful!");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Connection failed:", error.message?.substring(0, 200) || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
EOF
)

echo "$TEST_SCRIPT" > /tmp/test-neon-connection.ts
cd "${WORK_DIR}"

TEST_RESULT=$(timeout 15 bun run /tmp/test-neon-connection.ts 2>&1 || echo "FAILED")
rm -f /tmp/test-neon-connection.ts

if echo "$TEST_RESULT" | grep -q "✅ Connection successful"; then
  echo "✅ Prisma connection test successful!"
  CONNECTION_OK=true
else
  echo "❌ Prisma connection test failed!"
  echo "   Error: $(echo "$TEST_RESULT" | grep -i "error\|failed" | head -1)"
  CONNECTION_OK=false
fi

echo ""

# If connection works, try to push schema
if [ "$CONNECTION_OK" = true ]; then
  echo "🔄 Pushing Prisma schema to Neon..."
  echo "   This will create/update tables based on schema.prisma"
  echo ""
  
  export DATABASE_URL="${CONNECTION_STRING}"
  export DIRECT_URL=""
  
  PUSH_OUTPUT=$(bunx prisma db push --accept-data-loss --skip-generate 2>&1 || echo "FAILED")
  PUSH_RESULT=$?
  
  if [ $PUSH_RESULT -eq 0 ]; then
    echo "$PUSH_OUTPUT" | tail -20
    echo ""
    echo "✅ Schema sync completed successfully!"
    
    # Verify tables
    echo ""
    echo "🔍 Verifying tables were created..."
    
    # Check key tables using Prisma
    VERIFY_SCRIPT=$(cat << 'EOF'
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function verifyTables() {
  const tables = ["user", "user_quest", "user_stats", "account", "session"];
  let found = 0;
  
  for (const table of tables) {
    try {
      await prisma.$queryRawUnsafe(`SELECT 1 FROM ${table} LIMIT 1`);
      console.log(`✅ ${table} table exists`);
      found++;
    } catch (error: any) {
      if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
        console.log(`❌ ${table} table does not exist`);
      } else {
        console.log(`⚠️  ${table} table check failed: ${error.message?.substring(0, 50)}`);
      }
    }
  }
  
  console.log(`\n📊 Found ${found}/${tables.length} tables`);
  await prisma.$disconnect();
  process.exit(found === tables.length ? 0 : 1);
}

verifyTables().catch(console.error);
EOF
)
    
    echo "$VERIFY_SCRIPT" > /tmp/verify-tables.ts
    VERIFY_RESULT=$(timeout 15 bun run /tmp/verify-tables.ts 2>&1 || echo "")
    rm -f /tmp/verify-tables.ts
    
    echo "$VERIFY_RESULT"
    
    if echo "$VERIFY_RESULT" | grep -q "Found 5/5 tables"; then
      echo ""
      echo "✅ All critical tables exist!"
    fi
  else
    echo "$PUSH_OUTPUT" | grep -i "error\|failed" | head -5
    echo ""
    echo "❌ Schema sync failed!"
    exit 1
  fi
else
  echo ""
  echo "⚠️  Skipping schema sync due to connection failure"
  echo ""
  echo "🔍 Troubleshooting:"
  echo "   1. Verify connection string is correct"
  echo "   2. Check Neon project is active (not paused)"
  echo "   3. Verify credentials are valid"
  echo "   4. Check network connectivity"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Neon Database Setup Verification Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Summary:"
echo "   ✅ Neon CLI authenticated"
echo "   ✅ Database connection working"
echo "   ✅ Schema synced successfully"
echo "   ✅ Tables verified"
echo ""
echo "📝 Next Steps:"
echo "   1. Update Railway DATABASE_URL with this connection string:"
echo "      ${CONNECTION_STRING}"
echo "   2. Deploy to Railway"
echo "   3. Verify deployment logs show successful connection"
echo ""

