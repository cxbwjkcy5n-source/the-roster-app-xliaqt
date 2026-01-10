
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';

export default function BenchScreen() {
  const router = useRouter();
  const { bench } = useRoster();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#D32F2F', '#C62828']} style={styles.header}>
        <Text style={styles.headerTitle}>The Bench</Text>
        <Text style={styles.headerSubtitle}>Paused connections</Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {bench.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="pause.circle"
              android_material_icon_name="pause-circle-outline"
              size={64}
              color={colors.grey}
            />
            <Text style={styles.emptyText}>No one on the bench</Text>
            <Text style={styles.emptySubtext}>
              People you pause will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {bench.map(person => (
              <TouchableOpacity
                key={person.id}
                style={styles.personCard}
                onPress={() => router.push(`/person/${person.id}` as any)}
              >
                <View style={styles.cardImageContainer}>
                  {person.imageUrl ? (
                    <Image source={{ uri: person.imageUrl }} style={styles.cardImage} />
                  ) : (
                    <View style={[styles.cardImage, styles.placeholderImage]}>
                      <IconSymbol
                        ios_icon_name="person.fill"
                        android_material_icon_name="person"
                        size={48}
                        color={colors.grey}
                      />
                    </View>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.cardGradient}
                  >
                    <Text style={styles.cardName}>{person.name}</Text>
                    <Text style={styles.cardInfo}>
                      {person.age} • {person.location}
                    </Text>
                    {person.benchReason && (
                      <View style={styles.reasonBadge}>
                        <Text style={styles.reasonText} numberOfLines={2}>{person.benchReason}</Text>
                      </View>
                    )}
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.grey,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  personCard: {
    width: '48%',
    aspectRatio: 0.75,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
    marginBottom: 16,
  },
  cardImageContainer: {
    flex: 1,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  cardInfo: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  reasonBadge: {
    marginTop: 6,
    backgroundColor: 'rgba(211, 47, 47, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reasonText: {
    fontSize: 10,
    color: '#fff',
    fontStyle: 'italic',
  },
});
