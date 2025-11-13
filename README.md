# Go for No - Rejection Challenge App

A revolutionary mobile app that helps users overcome fear of rejection through AI-powered "No Quests" - action-based challenges designed to build confidence and resilience. Complete quests, track progress, level up, and connect with a community of fellow challengers!

## Features

### 🎯 No Quest System (MAIN FEATURE)

**AI-Generated Challenges**
- Create custom rejection quests using OpenAI
- 6 Categories: Sales, Social, Entrepreneurship, Dating, Confidence, Career
- 4 Difficulty Levels: Easy, Medium, Hard, Expert
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
- Hamburger menu with comprehensive navigation options
- Quick access to Profile, Quest Stats, Settings
- Quest Labs for experimental features
- Help & Support center
- Referral system
- Trends & Analytics dashboard
- Quest History tracking
- Community access
- Wellness & Rest Mode
- Third-party Integrations hub

### Coming Soon
- 🎥 **Live Streaming**: Real-time verification using VideoSDK/Agora
- 📍 **Quest Markers**: Show active quests on map with color-coded categories
- 💬 **Messaging**: Chat with your matches
- 👥 **Groups**: Join communities for specific challenges

## Tech Stack

### Frontend
- **Expo SDK 53** with React Native 0.76.7
- **React Navigation 7**: Native stack and tab navigation
- **Nativewind**: TailwindCSS for React Native styling
- **React Native Reanimated 3**: Smooth animations
- **React Native Gesture Handler**: Swipe gestures
- **React Native Maps**: Google Maps integration with location tracking
- **Expo Location**: Real-time user location services
- **TanStack Query**: Data fetching and caching
- **Lucide React Native**: Beautiful icons

### Backend
- **Bun + Hono**: Fast TypeScript backend server
- **Prisma ORM**: Type-safe database access
- **SQLite**: Local database (migrating to Supabase)
- **Better Auth**: Authentication with email/password and Google OAuth
- **OpenAI API**: AI quest generation
- **Resend API**: Email functionality
- **Google Maps API**: Location services
- **Perplexity AI**: Optional AI features

### Database Schema
- **User**: Authentication and user data
- **Profile**: Display name, bio, photos, location, live status
- **Quest**: Challenge templates (AI-generated or predefined)
- **UserQuest**: User's quest progress and completion
- **UserStats**: Streaks, XP, points, trophies, diamonds
- **Swipe**: Track user swipes
- **Match**: Store mutual matches

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
│   │   ├── QuestDetailScreen.tsx    # Quest tracking (NEW!)
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
│   │   │   └── stats.ts     # NEW!
│   │   ├── auth.ts
│   │   └── db.ts
│   └── prisma/
│       ├── schema.prisma
│       └── dev.db
└── App.tsx
```

## API Endpoints

### Quests (NEW!)
- `GET /api/quests` - Get user's active and queued quests
- `POST /api/quests/generate` - Generate AI-powered quest
- `POST /api/quests/:id/start` - Start a quest (max 2 active)
- `POST /api/quests/:id/record` - Record NO or YES attempt

### Stats (NEW!)
- `GET /api/stats` - Get user statistics

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

4. **Resend (Email)**
   - Add via ENV tab: `RESEND_API_KEY`

5. **Perplexity AI (Optional)**
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
