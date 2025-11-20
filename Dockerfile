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
RUN echo '#!/bin/sh\nset -e\ncd /app/backend\necho "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"\necho "🚀 Starting Backend Service..."\necho "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"\necho "🔍 Checking database connection..."\necho "📊 DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo "YES" || echo "NO")"\necho "📊 DIRECT_URL is set: $([ -n "$DIRECT_URL" ] && echo "YES" || echo "NO")"\n\n# Determine which URL to use for schema sync\nif [ -n "$DIRECT_URL" ]; then\n  SCHEMA_SYNC_URL="$DIRECT_URL"\n  echo "📡 Will use DIRECT_URL for schema sync"\n  echo "   Connection: $(echo "$DIRECT_URL" | sed "s/:[^:]*@/:***@/")"\nelse\n  SCHEMA_SYNC_URL="$DATABASE_URL"\n  echo "📡 Will use DATABASE_URL for schema sync"\n  echo "   Connection: $(echo "$DATABASE_URL" | sed "s/:[^:]*@/:***@/")"\nfi\n\necho ""\necho "🔄 Syncing database schema with Prisma..."\necho "   Working directory: $(pwd)"\necho "   Prisma schema: prisma/schema.prisma"\n\n# Run prisma db push with the appropriate URL\nDATABASE_URL="$SCHEMA_SYNC_URL" bunx prisma db push --accept-data-loss --skip-generate 2>&1\nSYNC_RESULT=$?\n\necho ""\nif [ $SYNC_RESULT -eq 0 ]; then\n  echo "✅ Database schema sync completed successfully"\n  echo "🔍 Verifying tables were created..."\n  # Check for user_quest table\n  TABLE_CHECK=$(echo "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '"'"'public'"'"' AND table_name = '"'"'user_quest'"'"';" | DATABASE_URL="$SCHEMA_SYNC_URL" bunx prisma db execute --stdin 2>&1 || echo "0")\n  if echo "$TABLE_CHECK" | grep -q "[1-9]"; then\n    echo "✅ user_quest table exists"\n  else\n    echo "⚠️  user_quest table not found - this may indicate an issue"\n  fi\n  # Check for user_stats table\n  STATS_CHECK=$(echo "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '"'"'public'"'"' AND table_name = '"'"'user_stats'"'"';" | DATABASE_URL="$SCHEMA_SYNC_URL" bunx prisma db execute --stdin 2>&1 || echo "0")\n  if echo "$STATS_CHECK" | grep -q "[1-9]"; then\n    echo "✅ user_stats table exists"\n  else\n    echo "⚠️  user_stats table not found - this may indicate an issue"\n  fi\nelse\n  echo "❌ Database schema sync failed!"\n  echo "❌ Exit code: $SYNC_RESULT"\n  echo "❌ Check DATABASE_URL and DIRECT_URL are correct"\n  echo "❌ Check database is accessible and credentials are valid"\n  echo "❌ Check Supabase connection string format"\n  exit 1\nfi\n\necho "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"\necho "🚀 Starting server..."\necho "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"\nexec bun run src/index.ts' > /app/backend/start.sh && chmod +x /app/backend/start.sh

# Start the server (migrations run automatically)
CMD ["/app/backend/start.sh"]
