
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import { authClient, storeWebBearerToken } from "@/lib/auth";
import { useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BEARER_TOKEN_KEY = "roster-app_bearer_token";

function openOAuthPopup(provider: string) {
  const width = 500;
  const height = 600;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  
  const popup = window.open(
    `/auth-popup?provider=${provider}`,
    `${provider}-auth`,
    `width=${width},height=${height},left=${left},top=${top}`
  );
  
  return new Promise<void>((resolve, reject) => {
    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(checkPopup);
        reject(new Error('Popup closed'));
      }
    }, 1000);

    window.addEventListener('message', (event) => {
      if (event.data.type === 'auth-success') {
        clearInterval(checkPopup);
        if (popup) popup.close();
        resolve();
      } else if (event.data.type === 'auth-error') {
        clearInterval(checkPopup);
        if (popup) popup.close();
        reject(new Error(event.data.error));
      }
    });
  });
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    fetchUser();
  }, []);

  // Protected route navigation
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated and not in auth screens
      console.log('[AuthContext] Not authenticated, redirecting to login');
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // Redirect to home if authenticated and in auth screens
      console.log('[AuthContext] Authenticated in auth screen, redirecting to home');
      router.replace('/(tabs)/(home)/');
    }
  }, [user, loading, segments]);

  const fetchUser = async () => {
    try {
      console.log('[AuthContext] Fetching user session...');
      const session = await authClient.getSession();
      console.log('[AuthContext] Session:', session);
      
      if (session?.user) {
        console.log('[AuthContext] User authenticated:', session.user.email);
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
        });
        
        // Store bearer token for API calls
        if (session.session?.token) {
          console.log('[AuthContext] Storing bearer token for API calls');
          if (Platform.OS === 'web') {
            localStorage.setItem(BEARER_TOKEN_KEY, session.session.token);
          } else {
            await SecureStore.setItemAsync(BEARER_TOKEN_KEY, session.session.token);
          }
        }
      } else {
        console.log('[AuthContext] No active session');
        setUser(null);
      }
    } catch (error) {
      console.error('[AuthContext] Error fetching user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Signing in with email:', email);
      const result = await authClient.signIn.email({
        email,
        password,
      });
      
      console.log('[AuthContext] Sign in result:', result);
      
      if (result.error) {
        console.error('[AuthContext] Sign in error from API:', result.error);
        throw new Error(result.error.message || 'Login failed');
      }
      
      // Store bearer token
      if (result.data?.session?.token) {
        console.log('[AuthContext] Storing bearer token from sign in');
        if (Platform.OS === 'web') {
          localStorage.setItem(BEARER_TOKEN_KEY, result.data.session.token);
        } else {
          await SecureStore.setItemAsync(BEARER_TOKEN_KEY, result.data.session.token);
        }
      }
      
      // Update user state immediately
      if (result.data?.user) {
        console.log('[AuthContext] Setting user state after login');
        setUser({
          id: result.data.user.id,
          email: result.data.user.email,
          name: result.data.user.name,
          image: result.data.user.image,
        });
      }
      
      console.log('[AuthContext] Sign in successful, navigating to home');
      // Navigation will be handled by the useEffect hook
    } catch (error) {
      console.error('[AuthContext] Sign in error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    try {
      console.log('[AuthContext] Signing up with email:', email);
      const result = await authClient.signUp.email({
        email,
        password,
        name: name || email.split('@')[0],
      });
      
      console.log('[AuthContext] Sign up result:', result);
      
      if (result.error) {
        console.error('[AuthContext] Sign up error from API:', result.error);
        throw new Error(result.error.message || 'Sign up failed');
      }
      
      // Store bearer token
      if (result.data?.session?.token) {
        console.log('[AuthContext] Storing bearer token from sign up');
        if (Platform.OS === 'web') {
          localStorage.setItem(BEARER_TOKEN_KEY, result.data.session.token);
        } else {
          await SecureStore.setItemAsync(BEARER_TOKEN_KEY, result.data.session.token);
        }
      }
      
      // Update user state immediately
      if (result.data?.user) {
        console.log('[AuthContext] Setting user state after signup');
        setUser({
          id: result.data.user.id,
          email: result.data.user.email,
          name: result.data.user.name,
          image: result.data.user.image,
        });
      }
      
      console.log('[AuthContext] Sign up successful, navigating to home');
      // Navigation will be handled by the useEffect hook
    } catch (error) {
      console.error('[AuthContext] Sign up error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('[AuthContext] Signing in with Google...');
      if (Platform.OS === 'web') {
        await openOAuthPopup('google');
        await fetchUser();
      } else {
        await authClient.signIn.social({
          provider: 'google',
        });
        await fetchUser();
      }
      console.log('[AuthContext] Google sign in successful');
    } catch (error) {
      console.error('[AuthContext] Google sign in error:', error);
      throw error;
    }
  };

  const signInWithApple = async () => {
    try {
      console.log('[AuthContext] Signing in with Apple...');
      if (Platform.OS === 'web') {
        await openOAuthPopup('apple');
        await fetchUser();
      } else {
        await authClient.signIn.social({
          provider: 'apple',
        });
        await fetchUser();
      }
      console.log('[AuthContext] Apple sign in successful');
    } catch (error) {
      console.error('[AuthContext] Apple sign in error:', error);
      throw error;
    }
  };

  const signInWithGitHub = async () => {
    try {
      console.log('[AuthContext] Signing in with GitHub...');
      if (Platform.OS === 'web') {
        await openOAuthPopup('github');
        await fetchUser();
      } else {
        await authClient.signIn.social({
          provider: 'github',
        });
        await fetchUser();
      }
      console.log('[AuthContext] GitHub sign in successful');
    } catch (error) {
      console.error('[AuthContext] GitHub sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('[AuthContext] Signing out...');
      await authClient.signOut();
      
      // Clear bearer token
      if (Platform.OS === 'web') {
        localStorage.removeItem(BEARER_TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(BEARER_TOKEN_KEY);
      }
      
      setUser(null);
      router.replace('/auth/login');
      console.log('[AuthContext] Sign out successful');
    } catch (error) {
      console.error('[AuthContext] Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithApple,
        signInWithGitHub,
        signOut,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
