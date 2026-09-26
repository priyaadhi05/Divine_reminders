import { useCallback, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { daysUntil, getDeityById, type DeityEvent } from '@/data/events';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { CATEGORY_STYLE } from '@/lib/category-style';
import {
  REMINDERS_SUPPORTED,
  areRemindersEnabled,
  getFollowedUpcomingEvents,
  hasNotificationPermission,
} from '@/lib/notifications';
import { ensureRemindersAllowed } from '@/lib/reminder-permission';

// Home's "Reminders are set for these events" list: one row per reminder
// the person has turned on (an event's own toggle, a deity from onboarding
// or its page, Amavasai/Pournami), showing that reminder's next date - the
// same followed-topics filter scheduling uses (see getFollowedUpcomingEvents),
// so what's listed is exactly what will notify. Sorted soonest first; the
// first few show straight away and the rest behind "Show all".
const PREVIEW_COUNT = 5;

// Monthly observances repeat, so a followed topic has many upcoming events -
// only its next one is listed.
function nextPerReminder(events: DeityEvent[]): DeityEvent[] {
  const seen = new Set<string>();
  return events.filter((e) => {
    const key = `${e.deity}:${e.category}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function UpcomingRemindersCard() {
  const theme = useTheme();
  const { t, localize, dateNoYear, relativeDay, deityName } = useTranslation();
  const [events, setEvents] = useState<DeityEvent[]>([]);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    const [next, enabled, permitted] = await Promise.all([
      getFollowedUpcomingEvents(),
      areRemindersEnabled(),
      hasNotificationPermission(),
    ]);
    return { events: nextPerReminder(next), notificationsOn: enabled && permitted };
  }, []);

  // Refreshed on focus, so coming back from an event or deity screen where a
  // reminder was just switched on or off is reflected right away.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      load().then((state) => {
        if (cancelled) return;
        setEvents(state.events);
        setNotificationsOn(state.notificationsOn);
      });
      return () => {
        cancelled = true;
      };
    }, [load])
  );

  // Reminders were chosen but notifications ended up off (permission
  // declined at onboarding, or turned off in the phone's Settings) - the one
  // place a way to turn them back on is still needed.
  const turnOnNotifications = async () => {
    setNotificationsOn(await ensureRemindersAllowed(t));
  };

  if (!REMINDERS_SUPPORTED || events.length === 0) return null;

  const shown = expanded ? events : events.slice(0, PREVIEW_COUNT);

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.accent }]}>
      <ThemedView type="backgroundElement" style={styles.heading}>
        <ThemedText type="smallBold">🔔 {t('reminders.heading')}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('reminders.subtitle')}
        </ThemedText>
      </ThemedView>

      {!notificationsOn && (
        <Pressable onPress={turnOnNotifications} accessibilityRole="button">
          <ThemedView type="backgroundSelected" style={styles.offBanner}>
            <ThemedText type="small">🔕 {t('reminders.notificationsOff')}</ThemedText>
          </ThemedView>
        </Pressable>
      )}

      {shown.map((event) => {
        const { colorKey, icon } = CATEGORY_STYLE[event.category];
        const deity = getDeityById(event.deity);
        return (
          <Pressable
            key={event.id}
            onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
            style={({ pressed }) => pressed && styles.pressed}
            accessibilityRole="button">
            <ThemedView type="backgroundElement" style={[styles.row, { borderLeftColor: theme[colorKey] }]}>
              <ThemedText style={styles.icon}>{icon}</ThemedText>
              <ThemedView type="backgroundElement" style={styles.rowText}>
                <ThemedText type="smallBold">{localize(event).name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {deity ? `${deityName(deity.id, deity.name)} · ` : ''}
                  {dateNoYear(event.date)} · {relativeDay(daysUntil(event.date))}
                </ThemedText>
              </ThemedView>
              <ThemedText style={[styles.chevron, { color: theme[colorKey] }]}>→</ThemedText>
            </ThemedView>
          </Pressable>
        );
      })}

      {events.length > PREVIEW_COUNT && (
        <Pressable onPress={() => setExpanded((v) => !v)} accessibilityRole="button">
          <ThemedText type="linkPrimary">
            {expanded ? t('reminders.showLess') : t('reminders.showAll', { count: events.length })}
          </ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  card: {
    borderRadius: Spacing.four,
    borderWidth: 2,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  heading: {
    gap: Spacing.half,
  },
  offBanner: {
    borderRadius: Spacing.two,
    padding: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
    paddingLeft: Spacing.two,
    borderLeftWidth: 3,
  },
  icon: {
    fontSize: 18,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
  chevron: {
    fontSize: 16,
    fontWeight: '700',
  },
});
