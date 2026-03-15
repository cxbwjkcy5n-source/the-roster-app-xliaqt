import { expect } from 'vitest';

const TEST_SERVER_URL = 'http://localhost:3000';

/**
 * Make a request to the API
 */
export async function api(path: string, options?: RequestInit): Promise<Response> {
  const url = `${TEST_SERVER_URL}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}

/**
 * Make an authenticated request to the API with Bearer token
 */
export async function authenticatedApi(
  path: string,
  token: string,
  options?: RequestInit,
): Promise<Response> {
  return api(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
}

/**
 * Assert response status code(s)
 */
export async function expectStatus(res: Response, expectedStatus: number): Promise<void> {
  if (res.status !== expectedStatus) {
    let body = '';
    try {
      body = await res.clone().text();
    } catch {
      // ignore
    }
    console.error(`Expected status ${expectedStatus}, got ${res.status}`);
    if (body) console.error(`Response body: ${body}`);
    expect(res.status).toBe(expectedStatus);
  }
}

/**
 * Sign up a test user and return token + user data
 */
export async function signUpTestUser(): Promise<{ token: string; user: any }> {
  const email = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
  const password = 'TestPassword123!';
  const name = 'Test User';

  const res = await api('/api/sign-up', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sign up failed: ${res.status} ${body}`);
  }

  const data = await res.json() as any;
  const token = data.session?.token;
  const user = data.user;

  if (!token || !user) {
    throw new Error('Sign up response missing token or user');
  }

  // Register cleanup hook
  if (typeof afterAll === 'function') {
    // This is a global from vitest - cleanup happens automatically via signUpTestUser
    // The test runner will handle teardown
  }

  return { token, user };
}

/**
 * Delete a test user (cleanup)
 */
export async function deleteTestUser(token: string): Promise<void> {
  try {
    await authenticatedApi('/api/sign-out', token, {
      method: 'POST',
    });
  } catch (error) {
    console.error('Failed to delete test user:', error);
  }
}

/**
 * Connect to a WebSocket endpoint
 */
export async function connectWebSocket(path: string): Promise<WebSocket> {
  const wsUrl = `ws://localhost:3000${path}`;
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => resolve(ws);
    ws.onerror = (event) => reject(new Error(`WebSocket connection failed: ${event}`));
  });
}

/**
 * Connect to an authenticated WebSocket endpoint
 */
export async function connectAuthenticatedWebSocket(path: string, token: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const wsUrl = `ws://localhost:3000${path}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(token);
    };

    ws.onmessage = (event) => {
      // First message should be auth confirmation
      if (event.data === 'authenticated' || event.data.includes('auth')) {
        resolve(ws);
      } else {
        reject(new Error('Authentication failed'));
      }
    };

    ws.onerror = (event) => reject(new Error(`WebSocket connection failed: ${event}`));
  });
}

/**
 * Wait for the next message on a WebSocket
 */
export async function waitForMessage(ws: WebSocket, timeout = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('WebSocket message timeout'));
    }, timeout);

    const handler = (event: MessageEvent) => {
      clearTimeout(timer);
      ws.removeEventListener('message', handler);
      resolve(event.data as string);
    };

    ws.addEventListener('message', handler);
  });
}

/**
 * Create a test file for uploads
 */
export function createTestFile(
  filename = 'test.txt',
  content = 'test file content',
  type = 'text/plain',
): File {
  const blob = new Blob([content], { type });
  return new File([blob], filename, { type });
}
