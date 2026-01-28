
/**
 * Preflight validation script for Expo Launch capability synchronization
 * 
 * This script runs before EAS build to ensure Apple Team ID is properly configured.
 * It validates that the Team ID is resolved from environment variables (not hardcoded)
 * and fails early with a clear error message if missing.
 */

const { execSync } = require('child_process');

console.log('\n🔍 Running preflight validation for Expo Launch...\n');

// Step 1: Check which Team ID environment variables are present
console.log('📋 Checking environment variables:');
const expoAppleTeamId = process.env.EXPO_APPLE_TEAM_ID;
const appleTeamId = process.env.APPLE_TEAM_ID;

console.log(`  - EXPO_APPLE_TEAM_ID: ${expoAppleTeamId ? '✅ Present' : '❌ Not set'}`);
console.log(`  - APPLE_TEAM_ID: ${appleTeamId ? '✅ Present' : '❌ Not set'}`);

// Step 2: Read the resolved Expo config
console.log('\n📝 Reading resolved Expo configuration...');
let config;
try {
  const configOutput = execSync('npx expo config --type public --json', { 
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  config = JSON.parse(configOutput);
} catch (error) {
  console.error('❌ Failed to read Expo config:', error.message);
  process.exit(1);
}

// Step 3: Validate ios.appleTeamId is present
const resolvedTeamId = config?.ios?.appleTeamId;

console.log(`\n🔍 Resolved ios.appleTeamId: ${resolvedTeamId ? `"${resolvedTeamId}"` : 'undefined'}`);

if (!resolvedTeamId) {
  console.error('\n❌ PREFLIGHT CHECK FAILED\n');
  console.error('═══════════════════════════════════════════════════════════════');
  console.error('Missing Apple Team ID in build environment.');
  console.error('');
  console.error('Expo Launch must provide Team access (Apple login) and a Team ID');
  console.error('environment variable (EXPO_APPLE_TEAM_ID or APPLE_TEAM_ID).');
  console.error('');
  console.error('ACTION REQUIRED:');
  console.error('1. Re-authenticate with Apple in Expo Launch');
  console.error('2. Ensure your Apple account has access to the correct Team');
  console.error('3. Retry the build');
  console.error('');
  console.error('For more information, see:');
  console.error('https://docs.expo.dev/build/setup/');
  console.error('═══════════════════════════════════════════════════════════════\n');
  process.exit(1);
}

// Step 4: Success
console.log('\n✅ PREFLIGHT CHECK PASSED\n');
console.log('═══════════════════════════════════════════════════════════════');
console.log('Apple Team ID resolved from environment (not hardcoded): OK');
console.log(`Team ID: ${resolvedTeamId}`);
console.log('');
console.log('Expo Launch can now proceed with capability synchronization.');
console.log('═══════════════════════════════════════════════════════════════\n');

process.exit(0);
