
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
          return localStorage.getItem(key);
        } catch (error) {
          console.error('[Auth] localStorage.getItem error:', error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('[Auth] localStorage.setItem error:', error);
        }
      },
      deleteItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('[Auth] localStorage.deleteItem error:', error);
        }
      },
    }
  : SecureStore;

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: "theroster",
      storagePrefix: "roster-app",
      storage,
    }),
  ],
  // On web, use bearer token for authenticated requests
  ...(Platform.OS === "web" && {
    fetchOptions: {
      auth: {
        type: "Bearer" as const,
        token: () => {
          try {
            return localStorage.getItem(BEARER_TOKEN_KEY) || "";
          } catch (error) {
            console.error('[Auth] Error getting bearer token:', error);
            return "";
          }
        },
      },
    },
  }),
});

export function storeWebBearerToken(token: string) {
  if (Platform.OS === "web") {
    try {
      localStorage.setItem(BEARER_TOKEN_KEY, token);
      console.log('[Auth] Bearer token stored for web');
    } catch (error) {
      console.error('[Auth] Error storing bearer token:', error);
    }
  }
}

export function clearAuthTokens() {
  if (Platform.OS === "web") {
    try {
      localStorage.removeItem(BEARER_TOKEN_KEY);
      console.log('[Auth] Bearer token cleared for web');
    } catch (error) {
      console.error('[Auth] Error clearing bearer token:', error);
    }
  }
}

export { API_URL };
