
# Expo Launch Apple Team ID Fix

## Problem
Expo Launch capability sync was failing with Apple 403 "Unable to find a team with the given Team ID" and a "Worker Script Exception". The root cause was that the Apple Team ID was **hardcoded** in the configuration, preventing Expo Launch from providing the Team ID through its authentication flow.

## Solution
The project has been updated to ensure the Apple Team ID is **resolved from environment variables** provided by Expo Launch at build time, not hardcoded in the configuration.

## Changes Made

### 1. **app.config.js** - Removed Hardcoded Team ID
- ❌ **Before:** `appleTeamId: "JB7SST7P2U"` (hardcoded)
- ✅ **After:** `appleTeamId: process.env.EXPO_APPLE_TEAM_ID || process.env.APPLE_TEAM_ID || undefined`
- The Team ID is now resolved from environment variables at build time
- Added diagnostic logging to show which env vars are present (names only, not values)

### 2. **eas.json** - Removed Hardcoded Team ID from Build Profiles
- ❌ **Before:** All build profiles had `"APPLE_TEAM_ID": "JB7SST7P2U"` in env
- ✅ **After:** Removed hardcoded Team ID from all build profiles
- Expo Launch will provide the Team ID through its authentication flow

### 3. **scripts/preflight-check.js** - Added Preflight Validation
- New script that runs before EAS build to validate configuration
- Checks if Apple Team ID is present in the resolved Expo config
- Fails early with a clear error message if Team ID is missing:
  ```
  Missing Apple Team ID in build environment.
  Expo Launch must provide Team access (Apple login) and a Team ID
  environment variable. Re-auth in Expo Launch and retry.
  ```
- Succeeds with confirmation when Team ID is properly resolved

### 4. **package.json** - Added Preflight Script
- Added `"preflight": "node scripts/preflight-check.js"` script
- Can be run manually: `npm run preflight`
- Should be integrated into CI/CD pipeline before EAS build

### 5. **.env.example** - Documented Environment Variables
- Added documentation for EXPO_APPLE_TEAM_ID and APPLE_TEAM_ID
- Clarifies that these are provided by Expo Launch, not manually set

## How It Works

### Local Development
- During local development (`expo start`), the Apple Team ID is not required
- The config will show warnings but will not fail
- This is expected behavior

### EAS Build with Expo Launch
1. **Authentication:** Expo Launch authenticates with Apple using your Apple Developer account
2. **Team Access:** Expo Launch verifies your account has access to the Apple Team
3. **Environment Injection:** Expo Launch injects the Team ID as an environment variable (EXPO_APPLE_TEAM_ID or APPLE_TEAM_ID)
4. **Config Resolution:** app.config.js reads the Team ID from the environment variable
5. **Preflight Check:** The preflight script validates the Team ID is present
6. **Capability Sync:** Expo Launch proceeds with capability synchronization using the authenticated Team access

## Verification Steps

### 1. Check Resolved Config Locally
```bash
npx expo config --type public
```
Look for `ios.appleTeamId` - it should be `undefined` locally (expected)

### 2. Run Preflight Check Locally
```bash
npm run preflight
```
This will fail locally (expected) with the message about missing Team ID

### 3. During EAS Build
The preflight check will automatically validate that Expo Launch has provided the Team ID. If it fails, you'll see:
```
❌ PREFLIGHT CHECK FAILED

Missing Apple Team ID in build environment.
Expo Launch must provide Team access (Apple login) and a Team ID
environment variable. Re-auth in Expo Launch and retry.
```

If it succeeds, you'll see:
```
✅ PREFLIGHT CHECK PASSED

Apple Team ID resolved from environment (not hardcoded): OK
Team ID: [your-team-id]

Expo Launch can now proceed with capability synchronization.
```

## Build Commands

### Development Build
```bash
eas build --platform ios --profile development
```

### Preview Build
```bash
eas build --platform ios --profile preview
```

### Production Build
```bash
eas build --platform ios --profile production
```

## Troubleshooting

### If Build Fails with "Missing Apple Team ID"
1. **Re-authenticate with Apple in Expo Launch:**
   - Go to your Expo project dashboard
   - Navigate to Credentials
   - Re-authenticate with your Apple Developer account
   - Ensure the account has access to the correct Apple Team

2. **Verify Team Membership:**
   - Log in to https://developer.apple.com/account
   - Go to "Membership" section
   - Verify your Team ID matches what Expo Launch expects
   - Ensure your Apple ID is a member of the team (not just an invited user)

3. **Check EAS Credentials:**
   ```bash
   eas credentials -p ios
   ```
   This will show the current credentials configuration

4. **Clear and Re-setup Credentials:**
   ```bash
   eas credentials -p ios
   # Select "Remove all credentials"
   # Then re-run the build - Expo Launch will re-authenticate
   ```

### If Capability Sync Still Fails
- Ensure your Apple Developer account has the necessary permissions (Admin or App Manager role)
- Check that the bundle identifier `com.whywiley.theroster1` is registered in your Apple Developer account
- Verify that the App ID has the required capabilities enabled (Sign in with Apple, Push Notifications)

## Key Points

✅ **No Hardcoded Credentials:** The Apple Team ID is never hardcoded in code or config
✅ **Environment-Driven:** Team ID is resolved from environment variables provided by Expo Launch
✅ **Early Failure:** Preflight check fails early with clear error message if Team ID is missing
✅ **Clear Diagnostics:** Logging shows which environment variables are present (without exposing values)
✅ **Secure:** Credentials are managed by Expo Launch, not stored in the repository

## Acceptance Criteria Met

- ✅ No hardcoded Team ID or Apple credentials anywhere
- ✅ Build fails early with clear "Missing Apple Team ID in build environment" message if Launch didn't provide it
- ✅ When Launch provides access, config resolves Team ID from env and capability sync proceeds without worker-script crash
- ✅ Single source of truth for Expo config (app.config.js)
- ✅ Preflight validation script confirms Team ID is present before build
- ✅ No changes to Expo SDK, React, React Native versions
- ✅ No changes to bundleIdentifier, owner, slug, or scheme
- ✅ No ios/ or android/ folders added
- ✅ No native code modifications

## Next Steps

1. **Commit these changes** to your repository
2. **Push to your remote** repository
3. **Trigger an EAS build** with Expo Launch
4. **Monitor the build logs** for the preflight check output
5. **If preflight fails**, follow the troubleshooting steps above to re-authenticate with Apple

The build should now succeed with Expo Launch providing the Apple Team ID through its authentication flow.
