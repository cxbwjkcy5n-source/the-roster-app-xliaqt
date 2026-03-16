
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
  Linking,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import * as Location from 'expo-location';
import { authenticatedPost } from '@/utils/api';
import { useRoster } from '@/contexts/RosterContext';
import { colors } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { RosterPerson } from '@/types/roster';
import LocationSearch, { PlaceSuggestion } from '@/components/LocationSearch';

interface DateSuggestion {
  id: string;
  name: string;
  type: string;
  description: string;
  estimatedCost: string;
  duration: string;
  whyPerfect: string;
  address?: string;
  websiteUrl?: string;
  googleMapsUrl?: string;
}

interface ActivityPlace {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  category?: string;
}

const BUDGET_OPTIONS = ['$', '$$', '$$$', '$$$$'];
const DURATION_OPTIONS = ['1-2 hours', '2-4 hours', '4+ hours', 'Full day'];

function getCategoryIcon(name: string, category?: string): string {
  const lower = (name + ' ' + (category || '')).toLowerCase();
  if (lower.includes('restaurant') || lower.includes('food') || lower.includes('eat') || lower.includes('dining')) return '🍽️';
  if (lower.includes('bar') || lower.includes('pub') || lower.includes('drink') || lower.includes('cocktail')) return '🍸';
  if (lower.includes('park') || lower.includes('garden') || lower.includes('nature') || lower.includes('trail')) return '🌳';
  if (lower.includes('museum') || lower.includes('gallery') || lower.includes('art') || lower.includes('exhibit')) return '🏛️';
  if (lower.includes('cinema') || lower.includes('movie') || lower.includes('theater') || lower.includes('theatre')) return '🎬';
  if (lower.includes('cafe') || lower.includes('coffee') || lower.includes('bakery')) return '☕';
  if (lower.includes('beach') || lower.includes('lake') || lower.includes('river')) return '🏖️';
  if (lower.includes('bowling') || lower.includes('arcade') || lower.includes('game')) return '🎳';
  return '📍';
}

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

  // Activity suggestions state
  const [activityPlaces, setActivityPlaces] = useState<ActivityPlace[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<ActivityPlace[]>([]);
  const [itinerary, setItinerary] = useState<ActivityPlace[]>([]);
  const [showItinerary, setShowItinerary] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('[PlanDate] Location request timed out');
    }, 10000);
    requestLocationPermission().finally(() => clearTimeout(timeoutId));
    return () => clearTimeout(timeoutId);
  }, []);

  const requestLocationPermission = async () => {
    try {
      console.log('[PlanDate] Requesting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('[PlanDate] Location permission denied');
        return;
      }
      console.log('[PlanDate] Getting current location...');
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 0,
      });
      if (!loc?.coords) return;
      const { latitude, longitude } = loc.coords;
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode?.length > 0) {
        const { city, region } = geocode[0];
        const locationString = city && region ? `${city}, ${region}` : city || region || '';
        setUserLocation(locationString);
        console.log('[PlanDate] Location set:', locationString);
      }
    } catch (error) {
      console.error('[PlanDate] Error getting location:', error);
    }
  };

  const handleLocationSelected = async (place: PlaceSuggestion) => {
    console.log('[PlanDate] Location selected from autocomplete:', place.description);
    setUserLocation(place.description);
    fetchNearbyActivities(place.description);
  };

  const fetchNearbyActivities = async (locationText: string) => {
    if (!locationText.trim()) return;
    setLoadingActivities(true);
    setActivityPlaces([]);
    setSelectedActivities([]);
    setShowItinerary(false);
    console.log('[PlanDate] Fetching nearby activities for:', locationText);
    try {
      const { authenticatedGet } = await import('@/utils/api');
      const query = encodeURIComponent(`${locationText} activities`);
      const data = await authenticatedGet(`/api/places/autocomplete?input=${query}`);
      const results: ActivityPlace[] = Array.isArray(data) ? data : (data?.predictions ?? []);
      console.log('[PlanDate] Got', results.length, 'nearby activity suggestions');
      setActivityPlaces(results);
    } catch (err) {
      console.error('[PlanDate] Error fetching nearby activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const toggleActivitySelection = (place: ActivityPlace) => {
    const isSelected = selectedActivities.some(a => a.place_id === place.place_id);
    if (isSelected) {
      console.log('[PlanDate] User deselected activity:', place.main_text);
      setSelectedActivities(prev => prev.filter(a => a.place_id !== place.place_id));
    } else {
      console.log('[PlanDate] User selected activity:', place.main_text);
      setSelectedActivities(prev => [...prev, place]);
    }
  };

  const handleBuildItinerary = () => {
    console.log('[PlanDate] User tapped Build Itinerary with', selectedActivities.length, 'activities');
    setItinerary([...selectedActivities]);
    setShowItinerary(true);
  };

  const moveItineraryItem = (index: number, direction: 'up' | 'down') => {
    const newItinerary = [...itinerary];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newItinerary.length) return;
    [newItinerary[index], newItinerary[swapIndex]] = [newItinerary[swapIndex], newItinerary[index]];
    console.log('[PlanDate] User reordered itinerary item:', newItinerary[swapIndex].main_text);
    setItinerary(newItinerary);
  };

  const handleGenerateSuggestions = async () => {
    console.log('[PlanDate] User tapped generate suggestions');
    if (!selectedPerson) {
      Alert.alert('Select Person', 'Please select someone from your roster');
      return;
    }
    if (!userLocation.trim()) {
      Alert.alert('Location Required', 'Please enter your location to get personalized suggestions');
      return;
    }
    setLoading(true);
    console.log('[PlanDate] Generating date suggestions for:', selectedPerson.name, 'at:', userLocation);
    try {
      const response = await authenticatedPost('/api/dates/plan', {
        profileId: selectedPerson.id,
        budget,
        duration,
        preferences,
        location: userLocation,
      });
      console.log('[PlanDate] Generated', response.suggestions?.length ?? 0, 'AI suggestions');
      setSuggestions((response.suggestions ?? []).map((s: any, index: number) => ({
        ...s,
        id: `${index + 1}`,
      })));
      setShowSuggestions(true);
    } catch (error) {
      console.error('[PlanDate] Error generating suggestions:', error);
      Alert.alert('Error', 'Failed to generate suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: DateSuggestion) => {
    console.log('[PlanDate] User tapped suggestion:', suggestion.name);
    Alert.alert(
      'Schedule Date',
      `Would you like to schedule "${suggestion.name}" with ${selectedPerson?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Schedule',
          onPress: () => {
            console.log('[PlanDate] User confirmed scheduling suggestion:', suggestion.name);
            setShowSuggestions(false);
            router.push('/dating/schedule' as any);
          },
        },
      ]
    );
  };

  const allPeople = [...roster, ...bench];

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />

        <LinearGradient colors={['#FF6B9D', '#C44569']} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              console.log('[PlanDate] User tapped back button');
              router.back();
            }}
          >
            <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plan a Date</Text>
          <View style={styles.headerSpacer} />
        </LinearGradient>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Person picker */}
          <Text style={styles.sectionTitle}>Who are you planning a date with?</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => {
              console.log('[PlanDate] User tapped person dropdown');
              Keyboard.dismiss();
              setShowPersonPicker(true);
            }}
          >
            {selectedPerson ? (
              <View style={styles.selectedPersonContent}>
                {selectedPerson.imageUrl ? (
                  <Image source={{ uri: selectedPerson.imageUrl }} style={styles.personImage} />
                ) : (
                  <View style={styles.personImagePlaceholder}>
                    <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={20} color={colors.textSecondary} />
                  </View>
                )}
                <Text style={styles.dropdownText}>{selectedPerson.name}</Text>
              </View>
            ) : (
              <Text style={styles.dropdownPlaceholder}>Select from roster or bench</Text>
            )}
            <IconSymbol ios_icon_name="chevron.down" android_material_icon_name="arrow-drop-down" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Location with smart autocomplete */}
          <Text style={styles.sectionTitle}>Your Location</Text>
          <View style={styles.locationSearchWrapper}>
            <LocationSearch
              value={userLocation}
              onChangeText={setUserLocation}
              onSelectPlace={handleLocationSelected}
              placeholder="Enter your city or location..."
            />
            <TouchableOpacity style={styles.locationGpsButton} onPress={requestLocationPermission}>
              <IconSymbol ios_icon_name="location.fill" android_material_icon_name="my-location" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>📍 We'll use your location to suggest nearby date ideas</Text>

          {/* Activities nearby */}
          {(activityPlaces.length > 0 || loadingActivities) && (
            <View style={styles.activitiesSection}>
              <Text style={styles.sectionTitle}>Activities nearby</Text>
              {loadingActivities ? (
                <View style={styles.activitiesLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.activitiesLoadingText}>Finding activities...</Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.activitiesScroll}
                  keyboardShouldPersistTaps="handled"
                >
                  {activityPlaces.map((place) => {
                    const isSelected = selectedActivities.some(a => a.place_id === place.place_id);
                    const icon = getCategoryIcon(place.main_text, place.category);
                    return (
                      <TouchableOpacity
                        key={place.place_id}
                        style={[styles.activityCard, isSelected && styles.activityCardSelected]}
                        onPress={() => toggleActivitySelection(place)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.activityIcon}>{icon}</Text>
                        <Text style={styles.activityName} numberOfLines={2}>{place.main_text}</Text>
                        <Text style={styles.activityAddress} numberOfLines={1}>{place.secondary_text}</Text>
                        {isSelected && (
                          <View style={styles.activityCheckmark}>
                            <Text style={styles.activityCheckmarkText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {selectedActivities.length > 0 && !showItinerary && (
                <TouchableOpacity style={styles.buildItineraryButton} onPress={handleBuildItinerary}>
                  <Text style={styles.buildItineraryText}>
                    Build Itinerary ({selectedActivities.length} selected)
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Itinerary */}
          {showItinerary && itinerary.length > 0 && (
            <View style={styles.itinerarySection}>
              <View style={styles.itineraryHeader}>
                <Text style={styles.sectionTitle}>Your Itinerary</Text>
                <TouchableOpacity onPress={() => {
                  console.log('[PlanDate] User dismissed itinerary');
                  setShowItinerary(false);
                }}>
                  <Text style={styles.itineraryEditText}>Edit</Text>
                </TouchableOpacity>
              </View>
              {itinerary.map((place, index) => {
                const icon = getCategoryIcon(place.main_text, place.category);
                return (
                  <View key={place.place_id} style={styles.itineraryItem}>
                    <View style={styles.itineraryStep}>
                      <Text style={styles.itineraryStepNum}>{index + 1}</Text>
                    </View>
                    <Text style={styles.itineraryIcon}>{icon}</Text>
                    <View style={styles.itineraryInfo}>
                      <Text style={styles.itineraryName}>{place.main_text}</Text>
                      <Text style={styles.itineraryAddress} numberOfLines={1}>{place.secondary_text}</Text>
                    </View>
                    <View style={styles.itineraryArrows}>
                      <TouchableOpacity
                        onPress={() => moveItineraryItem(index, 'up')}
                        disabled={index === 0}
                        style={[styles.arrowBtn, index === 0 && styles.arrowBtnDisabled]}
                      >
                        <Text style={styles.arrowText}>▲</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => moveItineraryItem(index, 'down')}
                        disabled={index === itinerary.length - 1}
                        style={[styles.arrowBtn, index === itinerary.length - 1 && styles.arrowBtnDisabled]}
                      >
                        <Text style={styles.arrowText}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
              <TouchableOpacity
                style={styles.scheduleWithItineraryButton}
                onPress={() => {
                  console.log('[PlanDate] User tapped Schedule with Itinerary');
                  router.push('/dating/schedule' as any);
                }}
              >
                <Text style={styles.scheduleWithItineraryText}>Schedule This Date</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Budget */}
          <Text style={styles.sectionTitle}>Budget</Text>
          <View style={styles.optionsRow}>
            {BUDGET_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, budget === option && styles.optionButtonActive]}
                onPress={() => {
                  console.log('[PlanDate] User selected budget:', option);
                  setBudget(option);
                }}
              >
                <Text style={[styles.optionText, budget === option && styles.optionTextActive]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Duration */}
          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.optionsColumn}>
            {DURATION_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, duration === option && styles.optionButtonActive]}
                onPress={() => {
                  console.log('[PlanDate] User selected duration:', option);
                  setDuration(option);
                }}
              >
                <Text style={[styles.optionText, duration === option && styles.optionTextActive]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Preferences */}
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

          <TouchableOpacity style={styles.generateButton} onPress={handleGenerateSuggestions} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <IconSymbol ios_icon_name="sparkles" android_material_icon_name="auto-awesome" size={20} color="#fff" />
                <Text style={styles.generateButtonText}>Generate Suggestions</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Person Picker Modal */}
        <Modal visible={showPersonPicker} transparent animationType="slide" onRequestClose={() => setShowPersonPicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowPersonPicker(false)} />
            <View style={styles.dropdownModal}>
              <View style={styles.dropdownHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Person</Text>
                <TouchableOpacity onPress={() => setShowPersonPicker(false)}>
                  <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color={colors.text} />
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
                              <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={24} color={colors.textSecondary} />
                            </View>
                          )}
                          <View style={styles.personInfo}>
                            <Text style={styles.personOptionName}>{person.name}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: isOnBench ? colors.red : colors.green }]}>
                              <Text style={styles.statusBadgeText}>{isOnBench ? 'Bench' : 'Roster'}</Text>
                            </View>
                          </View>
                        </View>
                        <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
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
        <Modal visible={showSuggestions} transparent animationType="slide" onRequestClose={() => setShowSuggestions(false)}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowSuggestions(false)} />
            <View style={styles.suggestionsModal}>
              <View style={styles.dropdownHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Date Suggestions</Text>
                <TouchableOpacity onPress={() => setShowSuggestions(false)}>
                  <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {suggestions.map((suggestion) => (
                  <View key={suggestion.id} style={styles.suggestionCard}>
                    <TouchableOpacity onPress={() => handleSelectSuggestion(suggestion)}>
                      <Text style={styles.suggestionName}>{suggestion.name}</Text>
                      <Text style={styles.suggestionType}>{suggestion.type}</Text>
                      <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                      {suggestion.address && (
                        <View style={styles.suggestionAddressRow}>
                          <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={14} color={colors.textSecondary} />
                          <Text style={styles.suggestionAddress}>{suggestion.address}</Text>
                        </View>
                      )}
                      <View style={styles.suggestionDetails}>
                        <Text style={styles.suggestionDetail}>💰 {suggestion.estimatedCost}</Text>
                        <Text style={styles.suggestionDetail}>⏱️ {suggestion.duration}</Text>
                      </View>
                      <Text style={styles.suggestionWhy}>{suggestion.whyPerfect}</Text>
                    </TouchableOpacity>
                    <View style={styles.suggestionLinks}>
                      {suggestion.websiteUrl && (
                        <TouchableOpacity
                          style={styles.suggestionLinkButton}
                          onPress={() => {
                            console.log('[PlanDate] Opening website:', suggestion.websiteUrl);
                            Linking.openURL(suggestion.websiteUrl!);
                          }}
                        >
                          <IconSymbol ios_icon_name="globe" android_material_icon_name="language" size={16} color={colors.primary} />
                          <Text style={styles.suggestionLinkText}>Website</Text>
                        </TouchableOpacity>
                      )}
                      {suggestion.googleMapsUrl && (
                        <TouchableOpacity
                          style={styles.suggestionLinkButton}
                          onPress={() => {
                            console.log('[PlanDate] Opening Google Maps:', suggestion.googleMapsUrl);
                            Linking.openURL(suggestion.googleMapsUrl!);
                          }}
                        >
                          <IconSymbol ios_icon_name="map.fill" android_material_icon_name="map" size={16} color={colors.primary} />
                          <Text style={styles.suggestionLinkText}>Google Maps</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSpacer: { width: 40 },
  content: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 16, marginBottom: 12 },
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
  selectedPersonContent: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  personImage: { width: 40, height: 40, borderRadius: 20 },
  personImagePlaceholder: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.backgroundAlt, justifyContent: 'center', alignItems: 'center',
  },
  dropdownText: { fontSize: 16, color: colors.text, fontWeight: '500' },
  dropdownPlaceholder: { fontSize: 16, color: colors.textSecondary, flex: 1 },
  locationSearchWrapper: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  locationGpsButton: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center', marginTop: 0,
  },
  helperText: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  // Activities
  activitiesSection: { marginTop: 8 },
  activitiesLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  activitiesLoadingText: { fontSize: 14, color: colors.textSecondary },
  activitiesScroll: { paddingBottom: 8, gap: 12 },
  activityCard: {
    width: 130,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    position: 'relative',
  },
  activityCardSelected: {
    borderColor: colors.rosterGreen,
    backgroundColor: colors.rosterGreen + '10',
  },
  activityIcon: { fontSize: 28, marginBottom: 6 },
  activityName: { fontSize: 12, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 4 },
  activityAddress: { fontSize: 10, color: colors.textSecondary, textAlign: 'center' },
  activityCheckmark: {
    position: 'absolute', top: 6, right: 6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.rosterGreen, justifyContent: 'center', alignItems: 'center',
  },
  activityCheckmarkText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  buildItineraryButton: {
    backgroundColor: colors.rosterGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buildItineraryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  // Itinerary
  itinerarySection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  itineraryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itineraryEditText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  itineraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  itineraryStep: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.rosterGreen, justifyContent: 'center', alignItems: 'center',
  },
  itineraryStepNum: { fontSize: 13, fontWeight: '700', color: '#fff' },
  itineraryIcon: { fontSize: 20 },
  itineraryInfo: { flex: 1 },
  itineraryName: { fontSize: 14, fontWeight: '600', color: colors.text },
  itineraryAddress: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  itineraryArrows: { flexDirection: 'column', gap: 2 },
  arrowBtn: { padding: 4 },
  arrowBtnDisabled: { opacity: 0.3 },
  arrowText: { fontSize: 12, color: colors.textSecondary },
  scheduleWithItineraryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  scheduleWithItineraryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  // Budget / Duration
  optionsRow: { flexDirection: 'row', gap: 12 },
  optionsColumn: { gap: 12 },
  optionButton: {
    flex: 1, paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  optionButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { fontSize: 14, fontWeight: '600', color: colors.text },
  optionTextActive: { color: '#fff' },
  textInput: {
    backgroundColor: colors.card, borderRadius: 12, padding: 12,
    fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border,
    minHeight: 100, textAlignVertical: 'top',
  },
  generateButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, marginTop: 24,
  },
  generateButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  // Modals
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  dropdownModal: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '60%' },
  suggestionsModal: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  dropdownHandle: { width: 40, height: 5, backgroundColor: colors.border, borderRadius: 3, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  dropdownScroll: { maxHeight: 400 },
  personOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  personOptionContent: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  personOptionImage: { width: 48, height: 48, borderRadius: 24 },
  personOptionImagePlaceholder: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.backgroundAlt, justifyContent: 'center', alignItems: 'center',
  },
  personInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  personOptionName: { fontSize: 16, color: colors.text, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  emptyState: { padding: 32, alignItems: 'center' },
  emptyStateText: { fontSize: 14, color: colors.textSecondary },
  suggestionCard: {
    backgroundColor: colors.card, padding: 16, margin: 16,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border,
  },
  suggestionName: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  suggestionType: { fontSize: 12, fontWeight: '600', color: colors.primary, marginBottom: 8 },
  suggestionDescription: { fontSize: 14, color: colors.text, marginBottom: 12 },
  suggestionDetails: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  suggestionDetail: { fontSize: 12, color: colors.textSecondary },
  suggestionWhy: { fontSize: 12, fontStyle: 'italic', color: colors.textSecondary, marginBottom: 12 },
  suggestionAddressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  suggestionAddress: { fontSize: 12, color: colors.textSecondary, flex: 1 },
  suggestionLinks: {
    flexDirection: 'row', gap: 12, marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  suggestionLinkButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: colors.primary + '10', borderRadius: 8, borderWidth: 1, borderColor: colors.primary + '30',
  },
  suggestionLinkText: { fontSize: 13, fontWeight: '600', color: colors.primary },
});
