
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Read backend URL from app.json configuration
const API_URL = Constants.expoConfig?.extra?.backendUrl || "https://e5t37cpd78kyyr4rpqkxse5t4eh3mvw3.app.specular.dev";

console.log('[Auth] Backend URL configured:', API_URL);
console.log('[Auth] Platform:', Platform.OS);

const BEARER_TOKEN_KEY = "roster-app_bearer_token";

// Platform-specific storage: localStorage for web, SecureStore for native
const storage = Platform.OS === "web"
  ? {
      getItem: (key: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            return localStorage.getItem(key);
          }
          return null;
        } catch (error) {
          console.error('[Auth] localStorage.getItem error:', error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(key, value);
          }
        } catch (error) {
          console.error('[Auth] localStorage.setItem error:', error);
        }
      },
      deleteItem: (key: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          console.error('[Auth] localStorage.deleteItem error:', error);
        }
      },
    }
  : SecureStore;

// Create auth client with platform-specific configuration
export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: "theroster",
      storagePrefix: "roster-app",
      storage,
    }),
  ],
  // On web, better-auth uses cookies by default, so we need to ensure credentials are included
  fetchOptions: Platform.OS === "web" ? {
    credentials: "include" as RequestCredentials,
  } : undefined,
});

export function storeWebBearerToken(token: string) {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(BEARER_TOKEN_KEY, token);
        console.log('[Auth] Bearer token stored for web');
      }
    } catch (error) {
      console.error('[Auth] Error storing bearer token:', error);
    }
  }
}

export function clearAuthTokens() {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(BEARER_TOKEN_KEY);
        console.log('[Auth] Bearer token cleared for web');
      }
    } catch (error) {
      console.error('[Auth] Error clearing bearer token:', error);
    }
  }
}

export { API_URL };
