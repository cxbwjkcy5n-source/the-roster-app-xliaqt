
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [scanned, setScanned] = useState(false);
  const [scannedProfile, setScannedProfile] = useState<any>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const handleScan = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    console.log('[Scan] QR code scanned, data length:', data.length);

    try {
      if (!data.startsWith('roster://')) {
        console.log('[Scan] Invalid QR code - not a roster:// URI');
        Alert.alert('Invalid QR Code', 'This QR code is not from The Roster app.');
        setScanned(false);
        return;
      }

      const base64 = data.replace('roster://', '');
      const json = decodeURIComponent(escape(atob(base64)));
      const profile = JSON.parse(json);
      console.log('[Scan] Successfully parsed profile:', profile.name);

      setScannedProfile(profile);
    } catch (e) {
      console.error('[Scan] Failed to parse QR code:', e);
      Alert.alert('Scan Error', 'Could not read this QR code. Please try again.');
      setScanned(false);
    }
  };

  const handleAddToRoster = () => {
    console.log('[Scan] User tapped Add to Roster for:', scannedProfile?.name);
    router.replace({
      pathname: '/person/add',
      params: { prefill: JSON.stringify(scannedProfile) },
    });
  };

  const handleScanAgain = () => {
    console.log('[Scan] User tapped Scan Again');
    setScanned(false);
    setScannedProfile(null);
  };

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Stack.Screen options={{ headerShown: false }} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <IconSymbol
          ios_icon_name="camera.fill"
          android_material_icon_name="camera"
          size={64}
          color="#555"
        />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          To scan a Roster QR code, we need access to your camera.
        </Text>
        <TouchableOpacity
          style={styles.grantButton}
          onPress={() => {
            console.log('[Scan] User tapped Grant Permission');
            requestPermission();
          }}
        >
          <Text style={styles.grantButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            console.log('[Scan] User tapped back from permission screen');
            router.back();
          }}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const scannedText = scanned ? 'Code Scanned!' : "Point at someone's Roster QR code";

  const profileName = scannedProfile?.name ?? '';
  const profileAge = scannedProfile?.age;
  const profileLocation = scannedProfile?.location ?? '';
  const profileImage = scannedProfile?.image;
  const profilePhone = scannedProfile?.phoneNumber;
  const profileInstagram = scannedProfile?.instagram;
  const profileFavoriteColor = scannedProfile?.favoriteColor;

  const ageLocationText = profileAge || profileLocation
    ? `${profileAge ? profileAge + ' · ' : ''}${profileLocation}`
    : null;

  const detailChips: string[] = [];
  if (profilePhone) detailChips.push(profilePhone);
  if (profileInstagram) detailChips.push('@' + profileInstagram);
  if (profileFavoriteColor) detailChips.push(profileFavoriteColor);
  const visibleChips = detailChips.slice(0, 3);

  const addButtonLabel = 'Add ' + profileName + ' to Roster';

  const confirmationBottomPadding = insets.bottom + 16;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      />

      {/* Overlay */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        {/* Top bar with close button */}
        <SafeAreaView edges={['top']} style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              console.log('[Scan] User tapped close button');
              router.back();
            }}
          >
            <IconSymbol
              ios_icon_name="xmark"
              android_material_icon_name="close"
              size={22}
              color="#fff"
            />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Scan QR Code</Text>
          <View style={styles.topSpacer} />
        </SafeAreaView>

        {/* Center scan frame — hide when confirmation is showing */}
        {!scannedProfile && (
          <View style={styles.centerArea} pointerEvents="none">
            <View style={[styles.scanFrame, scanned && styles.scanFrameSuccess]}>
              {/* Corner accents */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />

              {scanned && (
                <View style={styles.scannedOverlay}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={64}
                    color="#4CAF50"
                  />
                </View>
              )}
            </View>

            <Text style={styles.scanHint}>{scannedText}</Text>
          </View>
        )}
      </View>

      {/* Confirmation bottom sheet */}
      {scannedProfile && (
        <View
          style={[
            styles.confirmationSheet,
            { paddingBottom: confirmationBottomPadding },
          ]}
          pointerEvents="box-none"
        >
          {/* Profile row */}
          <View style={styles.profileRow}>
            {profileImage ? (
              <Image
                source={resolveImageSource(profileImage)}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={32}
                  color="#555"
                />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.addToRosterLabel}>Add to Your Roster?</Text>
              <Text style={styles.profileName}>{profileName}</Text>
              {ageLocationText && (
                <Text style={styles.profileMeta}>{ageLocationText}</Text>
              )}
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Detail chips */}
          {visibleChips.length > 0 && (
            <View style={styles.chipsRow}>
              {visibleChips.map((chip, index) => (
                <View key={`chip-${index}`} style={styles.chip}>
                  <Text style={styles.chipText}>{chip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Add button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddToRoster}
            activeOpacity={0.85}
          >
            <Text style={styles.addButtonText}>{addButtonLabel}</Text>
          </TouchableOpacity>

          {/* Scan again button */}
          <TouchableOpacity
            style={styles.scanAgainButton}
            onPress={handleScanAgain}
            activeOpacity={0.85}
          >
            <Text style={styles.scanAgainButtonText}>Scan Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const FRAME_SIZE = 260;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  grantButton: {
    backgroundColor: colors.rosterRed,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 50,
    marginBottom: 12,
  },
  grantButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  backButtonText: {
    color: '#666',
    fontSize: 15,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  topSpacer: {
    width: 40,
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: 16,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrameSuccess: {},
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: colors.rosterRed,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: colors.rosterRed,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: colors.rosterRed,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: colors.rosterRed,
    borderBottomRightRadius: 4,
  },
  scannedOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: 16,
  },
  scanHint: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 32,
  },
  // Confirmation sheet
  confirmationSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  profileImagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  addToRosterLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  profileMeta: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginVertical: 20,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: '#fff',
    fontSize: 13,
  },
  addButton: {
    backgroundColor: colors.rosterRed,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  scanAgainButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  scanAgainButtonText: {
    color: '#fff',
    fontSize: 15,
  },
});
