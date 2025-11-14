# Go for No - Rejection Challenge App

A revolutionary mobile app that helps users overcome fear of rejection through AI-powered "No Quests" - action-based challenges designed to build confidence and resilience. Complete quests, track progress, level up, and connect with a community of fellow challengers!

## Features

### 🎯 No Quest System (MAIN FEATURE)

**AI-Generated Challenges**
- Modern, light-themed Create Quest interface with keyboard handling
- Two creation options: Generate with AI or Create Custom Quest
- Beautiful gradient "Generate with AI" card
- Custom quest form with action, description, and minimum NOs fields
- AI generation with category and difficulty selection
- KeyboardAvoidingView for smooth keyboard interactions
- Tap outside to dismiss keyboard
- 6 Categories: Sales, Social, Entrepreneurship, Dating, Confidence, Career
- 4 Difficulty Levels: Easy, Medium, Hard, Expert
- Auto-navigation to quest detail page after creation
- Auto-start quest when created (if less than 2 active quests)
- Real-time progress tracking (NOs and YESes collected)
- Rewards: Earn XP and points based on difficulty
- Max 2 active quests (extras go to queue)

**Quest Examples:**
- Ask 5 coffee shops for an item that's not on their menu
- Ask 5 strangers for their phone numbers
- Pitch your idea to 10 people
- Request ridiculous discounts at stores
- Follow up with prospects who previously declined

**Gamification**
- 🔥 Streak tracking (current and longest)
- 📊 XP and Points system
- 🏆 Trophies
- 💎 Diamonds
- Beautiful stats dashboard

### 👥 Community Features

**Swipe Interface**
- Tinder-style card swiping (RIGHT = No, LEFT = Yes)
- Profile management with photos, bio, age, location
- Match system when both users swipe left (yes)
- View all your connections

**Authentication**
- Secure email/password login with Better Auth
- Google OAuth sign-in (Web, Android, iOS)
- Auto-prompt for login on app startup

**Map & Location Features**
- Google Maps integration with real-time location tracking
- Location permission handling
- Recenter map to current location
- Create location-based quests
- Discover nearby quest opportunities (coming soon)

**Navigation & Menu**
- Redesigned hamburger menu with organized sections
- **PROFILE**: Profile & Settings (navigates to profile), Settings (opens modal), Help & Support, Invite Warriors
- **ADVENTURE**: Quest Calendar, Past Quests, Leaderboard, Growth & Achievements
- **COMMUNITY**: Groups, Manage Categories, Explore World
- Log out and version display

**Profile & Settings**
- Dedicated Settings screen accessible from Profile page
- Tap the cog wheel icon in Profile to navigate to Settings
- **Account**: Main account header
- **Appearance**: Theme toggle (Light/Dark mode)
- **Preferences**: Language selection with 10 languages supported
  - 🇺🇸 English
  - 🇪🇸 Spanish (Español)
  - 🇫🇷 French (Français)
  - 🇩🇪 German (Deutsch)
  - 🇧🇷 Portuguese (Português)
  - 🇮🇹 Italian (Italiano)
  - 🇯🇵 Japanese (日本語)
  - 🇨🇳 Chinese (中文)
  - 🇰🇷 Korean (한국어)
  - 🇸🇦 Arabic (العربية)
- **Live Features**: Enable livestreaming configuration
- **Notifications**: Quest reminders toggle
- **Legal**: Safety Guidelines access
- **Account Actions**: Sign out option

**Live Streaming** ✨ NEW!
- Real-time live streaming powered by Daily.co
- Stream your quest challenges to the community
- Link active quests to your live streams
- Live comments and viewer count
- Stream controls (mic, video, flip camera)
- Quest card overlay during streams
- View and join active community streams
- "Go Live" button from Profile page

### Coming Soon
- 📍 **Quest Markers**: Show active quests on map with color-coded categories
- 💬 **Messaging**: Chat with your matches
- 👥 **Groups**: Join communities for specific challenges
- 🎥 **WebRTC Integration**: Full Daily.co camera/audio integration

## Tech Stack

### Frontend
- **Expo SDK 53** with React Native 0.76.7
- **React Navigation 7**: Native stack and tab navigation
- **Nativewind**: TailwindCSS for React Native styling
- **React Native Reanimated 3**: Smooth animations
- **React Native Gesture Handler**: Swipe gestures
- **React Native Maps**: Google Maps integration with location tracking
- **Expo Location**: Real-time user location services
- **Daily.co React Native SDK**: Live streaming and WebRTC
- **TanStack Query**: Data fetching and caching
- **Lucide React Native**: Beautiful icons
- **i18n**: Multi-language support with AsyncStorage persistence

### Backend
- **Bun + Hono**: Fast TypeScript backend server
- **Prisma ORM**: Type-safe database access
- **SQLite**: Local database (migrating to Supabase)
- **Better Auth**: Authentication with email/password and Google OAuth
- **OpenAI API**: AI quest generation
- **Resend API**: Email functionality
- **Google Maps API**: Location services
- **Daily.co API**: Live streaming infrastructure (optional)
- **Perplexity AI**: Optional AI features

### Database Schema
- **User**: Authentication and user data
- **Profile**: Display name, bio, photos, location, live status
- **Quest**: Challenge templates (AI-generated or predefined)
- **UserQuest**: User's quest progress and completion
- **UserStats**: Streaks, XP, points, trophies, diamonds
- **Swipe**: Track user swipes
- **Match**: Store mutual matches
- **LiveStream**: Live streaming sessions with room URLs
- **LiveStreamComment**: Comments on live streams

## Design

### Color Palette
- 🟠 Orange/Coral: `#FF6B35` (primary action)
- 🟣 Deep purples: `#7B3FE4`, `#5E1FA8`
- 🔵 Electric blue: `#00D9FF`, `#0099FF`
- ⚫ Dark backgrounds: `#0A0A0F`, `#1A1A24`, `#2A1A34`
- 🟢 Green (success): `#4CAF50`
- 🟡 Gold (rewards): `#FFD700`

### Style
- Modern glassmorphism with blur effects
- Smooth spring animations
- Category-based color coding
- Dark theme optimized

## Project Structure

```
/home/user/workspace/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx           # Quest dashboard (NEW!)
│   │   ├── QuestDetailScreen.tsx    # Quest tracking with clean card UI
│   │   ├── SwipeScreen.tsx          # Community swipe
│   │   ├── MatchesScreen.tsx        # View matches
│   │   ├── ProfileScreen.tsx        # User profile
│   │   ├── EditProfileScreen.tsx    # Edit profile
│   │   ├── LiveScreen.tsx           # Live (placeholder)
│   │   ├── MapScreen.tsx            # Map (placeholder)
│   │   └── LoginModalScreen.tsx     # Auth modal
│   ├── components/
│   │   ├── SwipeCard.tsx
│   │   ├── LoginWithEmailPassword.tsx
│   │   └── LoginButton.tsx
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   └── types.ts
│   ├── lib/
│   │   ├── api.ts
│   │   ├── authClient.ts
│   │   ├── useSession.tsx
│   │   └── queryClient.ts
│   └── shared/
│       └── contracts.ts
├── backend/
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   ├── profile.ts
│   │   │   ├── discover.ts
│   │   │   ├── swipe.ts
│   │   │   ├── matches.ts
│   │   │   ├── quests.ts    # NEW!
│   │   │   ├── stats.ts     # NEW!
│   │   │   └── live.ts      # NEW!
│   │   ├── auth.ts
│   │   └── db.ts
│   └── prisma/
│       ├── schema.prisma
│       └── dev.db
└── App.tsx
```

## API Endpoints

### Quests
- `GET /api/quests` - Get user's active and queued quests
- `POST /api/quests/generate` - Generate AI-powered quest
- `POST /api/quests/:id/start` - Start a quest (max 2 active)
- `POST /api/quests/:id/record` - Record NO or YES attempt

### Stats
- `GET /api/stats` - Get user statistics

### Live Streaming ✨ NEW!
- `POST /api/live/start` - Start a live stream
- `POST /api/live/:id/end` - End a live stream
- `GET /api/live/active` - Get all active live streams
- `POST /api/live/:id/comment` - Add comment to stream
- `GET /api/live/:id/comments` - Get stream comments

### Profile
- `GET /api/profile` - Get current user's profile
- `POST /api/profile` - Create/update profile

### Discovery & Community
- `GET /api/discover` - Get profiles to swipe on
- `POST /api/swipe` - Create a swipe
- `GET /api/matches` - Get all matches

### Auth
- `/api/auth/*` - Authentication endpoints

## Development

Running automatically:
- **Frontend**: Port 8081 (Expo)
- **Backend**: Port 3000 (Hono)
- **Database Studio**: Port 3001 (Prisma Studio - CLOUD tab)

## Setup

See `ENV_SETUP.md` for complete environment variable setup guide.

### Required APIs

1. **Google OAuth (Authentication)**
   - Add via ENV tab: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - Frontend: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`

2. **Google Maps API**
   - Add via ENV tab: `GOOGLE_MAPS_API_KEY`
   - Frontend: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

3. **OpenAI API (Optional but Recommended)**
   - Add `OPENAI_API_KEY` via ENV tab in Vibecode app
   - Enables AI-powered quest generation
   - Falls back to predefined quests if not set

4. **Daily.co API (Optional - for Production Live Streaming)**
   - Sign up at https://daily.co for free account
   - Add `DAILY_API_KEY` via ENV tab
   - Currently uses mock rooms in development
   - Required for production live streaming with real WebRTC

5. **Resend (Email)**
   - Add via ENV tab: `RESEND_API_KEY`

6. **Perplexity AI (Optional)**
   - Add via ENV tab: `PERPLEXITY_API_KEY`

### Test the App

1. Create an account with email/password OR sign in with Google
2. Tap the orange floating Create button (+) or the "Create Quest" button
3. Select a category (Sales, Social, Dating, etc.) and difficulty level
4. Optionally add a custom prompt to personalize your quest
5. Tap "Create Quest with AI" to generate your challenge
6. Start the quest and track your progress
7. Collect NOs and YESes to complete challenges

## Next Steps

1. ✅ **Quest System** - COMPLETED!
2. 🎥 **Live Streaming**: Integrate VideoSDK/Agora
3. 🗺️ **Map with Quests**: Show nearby quest locations
4. 📸 **Photo Upload**: Quest completion photos
5. 💬 **Messaging**: Chat with matches
6. 🔔 **Push Notifications**: Quest reminders
7. 🌐 **Supabase**: Migrate to production database

## Notes

- **Max Active Quests**: 2 at a time, extras go to queue
- **AI Generation**: Requires `OPENAI_API_KEY` (optional)
- **Rewards Formula**: XP = (goalCount × 10 × difficulty) + 50
- **Swipe Logic**: RIGHT = No, LEFT = Yes (inverted)
- **Styling**: Nativewind (TailwindCSS)
- **Type Safety**: Shared contracts via `/shared/contracts.ts`
- **Database**: Prisma migrations required for schema changes
