
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
  firstLoginCompleted?: boolean;
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
  markFirstLoginComplete: () => Promise<void>;
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

  // Protected route navigation - simplified
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    console.log('[AuthContext] Navigation check - user:', !!user, 'inAuthGroup:', inAuthGroup, 'segments:', segments);

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated and not in auth screens
      console.log('[AuthContext] Not authenticated, redirecting to login');
      router.replace('/auth/login');
    }
  }, [user, loading, segments]);

  const fetchUser = async () => {
    try {
      console.log('[AuthContext] Fetching user session...');
      const session = await authClient.getSession();
      console.log('[AuthContext] Session:', JSON.stringify(session, null, 2));
      
      if (session?.user) {
        console.log('[AuthContext] User authenticated:', session.user.email);
        
        // Store bearer token for API calls
        if (session.session?.token) {
          console.log('[AuthContext] Storing bearer token for API calls');
          if (Platform.OS === 'web') {
            localStorage.setItem(BEARER_TOKEN_KEY, session.session.token);
          } else {
            await SecureStore.setItemAsync(BEARER_TOKEN_KEY, session.session.token);
          }
        }

        // Try to fetch additional user info including firstLoginCompleted flag
        let firstLoginCompleted = true; // Default to true
        let profileData: any = {};
        
        try {
          const { BACKEND_URL } = await import('@/utils/api');
          const token = session.session?.token;
          
          if (token) {
            console.log('[AuthContext] Fetching profile status from backend...');
            
            // Try to fetch from /api/user/profile-status first (lightweight endpoint)
            const statusResponse = await fetch(`${BACKEND_URL}/api/user/profile-status`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              console.log('[AuthContext] Profile status from backend:', statusData);
              firstLoginCompleted = statusData.profileCompleted !== false;
            } else {
              console.log('[AuthContext] Profile status endpoint returned:', statusResponse.status);
            }
            
            // Also try to fetch full profile data
            console.log('[AuthContext] Fetching full profile data from backend...');
            const profileResponse = await fetch(`${BACKEND_URL}/api/user/profile`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            
            if (profileResponse.ok) {
              profileData = await profileResponse.json();
              console.log('[AuthContext] Profile data from backend:', profileData);
            } else {
              console.log('[AuthContext] Profile endpoint returned:', profileResponse.status);
            }
          }
        } catch (error) {
          console.error('[AuthContext] Error fetching user data from backend:', error);
          // Continue with session data only
        }
        
        // Set user with all available data
        const userData: User = {
          id: session.user.id,
          email: session.user.email,
          name: profileData.name || session.user.name,
          image: profileData.image || session.user.image,
          firstLoginCompleted,
        };
        
        console.log('[AuthContext] Setting user data:', userData);
        setUser(userData);
      } else {
        console.log('[AuthContext] No active session');
        setUser(null);
      }
    } catch (error) {
      console.error('[AuthContext] Error fetching user:', error);
      setUser(null);
    } finally {
      console.log('[AuthContext] Fetch user complete, setting loading to false');
      setLoading(false);
    }
  };

  const markFirstLoginComplete = async () => {
    try {
      console.log('[AuthContext] Marking first login as complete...');
      const { BACKEND_URL } = await import('@/utils/api');
      
      // Get bearer token
      let token: string | null = null;
      if (Platform.OS === 'web') {
        token = localStorage.getItem(BEARER_TOKEN_KEY);
      } else {
        token = await SecureStore.getItemAsync(BEARER_TOKEN_KEY);
      }

      if (!token) {
        console.error('[AuthContext] No bearer token found');
        return;
      }

      // Call the complete-profile endpoint
      const response = await fetch(`${BACKEND_URL}/api/user/complete-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[AuthContext] First login marked as complete:', result);
        
        // Update user state
        setUser(prev => prev ? { ...prev, firstLoginCompleted: true } : null);
        
        // Navigate to home
        router.replace('/(tabs)/(home)/');
      } else {
        console.error('[AuthContext] Failed to mark first login complete:', response.status);
      }
    } catch (error) {
      console.error('[AuthContext] Error marking first login complete:', error);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Signing in with email:', email);
      const result = await authClient.signIn.email({
        email,
        password,
      });
      
      console.log('[AuthContext] Sign in result:', JSON.stringify(result, null, 2));
      
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
      
      console.log('[AuthContext] Sign in successful, fetching user data...');
      // Fetch user data to get firstLoginCompleted flag
      await fetchUser();
      
      console.log('[AuthContext] User data fetched, checking first login status...');
      
      // After fetching user, check if it's first login and navigate accordingly
      if (user?.firstLoginCompleted === false) {
        console.log('[AuthContext] First login detected, redirecting to profile');
        router.replace('/(tabs)/profile');
      } else {
        console.log('[AuthContext] Regular login, redirecting to home');
        router.replace('/(tabs)/(home)/');
      }
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
      
      console.log('[AuthContext] Sign up result:', JSON.stringify(result, null, 2));
      
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
      
      console.log('[AuthContext] Sign up successful, fetching user data...');
      // Fetch user data
      await fetchUser();
      
      console.log('[AuthContext] User data fetched, redirecting to profile for first login');
      // New users should always go to profile first
      router.replace('/(tabs)/profile');
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
        router.replace('/(tabs)/(home)/');
      } else {
        await authClient.signIn.social({
          provider: 'google',
        });
        await fetchUser();
        router.replace('/(tabs)/(home)/');
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
        router.replace('/(tabs)/(home)/');
      } else {
        await authClient.signIn.social({
          provider: 'apple',
        });
        await fetchUser();
        router.replace('/(tabs)/(home)/');
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
        router.replace('/(tabs)/(home)/');
      } else {
        await authClient.signIn.social({
          provider: 'github',
        });
        await fetchUser();
        router.replace('/(tabs)/(home)/');
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
        markFirstLoginComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
