
import { colors } from '@/styles/commonStyles';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';
import { useRouter } from 'expo-router';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { RosterPerson } from '@/types/roster';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';

export default function RosterScreen() {
  const router = useRouter();
  const { roster, reorderRoster } = useRoster();
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth');
    }
  }, [user, authLoading]);

  const getInterestColor = (level: string) => {
    switch (level) {
      case 'high':
        return colors.success;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const handleDragEnd = ({ data }: { data: RosterPerson[] }) => {
    reorderRoster(data);
  };

  const renderPersonCard = ({ item, drag, isActive }: RenderItemParams<RosterPerson>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onPress={() => router.push(`/person/${item.id}`)}
          onLongPress={drag}
          disabled={isActive}
          style={[styles.personCard, isActive && styles.personCardActive]}
        >
          <View style={styles.cardImageContainer}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
            ) : (
              <View style={[styles.cardImage, styles.placeholderImage]}>
                <IconSymbol name="person" size={40} color={colors.textSecondary} />
              </View>
            )}
            <View
              style={[
                styles.interestBadge,
                { backgroundColor: getInterestColor(item.interestLevel) },
              ]}
            />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardDetails}>
              {item.age} • {item.location}
            </Text>
            <View style={styles.flagsContainer}>
              {item.redFlags && item.redFlags.length > 0 && (
                <View style={styles.flagBadge}>
                  <IconSymbol name="flag" size={12} color={colors.error} />
                  <Text style={styles.flagCount}>{item.redFlags.length}</Text>
                </View>
              )}
              {item.greenFlags && item.greenFlags.length > 0 && (
                <View style={styles.flagBadge}>
                  <IconSymbol name="flag" size={12} color={colors.success} />
                  <Text style={styles.flagCount}>{item.greenFlags.length}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <TouchableOpacity
        style={styles.ghostCard}
        onPress={() => router.push('/person/add')}
      >
        <IconSymbol name="add" size={48} color={colors.textSecondary} />
        <Text style={styles.emptyText}>Add your first person to the roster</Text>
      </TouchableOpacity>
    </View>
  );

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>THE ROSTER</Text>
            <Text style={styles.headerSubtitle}>Where You're The Coach and MVP</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowDatesModal(true)}
            >
              <IconSymbol name="calendar-today" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowAnalyticsModal(true)}
            >
              <IconSymbol name="bar-chart" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {roster.length === 0 ? (
        renderEmptyState()
      ) : (
        <DraggableFlatList
          data={roster}
          renderItem={renderPersonCard}
          keyExtractor={(item) => item.id}
          onDragEnd={handleDragEnd}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  personCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  personCardActive: {
    opacity: 0.8,
    transform: [{ scale: 1.05 }],
  },
  cardImageContainer: {
    position: 'relative',
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  interestBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  cardDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  flagsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  flagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  flagCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ghostCard: {
    width: '100%',
    maxWidth: 300,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
