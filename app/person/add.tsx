
import React, { useState, useEffect, useRef } from 'react';
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
  TouchableWithoutFeedback,
  FlatList,
  Dimensions,
  ImageSourcePropType,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';
import { RosterPerson, RelationshipType } from '@/types/roster';
import { getZodiacFromBirthday, getZodiacEmoji } from '@/utils/zodiac';
import { uploadImage } from '@/utils/imageUpload';
import RatingsSection, { RatingsValues } from '@/components/RatingsSection';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const DARK_GREEN = '#1B4332';
const GREEN_TRACK = '#A8D5A2';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const relationshipTypes: { value: RelationshipType; label: string }[] = [
  { value: 'dating', label: 'Dating' },
  { value: 'casual', label: 'Casual' },
  { value: 'serious', label: 'Serious' },
  { value: 'friendzone', label: 'Friend Zone' },
  { value: 'booty call', label: 'Booty Call' },
  { value: 'exploring', label: 'Exploring' },
  { value: 'other', label: 'Other' },
];

const getDaysInMonth = (month: number) => {
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysInMonth[month - 1];
};

// ─── Section Card ────────────────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.card}>
      <Text style={sectionStyles.title}>{title}</Text>
      {children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK_GREEN,
    marginBottom: 12,
  },
});

// ─── Styled Input ─────────────────────────────────────────────────────────────
function FormInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  numberOfLines,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad' | 'email-address';
  multiline?: boolean;
  numberOfLines?: number;
}) {
  return (
    <TextInput
      style={[inputStyle.base, multiline && inputStyle.multiline]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      keyboardType={keyboardType ?? 'default'}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  );
}

const inputStyle = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
    marginBottom: 10,
  },
  multiline: {
    height: 80,
    textAlignVertical: 'top',
  },
});

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({
  label,
  color,
  onRemove,
}: {
  label: string;
  color: string;
  onRemove: () => void;
}) {
  return (
    <View style={[chipStyle.chip, { borderColor: color }]}>
      <Text style={[chipStyle.text, { color }]}>{label}</Text>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
        <Text style={[chipStyle.x, { color }]}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const chipStyle = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    marginBottom: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    marginRight: 4,
  },
  x: {
    fontSize: 11,
    fontWeight: '700',
  },
});

// ─── Flag Row ─────────────────────────────────────────────────────────────────
function FlagRow({
  inputValue,
  onChangeInput,
  onAdd,
  flags,
  onRemove,
  placeholder,
  accentColor,
}: {
  inputValue: string;
  onChangeInput: (t: string) => void;
  onAdd: () => void;
  flags: string[];
  onRemove: (i: number) => void;
  placeholder: string;
  accentColor: string;
}) {
  return (
    <View>
      <View style={flagRowStyle.row}>
        <TextInput
          style={[flagRowStyle.input, { borderColor: '#D1D5DB' }]}
          value={inputValue}
          onChangeText={onChangeInput}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          onSubmitEditing={onAdd}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[flagRowStyle.addBtn, { backgroundColor: accentColor }]}
          onPress={onAdd}
        >
          <Text style={flagRowStyle.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
      {flags.length > 0 && (
        <View style={flagRowStyle.chips}>
          {flags.map((f, i) => (
            <Chip key={`flag-${i}`} label={f} color={accentColor} onRemove={() => onRemove(i)} />
          ))}
        </View>
      )}
    </View>
  );
}

const flagRowStyle = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  addBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
});

// ─── Picker Modal ─────────────────────────────────────────────────────────────
function PickerModal({
  visible,
  title,
  items,
  selectedValue,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  items: string[];
  selectedValue: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={pickerStyle.overlay}>
          <TouchableWithoutFeedback>
            <View style={pickerStyle.sheet}>
              <View style={pickerStyle.header}>
                <Text style={pickerStyle.title}>{title}</Text>
                <TouchableOpacity onPress={onClose}>
                  <Text style={pickerStyle.close}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={pickerStyle.scroll}>
                {items.map((item) => {
                  const isActive = selectedValue === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[pickerStyle.item, isActive && pickerStyle.itemActive]}
                      onPress={() => { onSelect(item); onClose(); }}
                    >
                      <Text style={[pickerStyle.itemText, isActive && pickerStyle.itemTextActive]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const pickerStyle = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '55%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: DARK_GREEN,
  },
  close: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  scroll: { maxHeight: 400 },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemActive: { backgroundColor: DARK_GREEN + '18' },
  itemText: { fontSize: 16, color: '#1A1A1A' },
  itemTextActive: { color: DARK_GREEN, fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AddPersonScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { addPerson, updatePerson, roster, bench } = useRoster();

  const params = useLocalSearchParams();
  const isEditing = !!id;
  const [saving, setSaving] = useState(false);
  const [hasPrefill, setHasPrefill] = useState(false);
  const [prefillImageUrl, setPrefillImageUrl] = useState<string | null>(null);
  const [scannedName, setScannedName] = useState<string>('their');

  // ── Top card fields ──
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [chemistryScore, setChemistryScore] = useState('');
  const [zodiacOverride, setZodiacOverride] = useState('');

  // ── Basic Info ──
  const [age, setAge] = useState('');
  const [birthMonth, setBirthMonth] = useState(1);
  const [birthDay, setBirthDay] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [location, setLocation] = useState('');
  const [howMet, setHowMet] = useState('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('dating');
  const [customRelationshipType, setCustomRelationshipType] = useState('');

  // ── Favorites ──
  const [favFood, setFavFood] = useState('');
  const [favColor, setFavColor] = useState('');
  const [thingsTheyLike, setThingsTheyLike] = useState('');
  const [lifestyleVibe, setLifestyleVibe] = useState('');
  const [intention, setIntention] = useState('');

  // ── Flags ──
  const [greenFlagInput, setGreenFlagInput] = useState('');
  const [redFlagInput, setRedFlagInput] = useState('');
  const [greenFlags, setGreenFlags] = useState<string[]>([]);
  const [redFlags, setRedFlags] = useState<string[]>([]);

  // ── Ratings ──
  const [ratings, setRatings] = useState<RatingsValues>({
    sexualChemistry: 5,
    overallChemistry: 5,
    communication: 5,
    consistency: 5,
    emotionalAvailability: 5,
    datePlanning: 5,
    alignment: 5,
  });

  // ── Picker visibility ──
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showZodiacPicker, setShowZodiacPicker] = useState(false);
  const [showRelTypePicker, setShowRelTypePicker] = useState(false);

  const relationshipCarouselRef = useRef<FlatList>(null);

  // ── Prefill from QR scan ──
  useEffect(() => {
    if (params.prefill) {
      console.log('[AddPerson] Prefill data received from QR scan');
      try {
        const profile = JSON.parse(params.prefill as string);
        if (profile.name) setName(profile.name);
        if (profile.age) setAge(profile.age.toString());
        if (profile.location) setLocation(profile.location);
        if (profile.phoneNumber) setPhoneNumber(profile.phoneNumber);
        if (profile.instagram) setInstagram(profile.instagram);
        if (profile.image) setPrefillImageUrl(profile.image);
        setScannedName(profile.name || 'their');
        setHasPrefill(true);
        console.log('[AddPerson] Prefill applied for:', profile.name);
      } catch (e) {
        console.error('[AddPerson] Failed to parse prefill data', e);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load existing person if editing ──
  useEffect(() => {
    if (isEditing && id) {
      console.log('[AddPerson] Editing mode - loading person with id:', id);
      const allPeople = [...roster, ...bench];
      const p = allPeople.find(x => x.id === id);
      if (p) {
        console.log('[AddPerson] Found person to edit:', p.name);
        setPhotoUri(p.imageUrl);
        setName(p.name);
        setAge(p.age.toString());
        setBirthMonth(p.birthdayMonth);
        setBirthDay(p.birthdayDay);
        setPhoneNumber(p.phoneNumber);
        setInstagram(p.instagram || '');
        setTiktok((p as any).tiktok || '');
        setLocation(p.location);
        setHowMet(p.howMet || '');
        setRelationshipType(p.relationshipType);
        setCustomRelationshipType(p.customRelationshipType || '');
        setFavColor(p.favoriteColor || '');
        setFavFood(p.favoriteFoodType || '');
        setRedFlags(p.redFlags.map(f => f.text));
        setGreenFlags(p.greenFlags.map(f => f.text));
        if (p.zodiacSign) setZodiacOverride(p.zodiacSign);
      }
    }
  }, [isEditing, id, roster, bench]);

  // ── Image picker ──
  const pickImage = async () => {
    console.log('[AddPerson] User tapped avatar picker');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      console.log('[AddPerson] Image selected:', result.assets[0].uri);
      setPhotoUri(result.assets[0].uri);
    }
  };

  // ── Flag helpers ──
  const addGreenFlag = () => {
    if (greenFlagInput.trim()) {
      console.log('[AddPerson] Adding green flag:', greenFlagInput.trim());
      setGreenFlags(prev => [...prev, greenFlagInput.trim()]);
      setGreenFlagInput('');
    }
  };
  const addRedFlag = () => {
    if (redFlagInput.trim()) {
      console.log('[AddPerson] Adding red flag:', redFlagInput.trim());
      setRedFlags(prev => [...prev, redFlagInput.trim()]);
      setRedFlagInput('');
    }
  };
  const removeGreenFlag = (i: number) => setGreenFlags(prev => prev.filter((_, idx) => idx !== i));
  const removeRedFlag = (i: number) => setRedFlags(prev => prev.filter((_, idx) => idx !== i));

  // ── Derived values ──
  const autoZodiac = getZodiacFromBirthday(birthMonth, birthDay);
  const zodiacSign = zodiacOverride || autoZodiac;
  const zodiacEmoji = getZodiacEmoji(zodiacSign);
  const monthLabel = months[birthMonth - 1];
  const chemScoreDisplay = chemistryScore ? chemistryScore : '—';
  const nicknameDisplay = nickname || 'Nickname';

  const dayItems = Array.from({ length: getDaysInMonth(birthMonth) }, (_, i) => String(i + 1));
  const monthItems = months;

  // ── Save ──
  const handleSave = async () => {
    console.log('[AddPerson] User tapped Save button');

    if (!photoUri && !prefillImageUrl) {
      Alert.alert('Picture Required', 'Please add a photo before saving');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter a name before saving');
      return;
    }

    try {
      setSaving(true);
      console.log('[AddPerson] Starting save process...');

      let uploadedImageUrl: string | undefined;

      if (isEditing && photoUri && !photoUri.startsWith('file://') && !photoUri.startsWith('content://')) {
        uploadedImageUrl = photoUri;
      }
      if (photoUri && (!isEditing || photoUri.startsWith('file://') || photoUri.startsWith('content://'))) {
        try {
          console.log('[AddPerson] Uploading image...');
          const uploadResult = await uploadImage(photoUri, 'roster');
          uploadedImageUrl = uploadResult.url;
          console.log('[AddPerson] Image uploaded:', uploadedImageUrl);
        } catch (uploadError: any) {
          console.error('[AddPerson] Image upload failed:', uploadError);
          Alert.alert('Image Upload Failed', 'Failed to upload the image. Please try again.');
          setSaving(false);
          return;
        }
      }
      if (!uploadedImageUrl && prefillImageUrl) {
        uploadedImageUrl = prefillImageUrl;
      }

      const person: RosterPerson = {
        id: isEditing ? (id as string) : Date.now().toString(),
        name: name.trim(),
        age: Number(age) || 0,
        birthdayMonth: birthMonth,
        birthdayDay: birthDay,
        zodiacSign,
        favoriteColor: favColor.trim(),
        favoriteFoodType: favFood.trim(),
        relationshipType,
        customRelationshipType: relationshipType === 'other' ? customRelationshipType.trim() : undefined,
        howMet: howMet.trim() || undefined,
        location: location.trim(),
        phoneNumber: phoneNumber.trim(),
        instagram: instagram.trim() || undefined,
        twitter: undefined,
        facebook: undefined,
        snapchat: undefined,
        notes: [
          nickname ? `Nickname: ${nickname}` : '',
          thingsTheyLike ? `Things they like: ${thingsTheyLike}` : '',
          lifestyleVibe ? `Lifestyle vibe: ${lifestyleVibe}` : '',
          intention ? `Intention: ${intention}` : '',
        ].filter(Boolean).join('\n') || undefined,
        redFlags: redFlags.map((text, index) => ({ id: `red-${index}`, text, type: 'red' as const })),
        greenFlags: greenFlags.map((text, index) => ({ id: `green-${index}`, text, type: 'green' as const })),
        interestLevel: 'medium',
        sexualChemistry: ratings.sexualChemistry,
        attractiveness: null,
        imageUrl: uploadedImageUrl,
        profileImageUrl: uploadedImageUrl,
        howYouMet: howMet.trim() || undefined,
        instagramHandle: instagram.trim() || undefined,
        status: 'roster',
        createdAt: isEditing ? undefined : new Date().toISOString(),
      };

      console.log('[AddPerson] Saving person:', person.name);

      if (isEditing) {
        console.log('[AddPerson] Updating existing person');
        await updatePerson(person);

        const { authenticatedPost } = await import('@/utils/api');
        for (const flagText of redFlags) {
          try {
            await authenticatedPost(`/api/profiles/${person.id}/flags`, { flagText, type: 'red' });
          } catch (e) { console.error('[AddPerson] Error saving red flag:', e); }
        }
        for (const flagText of greenFlags) {
          try {
            await authenticatedPost(`/api/profiles/${person.id}/flags`, { flagText, type: 'green' });
          } catch (e) { console.error('[AddPerson] Error saving green flag:', e); }
        }

        // Persist ratings in AsyncStorage
        await AsyncStorage.setItem(`ratingsMap_${person.id}`, JSON.stringify(ratings));
        console.log('[AddPerson] Ratings saved to AsyncStorage for:', person.id);

        console.log('[AddPerson] Person updated, navigating back');
        router.back();
      } else {
        console.log('[AddPerson] Adding new person');
        const newPerson = await addPerson(person);
        console.log('[AddPerson] New person created with ID:', newPerson.id);

        if ((redFlags.length > 0 || greenFlags.length > 0) && newPerson.id) {
          const { authenticatedPost } = await import('@/utils/api');
          for (const flagText of redFlags) {
            try {
              await authenticatedPost(`/api/profiles/${newPerson.id}/flags`, { flagText, type: 'red' });
            } catch (e) { console.error('[AddPerson] Error saving red flag:', e); }
          }
          for (const flagText of greenFlags) {
            try {
              await authenticatedPost(`/api/profiles/${newPerson.id}/flags`, { flagText, type: 'green' });
            } catch (e) { console.error('[AddPerson] Error saving green flag:', e); }
          }
        }

        // Persist ratings in AsyncStorage keyed by new person ID
        if (newPerson.id) {
          await AsyncStorage.setItem(`ratingsMap_${newPerson.id}`, JSON.stringify(ratings));
          console.log('[AddPerson] Ratings saved to AsyncStorage for:', newPerson.id);
        }

        console.log('[AddPerson] Save complete, navigating to home');
        router.replace('/(tabs)/(home)');
      }
    } catch (error: any) {
      console.error('[AddPerson] Error saving person:', error);
      Alert.alert('Error', error.message || 'Failed to save person');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    console.log('[AddPerson] User tapped Cancel button');
    router.back();
  };

  // ── Render ──
  const displayPhoto = photoUri || prefillImageUrl || null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} disabled={saving}>
          <Text style={styles.headerCancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Person' : 'Add to Roster'}</Text>
        <View style={{ width: 56 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Prefill Banner ── */}
        {hasPrefill && (
          <View style={styles.prefillBanner}>
            <Text style={styles.prefillBannerText}>
              {'✓ Scanned from ' + scannedName + "'s profile — review and save."}
            </Text>
          </View>
        )}

        {/* ══ TOP CARD (dark green) ══ */}
        <View style={styles.topCard}>
          {/* Avatar */}
          <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
            {displayPhoto ? (
              <Image source={resolveImageSource(displayPhoto)} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarCameraIcon}>📷</Text>
                <Text style={styles.avatarPlaceholderText}>Add Photo</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditBadgeText}>✎</Text>
            </View>
          </TouchableOpacity>

          {/* Name input */}
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Full Name *"
            placeholderTextColor="rgba(255,255,255,0.5)"
            textAlign="center"
          />

          {/* Zodiac badge */}
          <TouchableOpacity
            style={styles.zodiacBadge}
            onPress={() => {
              console.log('[AddPerson] User tapped zodiac badge picker');
              setShowZodiacPicker(true);
            }}
          >
            <Text style={styles.zodiacBadgeText}>{zodiacEmoji} {zodiacSign}</Text>
          </TouchableOpacity>

          {/* Nickname + Chemistry pills */}
          <View style={styles.pillRow}>
            <View style={styles.pillInputWrapper}>
              <TextInput
                style={styles.pillInput}
                value={nickname}
                onChangeText={setNickname}
                placeholder="Nickname"
                placeholderTextColor="rgba(255,255,255,0.55)"
                textAlign="center"
              />
            </View>
            <View style={styles.pillInputWrapper}>
              <TextInput
                style={styles.pillInput}
                value={chemistryScore}
                onChangeText={(t) => {
                  const n = t.replace(/[^0-9]/g, '');
                  if (n === '' || (Number(n) >= 1 && Number(n) <= 10)) setChemistryScore(n);
                }}
                placeholder="Chemistry 1–10"
                placeholderTextColor="rgba(255,255,255,0.55)"
                keyboardType="number-pad"
                textAlign="center"
                maxLength={2}
              />
            </View>
          </View>
        </View>

        {/* ══ SECTION: Basic Info ══ */}
        <SectionCard title="Basic Info">
          <Text style={styles.fieldLabel}>Birthday</Text>
          <View style={styles.birthdayRow}>
            <TouchableOpacity
              style={[inputStyle.base, styles.birthdayPicker, { flex: 2, marginRight: 8 }]}
              onPress={() => {
                console.log('[AddPerson] User tapped month picker');
                setShowMonthPicker(true);
              }}
            >
              <Text style={styles.pickerValueText}>{monthLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[inputStyle.base, styles.birthdayPicker, { flex: 1 }]}
              onPress={() => {
                console.log('[AddPerson] User tapped day picker');
                setShowDayPicker(true);
              }}
            >
              <Text style={styles.pickerValueText}>{birthDay}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>Phone Number</Text>
          <FormInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Phone number"
            keyboardType="phone-pad"
          />

          <Text style={styles.fieldLabel}>Instagram</Text>
          <FormInput
            value={instagram}
            onChangeText={setInstagram}
            placeholder="@instagram"
          />

          <Text style={styles.fieldLabel}>TikTok</Text>
          <FormInput
            value={tiktok}
            onChangeText={setTiktok}
            placeholder="@tiktok"
          />

          <Text style={styles.fieldLabel}>Location</Text>
          <FormInput
            value={location}
            onChangeText={setLocation}
            placeholder="City, State"
          />

          <Text style={styles.fieldLabel}>How We Met</Text>
          <FormInput
            value={howMet}
            onChangeText={setHowMet}
            placeholder="e.g. Coffee shop, Tinder..."
          />

          <Text style={styles.fieldLabel}>Relationship Type</Text>
          <TouchableOpacity
            style={[inputStyle.base, styles.birthdayPicker, { marginBottom: 0 }]}
            onPress={() => {
              console.log('[AddPerson] User tapped relationship type picker');
              setShowRelTypePicker(true);
            }}
          >
            <Text style={styles.pickerValueText}>
              {relationshipTypes.find(r => r.value === relationshipType)?.label ?? 'Select'}
            </Text>
          </TouchableOpacity>
          {relationshipType === 'other' && (
            <FormInput
              value={customRelationshipType}
              onChangeText={setCustomRelationshipType}
              placeholder="Describe relationship type"
            />
          )}
        </SectionCard>

        {/* ══ SECTION: Favorites ══ */}
        <SectionCard title="Favorites">
          <Text style={styles.fieldLabel}>Fav Food</Text>
          <FormInput value={favFood} onChangeText={setFavFood} placeholder="e.g. Italian & Chinese" />

          <Text style={styles.fieldLabel}>Fav Color</Text>
          <FormInput value={favColor} onChangeText={setFavColor} placeholder="e.g. Black & green" />

          <Text style={styles.fieldLabel}>Things they like</Text>
          <FormInput value={thingsTheyLike} onChangeText={setThingsTheyLike} placeholder="e.g. Traveling & exploring" />

          <Text style={styles.fieldLabel}>Lifestyle vibe</Text>
          <FormInput value={lifestyleVibe} onChangeText={setLifestyleVibe} placeholder="e.g. Homebody" />

          <Text style={styles.fieldLabel}>Intention</Text>
          <FormInput value={intention} onChangeText={setIntention} placeholder="e.g. Open to serious" />
        </SectionCard>

        {/* ══ SECTION: Flags ══ */}
        <SectionCard title="Flags">
          <View style={styles.flagsColumns}>
            <View style={styles.flagsCol}>
              <Text style={[styles.flagsColTitle, { color: DARK_GREEN }]}>Green Flags</Text>
              <FlagRow
                inputValue={greenFlagInput}
                onChangeInput={setGreenFlagInput}
                onAdd={addGreenFlag}
                flags={greenFlags}
                onRemove={removeGreenFlag}
                placeholder="Add green flag"
                accentColor={DARK_GREEN}
              />
            </View>
            <View style={styles.flagsDivider} />
            <View style={styles.flagsCol}>
              <Text style={[styles.flagsColTitle, { color: '#EF4444' }]}>Red Flags</Text>
              <FlagRow
                inputValue={redFlagInput}
                onChangeInput={setRedFlagInput}
                onAdd={addRedFlag}
                flags={redFlags}
                onRemove={removeRedFlag}
                placeholder="Add red flag"
                accentColor="#EF4444"
              />
            </View>
          </View>
        </SectionCard>

        {/* ══ SECTION: Ratings ══ */}
        <View style={styles.ratingsWrapper}>
          <RatingsSection
            initialRatings={ratings}
            onChange={(r) => {
              setRatings(r);
            }}
          />
        </View>

        {/* ══ BOTTOM BUTTONS ══ */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cancelBtn, saving && { opacity: 0.6 }]}
            onPress={handleCancel}
            disabled={saving}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Pickers ── */}
      <PickerModal
        visible={showMonthPicker}
        title="Select Month"
        items={monthItems}
        selectedValue={monthLabel}
        onSelect={(v) => {
          const idx = months.indexOf(v);
          if (idx >= 0) setBirthMonth(idx + 1);
        }}
        onClose={() => setShowMonthPicker(false)}
      />
      <PickerModal
        visible={showDayPicker}
        title="Select Day"
        items={dayItems}
        selectedValue={String(birthDay)}
        onSelect={(v) => setBirthDay(Number(v))}
        onClose={() => setShowDayPicker(false)}
      />
      <PickerModal
        visible={showZodiacPicker}
        title="Select Zodiac Sign"
        items={ZODIAC_SIGNS}
        selectedValue={zodiacSign}
        onSelect={(v) => {
          console.log('[AddPerson] Zodiac selected:', v);
          setZodiacOverride(v);
        }}
        onClose={() => setShowZodiacPicker(false)}
      />
      <PickerModal
        visible={showRelTypePicker}
        title="Relationship Type"
        items={relationshipTypes.map(r => r.label)}
        selectedValue={relationshipTypes.find(r => r.value === relationshipType)?.label ?? ''}
        onSelect={(v) => {
          const found = relationshipTypes.find(r => r.label === v);
          if (found) {
            console.log('[AddPerson] Relationship type selected:', found.value);
            setRelationshipType(found.value);
          }
        }}
        onClose={() => setShowRelTypePicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: DARK_GREEN,
  },
  headerCancel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
    width: 56,
  },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: 48,
  },

  // ── Prefill Banner ──
  prefillBanner: {
    backgroundColor: '#1a3a1a',
    borderWidth: 1,
    borderColor: '#2d8b4e',
    borderRadius: 12,
    padding: 14,
    margin: 16,
    marginBottom: 0,
  },
  prefillBannerText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ══ TOP CARD ══
  topCard: {
    backgroundColor: DARK_GREEN,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
  },

  // Avatar
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCameraIcon: {
    fontSize: 26,
    marginBottom: 2,
  },
  avatarPlaceholderText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadgeText: {
    fontSize: 13,
    color: DARK_GREEN,
    fontWeight: '700',
  },

  // Name input on dark green
  nameInput: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.35)',
    paddingBottom: 6,
    marginBottom: 10,
    width: '80%',
  },

  // Zodiac badge
  zodiacBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 14,
  },
  zodiacBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Pill row
  pillRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  pillInputWrapper: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  pillInput: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: 'center',
  },

  // ── Field label ──
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    marginTop: 2,
  },

  // ── Birthday row ──
  birthdayRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  birthdayPicker: {
    justifyContent: 'center',
    marginBottom: 0,
  },
  pickerValueText: {
    fontSize: 15,
    color: '#1A1A1A',
  },

  // ── Flags columns ──
  flagsColumns: {
    flexDirection: 'row',
    gap: 0,
  },
  flagsCol: {
    flex: 1,
  },
  flagsDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
  },
  flagsColTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },

  // ── Ratings wrapper ──
  ratingsWrapper: {
    marginHorizontal: 0,
    marginBottom: 12,
  },

  // ── Bottom buttons ──
  bottomButtons: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  saveBtn: {
    backgroundColor: DARK_GREEN,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: DARK_GREEN,
  },
  cancelBtnText: {
    color: DARK_GREEN,
    fontSize: 16,
    fontWeight: '700',
  },
});
