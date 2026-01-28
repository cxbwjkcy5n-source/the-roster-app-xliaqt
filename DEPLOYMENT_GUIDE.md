
# The Roster - Deployment Guide

Complete step-by-step guide for deploying The Roster to production.

## 📋 Prerequisites

Before you begin, ensure you have:

- [ ] EAS CLI installed (`npm install -g eas-cli`)
- [ ] Expo account created
- [ ] Apple Developer account ($99/year)
- [ ] Google Play Developer account ($25 one-time)
- [ ] App Store Connect access
- [ ] Google Play Console access
- [ ] All app assets prepared (see STORE_ASSETS_GUIDE.md)

## 🔐 Step 1: Configure Credentials

### Update EAS Configuration

1. **Update Apple ID in eas.json**
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-actual-apple-id@example.com",
        "ascAppId": "6758260932",
        "appleTeamId": "JB7SST7P2U"
      }
    }
  }
}
```

2. **Add Google Play Service Account** (for Android)
   - Go to Google Play Console
   - Settings → API access
   - Create new service account
   - Download JSON key
   - Save as `google-play-service-account.json` in project root
   - **DO NOT commit this file to git**

### Login to EAS

```bash
eas login
```

## 🏗️ Step 2: Build for Production

### iOS Production Build

```bash
# Start iOS production build
eas build --platform ios --profile production

# This will:
# - Bundle your app
# - Upload to EAS servers
# - Build IPA file
# - Sign with your Apple certificates
# - Take ~15-30 minutes
```

**What happens during build:**
1. EAS asks for Apple credentials (if not configured)
2. Creates/updates provisioning profiles
3. Builds the app
4. Signs with distribution certificate
5. Provides download link when complete

### Android Production Build

```bash
# Start Android production build
eas build --platform android --profile production

# This will:
# - Bundle your app
# - Upload to EAS servers
# - Build AAB file
# - Sign with your Android keystore
# - Take ~15-30 minutes
```

**What happens during build:**
1. EAS asks for keystore (if not configured)
2. Builds Android App Bundle (AAB)
3. Signs the bundle
4. Provides download link when complete

### Monitor Build Progress

```bash
# View all builds
eas build:list

# View specific build
eas build:view [BUILD_ID]

# View build logs
eas build:view [BUILD_ID] --logs
```

## 📱 Step 3: Test Production Builds

### iOS Testing

1. **Download IPA from EAS**
2. **Install on TestFlight**
   ```bash
   eas submit --platform ios --profile production
   ```
3. **Add internal testers in App Store Connect**
4. **Test thoroughly** (see PRE_SUBMISSION_TESTING.md)

### Android Testing

1. **Download AAB from EAS**
2. **Upload to Google Play Console**
   - Go to Internal Testing track
   - Upload AAB
   - Add testers
3. **Test thoroughly** (see PRE_SUBMISSION_TESTING.md)

## 🚀 Step 4: Submit to App Stores

### iOS App Store Submission

#### A. Prepare App Store Connect

1. **Login to App Store Connect**
   - https://appstoreconnect.apple.com

2. **Create App Listing** (if not already created)
   - My Apps → + → New App
   - Platform: iOS
   - Name: The Roster
   - Primary Language: English
   - Bundle ID: com.whywiley.theroster1
   - SKU: theroster1

3. **Fill in App Information**
   - **Name**: The Roster
   - **Subtitle**: Where You're The Coach and MVP
   - **Privacy Policy URL**: [Your hosted privacy policy URL]
   - **Category**: Lifestyle
   - **Age Rating**: 17+ (Mature/Suggestive Themes)

4. **Add Screenshots**
   - Upload screenshots for all required sizes
   - See STORE_ASSETS_GUIDE.md for specifications

5. **Write App Description**
   - Use description from LAUNCH_CHECKLIST.md
   - Highlight key features
   - Keep it engaging and clear

6. **Set Pricing**
   - Free (or your chosen price)
   - Available in all territories (or select specific)

7. **App Review Information**
   - Contact information
   - Demo account (if login required)
   - Notes for reviewer (if needed)

#### B. Submit Build via EAS

```bash
# Submit to App Store
eas submit --platform ios --profile production

# This will:
# - Upload your IPA to App Store Connect
# - Link it to your app listing
# - Make it available for review submission
```

#### C. Submit for Review

1. Go to App Store Connect
2. Select your app
3. Go to "App Store" tab
4. Click "+ Version or Platform"
5. Select your uploaded build
6. Fill in "What's New in This Version"
7. Click "Submit for Review"

**Review Timeline**: 1-3 days typically

### Android Google Play Submission

#### A. Prepare Google Play Console

1. **Login to Google Play Console**
   - https://play.google.com/console

2. **Create App** (if not already created)
   - All apps → Create app
   - App name: The Roster
   - Default language: English
   - App or game: App
   - Free or paid: Free

3. **Set Up App**
   - **Store listing**:
     - App name: The Roster
     - Short description: (80 chars)
     - Full description: (See LAUNCH_CHECKLIST.md)
     - App icon: 512x512 PNG
     - Feature graphic: 1024x500 PNG
     - Screenshots: At least 2 phone screenshots
     - Category: Lifestyle
     - Contact details: Email, website
     - Privacy Policy: [Your hosted URL]

   - **Content rating**:
     - Complete questionnaire
     - Expected rating: Mature 17+

   - **App content**:
     - Privacy policy: Link to your policy
     - Ads: No (or Yes if applicable)
     - Target audience: Adults
     - Data safety: Complete form

   - **Store settings**:
     - App category: Lifestyle
     - Tags: Dating, Relationships, Social

#### B. Submit Build via EAS

```bash
# Submit to Google Play
eas submit --platform android --profile production

# This will:
# - Upload your AAB to Google Play Console
# - Create a release in Internal Testing track
```

#### C. Promote to Production

1. Go to Google Play Console
2. Testing → Internal testing
3. Review your release
4. Click "Promote release"
5. Select "Production"
6. Review and rollout

**Review Timeline**: 1-7 days typically

## 📊 Step 5: Post-Submission Monitoring

### Immediate Actions

1. **Monitor Review Status**
   - iOS: App Store Connect
   - Android: Google Play Console

2. **Set Up Alerts**
   - Email notifications for review updates
   - Crash reporting (Sentry, etc.)
   - Analytics tracking

3. **Prepare Support**
   - Monitor support email
   - Watch for user reviews
   - Be ready to respond quickly

### If Rejected

1. **Read rejection reason carefully**
2. **Fix the issue**
3. **Update build if needed**
4. **Respond to reviewer** (iOS allows responses)
5. **Resubmit**

Common rejection reasons:
- App crashes
- Missing privacy policy
- Incomplete features
- Misleading metadata
- Permission issues

## 🔄 Step 6: Updates & Maintenance

### Releasing Updates

1. **Update version in app.config.js**
   ```javascript
   version: "1.0.1", // Increment version
   ```

2. **Update build numbers**
   - iOS: Automatically incremented by EAS
   - Android: Automatically incremented by EAS

3. **Build new version**
   ```bash
   eas build --platform all --profile production
   ```

4. **Submit update**
   ```bash
   eas submit --platform all --profile production
   ```

5. **Write release notes**
   - What's new
   - Bug fixes
   - Improvements

### Hotfix Process

For critical bugs:

1. **Create hotfix branch**
   ```bash
   git checkout -b hotfix/critical-bug
   ```

2. **Fix the bug**

3. **Test thoroughly**

4. **Build and submit**
   ```bash
   eas build --platform all --profile production
   eas submit --platform all --profile production
   ```

5. **Expedited review** (iOS only)
   - Request in App Store Connect
   - Explain urgency

## 📈 Step 7: Analytics & Monitoring

### Set Up Monitoring

1. **Crash Reporting**
   - Sentry, Bugsnag, or Firebase Crashlytics
   - Monitor crash-free rate (target: >99%)

2. **Analytics**
   - Google Analytics, Mixpanel, or Amplitude
   - Track key metrics:
     - Daily Active Users (DAU)
     - Monthly Active Users (MAU)
     - Retention rates
     - Feature usage

3. **Performance Monitoring**
   - App load time
   - Screen render time
   - API response time
   - Memory usage

### Key Metrics to Track

- **Downloads**: Total installs
- **Active Users**: DAU, WAU, MAU
- **Retention**: Day 1, Day 7, Day 30
- **Engagement**: Session length, frequency
- **Crashes**: Crash-free rate
- **Reviews**: Rating, review count
- **Revenue**: If monetized

## 🆘 Troubleshooting

### Build Failures

**iOS Build Fails**
```bash
# Check logs
eas build:view [BUILD_ID] --logs

# Common issues:
# - Invalid provisioning profile
# - Missing entitlements
# - Code signing issues

# Solution: Clear credentials and rebuild
eas credentials --platform ios
```

**Android Build Fails**
```bash
# Check logs
eas build:view [BUILD_ID] --logs

# Common issues:
# - Gradle errors
# - Missing dependencies
# - Keystore issues

# Solution: Clear build cache
eas build --platform android --profile production --clear-cache
```

### Submission Failures

**iOS Submission Fails**
- Check App Store Connect for errors
- Verify bundle ID matches
- Ensure all required metadata is filled
- Check for missing screenshots

**Android Submission Fails**
- Verify package name matches
- Check content rating is complete
- Ensure privacy policy is linked
- Verify all store listing fields are filled

## 📞 Support Resources

- **EAS Documentation**: https://docs.expo.dev/eas/
- **App Store Connect Help**: https://developer.apple.com/support/app-store-connect/
- **Google Play Console Help**: https://support.google.com/googleplay/android-developer/
- **Expo Forums**: https://forums.expo.dev/
- **Stack Overflow**: Tag questions with `expo`, `react-native`

## ✅ Deployment Checklist

Before each deployment:

- [ ] All tests pass
- [ ] No console errors
- [ ] Version number updated
- [ ] Release notes written
- [ ] Privacy policy updated (if needed)
- [ ] Screenshots updated (if UI changed)
- [ ] Team reviewed changes
- [ ] Beta testers approved
- [ ] Monitoring set up
- [ ] Support team briefed

---

## 🎉 Congratulations!

Your app is now live in the App Stores! 🚀

**Next Steps:**
1. Monitor reviews and ratings
2. Respond to user feedback
3. Plan next version features
4. Keep improving the app

**Remember:**
- Regular updates keep users engaged
- Quick bug fixes build trust
- Listen to user feedback
- Iterate and improve continuously

---

**Need help?** Contact the development team or refer to the documentation.
