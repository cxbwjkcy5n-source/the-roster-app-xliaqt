/**
 * Date reminder push notifications using expo-notifications.
 * Schedules local notifications for date reminders and inactivity checks.
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIF_IDS_PREFIX = 'date_notif_ids_';
const INACTIVITY_NOTIF_PREFIX = 'inactivity_notif_';
const INACTIVITY_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Request notification permissions. Returns true if granted. */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    console.log('[DateNotifications] Permission status:', status);
    return status === 'granted';
  } catch (err) {
    console.error('[DateNotifications] Error requesting permissions:', err);
    return false;
  }
}

/** Schedule date reminder notifications (1 hour before + exact time). */
export async function scheduleDateReminders(params: {
  dateId: string;
  personName: string;
  location: string;
  dateTimeMs: number; // Unix ms of the date
}): Promise<void> {
  if (Platform.OS === 'web') return;

  const { dateId, personName, location, dateTimeMs } = params;
  console.log('[DateNotifications] Scheduling reminders for date:', dateId, 'with', personName);

  const granted = await requestNotificationPermissions();
  if (!granted) {
    console.log('[DateNotifications] Permission not granted, skipping scheduling');
    return;
  }

  // Cancel any existing notifications for this date
  await cancelDateReminders(dateId);

  const scheduledIds: string[] = [];
  const now = Date.now();

  // 1 hour before
  const oneHourBefore = dateTimeMs - 60 * 60 * 1000;
  if (oneHourBefore > now) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Date reminder 🗓️',
          body: `You have a date with ${personName} in 1 hour at ${location}`,
          data: { dateId, type: 'date_reminder' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(oneHourBefore) },
      });
      scheduledIds.push(id);
      console.log('[DateNotifications] Scheduled 1-hour reminder, id:', id);
    } catch (err) {
      console.error('[DateNotifications] Error scheduling 1-hour reminder:', err);
    }
  }

  // Exact date/time
  if (dateTimeMs > now) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "It's date time! 💫",
          body: `Your date with ${personName} starts now!`,
          data: { dateId, type: 'date_start' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(dateTimeMs) },
      });
      scheduledIds.push(id);
      console.log('[DateNotifications] Scheduled exact-time reminder, id:', id);
    } catch (err) {
      console.error('[DateNotifications] Error scheduling exact-time reminder:', err);
    }
  }

  if (scheduledIds.length > 0) {
    await AsyncStorage.setItem(
      `${NOTIF_IDS_PREFIX}${dateId}`,
      JSON.stringify(scheduledIds)
    );
    console.log('[DateNotifications] Stored', scheduledIds.length, 'notification IDs for date:', dateId);
  }
}

/** Cancel all scheduled notifications for a date. */
export async function cancelDateReminders(dateId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const raw = await AsyncStorage.getItem(`${NOTIF_IDS_PREFIX}${dateId}`);
    if (raw) {
      const ids: string[] = JSON.parse(raw);
      await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id)));
      await AsyncStorage.removeItem(`${NOTIF_IDS_PREFIX}${dateId}`);
      console.log('[DateNotifications] Cancelled', ids.length, 'notifications for date:', dateId);
    }
  } catch (err) {
    console.error('[DateNotifications] Error cancelling date reminders:', err);
  }
}

/** Schedule an inactivity notification for a person (fires immediately). */
export async function scheduleInactivityNotification(params: {
  personId: string;
  personName: string;
}): Promise<void> {
  if (Platform.OS === 'web') return;

  const { personId, personName } = params;
  const storageKey = `${INACTIVITY_NOTIF_PREFIX}${personId}`;

  // Check cooldown — don't re-notify within 1 week
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    if (raw) {
      const { timestamp } = JSON.parse(raw);
      if (Date.now() - timestamp < INACTIVITY_COOLDOWN_MS) {
        console.log('[DateNotifications] Inactivity notif on cooldown for:', personName);
        return;
      }
    }
  } catch {
    // ignore parse errors
  }

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  try {
    console.log('[DateNotifications] Scheduling inactivity notification for:', personName);
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Haven't heard from ${personName}? 👀`,
        body: `You haven't spoken to ${personName} in 2 weeks. Move them to the bench?`,
        data: { personId, type: 'inactivity', action: 'move_to_bench' },
        categoryIdentifier: 'inactivity_check',
      },
      trigger: null, // fire immediately
    });

    await AsyncStorage.setItem(storageKey, JSON.stringify({ timestamp: Date.now(), notifId: id }));
    console.log('[DateNotifications] Inactivity notification scheduled, id:', id, 'for:', personName);
  } catch (err) {
    console.error('[DateNotifications] Error scheduling inactivity notification:', err);
  }
}

/** Clear the inactivity notification record for a person (e.g. after they're moved to bench). */
export async function clearInactivityRecord(personId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${INACTIVITY_NOTIF_PREFIX}${personId}`);
  } catch {
    // ignore
  }
}
