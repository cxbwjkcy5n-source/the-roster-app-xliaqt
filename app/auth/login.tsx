
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gradients } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signInWithGoogle, signInWithApple } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    console.log('[Login] Login button pressed');
    
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (!isSupabaseConfigured()) {
      Alert.alert(
        'Configuration Error',
        'Supabase is not properly configured.\n\n' +
        'Please follow these steps:\n\n' +
        '1. Go to https://app.supabase.com/project/bbtvdhdfzkyhrodgclkd/settings/api\n\n' +
        '2. Copy the "anon" key (NOT the "publishable" key)\n\n' +
        '3. Update the .env file with:\n' +
        'EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>\n\n' +
        '4. Restart the Expo dev server',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      console.log('[Login] Attempting login with email:', email);
      await signInWithEmail(email, password);
      console.log('[Login] Login successful');
    } catch (error: any) {
      console.error('[Login] Login error:', error);
      
      let errorMessage = 'Failed to sign in. Please check your credentials.';
      
      if (error.message?.includes('Invalid API key')) {
        errorMessage = 
          'Invalid Supabase API key.\n\n' +
          'Please update your .env file with the correct "anon" key from:\n' +
          'https://app.supabase.com/project/bbtvdhdfzkyhrodgclkd/settings/api\n\n' +
          'Make sure to use the "anon" key, NOT the "publishable" key.';
      } else if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address before signing in.';
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('[Login] Google sign in button pressed');
    
    if (!isSupabaseConfigured()) {
      Alert.alert(
        'Configuration Error',
        'Supabase is not properly configured. Please update your .env file with the correct Supabase credentials.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('[Login] Google sign in error:', error);
      Alert.alert('Error', error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    console.log('[Login] Apple sign in button pressed');
    
    if (!isSupabaseConfigured()) {
      Alert.alert(
        'Configuration Error',
        'Supabase is not properly configured. Please update your .env file with the correct Supabase credentials.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      await signInWithApple();
    } catch (error: any) {
      console.error('[Login] Apple sign in error:', error);
      Alert.alert('Error', error.message || 'Failed to sign in with Apple');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Text style={styles.title}>THE ROSTER</Text>
            <Text style={styles.subtitle}>WHERE EVERYONE PLAYS THEIR POSITION</Text>
          </LinearGradient>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Welcome Back</Text>

            <View style={styles.inputContainer}>
              <IconSymbol
                ios_icon_name="envelope.fill"
                android_material_icon_name="email"
                size={20}
                color={colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <IconSymbol
                ios_icon_name="lock.fill"
                android_material_icon_name="lock"
                size={20}
                color={colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <IconSymbol
                ios_icon_name="g.circle.fill"
                android_material_icon_name="account-circle"
                size={20}
                color={colors.text}
              />
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleAppleSignIn}
              disabled={loading}
            >
              <IconSymbol
                ios_icon_name="apple.logo"
                android_material_icon_name="account-circle"
                size={20}
                color={colors.text}
              />
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signupLink}
              onPress={() => {
                console.log('[Login] Navigating to signup');
                router.push('/auth/signup');
              }}
              disabled={loading}
            >
              <Text style={styles.signupLinkText}>
                Don&apos;t have an account? <Text style={styles.signupLinkTextBold}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  formContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: colors.text,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: colors.textSecondary,
    fontSize: 14,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    height: 56,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  signupLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  signupLinkText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  signupLinkTextBold: {
    color: colors.primary,
    fontWeight: '600',
  },
});
