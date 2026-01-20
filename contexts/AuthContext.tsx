
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";
import { Platform, Alert } from "react-native";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useRouter, useSegments } from "expo-router";
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

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
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
  markFirstLoginComplete: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  const isNavigatingRef = useRef(false);

  // Convert Supabase user to our User type
  const mapSupabaseUser = useCallback(async (supabaseUser: SupabaseUser | null): Promise<User | null> => {
    if (!supabaseUser) return null;

    console.log('[AuthContext] Mapping Supabase user:', supabaseUser.email);

    // Try to fetch user profile from backend
    let profileData: any = {};
    let firstLoginCompleted = true;

    try {
      const { BACKEND_URL } = await import('@/utils/api');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        console.log('[AuthContext] Fetching profile from backend with token...');
        
        const headers: HeadersInit = {
          'Authorization': `Bearer ${session.access_token}`,
        };

        // Fetch profile status
        try {
          const statusResponse = await fetch(`${BACKEND_URL}/api/user/profile-status`, {
            headers,
          });

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('[AuthContext] Profile status:', statusData);
            firstLoginCompleted = statusData.profileCompleted !== false;
          } else {
            console.log('[AuthContext] Profile status check returned:', statusResponse.status);
          }
        } catch (statusError) {
          console.log('[AuthContext] Could not fetch profile status:', statusError);
        }

        // Fetch full profile
        try {
          const profileResponse = await fetch(`${BACKEND_URL}/api/user/profile`, {
            headers,
          });

          if (profileResponse.ok) {
            profileData = await profileResponse.json();
            console.log('[AuthContext] Profile data fetched successfully');
          } else {
            console.log('[AuthContext] Profile fetch returned:', profileResponse.status);
          }
        } catch (profileError) {
          console.log('[AuthContext] Could not fetch profile:', profileError);
        }
      }
    } catch (error) {
      console.log('[AuthContext] Error fetching profile (non-critical):', error);
    }

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: profileData.name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0],
      image: profileData.image || supabaseUser.user_metadata?.avatar_url,
      firstLoginCompleted,
    };
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      console.log('[AuthContext] Fetching user session from Supabase...');
      
      if (!isSupabaseConfigured()) {
        console.warn('[AuthContext] Supabase is not configured. Please add SUPABASE_URL and SUPABASE_ANON_KEY to .env or app.json');
        setUser(null);
        setLoading(false);
        return;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[AuthContext] Error fetching session:', error);
        setUser(null);
      } else if (session?.user) {
        console.log('[AuthContext] User authenticated:', session.user.email);
        const mappedUser = await mapSupabaseUser(session.user);
        setUser(mappedUser);
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
  }, [mapSupabaseUser]);

  useEffect(() => {
    fetchUser();

    // Listen for auth state changes
    console.log('[AuthContext] Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state changed:', event);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const mappedUser = await mapSupabaseUser(session?.user || null);
        setUser(mappedUser);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      console.log('[AuthContext] Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, [fetchUser, mapSupabaseUser]);

  // Protected route navigation
  useEffect(() => {
    if (loading) {
      console.log('[AuthContext] Still loading, skipping navigation check');
      return;
    }

    if (isNavigatingRef.current) {
      console.log('[AuthContext] Navigation in progress, skipping redirect');
      return;
    }

    const inAuthGroup = segments[0] === 'auth';

    console.log('[AuthContext] Navigation check - user:', !!user, 'inAuthGroup:', inAuthGroup, 'segments:', segments);

    if (!user && !inAuthGroup) {
      console.log('[AuthContext] Not authenticated, redirecting to login');
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      console.log('[AuthContext] User authenticated but on auth screen, redirecting to home');
      router.replace('/(tabs)/(home)/');
    }
  }, [user, loading, segments, router]);

  const markFirstLoginComplete = async () => {
    try {
      console.log('[AuthContext] Marking first login as complete...');
      const { BACKEND_URL } = await import('@/utils/api');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        console.error('[AuthContext] No access token found');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/user/complete-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        console.log('[AuthContext] First login marked as complete');
        setUser(prev => prev ? { ...prev, firstLoginCompleted: true } : null);
        
        isNavigatingRef.current = true;
        router.replace('/(tabs)/(home)/');
        setTimeout(() => { isNavigatingRef.current = false; }, 1000);
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
      
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured. Please add SUPABASE_URL and SUPABASE_ANON_KEY to .env or app.json');
      }

      isNavigatingRef.current = true;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthContext] Sign in error:', error);
        isNavigatingRef.current = false;
        throw error;
      }

      console.log('[AuthContext] Sign in successful');
      const mappedUser = await mapSupabaseUser(data.user);
      setUser(mappedUser);

      // Navigate based on first login status
      if (mappedUser?.firstLoginCompleted === false) {
        console.log('[AuthContext] First login detected, redirecting to profile');
        router.replace('/(tabs)/profile');
      } else {
        console.log('[AuthContext] Regular login, redirecting to home');
        router.replace('/(tabs)/(home)/');
      }

      setTimeout(() => { isNavigatingRef.current = false; }, 1000);
    } catch (error) {
      console.error('[AuthContext] Sign in error:', error);
      isNavigatingRef.current = false;
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    try {
      console.log('[AuthContext] Signing up with email:', email);
      
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured. Please add SUPABASE_URL and SUPABASE_ANON_KEY to .env or app.json');
      }

      isNavigatingRef.current = true;

      // Configure redirect URL for email verification
      const redirectUrl = Platform.OS === 'web'
        ? `${window.location.origin}/auth-callback`
        : 'theroster://auth-callback';

      console.log('[AuthContext] Sign up redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error('[AuthContext] Sign up error:', error);
        isNavigatingRef.current = false;
        throw error;
      }

      console.log('[AuthContext] Sign up successful');
      
      // Check if email confirmation is required
      if (data.user && !data.session) {
        console.log('[AuthContext] Email confirmation required');
        Alert.alert(
          'Verify your email',
          'Please check your email and click the verification link to complete your registration. The link will redirect you back to the app.',
          [{ text: 'OK' }]
        );
        isNavigatingRef.current = false;
        router.replace('/auth/login');
        return;
      }

      const mappedUser = await mapSupabaseUser(data.user);
      setUser(mappedUser);

      console.log('[AuthContext] Redirecting to profile for first login');
      router.replace('/(tabs)/profile');

      setTimeout(() => { isNavigatingRef.current = false; }, 1000);
    } catch (error) {
      console.error('[AuthContext] Sign up error:', error);
      isNavigatingRef.current = false;
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('[AuthContext] Signing in with Google...');
      
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured. Please add SUPABASE_URL and SUPABASE_ANON_KEY to .env or app.json');
      }

      isNavigatingRef.current = true;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: Platform.OS === 'web' 
            ? `${window.location.origin}/auth-callback`
            : 'theroster://auth-callback',
        },
      });

      if (error) {
        console.error('[AuthContext] Google sign in error:', error);
        isNavigatingRef.current = false;
        throw error;
      }

      console.log('[AuthContext] Google sign in initiated');
      // The auth state listener will handle the rest
      setTimeout(() => { isNavigatingRef.current = false; }, 1000);
    } catch (error) {
      console.error('[AuthContext] Google sign in error:', error);
      isNavigatingRef.current = false;
      throw error;
    }
  };

  const signInWithApple = async () => {
    try {
      console.log('[AuthContext] Signing in with Apple...');
      
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured. Please add SUPABASE_URL and SUPABASE_ANON_KEY to .env or app.json');
      }

      isNavigatingRef.current = true;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: Platform.OS === 'web'
            ? `${window.location.origin}/auth-callback`
            : 'theroster://auth-callback',
        },
      });

      if (error) {
        console.error('[AuthContext] Apple sign in error:', error);
        isNavigatingRef.current = false;
        throw error;
      }

      console.log('[AuthContext] Apple sign in initiated');
      // The auth state listener will handle the rest
      setTimeout(() => { isNavigatingRef.current = false; }, 1000);
    } catch (error) {
      console.error('[AuthContext] Apple sign in error:', error);
      isNavigatingRef.current = false;
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('[AuthContext] Signing out...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[AuthContext] Sign out error:', error);
        throw error;
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
        signOut,
        fetchUser,
        markFirstLoginComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
