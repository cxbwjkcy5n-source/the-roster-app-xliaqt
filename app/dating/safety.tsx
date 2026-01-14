
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
  const { roster } = useRoster();
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
        setActiveSafetyDate(response);
      }
    } catch (error) {
      console.error('[Safety] Error loading active safety date:', error);
    }
  }, []);

  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for safety features');
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
      }
    } catch (error) {
      console.error('[Safety] Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const handleSelectPerson = (personId: string, personName: string) => {
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

    try {
      console.log('[Safety] Checking in...');
      await authenticatedPut(`/api/safety-dates/${activeSafetyDate.id}/check-in`, {});
      Alert.alert('Check-in Successful', 'Your emergency contacts have been notified');
    } catch (error) {
      console.error('[Safety] Error checking in:', error);
      Alert.alert('Error', 'Failed to check in');
    }
  };

  const handleEndSafetyDate = async () => {
    if (!activeSafetyDate) return;

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
                color={colors.green}
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
              style={styles.input}
              onPress={() => setShowPersonPicker(true)}
            >
              <Text style={dateWithName ? styles.inputText : styles.placeholderText}>
                {dateWithName || 'Select from roster or enter name'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationRow}>
              <TextInput
                style={[styles.input, styles.locationInput]}
                value={location}
                onChangeText={setLocation}
                placeholder="Where are you going?"
                placeholderTextColor={colors.textSecondary}
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
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            {emergencyContacts.map((contact, index) => (
              <View key={index} style={styles.contactRow}>
                <TextInput
                  style={[styles.input, styles.contactInput]}
                  value={contact.name}
                  onChangeText={(value) => updateEmergencyContact(index, 'name', value)}
                  placeholder="Name"
                  placeholderTextColor={colors.textSecondary}
                />
                <TextInput
                  style={[styles.input, styles.contactInput]}
                  value={contact.phone}
                  onChangeText={(value) => updateEmergencyContact(index, 'phone', value)}
                  placeholder="Phone"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>
            ))}
            <TouchableOpacity
              style={styles.addContactButton}
              onPress={() => setEmergencyContacts([...emergencyContacts, { name: '', phone: '' }])}
            >
              <IconSymbol
                ios_icon_name="plus.circle.fill"
                android_material_icon_name="add-circle"
                size={20}
                color={colors.primary}
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

      {/* Person Picker Modal */}
      <Modal
        visible={showPersonPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPersonPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Person</Text>
              <TouchableOpacity onPress={() => setShowPersonPicker(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {roster.map((person) => (
                <TouchableOpacity
                  key={person.id}
                  style={styles.personOption}
                  onPress={() => handleSelectPerson(person.id, person.name)}
                >
                  <Text style={styles.personOptionName}>{person.name}</Text>
                </TouchableOpacity>
              ))}
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
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  inputText: {
    color: colors.text,
  },
  placeholderText: {
    color: colors.textSecondary,
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
    backgroundColor: colors.primary,
    width: 48,
    height: 48,
    borderRadius: 8,
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
    color: colors.primary,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
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
    borderColor: colors.green,
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
    color: colors.text,
  },
  activeInfo: {
    marginBottom: 12,
  },
  activeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  activeValue: {
    fontSize: 16,
    color: colors.text,
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
    backgroundColor: colors.green,
    paddingVertical: 12,
    borderRadius: 8,
  },
  endButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.red,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  personOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  personOptionName: {
    fontSize: 16,
    color: colors.text,
  },
});
