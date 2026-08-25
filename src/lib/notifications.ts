import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { DEITIES, getDeityById, getUpcomingEvents, type DeityEvent } from '@/data/events';

// Local (on-device) reminders only - no push server, no account, no cost.
// Not supported on web (expo-notifications has no web implementation).
const SUPPORTED = Platform.OS !== 'web';

const ENABLED_KEY = 'divine-calendar:reminders-enabled';
const FOLLOWED_KEY = 'divine-calendar:followed-deities';
const NOTIFICATION_PREFIX = 'divine-calendar-reminder-';
const CHANNEL_ID = 'divine-calendar-reminders';
const REMINDER_HOUR = 9; // fires at 9am local device time on each countdown day

// A fixed countdown per followed event: a heads-up 3 days out, then 2, then a
// final one the day before - never on the day itself, and never added to any
// calendar. This is the app's whole reminder mechanism.
const LEAD_DAYS = [3, 2, 1] as const;

// iOS caps pending local notifications at ~64. Each followed event now
// produces up to 3 notifications, so keep well under that: 18 events * 3 =
// 54. The window is refreshed (see scheduleUpcomingReminders) every time the
// app opens or a follow preference changes, so events sliding into range
// keep getting picked up.
const MAX_SCHEDULED_EVENTS = 18;

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

function daysUntilLabel(daysBefore: number): string {
  return daysBefore === 1 ? '1 day to go' : `${daysBefore} days to go`;
}

// First-person countdown line, voiced as whichever deity the event belongs
// to - used both as the notification body and (for the nearest event) the
// companion card's spoken line.
export function reminderLine(event: DeityEvent, daysBefore?: number): string {
  const deity = getDeityById(event.deity);
  const greeting = deity?.greeting ?? 'Vel Vel!';
  const speaker = deity?.name ?? 'the divine calendar';
  const when =
    daysBefore === undefined
      ? `on ${new Date(`${event.date}T00:00:00Z`).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          timeZone: 'UTC',
        })}`
      : daysBefore === 1
        ? 'tomorrow'
        : `in ${daysBefore} days`;
  return `${greeting} I'm ${speaker}, reminding you - ${event.name} (${event.tamilName}) is ${when}. ${event.significance}`;
}

export async function areRemindersEnabled(): Promise<boolean> {
  if (!SUPPORTED) return false;
  return (await AsyncStorage.getItem(ENABLED_KEY)) === 'true';
}

// Which deities the user wants notified about. Defaults to "all of them" the
// first time (before the user has ever touched a follow toggle), so turning
// on reminders behaves sensibly out of the box.
export async function getFollowedDeities(): Promise<string[]> {
  if (!SUPPORTED) return [];
  const raw = await AsyncStorage.getItem(FOLLOWED_KEY);
  if (raw === null) return DEITIES.map((d) => d.id);
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEITIES.map((d) => d.id);
  } catch {
    return DEITIES.map((d) => d.id);
  }
}

export async function isDeityFollowed(deityId: string): Promise<boolean> {
  return (await getFollowedDeities()).includes(deityId);
}

export async function setDeityFollowed(deityId: string, follow: boolean): Promise<void> {
  if (!SUPPORTED) return;
  const current = new Set(await getFollowedDeities());
  if (follow) current.add(deityId);
  else current.delete(deityId);
  await AsyncStorage.setItem(FOLLOWED_KEY, JSON.stringify(Array.from(current)));
  await scheduleUpcomingReminders();
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

  await AsyncStorage.setItem(ENABLED_KEY, String(granted));
  if (granted) {
    await ensureChannel();
    await scheduleUpcomingReminders();
  }
  return granted;
}

export async function disableReminders(): Promise<void> {
  if (!SUPPORTED) return;
  await AsyncStorage.setItem(ENABLED_KEY, 'false');
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Re-syncs the rolling window of scheduled reminders for every followed
// deity's upcoming events, each getting its 3/2/1-day-before countdown.
// Cheap enough to just cancel-and-reschedule outright rather than diffing;
// call this on app launch/foreground and whenever a follow toggle changes.
export async function scheduleUpcomingReminders(): Promise<void> {
  if (!SUPPORTED) return;
  if (!(await areRemindersEnabled())) return;

  await Notifications.cancelAllScheduledNotificationsAsync();
  await ensureChannel();

  const followed = await getFollowedDeities();
  const upcoming = getUpcomingEvents()
    .filter((e) => followed.includes(e.deity))
    .slice(0, MAX_SCHEDULED_EVENTS);

  for (const event of upcoming) {
    const [y, m, d] = event.date.split('-').map(Number);

    for (const daysBefore of LEAD_DAYS) {
      const fireDate = new Date(y, m - 1, d, REMINDER_HOUR, 0, 0); // device-local time
      fireDate.setDate(fireDate.getDate() - daysBefore);
      if (fireDate.getTime() <= Date.now()) continue;

      await Notifications.scheduleNotificationAsync({
        identifier: `${NOTIFICATION_PREFIX}${event.id}-${daysBefore}d`,
        content: {
          title: `${event.name} · ${daysUntilLabel(daysBefore)}`,
          body: reminderLine(event, daysBefore),
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
}

export function getNotificationEventId(response: Notifications.NotificationResponse): string | undefined {
  const data = response.notification.request.content.data;
  return typeof data?.eventId === 'string' ? data.eventId : undefined;
}
