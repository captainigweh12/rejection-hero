# DevOps & Tooling Setup - Rejection Hero

## Overview

This document describes the unified CLI scripts and tooling setup for the Rejection Hero app, including development, testing, building, and CI/CD workflows.

## Scripts Organization

All scripts are organized in `package.json` with clear naming conventions:

### Development Scripts
- `start` - Start Expo dev server
- `start:clean` - Start with cleared Metro cache
- `start:expo-go` - Start in Expo Go mode
- `android` - Run on Android
- `ios` - Run on iOS
- `web` - Run in web browser

### Quality Scripts
- `lint` - Run ESLint
- `lint:fix` - Auto-fix linting errors
- `typecheck` - Run TypeScript type checking
- `format` - Format code with Prettier
- `format:check` - Check formatting without changes
- `check` - Run lint + typecheck together

### Test Scripts
- `test` - Run Jest unit/integration tests
- `test:watch` - Run tests in watch mode
- `test:coverage` - Run tests with coverage report
- `test:ci` - Run tests optimized for CI
- `test:e2e` - Run Maestro E2E tests
- `test:e2e:cloud` - Run E2E tests on Maestro Cloud
- `test:e2e:android` - Run E2E tests on Android
- `test:e2e:ios` - Run E2E tests on iOS

### Build Scripts
- `eas:build:android` - Build Android production
- `eas:build:ios` - Build iOS production
- `eas:build:android:preview` - Build Android preview
- `eas:build:ios:preview` - Build iOS preview
- `eas:build:android:development` - Build Android development
- `eas:build:ios:development` - Build iOS development
- `eas:build:android:expo-go` - Build Android for Expo Go
- `eas:build:ios:expo-go` - Build iOS for Expo Go

### Submit Scripts
- `eas:submit:android` - Submit Android to Google Play
- `eas:submit:ios` - Submit iOS to App Store
- `eas:submit:android:latest` - Submit latest Android build
- `eas:submit:ios:latest` - Submit latest iOS build

### Credentials Scripts
- `credentials:android` - Manage Android credentials
- `credentials:ios` - Manage iOS credentials

### CI Scripts
- `ci:check` - Run all quality checks (lint + typecheck + tests)
- `ci:build:android` - Build Android for CI (non-interactive)
- `ci:build:ios` - Build iOS for CI (non-interactive)
- `ci:build:android:preview` - Build Android preview for CI
- `ci:build:ios:preview` - Build iOS preview for CI
- `ci:e2e` - Run E2E tests in CI

## Configuration Files

### Jest (`jest.config.js`)
- Configured for React Native + TypeScript
- Coverage thresholds: 50% for branches, functions, lines, statements
- Proper module resolution for path aliases (`@/*`)

### TypeScript (`tsconfig.json`)
- Strict mode enabled
- Path aliases configured
- Excludes backend and generated files

### ESLint (`eslint.config.js`)
- Uses Expo ESLint config
- React Hooks rules enforced
- TypeScript import resolution

### EAS (`eas.json`)
- **Production profile**: App bundle for Android, production build for iOS
- **Preview profile**: APK for Android, internal distribution
- **Development profile**: Development client enabled
- **Expo Go profile**: Compatible with Expo Go

### Maestro (`maestro.yaml`)
- E2E test flows defined
- Platform-specific configurations
- Test tags for filtering

## Environment Variables

### Development
- Uses `.env` file (if present)
- Defaults to development endpoints
- No production URL overrides

### Production Builds
**Required variables (set via EAS Secrets):**
- `EXPO_PUBLIC_VIBECODE_BACKEND_URL` - Must be `https://api.rejectionhero.com` for production
- `EXPO_PUBLIC_VIBECODE_PROJECT_ID` - Expo project ID
- Any other environment-specific variables

**Important**: Production builds should NEVER use:
- `sandbox.dev` URLs
- `localhost` URLs
- `127.0.0.1` URLs

### E2E Tests
- Uses test environment endpoints
- Configured in `maestro.yaml`
- Never points to localhost or sandbox.dev

## CI/CD Integration

### GitHub Actions

A sample workflow is provided in `.github/workflows/ci.yml`:

1. **Quality Checks Job**
   - Runs on every push and PR
   - Executes: `npm run ci:check` (lint + typecheck + tests)

2. **Build Jobs**
   - Run only on pushes to `main` branch
   - Build Android and iOS production apps
   - Uses `ci:build:*` scripts with `--non-interactive` flag

### Required Secrets

Set these in GitHub Secrets:
- `EAS_TOKEN` - EAS authentication token

### Local CI Simulation

Test CI scripts locally:
```bash
# Run quality checks (same as CI)
npm run ci:check

# Test build command (will prompt for EAS login)
npm run ci:build:android
```

## Best Practices

### Before Committing
```bash
# Run quality checks
npm run check

# Format code
npm run format
```

### Before Pushing
```bash
# Run full test suite
npm test

# Verify types
npm run typecheck
```

### Before Release
```bash
# 1. Run all checks
npm run ci:check

# 2. Build production app
npm run eas:build:android  # or ios

# 3. Test the build locally

# 4. Submit to store
npm run eas:submit:android:latest  # or ios
```

### Troubleshooting

**Metro cache issues:**
```bash
npm run start:clean
```

**Build failures:**
- Check EAS credentials: `npm run credentials:android` (or ios)
- Verify environment variables in EAS dashboard
- Check `eas.json` profile configuration

**Test failures:**
- Clear Jest cache: `npm test -- --clearCache`
- Verify mocks in `jest.setup.js`
- Check test environment setup

## Script Naming Conventions

- **Development**: Simple names (`start`, `android`, `ios`)
- **Quality**: Descriptive names (`lint`, `typecheck`, `format`)
- **Tests**: `test:*` prefix
- **E2E**: `test:e2e:*` prefix
- **Builds**: `eas:build:*` prefix
- **Submit**: `eas:submit:*` prefix
- **CI**: `ci:*` prefix (non-interactive, fail-fast)

## Quick Reference

See `SCRIPTS_CHEAT_SHEET.md` for a quick reference of all available scripts.

## Future Enhancements

1. **Pre-commit Hooks**: Add Husky for automatic quality checks
2. **Release Automation**: Automate version bumping and changelog generation
3. **E2E in CI**: Set up Maestro Cloud integration for CI E2E tests
4. **Build Notifications**: Add Slack/email notifications for build status
5. **Performance Testing**: Add Lighthouse CI for web builds

