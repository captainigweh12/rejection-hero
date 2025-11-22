# Rejection Hero - Scripts Cheat Sheet

Quick reference for all available npm scripts in the Rejection Hero project.

## 📱 Local Development

### Start Development Server
```bash
# Start Expo dev server
npm start

# Start with clean cache (use if experiencing issues)
npm run start:clean

# Start in Expo Go mode
npm run start:expo-go
```

### Run on Devices/Emulators
```bash
# Run on Android device/emulator
npm run android

# Run on iOS device/simulator
npm run ios

# Run in web browser
npm run web
```

## 🔍 Code Quality

### Linting
```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix
```

### Type Checking
```bash
# Run TypeScript type checking
npm run typecheck
```

### Formatting
```bash
# Format code with Prettier
npm run format

# Check formatting without making changes
npm run format:check
```

### Run All Quality Checks
```bash
# Run lint + typecheck together
npm run check
```

## 🧪 Testing

### Unit & Integration Tests
```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests optimized for CI (non-interactive, with coverage)
npm run test:ci
```

### E2E Tests (Maestro)
```bash
# Run E2E tests locally (requires app running on device/emulator)
npm run test:e2e

# Run E2E tests on Maestro Cloud
npm run test:e2e:cloud

# Run E2E tests on Android
npm run test:e2e:android

# Run E2E tests on iOS
npm run test:e2e:ios
```

## 🏗️ Building with EAS

### Production Builds
```bash
# Build Android production app
npm run eas:build:android

# Build iOS production app
npm run eas:build:ios
```

### Preview Builds
```bash
# Build Android preview (internal distribution)
npm run eas:build:android:preview

# Build iOS preview (internal distribution)
npm run eas:build:ios:preview
```

### Development Builds
```bash
# Build Android development build (with dev client)
npm run eas:build:android:development

# Build iOS development build (with dev client)
npm run eas:build:ios:development
```

### Expo Go Builds
```bash
# Build Android for Expo Go
npm run eas:build:android:expo-go

# Build iOS for Expo Go
npm run eas:build:ios:expo-go
```

## 📤 Submitting to App Stores

### Submit Latest Build
```bash
# Submit latest Android build to Google Play
npm run eas:submit:android:latest

# Submit latest iOS build to App Store
npm run eas:submit:ios:latest
```

### Submit with Profile
```bash
# Submit Android build using production profile
npm run eas:submit:android

# Submit iOS build using production profile
npm run eas:submit:ios
```

## 🔐 Credentials Management

```bash
# Manage Android credentials
npm run credentials:android

# Manage iOS credentials
npm run credentials:ios
```

## 🤖 CI/CD Scripts

### Pre-commit Checks
```bash
# Run all quality checks (lint + typecheck + tests)
# Use this in CI pipelines before building
npm run ci:check
```

### CI Builds
```bash
# Build Android for CI (non-interactive)
npm run ci:build:android

# Build iOS for CI (non-interactive)
npm run ci:build:ios

# Build Android preview for CI
npm run ci:build:android:preview

# Build iOS preview for CI
npm run ci:build:ios:preview
```

### CI E2E Tests
```bash
# Run E2E tests in CI environment
npm run ci:e2e
```

## 📋 Common Workflows

### Daily Development
```bash
# 1. Start dev server
npm start

# 2. Run on device (in another terminal)
npm run android  # or npm run ios
```

### Before Committing
```bash
# Run all quality checks
npm run check

# Format code
npm run format
```

### Before Pushing
```bash
# Run full test suite
npm test

# Check types
npm run typecheck
```

### Preparing for Release
```bash
# 1. Run all checks
npm run ci:check

# 2. Build production app
npm run eas:build:android  # or ios

# 3. Submit to store
npm run eas:submit:android:latest  # or ios
```

## 🔧 Environment Variables

### Development
- Uses `.env` file (if present)
- Defaults to development endpoints
- No sandbox.dev overrides needed

### Production Builds
- Set via EAS Secrets or `.env` files
- **Required variables:**
  - `EXPO_PUBLIC_VIBECODE_BACKEND_URL` - Backend API URL (should be `https://api.rejectionhero.com`)
  - `EXPO_PUBLIC_VIBECODE_PROJECT_ID` - Project ID for Expo
  - Any other environment-specific variables

### E2E Tests
- Uses test environment endpoints
- Never points to localhost or sandbox.dev
- Configured in `maestro.yaml` or test environment

## ⚠️ Important Notes

1. **Production Builds**: Always ensure `EXPO_PUBLIC_VIBECODE_BACKEND_URL` is set to production URL (`https://api.rejectionhero.com`) for production builds.

2. **E2E Tests**: Require the app to be built and running on a device/emulator. Install Maestro first:
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```

3. **CI Builds**: Use `--non-interactive` flag (already included in `ci:build:*` scripts) to prevent prompts in CI environments.

4. **Cache Issues**: If experiencing build or runtime issues, try:
   ```bash
   npm run start:clean  # Clear Metro cache
   ```

## 📚 Related Documentation

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Maestro E2E Testing](https://maestro.mobile.dev/)
- [Jest Testing](https://jestjs.io/docs/getting-started)
- [Expo CLI](https://docs.expo.dev/workflow/expo-cli/)

