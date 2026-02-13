
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useAuth } from '@/contexts/AuthContext';
import { getLastUploadError, getLastSaveError, getAppVersion } from '@/utils/storage';
import { BACKEND_URL } from '@/utils/api';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';

export function DebugOverlay() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [lastUploadError, setLastUploadError] = useState<{ message: string; timestamp: string } | null>(null);
  const [lastSaveError, setLastSaveError] = useState<{ message: string; timestamp: string } | null>(null);

  // Triple tap in top-right corner to show debug overlay
  const handleTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);

    if (newCount >= 3) {
      setVisible(true);
      setTapCount(0);
    }

    // Reset tap count after 2 seconds
    setTimeout(() => setTapCount(0), 2000);
  };

  useEffect(() => {
    if (visible) {
      loadErrors();
    }
  }, [visible]);

  const loadErrors = async () => {
    const uploadErr = await getLastUploadError();
    const saveErr = await getLastSaveError();
    setLastUploadError(uploadErr);
    setLastSaveError(saveErr);
  };

  const appVersion = getAppVersion();
  const buildNumber = Constants.expoConfig?.extra?.buildNumber || 'N/A';
  const hasAuthToken = !!user;

  return (
    <>
      {/* Invisible tap area in top-right corner */}
      <Pressable
        style={styles.tapArea}
        onPress={handleTap}
      />

      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Debug Info</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>App Info</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Version:</Text>
                <Text style={styles.value}>{appVersion}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Build:</Text>
                <Text style={styles.value}>{buildNumber}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Backend</Text>
              <View style={styles.row}>
                <Text style={styles.label}>API URL:</Text>
                <Text style={[styles.value, styles.urlText]} numberOfLines={2}>
                  {BACKEND_URL}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Authentication</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Auth Token:</Text>
                <View style={[styles.badge, hasAuthToken ? styles.badgeSuccess : styles.badgeError]}>
                  <Text style={styles.badgeText}>
                    {hasAuthToken ? 'Present' : 'Missing'}
                  </Text>
                </View>
              </View>
              {user && (
                <>
                  <View style={styles.row}>
                    <Text style={styles.label}>User ID:</Text>
                    <Text style={[styles.value, styles.monoText]} numberOfLines={1}>
                      {user.id.substring(0, 16)}...
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.value}>{user.email}</Text>
                  </View>
                </>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Last Upload Error</Text>
              {lastUploadError ? (
                <>
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{lastUploadError.message}</Text>
                  </View>
                  <Text style={styles.timestamp}>
                    {new Date(lastUploadError.timestamp).toLocaleString()}
                  </Text>
                </>
              ) : (
                <Text style={styles.noError}>No errors</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Last Save Error</Text>
              {lastSaveError ? (
                <>
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{lastSaveError.message}</Text>
                  </View>
                  <Text style={styles.timestamp}>
                    {new Date(lastSaveError.timestamp).toLocaleString()}
                  </Text>
                </>
              ) : (
                <Text style={styles.noError}>No errors</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadErrors}
            >
              <IconSymbol
                ios_icon_name="arrow.clockwise"
                android_material_icon_name="refresh"
                size={20}
                color="#fff"
              />
              <Text style={styles.refreshButtonText}>Refresh Errors</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  tapArea: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 80,
    height: 80,
    zIndex: 9999,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 100,
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  urlText: {
    fontSize: 12,
  },
  monoText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeSuccess: {
    backgroundColor: colors.green,
  },
  badgeError: {
    backgroundColor: colors.lowInterest,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  errorBox: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.lowInterest,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  noError: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
