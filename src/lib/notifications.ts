import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  DEITIES,
  GENERAL_DEITY_ID,
  getCategoriesForDeity,
  getDeityById,
  getGeneralCategories,
  getUpcomingEvents,
  type DeityEvent,
} from '@/data/events';
import { getContent } from '@/lib/i18n/content';
import { DEFAULT_LANGUAGE_ID } from '@/lib/i18n/languages';
import { messageContext } from '@/lib/share-greeting';

// Local (on-device) reminders only - no push server, no account, no cost.
// Not supported on web (expo-notifications has no web implementation), so
// every reminder control is hidden there rather than shown doing nothing.
export const REMINDERS_SUPPORTED = Platform.OS !== 'web';
const SUPPORTED = REMINDERS_SUPPORTED;

const ENABLED_KEY = 'divine-calendar:reminders-enabled';
const FOLLOWED_TOPICS_KEY = 'divine-calendar:followed-topics';
const LEAD_DAYS_KEY = 'divine-calendar:reminder-lead-days';
const ONBOARDED_KEY = 'divine-calendar:onboarded';
const LANGUAGE_KEY = 'divine-calendar:selected-language'; // written by LanguageProvider
const NOTIFICATION_PREFIX = 'divine-calendar-reminder-';
const CHANNEL_ID = 'divine-calendar-reminders';
const REMINDER_HOUR = 9; // fires at 9am local device time on each countdown day

// The countdown per followed event: a heads-up 3 days out, again at 2 days,
// and a final nudge the day before. Every followed topic gets this by
// default, but it's customizable per topic (see "Lead days" below) - e.g.
// someone can want the full countdown for Thaipusam but just a single
// day-before nudge for a monthly Pradosham. Either way this is the app's
// whole reminder mechanism - never a calendar entry, always a notification.
const DEFAULT_LEAD_DAYS: readonly number[] = [3, 2, 1];

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

// Notification title/body for the 3-day / 2-day / 1-day / today countdown,
// in the selected language (see each lib/i18n/content/<lang>.ts). Each lead
// day gets its own wording rather than reusing one template with only the
// day count swapped in, so a followed topic's three nudges read as a
// build-up rather than the same line repeated three times, e.g.:
//   3 days: "🦚 Murugan's special day is in 3 days" / "Thaipusam is coming
//     up on Feb 1 - a good time to start planning. 🙏"
//   1 day:  "🦚 Murugan's special day is tomorrow" / "Tomorrow is Thaipusam -
//     take a moment tonight to prepare your heart. 🙏"
//   Today:  "🦚 Today is Thaipusam" / "May Lord Murugan bless you and your
//     family with strength, wisdom and grace. 🙏"
// Events with no single owning deity (e.g. the monthly Amavasai/Pournami)
// get their own neutral phrasing instead of falling back to deity wording.
export function notificationTitle(event: DeityEvent, daysBefore: number, languageId: string = DEFAULT_LANGUAGE_ID): string {
  return getContent(languageId).notificationTitle(messageContext(event, languageId), daysBefore);
}

export function notificationBody(event: DeityEvent, daysBefore: number, languageId: string = DEFAULT_LANGUAGE_ID): string {
  return getContent(languageId).notificationBody(messageContext(event, languageId), daysBefore);
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
  return [
    ...DEITIES.flatMap((d) => getCategoriesForDeity(d.id).map((c) => topicKey(d.id, c))),
    ...getGeneralCategories().map((c) => topicKey(GENERAL_DEITY_ID, c)),
  ];
}

export async function getFollowedTopics(): Promise<Set<string>> {
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
// Onboarding's "Save my deities": the whole deity selection in one write
// (and one reschedule). General topics like Amavasai/Pournami are left as
// they are.
export async function setFollowedDeities(deityIds: Set<string>): Promise<void> {
  const topics = await getFollowedTopics();
  for (const deity of DEITIES) {
    for (const category of getCategoriesForDeity(deity.id)) {
      if (deityIds.has(deity.id)) topics.add(topicKey(deity.id, category));
      else topics.delete(topicKey(deity.id, category));
    }
  }
  await saveFollowedTopics(topics);
}

export async function setDeityFollowed(deityId: string, follow: boolean): Promise<void> {
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
  await saveFollowedTopics(new Set(allTopics()));
}

export async function unfollowEverything(): Promise<void> {
  await saveFollowedTopics(new Set());
}

// Every deity the user follows at least one topic for, in the app's stable
// deity order - drives the Home screen's list of deity cards.
export async function getFollowedDeities(): Promise<typeof DEITIES> {
  const followed = await getFollowedTopics();
  const followedDeityIds = new Set(Array.from(followed).map((t) => t.split(':')[0]));
  return DEITIES.filter((d) => followedDeityIds.has(d.id));
}

// --- Lead-day preferences ------------------------------------------------
//
// How many days before a followed topic's date each nudge fires, e.g. [3, 2,
// 1] for the full countdown or just [1] for a single day-before nudge.
// Customizable per topic (deity + category) - the same granularity following
// already works at - via the deity page's NotifyPanel and an event's own
// "Set reminder" control. Topics with no explicit choice get
// DEFAULT_LEAD_DAYS, so following something new just works without an extra
// setup step.

async function getLeadDaysMap(): Promise<Record<string, number[]>> {
  const raw = await AsyncStorage.getItem(LEAD_DAYS_KEY);
  if (raw === null) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function getTopicLeadDays(deityId: string, category: string): Promise<number[]> {
  const map = await getLeadDaysMap();
  return map[topicKey(deityId, category)] ?? [...DEFAULT_LEAD_DAYS];
}

export async function setTopicLeadDays(deityId: string, category: string, days: number[]): Promise<void> {
  if (days.length === 0) return; // a topic must keep at least one nudge - see LeadDaysRow
  const map = await getLeadDaysMap();
  map[topicKey(deityId, category)] = [...days].sort((a, b) => b - a);
  await AsyncStorage.setItem(LEAD_DAYS_KEY, JSON.stringify(map));
  await scheduleUpcomingReminders();
}

// --- Scheduling ----------------------------------------------------------

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Deiva Dinam reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

// Requests OS permission and, if granted, schedules the upcoming window and
// persists the on/off preference. Returns whether reminders ended up enabled
// (the caller uses this to reflect the real permission outcome in the UI).
export async function hasNotificationPermission(): Promise<boolean> {
  if (!SUPPORTED) return false;
  return (await Notifications.getPermissionsAsync()).granted;
}

export async function enableReminders(): Promise<boolean> {
  if (!SUPPORTED) return false;

  // Android 13+ only shows the permission prompt once a notification channel
  // exists, so create it before asking.
  await ensureChannel();
  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;
  if (!granted) {
    const requested = await Notifications.requestPermissionsAsync();
    granted = requested.granted;
  }

  await AsyncStorage.setItem(ENABLED_KEY, String(granted));
  if (granted) await scheduleUpcomingReminders();
  return granted;
}

export async function disableReminders(): Promise<void> {
  if (!SUPPORTED) return;
  await AsyncStorage.setItem(ENABLED_KEY, 'false');
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Re-syncs the rolling window of scheduled reminders for every followed
// topic's upcoming events, each getting whichever countdown that topic's
// lead-day preference calls for (see getTopicLeadDays). Cheap enough to just
// cancel-and-reschedule outright rather than diffing; call this on app
// launch/foreground and whenever a follow preference or lead-day choice
// changes.
// Runs are chained one after another: launch, a language change and several
// follow toggles can all ask at once, and two overlapping cancel-and-reschedule
// passes could otherwise interleave and leave stale reminders behind.
let scheduling: Promise<void> = Promise.resolve();

export function scheduleUpcomingReminders(): Promise<void> {
  scheduling = scheduling.then(rescheduleAll).catch((err) => console.warn('scheduling reminders failed', err));
  return scheduling;
}

async function rescheduleAll(): Promise<void> {
  if (!SUPPORTED) return;
  if (!(await areRemindersEnabled())) return;

  await Notifications.cancelAllScheduledNotificationsAsync();
  await ensureChannel();

  const followed = await getFollowedTopics();
  const leadDaysMap = await getLeadDaysMap();
  const languageId = (await AsyncStorage.getItem(LANGUAGE_KEY)) ?? DEFAULT_LANGUAGE_ID;
  const upcoming = getUpcomingEvents()
    .filter((e) => followed.has(topicKey(e.deity, e.category)))
    .slice(0, MAX_SCHEDULED_EVENTS);

  for (const event of upcoming) {
    const [y, m, d] = event.date.split('-').map(Number);
    const leadDays = leadDaysMap[topicKey(event.deity, event.category)] ?? DEFAULT_LEAD_DAYS;

    for (const daysBefore of leadDays) {
      const fireDate = new Date(y, m - 1, d, REMINDER_HOUR, 0, 0); // device-local time
      fireDate.setDate(fireDate.getDate() - daysBefore);
      if (fireDate.getTime() <= Date.now()) continue;

      await Notifications.scheduleNotificationAsync({
        identifier: `${NOTIFICATION_PREFIX}${event.id}-${daysBefore}d`,
        content: {
          title: notificationTitle(event, daysBefore, languageId),
          body: notificationBody(event, daysBefore, languageId),
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
