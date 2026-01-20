
import React, { useState, useEffect } from 'react';
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
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';
import { RosterPerson, Interaction, Reminder } from '@/types/roster';
import { colors } from '@/styles/commonStyles';
import { getZodiacEmoji } from '@/utils/zodiac';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH * 0.75;

const CHECK_IN_MESSAGES = [
  "How's your day?",
  "Tell me something exciting about your day",
  "What's the best part of your day so far?",
  "How are you feeling today?",
  "What's on your mind?",
];

export default function PersonDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { roster, bench, dates, interactions, reminders, addInteraction, addReminder, moveToBench, moveToRoster, deletePerson, updatePerson, addFlag, refreshProfiles } = useRoster();
  
  const [person, setPerson] = useState<RosterPerson | null>(null);
  const [showBenchModal, setShowBenchModal] = useState(false);
  const [benchReason, setBenchReason] = useState('');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showChemistryTimeline, setShowChemistryTimeline] = useState(false);
  const [profileInteractions, setProfileInteractions] = useState<Interaction[]>([]);
  const [checkInMessageIndex, setCheckInMessageIndex] = useState(0);
  
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
      console.log('[PersonDetail] Red flag added successfully');
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
      console.log('[PersonDetail] Green flag added successfully');
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
  const personInteractions = profileInteractions;
  const personReminders = reminders.filter(r => r.profileId === person.id && !r.completed);

  const getInterestColor = (level: string) => {
    switch (level) {
      case 'high': return colors.green;
      case 'medium': return colors.yellow;
      case 'low': return colors.lowInterest;
      default: return colors.grey;
    }
  };

  const handleCall = () => {
    if (person.phoneNumber) {
      Linking.openURL(`tel:${person.phoneNumber}`);
    } else {
      Alert.alert('No Phone Number', 'This person doesn&apos;t have a phone number saved');
    }
  };

  const handleMessage = () => {
    if (person.phoneNumber) {
      Linking.openURL(`sms:${person.phoneNumber}`);
    } else {
      Alert.alert('No Phone Number', 'This person doesn&apos;t have a phone number saved');
    }
  };

  const handleSocialMedia = (platform: 'instagram' | 'twitter' | 'facebook' | 'snapchat') => {
    const username = person[platform];
    if (!username) {
      Alert.alert('Not Available', `No ${platform} username saved`);
      return;
    }

    let url = '';
    switch (platform) {
      case 'instagram':
        url = `instagram://user?username=${username.replace('@', '')}`;
        const fallbackInstagram = `https://instagram.com/${username.replace('@', '')}`;
        Linking.canOpenURL(url).then(supported => {
          if (supported) {
            Linking.openURL(url);
          } else {
            Linking.openURL(fallbackInstagram);
          }
        });
        break;
      case 'twitter':
        url = `twitter://user?screen_name=${username.replace('@', '')}`;
        const fallbackTwitter = `https://twitter.com/${username.replace('@', '')}`;
        Linking.canOpenURL(url).then(supported => {
          if (supported) {
            Linking.openURL(url);
          } else {
            Linking.openURL(fallbackTwitter);
          }
        });
        break;
      case 'facebook':
        url = `fb://profile/${username}`;
        const fallbackFacebook = `https://facebook.com/${username}`;
        Linking.canOpenURL(url).then(supported => {
          if (supported) {
            Linking.openURL(url);
          } else {
            Linking.openURL(fallbackFacebook);
          }
        });
        break;
      case 'snapchat':
        url = `snapchat://add/${username.replace('@', '')}`;
        const fallbackSnapchat = `https://snapchat.com/add/${username.replace('@', '')}`;
        Linking.canOpenURL(url).then(supported => {
          if (supported) {
            Linking.openURL(url);
          } else {
            Linking.openURL(fallbackSnapchat);
          }
        });
        break;
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Person',
      `Are you sure you want to delete ${person.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePerson(person.id);
              router.back();
            } catch (error) {
              console.error('[PersonDetail] Error deleting person:', error);
            }
          },
        },
      ]
    );
  };

  const handleMoveToBench = () => {
    setShowBenchModal(true);
  };

  const confirmMoveToBench = async () => {
    if (!benchReason.trim()) {
      Alert.alert('Error', 'Please provide a reason');
      return;
    }
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
    try {
      await moveToRoster(person.id);
      router.back();
    } catch (error) {
      console.error('[PersonDetail] Error moving to roster:', error);
    }
  };

  const handleQuickAction = async (type: 'morning_text' | 'check_in') => {
    console.log('[PersonDetail] Quick action:', type);
    
    if (!person.phoneNumber) {
      Alert.alert('No Phone Number', 'This person doesn&apos;t have a phone number saved');
      return;
    }

    try {
      let message = '';
      if (type === 'morning_text') {
        message = 'Good Morning';
      } else {
        message = CHECK_IN_MESSAGES[checkInMessageIndex];
        setCheckInMessageIndex((checkInMessageIndex + 1) % CHECK_IN_MESSAGES.length);
      }

      const interaction: Interaction = {
        id: Date.now().toString(),
        profileId: person.id,
        type: type,
        date: new Date().toISOString(),
      };
      await addInteraction(interaction);
      
      await loadProfileInteractions(person.id);
      
      const smsUrl = `sms:${person.phoneNumber}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(message)}`;
      console.log('[PersonDetail] Opening messages with URL:', smsUrl);
      
      const canOpen = await Linking.canOpenURL(smsUrl);
      if (canOpen) {
        await Linking.openURL(smsUrl);
      } else {
        Alert.alert('Error', 'Unable to open messages app');
      }
    } catch (error) {
      console.error('[PersonDetail] Error with quick action:', error);
      Alert.alert('Error', 'Failed to open messages app');
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
        type: type,
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

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'date': return '❤️';
      case 'morning_text': return '☀️';
      case 'check_in': return '💬';
      case 'call': return '📞';
      case 'text': return '💬';
      case 'moved_to_bench': return '⏸️';
      case 'moved_to_roster': return '⭐';
      default: return '•';
    }
  };

  const personCreatedDate = person.createdAt || new Date().toISOString();

  // FIX: Build timeline with bench status changes
  const timelineEvents = [
    { type: 'added', date: personCreatedDate, name: 'Added to Roster' },
    ...personDates.map(d => ({ type: 'date', date: d.date, name: 'Date' })),
    ...personInteractions.map(i => ({ type: i.type, date: i.date, name: i.type })),
  ];

  // Add bench status changes to timeline
  if (person.benchedAt) {
    timelineEvents.push({
      type: 'moved_to_bench',
      date: person.benchedAt,
      name: 'Moved to Bench'
    });
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: person.name,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
          headerBackTitle: 'Back',
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => {
                console.log('[PersonDetail] User tapped Edit button - navigating to edit with id:', person.id);
                router.push(`/person/add?id=${person.id}` as any);
              }}
              style={styles.editButtonContainer}
            >
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={10}
            windowSize={10}
          >
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              {person.imageUrl ? (
                <Image source={{ uri: person.imageUrl }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, styles.placeholderImage]}>
                  <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={80} color={colors.grey} />
                </View>
              )}
              <View style={[styles.interestBadge, { backgroundColor: getInterestColor(person.interestLevel) }]}>
                <Text style={styles.interestText}>{person.interestLevel.toUpperCase()}</Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickActionButton} onPress={() => handleQuickAction('morning_text')}>
                <IconSymbol ios_icon_name="sun.max.fill" android_material_icon_name="wb-sunny" size={28} color={colors.primary} />
                <Text style={styles.quickActionText}>Morning Text</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton} onPress={() => handleQuickAction('check_in')}>
                <IconSymbol ios_icon_name="message.fill" android_material_icon_name="message" size={28} color={colors.primary} />
                <Text style={styles.quickActionText}>Check In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton} onPress={() => setShowReminderModal(true)}>
                <IconSymbol ios_icon_name="bell.fill" android_material_icon_name="notifications" size={28} color={colors.primary} />
                <Text style={styles.quickActionText}>Set Reminder</Text>
              </TouchableOpacity>
            </View>

            {/* FIX: Info Section - Only show fields that are set */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Information</Text>
              {person.age && (
                <View style={styles.infoRow}>
                  <IconSymbol ios_icon_name="calendar" android_material_icon_name="calendar-today" size={22} color={colors.textSecondary} />
                  <Text style={styles.infoText}>{person.age} years old</Text>
                </View>
              )}
              {person.zodiacSign && (
                <View style={styles.infoRow}>
                  <Text style={styles.zodiacEmoji}>{getZodiacEmoji(person.zodiacSign)}</Text>
                  <Text style={styles.infoText}>{person.zodiacSign}</Text>
                </View>
              )}
              {person.location && (
                <View style={styles.infoRow}>
                  <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={22} color={colors.textSecondary} />
                  <Text style={styles.infoText}>{person.location}</Text>
                </View>
              )}
              {person.relationshipType && (
                <View style={styles.infoRow}>
                  <IconSymbol ios_icon_name="heart.fill" android_material_icon_name="favorite" size={22} color={colors.textSecondary} />
                  <Text style={styles.infoText}>{person.relationshipType}</Text>
                </View>
              )}
              {person.howMet && (
                <View style={styles.infoRow}>
                  <IconSymbol ios_icon_name="person.2.fill" android_material_icon_name="people" size={22} color={colors.textSecondary} />
                  <Text style={styles.infoText}>How We Met: {person.howMet}</Text>
                </View>
              )}
              {person.favoriteColor && (
                <View style={styles.infoRow}>
                  <IconSymbol ios_icon_name="paintpalette.fill" android_material_icon_name="palette" size={22} color={colors.textSecondary} />
                  <Text style={styles.infoText}>Favorite Color: {person.favoriteColor}</Text>
                </View>
              )}
              {person.favoriteFood && (
                <View style={styles.infoRow}>
                  <IconSymbol ios_icon_name="fork.knife" android_material_icon_name="restaurant" size={22} color={colors.textSecondary} />
                  <Text style={styles.infoText}>Favorite Food: {person.favoriteFood}</Text>
                </View>
              )}
            </View>

            {/* Contact Information - Only show if any contact info exists */}
            {(person.phoneNumber || person.instagram || person.twitter || person.facebook || person.snapchat) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact</Text>
                
                {person.phoneNumber && (
                  <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
                    <IconSymbol ios_icon_name="phone.fill" android_material_icon_name="phone" size={22} color={colors.primary} />
                    <Text style={styles.contactText}>{person.phoneNumber}</Text>
                    <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}

                {person.instagram && (
                  <TouchableOpacity style={styles.contactRow} onPress={() => handleSocialMedia('instagram')}>
                    <IconSymbol ios_icon_name="camera.fill" android_material_icon_name="camera" size={22} color="#E4405F" />
                    <Text style={styles.contactText}>Instagram: {person.instagram}</Text>
                    <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}

                {person.twitter && (
                  <TouchableOpacity style={styles.contactRow} onPress={() => handleSocialMedia('twitter')}>
                    <IconSymbol ios_icon_name="at" android_material_icon_name="alternate-email" size={22} color="#1DA1F2" />
                    <Text style={styles.contactText}>X/Twitter: {person.twitter}</Text>
                    <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}

                {person.facebook && (
                  <TouchableOpacity style={styles.contactRow} onPress={() => handleSocialMedia('facebook')}>
                    <IconSymbol ios_icon_name="person.2.fill" android_material_icon_name="group" size={22} color="#4267B2" />
                    <Text style={styles.contactText}>Facebook: {person.facebook}</Text>
                    <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}

                {person.snapchat && (
                  <TouchableOpacity style={styles.contactRow} onPress={() => handleSocialMedia('snapchat')}>
                    <IconSymbol ios_icon_name="camera.fill" android_material_icon_name="camera" size={22} color="#FFFC00" />
                    <Text style={styles.contactText}>Snapchat: {person.snapchat}</Text>
                    <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* FIX: Chemistry Timeline - Include bench status */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => setShowChemistryTimeline(!showChemistryTimeline)}
              >
                <Text style={styles.sectionTitle}>Chemistry Timeline</Text>
                <IconSymbol
                  ios_icon_name={showChemistryTimeline ? 'chevron.up' : 'chevron.down'}
                  android_material_icon_name={showChemistryTimeline ? 'expand-less' : 'expand-more'}
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {showChemistryTimeline && (
                <View style={styles.timeline}>
                  {timelineEvents.length === 0 ? (
                    <>
                      <View style={styles.timelineItem}>
                        <Text style={styles.timelineIcon}>✨</Text>
                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineName}>Added to Roster</Text>
                          <Text style={styles.timelineDate}>
                            {new Date(personCreatedDate).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.emptyText}>No interactions yet</Text>
                    </>
                  ) : (
                    timelineEvents
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 10)
                      .map((item, index) => (
                        <View key={`timeline-${index}`} style={styles.timelineItem}>
                          <Text style={styles.timelineIcon}>
                            {getInteractionIcon(item.type)}
                          </Text>
                          <View style={styles.timelineContent}>
                            <Text style={styles.timelineName}>{item.name.replace('_', ' ')}</Text>
                            <Text style={styles.timelineDate}>
                              {new Date(item.date).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                      ))
                  )}
                </View>
              )}
            </View>

            {/* Dates */}
            {personDates.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dates ({personDates.length})</Text>
                {personDates.slice(0, 3).map((date) => (
                  <View key={date.id} style={styles.dateCard}>
                    <Text style={styles.dateTitle}>{date.type}</Text>
                    <Text style={styles.dateDetails}>{date.date} at {date.time}</Text>
                    <Text style={styles.dateLocation}>{date.location}</Text>
                    {date.rating && (
                      <View style={styles.ratingRow}>
                        <Text style={styles.ratingText}>Rating: {'⭐'.repeat(date.rating)}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Reminders */}
            {personReminders.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Reminders</Text>
                {personReminders.map((reminder) => (
                  <View key={reminder.id} style={styles.reminderCard}>
                    <IconSymbol
                      ios_icon_name="bell.fill"
                      android_material_icon_name="notifications"
                      size={22}
                      color={colors.primary}
                    />
                    <View style={styles.reminderContent}>
                      <Text style={styles.reminderTitle}>{reminder.title}</Text>
                      <Text style={styles.reminderDate}>
                        {new Date(reminder.scheduledFor).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Flags Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Flags</Text>
              
              {/* Red Flags */}
              <Text style={styles.flagSubtitle}>Red Flags 🚩</Text>
              <View style={styles.flagInputContainer}>
                <TextInput
                  style={[styles.flagInput, { flex: 1 }]}
                  value={redFlagInput}
                  onChangeText={setRedFlagInput}
                  placeholder="Add a red flag"
                  placeholderTextColor={colors.grey}
                  onSubmitEditing={handleAddRedFlag}
                  returnKeyType="done"
                />
                <TouchableOpacity 
                  style={[styles.addFlagButton, { backgroundColor: colors.lowInterest }]} 
                  onPress={handleAddRedFlag}
                >
                  <IconSymbol
                    ios_icon_name="plus"
                    android_material_icon_name="add"
                    size={20}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
              {person.redFlags.map((flag) => (
                <View key={flag.id} style={styles.flagItem}>
                  <Text style={styles.flagEmoji}>🚩</Text>
                  <Text style={styles.flagText}>{flag.text}</Text>
                </View>
              ))}
              {person.redFlags.length === 0 && (
                <Text style={styles.noFlagsText}>No red flags yet</Text>
              )}

              {/* Green Flags */}
              <Text style={[styles.flagSubtitle, { marginTop: 16 }]}>Green Flags ✅</Text>
              <View style={styles.flagInputContainer}>
                <TextInput
                  style={[styles.flagInput, { flex: 1 }]}
                  value={greenFlagInput}
                  onChangeText={setGreenFlagInput}
                  placeholder="Add a green flag"
                  placeholderTextColor={colors.grey}
                  onSubmitEditing={handleAddGreenFlag}
                  returnKeyType="done"
                />
                <TouchableOpacity 
                  style={[styles.addFlagButton, { backgroundColor: colors.green }]} 
                  onPress={handleAddGreenFlag}
                >
                  <IconSymbol
                    ios_icon_name="plus"
                    android_material_icon_name="add"
                    size={20}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
              {person.greenFlags.map((flag) => (
                <View key={flag.id} style={styles.flagItem}>
                  <Text style={styles.flagEmoji}>✅</Text>
                  <Text style={styles.flagText}>{flag.text}</Text>
                </View>
              ))}
              {person.greenFlags.length === 0 && (
                <Text style={styles.noFlagsText}>No green flags yet</Text>
              )}
            </View>

            {/* Contact Actions */}
            {person.phoneNumber && (
              <View style={styles.contactActions}>
                <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
                  <IconSymbol ios_icon_name="phone.fill" android_material_icon_name="phone" size={24} color="#fff" />
                  <Text style={styles.contactButtonText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.contactButton} onPress={handleMessage}>
                  <IconSymbol ios_icon_name="message.fill" android_material_icon_name="message" size={24} color="#fff" />
                  <Text style={styles.contactButtonText}>Message</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {person.status === 'roster' ? (
                <TouchableOpacity style={styles.benchButton} onPress={handleMoveToBench}>
                  <IconSymbol ios_icon_name="pause.fill" android_material_icon_name="pause" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Move to Bench</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.rosterButton} onPress={handleMoveToRoster}>
                  <IconSymbol ios_icon_name="arrow.uturn.left" android_material_icon_name="undo" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Move to Roster</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <IconSymbol ios_icon_name="trash.fill" android_material_icon_name="delete" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Bench Modal */}
          <Modal
            visible={showBenchModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowBenchModal(false)}
          >
            <TouchableWithoutFeedback onPress={() => {
              Keyboard.dismiss();
              setShowBenchModal(false);
            }}>
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
                      <TouchableOpacity
                        style={[styles.modalButton, styles.cancelButton]}
                        onPress={() => {
                          setShowBenchModal(false);
                          setBenchReason('');
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.confirmButton]}
                        onPress={confirmMoveToBench}
                      >
                        <Text style={styles.confirmButtonText}>Confirm</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Reminder Modal */}
          <Modal
            visible={showReminderModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowReminderModal(false)}
          >
            <TouchableWithoutFeedback onPress={() => {
              Keyboard.dismiss();
              setShowReminderModal(false);
            }}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <View style={styles.reminderModalContent}>
                    <Text style={styles.modalTitle}>Set Reminder</Text>
                    <TouchableOpacity
                      style={styles.reminderOption}
                      onPress={() => {
                        handleSetReminder('morning_text');
                        setShowReminderModal(false);
                      }}
                    >
                      <IconSymbol ios_icon_name="sun.max.fill" android_material_icon_name="wb-sunny" size={24} color={colors.primary} />
                      <Text style={styles.reminderOptionText}>Send morning text</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.reminderOption}
                      onPress={() => {
                        handleSetReminder('check_in');
                        setShowReminderModal(false);
                      }}
                    >
                      <IconSymbol ios_icon_name="message.fill" android_material_icon_name="message" size={24} color={colors.primary} />
                      <Text style={styles.reminderOptionText}>Check in - How&apos;s your day?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setShowReminderModal(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  errorText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginTop: 40,
  },
  editButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButton: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  profileHeader: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  profileImage: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },
  placeholderImage: {
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  interestBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  interestText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  quickActionButton: {
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  flagSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
  },
  zodiacEmoji: {
    fontSize: 22,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 8,
  },
  contactText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  timeline: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  timelineIcon: {
    fontSize: 24,
  },
  timelineContent: {
    flex: 1,
  },
  timelineName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  timelineDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  dateCard: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  dateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  dateDetails: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.8,
    marginTop: 4,
  },
  dateLocation: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ratingRow: {
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: colors.text,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  reminderDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  flagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  flagInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.grey + '30',
  },
  addFlagButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  flagEmoji: {
    fontSize: 20,
  },
  flagText: {
    fontSize: 14,
    color: colors.text,
  },
  noFlagsText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  benchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.yellow,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  rosterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.backgroundAlt,
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
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
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
    backgroundColor: colors.background,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  reminderModalContent: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  reminderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
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
