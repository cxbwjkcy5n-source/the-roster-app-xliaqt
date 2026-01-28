
module.exports = ({ config }) => {
  // CRITICAL: Apple Team ID must be exactly "JB7SST7P2U"
  // This is read from environment variable or defaults to the correct value
  const appleTeamId = process.env.APPLE_TEAM_ID || "JB7SST7P2U";
  
  // Validation: Ensure Apple Team ID is correct
  if (appleTeamId !== "JB7SST7P2U") {
    throw new Error(
      `❌ APPLE TEAM ID MISMATCH: Expected "JB7SST7P2U" but got "${appleTeamId}". ` +
      `Apple auth does not have access to Team ID ${appleTeamId}. ` +
      `Re-authenticate with the correct Apple Developer account or update the Team ID.`
    );
  }
  
  console.log(`✅ Apple Team ID validated: ${appleTeamId}`);
  
  return {
    ...config,
    name: "The Roster",
    slug: "the-roster",
    owner: "whywiley",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/d136fc08-2fbc-4902-972a-c9d16c00fa3b.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    scheme: "theroster",
    splash: {
      image: "./assets/images/d136fc08-2fbc-4902-972a-c9d16c00fa3b.png",
      resizeMode: "contain",
      backgroundColor: "#FFFFFF"
    },
    ios: {
      ...(config.ios ?? {}),
      supportsTablet: true,
      buildNumber: "7",
      bundleIdentifier: "com.whywiley.theroster1",
      appleTeamId: "JB7SST7P2U", // Hardcoded to ensure consistency
      infoPlist: {
        ...(config.ios?.infoPlist ?? {}),
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription: "The Roster needs your location to help you find nearby date spots and track safety during dates.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "The Roster needs your location to help you find nearby date spots and track safety during dates.",
        NSCameraUsageDescription: "The Roster needs camera access to let you add photos to your roster profiles.",
        NSPhotoLibraryUsageDescription: "The Roster needs photo library access to let you add photos to your roster profiles.",
        NSPhotoLibraryAddUsageDescription: "The Roster needs permission to save photos to your library.",
        NSCalendarsUsageDescription: "The Roster needs calendar access to help you schedule and manage your dates.",
        NSRemindersUsageDescription: "The Roster needs reminders access to send you date notifications.",
        NSContactsUsageDescription: "The Roster needs contacts access to help you quickly add people to your roster.",
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: ["theroster"]
          }
        ],
        LSApplicationQueriesSchemes: ["mailto", "tel", "sms", "https", "http"]
      },
      entitlements: {
        "com.apple.developer.applesignin": [
          "Default"
        ],
        "aps-environment": "production"
      },
      config: {
        usesNonExemptEncryption: false
      },
      associatedDomains: [
        "applinks:theroster.app",
        "webcredentials:theroster.app"
      ]
    },
    android: {
      ...(config.android ?? {}),
      versionCode: 7,
      adaptiveIcon: {
        foregroundImage: "./assets/images/d136fc08-2fbc-4902-972a-c9d16c00fa3b.png",
        backgroundColor: "#FFFFFF"
      },
      edgeToEdgeEnabled: true,
      package: "com.whywiley.theroster1",
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "READ_CALENDAR",
        "WRITE_CALENDAR",
        "READ_CONTACTS"
      ],
      googleServicesFile: "./google-services.json",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "theroster.app",
              pathPrefix: "/"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    web: {
      ...(config.web ?? {}),
      favicon: "./assets/images/d136fc08-2fbc-4902-972a-c9d16c00fa3b.png",
      bundler: "metro",
      output: "static",
      backgroundColor: "#FFFFFF"
    },
    plugins: [
      "expo-font",
      "expo-router",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "The Roster needs your location to help you find nearby date spots and track safety during dates."
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "The Roster needs photo library access to let you add photos to your roster profiles.",
          cameraPermission: "The Roster needs camera access to let you add photos to your roster profiles."
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/d136fc08-2fbc-4902-972a-c9d16c00fa3b.png",
          color: "#4CAF50",
          sounds: []
        }
      ],
      [
        "expo-web-browser",
        {
          preferEphemeralSession: true
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      ...(config.extra ?? {}),
      router: {
        origin: false
      },
      eas: {
        projectId: "eb17b369-934a-404b-8bc9-914a7207ca6e"
      },
      backendUrl: "https://e5t37cpd78kyyr4rpqkxse5t4eh3mvw3.app.specular.dev",
      supabaseUrl: "https://bbtvdhdfzkyhrodgclkd.supabase.co",
      supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJidHZkaGRmemt5aHJvZGdjbGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NjMyNTgsImV4cCI6MjA4NDQzOTI1OH0.XE0VFZN7XlLDyh9vu9mt9nfGaq4iUQblNQCphSJ5OB4"
    }
  };
};
