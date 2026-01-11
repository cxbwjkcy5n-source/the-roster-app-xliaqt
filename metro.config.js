
const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Enable package exports for better module resolution
config.resolver.unstable_enablePackageExports = true;

// Platform-specific extensions - web MUST come first for web builds
config.resolver.sourceExts = [
  'web.tsx',
  'web.ts',
  'web.jsx',
  'web.js',
  'tsx',
  'ts',
  'jsx',
  'js',
  'native.tsx',
  'native.ts',
  'native.jsx',
  'native.js',
  'ios.tsx',
  'ios.ts',
  'ios.jsx',
  'ios.js',
  'android.tsx',
  'android.ts',
  'android.jsx',
  'android.js',
  'json',
  'cjs',
  'mjs',
];

// Asset extensions - DO NOT include 'css' here as it causes resolution issues
config.resolver.assetExts = [
  ...config.resolver.assetExts.filter(ext => ext !== 'svg' && ext !== 'css'),
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
];

// Platform order - web first
config.resolver.platforms = ['web', 'ios', 'android', 'native'];

// Custom resolver to handle web-specific module resolution and block native-only modules
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Fix nanoid/non-secure module resolution
  if (moduleName === 'nanoid/non-secure') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/nanoid/non-secure/index.js'),
      type: 'sourceFile',
    };
  }
  
  // Block ALL CSS module imports - they're not supported in React Native
  if (moduleName.endsWith('.css') || moduleName.endsWith('.module.css') || moduleName.includes('.css')) {
    console.log(`[Metro] Blocking CSS import: ${moduleName}`);
    // Return an empty module
    return {
      filePath: path.resolve(__dirname, 'node_modules/react/index.js'),
      type: 'sourceFile',
    };
  }
  
  // For web platform, intercept and redirect native-only modules
  if (platform === 'web') {
    // Block ALL expo-router native tabs related imports
    if (
      moduleName === 'expo-router/unstable-native-tabs' ||
      moduleName.includes('expo-router/build/native-tabs') ||
      moduleName.includes('expo-router/assets/native-tabs') ||
      moduleName.includes('NativeBottomTabs') ||
      moduleName.includes('NativeTabsView')
    ) {
      console.log(`[Metro] Blocking native tabs module on web: ${moduleName}`);
      // Return a minimal empty module that exports nothing
      return {
        filePath: path.resolve(__dirname, 'node_modules/react/index.js'),
        type: 'sourceFile',
      };
    }

    // Block react-native-gesture-handler - return empty module
    if (moduleName === 'react-native-gesture-handler') {
      console.log(`[Metro] Blocking gesture handler on web: ${moduleName}`);
      return {
        filePath: path.resolve(__dirname, 'node_modules/react-native-web/dist/index.js'),
        type: 'sourceFile',
      };
    }

    // Block @react-native-community/datetimepicker
    if (moduleName === '@react-native-community/datetimepicker') {
      console.log(`[Metro] Blocking datetimepicker on web: ${moduleName}`);
      return {
        filePath: path.resolve(__dirname, 'node_modules/react-native-web/dist/index.js'),
        type: 'sourceFile',
      };
    }

    // Block React Native internal/private modules
    if (
      moduleName.startsWith('react-native/Libraries/ReactPrivate') ||
      moduleName.startsWith('react-native/Libraries/Utilities/codegenNativeComponent') ||
      moduleName.startsWith('react-native/Libraries/Core/InitializeCore') ||
      moduleName.startsWith('react-native/src/private/setup') ||
      moduleName.includes('ReactNativePrivateInitializeCore')
    ) {
      console.log(`[Metro] Blocking React Native internal module on web: ${moduleName}`);
      // Return react-native-web instead
      return {
        filePath: path.resolve(__dirname, 'node_modules/react-native-web/dist/index.js'),
        type: 'sourceFile',
      };
    }

    // Block @expo/metro-runtime native-specific files
    if (
      moduleName.includes('@expo/metro-runtime/src/location/install.native') ||
      (moduleName.includes('@expo/metro-runtime') && moduleName.includes('.native'))
    ) {
      console.log(`[Metro] Blocking metro-runtime native module on web: ${moduleName}`);
      // Return a minimal module
      return {
        filePath: path.resolve(__dirname, 'node_modules/react-native-web/dist/index.js'),
        type: 'sourceFile',
      };
    }

    // Block any .native.ts/.native.js files when on web
    if (moduleName.includes('.native.')) {
      console.log(`[Metro] Blocking .native file on web: ${moduleName}`);
      return {
        filePath: path.resolve(__dirname, 'node_modules/react-native-web/dist/index.js'),
        type: 'sourceFile',
      };
    }

    // Block any .ios.tsx/.ios.ts files when on web - redirect to .web or base version
    if (moduleName.includes('.ios.')) {
      console.log(`[Metro] Blocking .ios file on web: ${moduleName}`);
      // Try to resolve the .web or base version instead
      const webVersion = moduleName.replace('.ios.', '.web.');
      const baseVersion = moduleName.replace(/\.ios\.(tsx?|jsx?)$/, '.$1');
      
      try {
        return context.resolveRequest(context, webVersion, platform);
      } catch {
        try {
          return context.resolveRequest(context, baseVersion, platform);
        } catch {
          return {
            filePath: path.resolve(__dirname, 'node_modules/react-native-web/dist/index.js'),
            type: 'sourceFile',
          };
        }
      }
    }
  }
  
  // Use default resolver for everything else
  return context.resolveRequest(context, moduleName, platform);
};

// Cache configuration
config.cacheStores = [
  new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
];

// Transformer configuration
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Additional web-specific configuration
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Add headers for better web compatibility
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
