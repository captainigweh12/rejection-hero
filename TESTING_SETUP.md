# Testing Setup - Rejection Hero

## Overview

This document describes the automated testing infrastructure for the Rejection Hero app, including unit tests, integration tests, and E2E tests.

## Test Structure

```
src/
├── __tests__/              # Test files co-located with source
│   ├── utils/
│   │   └── celebrationHelpers.test.ts
│   ├── screens/
│   │   ├── QuestCompleteScreen.test.tsx
│   │   ├── CreateStoryScreen.test.tsx
│   │   └── QuestFlow.integration.test.tsx
│   ├── lib/
│   │   └── api.test.ts
│   └── navigation/
│       └── navigation.test.tsx
├── jest.config.js          # Jest configuration
└── jest.setup.js           # Test setup and mocks

maestro.yaml                # Maestro E2E test configuration
```

## Running Tests

### Unit & Integration Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### E2E Tests (Maestro)

```bash
# Run E2E tests locally (requires app to be running)
npm run test:e2e

# Run E2E tests on Maestro Cloud
npm run test:e2e:cloud
```

## Test Coverage

### Unit Tests

#### 1. Celebration Helpers (`src/utils/__tests__/celebrationHelpers.test.ts`)
- ✅ `generateStoryCaption()` - Generates story captions with all data
- ✅ `generatePostContent()` - Generates post content with stats
- ✅ `getCategoryColor()` - Returns correct colors for categories

#### 2. API Client (`src/lib/__tests__/api.test.ts`)
- ✅ GET requests with authentication
- ✅ POST requests with JSON body
- ✅ Image/video upload with FormData
- ✅ Error handling

#### 3. Quest Complete Screen (`src/screens/__tests__/QuestCompleteScreen.test.tsx`)
- ✅ Renders quest completion data correctly
- ✅ Calls onContinue callback when button pressed
- ✅ Displays correct stats (XP, Points, NOs)

#### 4. Create Story Screen (`src/screens/__tests__/CreateStoryScreen.test.tsx`)
- ✅ Pre-fills caption from route params
- ✅ Allows selecting image from library
- ✅ Uploads image and creates story
- ✅ Handles upload errors gracefully

### Integration Tests

#### Quest Completion Flow (`src/screens/__tests__/QuestFlow.integration.test.tsx`)
- ✅ Navigates through celebration flow when quest completed
- ✅ Handles streak updates (with/without change)
- ✅ Verifies navigation to QuestStreak, QuestWeeklyAchievements, QuestLeaderboardPosition screens

#### Navigation (`src/navigation/__tests__/navigation.test.tsx`)
- ✅ Navigation functions work correctly
- ✅ Route params are handled properly

### E2E Tests (Maestro)

#### 1. Launch App and Login
- App launches successfully
- Login screen appears
- User can enter credentials and sign in

#### 2. Quest Completion Flow
- Complete a quest
- Navigate through all celebration screens
- Verify sharing options appear

#### 3. Create Story with Image
- Open story creation
- Select image from library
- Add caption
- Share story

#### 4. Share Accomplishment to Story
- Complete quest
- Navigate to final celebration screen
- Share to story with pre-filled caption

## Test IDs

Key components have `testID` props for E2E testing:

- `quest-complete-continue-button` - Continue button on quest complete screen
- `streak-continue-button` - Continue button on streak screen
- `weekly-continue-button` - Continue button on weekly achievements screen
- `leaderboard-continue-button` - Continue button on leaderboard screen
- `share-to-story-button` - Share to story button
- `share-as-post-button` - Share as post button
- `select-image-button` - Image selection button
- `share-story-button` - Story share button
- `story-caption-input` - Story caption input field

## Mocking Strategy

### API Calls
- All API calls are mocked using Jest
- `@/lib/api` is mocked in `jest.setup.js`
- Network requests don't hit real servers

### Navigation
- React Navigation is mocked
- Navigation functions are Jest spies
- Route params can be provided in tests

### Native Modules
- Expo modules (ImagePicker, Haptics, Location, etc.) are mocked
- SecureStore is mocked
- All native functionality is stubbed

### Context Providers
- Theme context is mocked with default values
- Language context is mocked
- Session/auth is mocked

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm install
    npm test
    npm run test:coverage
```

## Coverage Goals

Current coverage thresholds (in `jest.config.js`):
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

## Missing Test Areas (Future Work)

1. **Quest Detail Screen**
   - Recording YES/NO actions
   - Quest completion logic
   - Navigation to celebration flow

2. **Home Screen**
   - Quest list rendering
   - Quest refresh functionality
   - Quest swap/move to active

3. **Profile Screen**
   - Profile data display
   - Profile editing
   - Stats display

4. **Notifications Screen**
   - Notification list rendering
   - Mark as read functionality
   - Friend request actions

5. **Backend Integration Tests**
   - API endpoint testing
   - Database operations
   - Authentication flows

## Troubleshooting

### Tests fail with "Cannot find module"
- Run `npm install` to ensure all dependencies are installed
- Check that `jest.config.js` moduleNameMapper matches your path aliases

### E2E tests fail
- Ensure the app is built and running on a device/emulator
- Check that Maestro is installed: `curl -Ls "https://get.maestro.mobile.dev" | bash`
- Verify testIDs are present in the components

### Mock not working
- Check that mocks are defined in `jest.setup.js`
- Ensure mocks are imported before the module being tested

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Maestro Documentation](https://maestro.mobile.dev/)

