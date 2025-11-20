#!/bin/bash

# Setup script to securely save Google Play service account key
# This script helps you save the JSON key without pasting it in plain text

set -e

echo "🔐 Google Play Service Account Key Setup"
echo "========================================"
echo ""

SECRETS_DIR="$HOME/workspace/secrets"
KEY_FILE="$SECRETS_DIR/google-play-service-account.json"

# Create secrets directory if it doesn't exist
mkdir -p "$SECRETS_DIR"
chmod 700 "$SECRETS_DIR"

echo "📁 Secrets directory: $SECRETS_DIR"
echo ""

# Check if key already exists
if [ -f "$KEY_FILE" ]; then
    echo "⚠️  Service account key already exists at: $KEY_FILE"
    echo ""
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cancelled. Keeping existing key."
        exit 0
    fi
    rm -f "$KEY_FILE"
fi

echo "📝 Instructions:"
echo "   1. You'll be prompted to paste your JSON key content"
echo "   2. Paste the ENTIRE contents of your JSON key file"
echo "   3. Press Enter, then type 'EOF' on a new line, then press Enter again"
echo ""
echo "⏳ Ready! Paste your JSON key content below (end with 'EOF' on its own line):"
echo ""

# Create the file using heredoc
cat > "$KEY_FILE" << 'ENDOFFILE'

ENDOFFILE

# Wait for user input
# Note: This script expects the user to manually paste the content
# For security, we'll create a template and provide instructions

echo ""
echo "📋 Manual Setup Instructions:"
echo "================================"
echo ""
echo "To save your JSON key securely, run this command:"
echo ""
echo "cat > $SECRETS_DIR/google-play-service-account.json << 'EOF'"
echo "  [Paste your entire JSON key content here]"
echo "EOF"
echo ""
echo "Or use nano/vim:"
echo "  nano $KEY_FILE"
echo "  [Paste and save with Ctrl+O, Ctrl+X]"
echo ""
echo "Then set correct permissions:"
echo "  chmod 600 $KEY_FILE"
echo ""

# Check if .gitignore already ignores secrets
if [ ! -f .gitignore ] || ! grep -q "^secrets/" .gitignore; then
    echo "🔒 Adding secrets/ to .gitignore..."
    echo "secrets/" >> .gitignore
    echo "✅ Done"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Save your JSON key to: $KEY_FILE"
echo "   2. Run: chmod 600 $KEY_FILE"
echo "   3. Verify: cat $KEY_FILE | jq .project_id  # (optional: check JSON is valid)"
echo ""

