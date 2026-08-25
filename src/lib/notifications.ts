import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { DEITIES, getCategoriesForDeity, getDeityById, getUpcomingEvents, type DeityEvent } from '@/data/events';

// Local (on-device) reminders only - no push server, no account, no cost.
// Not supported on web (expo-notifications has no web implementation).
const SUPPORTED = Platform.OS !== 'web';

const ENABLED_KEY = 'divine-calendar:reminders-enabled';
const FOLLOWED_TOPICS_KEY = 'divine-calendar:followed-topics';
const ONBOARDED_KEY = 'divine-calendar:onboarded';
const REMINDER_STYLE_KEY = 'divine-calendar:reminder-style';
const NOTIFICATION_PREFIX = 'divine-calendar-reminder-';
const CHANNEL_ID = 'divine-calendar-reminders';
const REMINDER_HOUR = 9; // fires at 9am local device time on each countdown day

// The "full" countdown per followed event: a heads-up 3 days out, a nudge
// the day before, and a blessing on the day itself. "Quiet" style (chosen at
// onboarding) drops the two heads-ups and keeps just the day-of blessing.
// Either way this is the app's whole reminder mechanism - never a calendar
// entry, always a notification.
const FULL_LEAD_DAYS = [3, 1, 0] as const;
const QUIET_LEAD_DAYS = [0] as const;

export type ReminderStyle = 'full' | 'quiet';

export async function getReminderStyle(): Promise<ReminderStyle> {
  if (!SUPPORTED) return 'full';
  const raw = await AsyncStorage.getItem(REMINDER_STYLE_KEY);
  return raw === 'quiet' ? 'quiet' : 'full';
}

export async function setReminderStyle(style: ReminderStyle): Promise<void> {
  if (!SUPPORTED) return;
  await AsyncStorage.setItem(REMINDER_STYLE_KEY, style);
  await scheduleUpcomingReminders();
}

// --- Onboarding ------------------------------------------------------------

export async function hasOnboarded(): Promise<boolean> {
  if (!SUPPORTED) return true; // nothing to gate on web - reminders are inert there anyway
  return (await AsyncStorage.getItem(ONBOARDED_KEY)) === 'true';
}

export async function markOnboarded(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
}

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

// Notification title/body for the 3-day / 1-day / today countdown, e.g.:
//   "🦚 Murugan's special day is in 3 days" / "Prepare your heart for
//   Thaipusam 🙏\n\nSee the significance →"
//   "🦚 Today is Thaipusam" / "May Lord Murugan bless you and your family
//   with strength, wisdom and grace. 🙏"
export function notificationTitle(event: DeityEvent, daysBefore: number): string {
  const deity = getDeityById(event.deity);
  const symbol = deity?.symbol ?? '🪔';
  const speaker = deity?.name ?? 'the divine calendar';
  if (daysBefore === 0) return `${symbol} Today is ${event.name}`;
  if (daysBefore === 1) return `${symbol} ${speaker}'s special day is tomorrow`;
  return `${symbol} ${speaker}'s special day is in ${daysBefore} days`;
}

export function notificationBody(event: DeityEvent, daysBefore: number): string {
  const deity = getDeityById(event.deity);
  const speaker = deity?.name ?? 'the divine calendar';
  const honorific = deity?.honorific ?? 'Lord';
  if (daysBefore === 0) {
    return `May ${honorific} ${speaker} bless you and your family with strength, wisdom and grace. 🙏`;
  }
  return `Prepare your heart for ${event.name} 🙏\n\nSee the significance →`;
}

// First-person countdown line, voiced as whichever deity the event belongs
// to - used for the home companion card's spoken (TTS) line.
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

// --- Follow preferences ------------------------------------------------
//
// Three tiers of granularity, all backed by one flat set of "topics"
// (`${deityId}:${category}` strings) so scheduling only ever needs one
// membership check:
//   - Everything:   every topic across every deity (followEverything)
//   - A whole deity: every topic for that one deity (setDeityFollowed)
//   - One category:  a single (deity, category) pair (setTopicFollowed) -
//     e.g. "only Pradosham", "only Valarpirai Sashti"
// Defaults to nothing followed until onboarding (src/app/onboarding.tsx)
// sets the user's chosen deities - "Your Sacred Days" is meant to be
// personalized, not everything at once.

function topicKey(deityId: string, category: string): string {
  return `${deityId}:${category}`;
}

function allTopics(): string[] {
  return DEITIES.flatMap((d) => getCategoriesForDeity(d.id).map((c) => topicKey(d.id, c)));
}

export async function getFollowedTopics(): Promise<Set<string>> {
  if (!SUPPORTED) return new Set();
  const raw = await AsyncStorage.getItem(FOLLOWED_TOPICS_KEY);
  if (raw === null) return new Set();
  try {
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

async function saveFollowedTopics(topics: Set<string>): Promise<void> {
  await AsyncStorage.setItem(FOLLOWED_TOPICS_KEY, JSON.stringify(Array.from(topics)));
  await scheduleUpcomingReminders();
}

export async function isTopicFollowed(deityId: string, category: string): Promise<boolean> {
  return (await getFollowedTopics()).has(topicKey(deityId, category));
}

// The personalized "Your Sacred Days" feed - upcoming events restricted to
// whatever the user actually follows, exactly the same filter scheduling
// uses, so what's shown on Home always matches what will actually notify.
export async function getFollowedUpcomingEvents(limit?: number): Promise<DeityEvent[]> {
  const followed = await getFollowedTopics();
  const upcoming = getUpcomingEvents().filter((e) => followed.has(topicKey(e.deity, e.category)));
  return limit ? upcoming.slice(0, limit) : upcoming;
}

export async function setTopicFollowed(deityId: string, category: string, follow: boolean): Promise<void> {
  if (!SUPPORTED) return;
  const topics = await getFollowedTopics();
  if (follow) topics.add(topicKey(deityId, category));
  else topics.delete(topicKey(deityId, category));
  await saveFollowedTopics(topics);
}

export type DeityFollowState = 'all' | 'some' | 'none';

export async function getDeityFollowState(deityId: string): Promise<DeityFollowState> {
  const categories = getCategoriesForDeity(deityId);
  if (categories.length === 0) return 'none';
  const followed = await getFollowedTopics();
  const count = categories.filter((c) => followed.has(topicKey(deityId, c))).length;
  if (count === 0) return 'none';
  if (count === categories.length) return 'all';
  return 'some';
}

// Bulk follow/unfollow every category for one deity at once - the "notify me
// for all of Shiva" toggle.
export async function setDeityFollowed(deityId: string, follow: boolean): Promise<void> {
  if (!SUPPORTED) return;
  const topics = await getFollowedTopics();
  for (const category of getCategoriesForDeity(deityId)) {
    if (follow) topics.add(topicKey(deityId, category));
    else topics.delete(topicKey(deityId, category));
  }
  await saveFollowedTopics(topics);
}

export async function isEverythingFollowed(): Promise<boolean> {
  const all = allTopics();
  const followed = await getFollowedTopics();
  return all.length > 0 && all.every((t) => followed.has(t));
}

export async function followEverything(): Promise<void> {
  if (!SUPPORTED) return;
  await saveFollowedTopics(new Set(allTopics()));
}

export async function unfollowEverything(): Promise<void> {
  if (!SUPPORTED) return;
  await saveFollowedTopics(new Set());
}

// --- Scheduling ----------------------------------------------------------

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
// topic's upcoming events, each getting the countdown its reminder style
// calls for (full 3/1/0-day, or just the day-of blessing for "quiet").
// Cheap enough to just cancel-and-reschedule outright rather than diffing;
// call this on app launch/foreground and whenever a follow preference or
// style changes.
export async function scheduleUpcomingReminders(): Promise<void> {
  if (!SUPPORTED) return;
  if (!(await areRemindersEnabled())) return;

  await Notifications.cancelAllScheduledNotificationsAsync();
  await ensureChannel();

  const followed = await getFollowedTopics();
  const leadDays = (await getReminderStyle()) === 'quiet' ? QUIET_LEAD_DAYS : FULL_LEAD_DAYS;
  const upcoming = getUpcomingEvents()
    .filter((e) => followed.has(topicKey(e.deity, e.category)))
    .slice(0, MAX_SCHEDULED_EVENTS);

  for (const event of upcoming) {
    const [y, m, d] = event.date.split('-').map(Number);

    for (const daysBefore of leadDays) {
      const fireDate = new Date(y, m - 1, d, REMINDER_HOUR, 0, 0); // device-local time
      fireDate.setDate(fireDate.getDate() - daysBefore);
      if (fireDate.getTime() <= Date.now()) continue;

      await Notifications.scheduleNotificationAsync({
        identifier: `${NOTIFICATION_PREFIX}${event.id}-${daysBefore}d`,
        content: {
          title: notificationTitle(event, daysBefore),
          body: notificationBody(event, daysBefore),
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
