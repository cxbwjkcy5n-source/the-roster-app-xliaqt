
/**
 * OAuth Callback Page for Web
 * 
 * This page receives the OAuth callback and extracts the token,
 * then sends it back to the parent window (opener).
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { storeWebBearerToken } from '@/lib/auth';

export default function AuthCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      console.log('[AuthCallback] Processing OAuth callback...');
      console.log('[AuthCallback] Current URL:', window.location.href);
      
      // Extract token from URL hash or query params
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash || window.location.search);
      
      // Check for error first
      const error = params.get('error');
      if (error) {
        console.error('[AuthCallback] OAuth error:', error);
        setStatus('error');
        setMessage(`Authentication failed: ${error}`);
        
        if (window.opener) {
          window.opener.postMessage({
            type: 'oauth-error',
            error: error,
          }, window.location.origin);
          
          setTimeout(() => window.close(), 2000);
        }
        return;
      }

      // Look for token in various possible locations
      const token = params.get('token') || 
                   params.get('access_token') || 
                   params.get('bearer_token');

      console.log('[AuthCallback] Token found:', !!token);

      if (token) {
        // Store token
        storeWebBearerToken(token);
        
        setStatus('success');
        setMessage('Authentication successful! Closing window...');
        
        // Send token to parent window
        if (window.opener) {
          console.log('[AuthCallback] Sending token to parent window');
          window.opener.postMessage({
            type: 'oauth-success',
            token: token,
          }, window.location.origin);
          
          // Close popup after a short delay
          setTimeout(() => {
            window.close();
          }, 1000);
        } else {
          console.warn('[AuthCallback] No opener window found');
          setMessage('Authentication successful! Please close this window.');
        }
      } else {
        console.error('[AuthCallback] No token found in callback URL');
        setStatus('error');
        setMessage('No authentication token received');
        
        if (window.opener) {
          window.opener.postMessage({
            type: 'oauth-error',
            error: 'No token received',
          }, window.location.origin);
          
          setTimeout(() => window.close(), 2000);
        }
      }
    } catch (error: any) {
      console.error('[AuthCallback] Error processing callback:', error);
      setStatus('error');
      setMessage(`Error: ${error.message}`);
      
      if (window.opener) {
        window.opener.postMessage({
          type: 'oauth-error',
          error: error.message,
        }, window.location.origin);
        
        setTimeout(() => window.close(), 2000);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[
        styles.status,
        status === 'success' && styles.success,
        status === 'error' && styles.error,
      ]}>
        {status === 'processing' && '⏳'}
        {status === 'success' && '✅'}
        {status === 'error' && '❌'}
      </Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  status: {
    fontSize: 48,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  success: {
    color: colors.primary,
  },
  error: {
    color: colors.highlight,
  },
});
