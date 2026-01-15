
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { authenticatedPost, BACKEND_URL } from '@/utils/api';
import { useRoster } from '@/contexts/RosterContext';
import { colors } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { RosterPerson } from '@/types/roster';

interface DateSuggestion {
  id: string;
  name: string;
  type: string;
  description: string;
  estimatedCost: string;
  duration: string;
  whyPerfect: string;
}

const BUDGET_OPTIONS = ['$', '$$', '$$$', '$$$$'];
const DURATION_OPTIONS = ['1-2 hours', '2-4 hours', '4+ hours', 'Full day'];

export default function PlanDateScreen() {
  const { roster, bench } = useRoster();
  const router = useRouter();
  const [selectedPerson, setSelectedPerson] = useState<RosterPerson | null>(null);
  const [showPersonPicker, setShowPersonPicker] = useState(false);
  const [budget, setBudget] = useState('$$');
  const [duration, setDuration] = useState('2-4 hours');
  const [preferences, setPreferences] = useState('');
  const [userLocation, setUserLocation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<DateSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Request location on mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      console.log('[PlanDate] Requesting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'We need your location to suggest nearby date ideas. You can also enter your location manually.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('[PlanDate] Getting current location...');
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Reverse geocode to get city name
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode.length > 0) {
        const { city, region } = geocode[0];
        const locationString = `${city}, ${region}`;
        setUserLocation(locationString);
        console.log('[PlanDate] Location set:', locationString);
      }
    } catch (error) {
      console.error('[PlanDate] Error getting location:', error);
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!selectedPerson) {
      Alert.alert('Select Person', 'Please select someone from your roster');
      return;
    }

    if (!userLocation.trim()) {
      Alert.alert('Location Required', 'Please enter your location to get personalized suggestions');
      return;
    }

    setLoading(true);
    try {
      console.log('[PlanDate] Generating date suggestions with location:', userLocation);
      // TODO: Backend Integration - POST /api/dates/suggestions with { profileId, budget, duration, preferences, location: userLocation }
      // For now, show mock data
      const mockSuggestions: DateSuggestion[] = [
        {
          id: '1',
          name: 'Sunset Picnic',
          type: 'Outdoor',
          description: `A romantic picnic at a park in ${userLocation} with wine and cheese`,
          estimatedCost: budget,
          duration: duration,
          whyPerfect: `Perfect for ${selectedPerson.name} based on their interests`,
        },
        {
          id: '2',
          name: 'Cooking Class',
          type: 'Activity',
          description: `Learn to make pasta together at a local cooking school in ${userLocation}`,
          estimatedCost: budget,
          duration: duration,
          whyPerfect: 'Interactive and fun way to bond',
        },
      ];
      setSuggestions(mockSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('[PlanDate] Error generating suggestions:', error);
      Alert.alert('Error', 'Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: DateSuggestion) => {
    Alert.alert(
      'Schedule Date',
      `Would you like to schedule "${suggestion.name}" with ${selectedPerson?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Schedule',
          onPress: () => {
            setShowSuggestions(false);
            router.push('/dating/schedule' as any);
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
            console.log('[PlanDate] User tapped back button');
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
        <Text style={styles.headerTitle}>Plan a Date</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Who are you planning a date with?</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => {
            console.log('[PlanDate] User tapped person dropdown');
            setShowPersonPicker(true);
          }}
        >
          {selectedPerson ? (
            <View style={styles.selectedPersonContent}>
              {selectedPerson.imageUrl ? (
                <Image source={{ uri: selectedPerson.imageUrl }} style={styles.personImage} />
              ) : (
                <View style={styles.personImagePlaceholder}>
                  <IconSymbol
                    ios_icon_name="person.fill"
                    android_material_icon_name="person"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
              )}
              <Text style={styles.dropdownText}>{selectedPerson.name}</Text>
            </View>
          ) : (
            <Text style={styles.dropdownPlaceholder}>Select from roster or bench</Text>
          )}
          <IconSymbol
            ios_icon_name="chevron.down"
            android_material_icon_name="arrow-drop-down"
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Location input */}
        <Text style={styles.sectionTitle}>Your Location</Text>
        <View style={styles.locationContainer}>
          <TextInput
            style={styles.locationInput}
            value={userLocation}
            onChangeText={setUserLocation}
            placeholder="Enter your city or location"
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity
            style={styles.locationButton}
            onPress={requestLocationPermission}
          >
            <IconSymbol
              ios_icon_name="location.fill"
              android_material_icon_name="my-location"
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.helperText}>
          📍 We&apos;ll use your location to suggest nearby date ideas
        </Text>

        <Text style={styles.sectionTitle}>Budget</Text>
        <View style={styles.optionsRow}>
          {BUDGET_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.optionButton, budget === option && styles.optionButtonActive]}
              onPress={() => setBudget(option)}
            >
              <Text style={[styles.optionText, budget === option && styles.optionTextActive]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Duration</Text>
        <View style={styles.optionsColumn}>
          {DURATION_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.optionButton, duration === option && styles.optionButtonActive]}
              onPress={() => setDuration(option)}
            >
              <Text style={[styles.optionText, duration === option && styles.optionTextActive]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Preferences (optional)</Text>
        <TextInput
          style={styles.textInput}
          value={preferences}
          onChangeText={setPreferences}
          placeholder="e.g., outdoor activities, food preferences..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerateSuggestions}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <IconSymbol
                ios_icon_name="sparkles"
                android_material_icon_name="auto-awesome"
                size={20}
                color="#fff"
              />
              <Text style={styles.generateButtonText}>Generate Suggestions</Text>
            </>
          )}
        </TouchableOpacity>
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
                  color={colors.text}
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
                      onPress={() => {
                        console.log('[PlanDate] User selected person:', person.name);
                        setSelectedPerson(person);
                        setShowPersonPicker(false);
                      }}
                    >
                      <View style={styles.personOptionContent}>
                        {person.imageUrl ? (
                          <Image source={{ uri: person.imageUrl }} style={styles.personOptionImage} />
                        ) : (
                          <View style={styles.personOptionImagePlaceholder}>
                            <IconSymbol
                              ios_icon_name="person.fill"
                              android_material_icon_name="person"
                              size={24}
                              color={colors.textSecondary}
                            />
                          </View>
                        )}
                        <View style={styles.personInfo}>
                          <Text style={styles.personOptionName}>{person.name}</Text>
                          <View style={[
                            styles.statusBadge,
                            { backgroundColor: isOnBench ? colors.red : colors.green }
                          ]}>
                            <Text style={styles.statusBadgeText}>
                              {isOnBench ? 'Bench' : 'Roster'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <IconSymbol
                        ios_icon_name="chevron.right"
                        android_material_icon_name="chevron-right"
                        size={20}
                        color={colors.textSecondary}
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

      {/* Suggestions Modal */}
      <Modal
        visible={showSuggestions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSuggestions(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowSuggestions(false)}
          />
          <View style={styles.suggestionsModal}>
            <View style={styles.dropdownHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Date Suggestions</Text>
              <TouchableOpacity onPress={() => setShowSuggestions(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {suggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={styles.suggestionCard}
                  onPress={() => handleSelectSuggestion(suggestion)}
                >
                  <Text style={styles.suggestionName}>{suggestion.name}</Text>
                  <Text style={styles.suggestionType}>{suggestion.type}</Text>
                  <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                  <View style={styles.suggestionDetails}>
                    <Text style={styles.suggestionDetail}>💰 {suggestion.estimatedCost}</Text>
                    <Text style={styles.suggestionDetail}>⏱️ {suggestion.duration}</Text>
                  </View>
                  <Text style={styles.suggestionWhy}>{suggestion.whyPerfect}</Text>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 12,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  selectedPersonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  personImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  personImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: colors.textSecondary,
    flex: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionsColumn: {
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  optionTextActive: {
    color: '#fff',
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  generateButtonText: {
    fontSize: 16,
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
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  suggestionsModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
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
    color: colors.text,
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
  personOptionImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  personOptionImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  personOptionName: {
    fontSize: 16,
    color: colors.text,
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
    color: colors.textSecondary,
  },
  suggestionCard: {
    backgroundColor: colors.card,
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  suggestionType: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  suggestionDescription: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  suggestionDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  suggestionDetail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  suggestionWhy: {
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.textSecondary,
  },
});
