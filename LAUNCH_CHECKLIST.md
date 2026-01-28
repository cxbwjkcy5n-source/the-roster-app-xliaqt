
# The Roster - Expo Launch Checklist

## ✅ Pre-Launch Configuration Complete

### 1. App Configuration (app.config.js)
- ✅ App name: "The Roster"
- ✅ Bundle ID (iOS): com.whywiley.theroster1
- ✅ Package name (Android): com.whywiley.theroster1
- ✅ Version: 1.0.0
- ✅ Build number (iOS): 6
- ✅ Version code (Android): 6
- ✅ App icon configured
- ✅ Splash screen configured
- ✅ Orientation: portrait
- ✅ New Architecture enabled

### 2. Permissions & Privacy
- ✅ Location permissions (for date planning & safety features)
- ✅ Camera permissions (for profile photos)
- ✅ Photo library permissions (for profile photos)
- ✅ Calendar permissions (for date scheduling)
- ✅ Reminders permissions (for date notifications)
- ✅ Contacts permissions (for quick roster additions)
- ✅ All permission descriptions added to Info.plist
- ✅ Privacy Policy implemented (app/privacy-policy.tsx)
- ✅ EULA implemented (app/eula.tsx)

### 3. iOS Configuration
- ✅ Apple Team ID: JB7SST7P2U
- ✅ Bundle Identifier: com.whywiley.theroster1
- ✅ App Store Connect App ID: 6758260932
- ✅ Apple Sign In entitlement configured
- ✅ Push notifications entitlement (production)
- ✅ ITSAppUsesNonExemptEncryption: false
- ✅ Tablet support enabled

### 4. Android Configuration
- ✅ Package name: com.whywiley.theroster1
- ✅ Adaptive icon configured
- ✅ Edge-to-edge enabled
- ✅ All required permissions declared
- ✅ Google Services file path configured

### 5. EAS Build Configuration
- ✅ Development build profile
- ✅ Preview build profile
- ✅ Production build profile
- ✅ Auto-increment enabled for all profiles
- ✅ Resource class: m-medium
- ✅ Build caching enabled
- ✅ Android: AAB for production, APK for preview

### 6. App Store Submission Setup
- ✅ iOS submit configuration in eas.json
- ✅ Android submit configuration in eas.json
- ⚠️ Update appleId in eas.json before submission
- ⚠️ Add google-play-service-account.json for Android submission

## 📋 Next Steps for Launch

### Step 1: Update Credentials
```bash
# Update your Apple ID in eas.json
# Replace "your-apple-id@example.com" with your actual Apple ID
```

### Step 2: Build for Production

#### iOS Production Build
```bash
eas build --platform ios --profile production
```

#### Android Production Build
```bash
eas build --platform android --profile production
```

### Step 3: Test Builds
```bash
# Create preview builds for testing
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

### Step 4: Submit to App Stores

#### iOS Submission
```bash
# After production build completes
eas submit --platform ios --profile production
```

#### Android Submission
```bash
# First, download your Google Play service account JSON
# Place it in the project root as google-play-service-account.json
# Then submit:
eas submit --platform android --profile production
```

## 📱 App Store Listing Requirements

### App Store (iOS)
You'll need to provide in App Store Connect:
- **App Name**: The Roster
- **Subtitle**: Where You're The Coach and MVP
- **Description**: (See below)
- **Keywords**: dating, relationships, organizer, roster, dates, social
- **Screenshots**: 
  - iPhone 6.7" (required)
  - iPhone 6.5" (required)
  - iPhone 5.5" (optional)
  - iPad Pro 12.9" (if supporting tablets)
- **App Preview Video** (optional but recommended)
- **Support URL**: Your website or support page
- **Marketing URL**: Your website (optional)
- **Privacy Policy URL**: Link to hosted privacy policy
- **Age Rating**: 17+ (Mature/Suggestive Themes)
- **Category**: Lifestyle or Social Networking

### Google Play Store (Android)
You'll need to provide in Google Play Console:
- **App Name**: The Roster
- **Short Description**: Organize your dating life like a pro
- **Full Description**: (See below)
- **Screenshots**: 
  - Phone (at least 2, up to 8)
  - 7-inch tablet (optional)
  - 10-inch tablet (optional)
- **Feature Graphic**: 1024 x 500 px
- **App Icon**: 512 x 512 px
- **Privacy Policy URL**: Link to hosted privacy policy
- **Content Rating**: Mature 17+
- **Category**: Lifestyle or Social

## 📝 Suggested App Descriptions

### Short Description (80 characters max)
"Organize your dating life. Track connections, plan dates, stay safe."

### Full Description

**The Roster - Where You're The Coach and MVP**

Take control of your dating life with The Roster, the ultimate relationship management app. Whether you're casually dating, exploring connections, or managing multiple relationships, The Roster helps you stay organized and intentional.

**KEY FEATURES:**

📋 **Your Roster**
- Add and organize people you're dating or interested in
- Track interest levels, relationship types, and important details
- Add photos, notes, red flags, and green flags
- Never forget important details about your connections

📅 **Date Planning & Scheduling**
- Schedule upcoming dates with reminders
- Get AI-powered date suggestions based on preferences
- Track date history and rate your experiences
- Plan the perfect date with location recommendations

🛡️ **Safety Features**
- Share your date details with emergency contacts
- Real-time location sharing during dates
- Quick check-in system for peace of mind
- Emergency contact management

📊 **Dating Analytics**
- Track your dating patterns and trends
- See insights about your connections
- Understand what works and what doesn't
- Make data-driven dating decisions

🎯 **Smart Organization**
- Move people between Roster and Bench
- Set reminders for follow-ups
- Track interactions and conversations
- Organize by interest level and relationship type

**PRIVACY FIRST**
Your data is yours. We don't sell your information, and everything is stored securely. You control what you share and with whom.

**PERFECT FOR:**
- People actively dating multiple people
- Those who want to be more intentional about dating
- Anyone who wants to remember important details
- People who value safety while dating

Download The Roster today and take control of your dating journey!

## 🔒 Privacy & Security Notes

- All user data is encrypted in transit and at rest
- No data is sold to third parties
- Users can delete their data at any time
- Privacy Policy and EULA are accessible in-app
- Location data is only used for date planning and safety features
- Photos are stored securely and never shared without permission

## ⚠️ Important Reminders

1. **Test thoroughly** before submitting to stores
2. **Update Apple ID** in eas.json before iOS submission
3. **Add Google Play service account JSON** before Android submission
4. **Prepare screenshots** for both platforms
5. **Host Privacy Policy** on a public URL (required by both stores)
6. **Set up App Store Connect** and Google Play Console accounts
7. **Verify all deep links** work correctly
8. **Test OAuth flows** (Google, Apple Sign In)
9. **Verify push notifications** work in production
10. **Test on multiple devices** and OS versions

## 📞 Support & Resources

- **EAS Documentation**: https://docs.expo.dev/eas/
- **App Store Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Google Play Policies**: https://play.google.com/about/developer-content-policy/

## 🚀 Launch Commands Quick Reference

```bash
# Build for iOS production
eas build --platform ios --profile production

# Build for Android production
eas build --platform android --profile production

# Submit to iOS App Store
eas submit --platform ios --profile production

# Submit to Google Play Store
eas submit --platform android --profile production

# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]
```

---

**Your app is now ready for Expo Launch! 🎉**

Follow the steps above to build and submit to the App Stores.
