import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getDeityById, getUpcomingEvents, type DeityEvent } from '@/data/events';

// Local (on-device) reminders only - no push server, no account, no cost.
// Not supported on web (expo-notifications has no web implementation).
const SUPPORTED = Platform.OS !== 'web';

const STORAGE_KEY = 'divine-calendar:reminders-enabled';
const NOTIFICATION_PREFIX = 'divine-calendar-reminder-';
const CHANNEL_ID = 'divine-calendar-reminders';
const REMINDER_HOUR = 7; // fires at 7am local device time, on the event's date

// iOS caps pending local notifications at ~64; stay well under that so
// reminders never silently stop firing near the end of the list. The window
// is refreshed (see scheduleUpcomingReminders) every time the app opens, so
// events always get scheduled once they're within range.
const MAX_SCHEDULED = 20;

if (SUPPORTED) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// First-person reminder line, "voiced" as whichever deity the event belongs
// to - short enough to read as a notification and to speak aloud via the
// companion card's text-to-speech.
export function reminderLine(event: DeityEvent): string {
  const day = new Date(`${event.date}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const deity = getDeityById(event.deity);
  const greeting = deity?.greeting ?? 'Vel Vel!';
  const speaker = deity?.name ?? 'the divine calendar';
  return `${greeting} I'm ${speaker}, reminding you - ${event.name} (${event.tamilName}) falls on ${day}. ${event.significance}`;
}

export async function areRemindersEnabled(): Promise<boolean> {
  if (!SUPPORTED) return false;
  return (await AsyncStorage.getItem(STORAGE_KEY)) === 'true';
}

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Divine Calendar reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

// Requests OS permission and, if granted, schedules the upcoming window and
// persists the on/off preference. Returns whether reminders ended up enabled
// (the caller uses this to reflect the real permission outcome in the UI).
export async function enableReminders(): Promise<boolean> {
  if (!SUPPORTED) return false;

  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;
  if (!granted) {
    const requested = await Notifications.requestPermissionsAsync();
    granted = requested.granted;
  }

  await AsyncStorage.setItem(STORAGE_KEY, String(granted));
  if (granted) {
    await ensureChannel();
    await scheduleUpcomingReminders();
  }
  return granted;
}

export async function disableReminders(): Promise<void> {
  if (!SUPPORTED) return;
  await AsyncStorage.setItem(STORAGE_KEY, 'false');
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Re-syncs the rolling window of scheduled reminders to the next
// MAX_SCHEDULED upcoming events. Cheap enough (a couple dozen items) to just
// cancel-and-reschedule outright rather than diffing; call this on app
// launch/foreground so events sliding into range keep getting picked up.
export async function scheduleUpcomingReminders(): Promise<void> {
  if (!SUPPORTED) return;
  if (!(await areRemindersEnabled())) return;

  await Notifications.cancelAllScheduledNotificationsAsync();
  await ensureChannel();

  const upcoming = getUpcomingEvents(MAX_SCHEDULED);
  for (const event of upcoming) {
    const [y, m, d] = event.date.split('-').map(Number);
    const fireDate = new Date(y, m - 1, d, REMINDER_HOUR, 0, 0); // device-local time
    if (fireDate.getTime() <= Date.now()) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: `${NOTIFICATION_PREFIX}${event.id}`,
      content: {
        title: `${event.name} · ${event.tamilName}`,
        body: reminderLine(event),
        data: { eventId: event.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
        channelId: CHANNEL_ID,
      },
    });
  }
}

export function getNotificationEventId(response: Notifications.NotificationResponse): string | undefined {
  const data = response.notification.request.content.data;
  return typeof data?.eventId === 'string' ? data.eventId : undefined;
}
