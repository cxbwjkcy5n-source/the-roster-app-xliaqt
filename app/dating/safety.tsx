
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, Stack } from 'expo-router';
import * as Location from 'expo-location';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRoster } from '@/contexts/RosterContext';
import { authenticatedGet, authenticatedPost, authenticatedPut } from '@/utils/api';
import { colors } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';

interface EmergencyContact {
  name: string;
  phone: string;
}

interface SafetyDate {
  id: string;
  profileName: string;
  dateWithName: string;
  location: string;
  licensePlate?: string;
  emergencyContacts: { contactName: string; phoneNumber: string }[];
  status: 'active' | 'completed' | 'emergency';
  createdAt: string;
}

export default function SafetyScreen() {
  const router = useRouter();
  const { roster, bench } = useRoster();
  const [selectedPerson, setSelectedPerson] = useState('');
  const [dateWithName, setDateWithName] = useState('');
  const [location, setLocation] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: '', phone: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [activeSafetyDate, setActiveSafetyDate] = useState<SafetyDate | null>(null);
  const [showPersonPicker, setShowPersonPicker] = useState(false);

  const loadActiveSafetyDate = useCallback(async () => {
    try {
      console.log('[Safety] Loading active safety date...');
      const response = await authenticatedGet('/api/safety-dates/active');
      if (response) {
        console.log('[Safety] Active safety date found:', response);
        setActiveSafetyDate(response);
      }
    } catch (error: any) {
      // 404 is expected when there's no active safety date - this is not an error
      if (error?.message?.includes('404') || error?.response?.status === 404) {
        console.log('[Safety] No active safety date (this is normal)');
        setActiveSafetyDate(null);
      } else {
        // Only log actual errors
        console.error('[Safety] Unexpected error loading safety date:', error);
      }
    }
  }, []);

  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('[Safety] Location permission denied');
      } else {
        console.log('[Safety] Location permission granted');
      }
    } catch (error) {
      console.error('[Safety] Error requesting location permission:', error);
    }
  }, []);

  useEffect(() => {
    loadActiveSafetyDate();
    requestLocationPermission();
  }, [loadActiveSafetyDate, requestLocationPermission]);

  const getCurrentLocation = async () => {
    try {
      console.log('[Safety] User tapped Get Current Location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (address[0]) {
        const locationString = `${address[0].street || ''}, ${address[0].city || ''}, ${address[0].region || ''}`;
        setLocation(locationString);
        console.log('[Safety] Location set to:', locationString);
      }
    } catch (error) {
      console.error('[Safety] Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const handleSelectPerson = (personId: string, personName: string) => {
    console.log('[Safety] User selected person:', personName);
    setSelectedPerson(personId);
    setDateWithName(personName);
    setShowPersonPicker(false);
  };

  const updateEmergencyContact = (index: number, field: 'name' | 'phone', value: string) => {
    const updated = [...emergencyContacts];
    updated[index][field] = value;
    setEmergencyContacts(updated);
  };

  const handleSendSafetyInfo = async () => {
    console.log('[Safety] User tapped Send Safety Info');
    
    if (!dateWithName || !location) {
      Alert.alert('Missing Information', 'Please fill in date name and location');
      return;
    }

    const validContacts = emergencyContacts.filter(c => c.name && c.phone);
    if (validContacts.length === 0) {
      Alert.alert('Missing Contacts', 'Please add at least one emergency contact');
      return;
    }

    setLoading(true);
    try {
      console.log('[Safety] Creating safety date...');
      const safetyData = {
        profileId: selectedPerson || null,
        profileName: dateWithName,
        dateWithName,
        location,
        licensePlate: licensePlate || null,
        emergencyContacts: validContacts.map(c => ({
          contactName: c.name,
          phoneNumber: c.phone,
        })),
      };

      const response = await authenticatedPost('/api/safety-dates', safetyData);
      setActiveSafetyDate(response);
      
      Alert.alert(
        'Safety Info Sent',
        'Your emergency contacts have been notified with your date details'
      );
    } catch (error) {
      console.error('[Safety] Error sending safety info:', error);
      Alert.alert('Error', 'Failed to send safety information');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!activeSafetyDate) return;

    console.log('[Safety] User tapped Check In');
    try {
      await authenticatedPut(`/api/safety-dates/${activeSafetyDate.id}/check-in`, {});
      Alert.alert('Check-in Successful', 'Your emergency contacts have been notified');
    } catch (error) {
      console.error('[Safety] Error checking in:', error);
      Alert.alert('Error', 'Failed to check in');
    }
  };

  const handleEndSafetyDate = async () => {
    if (!activeSafetyDate) return;

    console.log('[Safety] User tapped End Safety Date');
    Alert.alert(
      'End Safety Date',
      'Are you sure you want to end this safety date?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          onPress: async () => {
            try {
              console.log('[Safety] Ending safety date...');
              await authenticatedPut(`/api/safety-dates/${activeSafetyDate.id}/complete`, {});
              setActiveSafetyDate(null);
              Alert.alert('Safety Date Ended', 'Your emergency contacts have been notified');
            } catch (error) {
              console.error('[Safety] Error ending safety date:', error);
              Alert.alert('Error', 'Failed to end safety date');
            }
          },
        },
      ]
    );
  };

  // Combine roster and bench for person selection
  const allPeople = [...roster, ...bench];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <LinearGradient
        colors={['#FF6B9D', '#C44569']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            console.log('[Safety] User tapped back button');
            router.back();
          }}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Features</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeSafetyDate ? (
          <View style={styles.activeSection}>
            <View style={styles.activeHeader}>
              <IconSymbol
                ios_icon_name="shield.fill"
                android_material_icon_name="security"
                size={32}
                color={colors.rosterGreen}
              />
              <Text style={styles.activeTitle}>Safety Date Active</Text>
            </View>
            <View style={styles.activeInfo}>
              <Text style={styles.activeLabel}>Date with:</Text>
              <Text style={styles.activeValue}>{activeSafetyDate.dateWithName}</Text>
            </View>
            <View style={styles.activeInfo}>
              <Text style={styles.activeLabel}>Location:</Text>
              <Text style={styles.activeValue}>{activeSafetyDate.location}</Text>
            </View>
            {activeSafetyDate.licensePlate && (
              <View style={styles.activeInfo}>
                <Text style={styles.activeLabel}>License Plate:</Text>
                <Text style={styles.activeValue}>{activeSafetyDate.licensePlate}</Text>
              </View>
            )}
            <View style={styles.activeButtons}>
              <TouchableOpacity style={styles.checkInButton} onPress={handleCheckIn}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.buttonText}>Check In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.endButton} onPress={handleEndSafetyDate}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.buttonText}>End Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.description}>
              Share your date details with emergency contacts for added safety
            </Text>

            <Text style={styles.sectionTitle}>Who are you going on a date with?</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => {
                console.log('[Safety] User tapped person dropdown');
                setShowPersonPicker(true);
              }}
            >
              <Text style={dateWithName ? styles.dropdownText : styles.dropdownPlaceholder}>
                {dateWithName || 'Select from roster or bench'}
              </Text>
              <IconSymbol
                ios_icon_name="chevron.down"
                android_material_icon_name="arrow-drop-down"
                size={24}
                color={colors.grey}
              />
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationRow}>
              <TextInput
                style={[styles.input, styles.locationInput]}
                value={location}
                onChangeText={setLocation}
                placeholder="Where are you going?"
                placeholderTextColor={colors.grey}
              />
              <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
                <IconSymbol
                  ios_icon_name="location.fill"
                  android_material_icon_name="my-location"
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>License Plate (optional)</Text>
            <TextInput
              style={styles.input}
              value={licensePlate}
              onChangeText={setLicensePlate}
              placeholder="ABC-1234"
              placeholderTextColor={colors.grey}
            />

            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            {emergencyContacts.map((contact, index) => (
              <View key={index} style={styles.contactRow}>
                <TextInput
                  style={[styles.input, styles.contactInput]}
                  value={contact.name}
                  onChangeText={(value) => updateEmergencyContact(index, 'name', value)}
                  placeholder="Name"
                  placeholderTextColor={colors.grey}
                />
                <TextInput
                  style={[styles.input, styles.contactInput]}
                  value={contact.phone}
                  onChangeText={(value) => updateEmergencyContact(index, 'phone', value)}
                  placeholder="Phone"
                  placeholderTextColor={colors.grey}
                  keyboardType="phone-pad"
                />
              </View>
            ))}
            <TouchableOpacity
              style={styles.addContactButton}
              onPress={() => {
                console.log('[Safety] User tapped Add Another Contact');
                setEmergencyContacts([...emergencyContacts, { name: '', phone: '' }]);
              }}
            >
              <IconSymbol
                ios_icon_name="plus.circle.fill"
                android_material_icon_name="add-circle"
                size={20}
                color={colors.rosterGreen}
              />
              <Text style={styles.addContactText}>Add Another Contact</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendSafetyInfo}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <IconSymbol
                    ios_icon_name="paperplane.fill"
                    android_material_icon_name="send"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.sendButtonText}>Send Safety Info</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Person Picker Dropdown Modal */}
      <Modal
        visible={showPersonPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPersonPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowPersonPicker(false)}
          />
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Person</Text>
              <TouchableOpacity onPress={() => setShowPersonPicker(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.darkText}
                />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownScroll}>
              {allPeople.length > 0 ? (
                allPeople.map((person) => {
                  const isOnBench = bench.some(p => p.id === person.id);
                  return (
                    <TouchableOpacity
                      key={person.id}
                      style={styles.personOption}
                      onPress={() => handleSelectPerson(person.id, person.name)}
                    >
                      <View style={styles.personOptionContent}>
                        <Text style={styles.personOptionName}>{person.name}</Text>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: isOnBench ? colors.actionRed : colors.rosterGreen }
                        ]}>
                          <Text style={styles.statusBadgeText}>
                            {isOnBench ? 'Bench' : 'Roster'}
                          </Text>
                        </View>
                      </View>
                      <IconSymbol
                        ios_icon_name="chevron.right"
                        android_material_icon_name="chevron-right"
                        size={20}
                        color={colors.grey}
                      />
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No people in roster or bench</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  description: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: 24,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkText,
    marginTop: 16,
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: colors.darkText,
    flex: 1,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: colors.grey,
    flex: 1,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.darkText,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  locationInput: {
    flex: 1,
    marginBottom: 0,
  },
  locationButton: {
    backgroundColor: colors.rosterGreen,
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  contactInput: {
    flex: 1,
    marginBottom: 0,
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  addContactText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.rosterGreen,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.rosterGreen,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  activeSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.rosterGreen,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  activeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.darkText,
  },
  activeInfo: {
    marginBottom: 12,
  },
  activeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.grey,
    marginBottom: 4,
  },
  activeValue: {
    fontSize: 16,
    color: colors.darkText,
  },
  activeButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  checkInButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.rosterGreen,
    paddingVertical: 12,
    borderRadius: 12,
  },
  endButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.actionRed,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dropdownModal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '50%',
    minHeight: 200,
  },
  dropdownHandle: {
    width: 40,
    height: 5,
    backgroundColor: colors.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.darkText,
  },
  dropdownScroll: {
    maxHeight: 400,
  },
  personOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  personOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  personOptionName: {
    fontSize: 16,
    color: colors.darkText,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.grey,
  },
});
