
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Switch,
  Dimensions,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useRoster } from '@/contexts/RosterContext';
import { uploadImage } from '@/utils/imageUpload';
import { authenticatedGet, authenticatedPut, authenticatedPost } from '@/utils/api';
import { logSaveError } from '@/utils/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DARK_GREEN = '#1B4332';
const DARK_GREEN_LIGHT = '#2D6A4F';
const MUTED_WHITE = 'rgba(255,255,255,0.75)';
const SECTION_BG = '#fff';
const PAGE_BG = '#F2F2F7';
const DIVIDER = '#F0F0F0';
const MUTED_LABEL = '#8E8E93';
const DARK_TEXT = '#1A1A1A';
const RED_TEXT = '#C41E3A';

const DATING_INTENTIONS = [
  'Casual Dating', 'Serious Relationship', 'Marriage', 'Friendship', 'Networking', 'Undecided',
];
const RELATIONSHIP_TYPES = [
  'Monogamous', 'Open', 'Situationship', 'Casual', 'Undecided',
];

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

// ─── Animated Save Button ────────────────────────────────────────────────────

type SaveState = 'idle' | 'saving' | 'saved';

interface AnimatedSaveButtonProps {
  onSave: () => Promise<void>;
  disabled?: boolean;
}

function AnimatedSaveButton({ onSave, disabled }: AnimatedSaveButtonProps) {
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const widthAnim = useSharedValue(1); // 1 = full, 0 = pill

  const containerWidth = SCREEN_WIDTH - 32;

  const animStyle = useAnimatedStyle(() => {
    const w = interpolate(widthAnim.value, [0, 1], [56, containerWidth]);
    return {
      width: w,
      borderRadius: interpolate(widthAnim.value, [0, 1], [28, 16]),
    };
  });

  const handlePress = async () => {
    if (saveState !== 'idle' || disabled) return;
    console.log('[Profile] User tapped animated Save Changes button');

    setSaveState('saving');
    widthAnim.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });

    try {
      await onSave();
      setSaveState('saved');
      widthAnim.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
      setTimeout(() => {
        setSaveState('idle');
      }, 2000);
    } catch {
      setSaveState('idle');
      widthAnim.value = withTiming(1, { duration: 300 });
    }
  };

  const labelIdle = 'Save Changes';
  const labelSaved = 'Saved!';

  return (
    <Animated.View style={[saveStyles.button, animStyle]}>
      <TouchableOpacity
        style={saveStyles.inner}
        onPress={handlePress}
        disabled={saveState !== 'idle' || disabled}
        activeOpacity={0.85}
      >
        {saveState === 'saving' && (
          <ActivityIndicator color="#fff" size="small" />
        )}
        {saveState === 'saved' && (
          <>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={20}
              color="#fff"
            />
            <Text style={saveStyles.label}>{labelSaved}</Text>
          </>
        )}
        {saveState === 'idle' && (
          <Text style={saveStyles.label}>{labelIdle}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const saveStyles = StyleSheet.create({
  button: {
    backgroundColor: DARK_GREEN,
    height: 56,
    alignSelf: 'center',
    overflow: 'hidden',
    shadowColor: DARK_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  label: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

// ─── Section card ────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={cardStyles.card}>
      <Text style={cardStyles.title}>{title}</Text>
      {children}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: SECTION_BG,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: MUTED_LABEL,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
});

// ─── Form row ────────────────────────────────────────────────────────────────

interface FormRowProps {
  label: string;
  children: React.ReactNode;
  last?: boolean;
  icon?: React.ReactNode;
}

function FormRow({ label, children, last, icon }: FormRowProps) {
  return (
    <>
      <View style={rowStyles.row}>
        {icon && <View style={rowStyles.iconWrap}>{icon}</View>}
        <Text style={rowStyles.label}>{label}</Text>
        <View style={rowStyles.value}>{children}</View>
      </View>
      {!last && <View style={rowStyles.divider} />}
    </>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    minHeight: 48,
  },
  iconWrap: {
    marginRight: 10,
  },
  label: {
    fontSize: 15,
    color: DARK_TEXT,
    fontWeight: '500',
    flex: 1,
  },
  value: {
    flex: 1,
    alignItems: 'flex-end',
  },
  divider: {
    height: 1,
    backgroundColor: DIVIDER,
    marginLeft: 0,
  },
});

// ─── Picker modal ────────────────────────────────────────────────────────────

interface PickerModalProps {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (val: string) => void;
  onClose: () => void;
}

function PickerModal({ visible, title, options, selected, onSelect, onClose }: PickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={pickerStyles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={pickerStyles.sheet}>
              <View style={pickerStyles.handle} />
              <Text style={pickerStyles.title}>{title}</Text>
              <ScrollView>
                {options.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={pickerStyles.item}
                    onPress={() => {
                      console.log('[Profile] Picker selected:', opt);
                      onSelect(opt);
                      onClose();
                    }}
                  >
                    <Text style={[pickerStyles.itemText, selected === opt && pickerStyles.itemSelected]}>
                      {opt}
                    </Text>
                    {selected === opt && (
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={18}
                        color={DARK_GREEN}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
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
    paddingTop: 12,
    paddingBottom: 32,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#D1D1D6',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: DARK_TEXT,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: DARK_TEXT,
  },
  itemSelected: {
    color: DARK_GREEN,
    fontWeight: '600',
  },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { user, signOut, markFirstLoginComplete, markProfileComplete } = useAuth();
  const { roster, bench, dates } = useRoster();
  const router = useRouter();

  const isFirstLogin = user?.firstLoginCompleted === false;

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');
  const [birthday, setBirthday] = useState('');
  const [datingIntention, setDatingIntention] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Image
  const [profileImage, setProfileImage] = useState<string | null>(user?.image || null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Share code modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCode, setShareCode] = useState('');
  const [showEnterCode, setShowEnterCode] = useState(false);
  const [enterCodeText, setEnterCodeText] = useState('');
  const [lookingUpCode, setLookingUpCode] = useState(false);
  const [codeError, setCodeError] = useState('');

  // Pickers
  const [showIntentionPicker, setShowIntentionPicker] = useState(false);
  const [showRelTypePicker, setShowRelTypePicker] = useState(false);

  // Logout confirm
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Stats derived from context
  const rosterCount = roster.length + bench.length;
  const datesCount = dates.length;
  const completedDates = dates.filter((d) => d.status === 'completed');
  const ratingsArr = completedDates.map((d) => d.rating || 0).filter((r) => r > 0);
  const avgRatingRaw = ratingsArr.length > 0
    ? ratingsArr.reduce((a, b) => a + b, 0) / ratingsArr.length
    : 0;
  const avgRatingDisplay = avgRatingRaw > 0 ? Number(avgRatingRaw).toFixed(1) : '—';

  const rosterCountStr = String(rosterCount);
  const datesCountStr = String(datesCount);

  useEffect(() => {
    if (!user?.id) return;
    const fallback = user.id.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
    console.log('[Profile] Fetching real share code from backend...');
    authenticatedGet('/api/user/share-code')
      .then((data) => {
        const code = data?.shareCode || data?.share_code || data?.code;
        if (code) {
          console.log('[Profile] Got share code from backend:', code);
          setShareCode(String(code).toUpperCase());
        } else {
          console.warn('[Profile] Backend returned no shareCode, using fallback');
          setShareCode(fallback);
        }
      })
      .catch((err) => {
        console.error('[Profile] Failed to fetch share code, using fallback:', err);
        setShareCode(fallback);
      });
  }, [user?.id]);

  const loadProfileData = useCallback(async () => {
    if (!user) return;
    try {
      console.log('[Profile] Loading profile data from backend...');
      const profileData = await authenticatedGet('/api/user/profile');
      console.log('[Profile] Profile data loaded:', profileData);
      if (profileData.name) setName(profileData.name);
      if (profileData.image || profileData.profileImageUrl) {
        setProfileImage(profileData.image || profileData.profileImageUrl);
      }
      if (profileData.phoneNumber) setPhoneNumber(profileData.phoneNumber);
      if (profileData.location) setLocation(profileData.location);
      if (profileData.birthday) setBirthday(profileData.birthday);
      if (profileData.datingIntention) setDatingIntention(profileData.datingIntention);
      if (profileData.relationshipType) setRelationshipType(profileData.relationshipType);
      if (profileData.notificationsEnabled !== undefined) {
        setNotificationsEnabled(profileData.notificationsEnabled);
      }
    } catch (error) {
      console.error('[Profile] Error loading profile data:', error);
    }
  }, [user]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const pickImage = async () => {
    console.log('[Profile] User tapped avatar to change photo');
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant photo library access to change your profile photo.');
        return;
      }
      setUploadingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        console.log('[Profile] Image selected, uploading...');
        const uploadResult = await uploadImage(uri, 'profile');
        console.log('[Profile] Image uploaded successfully:', uploadResult.url);
        setProfileImage(uploadResult.url);
      }
    } catch (error: any) {
      console.error('[Profile] Image upload failed:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    console.log('[Profile] Saving profile data...');
    if (isFirstLogin && !name.trim()) {
      Alert.alert('Required', 'Please enter your name to continue.');
      throw new Error('Name required');
    }
    const profileData: any = { name: name.trim() };
    if (phoneNumber) profileData.phoneNumber = phoneNumber.trim();
    if (location) profileData.location = location.trim();
    if (birthday) profileData.birthday = birthday.trim();
    if (datingIntention) profileData.datingIntention = datingIntention;
    if (relationshipType) profileData.relationshipType = relationshipType;
    profileData.notificationsEnabled = notificationsEnabled;
    if (profileImage) {
      profileData.image = profileImage;
      profileData.profileImageUrl = profileImage;
    }
    console.log('[Profile] Sending profile data to API:', JSON.stringify(profileData));
    await authenticatedPut('/api/user/profile', profileData);
    console.log('[Profile] Profile saved successfully');

    if (isFirstLogin) {
      await authenticatedPost('/api/user/complete-profile', {});
      await markFirstLoginComplete();
      if (name.trim()) await markProfileComplete();
    }
  };

  const handleSignOut = () => {
    console.log('[Profile] User tapped Sign Out');
    setShowLogoutConfirm(true);
  };

  const confirmSignOut = async () => {
    try {
      console.log('[Profile] User confirmed sign out');
      setShowLogoutConfirm(false);
      await signOut();
    } catch (error) {
      console.error('[Profile] Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleLookupCode = async () => {
    const code = enterCodeText.trim().toUpperCase();
    if (code.length < 1) return;
    console.log('[Profile] User tapped Find Profile with code:', code);
    setLookingUpCode(true);
    setCodeError('');
    try {
      const profile = await authenticatedGet('/api/profiles/by-code?code=' + code);
      console.log('[Profile] Profile found for code:', code);
      setShowShareModal(false);
      setShowEnterCode(false);
      setEnterCodeText('');
      router.push(('/person/add?prefill=' + encodeURIComponent(JSON.stringify(profile))) as any);
    } catch (error: any) {
      console.error('[Profile] Code lookup failed:', error);
      setCodeError('No profile found with that code.');
    } finally {
      setLookingUpCode(false);
    }
  };

  const avatarSource = resolveImageSource(profileImage || user?.image);
  const hasAvatar = !!(profileImage || user?.image);
  const displayName = name || user?.name || 'Your Name';
  const displayEmail = user?.email || '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          {/* Avatar */}
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={pickImage}
            disabled={uploadingImage}
            activeOpacity={0.85}
          >
            {hasAvatar ? (
              <Image source={avatarSource} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={44}
                  color="rgba(255,255,255,0.6)"
                />
              </View>
            )}
            {/* Upload overlay */}
            {uploadingImage && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#fff" size="small" />
              </View>
            )}
            {/* Camera badge */}
            {!uploadingImage && (
              <View style={styles.cameraBadge}>
                <IconSymbol
                  ios_icon_name="camera.fill"
                  android_material_icon_name="camera-alt"
                  size={12}
                  color="#fff"
                />
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.heroName}>{displayName}</Text>
          <Text style={styles.heroEmail}>{displayEmail}</Text>
        </View>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{rosterCountStr}</Text>
            <Text style={styles.statLabel}>Roster</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{datesCountStr}</Text>
            <Text style={styles.statLabel}>Dates</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{avgRatingDisplay}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>

        {/* ── Personal Info ── */}
        <SectionCard title="Personal Info">
          <FormRow label="Full Name">
            <TextInput
              style={styles.inputRight}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={MUTED_LABEL}
              textAlign="right"
            />
          </FormRow>
          <FormRow label="Email">
            <View style={styles.readOnlyRow}>
              <IconSymbol
                ios_icon_name="lock.fill"
                android_material_icon_name="lock"
                size={13}
                color={MUTED_LABEL}
              />
              <Text style={styles.readOnlyText} numberOfLines={1}>{displayEmail}</Text>
            </View>
          </FormRow>
          <FormRow label="Phone">
            <TextInput
              style={styles.inputRight}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="(555) 123-4567"
              placeholderTextColor={MUTED_LABEL}
              keyboardType="phone-pad"
              textAlign="right"
            />
          </FormRow>
          <FormRow label="Birthday">
            <TextInput
              style={styles.inputRight}
              value={birthday}
              onChangeText={setBirthday}
              placeholder="MM/DD/YYYY"
              placeholderTextColor={MUTED_LABEL}
              textAlign="right"
            />
          </FormRow>
          <FormRow label="Location" last>
            <TextInput
              style={styles.inputRight}
              value={location}
              onChangeText={setLocation}
              placeholder="City, State"
              placeholderTextColor={MUTED_LABEL}
              textAlign="right"
            />
          </FormRow>
        </SectionCard>

        {/* ── Preferences ── */}
        <SectionCard title="Preferences">
          <FormRow label="Dating Intention">
            <TouchableOpacity
              style={styles.pickerRow}
              onPress={() => {
                console.log('[Profile] User tapped Dating Intention picker');
                setShowIntentionPicker(true);
              }}
            >
              <Text style={[styles.pickerValue, !datingIntention && styles.pickerPlaceholder]}>
                {datingIntention || 'Select'}
              </Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={14}
                color={MUTED_LABEL}
              />
            </TouchableOpacity>
          </FormRow>
          <FormRow label="Relationship Type">
            <TouchableOpacity
              style={styles.pickerRow}
              onPress={() => {
                console.log('[Profile] User tapped Relationship Type picker');
                setShowRelTypePicker(true);
              }}
            >
              <Text style={[styles.pickerValue, !relationshipType && styles.pickerPlaceholder]}>
                {relationshipType || 'Select'}
              </Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={14}
                color={MUTED_LABEL}
              />
            </TouchableOpacity>
          </FormRow>
          <FormRow label="Notifications" last>
            <Switch
              value={notificationsEnabled}
              onValueChange={(val) => {
                console.log('[Profile] User toggled notifications:', val);
                setNotificationsEnabled(val);
              }}
              trackColor={{ false: '#D1D1D6', true: DARK_GREEN }}
              thumbColor="#fff"
            />
          </FormRow>
        </SectionCard>

        {/* ── Account ── */}
        <SectionCard title="Account">
          <FormRow label="Add to Roster">
            <TouchableOpacity
              style={styles.chevronBtn}
              onPress={() => {
                console.log('[Profile] User tapped Add to Roster');
                setShowShareModal(true);
              }}
            >
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={16}
                color={MUTED_LABEL}
              />
            </TouchableOpacity>
          </FormRow>
          <FormRow label="Privacy Policy">
            <TouchableOpacity
              style={styles.chevronBtn}
              onPress={() => {
                console.log('[Profile] User tapped Privacy Policy');
                router.push('/privacy-policy');
              }}
            >
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={16}
                color={MUTED_LABEL}
              />
            </TouchableOpacity>
          </FormRow>
          <FormRow label="EULA">
            <TouchableOpacity
              style={styles.chevronBtn}
              onPress={() => {
                console.log('[Profile] User tapped EULA');
                router.push('/eula');
              }}
            >
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={16}
                color={MUTED_LABEL}
              />
            </TouchableOpacity>
          </FormRow>
          <FormRow label="Sign Out" last>
            <TouchableOpacity
              onPress={handleSignOut}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </FormRow>
        </SectionCard>

        {/* Bottom spacer for sticky button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Sticky Save Button ── */}
      <View style={styles.stickyBottom}>
        <AnimatedSaveButton onSave={handleSave} />
      </View>

      {/* ── Pickers ── */}
      <PickerModal
        visible={showIntentionPicker}
        title="Dating Intention"
        options={DATING_INTENTIONS}
        selected={datingIntention}
        onSelect={setDatingIntention}
        onClose={() => setShowIntentionPicker(false)}
      />
      <PickerModal
        visible={showRelTypePicker}
        title="Relationship Type"
        options={RELATIONSHIP_TYPES}
        selected={relationshipType}
        onSelect={setRelationshipType}
        onClose={() => setShowRelTypePicker(false)}
      />

      {/* ── Share Code Modal ── */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowShareModal(false); setShowEnterCode(false); setEnterCodeText(''); setCodeError(''); }}
      >
        <TouchableWithoutFeedback onPress={() => { setShowShareModal(false); setShowEnterCode(false); setEnterCodeText(''); setCodeError(''); }}>
          <View style={shareStyles.overlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={shareStyles.card}>
                <View style={shareStyles.handle} />
                <Text style={shareStyles.title}>Share Your Profile</Text>
                <Text style={shareStyles.subtitle}>{displayName}</Text>
                <View style={shareStyles.codeBox}>
                  <Text style={shareStyles.codeText}>{shareCode}</Text>
                </View>
                <Text style={shareStyles.hint}>Share this code with someone to add you to their roster</Text>
                <TouchableOpacity
                  style={shareStyles.copyBtn}
                  onPress={async () => {
                    console.log('[Profile] User tapped Copy Code');
                    await Clipboard.setStringAsync(shareCode);
                    Alert.alert('Copied!', 'Your share code has been copied to clipboard.');
                  }}
                >
                  <IconSymbol ios_icon_name="doc.on.doc.fill" android_material_icon_name="content-copy" size={16} color="#fff" />
                  <Text style={shareStyles.copyBtnText}>Copy Code</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={shareStyles.enterBtn}
                  onPress={() => {
                    console.log('[Profile] User tapped Enter Someone\'s Code');
                    setShowEnterCode(!showEnterCode);
                    setCodeError('');
                  }}
                >
                  <Text style={shareStyles.enterBtnText}>Enter Someone's Code</Text>
                </TouchableOpacity>
                {showEnterCode && (
                  <View style={{ width: '100%', marginTop: 8 }}>
                    <TextInput
                      style={shareStyles.codeInput}
                      value={enterCodeText}
                      onChangeText={(t) => { setEnterCodeText(t.toUpperCase()); setCodeError(''); }}
                      placeholder="XXXXXX"
                      placeholderTextColor="#555"
                      maxLength={6}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                    {codeError ? <Text style={shareStyles.codeError}>{codeError}</Text> : null}
                    <TouchableOpacity
                      style={[shareStyles.copyBtn, { marginTop: 8 }]}
                      onPress={handleLookupCode}
                      disabled={lookingUpCode || enterCodeText.trim().length < 1}
                    >
                      {lookingUpCode ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={shareStyles.copyBtnText}>Find Profile</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
                <TouchableOpacity
                  style={shareStyles.closeBtn}
                  onPress={() => {
                    console.log('[Profile] User closed share modal');
                    setShowShareModal(false);
                    setShowEnterCode(false);
                    setEnterCodeText('');
                    setCodeError('');
                  }}
                >
                  <Text style={shareStyles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Logout Confirm ── */}
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowLogoutConfirm(false)}>
          <View style={logoutStyles.overlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={logoutStyles.card}>
                <IconSymbol
                  ios_icon_name="arrow.right.square.fill"
                  android_material_icon_name="logout"
                  size={44}
                  color={RED_TEXT}
                />
                <Text style={logoutStyles.title}>Sign Out</Text>
                <Text style={logoutStyles.message}>Are you sure you want to sign out?</Text>
                <View style={logoutStyles.buttons}>
                  <TouchableOpacity
                    style={logoutStyles.cancelBtn}
                    onPress={() => {
                      console.log('[Profile] User cancelled sign out');
                      setShowLogoutConfirm(false);
                    }}
                  >
                    <Text style={logoutStyles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={logoutStyles.confirmBtn} onPress={confirmSignOut}>
                    <Text style={logoutStyles.confirmText}>Sign Out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // Hero
  hero: {
    backgroundColor: DARK_GREEN,
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  avatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 14,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    backgroundColor: DARK_GREEN_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: DARK_GREEN_LIGHT,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  heroEmail: {
    fontSize: 14,
    color: MUTED_WHITE,
    textAlign: 'center',
  },
  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK_GREEN,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: MUTED_LABEL,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: DIVIDER,
    alignSelf: 'center',
  },
  // Form inputs
  inputRight: {
    fontSize: 15,
    color: DARK_TEXT,
    textAlign: 'right',
    flex: 1,
    paddingVertical: 0,
    minWidth: 120,
  },
  readOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  readOnlyText: {
    fontSize: 15,
    color: MUTED_LABEL,
    maxWidth: 160,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pickerValue: {
    fontSize: 15,
    color: DARK_TEXT,
  },
  pickerPlaceholder: {
    color: MUTED_LABEL,
  },
  chevronBtn: {
    padding: 4,
  },
  signOutText: {
    fontSize: 15,
    color: RED_TEXT,
    fontWeight: '600',
  },
  // Sticky bottom
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: PAGE_BG,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
  },
});

const shareStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: DARK_GREEN_LIGHT,
    textAlign: 'center',
    marginTop: 4,
  },
  codeBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 24,
    marginVertical: 20,
    alignItems: 'center',
    width: '100%',
  },
  codeText: {
    fontSize: 44,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 8,
  },
  hint: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
  },
  copyBtn: {
    backgroundColor: DARK_GREEN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 50,
    width: '100%',
  },
  copyBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  enterBtn: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 50,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  enterBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  codeInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 8,
    textAlign: 'center',
    width: '100%',
  },
  codeError: {
    color: '#FF6B6B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  closeBtn: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 50,
    marginTop: 10,
    marginBottom: 4,
    width: '100%',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

const logoutStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: DARK_TEXT,
    marginTop: 14,
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: MUTED_LABEL,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DIVIDER,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_TEXT,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: RED_TEXT,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
