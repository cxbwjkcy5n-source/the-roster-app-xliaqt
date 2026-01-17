
# Supabase Setup Guide for THE ROSTER

This guide will help you set up Supabase authentication for your app.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up or log in
2. Click "New Project"
3. Fill in the project details:
   - **Name**: THE ROSTER
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
4. Click "Create new project" and wait for it to initialize (takes ~2 minutes)

## Step 2: Get Your Supabase Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon in the sidebar)
2. Click on **API** in the left menu
3. You'll see two important values:
   - **Project URL**: This is your `SUPABASE_URL`
   - **anon public key**: This is your `SUPABASE_ANON_KEY`
4. Also note the **JWT Secret** under the JWT Settings section - you'll need this for the backend

## Step 3: Configure OAuth Providers (Optional)

### Google OAuth:
1. In Supabase, go to **Authentication** → **Providers**
2. Find **Google** and click to expand
3. Enable Google provider
4. Follow the instructions to create OAuth credentials in Google Cloud Console
5. Add the credentials to Supabase

### Apple OAuth:
1. In Supabase, go to **Authentication** → **Providers**
2. Find **Apple** and click to expand
3. Enable Apple provider
4. Follow the instructions to set up Sign in with Apple
5. Add the credentials to Supabase

## Step 4: Configure Redirect URLs

In Supabase, go to **Authentication** → **URL Configuration**:

Add these redirect URLs:
- `http://localhost:8081/auth-callback` (for local development)
- `theroster://auth-callback` (for mobile app)
- Your production web URL + `/auth-callback` (when you deploy)

## Step 5: Update app.json

Add your Supabase credentials to `app.json`:

```json
{
  "expo": {
    "extra": {
      "backendUrl": "YOUR_BACKEND_URL",
      "supabaseUrl": "YOUR_SUPABASE_PROJECT_URL",
      "supabaseAnonKey": "YOUR_SUPABASE_ANON_KEY"
    }
  }
}
```

Replace:
- `YOUR_SUPABASE_PROJECT_URL` with your Project URL from Step 2
- `YOUR_SUPABASE_ANON_KEY` with your anon public key from Step 2

## Step 6: Configure Backend

Set the `SUPABASE_JWT_SECRET` environment variable in your backend:

The JWT secret is found in Supabase under **Project Settings** → **API** → **JWT Settings** → **JWT Secret**

## Step 7: Enable Email Authentication

In Supabase, go to **Authentication** → **Providers**:

1. Make sure **Email** is enabled
2. Configure email templates if desired (optional)
3. You can disable email confirmation for development by going to **Authentication** → **Policies** and toggling "Enable email confirmations"

## Step 8: Test Your Setup

1. Restart your Expo development server
2. Try signing up with a new email and password
3. Try signing in with the credentials you just created
4. If you configured OAuth, try signing in with Google or Apple

## Troubleshooting

### "Supabase is not configured" error
- Make sure you've added `supabaseUrl` and `supabaseAnonKey` to `app.json` under `extra`
- Restart your Expo development server after updating `app.json`

### OAuth not working
- Check that redirect URLs are correctly configured in Supabase
- Make sure OAuth providers are enabled and credentials are correct
- Check the browser console for error messages

### Email confirmation required
- If you don't want email confirmation during development, disable it in Supabase settings
- For production, keep email confirmation enabled for security

## Benefits of Supabase

✅ **Reliable Authentication**: Battle-tested auth system used by thousands of apps
✅ **Built-in Database**: PostgreSQL database included
✅ **Real-time Subscriptions**: Listen to database changes in real-time
✅ **Row Level Security**: Secure your data at the database level
✅ **Storage**: Built-in file storage for user uploads
✅ **Edge Functions**: Serverless functions for custom logic
✅ **Free Tier**: Generous free tier for development and small apps

## Next Steps

Once Supabase is configured, your login issues should be resolved! The app now uses Supabase for:
- Email/password authentication
- Google OAuth (if configured)
- Apple OAuth (if configured)
- Session management
- Token refresh

All your existing backend endpoints will continue to work, now accepting Supabase JWT tokens.
