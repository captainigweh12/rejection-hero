# Environment Setup Guide

## Required Environment Variables

Add these to the **ENV tab** in Vibecode app:

### Google OAuth (Authentication)
```
GOOGLE_CLIENT_ID=971632613679-a4smd8ok9p1ue2jvajhcbvt0510cvb60.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_ANDROID_CLIENT_ID=971632613679-i2dq1sh9j0547e4l7b44ks2j8c3ti7bc.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=971632613679-6rm6jgjf0qcpnsi539uldbvrnn3l6fko.apps.googleusercontent.com
```

### OpenAI (Quest Generation)
```
OPENAI_API_KEY=your-openai-key-here
```

### Resend (Email)
```
RESEND_API_KEY=re_8NoeRnFF_PyYgE55LwbtHnUmC3TJ3CkD5
```

### Perplexity AI (Optional)
```
PERPLEXITY_API_KEY=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
```

### Google Maps
```
GOOGLE_MAPS_API_KEY=AIzaSyCHMHlOrPPSRULrUf-FqPWHz0Y6PJoPrRk
```

### Supabase (Optional - for production database)
```
DATABASE_URL=postgresql://user:password@host:port/database
DATABASE_PROVIDER=postgresql
```

## Frontend Environment Variables

Add these with `EXPO_PUBLIC_` prefix:

```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCHMHlOrPPSRULrUf-FqPWHz0Y6PJoPrRk
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=971632613679-a4smd8ok9p1ue2jvajhcbvt0510cvb60.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=971632613679-i2dq1sh9j0547e4l7b44ks2j8c3ti7bc.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=971632613679-6rm6jgjf0qcpnsi539uldbvrnn3l6fko.apps.googleusercontent.com
```

## Setup Steps

1. **Add Environment Variables**
   - Go to ENV tab in Vibecode
   - Add all variables listed above
   - Restart the app to load new variables

2. **Test Google OAuth**
   - Tap "Sign in with Google" button
   - Follow OAuth flow
   - Should redirect back to app after authentication

3. **Enable Supabase (Optional)**
   - Create Supabase project
   - Get connection string
   - Add `DATABASE_URL` and set `DATABASE_PROVIDER=postgresql`
   - Run migrations: `bunx prisma migrate deploy`

## Troubleshooting

- **Google OAuth not working**: Check that redirect URI is added in Google Console
- **Database errors**: Ensure DATABASE_URL is correct
- **Quest generation failing**: Add OPENAI_API_KEY
- **Maps not loading**: Verify GOOGLE_MAPS_API_KEY is valid
