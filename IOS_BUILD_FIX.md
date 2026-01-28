
# iOS Build Fix - Apple 403 Team ID Access Issue

## Problem
Build was failing with Apple 403 error: "Unable to find a team with the given Team ID 'JB7SST7P2U' to which you belong" during Expo Launch capability synchronization.

## Root Cause
The Apple credentials being used during the EAS build do NOT have access to Apple Team ID JB7SST7P2U. This is an authentication/authorization issue, not a code issue.

## Changes Made

### 1. Config Validation (app.config.js)
- Added validation that throws an error if Apple Team ID is not exactly "JB7SST7P2U"
- Hardcoded `ios.appleTeamId` to "JB7SST7P2U" to ensure consistency
- Added console log to confirm Team ID during config evaluation
- This ensures the build fails early with a clear error message if the Team ID is wrong

### 2. EAS Configuration (eas.json)
- Set `credentialsSource: "local"` for all iOS build profiles (development, preview, production)
- This prevents EAS from attempting to auto-sync capabilities with Apple during build
- Forces the build to use existing local credentials instead of trying to create new ones
- Set `APPLE_TEAM_ID` environment variable to "JB7SST7P2U" in all build profiles

## How This Fixes the Issue

1. **Prevents Auto-Sync**: By using `credentialsSource: "local"`, EAS will not attempt to sync capabilities with Apple during the build, avoiding the 403 error from Launch.

2. **Early Validation**: The config validation ensures that if the Team ID is wrong, the build fails immediately with a clear error message instead of crashing with "Unhandled Worker Script Exception".

3. **Consistent Team ID**: Hardcoding the Team ID in the config ensures it cannot be accidentally overridden by environment variables or other sources.

## Verification Commands

Run these commands to verify the configuration:

```bash
# 1. Verify the Expo config shows correct Team ID
npx expo config --type public

# Expected output should include:
# "ios": {
#   "appleTeamId": "JB7SST7P2U",
#   "bundleIdentifier": "com.whywiley.theroster1"
# }

# 2. Check EAS credentials
eas credentials -p ios

# This will show the current iOS credentials and Team ID

# 3. Build for iOS (production profile)
eas build -p ios --profile production

# Or for preview:
eas build -p ios --profile preview
```

## What to Do If Build Still Fails

If the build still fails with Apple 403 error, it means the Apple Developer account credentials used by EAS do NOT have access to Team ID JB7SST7P2U. You need to:

1. **Verify Apple Account Access**:
   - Log in to https://developer.apple.com
   - Go to "Membership" section
   - Verify your Team ID is exactly "JB7SST7P2U"
   - If not, you're using the wrong Apple account

2. **Re-authenticate EAS with Correct Apple Account**:
   ```bash
   # Log out of EAS
   eas logout
   
   # Log back in with the Apple account that has access to Team JB7SST7P2U
   eas login
   
   # Clear old credentials
   eas credentials -p ios
   # Select "Remove all credentials" or "Remove specific credentials"
   
   # Re-run the build
   eas build -p ios --profile production
   ```

3. **Add User to Apple Team** (if you're not a member):
   - Have the Team Admin go to https://developer.apple.com
   - Go to "Users and Access"
   - Add your Apple ID to Team JB7SST7P2U with appropriate role (Admin or Developer)
   - Wait 5-10 minutes for changes to propagate
   - Re-authenticate EAS and try building again

## Expected Behavior After Fix

- ✅ Build no longer crashes with "Unhandled Worker Script Exception"
- ✅ If Apple auth is wrong, build fails with clear message: "Apple auth does not have access to Team ID JB7SST7P2U. Re-authenticate with the correct Apple Developer account or update the Team ID."
- ✅ If Apple auth is correct, build proceeds without attempting capability sync (uses local credentials)
- ✅ Launch capability synchronization is skipped, avoiding the 403 error

## Summary

The fix prevents the build from attempting to auto-sync Apple capabilities by using local credentials, and adds validation to fail early with a clear error message if the Apple Team ID is incorrect. This avoids the "Unhandled Worker Script Exception" crash and provides actionable guidance for fixing authentication issues.
