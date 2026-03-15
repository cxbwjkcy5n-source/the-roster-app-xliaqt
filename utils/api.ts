
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

export const BACKEND_URL =
  Constants.expoConfig?.extra?.backendUrl ||
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  'https://svuaszgx5v6c3k9w6qqku44nfpjn3782.app.specular.dev';

console.log('[API] Backend URL:', BACKEND_URL);
console.log('[API] Platform:', Platform.OS);

// Helper to get auth headers with Supabase token
async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      console.log('[API] Using Supabase access token for authentication');
      return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };
    }
    
    console.log('[API] No Supabase session found');
    return {
      'Content-Type': 'application/json',
    };
  } catch (error) {
    console.error('[API] Error getting auth headers:', error);
    return {
      'Content-Type': 'application/json',
    };
  }
}

// Authenticated GET request
export async function authenticatedGet(endpoint: string) {
  try {
    console.log('[API] GET request to:', endpoint);
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'GET',
      headers,
      credentials: Platform.OS === 'web' ? 'include' : 'same-origin',
    });

    console.log('[API] GET response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] GET error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('[API] GET response data received');
    return data;
  } catch (error) {
    console.error('[API] GET request failed:', error);
    throw error;
  }
}

// Authenticated POST request
export async function authenticatedPost(endpoint: string, body: any) {
  try {
    console.log('[API] POST request to:', endpoint);
    console.log('[API] POST body:', JSON.stringify(body));
    const headers = await getAuthHeaders();

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers,
      credentials: Platform.OS === 'web' ? 'include' : 'same-origin',
      body: JSON.stringify(body),
    });

    console.log('[API] POST response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] POST error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('[API] POST response data received');
    return data;
  } catch (error) {
    console.error('[API] POST request failed:', error);
    throw error;
  }
}

// Authenticated PUT request
export async function authenticatedPut(endpoint: string, body: any) {
  try {
    console.log('[API] PUT request to:', endpoint);
    console.log('[API] PUT body:', JSON.stringify(body));
    const headers = await getAuthHeaders();

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      credentials: Platform.OS === 'web' ? 'include' : 'same-origin',
      body: JSON.stringify(body),
    });

    console.log('[API] PUT response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] PUT error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('[API] PUT response data received');
    return data;
  } catch (error) {
    console.error('[API] PUT request failed:', error);
    throw error;
  }
}

// Authenticated DELETE request
export async function authenticatedDelete(endpoint: string) {
  try {
    console.log('[API] DELETE request to:', endpoint);
    const headers = await getAuthHeaders();

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
      credentials: Platform.OS === 'web' ? 'include' : 'same-origin',
    });

    console.log('[API] DELETE response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] DELETE error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // DELETE might return empty response
    const text = await response.text();
    if (text) {
      const data = JSON.parse(text);
      console.log('[API] DELETE response data received');
      return data;
    }
    
    console.log('[API] DELETE successful (no response body)');
    return { success: true };
  } catch (error) {
    console.error('[API] DELETE request failed:', error);
    throw error;
  }
}
