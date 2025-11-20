FROM oven/bun:1.2.10-debian

WORKDIR /app

# Install OpenSSL 3.0 and other dependencies
RUN apt-get update && \
    apt-get install -y \
    openssl \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy backend files
COPY backend/package.json backend/bun.lockb ./backend/
COPY backend/prisma ./backend/prisma

# Install dependencies
WORKDIR /app/backend
RUN bun install

# Copy the rest of the backend code
COPY backend ./

# Generate Prisma Client
RUN bun run postinstall

# Expose port
EXPOSE 3000

# Start the server
CMD ["bun", "run", "src/index.ts"]
