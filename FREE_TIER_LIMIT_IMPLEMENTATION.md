# Free Tier Limit Implementation - 10 Custom Quests

**Status**: ✅ **IMPLEMENTED** (2025-11-19)

## Overview

Free users can now create up to 10 custom quests. After reaching 10 quests, they must upgrade to premium for unlimited custom quests.

## Files Modified

### 1. Backend Route (`/backend/src/routes/sharedQuests.ts`)
- **Lines 589-633**: Added free tier validation check
- **Logic**:
  - Checks if user is admin (admins bypass all limits)
  - Checks user's subscription status
  - If not premium, counts custom quests:
    - Personal quests: `UserQuest where userId AND quest.isAIGenerated = true`
    - Shared quests: `SharedQuest where senderId AND isCustomQuest = true`
  - Returns 403 with `requiresPremium: true` when limit reached
- **Database Queries**:
  - `db.user.findUnique()` - Check admin status
  - `db.subscription.findUnique()` - Check subscription status
  - `db.userQuest.count()` - Count personal custom quests
  - `db.sharedQuest.count()` - Count shared custom quests

### 2. Frontend Response Handler (`/src/screens/CreateCustomQuestScreen.tsx`)
- **Lines 148-168**: Added premium tier response handling
- **User Experience**:
  - Shows "Free Tier Limit Reached 🔒" alert
  - Displays current quest count
  - Offers "Upgrade to Premium" button
  - Falls back to existing error handling for other errors

### 3. Shared Contracts (`/shared/contracts.ts`)
- **Lines 1368-1371**: Added optional premium response fields
- **New Fields**:
  - `requiresPremium: boolean` - Flag indicating premium upgrade needed
  - `currentCustomQuests: number` - Total custom quests created
  - `limit: number` - Current limit (10)

## How It Works

### User Flows

#### Flow 1: Free User Creating Quests (Successful)
1. User creates quest 1-10 → ✅ Success
2. Quest appears in active list
3. Navigation to quest detail successful

#### Flow 2: Free User at Limit (Blocked)
1. User has 10 custom quests
2. Attempts to create quest 11
3. Backend checks subscription → Not premium
4. Returns 403: `requiresPremium: true`
5. Frontend shows premium upgrade alert
6. User can choose to upgrade

#### Flow 3: Premium User (Unlimited)
1. User has active subscription (`Subscription.status = "active"`)
2. Can create unlimited custom quests
3. No limit checking applied

#### Flow 4: Admin User (Unlimited)
1. User has `isAdmin: true`
2. Bypasses all free tier checks
3. No limit applied

## Database Behavior

### Counting Logic
```sql
-- Personal quests
SELECT COUNT(*) FROM user_quest
WHERE userId = ? AND questId IN (
  SELECT id FROM quest WHERE isAIGenerated = true
)

-- Shared quests
SELECT COUNT(*) FROM shared_quest
WHERE senderId = ? AND isCustomQuest = true
```

### Subscription Check
```sql
SELECT status FROM subscription
WHERE userId = ?
-- Status values: "active", "inactive", "canceled", "past_due", "trialing"
```

## Response Examples

### Success (Free User, Under Limit)
```json
{
  "success": true,
  "userQuestId": "cuid_123",
  "message": "Personal custom quest created successfully!",
  "isSafe": true
}
```

### Blocked (Free User, At Limit)
```json
{
  "success": false,
  "message": "You've reached your free tier limit of 10 custom quests. Upgrade to premium to create unlimited custom quests!",
  "requiresPremium": true,
  "currentCustomQuests": 10,
  "limit": 10
}
```

### Success (Premium User)
```json
{
  "success": true,
  "userQuestId": "cuid_456",
  "message": "Personal custom quest created successfully!",
  "isSafe": true
}
```

## Testing Guide

### Test 1: Free User Creates 10 Quests
1. Sign up with new account
2. Create 10 personal custom quests
3. Verify each succeeds and shows in Active Quests
4. Verify quest count displayed correctly

### Test 2: Free User Hits Limit
1. Create quest 10 (should succeed)
2. Attempt to create quest 11
3. Verify "Free Tier Limit Reached 🔒" alert appears
4. Verify shows "10 custom quests" created
5. Verify "Upgrade to Premium" button appears

### Test 3: Premium User Unlimited
1. Create premium subscription in database
2. Set `Subscription.status = "active"` for user
3. Create 11+ custom quests
4. Verify all succeed (no limit)

### Test 4: Admin Bypass
1. Set `User.isAdmin = true`
2. Create 11+ custom quests
3. Verify all succeed (bypass limit)

### Test 5: Shared Quests Count
1. Create shared quests with friends
2. Create personal quests
3. Verify total count = personal + shared
4. Verify limit applies to combined total

## Future Enhancements

1. **Premium Subscription Screen**: Implement navigation to premium upgrade page
2. **Trial Period**: Add 14-day free trial before 10-quest limit
3. **Tier Display**: Show quest count on Create Quest screen (e.g., "3/10 quests used")
4. **Progress Bar**: Visual indicator of quest limit progress
5. **Monthly Reset**: Option for monthly free tier renewal
6. **Team Limits**: Different limits for different team tiers

## Notes

- The 10-quest limit counts **both** personal and shared custom quests
- Only AI-generated quests count toward the limit
- Admin users and premium subscribers have no limits
- Future: Can add analytics to track premium conversion rate

