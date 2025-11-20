# Neon CLI Quick Start

## ✅ Installation Complete

Neon CLI has been installed in the `backend` directory as a dev dependency.

## Usage

Since it's installed locally, use `npx` to run commands:

```bash
cd backend
npx neonctl [command]
```

Or if you install globally later:

```bash
neonctl [command]
```

## Authentication

### First Time Setup

```bash
cd backend
npx neonctl auth
```

This will:
1. Open your browser to Neon Console
2. Ask you to authorize the CLI
3. Save your credentials locally

### Verify Authentication

```bash
cd backend
npx neonctl auth status
```

## Quick Commands

### Get Your Connection String

```bash
cd backend
npx neonctl connection-string --project-id [your-project-id]
```

To find your project ID:
1. Go to Neon Console
2. Your project URL shows the ID
3. Or use: `npx neonctl projects list`

### List Projects

```bash
cd backend
npx neonctl projects list
```

### List Branches

```bash
cd backend
npx neonctl branches list --project-id [your-project-id]
```

### Run SQL Query

```bash
cd backend
npx neonctl sql --project-id [your-project-id] --query "SELECT 1;"
```

## Your Current Connection

Based on your connection string:
- **Endpoint:** `ep-withered-field-a4skic0c.us-east-1.aws.neon.tech`
- **Project:** Find this in Neon Console

To get the connection string via CLI:

```bash
cd backend
# First, authenticate
npx neonctl auth

# Then get connection string (replace [project-id] with your actual project ID)
npx neonctl connection-string --project-id [project-id]
```

## Integration with Prisma

### Get Connection String and Push Schema

```bash
cd backend

# Get connection string from Neon
export DATABASE_URL=$(npx neonctl connection-string --project-id [your-project-id])

# Push schema
bunx prisma db push --accept-data-loss --skip-generate
```

## Next Steps

1. **Authenticate:**
   ```bash
   cd backend
   npx neonctl auth
   ```

2. **List Projects:**
   ```bash
   npx neonctl projects list
   ```

3. **Get Connection String:**
   ```bash
   npx neonctl connection-string --project-id [your-project-id]
   ```

## See Also

- `NEON_CLI_SETUP.md` - Complete documentation
- `RAILWAY_NEON_CONFIG.md` - Railway configuration with your connection details

