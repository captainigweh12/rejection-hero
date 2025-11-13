# Go for No - Mobile App

A unique social verification mobile app where rejection is the goal! Swipe through profiles with an inverted Tinder-style interface (RIGHT = No, LEFT = Yes), featuring live streaming verification and location-based discovery.

## Features

### Core Features (v1)
- **Swipe Interface**: Tinder-style card swiping with inverted logic
  - Swipe RIGHT for No ❌
  - Swipe LEFT for Yes ✅
- **Profile Management**: Create and edit user profiles with photos, bio, age, and location
- **Match System**: Get matched when both users swipe left (yes) on each other
- **Matches View**: See all your connections in one place
- **Authentication**: Secure email/password login with Better Auth

### Coming Soon
- **Live Streaming**: Real-time video verification using VideoSDK/Agora
- **Map View**: Location-based user discovery with Google Maps
- **Messaging**: Chat with your matches

## Tech Stack

### Frontend
- **Expo SDK 53** with React Native 0.76.7
- **React Navigation 7**: Native stack and tab navigation
- **Nativewind**: TailwindCSS for React Native styling
- **React Native Reanimated 3**: Smooth card swipe animations
- **React Native Gesture Handler**: Swipe gesture detection
- **TanStack Query**: Data fetching and caching
- **Lucide React Native**: Beautiful icons

### Backend
- **Bun + Hono**: Fast TypeScript backend server
- **Prisma ORM**: Type-safe database access
- **SQLite**: Local database (migrating to Supabase)
- **Better Auth**: Authentication with email/password

### Database Schema
- **User**: Authentication and user data
- **Profile**: Display name, bio, photos, location, live status
- **Swipe**: Track user swipes (left/right)
- **Match**: Store mutual matches

## Design

### Color Palette
- Deep purples: `#7B3FE4`, `#5E1FA8`
- Electric blue: `#00D9FF`, `#0099FF`
- Dark backgrounds: `#0A0A0F`, `#1A1A24`, `#2A1A34`

### Style
- Modern glassmorphism with blur effects
- Smooth spring animations
- Glowing neon accents
- Dark theme optimized

## Project Structure

```
/home/user/workspace/
├── src/
│   ├── screens/
│   │   ├── SwipeScreen.tsx          # Main swipe interface
│   │   ├── MatchesScreen.tsx        # View all matches
│   │   ├── ProfileScreen.tsx        # User profile view
│   │   ├── EditProfileScreen.tsx    # Edit profile form
│   │   ├── LiveScreen.tsx           # Live streaming (placeholder)
│   │   ├── MapScreen.tsx            # Map view (placeholder)
│   │   └── LoginModalScreen.tsx     # Authentication modal
│   ├── components/
│   │   ├── SwipeCard.tsx            # Animated swipe card component
│   │   ├── LoginWithEmailPassword.tsx
│   │   └── LoginButton.tsx
│   ├── navigation/
│   │   ├── RootNavigator.tsx        # App navigation setup
│   │   └── types.ts                 # Navigation types
│   ├── lib/
│   │   ├── api.ts                   # API client
│   │   ├── authClient.ts            # Auth client
│   │   ├── useSession.tsx           # Session hook
│   │   └── queryClient.ts           # TanStack Query setup
│   └── shared/
│       └── contracts.ts             # Shared types between frontend/backend
├── backend/
│   ├── src/
│   │   ├── index.ts                 # Server entry point
│   │   ├── routes/
│   │   │   ├── profile.ts           # Profile CRUD
│   │   │   ├── discover.ts          # Get profiles to swipe
│   │   │   ├── swipe.ts             # Create swipes
│   │   │   └── matches.ts           # Get user matches
│   │   ├── auth.ts                  # Better Auth config
│   │   └── db.ts                    # Prisma client
│   └── prisma/
│       ├── schema.prisma            # Database schema
│       └── dev.db                   # SQLite database
└── App.tsx                          # App entry point
```

## API Endpoints

### Profile
- `GET /api/profile` - Get current user's profile
- `POST /api/profile` - Create/update profile

### Discovery
- `GET /api/discover` - Get profiles to swipe on (excludes already swiped)

### Swipes
- `POST /api/swipe` - Create a swipe (left/right)
  - Returns match status if matched

### Matches
- `GET /api/matches` - Get all user matches

### Auth
- `/api/auth/*` - Authentication endpoints (Better Auth)

## Development

The app is running automatically on:
- **Frontend**: Port 8081 (Expo)
- **Backend**: Port 3000 (Hono)
- **Database Studio**: Port 3001 (Prisma Studio - accessible via CLOUD tab)

## Next Steps

1. **Supabase Integration**: Migrate from SQLite to Supabase for production
2. **Live Streaming**: Integrate VideoSDK or Agora for real-time verification
3. **Google Maps**: Add location-based discovery
4. **Photo Upload**: Allow users to upload profile photos
5. **Messaging**: Real-time chat between matches
6. **Push Notifications**: Match notifications

## Notes

- Swipe logic is inverted: RIGHT = No, LEFT = Yes
- All styling uses Nativewind (TailwindCSS)
- Backend and frontend share types via `/shared/contracts.ts`
- Database updates require Prisma migrations