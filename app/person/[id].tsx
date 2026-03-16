
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ImageSourcePropType,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useRoster } from '@/contexts/RosterContext';
import { RosterPerson, Interaction, Reminder } from '@/types/roster';
import { colors } from '@/styles/commonStyles';
import { getZodiacEmoji } from '@/utils/zodiac';
import RatingsSection, { RatingsValues } from '@/components/RatingsSection';

// ─── Constants ────────────────────────────────────────────────────────────────
const DARK_GREEN = '#1B4332';
const CARD_GREEN = '#1B4332';
const GREEN_TRACK = '#A8D5A2';
const BOTTOM_BAR_HEIGHT = 80;

type TabKey = 'overview' | 'dates' | 'notes' | 'reminders';

const CHECK_IN_MESSAGES = [
  "How's your day?",
  "Tell me something exciting about your day",
  "What's the best part of your day so far?",
  "How are you feeling today?",
  "What's on your mind?",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

function getZodiacShortLabel(sign: string): string {
  return sign ? sign.charAt(0).toUpperCase() : '?';
}

function getCompatibilityLabel(score: number): string {
  if (score >= 80) return 'Highly compatible';
  if (score >= 60) return 'Worth exploring';
  if (score >= 40) return 'Some friction';
  return 'Challenging match';
}

// ─── Zodiac Compatibility Ring ────────────────────────────────────────────────
function CompatibilityRing({ score }: { score: number }) {
  const SIZE = 64;
  const STROKE = 5;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const progress = Math.min(score / 100, 1);
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const scoreStr = String(Math.round(score)) + '%';

  return (
    <View style={ringStyles.wrapper}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={STROKE}
          fill="none"
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="#fff"
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <View style={ringStyles.label}>
        <Text style={ringStyles.labelText}>{scoreStr}</Text>
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  wrapper: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});

// ─── Pill Chip ────────────────────────────────────────────────────────────────
function Chip({ label, value, style }: { label?: string; value: string; style?: object }) {
  return (
    <View style={[chipStyles.chip, style]}>
      {label ? (
        <View style={chipStyles.row}>
          <Text style={chipStyles.label}>{label}</Text>
          <Text style={chipStyles.colon}>: </Text>
          <Text style={chipStyles.value}>{value}</Text>
        </View>
      ) : (
        <Text style={chipStyles.value}>{value}</Text>
      )}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
  },
  colon: {
    fontSize: 13,
    color: '#6B7280',
  },
  value: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PersonDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const {
    roster, bench, dates, interactions, reminders,
    addInteraction, addReminder, moveToBench, moveToRoster,
    deletePerson, updatePerson, addFlag, refreshProfiles,
  } = useRoster();

  const [person, setPerson] = useState<RosterPerson | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [showBenchModal, setShowBenchModal] = useState(false);
  const [benchReason, setBenchReason] = useState('');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [profileInteractions, setProfileInteractions] = useState<Interaction[]>([]);
  const [checkInMessageIndex, setCheckInMessageIndex] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ratingsMap, setRatingsMap] = useState<Record<string, Partial<RatingsValues>>>({});
  const [redFlagInput, setRedFlagInput] = useState('');
  const [greenFlagInput, setGreenFlagInput] = useState('');

  useEffect(() => {
    const allPeople = [...roster, ...bench];
    const foundPerson = allPeople.find(p => p.id === id);
    setPerson(foundPerson || null);
    if (foundPerson) {
      loadProfileInteractions(foundPerson.id);
    }
  }, [id, roster, bench]);

  const loadProfileInteractions = async (profileId: string) => {
    try {
      console.log('[PersonDetail] Loading interactions for profile:', profileId);
      const { authenticatedGet } = await import('@/utils/api');
      const response = await authenticatedGet(`/api/interactions/${profileId}`);
      console.log('[PersonDetail] Interactions loaded:', response.length);
      setProfileInteractions(response);
    } catch (error) {
      console.error('[PersonDetail] Error loading interactions:', error);
      setProfileInteractions([]);
    }
  };

  const handleAddRedFlag = async () => {
    if (!redFlagInput.trim() || !person) return;
    try {
      console.log('[PersonDetail] Adding red flag:', redFlagInput.trim());
      await addFlag(person.id, redFlagInput.trim(), 'red');
      setRedFlagInput('');
      await refreshProfiles();
    } catch (error) {
      console.error('[PersonDetail] Error adding red flag:', error);
      Alert.alert('Error', 'Failed to add red flag');
    }
  };

  const handleAddGreenFlag = async () => {
    if (!greenFlagInput.trim() || !person) return;
    try {
      console.log('[PersonDetail] Adding green flag:', greenFlagInput.trim());
      await addFlag(person.id, greenFlagInput.trim(), 'green');
      setGreenFlagInput('');
      await refreshProfiles();
    } catch (error) {
      console.error('[PersonDetail] Error adding green flag:', error);
      Alert.alert('Error', 'Failed to add green flag');
    }
  };

  if (!person) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Person not found</Text>
      </SafeAreaView>
    );
  }

  const personDates = dates.filter(d => d.profileId === person.id);
  const personReminders = reminders.filter(r => r.profileId === person.id && !r.completed);
  const compatScore = typeof person.compatibilityScore === 'number' ? person.compatibilityScore : 67;
  const compatLabel = getCompatibilityLabel(compatScore);
  const zodiacEmoji = getZodiacEmoji(person.zodiacSign);
  const zodiacShort = getZodiacShortLabel(person.zodiacSign);
  const chemistryScore = typeof person.sexualChemistry === 'number' ? person.sexualChemistry : null;

  const handleCall = () => {
    console.log('[PersonDetail] User tapped Call button');
    if (person.phoneNumber) {
      Linking.openURL(`tel:${person.phoneNumber}`);
    } else {
      Alert.alert('No Phone Number', 'No phone number saved');
    }
  };

  const handleMessage = () => {
    console.log('[PersonDetail] User tapped Text button');
    if (person.phoneNumber) {
      Linking.openURL(`sms:${person.phoneNumber}`);
    } else {
      Alert.alert('No Phone Number', 'No phone number saved');
    }
  };

  const handleInstagram = () => {
    console.log('[PersonDetail] User tapped Instagram button');
    const username = person.instagram;
    if (!username) { Alert.alert('Not Available', 'No Instagram username saved'); return; }
    const url = `instagram://user?username=${username.replace('@', '')}`;
    const fallback = `https://instagram.com/${username.replace('@', '')}`;
    Linking.canOpenURL(url).then(ok => Linking.openURL(ok ? url : fallback));
  };

  const handleTikTok = () => {
    console.log('[PersonDetail] User tapped TikTok button');
    const username = person.twitter;
    if (!username) { Alert.alert('Not Available', 'No TikTok username saved'); return; }
    const url = `https://tiktok.com/@${username.replace('@', '')}`;
    Linking.openURL(url);
  };

  const handleDelete = () => {
    console.log('[PersonDetail] User tapped Delete button');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      console.log('[PersonDetail] Confirming delete for person:', person.id);
      await deletePerson(person.id);
      setShowDeleteModal(false);
      router.back();
    } catch (error) {
      console.error('[PersonDetail] Error deleting person:', error);
      setShowDeleteModal(false);
      Alert.alert('Error', 'Failed to delete person. Please try again.');
    }
  };

  const handleMoveToBench = () => {
    console.log('[PersonDetail] User tapped Move to Bench button');
    setShowBenchModal(true);
  };

  const confirmMoveToBench = async () => {
    if (!benchReason.trim()) { Alert.alert('Error', 'Please provide a reason'); return; }
    try {
      await moveToBench(person.id, benchReason);
      setShowBenchModal(false);
      setBenchReason('');
      router.back();
    } catch (error) {
      console.error('[PersonDetail] Error moving to bench:', error);
    }
  };

  const handleMoveToRoster = async () => {
    console.log('[PersonDetail] User tapped Move to Roster button');
    try {
      await moveToRoster(person.id);
      router.back();
    } catch (error) {
      console.error('[PersonDetail] Error moving to roster:', error);
    }
  };

  const handleSetReminder = async (type: 'morning_text' | 'check_in') => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      const reminder: Reminder = {
        id: Date.now().toString(),
        profileId: person.id,
        type,
        title: type === 'morning_text' ? 'Send morning text' : 'Check in',
        description: `Reminder to ${type === 'morning_text' ? 'send a morning text' : 'check in'} with ${person.name}`,
        scheduledFor: tomorrow.toISOString(),
        completed: false,
        recurring: true,
      };
      await addReminder(reminder);
      Alert.alert('Success', 'Reminder set!');
    } catch (error) {
      console.error('[PersonDetail] Error setting reminder:', error);
    }
  };

  // ─── Tab Content ─────────────────────────────────────────────────────────
  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Favorites Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionCardTitle}>Favorite</Text>
        <View style={styles.chipsWrap}>
          {person.favoriteFoodType ? (
            <Chip label="Fav Food" value={person.favoriteFoodType} />
          ) : null}
          {person.favoriteColor ? (
            <Chip label="Fav Color" value={person.favoriteColor} />
          ) : null}
          {person.howMet ? (
            <Chip label="Things they like" value={person.howMet} />
          ) : null}
          {person.relationshipType ? (
            <Chip label="Lifestyle vibe" value={person.relationshipType} />
          ) : null}
          {person.interestLevel ? (
            <Chip label="Intention" value={person.interestLevel === 'high' ? 'Open to serious' : person.interestLevel === 'medium' ? 'Casual' : 'Just exploring'} />
          ) : null}
          {!person.favoriteFoodType && !person.favoriteColor && !person.howMet && (
            <Text style={styles.emptyText}>No favorites added yet</Text>
          )}
        </View>
      </View>

      {/* Flags Section */}
      <View style={styles.sectionCard}>
        <View style={styles.flagsRow}>
          {/* Green Flags */}
          <View style={styles.flagsCol}>
            <Text style={styles.greenFlagsTitle}>Green Flags</Text>
            <View style={styles.chipsWrap}>
              {person.greenFlags.length > 0 ? (
                person.greenFlags.map(flag => (
                  <Chip key={flag.id} value={flag.text} />
                ))
              ) : (
                <Text style={styles.emptyText}>None yet</Text>
              )}
            </View>
            {/* Add green flag inline */}
            <View style={styles.flagInputRow}>
              <TextInput
                style={styles.flagInput}
                value={greenFlagInput}
                onChangeText={setGreenFlagInput}
                placeholder="Add green flag"
                placeholderTextColor="#9CA3AF"
                onSubmitEditing={handleAddGreenFlag}
                returnKeyType="done"
              />
              <TouchableOpacity style={[styles.flagAddBtn, { backgroundColor: DARK_GREEN }]} onPress={handleAddGreenFlag}>
                <Ionicons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.flagsDivider} />

          {/* Red Flags */}
          <View style={styles.flagsCol}>
            <Text style={styles.redFlagsTitle}>Red Flags</Text>
            <View style={styles.chipsWrap}>
              {person.redFlags.length > 0 ? (
                person.redFlags.map(flag => (
                  <Chip key={flag.id} value={flag.text} />
                ))
              ) : (
                <Text style={styles.emptyText}>None yet</Text>
              )}
            </View>
            {/* Add red flag inline */}
            <View style={styles.flagInputRow}>
              <TextInput
                style={styles.flagInput}
                value={redFlagInput}
                onChangeText={setRedFlagInput}
                placeholder="Add red flag"
                placeholderTextColor="#9CA3AF"
                onSubmitEditing={handleAddRedFlag}
                returnKeyType="done"
              />
              <TouchableOpacity style={[styles.flagAddBtn, { backgroundColor: '#DC2626' }]} onPress={handleAddRedFlag}>
                <Ionicons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Ratings Section */}
      <RatingsSection
        initialRatings={ratingsMap[person.id] || {}}
        onChange={(ratings) => {
          console.log('[PersonDetail] Ratings updated for', person.name, ratings);
          setRatingsMap(prev => ({ ...prev, [person.id]: ratings }));
        }}
      />
    </View>
  );

  const renderDatesTab = () => (
    <View style={styles.tabContent}>
      {personDates.length > 0 ? (
        personDates.map(date => (
          <View key={date.id} style={styles.sectionCard}>
            <Text style={styles.sectionCardTitle}>{date.type}</Text>
            <Text style={styles.dateDetail}>{date.date} at {date.time}</Text>
            <Text style={styles.dateLocation}>{date.location}</Text>
            {date.rating ? (
              <Text style={styles.dateRating}>{'⭐'.repeat(date.rating)}</Text>
            ) : null}
          </View>
        ))
      ) : (
        <View style={styles.comingSoonBox}>
          <Ionicons name="calendar-outline" size={40} color={DARK_GREEN} />
          <Text style={styles.comingSoonTitle}>No dates yet</Text>
          <Text style={styles.comingSoonSub}>Your dates with {person.name} will appear here</Text>
        </View>
      )}
    </View>
  );

  const renderNotesTab = () => (
    <View style={styles.tabContent}>
      {person.notes ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Notes</Text>
          <Text style={styles.notesText}>{person.notes}</Text>
        </View>
      ) : (
        <View style={styles.comingSoonBox}>
          <Ionicons name="document-text-outline" size={40} color={DARK_GREEN} />
          <Text style={styles.comingSoonTitle}>No notes yet</Text>
          <Text style={styles.comingSoonSub}>Edit this person to add notes</Text>
        </View>
      )}
    </View>
  );

  const renderRemindersTab = () => (
    <View style={styles.tabContent}>
      {personReminders.length > 0 ? (
        personReminders.map(reminder => (
          <View key={reminder.id} style={styles.sectionCard}>
            <Text style={styles.sectionCardTitle}>{reminder.title}</Text>
            <Text style={styles.dateDetail}>{new Date(reminder.scheduledFor).toLocaleString()}</Text>
          </View>
        ))
      ) : (
        <View style={styles.comingSoonBox}>
          <Ionicons name="notifications-outline" size={40} color={DARK_GREEN} />
          <Text style={styles.comingSoonTitle}>No reminders set</Text>
          <Text style={styles.comingSoonSub}>Tap the bell icon to set a reminder</Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.addReminderBtn}
        onPress={() => {
          console.log('[PersonDetail] User tapped Set Reminder button');
          setShowReminderModal(true);
        }}
      >
        <Ionicons name="add-circle-outline" size={20} color={DARK_GREEN} />
        <Text style={styles.addReminderText}>Set a reminder</Text>
      </TouchableOpacity>
    </View>
  );

  const tabContent = activeTab === 'overview'
    ? renderOverviewTab()
    : activeTab === 'dates'
    ? renderDatesTab()
    : activeTab === 'notes'
    ? renderNotesTab()
    : renderRemindersTab();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Roster Details',
          headerStyle: { backgroundColor: DARK_GREEN },
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff', fontWeight: '700' },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                console.log('[PersonDetail] User tapped Back button');
                router.back();
              }}
              style={styles.headerBtn}
            >
              <Ionicons name="chevron-back" size={20} color="#fff" />
              <Text style={styles.headerBtnText}>Back</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.root}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── TOP CARD ─────────────────────────────────────────── */}
            <View style={styles.topCard}>
              {/* Avatar */}
              <View style={styles.avatarRing}>
                {person.imageUrl ? (
                  <Image source={resolveImageSource(person.imageUrl)} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={36} color="rgba(255,255,255,0.6)" />
                  </View>
                )}
              </View>

              {/* Name + Zodiac Badge */}
              <View style={styles.nameRow}>
                <Text style={styles.personName}>{person.name}</Text>
                <View style={styles.zodiacBadge}>
                  <Text style={styles.zodiacBadgeText}>{zodiacShort}</Text>
                </View>
              </View>

              {/* Pill tags */}
              <View style={styles.pillRow}>
                {person.relationshipType ? (
                  <View style={styles.darkPill}>
                    <Text style={styles.darkPillText}>{person.relationshipType}</Text>
                  </View>
                ) : null}
                {chemistryScore !== null ? (
                  <View style={styles.darkPill}>
                    <Text style={styles.darkPillText}>{chemistryScore}</Text>
                    <Text style={styles.darkPillSep}> | </Text>
                    <Text style={styles.darkPillText}>Chemistry</Text>
                  </View>
                ) : null}
              </View>

              {/* Zodiac Compatibility Row */}
              <View style={styles.compatRow}>
                <View style={styles.compatLeft}>
                  <Text style={styles.compatTitle}>Zodiac Compatibility</Text>
                  <Text style={styles.compatSub}>{compatLabel}</Text>
                </View>
                <CompatibilityRing score={compatScore} />
              </View>

              {/* Action Buttons Row */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionPill} onPress={handleCall}>
                  <Ionicons name="call-outline" size={16} color="#fff" />
                  <Text style={styles.actionPillText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionPill} onPress={handleMessage}>
                  <Ionicons name="chatbubble-outline" size={16} color="#fff" />
                  <Text style={styles.actionPillText}>Text</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionPill} onPress={handleInstagram}>
                  <Ionicons name="logo-instagram" size={16} color="#fff" />
                  <Text style={styles.actionPillText}>Insta</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionPill} onPress={handleTikTok}>
                  <Ionicons name="musical-notes-outline" size={16} color="#fff" />
                  <Text style={styles.actionPillText}>TikTok</Text>
                </TouchableOpacity>
              </View>

              {/* Tab Bar */}
              <View style={styles.tabBar}>
                {(['overview', 'dates', 'notes', 'reminders'] as TabKey[]).map((tab, idx) => {
                  const isActive = activeTab === tab;
                  const label = tab.charAt(0).toUpperCase() + tab.slice(1);
                  return (
                    <TouchableOpacity
                      key={tab}
                      style={[styles.tabItem, isActive && styles.tabItemActive]}
                      onPress={() => {
                        console.log('[PersonDetail] User tapped tab:', tab);
                        setActiveTab(tab);
                      }}
                    >
                      <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ── TAB CONTENT ──────────────────────────────────────── */}
            {tabContent}
          </ScrollView>

          {/* ── STICKY BOTTOM BUTTONS ────────────────────────────── */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => {
                console.log('[PersonDetail] User tapped Edit button - navigating to edit with id:', person.id);
                router.push(`/person/add?id=${person.id}` as any);
              }}
            >
              <Ionicons name="pencil-outline" size={18} color="#fff" />
              <Text style={styles.bottomBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.bottomBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* ── BENCH MODAL ──────────────────────────────────────────── */}
      <Modal visible={showBenchModal} transparent animationType="slide" onRequestClose={() => setShowBenchModal(false)}>
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setShowBenchModal(false); }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Move to Bench</Text>
                <Text style={styles.modalSubtitle}>Why are you benching {person.name}?</Text>
                <TextInput
                  style={styles.modalInput}
                  value={benchReason}
                  onChangeText={setBenchReason}
                  placeholder="Enter reason..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setShowBenchModal(false); setBenchReason(''); }}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={confirmMoveToBench}>
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── DELETE MODAL ─────────────────────────────────────────── */}
      <Modal visible={showDeleteModal} transparent animationType="slide" onRequestClose={() => setShowDeleteModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowDeleteModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Delete Person</Text>
                <Text style={styles.modalSubtitle}>
                  Are you sure you want to delete {person.name}? This action cannot be undone.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowDeleteModal(false)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.deleteConfirmButton]} onPress={confirmDelete}>
                    <Text style={styles.confirmButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── REMINDER MODAL ───────────────────────────────────────── */}
      <Modal visible={showReminderModal} transparent animationType="slide" onRequestClose={() => setShowReminderModal(false)}>
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setShowReminderModal(false); }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.reminderModalContent}>
                <Text style={styles.modalTitle}>Set Reminder</Text>
                <TouchableOpacity style={styles.reminderOption} onPress={() => { handleSetReminder('morning_text'); setShowReminderModal(false); }}>
                  <Ionicons name="sunny-outline" size={24} color={DARK_GREEN} />
                  <Text style={styles.reminderOptionText}>Send morning text</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reminderOption} onPress={() => { handleSetReminder('check_in'); setShowReminderModal(false); }}>
                  <Ionicons name="chatbubble-outline" size={24} color={DARK_GREEN} />
                  <Text style={styles.reminderOptionText}>Check in</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowReminderModal(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: BOTTOM_BAR_HEIGHT + 24,
  },
  errorText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginTop: 40,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 2,
  },
  headerBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },

  // ── TOP CARD ──────────────────────────────────────────────────────────────
  topCard: {
    backgroundColor: CARD_GREEN,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 0,
    marginBottom: 0,
  },
  avatarRing: {
    alignSelf: 'center',
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  personName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  zodiacBadge: {
    backgroundColor: '#7C3AED',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  zodiacBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  pillRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  darkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  darkPillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  darkPillSep: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },

  // Compatibility row
  compatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  compatLeft: {
    flex: 1,
  },
  compatTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  compatSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },

  // Action pills
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  actionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  actionPillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 24,
    padding: 4,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  tabItemActive: {
    backgroundColor: '#fff',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  tabLabelActive: {
    color: DARK_GREEN,
    fontWeight: '700',
  },

  // ── TAB CONTENT ───────────────────────────────────────────────────────────
  tabContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // Flags
  flagsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flagsCol: {
    flex: 1,
  },
  flagsDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  greenFlagsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK_GREEN,
    marginBottom: 8,
  },
  redFlagsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 8,
  },
  flagInputRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  flagInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  flagAddBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },

  // Dates / Notes / Reminders
  dateDetail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  dateLocation: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  dateRating: {
    fontSize: 13,
    marginTop: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  comingSoonBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  comingSoonSub: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  addReminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: DARK_GREEN,
    borderRadius: 12,
    marginTop: 8,
  },
  addReminderText: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_GREEN,
  },

  // ── BOTTOM BAR ────────────────────────────────────────────────────────────
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: '#F3F4F6',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DARK_GREEN,
    borderRadius: 28,
    paddingVertical: 14,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    borderRadius: 28,
    paddingVertical: 14,
  },
  bottomBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // ── MODALS ────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  confirmButton: {
    backgroundColor: DARK_GREEN,
  },
  deleteConfirmButton: {
    backgroundColor: '#DC2626',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  reminderModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  reminderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  reminderOptionText: {
    fontSize: 16,
    color: colors.text,
  },
});
