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

# Copy the rest of the backend code (this will include tsconfig.json and start.sh)
COPY backend ./

# Generate Prisma Client
RUN bun run postinstall

# Verify shared directory and tsconfig are in place
RUN echo "🔍 Verifying project structure..." && \
    ls -la /app/backend/shared/contracts.ts && \
    cat /app/backend/tsconfig.json | grep -A 2 '"paths"' && \
    echo "✅ Project structure verified"

# Ensure startup script is executable
RUN chmod +x /app/backend/start.sh

# Expose port
EXPOSE 3000

# Start the server (migrations run automatically)
CMD ["/app/backend/start.sh"]
