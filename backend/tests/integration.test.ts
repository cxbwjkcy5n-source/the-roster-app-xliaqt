import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { execSync } from 'child_process';
import {
  api,
  authenticatedApi,
  expectStatus,
  signUpTestUser,
  createTestFile,
} from './test-helpers';

let serverProcess: ChildProcess | null = null;
const TEST_SERVER_URL = 'http://localhost:3000';
const HEALTH_CHECK_TIMEOUT = 60000;
const HEALTH_CHECK_INTERVAL = 500;
const MAX_HEALTH_CHECK_ATTEMPTS = 40;

async function waitForServer(maxAttempts = MAX_HEALTH_CHECK_ATTEMPTS): Promise<void> {
  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${TEST_SERVER_URL}/api/health`, {
        timeout: 5000,
      });
      if (response.ok) {
        console.log('✓ Server is ready');
        return;
      }
      console.log(`Attempt ${attempts + 1}: Server returned ${response.status}`);
    } catch (error) {
      lastError = error as Error;
      // Server not ready yet
    }
    attempts++;
    if (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, HEALTH_CHECK_INTERVAL));
    }
  }
  const errorMsg = lastError?.message || 'Unknown error';
  throw new Error(`Health check failed after ${maxAttempts} attempts. Last error: ${errorMsg}`);
}

async function startServer(): Promise<void> {
  // Build the project first
  console.log('📦 Building project...');
  try {
    execSync('npm run build', {
      cwd: '/app/code/backend',
      stdio: 'pipe',
    });
    console.log('✓ Build completed');
  } catch (error) {
    console.error('❌ Build failed:', error);
    throw error;
  }

  console.log('🚀 Starting server...');
  serverProcess = spawn('node', [
    '--import', '@specific-dev/framework/telemetry',
    'dist/index.js'
  ], {
    cwd: '/app/code/backend',
    stdio: 'pipe',
    env: {
      ...process.env,
      PORT: '3000',
      NODE_ENV: 'test',
      // Don't set Supabase credentials - use dummy values for testing
    },
  });

  // Log server output for debugging
  serverProcess.stdout?.on('data', (data) => {
    console.log(`[SERVER] ${data}`);
  });

  serverProcess.stderr?.on('data', (data) => {
    console.error(`[SERVER] ${data}`);
  });

  serverProcess.on('error', (error) => {
    console.error('Server process error:', error);
  });

  // Wait for server to be ready
  await waitForServer();
}

async function stopServer(): Promise<void> {
  if (serverProcess) {
    console.log('🛑 Stopping server...');
    serverProcess.kill('SIGTERM');

    // Wait for process to exit with timeout
    await Promise.race([
      new Promise<void>((resolve) => {
        serverProcess!.on('exit', () => resolve());
      }),
      new Promise<void>((resolve) => {
        setTimeout(() => {
          serverProcess?.kill('SIGKILL');
          resolve();
        }, 5000);
      }),
    ]);

    serverProcess = null;
  }
}

describe('Integration Tests', () => {
  beforeAll(async () => {
    await startServer();
  }, { timeout: 60000 });

  afterAll(async () => {
    await stopServer();
  });

  describe('Health Check', () => {
    it('should return 200 on /api/health', async () => {
      const res = await api('/api/health');
      await expectStatus(res, 200);

      const data = await res.json() as any;
      expect(data.status).toBe('ok');
    });
  });

  describe('Protected Routes', () => {
    it('should return 401 on protected routes without token', async () => {
      const res = await api('/api/profiles');
      await expectStatus(res, 401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await api('/api/profiles', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });
      await expectStatus(res, 401);
    });
  });

  describe('Authentication Endpoints', () => {
    let authToken: string;
    let userId: string;

    it('should sign up a test user', async () => {
      const { token, user } = await signUpTestUser();
      authToken = token;
      userId = user.id;
      expect(token).toBeDefined();
      expect(user.id).toBeDefined();
    });

    it('should verify a valid token', async () => {
      const res = await authenticatedApi('/api/verify-token', authToken);
      await expectStatus(res, 200);

      const data = await res.json() as any;
      expect(data.user).toBeDefined();
      expect(data.user.id).toBeDefined();
      expect(data.authSource).toBeDefined();
    });

    it('should get current session', async () => {
      const res = await authenticatedApi('/api/session', authToken);
      await expectStatus(res, 200);

      const data = await res.json() as any;
      expect(data.user).toBeDefined();
      expect(data.user.id).toBeDefined();
    });

    it('should return 200 on /api/auth-health (no auth required)', async () => {
      const res = await api('/api/auth-health');
      await expectStatus(res, 200);
    });

    it('should get auth health check with authentication', async () => {
      const res = await authenticatedApi('/api/health/auth', authToken);
      await expectStatus(res, 200);

      const data = await res.json() as any;
      expect(data.status).toBeDefined();
      expect(data.authenticated).toBe(true);
      expect(data.userId).toBeDefined();
    });

    it('should sign out successfully', async () => {
      const res = await authenticatedApi('/api/sign-out', authToken, {
        method: 'POST',
      });
      await expectStatus(res, 200);

      const data = await res.json() as any;
      expect(data.message).toBeDefined();
    });
  });

  describe('User Profile', () => {
    let authToken: string;
    let userId: string;

    it('should sign up a test user', async () => {
      const { token, user } = await signUpTestUser();
      authToken = token;
      userId = user.id;
      expect(token).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
    });

    it('should get user profile', async () => {
      const res = await authenticatedApi('/api/user/profile', authToken);
      await expectStatus(res, 200);

      const data = await res.json() as any;
      expect(data).toBeDefined();
    });

    it('should update user profile', async () => {
      const res = await authenticatedApi('/api/user/profile', authToken, {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Test User',
          age: 28,
          favorite_color: 'blue',
          phone_number: '555-1234',
          favorite_food: 'pizza',
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json() as any;
      expect(data).toBeDefined();
    });

    it('should retrieve updated profile', async () => {
      const res = await authenticatedApi('/api/user/profile', authToken);
      await expectStatus(res, 200);

      const data = await res.json() as any;
      expect(data.age).toBe(28);
    });

    it('should complete user profile', async () => {
      const res = await authenticatedApi('/api/user/complete-profile', authToken, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Complete Profile User',
          age: 30,
        }),
      });
      await expectStatus(res, 200);
    });

    describe('Roster Profiles CRUD', () => {
      let profileId: string;

      it('should create a roster profile', async () => {
        const res = await authenticatedApi('/api/profiles', authToken, {
          method: 'POST',
          body: JSON.stringify({
            name: 'Alice Smith',
            age: 30,
            location: 'New York',
            birthday_month: 'January',
            birthday_day: 15,
            zodiac_sign: 'Capricorn',
            favorite_color: 'red',
            favorite_food: 'sushi',
            relationship_type: 'friend',
            how_we_met: 'college',
            phone_number: '555-9876',
            instagram: 'alice_smith',
            notes: 'Best friend from college',
          }),
        });
        await expectStatus(res, 201);

        const data = await res.json() as any;
        expect(data.id).toBeDefined();
        profileId = data.id;
      });

      it('should get all roster profiles', async () => {
        const res = await authenticatedApi('/api/profiles', authToken);
        await expectStatus(res, 200);

        const data = await res.json() as any;
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);
      });

      it('should filter profiles by relationship_type', async () => {
        const res = await authenticatedApi('/api/profiles?relationship_type=friend', authToken);
        await expectStatus(res, 200);

        const data = await res.json() as any;
        expect(Array.isArray(data)).toBe(true);
      });

      it('should update a roster profile', async () => {
        const res = await authenticatedApi(`/api/profiles/${profileId}`, authToken, {
          method: 'PUT',
          body: JSON.stringify({
            name: 'Alice Johnson',
            age: 31,
            favorite_color: 'purple',
          }),
        });
        await expectStatus(res, 200);

        const data = await res.json() as any;
        expect(data).toBeDefined();
      });

      it('should move profile to bench', async () => {
        const res = await authenticatedApi(`/api/profiles/${profileId}/bench`, authToken, {
          method: 'PUT',
          body: JSON.stringify({
            bench_reason: 'Not interested right now',
          }),
        });
        await expectStatus(res, 200);
      });

      it('should move profile to roster', async () => {
        const res = await authenticatedApi(`/api/profiles/${profileId}/roster`, authToken, {
          method: 'PUT',
        });
        await expectStatus(res, 200);
      });

      it('should add flag to profile', async () => {
        const res = await authenticatedApi(`/api/profiles/${profileId}/flags`, authToken, {
          method: 'POST',
          body: JSON.stringify({
            flag: 'important',
          }),
        });
        await expectStatus(res, 200);

        const data = await res.json() as any;
        expect(data).toBeDefined();
      });

      it('should delete a roster profile', async () => {
        const res = await authenticatedApi(`/api/profiles/${profileId}`, authToken, {
          method: 'DELETE',
        });
        await expectStatus(res, 200);
      });

      it('should return 404 for deleted profile', async () => {
        const res = await authenticatedApi(`/api/profiles/${profileId}`, authToken);
        await expectStatus(res, 404);
      });

      it('should create multiple profiles for filtering tests', async () => {
        const familyRes = await authenticatedApi('/api/profiles', authToken, {
          method: 'POST',
          body: JSON.stringify({
            name: 'Mom',
            relationship_type: 'family',
          }),
        });
        await expectStatus(familyRes, 201);

        const workRes = await authenticatedApi('/api/profiles', authToken, {
          method: 'POST',
          body: JSON.stringify({
            name: 'Bob Coworker',
            relationship_type: 'work',
          }),
        });
        await expectStatus(workRes, 201);
      });

      it('should filter by different relationship types', async () => {
        const familyRes = await authenticatedApi(
          '/api/profiles?relationship_type=family',
          authToken,
        );
        await expectStatus(familyRes, 200);
        const familyData = await familyRes.json() as any;
        expect(Array.isArray(familyData)).toBe(true);

        const workRes = await authenticatedApi(
          '/api/profiles?relationship_type=work',
          authToken,
        );
        await expectStatus(workRes, 200);
        const workData = await workRes.json() as any;
        expect(Array.isArray(workData)).toBe(true);
      });
    });
  });

  describe('File Uploads', () => {
    let authToken: string;

    it('should sign up a test user for uploads', async () => {
      const { token } = await signUpTestUser();
      authToken = token;
      expect(token).toBeDefined();
    });

    it('should upload profile image', async () => {
      const form = new FormData();
      form.append('file', createTestFile('profile.jpg', 'fake jpeg image data', 'image/jpeg'));

      const res = await authenticatedApi('/api/upload/profile-image', authToken, {
        method: 'POST',
        body: form,
      });
      await expectStatus(res, 200);

      const data = await res.json() as any;
      expect(data.url).toBeDefined();
      expect(typeof data.url).toBe('string');
    });

    it('should upload roster image', async () => {
      const form = new FormData();
      form.append('file', createTestFile('roster.png', 'fake png image data', 'image/png'));

      const res = await authenticatedApi('/api/upload/roster-image', authToken, {
        method: 'POST',
        body: form,
      });
      await expectStatus(res, 200);

      const data = await res.json() as any;
      expect(data.url).toBeDefined();
      expect(typeof data.url).toBe('string');
    });
  });

  describe('Dates Endpoint', () => {
    let authToken: string;

    it('should sign up a test user for dates', async () => {
      const { token } = await signUpTestUser();
      authToken = token;
      expect(token).toBeDefined();
    });

    it('should get profiles for dates', async () => {
      const res = await authenticatedApi('/api/dates', authToken);
      await expectStatus(res, 200);

      const data = await res.json() as any;
      expect(Array.isArray(data)).toBe(true);
    });

    it('should create a date entry', async () => {
      // Create a profile to use for dates
      const profileRes = await authenticatedApi('/api/profiles', authToken, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Date Candidate',
          relationship_type: 'date',
        }),
      });
      await expectStatus(profileRes, 201);
      const profile = await profileRes.json() as any;

      // Create a date entry
      const dateRes = await authenticatedApi('/api/dates', authToken, {
        method: 'POST',
        body: JSON.stringify({
          profile_id: profile.id,
          date: '2026-04-15',
        }),
      });
      await expectStatus(dateRes, 200, 201);
    });

    it('should update a date entry', async () => {
      // Get existing dates to find one to update
      const datesRes = await authenticatedApi('/api/dates', authToken);
      await expectStatus(datesRes, 200);
      const dates = await datesRes.json() as any;

      if (dates.length > 0) {
        const dateId = dates[0].id;
        const updateRes = await authenticatedApi(`/api/dates/${dateId}`, authToken, {
          method: 'PUT',
          body: JSON.stringify({
            date: '2026-04-20',
            notes: 'Updated date',
          }),
        });
        await expectStatus(updateRes, 200);
      }
    });

    it('should delete a date entry', async () => {
      // Get existing dates
      const datesRes = await authenticatedApi('/api/dates', authToken);
      await expectStatus(datesRes, 200);
      const dates = await datesRes.json() as any;

      if (dates.length > 0) {
        const dateId = dates[0].id;
        const deleteRes = await authenticatedApi(`/api/dates/${dateId}`, authToken, {
          method: 'DELETE',
        });
        await expectStatus(deleteRes, 200);
      }
    });
  });

  describe('Reminders Endpoint', () => {
    let authToken: string;
    let reminderId: string;

    it('should sign up a test user for reminders', async () => {
      const { token } = await signUpTestUser();
      authToken = token;
      expect(token).toBeDefined();
    });

    it('should get all reminders', async () => {
      const res = await authenticatedApi('/api/reminders', authToken);
      await expectStatus(res, 200);

      const data = await res.json() as any;
      expect(Array.isArray(data)).toBe(true);
    });

    it('should create a reminder', async () => {
      const res = await authenticatedApi('/api/reminders', authToken, {
        method: 'POST',
        body: JSON.stringify({
          title: 'Call Alice',
          description: 'Catch up with old friend',
          reminder_date: '2026-04-15',
        }),
      });
      await expectStatus(res, 200, 201);

      const data = await res.json() as any;
      if (data.id) {
        reminderId = data.id;
      }
    });

    it('should update a reminder', async () => {
      // Get reminders to find one to update
      const remindersRes = await authenticatedApi('/api/reminders', authToken);
      await expectStatus(remindersRes, 200);
      const reminders = await remindersRes.json() as any;

      if (reminders.length > 0) {
        const id = reminders[0].id;
        const updateRes = await authenticatedApi(`/api/reminders/${id}`, authToken, {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Updated Reminder',
            description: 'Updated description',
          }),
        });
        await expectStatus(updateRes, 200);
      }
    });

    it('should delete a reminder', async () => {
      // Get reminders
      const remindersRes = await authenticatedApi('/api/reminders', authToken);
      await expectStatus(remindersRes, 200);
      const reminders = await remindersRes.json() as any;

      if (reminders.length > 0) {
        const id = reminders[0].id;
        const deleteRes = await authenticatedApi(`/api/reminders/${id}`, authToken, {
          method: 'DELETE',
        });
        await expectStatus(deleteRes, 200);
      }
    });
  });

  describe('Analytics Endpoint', () => {
    let authToken: string;

    it('should sign up a test user for analytics', async () => {
      const { token } = await signUpTestUser();
      authToken = token;
      expect(token).toBeDefined();
    });

    it('should get analytics', async () => {
      const res = await authenticatedApi('/api/analytics', authToken);
      await expectStatus(res, 200);

      const data = await res.json() as any;
      expect(data).toBeDefined();
    });
  });

  describe('Nudges Endpoint', () => {
    let authToken: string;

    it('should sign up a test user for nudges', async () => {
      const { token } = await signUpTestUser();
      authToken = token;
      expect(token).toBeDefined();
    });

    it('should get nudges', async () => {
      const res = await authenticatedApi('/api/nudges', authToken);
      await expectStatus(res, 200);

      const data = await res.json() as any;
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Profiles by Code', () => {
    let authToken: string;

    it('should sign up a test user', async () => {
      const { token } = await signUpTestUser();
      authToken = token;
      expect(token).toBeDefined();
    });

    it('should get profiles by code', async () => {
      const res = await authenticatedApi('/api/profiles/by-code', authToken);
      await expectStatus(res, 200);

      const data = await res.json() as any;
      expect(data).toBeDefined();
    });
  });

  describe('Flags Management', () => {
    let authToken: string;
    let profileId: string;
    let flagId: string;

    it('should sign up a test user', async () => {
      const { token } = await signUpTestUser();
      authToken = token;
      expect(token).toBeDefined();
    });

    it('should create a profile for flagging', async () => {
      const res = await authenticatedApi('/api/profiles', authToken, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Flagged Profile',
        }),
      });
      await expectStatus(res, 201);

      const data = await res.json() as any;
      profileId = data.id;
    });

    it('should add a flag to profile', async () => {
      const res = await authenticatedApi(`/api/profiles/${profileId}/flags`, authToken, {
        method: 'POST',
        body: JSON.stringify({
          flag: 'important',
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json() as any;
      if (data.id) {
        flagId = data.id;
      }
    });

    it('should delete a flag', async () => {
      if (flagId) {
        const res = await authenticatedApi(`/api/flags/${flagId}`, authToken, {
          method: 'DELETE',
        });
        await expectStatus(res, 200);
      }
    });
  });

  describe('Coaching History', () => {
    let authToken: string;

    it('should sign up a test user', async () => {
      const { token } = await signUpTestUser();
      authToken = token;
      expect(token).toBeDefined();
    });

    it('should get coaching history', async () => {
      const res = await authenticatedApi('/api/coaching/history', authToken);
      await expectStatus(res, 200);

      const data = await res.json() as any;
      expect(Array.isArray(data)).toBe(true);
    });

    it('should create coaching history entry', async () => {
      const res = await authenticatedApi('/api/coaching/history', authToken, {
        method: 'POST',
        body: JSON.stringify({
          title: 'First coaching session',
          notes: 'Discussed dating strategy',
        }),
      });
      await expectStatus(res, 200, 201);
    });

    it('should delete coaching history', async () => {
      const res = await authenticatedApi('/api/coaching/history', authToken, {
        method: 'DELETE',
      });
      await expectStatus(res, 200);
    });
  });

  describe('Negative Cases', () => {
    let authToken: string;

    it('should sign up a test user for negative tests', async () => {
      const { token } = await signUpTestUser();
      authToken = token;
      expect(token).toBeDefined();
    });

    it('should return 404 for nonexistent profile', async () => {
      const res = await authenticatedApi(
        '/api/profiles/00000000-0000-0000-0000-000000000000',
        authToken,
      );
      await expectStatus(res, 404);
    });

    it('should reject profile creation without required name field', async () => {
      const res = await authenticatedApi('/api/profiles', authToken, {
        method: 'POST',
        body: JSON.stringify({
          age: 25,
          // Missing required 'name' field
        }),
      });
      await expectStatus(res, 400);
    });

    it('should handle malformed JSON gracefully', async () => {
      const res = await authenticatedApi('/api/profiles', authToken, {
        method: 'POST',
        body: 'invalid json {',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      await expectStatus(res, 400);
    });

    it('should return 404 for nonexistent reminder', async () => {
      const res = await authenticatedApi(
        '/api/reminders/00000000-0000-0000-0000-000000000000',
        authToken,
      );
      await expectStatus(res, 404);
    });

    it('should return 404 for nonexistent date', async () => {
      const res = await authenticatedApi(
        '/api/dates/00000000-0000-0000-0000-000000000000',
        authToken,
      );
      await expectStatus(res, 404);
    });
  });
});
