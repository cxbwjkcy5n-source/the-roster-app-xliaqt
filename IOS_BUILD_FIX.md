
# iOS Build Fix - Apple Team ID Authentication Issue

## Problem
EAS iOS build was failing with Apple 403 error: "Unable to find a team with Team ID 'JB7SST7P2U' to which you belong"

This occurred because Expo Launch was attempting to auto-sync Apple capabilities/entitlements, but the Apple account being used during the build did NOT have access to Team ID `JB7SST7P2U`.

## Solution Applied

### 1. Disabled Automatic Capability Syncing
Added `"credentialsSource": "local"` to all iOS build profiles in `eas.json`. This prevents EAS from attempting to auto-sync Apple capabilities during the build and instead uses locally stored credentials.

**Changes to eas.json:**
- Added `"credentialsSource": "local"` to `build.development.ios`
- Added `"credentialsSource": "local"` to `build.preview.ios`
- Added `"credentialsSource": "local"` to `build.production.ios`

### 2. Ensured Consistent Apple Team ID
Updated `app.config.js` to consistently use the `APPLE_TEAM_ID` environment variable with a fallback to `JB7SST7P2U`. The config now stores this in a variable to ensure it's not accidentally overwritten.

### 3. How This Fixes the Issue
- **Before:** EAS would try to sync capabilities with Apple during build → Apple API call with wrong/unauthorized credentials → 403 error
- **After:** EAS uses local credentials (distribution certificate + provisioning profile) that were previously generated → No Apple API calls during build → Build succeeds

## Required Steps to Complete the Fix

### Step 1: Verify EAS Account
```bash
eas whoami
```
This shows which EAS account you're logged in as. Make sure it's the correct account.

### Step 2: Check/Update Apple Credentials
```bash
eas credentials -p ios
```

This will show your current iOS credentials. You need to ensure:
- **Distribution Certificate** exists and is valid
- **Provisioning Profile** exists for `com.whywiley.theroster1`
- **Apple Team ID** is set to `JB7SST7P2U`

If credentials are missing or incorrect:
1. Select "Set up new credentials"
2. When prompted for Apple Team ID, enter: `JB7SST7P2U`
3. Follow the prompts to generate/upload distribution certificate and provisioning profile

### Step 3: Verify Apple Developer Account Access
The Apple ID you use MUST be a member of Team ID `JB7SST7P2U`. To verify:

1. Go to https://developer.apple.com/account
2. Log in with the Apple ID you're using for EAS builds
3. Check "Membership" section - it should show Team ID: `JB7SST7P2U`

If you don't see this Team ID:
- You're logged in with the wrong Apple ID, OR
- This Apple ID needs to be added to the team

To add an Apple ID to the team:
1. Log in to https://developer.apple.com/account with the **Team Admin** account
2. Go to "Users and Access"
3. Click "+" to add the Apple ID
4. Assign appropriate role (Admin, App Manager, or Developer)

### Step 4: Run the Build
```bash
# For production build
eas build -p ios --profile production

# For preview build
eas build -p ios --profile preview

# For development build
eas build -p ios --profile development
```

The build should now succeed without attempting to sync capabilities with Apple.

## Verification Commands

Run these commands to verify everything is configured correctly:

```bash
# 1. Check who you're logged in as
eas whoami

# 2. Verify iOS credentials
eas credentials -p ios

# 3. Verify the config is correct
npx expo config --type public | grep -A 5 "appleTeamId"

# 4. Check environment variables
echo $APPLE_TEAM_ID
```

## What Changed

### eas.json
```diff
"ios": {
  "simulator": false,
  "resourceClass": "m-medium",
  "cache": {
    "disabled": false
  },
+ "credentialsSource": "local"
}
```

### app.config.js
```diff
+ const appleTeamId = process.env.APPLE_TEAM_ID || "JB7SST7P2U";

ios: {
  ...
- appleTeamId: process.env.APPLE_TEAM_ID || "JB7SST7P2U",
+ appleTeamId: appleTeamId,
  ...
}
```

## Expected Build Flow

1. EAS reads `eas.json` and sees `"credentialsSource": "local"`
2. EAS retrieves locally stored credentials (certificate + provisioning profile)
3. EAS uses these credentials to sign the app
4. **No Apple API calls are made during the build** (no capability sync)
5. Build completes successfully

## Troubleshooting

### If build still fails with 403 error:
- The Apple ID used for credentials doesn't have access to Team ID `JB7SST7P2U`
- Solution: Add the Apple ID to the team (see Step 3 above)

### If build fails with "No credentials found":
- You need to set up credentials first
- Run: `eas credentials -p ios` and follow prompts

### If build fails with "Invalid provisioning profile":
- The provisioning profile doesn't match the bundle identifier or team ID
- Solution: Delete old credentials and generate new ones:
  ```bash
  eas credentials -p ios
  # Select "Remove all credentials"
  # Then run again and select "Set up new credentials"
  ```

## Summary

The fix prevents EAS from attempting to auto-sync Apple capabilities during the build by using `"credentialsSource": "local"`. This means the build will use previously generated credentials (distribution certificate + provisioning profile) instead of trying to create new ones or sync capabilities with Apple's servers.

The Apple 403 error was caused by the build process trying to authenticate with Apple using an account that doesn't have access to Team ID `JB7SST7P2U`. By using local credentials, we bypass this authentication step entirely.
