
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'https://e5t37cpd78kyyr4rpqkxse5t4eh3mvw3.app.specular.dev';

console.log('[API] Backend URL:', BACKEND_URL);
console.log('[API] Platform:', Platform.OS);

const BEARER_TOKEN_KEY = 'roster-app_bearer_token';

async function getAuthToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(BEARER_TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(BEARER_TOKEN_KEY);
    }
  } catch (error) {
    console.error('[API] Error getting auth token:', error);
    return null;
  }
}

export async function authenticatedGet(endpoint: string) {
  const token = await getAuthToken();
  const url = `${BACKEND_URL}${endpoint}`;
  
  console.log('[API] GET request:', url);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: Platform.OS === 'web' ? 'include' : 'same-origin',
    });

    console.log('[API] GET response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] GET error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[API] GET request failed:', error);
    throw error;
  }
}

export async function authenticatedPost(endpoint: string, body: any) {
  const token = await getAuthToken();
  const url = `${BACKEND_URL}${endpoint}`;
  
  console.log('[API] POST request:', url, body);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: Platform.OS === 'web' ? 'include' : 'same-origin',
    });

    console.log('[API] POST response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] POST error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[API] POST request failed:', error);
    throw error;
  }
}

export async function authenticatedPut(endpoint: string, body: any) {
  const token = await getAuthToken();
  const url = `${BACKEND_URL}${endpoint}`;
  
  console.log('[API] PUT request:', url, body);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
      credentials: Platform.OS === 'web' ? 'include' : 'same-origin',
    });

    console.log('[API] PUT response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] PUT error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[API] PUT request failed:', error);
    throw error;
  }
}

export async function authenticatedDelete(endpoint: string) {
  const token = await getAuthToken();
  const url = `${BACKEND_URL}${endpoint}`;
  
  console.log('[API] DELETE request:', url);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      credentials: Platform.OS === 'web' ? 'include' : 'same-origin',
    });

    console.log('[API] DELETE response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] DELETE error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[API] DELETE request failed:', error);
    throw error;
  }
}
