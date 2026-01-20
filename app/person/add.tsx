
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
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';
import { RosterPerson, InterestLevel, RelationshipType } from '@/types/roster';
import { getZodiacFromBirthday, getZodiacEmoji } from '@/utils/zodiac';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const relationshipTypes: { value: RelationshipType; label: string }[] = [
  { value: 'dating', label: 'Dating' },
  { value: 'casual', label: 'Casual' },
  { value: 'serious', label: 'Serious' },
  { value: 'friendzone', label: 'Friend Zone' },
  { value: 'booty call', label: 'Booty Call' },
  { value: 'someone to drink with', label: 'Someone to Drink With' },
  { value: 'exploring', label: 'Exploring' },
  { value: 'other', label: 'Other' },
];

const favoriteColors = [
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Green', hex: '#00FF00' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Lavender', hex: '#E6E6FA' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Navy', hex: '#000080' },
];

const favoriteFoodTypes = [
  'Italian', 'Mexican', 'Chinese', 'Japanese', 'Thai', 'Indian', 'American', 'French', 'Mediterranean', 'Korean', 'Vietnamese', 'Greek', 'Spanish', 'Vegan', 'Pescetarian', 'Vegetarian', 'BBQ', 'Seafood', 'Fast Food', 'Other'
];

export default function AddPersonScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { addPerson, updatePerson, roster, bench, refreshProfiles } = useRoster();

  const isEditing = !!id;
  const [saving, setSaving] = useState(false);
  const [photoUri, setPhotoUri] = useState<string>();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [birthMonth, setBirthMonth] = useState(1);
  const [birthDay, setBirthDay] = useState(1);
  const [interestLevel, setInterestLevel] = useState<InterestLevel>('medium');
  const [favoriteColor, setFavoriteColor] = useState('');
  const [favoriteColorHex, setFavoriteColorHex] = useState('');
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

  // Dropdown states
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFoodPicker, setShowFoodPicker] = useState(false);

  // Load existing person data if editing
  useEffect(() => {
    if (isEditing && id) {
      console.log('[AddPerson] Editing mode - loading person with id:', id);
      const allPeople = [...roster, ...bench];
      const existingPerson = allPeople.find(p => p.id === id);
      
      if (existingPerson) {
        console.log('[AddPerson] Found person to edit:', existingPerson.name);
        setPhotoUri(existingPerson.imageUrl);
        setName(existingPerson.name);
        setAge(existingPerson.age.toString());
        setBirthMonth(existingPerson.birthdayMonth);
        setBirthDay(existingPerson.birthdayDay);
        setInterestLevel(existingPerson.interestLevel);
        setFavoriteColor(existingPerson.favoriteColor);
        const colorObj = favoriteColors.find(c => c.name === existingPerson.favoriteColor);
        if (colorObj) setFavoriteColorHex(colorObj.hex);
        setFavoriteFoodType(existingPerson.favoriteFoodType);
        setRelationshipType(existingPerson.relationshipType);
        setCustomRelationshipType(existingPerson.customRelationshipType || '');
        setLocation(existingPerson.location);
        setPhoneNumber(existingPerson.phoneNumber);
        setInstagram(existingPerson.instagram || '');
        setTwitter(existingPerson.twitter || '');
        setFacebook(existingPerson.facebook || '');
        setSnapchat(existingPerson.snapchat || '');
        setNotes(existingPerson.notes || '');
        setRedFlags(existingPerson.redFlags.map(f => f.text));
        setGreenFlags(existingPerson.greenFlags.map(f => f.text));
      }
    }
  }, [isEditing, id, roster, bench]);

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
      console.log('[AddPerson] Image selected:', result.assets[0].uri);
      setPhotoUri(result.assets[0].uri);
    }
  };

  const addRedFlag = () => {
    if (redFlagInput.trim()) {
      console.log('[AddPerson] Adding red flag:', redFlagInput.trim());
      setRedFlags([...redFlags, redFlagInput.trim()]);
      setRedFlagInput('');
    }
  };

  const addGreenFlag = () => {
    if (greenFlagInput.trim()) {
      console.log('[AddPerson] Adding green flag:', greenFlagInput.trim());
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

  const getDaysInMonth = (month: number) => {
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return daysInMonth[month - 1];
  };

  const handleSave = async () => {
    console.log('[AddPerson] User tapped Save button');
    
    // VALIDATION: Require picture and name
    if (!photoUri) {
      Alert.alert('Picture Required', 'Please add a picture before saving');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter a name before saving');
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
      
      // Upload image to backend if selected and changed
      let uploadedImageUrl: string | undefined = photoUri;
      let uploadedImageKey: string | undefined;
      
      if (photoUri && (!isEditing || photoUri.startsWith('file://'))) {
        try {
          console.log('[AddPerson] Uploading image to backend...');
          
          // Create form data for image upload
          const formData = new FormData();
          const filename = photoUri.split('/').pop() || 'profile-image.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          
          formData.append('file', {
            uri: photoUri,
            name: filename,
            type,
          } as any);

          // Upload to backend
          const { supabase } = await import('@/lib/supabase');
          const { data: { session } } = await supabase.auth.getSession();
          const { BACKEND_URL } = await import('@/utils/api');
          
          if (!session?.access_token) {
            console.error('[AddPerson] No access token found');
            throw new Error('Not authenticated');
          }
          
          const uploadResponse = await fetch(`${BACKEND_URL}/api/upload/profile-image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('[AddPerson] Upload failed:', errorText);
            throw new Error('Failed to upload image');
          }

          const uploadData = await uploadResponse.json();
          uploadedImageUrl = uploadData.url;
          uploadedImageKey = uploadData.key;
          
          console.log('[AddPerson] Image uploaded successfully:', uploadedImageUrl);
        } catch (uploadError) {
          console.error('[AddPerson] Image upload failed:', uploadError);
          // Don't fail the whole save, just use the local URI
          uploadedImageUrl = photoUri;
          console.log('[AddPerson] Using local image URI as fallback');
        }
      }

      const person: RosterPerson = {
        id: isEditing ? (id as string) : Date.now().toString(),
        name: name.trim(),
        age: Number(age),
        birthdayMonth: birthMonth,
        birthdayDay: birthDay,
        zodiacSign: getZodiacFromBirthday(birthMonth, birthDay),
        favoriteColor: favoriteColor.trim(),
        favoriteFoodType: favoriteFoodType.trim(),
        relationshipType,
        customRelationshipType: relationshipType === 'other' ? customRelationshipType.trim() : undefined,
        location: location.trim(),
        phoneNumber: phoneNumber.trim(),
        instagram: instagram.trim() || undefined,
        twitter: twitter.trim() || undefined,
        facebook: facebook.trim() || undefined,
        snapchat: snapchat.trim() || undefined,
        notes: notes.trim() || undefined,
        redFlags: redFlags.map((text, index) => ({ id: `red-${index}`, text, type: 'red' as const })),
        greenFlags: greenFlags.map((text, index) => ({ id: `green-${index}`, text, type: 'green' as const })),
        interestLevel,
        imageUrl: uploadedImageUrl,
        status: 'roster',
        createdAt: isEditing ? undefined : new Date().toISOString(),
      };

      if (isEditing) {
        console.log('[AddPerson] Updating person:', person.name);
        await updatePerson(person);
        
        // Save flags separately using the backend API directly
        console.log('[AddPerson] Saving flags for person:', person.id);
        const { authenticatedPost } = await import('@/utils/api');
        
        // Save red flags
        for (const flagText of redFlags) {
          try {
            await authenticatedPost(`/api/profiles/${person.id}/flags`, {
              flagText,
              flagType: 'red',
            });
            console.log('[AddPerson] Red flag saved:', flagText);
          } catch (error) {
            console.error('[AddPerson] Error adding red flag:', error);
          }
        }
        
        // Save green flags
        for (const flagText of greenFlags) {
          try {
            await authenticatedPost(`/api/profiles/${person.id}/flags`, {
              flagText,
              flagType: 'green',
            });
            console.log('[AddPerson] Green flag saved:', flagText);
          } catch (error) {
            console.error('[AddPerson] Error adding green flag:', error);
          }
        }
        
        console.log('[AddPerson] Person updated successfully, navigating back');
        router.back();
      } else {
        console.log('[AddPerson] Saving new person:', person.name);
        await addPerson(person);
        
        // Wait for the person to be created and get the backend ID
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh profiles to get the new person with backend ID
        await refreshProfiles();
        
        // Find the newly created person
        const allPeople = [...roster, ...bench];
        const newPerson = allPeople.find(p => p.name === person.name);
        
        if (newPerson) {
          console.log('[AddPerson] Found newly created person with ID:', newPerson.id);
          
          // Save flags separately using the backend API directly
          console.log('[AddPerson] Saving flags for new person:', newPerson.id);
          const { authenticatedPost } = await import('@/utils/api');
          
          // Save red flags
          for (const flagText of redFlags) {
            try {
              await authenticatedPost(`/api/profiles/${newPerson.id}/flags`, {
                flagText,
                flagType: 'red',
              });
              console.log('[AddPerson] Red flag saved:', flagText);
            } catch (error) {
              console.error('[AddPerson] Error adding red flag:', error);
            }
          }
          
          // Save green flags
          for (const flagText of greenFlags) {
            try {
              await authenticatedPost(`/api/profiles/${newPerson.id}/flags`, {
                flagText,
                flagType: 'green',
              });
              console.log('[AddPerson] Green flag saved:', flagText);
            } catch (error) {
              console.error('[AddPerson] Error adding green flag:', error);
            }
          }
        }
        
        console.log('[AddPerson] Navigating to home screen');
        // Navigate to home screen after saving (not open another add person)
        router.replace('/(tabs)/(home)');
      }
    } catch (error: any) {
      console.error('[AddPerson] Error saving person:', error);
      Alert.alert('Error', error.message || 'Failed to save person');
    } finally {
      setSaving(false);
    }
  };

  const getInterestColor = (level: InterestLevel) => {
    switch (level) {
      case 'high': return colors.green;
      case 'medium': return colors.yellow;
      case 'low': return colors.lowInterest;
    }
  };

  const zodiacSign = getZodiacFromBirthday(birthMonth, birthDay);
  const zodiacEmoji = getZodiacEmoji(zodiacSign);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            console.log('[AddPerson] User tapped Cancel button');
            router.back();
          }} disabled={saving}>
            <Text style={[styles.cancelButton, saving && { opacity: 0.5 }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Person' : 'Add to Roster'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text style={[styles.saveButton, saving && { opacity: 0.5 }]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <IconSymbol
                  ios_icon_name="camera.fill"
                  android_material_icon_name="camera"
                  size={48}
                  color={colors.grey}
                />
                <Text style={styles.photoPlaceholderText}>Add Photo *</Text>
                <Text style={styles.requiredText}>Required</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interest Level</Text>
            <View style={styles.interestContainer}>
              {(['low', 'medium', 'high'] as InterestLevel[]).map((level) => (
                <TouchableOpacity
                  key={`interest-${level}`}
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
              placeholder="Enter name (required)"
              placeholderTextColor={colors.grey}
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
                placeholderTextColor={colors.grey}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Birthday</Text>
            <View style={styles.birthdayContainer}>
              <TouchableOpacity 
                style={[styles.input, { flex: 2 }]} 
                onPress={() => setShowMonthPicker(true)}
              >
                <Text style={styles.inputText}>{months[birthMonth - 1]}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.input, { flex: 1, marginLeft: 8 }]} 
                onPress={() => setShowDayPicker(true)}
              >
                <Text style={styles.inputText}>{birthDay}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Zodiac Sign</Text>
            <View style={styles.zodiacContainer}>
              <Text style={styles.zodiacEmoji}>{zodiacEmoji}</Text>
              <Text style={styles.zodiacText}>{zodiacSign}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Favorite Color</Text>
            <TouchableOpacity 
              style={[styles.input, styles.colorInput]} 
              onPress={() => setShowColorPicker(true)}
            >
              {favoriteColor ? (
                <View style={styles.colorPreview}>
                  <View style={[styles.colorSwatch, { backgroundColor: favoriteColorHex }]} />
                  <Text style={styles.inputText}>{favoriteColor}</Text>
                </View>
              ) : (
                <Text style={styles.placeholderText}>Select favorite color</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Favorite Food Type</Text>
            <TouchableOpacity 
              style={styles.input} 
              onPress={() => setShowFoodPicker(true)}
            >
              <Text style={[styles.inputText, !favoriteFoodType && styles.placeholderText]}>
                {favoriteFoodType || 'Select favorite food type'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Relationship Type</Text>
            <View style={styles.relationshipGrid}>
              {relationshipTypes.map((type) => (
                <TouchableOpacity
                  key={`relationship-${type.value}`}
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
                placeholderTextColor={colors.grey}
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
              placeholderTextColor={colors.grey}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter phone number"
              placeholderTextColor={colors.grey}
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
              placeholderTextColor={colors.grey}
            />
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={twitter}
              onChangeText={setTwitter}
              placeholder="Twitter (X)"
              placeholderTextColor={colors.grey}
            />
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={facebook}
              onChangeText={setFacebook}
              placeholder="Facebook"
              placeholderTextColor={colors.grey}
            />
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={snapchat}
              onChangeText={setSnapchat}
              placeholder="Snapchat"
              placeholderTextColor={colors.grey}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes..."
              placeholderTextColor={colors.grey}
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
                placeholderTextColor={colors.grey}
                onSubmitEditing={addRedFlag}
              />
              <TouchableOpacity style={styles.addButton} onPress={addRedFlag}>
                <IconSymbol
                  ios_icon_name="plus"
                  android_material_icon_name="add"
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.flagsContainer}>
              {redFlags.map((flag, index) => (
                <View key={`red-flag-${index}`} style={[styles.flagChip, { backgroundColor: colors.lowInterest }]}>
                  <Text style={styles.flagChipText}>{flag}</Text>
                  <TouchableOpacity onPress={() => removeRedFlag(index)}>
                    <IconSymbol
                      ios_icon_name="xmark"
                      android_material_icon_name="close"
                      size={16}
                      color="#fff"
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
                placeholderTextColor={colors.grey}
                onSubmitEditing={addGreenFlag}
              />
              <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.green }]} onPress={addGreenFlag}>
                <IconSymbol
                  ios_icon_name="plus"
                  android_material_icon_name="add"
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.flagsContainer}>
              {greenFlags.map((flag, index) => (
                <View key={`green-flag-${index}`} style={[styles.flagChip, { backgroundColor: colors.green }]}>
                  <Text style={styles.flagChipText}>{flag}</Text>
                  <TouchableOpacity onPress={() => removeGreenFlag(index)}>
                    <IconSymbol
                      ios_icon_name="xmark"
                      android_material_icon_name="close"
                      size={16}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Month Picker Modal */}
        <Modal
          visible={showMonthPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowMonthPicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowMonthPicker(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.pickerModal}>
                  <View style={styles.pickerHeader}>
                    <Text style={styles.pickerTitle}>Select Month</Text>
                    <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                      <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.pickerScroll}>
                    {months.map((month, index) => (
                      <TouchableOpacity
                        key={`month-${month}`}
                        style={[styles.pickerItem, birthMonth === index + 1 && styles.pickerItemActive]}
                        onPress={() => {
                          setBirthMonth(index + 1);
                          setShowMonthPicker(false);
                        }}
                      >
                        <Text style={[styles.pickerItemText, birthMonth === index + 1 && styles.pickerItemTextActive]}>
                          {month}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Day Picker Modal - FIX: Add proper keys */}
        <Modal
          visible={showDayPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDayPicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowDayPicker(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.pickerModal}>
                  <View style={styles.pickerHeader}>
                    <Text style={styles.pickerTitle}>Select Day</Text>
                    <TouchableOpacity onPress={() => setShowDayPicker(false)}>
                      <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.pickerScroll}>
                    {Array.from({ length: getDaysInMonth(birthMonth) }, (_, i) => i + 1).map((day) => (
                      <TouchableOpacity
                        key={`day-${day}-${birthMonth}`}
                        style={[styles.pickerItem, birthDay === day && styles.pickerItemActive]}
                        onPress={() => {
                          setBirthDay(day);
                          setShowDayPicker(false);
                        }}
                      >
                        <Text style={[styles.pickerItemText, birthDay === day && styles.pickerItemTextActive]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Color Picker Modal */}
        <Modal
          visible={showColorPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowColorPicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowColorPicker(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.pickerModal}>
                  <View style={styles.pickerHeader}>
                    <Text style={styles.pickerTitle}>Select Favorite Color</Text>
                    <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                      <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.pickerScroll}>
                    {favoriteColors.map((color) => (
                      <TouchableOpacity
                        key={`color-${color.name}`}
                        style={[styles.pickerItem, favoriteColor === color.name && styles.pickerItemActive]}
                        onPress={() => {
                          setFavoriteColor(color.name);
                          setFavoriteColorHex(color.hex);
                          setShowColorPicker(false);
                        }}
                      >
                        <View style={styles.colorPickerItem}>
                          <View style={[styles.colorSwatch, { backgroundColor: color.hex }]} />
                          <Text style={[styles.pickerItemText, favoriteColor === color.name && styles.pickerItemTextActive]}>
                            {color.name}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Food Type Picker Modal */}
        <Modal
          visible={showFoodPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowFoodPicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowFoodPicker(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.pickerModal}>
                  <View style={styles.pickerHeader}>
                    <Text style={styles.pickerTitle}>Select Favorite Food Type</Text>
                    <TouchableOpacity onPress={() => setShowFoodPicker(false)}>
                      <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.pickerScroll}>
                    {favoriteFoodTypes.map((food) => (
                      <TouchableOpacity
                        key={`food-${food}`}
                        style={[styles.pickerItem, favoriteFoodType === food && styles.pickerItemActive]}
                        onPress={() => {
                          setFavoriteFoodType(food);
                          setShowFoodPicker(false);
                        }}
                      >
                        <Text style={[styles.pickerItemText, favoriteFoodType === food && styles.pickerItemTextActive]}>
                          {food}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
    borderBottomColor: colors.grey + '30',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  cancelButton: {
    fontSize: 16,
    color: colors.grey,
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
    paddingBottom: 40,
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
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.grey,
  },
  requiredText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
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
    borderColor: colors.grey + '30',
  },
  colorInput: {
    justifyContent: 'center',
  },
  colorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.grey + '50',
  },
  inputText: {
    fontSize: 16,
    color: colors.text,
  },
  placeholderText: {
    color: colors.grey,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.grey + '30',
    gap: 12,
  },
  zodiacEmoji: {
    fontSize: 24,
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
    borderColor: colors.grey + '30',
  },
  interestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  interestButtonTextActive: {
    color: '#fff',
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
    borderColor: colors.grey + '30',
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
    color: '#fff',
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
    backgroundColor: colors.lowInterest,
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
    color: '#fff',
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
    borderBottomColor: colors.grey + '30',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  pickerScroll: {
    maxHeight: 400,
  },
  pickerItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey + '20',
  },
  pickerItemActive: {
    backgroundColor: colors.primary + '20',
  },
  pickerItemText: {
    fontSize: 16,
    color: colors.text,
  },
  pickerItemTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  colorPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
