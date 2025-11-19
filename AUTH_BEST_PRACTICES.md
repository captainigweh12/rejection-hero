# Authentication & API Error Prevention Guide

## Overview

This guide explains how to prevent 401 unauthorized errors and implement proper authentication throughout the app.

## 3-Layer Authentication System

The app now has 3 layers of protection against 401 errors:

### Layer 1: Query-Level Guard (useSafeQuery)
Prevents queries from running when user is not authenticated.

```typescript
import { useSafeQuery } from "@/lib/useSafeQuery";

// Profile will only fetch when user is authenticated
const { data: profile } = useSafeQuery<ProfileResponse>({
  queryKey: ["profile"],
  queryFn: () => api.get("/api/profile"),
  requireAuth: true, // Default - only runs when authenticated
});

// Public data can be fetched without auth (e.g., active streams)
const { data: streams } = useSafeQuery<StreamsResponse>({
  queryKey: ["streams"],
  queryFn: () => api.get("/api/live/active"),
  requireAuth: false, // Allow unauthenticated access
});
```

### Layer 2: Component-Level Check (useAuthGuard)
Guard specific features or sections of components.

```typescript
import { useAuthGuard } from "@/lib/apiGuards";

function MyComponent() {
  const { canMakeRequest, isAuthenticated } = useAuthGuard();

  if (!canMakeRequest) {
    return <Text>Please log in to access this feature</Text>;
  }

  // Safe to make authenticated requests here
  return <View>{/* content */}</View>;
}
```

### Layer 3: Global Error Handler (setupAPIErrorInterceptor)
Automatically handles 401 errors app-wide.

- Clears user session on 401
- Clears all cached queries
- Signs user out and redirects to login
- Prevents retry on 401 (fail fast)
- Configured on app startup

## Best Practices

### 1. Always Use useSafeQuery for Authenticated Endpoints

**❌ WRONG - Can cause 401 errors:**
```typescript
const { data } = useQuery({
  queryKey: ["profile"],
  queryFn: () => api.get("/api/profile"),
  // No auth check - will 401 if user logs out between renders
});
```

**✅ CORRECT - Protected from 401:**
```typescript
import { useSafeQuery } from "@/lib/useSafeQuery";

const { data } = useSafeQuery({
  queryKey: ["profile"],
  queryFn: () => api.get("/api/profile"),
  requireAuth: true,
});
```

### 2. Disable Queries for Unauthenticated Data

**❌ WRONG - Causes 401 when streaming:**
```typescript
const { data: suggestions } = useQuery({
  queryKey: ["suggestions", streamId],
  queryFn: () => api.get(`/api/live/${streamId}/suggestions`),
  enabled: !!streamId && isStreaming,
  // No auth check - will 401 if user not authenticated
});
```

**✅ CORRECT - Guards with authentication:**
```typescript
const { data: suggestions } = useSafeQuery({
  queryKey: ["suggestions", streamId],
  queryFn: () => api.get(`/api/live/${streamId}/suggestions`),
  enabled: !!streamId && isStreaming,
  requireAuth: true,
});
```

### 3. Check Auth Before Features

**❌ WRONG - Attempts to fetch without checking auth:**
```typescript
function LiveScreen() {
  const { data: suggestions } = useQuery({
    queryKey: ["suggestions"],
    queryFn: () => api.get("/api/live/suggestions"),
  });

  return <View>{/* may show 401 error */}</View>;
}
```

**✅ CORRECT - Checks auth first:**
```typescript
import { useAuthGuard } from "@/lib/apiGuards";

function LiveScreen() {
  const { canMakeRequest } = useAuthGuard();

  const { data: suggestions } = useSafeQuery({
    queryKey: ["suggestions"],
    queryFn: () => api.get("/api/live/suggestions"),
    requireAuth: true,
  });

  if (!canMakeRequest) {
    return <Text>Please log in</Text>;
  }

  return <View>{/* Safe to render authenticated content */}</View>;
}
```

### 4. Use Session Data to Guard Queries

**❌ WRONG - No auth dependency:**
```typescript
const { data } = useQuery({
  queryKey: ["profile"],
  queryFn: () => api.get("/api/profile"),
});
```

**✅ CORRECT - Respects session changes:**
```typescript
import { useSafeQuery } from "@/lib/useSafeQuery";

const { data } = useSafeQuery({
  queryKey: ["profile"],
  queryFn: () => api.get("/api/profile"),
  // Automatically watches session and disables query when user logs out
});
```

## Common Patterns

### Protected Routes
```typescript
import { useAuthGuard } from "@/lib/apiGuards";

function ProtectedScreen() {
  const { canMakeRequest } = useAuthGuard();

  if (!canMakeRequest) {
    return (
      <View>
        <Text>You must be logged in to access this</Text>
        <Button title="Sign In" onPress={() => navigation.navigate("Login")} />
      </View>
    );
  }

  return <View>{/* Protected content */}</View>;
}
```

### Conditional Features
```typescript
import { useIsAuthenticated } from "@/lib/apiGuards";

function ConditionalFeature() {
  const { isAuthenticated, isLoading } = useIsAuthenticated();

  if (isLoading) return <ActivityIndicator />;

  return (
    <View>
      {isAuthenticated ? (
        <FeatureContent />
      ) : (
        <Text>Feature requires login</Text>
      )}
    </View>
  );
}
```

### Public + Private Data
```typescript
import { useSafeQuery } from "@/lib/useSafeQuery";

function StreamViewScreen({ streamId }) {
  // Public - no auth required
  const { data: stream } = useSafeQuery({
    queryKey: ["stream", streamId],
    queryFn: () => api.get(`/api/live/${streamId}`),
    requireAuth: false,
  });

  // Private - auth required
  const { data: myStats } = useSafeQuery({
    queryKey: ["myStats"],
    queryFn: () => api.get("/api/stats"),
    requireAuth: true,
  });

  return <View>{/* Render both safely */}</View>;
}
```

## What Happens on 401

1. **Query fails with 401**
   ↓
2. **Global interceptor catches it**
   ↓
3. **Clears all queries and cache**
   ↓
4. **Signs out user**
   ↓
5. **Redirects to login screen**
   ↓
6. **User can log back in with clean state**

## Migration Guide

If you have existing queries that aren't protected:

### Step 1: Change useQuery to useSafeQuery
```typescript
// Before
import { useQuery } from "@tanstack/react-query";
const { data } = useQuery({ ... });

// After
import { useSafeQuery } from "@/lib/useSafeQuery";
const { data } = useSafeQuery({ ... });
```

### Step 2: Add requireAuth parameter
```typescript
const { data } = useSafeQuery({
  queryKey: ["profile"],
  queryFn: () => api.get("/api/profile"),
  requireAuth: true, // Add this
});
```

### Step 3: Keep enabled conditions
```typescript
const { data } = useSafeQuery({
  queryKey: ["suggestions", streamId],
  queryFn: () => api.get(`/api/live/${streamId}/suggestions`),
  enabled: !!streamId && isStreaming, // Keep your conditions
  requireAuth: true, // Add this
});
```

## Testing

### Test 1: Verify auth-guarded queries don't run
1. Log out
2. Navigate to a protected screen
3. Check network tab - no 401 errors
4. Verify queries are disabled

### Test 2: Verify 401 redirects to login
1. Manually call an authenticated endpoint without session
2. Should automatically redirect to login
3. Should clear all cache
4. Should show login screen

### Test 3: Verify public queries work
1. Log out
2. Navigate to public screens (e.g., active streams)
3. Data should load without 401 errors
4. Verify requireAuth: false works

## Summary

- **useSafeQuery**: Use for ALL authenticated endpoints
- **useAuthGuard**: Use to conditionally render features
- **useIsAuthenticated**: Use to check auth status
- **Global Interceptor**: Handles all 401s automatically
- **Result**: No more 401 unauthorized errors!
