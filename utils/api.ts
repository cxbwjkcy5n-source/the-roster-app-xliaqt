
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'https://e5t37cpd78kyyr4rpqkxse5t4eh3mvw3.app.specular.dev';

const BEARER_TOKEN_KEY = 'roster-app_bearer_token';

export async function getBearerToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      // On web, better-auth uses cookies, so we don't need a bearer token
      return null;
    } else {
      // On native, get the bearer token from secure storage
      return await SecureStore.getItemAsync(BEARER_TOKEN_KEY);
    }
  } catch (error) {
    console.error('[API] Error getting bearer token:', error);
    return null;
  }
}

export async function authenticatedGet(endpoint: string) {
  console.log('[API] GET request to:', endpoint);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // On native, add bearer token; on web, cookies are sent automatically
  if (Platform.OS !== 'web') {
    const token = await getBearerToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: 'GET',
    headers,
    credentials: Platform.OS === 'web' ? 'include' : 'same-origin',
  });
  
  console.log('[API] GET response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[API] GET error response:', errorText);
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }
  
  return response.json();
}

export async function authenticatedPost(endpoint: string, data: any) {
  console.log('[API] POST request to:', endpoint, 'with data:', data);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // On native, add bearer token; on web, cookies are sent automatically
  if (Platform.OS !== 'web') {
    const token = await getBearerToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: 'POST',
    headers,
    credentials: Platform.OS === 'web' ? 'include' : 'same-origin',
    body: JSON.stringify(data),
  });
  
  console.log('[API] POST response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[API] POST error response:', errorText);
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }
  
  return response.json();
}

export async function authenticatedPut(endpoint: string, data: any) {
  console.log('[API] PUT request to:', endpoint, 'with data:', data);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // On native, add bearer token; on web, cookies are sent automatically
  if (Platform.OS !== 'web') {
    const token = await getBearerToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: 'PUT',
    headers,
    credentials: Platform.OS === 'web' ? 'include' : 'same-origin',
    body: JSON.stringify(data),
  });
  
  console.log('[API] PUT response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[API] PUT error response:', errorText);
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }
  
  return response.json();
}

export async function authenticatedDelete(endpoint: string) {
  console.log('[API] DELETE request to:', endpoint);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // On native, add bearer token; on web, cookies are sent automatically
  if (Platform.OS !== 'web') {
    const token = await getBearerToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: 'DELETE',
    headers,
    credentials: Platform.OS === 'web' ? 'include' : 'same-origin',
  });
  
  console.log('[API] DELETE response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[API] DELETE error response:', errorText);
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }
  
  return response.json();
}
