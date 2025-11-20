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
RUN echo '#!/bin/sh\nset -e\necho "🔍 Checking database connection..."\nif [ -n "$DIRECT_URL" ]; then\n  echo "🔄 Using DIRECT_URL for schema sync..."\n  DATABASE_URL="$DIRECT_URL" bunx prisma db push --accept-data-loss --skip-generate || {\n    echo "❌ Database schema sync with DIRECT_URL failed, trying DATABASE_URL..."\n    bunx prisma db push --accept-data-loss --skip-generate || {\n      echo "❌ Database schema sync failed!"\n      echo "❌ Check DATABASE_URL is correct and database is accessible"\n      exit 1\n    }\n  }\nelse\n  echo "🔄 Syncing database schema with Prisma (using DATABASE_URL)..."\n  bunx prisma db push --accept-data-loss --skip-generate || {\n    echo "❌ Database schema sync failed!"\n    echo "❌ Check DATABASE_URL is correct and database is accessible"\n    exit 1\n  }\nfi\necho "✅ Database schema synced successfully"\necho "🚀 Starting server..."\nexec bun run src/index.ts' > /app/backend/start.sh && chmod +x /app/backend/start.sh

# Start the server (migrations run automatically)
CMD ["/app/backend/start.sh"]
