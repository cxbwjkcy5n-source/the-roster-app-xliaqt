
import React, { useState, useEffect } from 'react';
import { colors } from '@/styles/commonStyles';
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
  const { user, loading: authLoading } = useAuth();
  const { roster, reorderRoster, loading } = useRoster();
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showDatesModal, setShowDatesModal] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('[RosterScreen] No user authenticated, redirecting to login');
      router.replace('/auth/login');
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const getInterestColor = (level: string) => {
    switch (level?.toLowerCase()) {
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
          <Image
            source={
              item.imageUrl
                ? { uri: item.imageUrl }
                : require('@/assets/images/default-avatar.png')
            }
            style={styles.personImage}
          />
          <View
            style={[
              styles.interestBadge,
              { backgroundColor: getInterestColor(item.interestLevel) },
            ]}
          />
          <View style={styles.personOverlay}>
            <Text style={styles.personName}>{item.name}</Text>
            <Text style={styles.personDetails}>
              {item.age} • {item.location}
            </Text>
            <View style={styles.flagsContainer}>
              {item.redFlags && item.redFlags.length > 0 && (
                <View style={styles.flagBadge}>
                  <Text style={styles.flagText}>🚩 {item.redFlags.length}</Text>
                </View>
              )}
              {item.greenFlags && item.greenFlags.length > 0 && (
                <View style={[styles.flagBadge, { backgroundColor: colors.success }]}>
                  <Text style={styles.flagText}>✅ {item.greenFlags.length}</Text>
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
        <IconSymbol name="add" size={64} color={colors.textSecondary} />
        <Text style={styles.emptyText}>Add your first person to the roster</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <Text style={styles.headerTitle}>THE ROSTER</Text>
        <Text style={styles.headerSubtitle}>Where You&apos;re The Coach and MVP</Text>
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
      </LinearGradient>

      {roster.length === 0 ? (
        renderEmptyState()
      ) : (
        <DraggableFlatList
          data={roster}
          renderItem={renderPersonCard}
          keyExtractor={(item) => item.id}
          onDragEnd={handleDragEnd}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginTop: 4,
  },
  headerButtons: {
    position: 'absolute',
    right: 20,
    top: 20,
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
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  personCard: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  personCardActive: {
    opacity: 0.8,
  },
  personImage: {
    width: '100%',
    height: '100%',
  },
  interestBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  personOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  personName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  personDetails: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
  },
  flagsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  flagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.error,
  },
  flagText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  ghostCard: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
});
