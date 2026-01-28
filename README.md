
# The Roster - Where You're The Coach and MVP

A modern dating life management app built with React Native and Expo. Organize your connections, plan dates, track interactions, and stay safe while dating.

## 🚀 Features

### 📋 Roster Management
- Add and organize people you're dating or interested in
- Track interest levels (low, medium, high)
- Add photos, notes, red flags, and green flags
- Categorize by relationship type (dating, casual, serious, etc.)
- Move people between Roster and Bench

### 📅 Date Planning & Scheduling
- Schedule upcoming dates with reminders
- AI-powered date suggestions based on preferences and location
- Track date history and rate experiences
- Plan dates with budget and duration preferences

### 🛡️ Safety Features
- Share date details with emergency contacts
- Real-time location tracking during dates
- Quick check-in system
- Emergency contact management

### 📊 Dating Analytics
- Track dating patterns and trends
- Interest level breakdown
- Date frequency statistics
- Common red/green flags analysis
- Top-rated dates tracking

### 🎯 Smart Organization
- Drag-and-drop roster reordering
- Interaction tracking (calls, texts, dates)
- Reminder system for follow-ups
- Quick actions (morning texts, check-ins)

## 🛠️ Tech Stack

- **Framework**: React Native with Expo 54
- **Navigation**: Expo Router (file-based routing)
- **Authentication**: Better Auth with Supabase
- **Backend**: Fastify API with Drizzle ORM
- **Database**: PostgreSQL (via Supabase)
- **UI Components**: React Native primitives with custom components
- **Styling**: StyleSheet with common design system
- **State Management**: React Context API
- **AI Integration**: OpenAI GPT-5.2 for date suggestions and coaching

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- iOS Simulator (Mac) or Android Emulator

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd the-roster
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. **Start the development server**
```bash
npm run dev
```

5. **Run on iOS**
```bash
npm run ios
```

6. **Run on Android**
```bash
npm run android
```

7. **Run on Web**
```bash
npm run web
```

## 🏗️ Project Structure

```
the-roster/
├── app/                          # Expo Router pages
│   ├── (tabs)/                   # Tab navigation screens
│   │   ├── (home)/              # Home tab group
│   │   │   ├── index.tsx        # Home screen
│   │   │   └── roster.tsx       # Roster screen
│   │   ├── bench.tsx            # Bench screen
│   │   ├── dating.tsx           # Dating menu screen
│   │   └── profile.tsx          # Profile screen
│   ├── dating/                  # Dating feature screens
│   │   ├── analytics.tsx        # Analytics dashboard
│   │   ├── coach.tsx            # AI dating coach
│   │   ├── history.tsx          # Date history
│   │   ├── plan.tsx             # Date planning
│   │   ├── safety.tsx           # Safety features
│   │   └── schedule.tsx         # Date scheduling
│   ├── person/                  # Person management
│   │   ├── [id].tsx            # Person detail
│   │   └── add.tsx             # Add/edit person
│   ├── auth.tsx                 # Authentication screen
│   ├── privacy-policy.tsx       # Privacy policy
│   ├── eula.tsx                 # End user license agreement
│   └── _layout.tsx              # Root layout
├── components/                   # Reusable components
│   ├── FloatingTabBar.tsx       # Custom tab bar
│   ├── IconSymbol.tsx           # Cross-platform icons
│   └── ...
├── contexts/                     # React contexts
│   ├── AuthContext.tsx          # Authentication state
│   └── RosterContext.tsx        # Roster data management
├── utils/                        # Utility functions
│   ├── api.ts                   # API client
│   └── zodiac.ts                # Zodiac calculations
├── styles/                       # Styling
│   └── commonStyles.ts          # Design system
├── types/                        # TypeScript types
│   └── roster.ts                # Data models
├── backend/                      # Backend API
│   └── src/                     # Source code
│       ├── routes/              # API routes
│       ├── db/                  # Database schemas
│       └── middleware/          # Auth middleware
├── assets/                       # Static assets
│   ├── images/                  # Images
│   └── fonts/                   # Custom fonts
├── app.config.js                # Expo configuration
├── eas.json                     # EAS Build configuration
└── package.json                 # Dependencies
```

## 🔐 Authentication

The app uses Better Auth with Supabase for authentication:

- **Email/Password**: Traditional authentication
- **Google OAuth**: Sign in with Google
- **Apple Sign In**: Sign in with Apple (iOS)

Authentication is handled by the `AuthContext` and protected routes use the `ProtectedRoute` component.

## 🗄️ Database Schema

### Main Tables
- **profiles**: User dating profiles
- **dates**: Scheduled and completed dates
- **interactions**: Communication history
- **flags**: Red and green flags
- **reminders**: Date reminders
- **safety_dates**: Active safety tracking
- **user_profiles**: User account information

See `backend/src/db/schema.ts` for complete schema.

## 🎨 Design System

The app uses a consistent design system defined in `styles/commonStyles.ts`:

- **Colors**: Primary (green), secondary, background, text
- **Gradients**: Consistent gradient styles
- **Typography**: Font sizes and weights
- **Spacing**: Consistent padding and margins

## 📱 Platform-Specific Code

The app uses platform-specific files for iOS, Android, and Web:

- `*.ios.tsx` - iOS-specific implementation
- `*.android.tsx` - Android-specific implementation
- `*.web.tsx` - Web-specific implementation
- `*.tsx` - Default/fallback implementation

## 🚀 Building for Production

### iOS Production Build
```bash
eas build --platform ios --profile production
```

### Android Production Build
```bash
eas build --platform android --profile production
```

### Submit to App Stores
```bash
# iOS
eas submit --platform ios --profile production

# Android
eas submit --platform android --profile production
```

See `LAUNCH_CHECKLIST.md` for complete launch instructions.

## 📸 App Store Assets

See `STORE_ASSETS_GUIDE.md` for:
- Screenshot requirements
- Asset specifications
- Text content templates
- Design guidelines

## 🔒 Privacy & Security

- All data encrypted in transit and at rest
- No data sold to third parties
- Users control their data
- Privacy Policy and EULA accessible in-app
- Location data only used for requested features

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type checking
npx tsc --noEmit
```

## 📝 Environment Variables

Required environment variables (see `.env.example`):

```env
EXPO_PUBLIC_BACKEND_URL=your-backend-url
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 🤝 Contributing

This is a private project. For issues or feature requests, contact the development team.

## 📄 License

Proprietary - All rights reserved

## 🆘 Support

For support, contact: [your-support-email]

## 🎯 Roadmap

### Version 1.1
- [ ] Push notifications for date reminders
- [ ] In-app messaging
- [ ] Advanced analytics
- [ ] Date idea library
- [ ] Social sharing features

### Version 1.2
- [ ] Group date planning
- [ ] Calendar integration
- [ ] Export data feature
- [ ] Dark mode improvements
- [ ] Accessibility enhancements

## 📚 Documentation

- [Launch Checklist](LAUNCH_CHECKLIST.md)
- [Store Assets Guide](STORE_ASSETS_GUIDE.md)
- [Backend Integration](BACKEND_INTEGRATION_COMPLETE.md)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)

---

**Built with ❤️ using Expo and React Native**
