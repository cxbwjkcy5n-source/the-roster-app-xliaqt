
# 🚀 Quick Start - Supabase Integration

## What You Need to Do

### 1. Create Supabase Account
- Go to [supabase.com](https://supabase.com)
- Create a new project called "THE ROSTER"
- Wait 2 minutes for it to initialize

### 2. Get Your Credentials
In Supabase dashboard → **Project Settings** → **API**:
- Copy **Project URL**
- Copy **anon public key**
- Copy **JWT Secret** (under JWT Settings)

### 3. Update app.json
Replace these lines in `app.json`:
```json
"supabaseUrl": "YOUR_SUPABASE_PROJECT_URL",
"supabaseAnonKey": "YOUR_SUPABASE_ANON_KEY"
```

With your actual values from Step 2.

### 4. Configure Backend
Set environment variable:
```
SUPABASE_JWT_SECRET=your_jwt_secret_from_step_2
```

### 5. Restart App
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 6. Test Login
- Try signing up with email/password
- Try logging in
- Your login issues should be fixed! ✅

## Need OAuth?
See `SUPABASE_SETUP.md` for Google/Apple OAuth setup instructions.

## Still Having Issues?
1. Check console logs for error messages
2. Verify credentials in `app.json` are correct
3. Make sure backend build completed
4. See `SUPABASE_INTEGRATION_COMPLETE.md` for troubleshooting

---

**That's it! Your app now uses Supabase for authentication. 🎉**
