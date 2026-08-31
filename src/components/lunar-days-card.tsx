import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { EventCard } from '@/components/event-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  CATEGORY_LABELS,
  CURRENT_YEAR,
  CURRENT_YEAR_MONTH,
  formatEventDate,
  GENERAL_DEITY_ID,
  getEventsByYearMonth,
  getGeneralCategories,
  getGeneralEvents,
  getUpcomingGeneralEvents,
  relativeDayLabel,
  type DeityEvent,
  type EventCategory,
} from '@/data/events';
import { useTheme } from '@/hooks/use-theme';
import { CATEGORY_STYLE } from '@/lib/category-style';
import { areRemindersEnabled, enableReminders, isTopicFollowed, setTopicFollowed } from '@/lib/notifications';

// Amavasai (new moon) and Pournami (full moon) happen every lunar month
// regardless of which deities someone follows, so - unlike the rest of
// Home, which is scoped to followed deities - this card always shows. Only
// the next occurrence of each is visible by default; the full 2026-2035
// coverage stays a tap away (see `expanded`), same "current year first"
// treatment as the Calendar and deity screens.
export function LunarDaysCard() {
  const theme = useTheme();
  const [followed, setFollowed] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState(false);
  const [showAllYears, setShowAllYears] = useState(false);
  const [busy, setBusy] = useState(false);

  const categories = useMemo(() => getGeneralCategories(), []);

  const refresh = useCallback(async () => {
    const entries = await Promise.all(categories.map(async (c) => [c, await isTopicFollowed(GENERAL_DEITY_ID, c)] as const));
    setFollowed(Object.fromEntries(entries));
  }, [categories]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const nextByCategory = useMemo(() => {
    const upcoming = getUpcomingGeneralEvents();
    const map: Partial<Record<EventCategory, DeityEvent>> = {};
    for (const e of upcoming) {
      if (!map[e.category]) map[e.category] = e;
    }
    return map;
  }, []);

  const allGroups = useMemo(() => getEventsByYearMonth(getGeneralEvents()), []);
  const visibleGroups = showAllYears
    ? allGroups
    : allGroups.filter((g) => g.key.startsWith(String(CURRENT_YEAR)) && g.key >= CURRENT_YEAR_MONTH);
  const hiddenCount = allGroups.length - visibleGroups.length;

  const toggleFollow = async (category: EventCategory) => {
    if (busy) return;
    setBusy(true);
    try {
      const next = !followed[category];
      if (next && !(await areRemindersEnabled())) await enableReminders();
      await setTopicFollowed(GENERAL_DEITY_ID, category, next);
      setFollowed((f) => ({ ...f, [category]: next }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.secondary }]}>
      <ThemedView type="backgroundElement" style={styles.headingRow}>
        <ThemedText type="smallBold">🌕 Amavasai &amp; Pournami 🌚</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Every month, for everyone
        </ThemedText>
      </ThemedView>

      {categories.map((category) => {
        const next = nextByCategory[category];
        const { colorKey, icon } = CATEGORY_STYLE[category];
        const on = !!followed[category];
        return (
          <ThemedView key={category} type="backgroundElement" style={styles.row}>
            <ThemedView type="backgroundElement" style={styles.rowText}>
              <ThemedText type="small">
                {icon}{' '}
                {next
                  ? `Next ${next.name}: ${formatEventDate(next.date).split(',').slice(0, 2).join(',')}`
                  : `No upcoming ${CATEGORY_LABELS[category]}`}
              </ThemedText>
              {next && (
                <ThemedText type="small" themeColor="textSecondary">
                  {relativeDayLabel(next.date)}
                </ThemedText>
              )}
            </ThemedView>
            <Pressable onPress={() => toggleFollow(category)} disabled={busy} accessibilityRole="button">
              <ThemedView
                type="backgroundElement"
                style={[styles.bell, { borderColor: theme[colorKey] }, on && { backgroundColor: theme[colorKey] }]}>
                <ThemedText type="small" style={on ? { color: theme.primaryText } : undefined}>
                  {on ? '🔔' : '🔕'}
                </ThemedText>
              </ThemedView>
            </Pressable>
          </ThemedView>
        );
      })}

      <Pressable onPress={() => setExpanded((v) => !v)} accessibilityRole="button">
        <ThemedText type="linkPrimary">{expanded ? '← Hide full coverage' : 'View full coverage (2026–2035) →'}</ThemedText>
      </Pressable>

      {expanded && (
        <ThemedView type="backgroundElement" style={styles.expanded}>
          {visibleGroups.map((group) => (
            <ThemedView key={group.key} type="backgroundElement" style={styles.monthGroup}>
              <ThemedText type="smallBold" themeColor="primary">
                {group.label}
              </ThemedText>
              {group.events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </ThemedView>
          ))}

          {(hiddenCount > 0 || showAllYears) && (
            <Pressable onPress={() => setShowAllYears((v) => !v)} accessibilityRole="button">
              <ThemedText type="linkPrimary">
                {showAllYears ? `← Show ${CURRENT_YEAR} only` : `Show all years (2026–2035) →`}
              </ThemedText>
            </Pressable>
          )}
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.four,
    borderWidth: 2,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  headingRow: {
    gap: Spacing.half,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expanded: {
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  monthGroup: {
    gap: Spacing.two,
  },
});
