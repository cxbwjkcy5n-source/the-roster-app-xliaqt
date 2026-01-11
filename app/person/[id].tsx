
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
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';
import { RosterPerson, Interaction, Reminder } from '@/types/roster';
import { colors } from '@/styles/commonStyles';

export default function PersonDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { roster, bench, dates, interactions, reminders, addInteraction, addReminder, moveToBench, moveToRoster, deletePerson } = useRoster();
  
  const [person, setPerson] = useState<RosterPerson | null>(null);
  const [showBenchModal, setShowBenchModal] = useState(false);
  const [benchReason, setBenchReason] = useState('');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showChemistryTimeline, setShowChemistryTimeline] = useState(false);
  const [profileInteractions, setProfileInteractions] = useState<Interaction[]>([]);

  useEffect(() => {
    const allPeople = [...roster, ...bench];
    const foundPerson = allPeople.find(p => p.id === id);
    setPerson(foundPerson || null);
    
    // Load interactions for this profile
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

  if (!person) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Person not found</Text>
      </SafeAreaView>
    );
  }

  const personDates = dates.filter(d => d.profileId === person.id);
  const personInteractions = profileInteractions; // Use profile-specific interactions
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
    try {
      const interaction: Interaction = {
        id: Date.now().toString(),
        profileId: person.id,
        type: type,
        date: new Date().toISOString(),
      };
      await addInteraction(interaction);
      
      // Reload interactions after adding
      await loadProfileInteractions(person.id);
      
      Alert.alert('Success', `${type === 'morning_text' ? 'Morning text' : 'Check-in'} logged!`);
    } catch (error) {
      console.error('[PersonDetail] Error logging interaction:', error);
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
      default: return '•';
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: person.name,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push(`/person/add?id=${person.id}`)}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            {person.imageUrl ? (
              <Image source={{ uri: person.imageUrl }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.placeholderImage]}>
                <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={60} color={colors.grey} />
              </View>
            )}
            <View style={[styles.interestBadge, { backgroundColor: getInterestColor(person.interestLevel) }]}>
              <Text style={styles.interestText}>{person.interestLevel.toUpperCase()}</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionButton} onPress={() => handleQuickAction('morning_text')}>
              <IconSymbol ios_icon_name="sun.max.fill" android_material_icon_name="wb-sunny" size={24} color={colors.primary} />
              <Text style={styles.quickActionText}>Morning Text</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} onPress={() => handleQuickAction('check_in')}>
              <IconSymbol ios_icon_name="message.fill" android_material_icon_name="message" size={24} color={colors.primary} />
              <Text style={styles.quickActionText}>Check In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} onPress={() => setShowReminderModal(true)}>
              <IconSymbol ios_icon_name="bell.fill" android_material_icon_name="notifications" size={24} color={colors.primary} />
              <Text style={styles.quickActionText}>Set Reminder</Text>
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Information</Text>
            <View style={styles.infoRow}>
              <IconSymbol ios_icon_name="calendar" android_material_icon_name="calendar-today" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>{person.age} years old</Text>
            </View>
            <View style={styles.infoRow}>
              <IconSymbol ios_icon_name="star.fill" android_material_icon_name="star" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>{person.zodiacSign}</Text>
            </View>
            <View style={styles.infoRow}>
              <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>{person.location}</Text>
            </View>
            <View style={styles.infoRow}>
              <IconSymbol ios_icon_name="heart.fill" android_material_icon_name="favorite" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>{person.relationshipType}</Text>
            </View>
          </View>

          {/* Chemistry Timeline */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setShowChemistryTimeline(!showChemistryTimeline)}
            >
              <Text style={styles.sectionTitle}>Chemistry Timeline</Text>
              <IconSymbol
                ios_icon_name={showChemistryTimeline ? 'chevron.up' : 'chevron.down'}
                android_material_icon_name={showChemistryTimeline ? 'expand-less' : 'expand-more'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {showChemistryTimeline && (
              <View style={styles.timeline}>
                {personInteractions.length === 0 && personDates.length === 0 ? (
                  <Text style={styles.emptyText}>No interactions yet</Text>
                ) : (
                  <>
                    {[...personDates.map(d => ({ type: 'date', date: d.date, name: 'Date' })),
                      ...personInteractions.map(i => ({ type: i.type, date: i.date, name: i.type }))]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 10)
                      .map((item, index) => (
                        <View key={index} style={styles.timelineItem}>
                          <Text style={styles.timelineIcon}>{getInteractionIcon(item.type)}</Text>
                          <View style={styles.timelineContent}>
                            <Text style={styles.timelineName}>{item.name.replace('_', ' ')}</Text>
                            <Text style={styles.timelineDate}>
                              {new Date(item.date).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                      ))}
                  </>
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
                    size={20}
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

          {/* Flags */}
          {(person.redFlags.length > 0 || person.greenFlags.length > 0) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Flags</Text>
              {person.redFlags.map((flag) => (
                <View key={flag.id} style={styles.flagItem}>
                  <Text style={styles.flagEmoji}>🚩</Text>
                  <Text style={styles.flagText}>{flag.text}</Text>
                </View>
              ))}
              {person.greenFlags.map((flag) => (
                <View key={flag.id} style={styles.flagItem}>
                  <Text style={styles.flagEmoji}>✅</Text>
                  <Text style={styles.flagText}>{flag.text}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Contact Actions */}
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
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
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
          <View style={styles.modalOverlay}>
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
          </View>
        </Modal>
      </SafeAreaView>
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
  editButton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  interestBadge: {
    position: 'absolute',
    bottom: 24,
    right: '35%',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  interestText: {
    fontSize: 10,
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
