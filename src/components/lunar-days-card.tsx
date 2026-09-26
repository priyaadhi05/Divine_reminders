import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { EventCard } from '@/components/event-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  CATEGORY_LABELS,
  daysUntil,
  GENERAL_DEITY_ID,
  getGeneralCategories,
  getUpcomingGeneralEvents,
  type DeityEvent,
  type EventCategory,
} from '@/data/events';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { CATEGORY_STYLE } from '@/lib/category-style';
import { REMINDERS_SUPPORTED, isTopicFollowed, setTopicFollowed } from '@/lib/notifications';
import { ensureRemindersAllowed } from '@/lib/reminder-permission';

// Amavasai (new moon) and Pournami (full moon) happen every lunar month
// regardless of which deities someone follows, so - unlike the rest of
// Home, which is scoped to followed deities - this card always shows. Only
// the next occurrence of each is visible by default; tapping "See more
// dates" reveals a short, hand-picked list of what's coming up next rather
// than dumping the full 2026-2045 dataset onto the home screen - that full
// range is still one tap away, in the Calendar tab.
const UPCOMING_PREVIEW_COUNT = 6;

export function LunarDaysCard() {
  const theme = useTheme();
  const { t, categoryLabel, relativeDay, localize, dateNoYear } = useTranslation();
  const [followed, setFollowed] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState(false);
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

  const upcoming = useMemo(() => getUpcomingGeneralEvents(), []);

  const nextByCategory = useMemo(() => {
    const map: Partial<Record<EventCategory, DeityEvent>> = {};
    for (const e of upcoming) {
      if (!map[e.category]) map[e.category] = e;
    }
    return map;
  }, [upcoming]);

  const preview = upcoming.slice(0, UPCOMING_PREVIEW_COUNT);

  const toggleFollow = async (category: EventCategory) => {
    if (busy) return;
    setBusy(true);
    try {
      const next = !followed[category];
      if (next) {
        await ensureRemindersAllowed(t);
      }
      await setTopicFollowed(GENERAL_DEITY_ID, category, next);
      setFollowed((f) => ({ ...f, [category]: next }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.secondary }]}>
      <ThemedView type="backgroundElement" style={styles.headingRow}>
        <ThemedText type="smallBold">🌕 {t('lunar.heading')} 🌚</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('lunar.subtitle')}
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
                  ? t('lunar.next', { name: localize(next).name, date: dateNoYear(next.date) })
                  : t('lunar.noUpcoming', { category: categoryLabel(category, CATEGORY_LABELS[category]) })}
              </ThemedText>
              {next && (
                <ThemedText type="small" themeColor="textSecondary">
                  {relativeDay(daysUntil(next.date))}
                </ThemedText>
              )}
            </ThemedView>
            {REMINDERS_SUPPORTED && (
              <Pressable
                onPress={() => toggleFollow(category)}
                disabled={busy}
                accessibilityRole="button"
                accessibilityState={{ selected: on, disabled: busy }}>
                <ThemedView
                  type="backgroundElement"
                  style={[styles.enableButton, { borderColor: theme[colorKey] }, on && { backgroundColor: theme[colorKey] }]}>
                  <ThemedText
                    type="small"
                    style={on ? { color: theme.primaryText, fontWeight: '700' } : { color: theme[colorKey] }}>
                    {on ? `✓ ${t('lunar.enabled')}` : t('lunar.enable')}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            )}
          </ThemedView>
        );
      })}

      <Pressable onPress={() => setExpanded((v) => !v)} accessibilityRole="button">
        <ThemedText type="linkPrimary">{expanded ? t('lunar.showLess') : t('lunar.seeMore')}</ThemedText>
      </Pressable>

      {expanded && (
        <ThemedView type="backgroundElement" style={styles.expanded}>
          {preview.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
          <Pressable onPress={() => router.push('/calendar')} accessibilityRole="button">
            <ThemedText type="linkPrimary">{t('lunar.browseFullCalendar')}</ThemedText>
          </Pressable>
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
  enableButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expanded: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
});
