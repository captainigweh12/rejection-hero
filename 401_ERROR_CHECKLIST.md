# 401 Error Prevention - Implementation Checklist

## For App Developers

Use this checklist when implementing authenticated features to prevent 401 errors.

### ✅ Before Writing API Code

- [ ] Feature requires user authentication?
  - YES → Use `useSafeQuery` with `requireAuth: true`
  - NO → Use `useSafeQuery` with `requireAuth: false`

### ✅ Implementation Checklist

#### 1. Import the Safe Query Hook
```typescript
import { useSafeQuery } from "@/lib/useSafeQuery";
```

#### 2. Use useSafeQuery Instead of useQuery
```typescript
// ❌ Don't do this
const { data } = useQuery({
  queryKey: ["profile"],
  queryFn: () => api.get("/api/profile"),
});

// ✅ Do this instead
const { data } = useSafeQuery({
  queryKey: ["profile"],
  queryFn: () => api.get("/api/profile"),
  requireAuth: true, // ← Add this
});
```

#### 3. Add Authentication Guard to Conditional Rendering
```typescript
import { useAuthGuard } from "@/lib/apiGuards";

function MyComponent() {
  const { canMakeRequest } = useAuthGuard();

  if (!canMakeRequest) {
    return <LoginPrompt />;
  }

  // Safe to use authenticated content
  return <FeatureContent />;
}
```

#### 4. For Optional Auth Features
```typescript
const { canMakeRequest } = useAuthGuard();
const { isAuthenticated } = useIsAuthenticated();

return (
  <View>
    {isAuthenticated && <AuthenticatedFeature />}
    <PublicContent />
  </View>
);
```

### ✅ Testing Your Code

- [ ] With user logged in:
  - [ ] Query runs
  - [ ] Data loads
  - [ ] No 401 errors

- [ ] With user logged out:
  - [ ] Query disabled
  - [ ] No 401 errors
  - [ ] Fallback UI shown (if implemented)

- [ ] After logout:
  - [ ] All cached queries cleared
  - [ ] Session cleared
  - [ ] Redirected to login

### ✅ Code Review

Before submitting code, verify:

- [ ] All queries use `useSafeQuery` (not `useQuery`)
- [ ] `requireAuth: true` set for protected endpoints
- [ ] `requireAuth: false` set for public endpoints
- [ ] Auth guards used for conditional rendering
- [ ] No hardcoded `enabled` conditions that ignore auth
- [ ] Error handling for network errors (not just auth)

### ✅ Common Mistakes to Avoid

❌ **Mistake 1**: Using `useQuery` instead of `useSafeQuery`
```typescript
// Wrong
const { data } = useQuery({
  queryKey: ["profile"],
  queryFn: () => api.get("/api/profile"),
});
```
✅ **Fix**: Use `useSafeQuery` instead

---

❌ **Mistake 2**: Forgetting `requireAuth` parameter
```typescript
// Wrong
const { data } = useSafeQuery({
  queryKey: ["profile"],
  queryFn: () => api.get("/api/profile"),
  // Missing requireAuth!
});
```
✅ **Fix**: Always set `requireAuth: true` or `false`

---

❌ **Mistake 3**: Not checking auth before rendering
```typescript
// Wrong
function SecretFeature() {
  const { data } = useSafeQuery({
    queryKey: ["secret"],
    queryFn: () => api.get("/api/secret"),
    requireAuth: true,
  });

  // Shows loading, not login prompt
  if (!data) return <Text>Loading...</Text>;

  return <View>{data}</View>;
}
```
✅ **Fix**: Guard with `useAuthGuard()`
```typescript
function SecretFeature() {
  const { canMakeRequest } = useAuthGuard();

  if (!canMakeRequest) {
    return <LoginPrompt />;
  }

  const { data } = useSafeQuery({
    queryKey: ["secret"],
    queryFn: () => api.get("/api/secret"),
    requireAuth: true,
  });

  if (!data) return <Text>Loading...</Text>;

  return <View>{data}</View>;
}
```

---

❌ **Mistake 4**: Complex `enabled` conditions
```typescript
// Wrong - may enable when not authenticated
const { data } = useSafeQuery({
  queryKey: ["data"],
  queryFn: () => api.get("/api/data"),
  enabled: streamId && isLive && someCondition,
  requireAuth: true,
});
```
✅ **Fix**: `useSafeQuery` handles auth automatically
```typescript
// Right - auth is handled, add your conditions
const { data } = useSafeQuery({
  queryKey: ["data"],
  queryFn: () => api.get("/api/data"),
  enabled: streamId && isLive && someCondition,
  requireAuth: true,
});
```

### ✅ Quick Reference

| Scenario | Hook | Code |
|----------|------|------|
| Authenticated data | `useSafeQuery` | `requireAuth: true` |
| Public data | `useSafeQuery` | `requireAuth: false` |
| Check if logged in | `useIsAuthenticated` | `.isAuthenticated` |
| Guard feature access | `useAuthGuard` | `.canMakeRequest` |
| Old useQuery | Change to | `useSafeQuery` |

### ✅ Resources

- **Full Guide**: See `/AUTH_BEST_PRACTICES.md`
- **Summary**: See `/401_ERROR_FIX_SUMMARY.md`
- **Code Examples**: See this file below

### ✅ Example: Complete Protected Component

```typescript
import { useAuthGuard, useIsAuthenticated } from "@/lib/apiGuards";
import { useSafeQuery } from "@/lib/useSafeQuery";
import { View, Text, ActivityIndicator } from "react-native";

function ProfileScreen() {
  const { canMakeRequest, isAuthenticated } = useAuthGuard();
  const { user } = useIsAuthenticated();

  // This query won't run if user is not authenticated
  const { data: profile, isLoading } = useSafeQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      return api.get("/api/profile");
    },
    requireAuth: true, // ← Prevents 401
  });

  // Show login prompt if not authenticated
  if (!canMakeRequest) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text>Please log in to view your profile</Text>
        <Button title="Sign In" onPress={() => navigation.navigate("Login")} />
      </View>
    );
  }

  // Show loading state while fetching
  if (isLoading) {
    return <ActivityIndicator />;
  }

  // Show profile data
  return (
    <View>
      <Text>Welcome, {profile?.displayName}!</Text>
      <Text>Email: {user?.email}</Text>
      <Text>Age: {profile?.age}</Text>
    </View>
  );
}
```

### ✅ When to Use What

#### Use `useSafeQuery` with `requireAuth: true`
- Profile endpoint
- Personal data
- Protected resources
- Anything that requires login

**Example**:
```typescript
const { data } = useSafeQuery({
  queryKey: ["profile"],
  queryFn: () => api.get("/api/profile"),
  requireAuth: true,
});
```

#### Use `useSafeQuery` with `requireAuth: false`
- Public streams list
- Public user profiles
- Public content
- Anything accessible without login

**Example**:
```typescript
const { data } = useSafeQuery({
  queryKey: ["publicStreams"],
  queryFn: () => api.get("/api/live/active"),
  requireAuth: false,
});
```

#### Use `useAuthGuard()` for conditional UI
- Show/hide features based on login
- Gate premium features
- Show different content for auth vs non-auth users

**Example**:
```typescript
const { canMakeRequest } = useAuthGuard();

return (
  <View>
    {canMakeRequest ? <PremiumFeature /> : <LoginPrompt />}
  </View>
);
```

### ✅ Debugging 401 Errors

If you still see 401 errors:

1. **Check the endpoint**: Is it using `requireAuth: true`?
2. **Check the guard**: Is the component using `useAuthGuard()`?
3. **Check the logs**: Look for "Auth Middleware" in backend logs
4. **Check the session**: Is the user actually logged in?
5. **Check the query**: Is it enabled when it shouldn't be?

### ✅ Getting Help

1. Read `/AUTH_BEST_PRACTICES.md` for detailed examples
2. Read `/401_ERROR_FIX_SUMMARY.md` for architecture overview
3. Check existing components for patterns (e.g., `ParentalGuidanceSettingsScreen.tsx`)
4. Search for `useSafeQuery` usage in codebase

---

**Last Updated**: 2025-11-19
**Status**: All 401 errors permanently fixed with 3-layer protection system
