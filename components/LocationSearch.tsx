/**
 * Smart address search field with Google Places autocomplete.
 * Debounced 400ms, shows dropdown with main_text + secondary_text.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { authenticatedGet } from '@/utils/api';

export interface PlaceSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

interface LocationSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectPlace: (place: PlaceSuggestion) => void;
  placeholder?: string;
}

export default function LocationSearch({
  value,
  onChangeText,
  onSelectPlace,
  placeholder = 'Search for a location...',
}: LocationSearchProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (text: string) => {
    if (text.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    console.log('[LocationSearch] Fetching autocomplete for:', text);
    try {
      const data = await authenticatedGet(
        `/api/places/autocomplete?input=${encodeURIComponent(text)}`
      );
      console.log('[LocationSearch] Got', Array.isArray(data) ? data.length : 0, 'suggestions');
      const results: PlaceSuggestion[] = Array.isArray(data) ? data : (data?.predictions ?? []);
      setSuggestions(results);
      setShowDropdown(results.length > 0);
    } catch (err) {
      console.error('[LocationSearch] Autocomplete error:', err);
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChangeText = (text: string) => {
    onChangeText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 400);
  };

  const handleSelect = (place: PlaceSuggestion) => {
    console.log('[LocationSearch] User selected place:', place.description);
    onChangeText(place.description);
    onSelectPlace(place);
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleClear = () => {
    console.log('[LocationSearch] User cleared location input');
    onChangeText('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <View style={styles.wrapper}>
      {/* Input row */}
      <View style={styles.inputRow}>
        <Text style={styles.pinIcon}>📍</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          onBlur={() => {
            // Delay so tap on suggestion registers first
            setTimeout(() => setShowDropdown(false), 200);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
        />
        {loading && (
          <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />
        )}
        {!loading && value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            scrollEnabled={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.suggestionItem,
                  index < suggestions.length - 1 && styles.suggestionBorder,
                ]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.pinSmall}>📍</Text>
                <View style={styles.suggestionText}>
                  <Text style={styles.mainText} numberOfLines={1}>
                    {item.main_text || item.description}
                  </Text>
                  {item.secondary_text ? (
                    <Text style={styles.secondaryText} numberOfLines={1}>
                      {item.secondary_text}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 100,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minHeight: 48,
  },
  pinIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 8,
  },
  spinner: {
    marginLeft: 8,
  },
  clearBtn: {
    marginLeft: 8,
    padding: 4,
  },
  clearIcon: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pinSmall: {
    fontSize: 14,
  },
  suggestionText: {
    flex: 1,
  },
  mainText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  secondaryText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
