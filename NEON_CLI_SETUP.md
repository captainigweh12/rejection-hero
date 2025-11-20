# Neon CLI Setup Guide

## Installation

### Option 1: Install Globally (Recommended)

If you have permissions:

```bash
npm install -g neonctl
```

Or using a package manager:

```bash
# Using Homebrew (macOS/Linux)
brew install neonctl

# Using Scoop (Windows)
scoop bucket add neonctl https://github.com/neondatabase/scoop-bucket.git
scoop install neonctl
```

### Option 2: Install Locally in Project

If you don't have global permissions:

```bash
cd /home/user/workspace
npm install --save-dev neonctl
```

Then run commands with:

```bash
npx neonctl [command]
```

### Option 3: Use Binary Directly

Download from: https://github.com/neondatabase/neonctl/releases

## Authentication

### Login to Neon

```bash
neonctl auth
```

This will:
1. Open your browser to Neon Console
2. Ask you to authorize the CLI
3. Save your credentials locally

### Verify Authentication

```bash
neonctl auth status
```

## Common Commands

### List Projects

```bash
neonctl projects list
```

### Get Connection String

```bash
neonctl connection-string --project-id [your-project-id]
```

Or get for a specific branch:

```bash
neonctl connection-string --project-id [your-project-id] --branch-id [branch-id]
```

### Create Branch

```bash
neonctl branches create --project-id [your-project-id] --name [branch-name]
```

### List Branches

```bash
neonctl branches list --project-id [your-project-id]
```

### Delete Branch

```bash
neonctl branches delete --project-id [your-project-id] --branch-id [branch-id]
```

### Run SQL Query

```bash
neonctl sql --project-id [your-project-id] --query "SELECT 1;"
```

Or from a file:

```bash
neonctl sql --project-id [your-project-id] --file script.sql
```

## Your Current Project

Based on your connection string:
- **Endpoint:** `ep-withered-field-a4skic0c.us-east-1.aws.neon.tech`
- **Region:** `us-east-1`

To get your project ID:
1. Go to Neon Console
2. Your project URL will show the project ID
3. Or use: `neonctl projects list`

## Integration with Prisma

### Get Connection String for Prisma

```bash
# Get connection string
neonctl connection-string --project-id [your-project-id] > .env.local

# Or set directly
export DATABASE_URL=$(neonctl connection-string --project-id [your-project-id])
cd backend
bunx prisma db push
```

### Run Migrations

```bash
export DATABASE_URL=$(neonctl connection-string --project-id [your-project-id])
cd backend
bunx prisma db push
```

## GitHub Actions Integration

Your workflow (`.github/workflows/neon-branches.yml`) already uses Neon CLI via GitHub Actions, so you don't need to install it manually for that.

## Troubleshooting

### "Command not found"

**Fix:** Install neonctl globally or use `npx neonctl`

### Authentication Failed

**Fix:**
1. Run `neonctl auth` again
2. Make sure you're logged into Neon Console
3. Check `neonctl auth status`

### Can't Connect

**Fix:**
1. Verify project ID is correct
2. Check you have access to the project
3. Ensure Neon project is active (not paused)

## Documentation

Full Neon CLI documentation: https://neon.tech/docs/reference/neonctl

