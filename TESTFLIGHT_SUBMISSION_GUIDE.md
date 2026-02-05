
# 🚀 TestFlight Submission Guide - The Roster

## ✅ Pre-Flight Check Complete

All critical errors have been resolved. Your app is ready for TestFlight!

---

## 🎯 What Was Fixed

### Critical Issues (Would Block submission)
1. **URL Scheme Validation Error** ✅ FIXED
   - Changed `"The Roster"` → `"theroster"` (no spaces, lowercase)
   - Apple requires RFC1738 compliant URL schemes

2. **Missing iOS Configuration** ✅ FIXED
   - Added bundle identifier: `com.whywiley.theroster1`
   - Added all required privacy descriptions
   - Added encryption declaration
   - Configured build settings

3. **Routing Navigation Error** ✅ FIXED
   - Fixed FloatingTabBar active tab detection
   - Properly handles nested routes `/(tabs)/(home)/`
   - Navigation back to roster now works correctly

### Minor Warnings (Won't block submission)
- Shadow props deprecation warning (cosmetic only, app works fine)

---

## 📝 Before You Build

### 1. Update Your Apple ID
Edit `eas.json` and replace the placeholder:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your-apple-id@example.com",  // ⚠️ CHANGE THIS TO YOUR APPLE ID
      "ascAppId": "6758260932"
    }
  }
}
```

### 2. Verify Assets Exist
Check these files are present:
- `./assets/images/icon.png` (1024x1024px)
- `./assets/images/splash.png`
- `./assets/images/adaptive-icon.png`
- `./assets/images/favicon.png`

---

## 🏗️ Build Commands

### Option 1: Build Only (Recommended for first time)
```bash
# Build the production iOS app
eas build --platform ios --profile production

# Wait for build to complete (15-30 minutes first time)
# You'll get a build URL when done
```

### Option 2: Build + Auto-Submit
```bash
# Build and automatically submit to TestFlight
eas build --platform ios --profile production --auto-submit
```

### Option 3: Submit Existing Build
```bash
# If you already have a build, just submit it
eas submit --platform ios --profile production
```

---

## 📊 Build Status Monitoring

### Check Build Progress
```bash
# List all builds
eas build:list

# View specific build details
eas build:view [BUILD_ID]

# View build logs in real-time
eas build:view [BUILD_ID] --logs
```

### Build States
- **Queued**: Waiting for build server
- **In Progress**: Currently building
- **Finished**: Build successful ✅
- **Errored**: Build failed ❌

---

## 🎯 After Build Completes

### 1. Download Build (Optional)
```bash
# Download the .ipa file to test locally
eas build:download [BUILD_ID]
```

### 2. Submit to TestFlight
If you didn't use `--auto-submit`:
```bash
eas submit --platform ios --profile production
```

You'll be prompted to:
- Select the build to submit
- Confirm Apple ID credentials
- Review submission details

### 3. Check App Store Connect
1. Go to https://appstoreconnect.apple.com
2. Navigate to "My Apps" → "The Roster"
3. Go to "TestFlight" tab
4. Wait for processing (5-15 minutes)

---

## 👥 TestFlight Testing

### Internal Testing (Immediate)
- Add up to 100 internal testers
- No Apple review required
- Available immediately after processing

### External Testing (Requires Review)
- Add up to 10,000 external testers
- Requires Apple review (24-48 hours)
- Need to provide test information

### Add Testers
1. In App Store Connect → TestFlight
2. Click "Internal Testing" or "External Testing"
3. Add testers by email
4. They'll receive an invitation email

---

## 🐛 Troubleshooting

### Build Fails

**Missing Credentials:**
```bash
# Clear credentials and re-authenticate
eas credentials --platform ios --clear
eas build --platform ios --profile production
```

**Asset Issues:**
- Verify all image assets exist
- Check image dimensions (icon must be 1024x1024)
- Ensure no spaces in filenames

**Bundle ID Conflicts:**
- Verify bundle ID is unique: `com.whywiley.theroster1`
- Check it matches in App Store Connect

### Submission Fails

**Invalid Apple ID:**
- Verify email in `eas.json` is correct
- Ensure you have App Store Connect access
- Check 2FA is enabled on Apple ID

**App Not Found:**
- Verify `ascAppId` matches your app in App Store Connect
- Create app in App Store Connect if it doesn't exist

### App Crashes on TestFlight

**Check Crash Logs:**
1. App Store Connect → TestFlight → Crashes
2. Download crash logs
3. Symbolicate with dSYM files

**Common Issues:**
- Backend API not accessible
- Missing permissions
- Network connectivity issues

---

## 📱 Testing Checklist

Before releasing to external testers, verify:

### Core Functionality
- [ ] Login/Signup works
- [ ] Can add new person to roster
- [ ] Can edit person details
- [ ] Can move person to bench
- [ ] Can navigate between all tabs
- [ ] Images upload correctly
- [ ] Profile editing works

### Dating Features
- [ ] Schedule date works
- [ ] Plan date (AI suggestions) works
- [ ] Safety features work
- [ ] Dating coach accessible
- [ ] Date history displays correctly

### Permissions
- [ ] Camera permission prompt appears
- [ ] Photo library permission works
- [ ] Location permission works (if used)
- [ ] Calendar permission works (if used)

### Edge Cases
- [ ] Works without internet (graceful degradation)
- [ ] Handles backend errors gracefully
- [ ] No crashes on navigation
- [ ] Back button works everywhere

---

## 📈 Version Management

### Current Version
- **Version:** 1.0.0
- **Build:** Auto-increments with each build

### Updating Version
Edit `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",  // Increment for bug fixes
    "ios": {
      "buildNumber": "1"  // Auto-increments, or set manually
    }
  }
}
```

### Version Guidelines
- **1.0.0 → 1.0.1**: Bug fixes
- **1.0.0 → 1.1.0**: New features
- **1.0.0 → 2.0.0**: Major changes

---

## 🎉 Success Indicators

### Build Successful
- ✅ Build status shows "Finished"
- ✅ .ipa file is available for download
- ✅ No errors in build logs

### Submission Successful
- ✅ App appears in App Store Connect
- ✅ Status shows "Processing" then "Ready to Test"
- ✅ Testers can install via TestFlight app

### App Working
- ✅ App launches without crashes
- ✅ All features work as expected
- ✅ No critical bugs reported by testers

---

## 📞 Need Help?

### Expo Resources
- **Build Docs:** https://docs.expo.dev/build/introduction/
- **Submit Docs:** https://docs.expo.dev/submit/ios/
- **Troubleshooting:** https://docs.expo.dev/build-reference/troubleshooting/

### Apple Resources
- **App Store Connect:** https://appstoreconnect.apple.com
- **TestFlight Guide:** https://developer.apple.com/testflight/

### Common Commands Reference
```bash
# Build
eas build --platform ios --profile production

# Submit
eas submit --platform ios --profile production

# Check status
eas build:list

# View logs
eas build:view [BUILD_ID] --logs

# Clear credentials
eas credentials --platform ios --clear
```

---

## ✨ You're All Set!

Your app configuration is complete and ready for TestFlight. All critical errors have been fixed.

**Final Steps:**
1. ✅ Update Apple ID in `eas.json`
2. ✅ Verify assets exist
3. ✅ Run build command
4. ✅ Wait for completion
5. ✅ Submit to TestFlight
6. ✅ Add testers
7. ✅ Celebrate! 🎉

**Estimated Timeline:**
- Build: 15-30 minutes (first time)
- Processing: 5-15 minutes
- Internal testing: Immediate
- External testing: 24-48 hours (Apple review)

Good luck with your launch! 🚀
