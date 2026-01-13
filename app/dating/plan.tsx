
import React, { useState } from 'react';
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
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';
import { RosterPerson } from '@/types/roster';
import { authenticatedPost, BACKEND_URL } from '@/utils/api';

const BUDGET_OPTIONS = [
  { label: '$', value: 'low', description: 'Under $50' },
  { label: '$$', value: 'medium', description: '$50-$150' },
  { label: '$$$', value: 'high', description: '$150-$300' },
  { label: '$$$$', value: 'luxury', description: '$300+' },
];

const DURATION_OPTIONS = [
  { label: '1-2 hours', value: 'short' },
  { label: '3-4 hours', value: 'medium' },
  { label: '5+ hours', value: 'long' },
  { label: 'Full day', value: 'fullday' },
];

interface DateSuggestion {
  id: string;
  name: string;
  type: string;
  description: string;
  estimatedCost: string;
  duration: string;
  whyPerfect: string;
}

export default function PlanDateScreen() {
  const router = useRouter();
  const { roster } = useRoster();
  
  const [selectedPerson, setSelectedPerson] = useState('');
  const [selectedPersonName, setSelectedPersonName] = useState('');
  const [selectedPersonData, setSelectedPersonData] = useState<RosterPerson | null>(null);
  const [city, setCity] = useState('');
  const [budget, setBudget] = useState('medium');
  const [duration, setDuration] = useState('medium');
  const [suggestions, setSuggestions] = useState<DateSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [showPersonPicker, setShowPersonPicker] = useState(false);

  const handleGenerateSuggestions = async () => {
    console.log('[PlanDate] User tapped Generate Suggestions');
    
    if (!selectedPerson) {
      Alert.alert('Error', 'Please select a person');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Error', 'Please enter a city');
      return;
    }

    // Note: AI date planning feature is not yet available in the backend
    // This is a placeholder for future implementation
    Alert.alert(
      'Coming Soon',
      'AI-powered date suggestions will be available in a future update. For now, you can schedule dates manually from the Dating menu.',
      [{ text: 'OK' }]
    );
    
    // Mock suggestions for demonstration (remove when backend is ready)
    // setLoading(true);
    // setTimeout(() => {
    //   setSuggestions([
    //     {
    //       id: '1',
    //       name: 'Romantic Dinner',
    //       type: 'dinner',
    //       description: 'A cozy Italian restaurant with candlelight ambiance',
    //       estimatedCost: '$80-120',
    //       duration: '2-3 hours',
    //       whyPerfect: `Based on ${selectedPersonName}'s love for Italian food and romantic settings`,
    //     },
    //   ]);
    //   setLoading(false);
    // }, 1000);
  };

  const handleSelectSuggestion = (suggestion: DateSuggestion) => {
    console.log('[PlanDate] User selected suggestion:', suggestion.name);
    Alert.alert(
      'Schedule This Date?',
      `Would you like to schedule "${suggestion.name}" with ${selectedPersonName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Schedule',
          onPress: () => {
            router.push('/dating/schedule' as any);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Plan a Date',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.subtitle}>
          Get AI-powered date suggestions based on your person's preferences
        </Text>

        {/* Person Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Select Person *</Text>
          <TouchableOpacity
            style={styles.formInput}
            onPress={() => setShowPersonPicker(true)}
          >
            <View style={styles.personDisplay}>
              {selectedPersonData?.imageUrl && (
                <Image
                  source={{ uri: selectedPersonData.imageUrl }}
                  style={styles.personPhoto}
                />
              )}
              <Text style={[styles.formInputText, !selectedPersonName && styles.placeholder]}>
                {selectedPersonName || 'Select person'}
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.down"
              android_material_icon_name="arrow-drop-down"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* City */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>City *</Text>
          <TextInput
            style={[styles.formInput, styles.textInput]}
            value={city}
            onChangeText={setCity}
            placeholder="Enter city name"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Budget */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Budget</Text>
          <View style={styles.optionsGrid}>
            {BUDGET_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.optionButton, budget === option.value && styles.optionButtonActive]}
                onPress={() => setBudget(option.value)}
              >
                <Text style={[styles.optionLabel, budget === option.value && styles.optionLabelActive]}>
                  {option.label}
                </Text>
                <Text style={[styles.optionDescription, budget === option.value && styles.optionDescriptionActive]}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Duration */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Duration</Text>
          <View style={styles.optionsGrid}>
            {DURATION_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.optionButton, duration === option.value && styles.optionButtonActive]}
                onPress={() => setDuration(option.value)}
              >
                <Text style={[styles.optionLabel, duration === option.value && styles.optionLabelActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerateSuggestions}
          disabled={loading}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.generateButtonGradient}
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
          </LinearGradient>
        </TouchableOpacity>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Date Suggestions</Text>
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.id}
                style={styles.suggestionCard}
                onPress={() => handleSelectSuggestion(suggestion)}
              >
                <View style={styles.suggestionHeader}>
                  <Text style={styles.suggestionName}>{suggestion.name}</Text>
                  <View style={styles.suggestionType}>
                    <Text style={styles.suggestionTypeText}>{suggestion.type}</Text>
                  </View>
                </View>
                <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                <View style={styles.suggestionDetails}>
                  <View style={styles.suggestionDetail}>
                    <IconSymbol
                      ios_icon_name="dollarsign.circle"
                      android_material_icon_name="attach-money"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.suggestionDetailText}>{suggestion.estimatedCost}</Text>
                  </View>
                  <View style={styles.suggestionDetail}>
                    <IconSymbol
                      ios_icon_name="clock"
                      android_material_icon_name="access-time"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.suggestionDetailText}>{suggestion.duration}</Text>
                  </View>
                </View>
                <View style={styles.whyPerfect}>
                  <IconSymbol
                    ios_icon_name="heart.fill"
                    android_material_icon_name="favorite"
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={styles.whyPerfectText}>{suggestion.whyPerfect}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Person</Text>
              <TouchableOpacity onPress={() => setShowPersonPicker(false)}>
                <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {roster.map((person) => (
                <TouchableOpacity
                  key={person.id}
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedPerson(person.id);
                    setSelectedPersonName(person.name);
                    setSelectedPersonData(person);
                    setShowPersonPicker(false);
                  }}
                >
                  {person.imageUrl && (
                    <Image
                      source={{ uri: person.imageUrl }}
                      style={styles.pickerPersonPhoto}
                    />
                  )}
                  <Text style={styles.pickerItemText}>{person.name}</Text>
                  {selectedPerson === person.id && (
                    <IconSymbol
                      ios_icon_name="checkmark"
                      android_material_icon_name="check"
                      size={20}
                      color={colors.primary}
                    />
                  )}
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  formInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formInputText: {
    fontSize: 16,
    color: colors.text,
  },
  placeholder: {
    color: colors.textSecondary,
  },
  textInput: {
    color: colors.text,
  },
  personDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  personPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  optionLabelActive: {
    color: '#fff',
  },
  optionDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  optionDescriptionActive: {
    color: '#fff',
    opacity: 0.9,
  },
  generateButton: {
    marginTop: 8,
    marginBottom: 32,
    borderRadius: 12,
    overflow: 'hidden',
  },
  generateButtonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  suggestionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  suggestionType: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  suggestionTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  suggestionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  suggestionDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  suggestionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  suggestionDetailText: {
    fontSize: 14,
    color: colors.text,
  },
  whyPerfect: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
  },
  whyPerfectText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: colors.backgroundAlt,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  pickerPersonPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
});
