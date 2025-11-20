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
RUN echo '#!/bin/sh\nset -e\necho "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"\necho "🚀 Starting Backend Service..."\necho "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"\necho "🔍 Checking database connection..."\necho "📊 DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo "YES" || echo "NO")"\necho "📊 DIRECT_URL is set: $([ -n "$DIRECT_URL" ] && echo "YES" || echo "NO")"\n\n# Test basic connection\nif [ -n "$DATABASE_URL" ]; then\n  echo "🔗 Testing database connection..."\n  echo "SELECT 1" | DATABASE_URL="$DATABASE_URL" bunx prisma db execute --stdin 2>&1 | head -5 || echo "⚠️  Connection test failed, will try schema sync anyway..."\nfi\n\necho ""\necho "🔄 Syncing database schema with Prisma..."\nif [ -n "$DIRECT_URL" ]; then\n  echo "📡 Using DIRECT_URL for migrations..."\n  echo "   Connection: $(echo "$DIRECT_URL" | sed "s/:[^:]*@/:***@/")"\n  DATABASE_URL="$DIRECT_URL" bunx prisma db push --accept-data-loss --skip-generate --force-reset=false 2>&1\n  SYNC_RESULT=$?\nelse\n  echo "📡 Using DATABASE_URL for migrations..."\n  echo "   Connection: $(echo "$DATABASE_URL" | sed "s/:[^:]*@/:***@/")"\n  bunx prisma db push --accept-data-loss --skip-generate --force-reset=false 2>&1\n  SYNC_RESULT=$?\nfi\n\necho ""\nif [ $SYNC_RESULT -eq 0 ]; then\n  echo "✅ Database schema sync completed successfully"\n  echo "🔍 Verifying tables were created..."\n  if [ -n "$DIRECT_URL" ]; then\n    echo "SELECT tablename FROM pg_tables WHERE schemaname = '"'"'public'"'"' AND tablename = '"'"'user_quest'"'"';" | DATABASE_URL="$DIRECT_URL" bunx prisma db execute --stdin 2>&1 | grep -q "user_quest" && echo "✅ user_quest table exists" || echo "⚠️  user_quest table not found"\n  else\n    echo "SELECT tablename FROM pg_tables WHERE schemaname = '"'"'public'"'"' AND tablename = '"'"'user_quest'"'"';" | DATABASE_URL="$DATABASE_URL" bunx prisma db execute --stdin 2>&1 | grep -q "user_quest" && echo "✅ user_quest table exists" || echo "⚠️  user_quest table not found"\n  fi\nelse\n  echo "❌ Database schema sync failed!"\n  echo "❌ Exit code: $SYNC_RESULT"\n  echo "❌ Check DATABASE_URL and DIRECT_URL are correct"\n  echo "❌ Check database is accessible and credentials are valid"\n  exit 1\nfi\n\necho "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"\necho "🚀 Starting server..."\necho "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"\nexec bun run src/index.ts' > /app/backend/start.sh && chmod +x /app/backend/start.sh

# Start the server (migrations run automatically)
CMD ["/app/backend/start.sh"]
