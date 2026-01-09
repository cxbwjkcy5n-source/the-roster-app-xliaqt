
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
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';
import { RosterPerson, InterestLevel, RelationshipType } from '@/types/roster';
import { getZodiacFromBirthday } from '@/utils/zodiac';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const relationshipTypes: { value: RelationshipType; label: string }[] = [
  { value: 'dating', label: 'Dating' },
  { value: 'casual', label: 'Casual' },
  { value: 'serious', label: 'Serious' },
  { value: 'friendzone', label: 'Friend Zone' },
  { value: 'booty-call', label: 'Booty Call' },
  { value: 'drink-buddy', label: 'Someone to Drink With' },
  { value: 'exploring', label: 'Exploring' },
  { value: 'other', label: 'Other' },
];

export default function AddPersonScreen() {
  const router = useRouter();
  const { addPerson } = useRoster();

  const [saving, setSaving] = useState(false);
  const [photoUri, setPhotoUri] = useState<string>();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [birthMonth, setBirthMonth] = useState(1);
  const [birthYear, setBirthYear] = useState(new Date().getFullYear());
  const [interestLevel, setInterestLevel] = useState<InterestLevel>('medium');
  const [favoriteColor, setFavoriteColor] = useState('');
  const [favoriteFoodType, setFavoriteFoodType] = useState('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('dating');
  const [customRelationshipType, setCustomRelationshipType] = useState('');
  const [location, setLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [facebook, setFacebook] = useState('');
  const [snapchat, setSnapchat] = useState('');
  const [notes, setNotes] = useState('');
  const [redFlagInput, setRedFlagInput] = useState('');
  const [greenFlagInput, setGreenFlagInput] = useState('');
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [greenFlags, setGreenFlags] = useState<string[]>([]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const addRedFlag = () => {
    if (redFlagInput.trim()) {
      setRedFlags([...redFlags, redFlagInput.trim()]);
      setRedFlagInput('');
    }
  };

  const addGreenFlag = () => {
    if (greenFlagInput.trim()) {
      setGreenFlags([...greenFlags, greenFlagInput.trim()]);
      setGreenFlagInput('');
    }
  };

  const removeRedFlag = (index: number) => {
    setRedFlags(redFlags.filter((_, i) => i !== index));
  };

  const removeGreenFlag = (index: number) => {
    setGreenFlags(greenFlags.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    if (!age || isNaN(Number(age))) {
      Alert.alert('Error', 'Please enter a valid age');
      return;
    }

    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }

    try {
      setSaving(true);
      
      // Upload image if one was selected
      let uploadedImageUrl: string | undefined;
      if (photoUri) {
        console.log('[AddPerson] Uploading image...');
        // Note: Image upload would require multipart/form-data
        // For now, we'll use the local URI and let the backend handle it later
        // In production, you'd want to implement proper image upload
        uploadedImageUrl = photoUri;
      }

      const person: RosterPerson = {
        id: Date.now().toString(),
        name: name.trim(),
        age: Number(age),
        birthday: {
          month: birthMonth,
          year: birthYear,
        },
        zodiacSign: getZodiacFromBirthday(birthMonth, birthYear),
        favoriteColor: favoriteColor.trim() || undefined,
        favoriteFoodType: favoriteFoodType.trim() || undefined,
        relationshipType,
        customRelationshipType: relationshipType === 'other' ? customRelationshipType.trim() : undefined,
        location: location.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        instagram: instagram.trim() || undefined,
        twitter: twitter.trim() || undefined,
        facebook: facebook.trim() || undefined,
        snapchat: snapchat.trim() || undefined,
        notes: notes.trim() || undefined,
        redFlags: redFlags.map((text, index) => ({ id: `red-${index}`, text, type: 'red' })),
        greenFlags: greenFlags.map((text, index) => ({ id: `green-${index}`, text, type: 'green' })),
        interestLevel,
        photoUri: uploadedImageUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('[AddPerson] Saving person:', person.name);
      await addPerson(person);
      console.log('[AddPerson] Person saved successfully');
      router.back();
    } catch (error: any) {
      console.error('[AddPerson] Error saving person:', error);
      Alert.alert('Error', error.message || 'Failed to save person');
    } finally {
      setSaving(false);
    }
  };

  const getInterestColor = (level: InterestLevel) => {
    switch (level) {
      case 'high': return colors.primary;
      case 'medium': return colors.accent;
      case 'low': return colors.highlight;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} disabled={saving}>
          <Text style={[styles.cancelButton, saving && { opacity: 0.5 }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add to Roster</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveButton, saving && { opacity: 0.5 }]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <IconSymbol
                ios_icon_name="camera.fill"
                android_material_icon_name="camera"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.photoPlaceholderText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interest Level</Text>
          <View style={styles.interestContainer}>
            {(['low', 'medium', 'high'] as InterestLevel[]).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.interestButton,
                  interestLevel === level && { backgroundColor: getInterestColor(level) },
                ]}
                onPress={() => setInterestLevel(level)}
              >
                <Text
                  style={[
                    styles.interestButtonText,
                    interestLevel === level && styles.interestButtonTextActive,
                  ]}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter name"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.label}>Age *</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="Age"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
            />
          </View>
          <View style={[styles.section, { flex: 2, marginLeft: 12 }]}>
            <Text style={styles.label}>Birthday</Text>
            <View style={styles.birthdayContainer}>
              <TextInput
                style={[styles.input, { flex: 2 }]}
                value={months[birthMonth - 1]}
                placeholder="Month"
                placeholderTextColor={colors.textSecondary}
                editable={false}
              />
              <TextInput
                style={[styles.input, { flex: 1, marginLeft: 8 }]}
                value={birthYear.toString()}
                placeholder="Year"
                placeholderTextColor={colors.textSecondary}
                editable={false}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Zodiac Sign</Text>
          <View style={styles.zodiacContainer}>
            <Text style={styles.zodiacText}>{getZodiacFromBirthday(birthMonth, birthYear)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Favorite Color</Text>
          <TextInput
            style={styles.input}
            value={favoriteColor}
            onChangeText={setFavoriteColor}
            placeholder="Enter favorite color"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Favorite Food Type</Text>
          <TextInput
            style={styles.input}
            value={favoriteFoodType}
            onChangeText={setFavoriteFoodType}
            placeholder="Enter favorite food type"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Relationship Type</Text>
          <View style={styles.relationshipGrid}>
            {relationshipTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.relationshipButton,
                  relationshipType === type.value && styles.relationshipButtonActive,
                ]}
                onPress={() => setRelationshipType(type.value)}
              >
                <Text
                  style={[
                    styles.relationshipButtonText,
                    relationshipType === type.value && styles.relationshipButtonTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {relationshipType === 'other' && (
            <TextInput
              style={[styles.input, { marginTop: 12 }]}
              value={customRelationshipType}
              onChangeText={setCustomRelationshipType}
              placeholder="Enter custom relationship type"
              placeholderTextColor={colors.textSecondary}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Enter location"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Enter phone number"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Media</Text>
          <TextInput
            style={styles.input}
            value={instagram}
            onChangeText={setInstagram}
            placeholder="Instagram"
            placeholderTextColor={colors.textSecondary}
          />
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            value={twitter}
            onChangeText={setTwitter}
            placeholder="Twitter (X)"
            placeholderTextColor={colors.textSecondary}
          />
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            value={facebook}
            onChangeText={setFacebook}
            placeholder="Facebook"
            placeholderTextColor={colors.textSecondary}
          />
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            value={snapchat}
            onChangeText={setSnapchat}
            placeholder="Snapchat"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Red Flags 🚩</Text>
          <View style={styles.flagInputContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={redFlagInput}
              onChangeText={setRedFlagInput}
              placeholder="Add a red flag"
              placeholderTextColor={colors.textSecondary}
              onSubmitEditing={addRedFlag}
            />
            <TouchableOpacity style={styles.addButton} onPress={addRedFlag}>
              <IconSymbol
                ios_icon_name="plus"
                android_material_icon_name="add"
                size={20}
                color={colors.white}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.flagsContainer}>
            {redFlags.map((flag, index) => (
              <View key={index} style={[styles.flagChip, { backgroundColor: colors.highlight }]}>
                <Text style={styles.flagChipText}>{flag}</Text>
                <TouchableOpacity onPress={() => removeRedFlag(index)}>
                  <IconSymbol
                    ios_icon_name="xmark"
                    android_material_icon_name="close"
                    size={16}
                    color={colors.white}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Green Flags ✅</Text>
          <View style={styles.flagInputContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={greenFlagInput}
              onChangeText={setGreenFlagInput}
              placeholder="Add a green flag"
              placeholderTextColor={colors.textSecondary}
              onSubmitEditing={addGreenFlag}
            />
            <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={addGreenFlag}>
              <IconSymbol
                ios_icon_name="plus"
                android_material_icon_name="add"
                size={20}
                color={colors.white}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.flagsContainer}>
            {greenFlags.map((flag, index) => (
              <View key={index} style={[styles.flagChip, { backgroundColor: colors.primary }]}>
                <Text style={styles.flagChipText}>{flag}</Text>
                <TouchableOpacity onPress={() => removeGreenFlag(index)}>
                  <IconSymbol
                    ios_icon_name="xmark"
                    android_material_icon_name="close"
                    size={16}
                    color={colors.white}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  cancelButton: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  photoContainer: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  photo: {
    width: 150,
    height: 200,
    borderRadius: 16,
  },
  photoPlaceholder: {
    width: 150,
    height: 200,
    borderRadius: 16,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  birthdayContainer: {
    flexDirection: 'row',
  },
  zodiacContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  zodiacText: {
    fontSize: 16,
    color: colors.text,
  },
  interestContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  interestButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  interestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  interestButtonTextActive: {
    color: colors.white,
  },
  relationshipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationshipButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  relationshipButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  relationshipButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  relationshipButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  flagInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  flagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  flagChipText: {
    fontSize: 14,
    color: colors.white,
  },
});
