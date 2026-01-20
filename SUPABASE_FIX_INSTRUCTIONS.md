
# 🔧 How to Fix the "Invalid API Key" Error

## The Problem

You're seeing an "Invalid API key" error because the Supabase configuration is using a **publishable key** instead of an **anon key**.

The key you provided (`sb_publishable_RUWKIsGyWOyZj6J0rdetqw__RpvSDU0`) is a **publishable key**, but Supabase requires the **anon key** for authentication.

## The Solution

Follow these steps to get the correct Supabase anon key:

### Step 1: Go to Your Supabase Dashboard

Open this URL in your browser:
```
https://app.supabase.com/project/bbtvdhdfzkyhrodgclkd/settings/api
```

### Step 2: Find the Correct Keys

On the API settings page, you'll see several keys:

- ✅ **Project URL**: `https://bbtvdhdfzkyhrodgclkd.supabase.co` (you already have this correct!)
- ✅ **anon/public key**: This is what you need! It starts with `eyJ...` and is a long JWT token
- ❌ **service_role key**: Don't use this (it's for server-side only)
- ❌ **publishable key**: This is what you provided, but it's NOT the right one

### Step 3: Copy the Anon Key

1. Look for the section labeled **"anon" key** or **"anon/public" key**
2. Click the copy button next to it
3. The key should look like this:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJidHZkaGRmemt5aHJvZGdjbGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxNTI0MDAsImV4cCI6MjA1MjcyODQwMH0.SOME_SIGNATURE_HERE
   ```
   (Note: The third part after the second dot should be a hash, NOT `sb_publishable_...`)

### Step 4: Update Your .env File

Open the `.env` file in the root of your project and update this line:

```env
EXPO_PUBLIC_SUPABASE_ANON_KEY=<paste-your-anon-key-here>
```

Replace `<paste-your-anon-key-here>` with the actual anon key you copied.

### Step 5: Restart the Expo Dev Server

1. Stop the current Expo dev server (press Ctrl+C in the terminal)
2. Start it again with:
   ```bash
   npm run dev
   ```

### Step 6: Test the Login

Try logging in again with:
- Email: `hitdaj@gmail.com`
- Password: `joshua88`

The error should now be fixed! 🎉

## What's the Difference?

- **Anon Key**: A JWT token that allows client-side authentication. This is what Supabase expects.
- **Publishable Key**: A different type of key used for some Supabase features, but NOT for authentication.

The anon key is safe to use in your frontend code because it only allows operations that are permitted by your Supabase Row Level Security (RLS) policies.

## Still Having Issues?

If you're still seeing errors after following these steps:

1. Make sure you copied the entire anon key (it's very long!)
2. Make sure there are no extra spaces before or after the key in the .env file
3. Make sure you restarted the Expo dev server
4. Check that your Supabase project is active and not paused

## Need More Help?

Check the Supabase documentation:
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [API Keys Documentation](https://supabase.com/docs/guides/api/api-keys)
