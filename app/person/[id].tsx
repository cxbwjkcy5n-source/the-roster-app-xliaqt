
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
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';
import { RosterPerson } from '@/types/roster';

export default function PersonDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { roster, bench, deletePerson, moveToBench, moveToRoster } = useRoster();
  const [person, setPerson] = useState<RosterPerson | null>(null);
  const [isOnBench, setIsOnBench] = useState(false);

  useEffect(() => {
    const foundInRoster = roster.find(p => p.id === id);
    const foundInBench = bench.find(p => p.id === id);
    
    if (foundInRoster) {
      setPerson(foundInRoster);
      setIsOnBench(false);
    } else if (foundInBench) {
      setPerson(foundInBench);
      setIsOnBench(true);
    }
  }, [id, roster, bench]);

  if (!person) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Person not found</Text>
      </View>
    );
  }

  const getInterestColor = (level: string) => {
    switch (level) {
      case 'high': return colors.primary;
      case 'medium': return colors.accent;
      case 'low': return colors.highlight;
      default: return colors.textSecondary;
    }
  };

  const handleCall = () => {
    if (person.phoneNumber) {
      Linking.openURL(`tel:${person.phoneNumber}`);
    }
  };

  const handleMessage = () => {
    if (person.phoneNumber) {
      Linking.openURL(`sms:${person.phoneNumber}`);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Person',
      `Are you sure you want to remove ${person.name} from your roster?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePerson(person.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleToggleBench = async () => {
    if (isOnBench) {
      await moveToRoster(person.id);
      Alert.alert('Success', `${person.name} moved back to roster`);
    } else {
      await moveToBench(person.id);
      Alert.alert('Success', `${person.name} moved to bench`);
    }
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: person.name,
          headerRight: () => (
            <TouchableOpacity onPress={() => console.log('Edit')}>
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>
                Edit
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.photoContainer}>
            {person.photoUri ? (
              <Image source={{ uri: person.photoUri }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={80}
                  color={colors.textSecondary}
                />
              </View>
            )}
            <View
              style={[
                styles.interestBadge,
                { backgroundColor: getInterestColor(person.interestLevel) },
              ]}
            >
              <Text style={styles.interestBadgeText}>
                {person.interestLevel.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.name}>{person.name}</Text>
          <Text style={styles.info}>
            {person.age} • {person.location}
          </Text>

          {person.phoneNumber && (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                <IconSymbol
                  ios_icon_name="phone.fill"
                  android_material_icon_name="phone"
                  size={24}
                  color={colors.white}
                />
                <Text style={styles.actionButtonText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
                <IconSymbol
                  ios_icon_name="message.fill"
                  android_material_icon_name="message"
                  size={24}
                  color={colors.white}
                />
                <Text style={styles.actionButtonText}>Message</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Zodiac Sign</Text>
              <Text style={styles.detailValue}>{person.zodiacSign}</Text>
            </View>
            {person.favoriteColor && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Favorite Color</Text>
                <Text style={styles.detailValue}>{person.favoriteColor}</Text>
              </View>
            )}
            {person.favoriteFoodType && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Favorite Food</Text>
                <Text style={styles.detailValue}>{person.favoriteFoodType}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Relationship Type</Text>
              <Text style={styles.detailValue}>
                {person.relationshipType === 'other'
                  ? person.customRelationshipType
                  : person.relationshipType.charAt(0).toUpperCase() +
                    person.relationshipType.slice(1)}
              </Text>
            </View>
          </View>

          {(person.redFlags.length > 0 || person.greenFlags.length > 0) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Flags</Text>
              {person.redFlags.length > 0 && (
                <View style={styles.flagsSection}>
                  <Text style={styles.flagsTitle}>🚩 Red Flags</Text>
                  {person.redFlags.map((flag) => (
                    <View key={flag.id} style={[styles.flagItem, { backgroundColor: colors.highlight }]}>
                      <Text style={styles.flagText}>{flag.text}</Text>
                    </View>
                  ))}
                </View>
              )}
              {person.greenFlags.length > 0 && (
                <View style={styles.flagsSection}>
                  <Text style={styles.flagsTitle}>✅ Green Flags</Text>
                  {person.greenFlags.map((flag) => (
                    <View key={flag.id} style={[styles.flagItem, { backgroundColor: colors.primary }]}>
                      <Text style={styles.flagText}>{flag.text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {person.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{person.notes}</Text>
            </View>
          )}

          {(person.instagram || person.twitter || person.facebook || person.snapchat) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Social Media</Text>
              {person.instagram && (
                <View style={styles.socialRow}>
                  <Text style={styles.socialLabel}>Instagram:</Text>
                  <Text style={styles.socialValue}>{person.instagram}</Text>
                </View>
              )}
              {person.twitter && (
                <View style={styles.socialRow}>
                  <Text style={styles.socialLabel}>Twitter:</Text>
                  <Text style={styles.socialValue}>{person.twitter}</Text>
                </View>
              )}
              {person.facebook && (
                <View style={styles.socialRow}>
                  <Text style={styles.socialLabel}>Facebook:</Text>
                  <Text style={styles.socialValue}>{person.facebook}</Text>
                </View>
              )}
              {person.snapchat && (
                <View style={styles.socialRow}>
                  <Text style={styles.socialLabel}>Snapchat:</Text>
                  <Text style={styles.socialValue}>{person.snapchat}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.dangerZone}>
            <TouchableOpacity style={styles.benchButton} onPress={handleToggleBench}>
              <IconSymbol
                ios_icon_name={isOnBench ? 'play.fill' : 'pause.fill'}
                android_material_icon_name={isOnBench ? 'play-arrow' : 'pause'}
                size={20}
                color={colors.text}
              />
              <Text style={styles.benchButtonText}>
                {isOnBench ? 'Move to Roster' : 'Move to Bench'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <IconSymbol
                ios_icon_name="trash.fill"
                android_material_icon_name="delete"
                size={20}
                color={colors.white}
              />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
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
    paddingBottom: 40,
  },
  photoContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    position: 'relative',
  },
  photo: {
    width: 200,
    height: 266,
    borderRadius: 20,
  },
  photoPlaceholder: {
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  interestBadge: {
    position: 'absolute',
    top: 32,
    right: '50%',
    transform: [{ translateX: 110 }],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  interestBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  info: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  flagsSection: {
    marginBottom: 16,
  },
  flagsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  flagItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  flagText: {
    fontSize: 14,
    color: colors.white,
  },
  notesText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  socialRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  socialLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    width: 100,
  },
  socialValue: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  dangerZone: {
    paddingHorizontal: 20,
    gap: 12,
  },
  benchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  benchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.highlight,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
});
