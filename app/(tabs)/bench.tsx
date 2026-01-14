
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gradients } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 64) / 2; // Two cards per row with padding

export default function BenchScreen() {
  const router = useRouter();
  const { bench } = useRoster();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Bench Header - Red Gradient */}
      <LinearGradient colors={gradients.benchRed} style={styles.header}>
        <Text style={styles.headerTitle}>THE BENCH</Text>
        <Text style={styles.headerSubtitle}>Paused connections</Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {bench.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="pause.circle"
              android_material_icon_name="pause-circle-outline"
              size={72}
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
                onPress={() => {
                  console.log('[Bench] User tapped person card:', person.name);
                  router.push(`/person/${person.id}` as any);
                }}
                activeOpacity={0.9}
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
                    colors={['transparent', 'rgba(0,0,0,0.85)']}
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
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.white,
    opacity: 0.95,
    marginTop: 6,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 120,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.darkText,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 15,
    color: colors.grey,
    marginTop: 8,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  personCard: {
    width: CARD_WIDTH,
    aspectRatio: 0.7,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.benchCardOutline,
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
    backgroundColor: colors.backgroundAlt,
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
    fontWeight: '800',
    color: colors.white,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardInfo: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.95,
    fontWeight: '600',
  },
  reasonBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(233, 36, 63, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reasonText: {
    fontSize: 11,
    color: colors.white,
    fontStyle: 'italic',
    fontWeight: '600',
  },
});
