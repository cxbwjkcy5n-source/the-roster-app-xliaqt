
const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;

// IMPORTANT: Platform-specific extensions order matters!
// Native extensions should come BEFORE web extensions
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
  'tsx',
  'ts',
  'jsx',
  'js',
  'json',
  // Web extensions come LAST to prevent them from being picked up on native
  'web.tsx',
  'web.ts',
  'web.jsx',
  'web.js',
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
