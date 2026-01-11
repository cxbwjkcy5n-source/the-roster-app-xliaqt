
const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;

// IMPORTANT: Platform-specific extensions order matters!
// For web builds, web extensions should be checked first
// For native builds, native extensions should be checked first
config.resolver.sourceExts = [
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
  'web.tsx',
  'web.ts',
  'web.jsx',
  'web.js',
  'tsx',
  'ts',
  'jsx',
  'js',
  'json',
  'cjs',
  'mjs',
];

// Ensure proper asset handling for web
config.resolver.assetExts = [
  ...config.resolver.assetExts.filter(ext => ext !== 'svg'),
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
];

// Add platform-specific extensions
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Fix for nanoid/non-secure module resolution issue and web-specific module handling
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Fix nanoid/non-secure module resolution
  if (moduleName === 'nanoid/non-secure') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/nanoid/non-secure/index.js'),
      type: 'sourceFile',
    };
  }
  
  // Prevent native-only expo-router modules from being loaded on web
  if (platform === 'web' && moduleName === 'expo-router/unstable-native-tabs') {
    // Return a dummy module that won't be used since we have _layout.web.tsx
    return {
      filePath: path.resolve(__dirname, 'node_modules/expo-router/build/index.js'),
      type: 'sourceFile',
    };
  }
  
  // Default resolver
  return context.resolveRequest(context, moduleName, platform);
};

// Use turborepo to restore the cache when possible
config.cacheStores = [
  new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
];

// Transformer configuration for web
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;
