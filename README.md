# Go for No - Rejection Challenge App

A revolutionary mobile app that helps users overcome fear of rejection through AI-powered "No Quests" - action-based challenges designed to build confidence and resilience. Complete quests, track progress, level up, and connect with a community of fellow challengers!

## Features

### 🏠 Home Screen ✨ ENHANCED! (Gaming-Style UI)

**3D Gaming Profile Card** 🎮 NEW!
- **Avatar with Rainbow Border**: 3D gradient ring (orange → purple → cyan) around user avatar
- **Level Badge**: Gold badge with shadow showing current level (calculated from XP)
- **3D Stat Badges**: Three glassmorphism badges displaying:
  - 🔥 **Streak**: Fire icon with current streak count
  - 🏆 **Trophy**: Trophy icon with trophy count
  - 💎 **Diamonds**: Diamond icon with gems count
- **XP Progress Bar**: Gradient-filled bar (purple → cyan) showing progress to next level
- **Level System**: Level = (Total XP / 100) + 1
- **Clickable Profile**: Tap card to navigate to profile page
- Gaming aesthetic with shadows, borders, and gradient effects

**My Active Quests Section**
- Section header: "My Active Quests"
- Shows all active quests with progress
- Quest cards with category, difficulty, and completion tracking

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

**Quest Detail Experience** ✨ MODERNIZED! (3D Dark Theme Design)
- **Modern 3D UI**: Dark gradient background (#0A0A0F to #1A1A24) with glassmorphism effects
- **3D Stats Header** 🎨 NEW!:
  - Redesigned header with gradient background
  - Three clickable stat cards with 3D glass effect:
    - **🔥 Streak**: Clickable - navigates to Growth & Achievements page
    - **🏆 Trophy**: Shows trophy count
    - **💎 Diamonds**: Shows diamond count
  - Each card has icon in colored circle with label and value
  - Semi-transparent backgrounds with colored borders
- **Go Live Button** 📹 NEW!:
  - Purple video camera icon button in header
  - Quick access to Live streaming tab
  - Matches app's premium aesthetic
- **Smart Countdown Timer**: Adjusts based on difficulty
  - EASY: 10 minutes
  - MEDIUM: 15 minutes
  - HARD: 20 minutes
  - EXPERT: 30 minutes
  - Warning state when under 60 seconds
- **3D Glassmorphism Quest Card** 🎨:
  - Semi-transparent card with purple glow border
  - Smooth gradients and shadow effects
  - White text on dark background
  - Enhanced category and difficulty badges
- **Modern Progress Bar**: Gradient-filled with colored border matching theme
- **Enhanced Action Buttons** 💫:
  - Gradient-filled buttons with LinearGradient
  - Gold gradient for "I Did It!" star button
  - Green gradient for NO button
  - Red gradient for YES button
  - Improved visual feedback and animations
- **Refined Color Palette**:
  - Primary: #7E3FE4 (purple)
  - Accent: #00D9FF (cyan)
  - Success: #10B981 (green)
  - Warning: #FFD700 (gold)
  - Danger: #EF4444 (red)
- **Quit Quest Button**: Red X button in header to end quest anytime with confirmation
- **Quest Regeneration** 🔄:
  - Tap on category or difficulty badges to change them
  - Select new category and difficulty from dropdown modals
  - "Regenerate Quest" button appears when both are selected
  - Instantly replaces current quest with new AI-generated quest
  - Keeps your location context for nearby places
  - Works even when you have 2 active quests

**Quest Completion Flow** ✨ ENHANCED! (3D Glassmorphism Design)
- **Dark Gradient Background**: Beautiful gradient from #0A0A0F → #1A1A24 → #2A1A34 (replaces bright green)
- **3D Glassmorphism Cards** 🎨 NEW!:
  - Semi-transparent backgrounds: rgba(255, 255, 255, 0.05)
  - Colored borders with glow effects
  - Enhanced shadow effects for depth
  - Premium dark theme matching the homepage
- **Loading screen**: 2-second loading animation with pulsing trophy
- **Smooth animations** 🎨:
  - Floating confetti particles with random colors, sizes, and rotation
  - Bounce and scale animations on all elements
  - Smooth fade and slide transitions between pages
  - Trophy with rotation and bounce effect
  - Flame icon with pulsing glow
  - Card elements slide up with staggered timing
  - Golden glowing shadows on icons
- **Sequential completion pages** (tap to advance through each):
  - **Page 1 - Accomplishments**: 3D glassmorphism card with dark gradient background
    - Gradient stat cards for XP and Points earned (gold/orange theme)
    - Glassmorphism cards for Total XP and Total Points (purple/cyan theme)
    - Semi-transparent with colored borders and glow effects
  - **Page 2 - Leaderboard**: Shows your rank and top 5 warriors with their XP
    - 3D glassmorphism rank card with blue glow
    - Dark themed list with white text
    - Current user highlighted with orange accent
  - **Page 3 - Streak**: Large streak display with fire icon
    - 3D glassmorphism card with orange/red border glow
    - Enhanced loading state for next quest generation
- **Auto-generation**: Automatically creates next harder quest when you tap on streak page
- Progressive difficulty: EASY → MEDIUM → HARD → EXPERT
- Smooth spring physics and bounce animations throughout
- Visual feedback while generating next quest
- Each page is tap-to-advance for intuitive flow
- **Smart quest limit handling**: Properly handles the 2-quest active limit when auto-generating next quest
- User-friendly error messages if quest limit is reached

**AI Quest Generation** ✨ ENHANCED! (Context-Aware & Location-Based with Google Maps)
- **Personal Context** 🎯:
  - Add personal context when creating quests (e.g., "I'm a software developer looking for a job")
  - AI tailors quests to your specific goals and situation
  - Examples provided for Career, Dating, Sales, etc.
- **Quest Type Selection** ⭐ NEW!:
  - Choose between two quest styles when creating:
    - **🎯 Rejection Challenge**: Track YES/NO responses from asking people for things
    - **⭐ Action Challenge**: Complete positive actions and track with star button
  - Visual selection cards with icons and descriptions
  - Examples shown for each type
- **Smart Quest Types** ⭐:
  - **TAKE_ACTION quests**: For action-based tasks
    - Examples: Applying to jobs, sending emails, complimenting people, networking events
    - Shows golden star "I Did It!" button instead of YES/NO
    - Tracks actions completed with star counter
    - Perfect for career advancement, personal growth, and positive social actions
  - **COLLECT_NOS quests**: Traditional rejection challenges
    - Examples: Asking for discounts, favors, custom items, dates
    - Shows YES/NO buttons to track responses
  - **COLLECT_YES quests**: For collecting approvals
- **Social Action Examples** 🌟 NEW!:
  - "Compliment 5 random people on their outfit"
  - "Tell 5 people they have nice shoes"
  - "Give 3 strangers genuine compliments"
  - AI generates positive social interaction quests alongside career/rejection challenges
- **3-word titles**: All quests have concise 3-word action titles (e.g., "Ask Coffee Shops", "Request Business Cards", "Apply To Jobs")
- **Unique challenges**: AI tracks your last 20 quests and ensures no duplicates
- **Google Maps Places API Integration** 🗺️:
  - Fetches real verified places within 10 miles using Google Maps
  - AI receives list of actual businesses with accurate GPS coordinates
  - Quests direct you to real, existing locations near you
  - No more made-up or far away locations!
  - **Human-readable descriptions**: Quest descriptions use place names like "Visit Starbucks on Main Street" instead of technical GPS coordinates
- **Location-aware (10-mile radius)**:
  - Requests location permission on quest screen
  - AI generates quests ONLY within 10 miles of your current location
  - Suggests specific nearby places that are walkable or a short drive
  - Uses actual business names and addresses from Google Maps
  - "📍 Share Location" button appears if location not enabled
- **Time-aware**: AI considers current time of day and ONLY suggests locations that are open right now
  - **Morning (6am-12pm)**: Coffee shops, breakfast spots, gyms, professional networking
  - **Afternoon (12pm-5pm)**: Lunch spots, retail stores, libraries, shopping malls
  - **Evening (5pm-9pm)**: Dinner restaurants, evening cafes, stores still open, evening activities
  - **Night (9pm-6am)**: Only late-night venues (24-hour stores, late-night diners, bars)
  - User gets quests they can start immediately without waiting for businesses to open
- **Date-aware**: Adapts to weekday vs weekend and considers what businesses are open
- **Map integration**: "📍 View on Map" button opens Google Maps with exact quest location (using accurate coordinates from verified places)
- **Higher creativity**: Temperature set to 0.9 for more variety
- **Difficulty-based goals**:
  - For COLLECT_NOS/COLLECT_YES:
    - EASY: 3-5 NOs/YESes (10 min timer)
    - MEDIUM: 5-8 NOs/YESes (15 min timer)
    - HARD: 8-12 NOs/YESes (20 min timer)
    - EXPERT: 12-15 NOs/YESes (30 min timer)
  - For TAKE_ACTION:
    - EASY: 1-3 actions (10 min timer)
    - MEDIUM: 3-5 actions (15 min timer)
    - HARD: 5-8 actions (20 min timer)
    - EXPERT: 8-12 actions (30 min timer)
  - **Smart goal counts**: Single-location front desk quests automatically set to 1 NO (e.g., "Visit Hilton Hotel and ask front desk for free upgrade" = 1 NO)
- Specific, actionable descriptions with clear instructions

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

**Community Hub** ✨ ENHANCED! (Comprehensive Social Network)
- **Modern Tabbed Interface** with three main sections:
  - 👥 **Friends Tab**: Manage friendships and requests
  - 💬 **Messages Tab**: Direct messaging conversations
  - 🏘️ **Groups Tab**: Join and manage groups
- **Real-time Stats Cards** showing:
  - Friend count with purple badge
  - Active conversations with blue badge
  - Group memberships with green badge
- **Search Functionality** 🔍 NEW!:
  - Search button in header navigates to dedicated search screen
  - Search for users by name or email
  - Send friend requests directly from search results
  - Modern card-based search results UI
- **Notifications Bell** 🔔 NEW!:
  - Red badge shows count of pending friend requests
  - Tap to view friend requests in Friends tab
  - Alert notification when no requests pending
- **Friend System**:
  - Search for users by name or email
  - Send/receive friend requests
  - Accept or decline requests with smooth animations
  - View all friends with profile avatars
  - Message friends directly
  - Share quests with friends
- **Direct Messaging**:
  - One-on-one conversations with friends
  - Unread message badges and counts
  - Last message preview with timestamps
  - Message read/unread tracking
  - Tap to open chat screen (coming soon)
- **Groups (Facebook-style)**:
  - **My Groups**: Groups you've joined with role badges (admin/moderator/member)
  - **Discover Groups**: Browse and join public groups
  - Create new groups with custom names, descriptions, and cover images
  - Public/private group options
  - Member count and role management
  - Leave groups or delete (if creator)
- **Quest Sharing**:
  - Share any quest with your friends
  - Friends can accept or decline shared quests
  - Optional message when sharing
  - Accepted quests automatically added to friend's queue
  - Only friends can share quests with each other
- **Beautiful Modern UI**:
  - Card-based design with smooth animations
  - Theme-aware (adapts to light/dark mode)
  - Loading states with spinners
  - Empty states with helpful messages
  - Glassmorphism effects on buttons
  - Responsive tap feedback

**Swipe Interface** ✨ MODERNIZED!
- **Modern Dating App UI** inspired by Tinder/Bumble
- **Three Action Buttons**:
  - ❌ Pass (X) - Red button on left
  - ⭐ Super Like (Star) - Large blue button in center with glow
  - ❤️ Like (Heart) - Green button on right
- **Smooth Card Animations** with gesture-based swiping
- **Interest Tags/Badges** displayed on profile cards (up to 5 shown)
- **Profile Cards Display**:
  - Large profile photo with gradient overlay
  - Name, age, and location
  - Bio text (2 lines max)
  - Interest badges with glassmorphism effect
  - Live streaming indicator (if streaming)
- **Swipe Logic**: RIGHT = Pass, LEFT = Like
- **Match System**: Matches created when both users like each other
- **Theme-Aware**: Buttons adapt to light/dark mode

**Profile Management**
- Add profile photos, bio, age, location
- **Set Interest Tags** to display on swipe cards
- AI-generated gaming avatars
- View all your connections

**Authentication**
- Secure email/password login with Better Auth
- Google OAuth sign-in (Web, Android, iOS)
- Auto-prompt for login on app startup

**Map & Location Features**
- Google Maps integration with real-time location tracking
- **iOS & Android location permissions properly configured**:
  - iOS: NSLocationWhenInUseUsageDescription and NSLocationAlwaysAndWhenInUseUsageDescription set
  - Android: ACCESS_FINE_LOCATION and ACCESS_COARSE_LOCATION permissions added
- Location permission handling with user-friendly error messages
- Recenter map to current location
- Create location-based quests
- Discover nearby quest opportunities (coming soon)

**Navigation & Menu**
- Redesigned hamburger menu with organized sections
- **PROFILE**: Profile & Settings (navigates to profile), Settings (opens modal), Help & Support, Invite Warriors
- **ADVENTURE**: Quest Calendar, Past Quests, Leaderboard, Growth & Achievements
- **COMMUNITY**: Groups, Manage Categories, Explore World
- Log out and version display

**Social Feed System** ✨ ENHANCED!
- **Facebook-Style Posts**:
  - Create text posts with optional images (up to 4 images per post)
  - **Camera Support**: Take photos directly from the app or select from gallery
  - Privacy settings: Public, Friends Only, or Groups Only
  - Like and comment on posts
  - Real-time feed updates
  - Delete your own posts
  - Scrollable feed with pull-to-refresh
- **Privacy & Filtering**:
  - PUBLIC: Everyone can see
  - FRIENDS: Only accepted friends can see
  - GROUPS: Only group members can see
  - Smart feed filtering based on privacy settings and friendships
- **Post Features**:
  - Multiple image uploads per post
  - Like counter with heart animation
  - Comment section with expandable view
  - User avatars and display names
  - Timestamp with "time ago" display
  - Group post indicators
- **Moments (Stories)** 📸 ENHANCED!:
  - Instagram-style 24-hour stories
  - **Camera Support**: Take photos directly or select from gallery
  - Horizontal scrollable moments bar at top of feed
  - View friends' moments in fullscreen viewer
  - Navigate between multiple moments
  - Automatic expiration after 24 hours
  - Purple ring indicator for new moments
- **Community Tab Integration**:
  - Four tabs: Feed, Friends, Messages, Groups
  - Feed tab shows social posts and moments
  - Seamless integration with existing community features
- **Create Post Modal** ✨ FIXED!:
  - **SafeArea Optimized**: Proper top and bottom safe area handling
  - Full-screen modal for creating posts
  - Text input with character counter
  - **Gallery Button**: Pick multiple photos from device
  - **Camera Button**: Take photos directly in the app
  - Privacy selector with icons
  - Preview selected images before posting
  - Remove individual images before posting
- **Create Moment Modal** ✨ FIXED!:
  - **SafeArea Optimized**: Proper top and bottom safe area handling
  - Full-screen moment creation interface
  - **Gallery Button**: Select photos from device
  - **Camera Button**: Take photos with camera
  - Photo preview before sharing
  - Change or remove photo before posting
- **Interactive Features**:
  - Pull-to-refresh for new content
  - Infinite scroll support
  - Real-time like/comment updates
  - Optimistic UI updates

**Journal & Growth Tracking** ✨ NEW!
- **Voice Recording Journal**:
  - Record audio reflections about rejection experiences
  - Tap-to-record interface with microphone button
  - AI-powered transcription using OpenAI Whisper
  - Automatic AI summarization of journal entries
  - Edit AI summaries before saving
  - Recent entries displayed with outcome badges
- **Outcome Tracking**:
  - **Yes**: Track when people say yes to your requests (Red color)
  - **No**: Track rejection experiences - the core of growth! (Green color)
  - **Activity**: Track completed actions and milestones (Blue color)
  - Visual cards with color-coded icons for each outcome
- **Growth Achievements System** 🌟:
  - Earn gold stars for every journal entry
  - Automatic achievement generation on save
  - Track total achievements, gold/silver/bronze stars
  - View achievement history with linked journal entries
  - Beautiful stats dashboard showing progress
  - Each achievement includes timestamp and description
- **Growth & Achievements Page**:
  - Comprehensive stats overview with star counts
  - Visual achievement cards with star badges
  - Filter by outcome type (Yes/No/Activity)
  - View journal entry summaries with each achievement
  - Track growth over time
- **Bottom Tab Navigation**: Dedicated Journal tab for quick access
- **AI Integration**: Requires OPENAI_API_KEY for transcription and summarization

**Profile & Settings** ✨ FULLY REDESIGNED!

**Gaming-Style Profile Page** 🎮 ENHANCED!
- **Hero Header with Uniform Gradient** 🎨 FIXED!: Smooth purple gradient banner without color splits
- **Glowing Avatar** ✨:
  - Large 140x140px avatar with white border
  - Golden (#FFD700) shadow glow effect for gaming aesthetic
  - Camera button overlay for avatar changes
  - Golden level badge positioned on avatar (top-right)
  - **Displays AI-generated or uploaded avatar** when set
- **AI Avatar Generation** 🤖 ACTIVE!:
  - Tap camera button to open avatar options
  - Choose "Generate AI Avatar" to create gaming-style profile picture
  - **8 Unique Styles Available**:
    - 🎮 Gaming Warrior - Epic futuristic warrior with neon glow
    - ⚡ Anime Hero - Bold anime character with determined look
    - ⚔️ Fantasy Warrior - Powerful warrior with glowing armor
    - 🥷 Stealth Ninja - Mysterious ninja in action pose
    - 🔮 Mystical Mage - Wizard casting magical spells
    - 🤖 Cyberpunk Cyborg - Half human, half machine with neon lights
    - ✨ Fantasy Hero - Magical character with glowing aura
    - 👤 Realistic Photo - Professional photorealistic portrait
  - **Powered by OpenAI DALL-E 3**: High-quality 1024x1024 avatars
  - Generation takes 10-20 seconds
  - Avatar automatically saved to profile
  - Requires OPENAI_API_KEY in environment variables
- **Username Display**: Large, uppercase with letter-spacing
- **XP Progress Bar** 📊:
  - Shows current XP out of 100 to next level
  - Golden progress indicator
  - "X / 100 XP to Level Y" text
- **Three Gaming Stat Cards** 🏆:
  - **Streak**: Flame icon with current streak days
  - **Quests**: Target icon with total quests completed
  - **Trophies**: Trophy icon with total trophies earned
  - Each card has colored icon badge and large stat number
- **Modern Tab System**: Three tabs with smooth transitions
  - **Quests Tab** ⚡ ENHANCED!:
    - Live Streaming promotion card
    - **Quick Actions** with functional navigation:
      - **View Active Quests** ✅ ACTIVE! - Navigates to Home tab to see active quests
      - **View Achievements** - Coming soon notification
  - **Stats Tab**: Detailed progress metrics and global ranking card
  - **About Tab**: User context for AI quest personalization
- **AI Quest Context Section** 🤖 NEW!:
  - Edit mode with three personalization fields:
    - **About You**: Background and current situation (for tailored quests)
    - **Your Goals**: What you want to achieve (quest personalization)
    - **Interests & Hobbies**: Topics and activities you enjoy
  - Save button to store context for better AI quest generation
  - Context helps AI create quests that match your life and goals
- **Avatar Upload Modal** 📸:
  - **Generate AI Avatar** - ACTIVE! Choose from 8 gaming styles
  - Upload Photo option - Coming soon (camera/gallery)

**Theme System** 🎨:
- Full dark/light mode support throughout the app
- System theme option (follows device settings)
- Tap theme card to cycle: System → Light → Dark
- Dynamic color system that adapts all screens
- Smooth transitions between themes
- Icon indicators: Sun (Light), Moon (Dark), Smartphone (System)
- Persisted in AsyncStorage

**Language Selection** 🌍:
- Dedicated full-screen Language Selection page
- Modern card-based language picker with flags
- 10 languages fully supported with native translations
- Real-time app-wide language switching
- Selected language highlighted with checkmark badge
- Persisted in AsyncStorage
- Languages supported:
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

**Settings Screen** ⚙️:
- Modern card-based layout with consistent spacing
- **Appearance**: Theme switcher with visual icons
- **Preferences**: Language selection (navigates to dedicated page)
- **Live Features**: Enable livestreaming with description
- **Notifications**: Quest reminders toggle
- **Legal**: Safety Guidelines access
- **Account Actions**: Sign out with confirmation

**Hamburger Menu** 📱:
- Modern card-based design throughout
- Color-coded icon badges in circular containers
- ChevronRight indicators for navigation
- Profile card with gradient avatar
- Organized sections: Profile, Adventure, Community
- Theme-aware colors

**Live Streaming** ✨ FULLY ENHANCED!
- **Modern Live Page UI** 🎨:
  - "Live Now" header with featured streams section
  - Horizontal scrolling featured streams (top 3)
  - Grid view of all active streams with thumbnails
  - Live badges, viewer counts, and quest info on cards
  - Empty state with call-to-action for first streamers
- **Stream Discovery** 📺:
  - Browse all active live streams in a beautiful card layout
  - See who's streaming with user avatars and names
  - View linked quest challenges and categories
  - Real-time viewer count updates (refreshes every 5 seconds)
  - Tap any stream to join and watch
- **Streaming Features** 🎥:
  - Real-time live streaming powered by Daily.co
  - Stream your quest challenges to the community
  - Link active quests to your live streams
  - **Modern Quest Overlay Card** with progress tracking
  - Interactive quest card with "Track Progress" button
  - Stream controls (mic, video, flip camera)
  - Camera permission handling with beautiful UI
  - "Go Live" hero button with description
- **Live Chat System** 💬:
  - Real-time chat during streams (3-second refresh)
  - Send and receive messages from viewers
  - Username display with golden highlights
  - Smooth chat bubbles with modern design
  - Chat visible for both streamers and viewers
  - Keyboard-aware input with send button
- **Quest Suggestion System** 🎁:
  - **Viewers can send quest challenges** to streamers
  - **Diamond boost system** for quest priority (0, 5, 10, 25, 50💎)
  - Higher boosts = higher priority in suggestion queue
  - Optional personal message with quest suggestions
  - Suggestions automatically sorted by boost amount
  - Crown badge shows boosted quests
- **Streamer Quest Management** ⚡:
  - Golden gift button with notification badge
  - View all pending quest suggestions
  - **Accept or Decline** quests with one tap
  - Cannot exceed 2 active quest limit (enforced)
  - Quest auto-links to stream when accepted
  - Quest suggestions modal with full details
  - Shows suggester name and custom messages
  - Diamond boost amounts displayed prominently
- **Viewer Experience** 👥:
  - Watch other warriors complete their challenges live
  - View quest details with real-time progress
  - Send live comments to support streamers
  - **Send quest challenges** with golden gift button
  - Select from your active quests to share
  - Boost priority with diamonds
  - Add custom challenge messages
  - See viewer count in real-time
  - Smooth interface for joining/leaving streams
- **Integration & Safety** 🔒:
  - Respects 2-quest active limit for streamers
  - Diamond balance shown when sending quests
  - Prevents duplicate quests
  - Quest suggestions persist until responded to
  - Backend validation for all actions

### Coming Soon
- 💬 **Chat Screen**: Full conversation view with message history
- 🎁 **Quest Sharing Modal**: Beautiful UI for selecting and sharing quests
- 🏘️ **Group Detail Screen**: Full group management with member roles
- 👥 **User Search Screen**: Advanced search with filters
- 📍 **Quest Markers**: Show active quests on map with color-coded categories
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
- **OpenAI API**: AI quest generation, Whisper transcription, text summarization
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
- **QuestSuggestion** ✨ NEW!: Quest challenges sent from viewers to streamers
  - Boost amount (diamonds) for priority
  - Status tracking (pending/accepted/declined)
  - Links suggester, quest, and stream
- **Friendship** ✨ NEW!: Friend connections with status (PENDING/ACCEPTED/BLOCKED)
- **Message** ✨ NEW!: Direct messages between users with read tracking
- **Group** ✨ NEW!: Facebook-style groups with privacy settings
- **GroupMember** ✨ NEW!: Group memberships with roles (admin/moderator/member)
- **SharedQuest** ✨ NEW!: Quest sharing between friends with status tracking
- **JournalEntry** ✨ NEW!: Voice-recorded journal entries with AI transcription
  - Audio URL and transcript storage
  - AI-generated summaries with user edit capability
  - Outcome tracking (YES/NO/ACTIVITY)
- **GrowthAchievement** ✨ NEW!: Achievement system for tracking progress
  - Achievement types (gold_star, silver_star, bronze_star)
  - Links to journal entries
  - Automatic generation on journal entry creation

## Design

### Modern 3D UI Theme
The app features a cohesive dark theme with modern 3D-style UI elements throughout all screens:

**Color Palette:**
- 🌑 **Dark Gradients**: `#0A0A0F` → `#1A1A24` → `#2A1A34` (main background)
- 🟣 **Primary Purple**: `#7E3FE4` (buttons, active states, primary actions)
- 🟠 **Vibrant Orange**: `#FF6B35` (accent, warning states)
- 🔵 **Electric Cyan**: `#00D9FF` (info, secondary accent)
- 🟢 **Success Green**: `#4CAF50` (success states, positive actions)
- 🟡 **Gold**: `#FFD700` (rewards, achievements, XP)
- 🔴 **Error Red**: `#FF3B30` (errors, destructive actions)
- ⚪ **Text Colors**:
  - Primary: `#FFFFFF` (white)
  - Secondary: `rgba(255, 255, 255, 0.6)` (60% white)

**3D Card Styling:**
- Card Background: `rgba(255, 255, 255, 0.05)` (5% white overlay)
- Card Borders: `rgba(126, 63, 228, 0.3)` (30% purple border)
- Surface Background: `rgba(255, 255, 255, 0.03)` (3% white for nested elements)
- Shadows: Deep shadows with elevation for depth
- Border Radius: 16px for cards, 12px for buttons
- Smooth gradients on hero sections

**Consistent UI Elements:**
- All cards use semi-transparent backgrounds with purple-tinted borders
- Icon badges with colored backgrounds at 20% opacity
- Progress bars with gradient fills
- Tab switchers with pill-style active states
- Category badges with rounded pills and semi-transparent backgrounds

### Color Palette (Legacy)
- 🟠 Orange/Coral: `#FF6B35` (primary action)
- 🟣 Deep purples: `#7B3FE4`, `#5E1FA8`
- 🔵 Electric blue: `#00D9FF`, `#0099FF`
- ⚫ Dark backgrounds: `#0A0A0F`, `#1A1A24`, `#2A1A34`
- 🟢 Green (success): `#4CAF50`
- 🟡 Gold (rewards): `#FFD700`

### Style
- Modern 3D glassmorphism with semi-transparent card backgrounds
- Smooth spring animations with physics-based transitions
- Category-based color coding with consistent accent colors
- Dark theme optimized with gradient backgrounds throughout
- Cohesive purple-tinted borders and subtle depth effects across all screens

## Project Structure

```
/home/user/workspace/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx           # Quest dashboard
│   │   ├── QuestDetailScreen.tsx    # Quest tracking with clean card UI
│   │   ├── CommunityScreen.tsx      # Community Hub (NEW!)
│   │   ├── MatchesScreen.tsx        # View matches
│   │   ├── ProfileScreen.tsx        # User profile
│   │   ├── EditProfileScreen.tsx    # Edit profile
│   │   ├── LiveScreen.tsx           # Live streaming
│   │   ├── MapScreen.tsx            # Map with location
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
│   │   │   ├── quests.ts
│   │   │   ├── stats.ts
│   │   │   ├── live.ts
│   │   │   ├── friends.ts      # NEW!
│   │   │   ├── messages.ts     # NEW!
│   │   │   ├── groups.ts       # NEW!
│   │   │   └── sharedQuests.ts # NEW!
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
- `GET /api/stats/leaderboard` - Get leaderboard rankings

### Live Streaming ✨ NEW!
- `POST /api/live/start` - Start a live stream
- `POST /api/live/:id/end` - End a live stream
- `GET /api/live/active` - Get all active live streams
- `POST /api/live/:id/comment` - Add comment to stream
- `GET /api/live/:id/comments` - Get stream comments
- `POST /api/live/:id/suggest-quest` - Suggest quest to streamer (with boost)
- `GET /api/live/:id/quest-suggestions` - Get pending quest suggestions
- `POST /api/live/:id/respond-to-suggestion` - Accept or decline quest

### Friends ✨ NEW!
- `GET /api/friends` - Get accepted friends list
- `GET /api/friends/requests` - Get pending friend requests
- `GET /api/friends/search?query=` - Search for users by name or email
- `POST /api/friends/request` - Send friend request to a user
- `POST /api/friends/accept/:id` - Accept friend request
- `POST /api/friends/decline/:id` - Decline friend request
- `DELETE /api/friends/:userId` - Remove a friend

### Messages ✨ NEW!
- `GET /api/messages/conversations` - Get all conversations with unread counts
- `GET /api/messages/:userId` - Get messages with specific user (marks as read)
- `POST /api/messages/send` - Send a message to a user
- `DELETE /api/messages/:messageId` - Delete your own message

### Groups ✨ NEW!
- `GET /api/groups` - Get user's groups and discover public groups
- `GET /api/groups/:groupId` - Get group details with members
- `POST /api/groups/create` - Create a new group
- `POST /api/groups/:groupId/join` - Join a public group
- `POST /api/groups/:groupId/leave` - Leave a group
- `DELETE /api/groups/:groupId` - Delete a group (creator only)

### Shared Quests ✨ NEW!
- `GET /api/shared-quests` - Get received quest shares
- `POST /api/shared-quests/share` - Share a quest with a friend
- `POST /api/shared-quests/:id/accept` - Accept shared quest
- `POST /api/shared-quests/:id/decline` - Decline shared quest

### Journal ✨ NEW!
- `POST /api/journal/transcribe` - Transcribe audio to text with AI summarization
- `POST /api/journal` - Create journal entry with achievement
- `GET /api/journal` - Get all journal entries with achievements
- `PUT /api/journal/:id` - Update journal entry summary
- `GET /api/journal/achievements` - Get all growth achievements with stats

### Posts & Social Feed ✨ NEW!
- `GET /api/posts/feed` - Get privacy-filtered feed of posts (PUBLIC, FRIENDS, GROUPS)
- `POST /api/posts` - Create new post with images and privacy settings
- `POST /api/posts/:id/like` - Like a post
- `DELETE /api/posts/:id/like` - Unlike a post
- `POST /api/posts/:id/comments` - Add comment to post
- `DELETE /api/posts/:id` - Delete your own post

### Moments (Stories) ✨ NEW!
- `GET /api/moments` - Get active moments (24-hour stories) grouped by user
- `POST /api/moments` - Create new moment (auto-expires in 24 hours)
- `DELETE /api/moments/:id` - Delete your own moment

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
