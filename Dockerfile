FROM oven/bun:1.2.10-debian

WORKDIR /app

# Install OpenSSL 3.0 and other dependencies for Prisma
RUN apt-get update && \
    apt-get install -y \
    openssl \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy shared directory into backend (so it shares node_modules)
COPY shared ./backend/shared

# Copy backend package.json and prisma schema
COPY backend/package.json ./backend/
COPY backend/prisma ./backend/prisma

# Install dependencies
WORKDIR /app/backend
RUN bun install

# Copy the rest of the backend code (this will include tsconfig.json which we'll update)
COPY backend ./

# Generate Prisma Client
RUN bun run postinstall

# Verify shared directory and tsconfig are in place
RUN echo "🔍 Verifying project structure..." && \
    ls -la /app/backend/shared/contracts.ts && \
    cat /app/backend/tsconfig.json | grep -A 2 '"paths"' && \
    echo "✅ Project structure verified"

# Expose port
EXPOSE 3000

# Create startup script that syncs schema then starts the server
RUN echo '#!/bin/sh\nset -e\ncd /app/backend\necho "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"\necho "🚀 Starting Backend Service..."\necho "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"\necho "🔍 Checking environment variables..."\necho "📊 DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo "YES (using for migrations)" || echo "NO ⚠️")"\necho "📊 DIRECT_URL is set: $([ -n "$DIRECT_URL" ] && echo "YES (for Prisma Client)" || echo "NO ⚠️")"\n\n# Validate DATABASE_URL is set\nif [ -z "$DATABASE_URL" ]; then\n  echo "❌ ERROR: DATABASE_URL is required but not set!"\n  echo "❌ Please set DATABASE_URL in Railway environment variables"\n  echo "❌ Use non-pooler Supabase connection with SSL:"\n  echo "❌ postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres?sslmode=require"\n  exit 1\nfi\n\n# Ensure DATABASE_URL has sslmode=require for PostgreSQL (Supabase requires SSL)\nSCHEMA_SYNC_URL="$DATABASE_URL"\nif echo "$DATABASE_URL" | grep -q "postgresql://" && ! echo "$DATABASE_URL" | grep -q "sslmode="; then\n  # Add sslmode=require if not present\n  if echo "$DATABASE_URL" | grep -q "?"; then\n    SCHEMA_SYNC_URL="${DATABASE_URL}&sslmode=require"\n  else\n    SCHEMA_SYNC_URL="${DATABASE_URL}?sslmode=require"\n  fi\n  echo "🔒 Added sslmode=require to DATABASE_URL for Supabase SSL connection"\nfi\n\n# Determine which URL to use for schema sync (prefer non-pooler)\n# For migrations, we want the direct connection (not pooler)\n# If DATABASE_URL is pooler, check DIRECT_URL, otherwise use DATABASE_URL\nif echo "$SCHEMA_SYNC_URL" | grep -q "pooler"; then\n  if [ -n "$DIRECT_URL" ]; then\n    # Ensure DIRECT_URL also has SSL\n    if echo "$DIRECT_URL" | grep -q "postgresql://" && ! echo "$DIRECT_URL" | grep -q "sslmode="; then\n      if echo "$DIRECT_URL" | grep -q "?"; then\n        SCHEMA_SYNC_URL="${DIRECT_URL}&sslmode=require"\n      else\n        SCHEMA_SYNC_URL="${DIRECT_URL}?sslmode=require"\n      fi\n    else\n      SCHEMA_SYNC_URL="$DIRECT_URL"\n    fi\n    echo "📡 Using DIRECT_URL for schema sync (DATABASE_URL is pooler)"\n  else\n    echo "⚠️  WARNING: DATABASE_URL uses pooler, but DIRECT_URL not set"\n    echo "⚠️  Using DATABASE_URL anyway - migrations may fail"\n    echo "⚠️  Recommendation: Set DIRECT_URL to non-pooler connection"\n  fi\nelse\n  echo "📡 Using DATABASE_URL for schema sync (non-pooler detected)"\nfi\n\necho "   Connection: $(echo "$SCHEMA_SYNC_URL" | sed "s/:[^:]*@/:***@/" | sed "s/@.*:/@***/" | sed "s/sslmode=require/sslmode=***/")"\n\necho ""\necho "🔍 Testing database connection..."\n# Test connection before attempting schema sync\nTEST_RESULT=$(echo "SELECT 1;" | DATABASE_URL="$SCHEMA_SYNC_URL" timeout 10 bunx prisma db execute --stdin 2>&1 || echo "FAILED")\nif echo "$TEST_RESULT" | grep -qi "error\\|failed\\|can't reach\\|can not reach"; then\n  echo "❌ Database connection test failed!"\n  echo "❌ Error: $(echo "$TEST_RESULT" | head -5)"\n  echo ""\n  echo "🔍 Troubleshooting:"\n  echo "   1. Verify DATABASE_URL is correct in Railway"\n  echo "   2. Format: postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres?sslmode=require"\n  echo "   3. Check database credentials are valid"\n  echo "   4. Ensure database is accessible from Railway (check Supabase network settings)"\n  echo "   5. Verify no .env files in repo are overriding Railway variables"\n  exit 1\nelse\n  echo "✅ Database connection test successful"
fi\n\necho ""\necho "🔄 Syncing database schema with Prisma db push..."\necho "   Working directory: $(pwd)"\necho "   Prisma schema: prisma/schema.prisma"\n\n# Run prisma db push (this generates PostgreSQL-compatible SQL from schema)\n# Use SCHEMA_SYNC_URL (should be non-pooler for schema operations)\necho "   Running: bun run db:push"\nDATABASE_URL="$SCHEMA_SYNC_URL" bun run db:push 2>&1\nSYNC_RESULT=$?\n\necho ""\nif [ $SYNC_RESULT -eq 0 ]; then\n  echo "✅ Database schema sync completed successfully"\n  echo "🔍 Verifying critical tables were created..."\n  \n  # Check for user_quest table\n  TABLE_CHECK=$(echo "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '"'"'public'"'"' AND table_name = '"'"'user_quest'"'"';" | DATABASE_URL="$SCHEMA_SYNC_URL" bunx prisma db execute --stdin 2>&1 || echo "")\n  if echo "$TABLE_CHECK" | grep -q "[1-9]"; then\n    echo "✅ user_quest table exists"\n  else\n    echo "⚠️  user_quest table not found in database"\n    echo "   This may indicate the schema sync did not complete properly"\n  fi\n  \n  # Check for user_stats table\n  STATS_CHECK=$(echo "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '"'"'public'"'"' AND table_name = '"'"'user_stats'"'"';" | DATABASE_URL="$SCHEMA_SYNC_URL" bunx prisma db execute --stdin 2>&1 || echo "")\n  if echo "$STATS_CHECK" | grep -q "[1-9]"; then\n    echo "✅ user_stats table exists"\n  else\n    echo "⚠️  user_stats table not found in database"\n    echo "   This may indicate the schema sync did not complete properly"\n  fi\n  \n  # Check for user table (basic table)\n  USER_CHECK=$(echo "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '"'"'public'"'"' AND table_name = '"'"'user'"'"';" | DATABASE_URL="$SCHEMA_SYNC_URL" bunx prisma db execute --stdin 2>&1 || echo "")\n  if echo "$USER_CHECK" | grep -q "[1-9]"; then\n    echo "✅ user table exists"\n  else\n    echo "❌ CRITICAL: user table not found!"\n    echo "   Schema sync appears to have failed"\n    exit 1\n  fi\nelse\n  echo "❌ Database schema sync failed!"\n  echo "❌ Exit code: $SYNC_RESULT"\n  echo ""\n  echo "🔍 Troubleshooting:"\n  echo "   1. Verify DATABASE_URL is correct in Railway"\n  echo "   2. Use non-pooler connection: postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"\n  echo "   3. Check database credentials are valid"\n  echo "   4. Ensure database is accessible from Railway"\n  echo "   5. Check Supabase connection pooling settings"\n  exit 1\nfi\n\necho "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"\necho "🚀 Starting server..."\necho "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"\nexec bun run start' > /app/backend/start.sh && chmod +x /app/backend/start.sh

# Start the server (migrations run automatically)
CMD ["/app/backend/start.sh"]
