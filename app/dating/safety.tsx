
import React, { useState, useEffect } from 'react';
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
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';
import * as Location from 'expo-location';
import { authenticatedGet, authenticatedPost, authenticatedPut } from '@/utils/api';

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
  emergencyContacts: Array<{ contactName: string; phoneNumber: string }>;
  status: 'active' | 'completed' | 'emergency';
  createdAt: string;
}

export default function SafetyScreen() {
  const router = useRouter();
  const { roster } = useRoster();
  
  // Safety date information
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [selectedPersonName, setSelectedPersonName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [licensePlate, setLicensePlate] = useState<string>('');
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: '', phone: '' },
    { name: '', phone: '' },
    { name: '', phone: '' },
  ]);
  
  // UI state
  const [showPersonPicker, setShowPersonPicker] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [activeSafetyDate, setActiveSafetyDate] = useState<SafetyDate | null>(null);
  const [loading, setLoading] = useState(false);

  // Load active safety date on mount
  useEffect(() => {
    loadActiveSafetyDate();
    requestLocationPermission();
  }, []);

  const loadActiveSafetyDate = async () => {
    try {
      console.log('[Safety] Loading active safety date...');
      const response = await authenticatedGet('/api/safety-dates/active');
      if (response && response.id) {
        console.log('[Safety] Active safety date found:', response.id);
        setActiveSafetyDate(response);
      } else {
        console.log('[Safety] No active safety date');
        setActiveSafetyDate(null);
      }
    } catch (error) {
      console.error('[Safety] Error loading active safety date:', error);
      // No active safety date is not an error
      setActiveSafetyDate(null);
    }
  };

  const requestLocationPermission = async () => {
    try {
      console.log('[Safety] Requesting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Location access is needed to share your location with emergency contacts for safety.',
          [{ text: 'OK' }]
        );
      } else {
        console.log('[Safety] Location permission granted');
        // Automatically get current location
        getCurrentLocation();
      }
    } catch (error) {
      console.error('[Safety] Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      console.log('[Safety] Getting current location...');
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const coords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      
      setLocationCoords(coords);
      
      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync(coords);
      if (addresses.length > 0) {
        const address = addresses[0];
        const locationString = [
          address.name,
          address.street,
          address.city,
          address.region,
        ].filter(Boolean).join(', ');
        setLocation(locationString);
        console.log('[Safety] Location set:', locationString);
      }
    } catch (error) {
      console.error('[Safety] Error getting location:', error);
      Alert.alert('Location Error', 'Could not get your current location. Please enter it manually.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSelectPerson = (personId: string, personName: string) => {
    console.log('[Safety] Selected person:', personName);
    setSelectedPerson(personId);
    setSelectedPersonName(personName);
    setShowPersonPicker(false);
  };

  const updateEmergencyContact = (index: number, field: 'name' | 'phone', value: string) => {
    const updated = [...emergencyContacts];
    updated[index][field] = value;
    setEmergencyContacts(updated);
  };

  const handleSendSafetyInfo = async () => {
    // Validate inputs
    if (!selectedPerson) {
      Alert.alert('Missing Information', 'Please select the person you\'re meeting.');
      return;
    }
    
    if (!location) {
      Alert.alert('Missing Information', 'Please enter or select your location.');
      return;
    }
    
    // Check if at least one emergency contact is filled
    const validContacts = emergencyContacts.filter(c => c.name && c.phone);
    if (validContacts.length === 0) {
      Alert.alert('Missing Information', 'Please add at least one emergency contact.');
      return;
    }

    console.log('[Safety] Creating safety date with:', {
      person: selectedPersonName,
      location,
      licensePlate,
      contacts: validContacts.length,
    });

    try {
      setLoading(true);
      
      const safetyDateData = {
        profileName: selectedPersonName,
        dateWithName: selectedPersonName,
        dateWithDescription: `Date with ${selectedPersonName}`,
        location: location,
        locationAddress: location,
        coordinates: locationCoords ? {
          latitude: locationCoords.latitude,
          longitude: locationCoords.longitude,
        } : undefined,
        licensePlate: licensePlate || undefined,
        rosterProfileId: selectedPerson,
        emergencyContacts: validContacts.map(c => ({
          contactName: c.name,
          phoneNumber: c.phone,
        })),
      };
      
      console.log('[Safety] Sending safety date data to backend...');
      const response = await authenticatedPost('/api/safety-dates', safetyDateData);
      console.log('[Safety] Safety date created:', response.id);
      
      setActiveSafetyDate(response);
      
      Alert.alert(
        'Safety Information Sent',
        `Your safety information has been shared with ${validContacts.length} emergency contact(s).\n\n` +
        `They will be notified if you don't check in within the expected time.`,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('[Safety] Safety date activated');
            }
          }
        ]
      );
    } catch (error) {
      console.error('[Safety] Error sending safety info:', error);
      Alert.alert('Error', 'Failed to send safety information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = () => {
    if (!activeSafetyDate) return;
    
    console.log('[Safety] User checked in');
    Alert.alert(
      'Check In',
      'Let your emergency contacts know you\'re safe?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check In',
          onPress: async () => {
            try {
              setLoading(true);
              console.log('[Safety] Sending check-in to backend...');
              
              // Mark as completed
              await authenticatedPut(`/api/safety-dates/${activeSafetyDate.id}/complete`, {});
              console.log('[Safety] Check-in successful');
              
              Alert.alert('Checked In', 'Your emergency contacts have been notified that you\'re safe.');
              
              // Reload active safety date
              await loadActiveSafetyDate();
            } catch (error) {
              console.error('[Safety] Error checking in:', error);
              Alert.alert('Error', 'Failed to send check-in. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleEndSafetyDate = () => {
    if (!activeSafetyDate) return;
    
    console.log('[Safety] Ending safety date');
    Alert.alert(
      'End Safety Monitoring',
      'This will notify your emergency contacts that you\'re safe and end the safety monitoring.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              console.log('[Safety] Ending safety date on backend...');
              
              await authenticatedPut(`/api/safety-dates/${activeSafetyDate.id}/complete`, {});
              console.log('[Safety] Safety date ended');
              
              setActiveSafetyDate(null);
              setSelectedPerson('');
              setSelectedPersonName('');
              setLocation('');
              setLocationCoords(null);
              setLicensePlate('');
              setEmergencyContacts([
                { name: '', phone: '' },
                { name: '', phone: '' },
                { name: '', phone: '' },
              ]);
              
              Alert.alert('Safety Monitoring Ended', 'Your emergency contacts have been notified.');
            } catch (error) {
              console.error('[Safety] Error ending safety date:', error);
              Alert.alert('Error', 'Failed to end safety monitoring. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: "I'm on a Date - Safety",
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.headerSection}>
          <IconSymbol
            ios_icon_name="shield.fill"
            android_material_icon_name="security"
            size={48}
            color={colors.primary}
          />
          <Text style={styles.headerTitle}>Stay Safe</Text>
          <Text style={styles.headerSubtitle}>
            Share your date details with trusted contacts who will be notified if you don't check in.
          </Text>
        </View>

        {activeSafetyDate ? (
          // Active safety date view
          <View style={styles.activeSection}>
            <LinearGradient
              colors={[colors.primary + '20', colors.primary + '10']}
              style={styles.activeCard}
            >
              <View style={styles.activeHeader}>
                <IconSymbol
                  ios_icon_name="checkmark.shield.fill"
                  android_material_icon_name="verified-user"
                  size={32}
                  color={colors.primary}
                />
                <Text style={styles.activeTitle}>Safety Monitoring Active</Text>
              </View>
              
              <View style={styles.activeInfo}>
                <Text style={styles.activeLabel}>Meeting with:</Text>
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
              
              <View style={styles.activeInfo}>
                <Text style={styles.activeLabel}>Emergency Contacts Notified:</Text>
                <Text style={styles.activeValue}>
                  {activeSafetyDate.emergencyContacts.length} contact(s)
                </Text>
              </View>
            </LinearGradient>

            <TouchableOpacity
              style={styles.checkInButton}
              onPress={handleCheckIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={24}
                    color="#fff"
                  />
                  <Text style={styles.checkInButtonText}>Check In - I'm Safe</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.endButton}
              onPress={handleEndSafetyDate}
              disabled={loading}
            >
              <Text style={styles.endButtonText}>End Safety Monitoring</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Setup safety date view
          <View style={styles.setupSection}>
            {/* Person Selection */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Who are you meeting? *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowPersonPicker(true)}
              >
                <Text style={[styles.pickerButtonText, !selectedPersonName && styles.placeholderText]}>
                  {selectedPersonName || 'Select person from roster'}
                </Text>
                <IconSymbol
                  ios_icon_name="chevron.down"
                  android_material_icon_name="arrow-drop-down"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Location */}
            <View style={styles.inputSection}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Location *</Text>
                {loadingLocation && <ActivityIndicator size="small" color={colors.primary} />}
              </View>
              <TextInput
                style={styles.textInput}
                value={location}
                onChangeText={setLocation}
                placeholder="Enter location or use current location"
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity
                style={styles.locationButton}
                onPress={getCurrentLocation}
                disabled={loadingLocation}
              >
                <IconSymbol
                  ios_icon_name="location.fill"
                  android_material_icon_name="my-location"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.locationButtonText}>Use Current Location</Text>
              </TouchableOpacity>
            </View>

            {/* License Plate */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>License Plate (Optional)</Text>
              <Text style={styles.inputHint}>If you're getting in their car</Text>
              <TextInput
                style={styles.textInput}
                value={licensePlate}
                onChangeText={setLicensePlate}
                placeholder="ABC-1234"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
              />
            </View>

            {/* Emergency Contacts */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Emergency Contacts (Up to 3) *</Text>
              <Text style={styles.inputHint}>They'll be notified if you don't check in</Text>
              
              {emergencyContacts.map((contact, index) => (
                <View key={index} style={styles.contactCard}>
                  <Text style={styles.contactNumber}>Contact {index + 1}</Text>
                  <TextInput
                    style={styles.textInput}
                    value={contact.name}
                    onChangeText={(value) => updateEmergencyContact(index, 'name', value)}
                    placeholder="Name"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.textInput, { marginTop: 8 }]}
                    value={contact.phone}
                    onChangeText={(value) => updateEmergencyContact(index, 'phone', value)}
                    placeholder="Phone Number"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                  />
                </View>
              ))}
            </View>

            {/* Send Button */}
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendSafetyInfo}
              disabled={loading}
            >
              <LinearGradient
                colors={[colors.primary, colors.primary + 'CC']}
                style={styles.sendButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <IconSymbol
                      ios_icon_name="paperplane.fill"
                      android_material_icon_name="send"
                      size={24}
                      color="#fff"
                    />
                    <Text style={styles.sendButtonText}>Share Safety Information</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Safety Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Safety Tips</Text>
          <View style={styles.tipCard}>
            <IconSymbol
              ios_icon_name="person.2.fill"
              android_material_icon_name="people"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.tipText}>Always meet in a public place</Text>
          </View>
          <View style={styles.tipCard}>
            <IconSymbol
              ios_icon_name="car.fill"
              android_material_icon_name="directions-car"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.tipText}>Arrange your own transportation</Text>
          </View>
          <View style={styles.tipCard}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.tipText}>Trust your instincts - leave if uncomfortable</Text>
          </View>
        </View>
      </ScrollView>

      {/* Person Picker Modal */}
      <Modal
        visible={showPersonPicker}
        animationType="slide"
        transparent={true}
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
            
            <ScrollView style={styles.modalList}>
              {roster.length === 0 ? (
                <Text style={styles.emptyText}>No people in your roster yet</Text>
              ) : (
                roster.map((person) => (
                  <TouchableOpacity
                    key={person.id}
                    style={styles.personItem}
                    onPress={() => handleSelectPerson(person.id, person.name)}
                  >
                    <Text style={styles.personName}>{person.name}</Text>
                    {selectedPerson === person.id && (
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={24}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  activeSection: {
    marginBottom: 24,
  },
  activeCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  activeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  activeInfo: {
    marginBottom: 12,
  },
  activeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  activeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  checkInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  endButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  endButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  setupSection: {
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
  },
  pickerButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    padding: 12,
    gap: 8,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  contactCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contactNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  sendButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 12,
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  tipsSection: {
    marginTop: 24,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalList: {
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 40,
  },
  personItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
