import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, SectionList, StyleSheet } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EventCard } from '@/components/event-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, ThemeColor } from '@/constants/theme';
import {
  CATEGORY_LABELS,
  EventCategory,
  formatEventDate,
  getDeityById,
  getEventsForDeity,
  getEventsByYearMonth,
  getUpcomingEvents,
} from '@/data/events';
import { useTheme } from '@/hooks/use-theme';
import { CATEGORY_STYLE } from '@/lib/category-style';
import { areRemindersEnabled, enableReminders, isDeityFollowed, setDeityFollowed } from '@/lib/notifications';

export default function DeityScreen() {
  const { deityId } = useLocalSearchParams<{ deityId: string }>();
  const deity = getDeityById(deityId);
  const theme = useTheme();
  const [filter, setFilter] = useState<EventCategory | 'all'>('all');
  const [followed, setFollowed] = useState(false);
  const [busy, setBusy] = useState(false);

  const allEvents = useMemo(() => getEventsForDeity(deityId), [deityId]);
  const [next] = useMemo(() => getUpcomingEvents(1, deityId), [deityId]);

  useEffect(() => {
    isDeityFollowed(deityId).then(setFollowed);
  }, [deityId]);

  const handleToggleFollow = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const nextFollowed = !followed;
      if (nextFollowed && !(await areRemindersEnabled())) {
        await enableReminders(); // requests OS permission if not already granted
      }
      await setDeityFollowed(deityId, nextFollowed);
      setFollowed(nextFollowed);
    } finally {
      setBusy(false);
    }
  };

  // Only show filter chips for categories this deity's dataset actually uses.
  const categoriesPresent = useMemo(
    () => Array.from(new Set(allEvents.map((e) => e.category))) as EventCategory[],
    [allEvents]
  );

  const sections = useMemo(() => {
    const events = filter === 'all' ? allEvents : allEvents.filter((e) => e.category === filter);
    return getEventsByYearMonth(events).map((group) => ({ title: group.label, data: group.events }));
  }, [allEvents, filter]);

  if (!deity) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Deity not found.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: deity.name }} />
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <ThemedView style={styles.header}>
              <ThemedView style={[styles.hero, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.heroSymbol}>{deity.symbol}</ThemedText>
                <ThemedText style={[styles.heroTamil, { color: theme.primaryText }]}>{deity.tamilName}</ThemedText>
                <ThemedText type="title" style={[styles.heroTitle, { color: theme.primaryText }]}>
                  {deity.name}
                </ThemedText>
                <ThemedText type="small" style={[styles.heroSubtitle, { color: theme.primaryText }]}>
                  Festivals &amp; auspicious days · 2026–2035
                </ThemedText>
              </ThemedView>

              {next && (
                <Pressable onPress={() => router.push({ pathname: '/event/[id]', params: { id: next.id } })}>
                  <ThemedView
                    type="backgroundElement"
                    style={[styles.nextCard, { borderColor: theme[CATEGORY_STYLE[next.category].colorKey] }]}>
                    <ThemedText type="small" themeColor="textSecondary">
                      NEXT UP {CATEGORY_STYLE[next.category].icon}
                    </ThemedText>
                    <ThemedText type="subtitle" style={styles.nextName}>
                      {next.name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {formatEventDate(next.date)}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              )}

              <Pressable
                onPress={handleToggleFollow}
                disabled={busy}
                style={[styles.notifyButton, { borderColor: theme.accent, opacity: busy ? 0.6 : 1 }]}
                accessibilityRole="button">
                <ThemedText type="smallBold">
                  {followed ? `🔔 Notified for ${deity.name}` : `🔕 Notify me for ${deity.name}`}
                  {Platform.OS === 'web' ? ' (mobile only)' : ''}
                </ThemedText>
              </Pressable>
              {followed && (
                <ThemedText type="small" themeColor="textSecondary">
                  You'll get a notification 3 days, 2 days, and 1 day before each upcoming {deity.name} event.
                </ThemedText>
              )}

              <ThemedView style={styles.filterRow}>
                <FilterChip label="All" icon="📿" colorKey="primary" selected={filter === 'all'} onPress={() => setFilter('all')} />
                {categoriesPresent.map((cat) => (
                  <FilterChip
                    key={cat}
                    label={CATEGORY_LABELS[cat]}
                    icon={CATEGORY_STYLE[cat].icon}
                    colorKey={CATEGORY_STYLE[cat].colorKey}
                    selected={filter === cat}
                    onPress={() => setFilter(cat)}
                  />
                ))}
              </ThemedView>
            </ThemedView>
          }
          renderSectionHeader={({ section }) => (
            <ThemedView type="background" style={styles.sectionHeader}>
              <ThemedText type="smallBold" themeColor="primary">
                {section.title}
              </ThemedText>
            </ThemedView>
          )}
          renderItem={({ item }) => <EventCard event={item} />}
          ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
          SectionSeparatorComponent={() => <ThemedView style={styles.sectionSeparator} />}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

function FilterChip({
  label,
  icon,
  colorKey,
  selected,
  onPress,
}: {
  label: string;
  icon: string;
  colorKey: ThemeColor;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const chipColor = theme[colorKey];
  return (
    <Pressable onPress={onPress}>
      <ThemedView
        type="backgroundElement"
        style={[styles.filterChip, selected && { backgroundColor: chipColor, borderColor: chipColor }]}>
        <ThemedText style={styles.filterChipIcon}>{icon}</ThemedText>
        <ThemedText type="small" style={selected && { color: theme.primaryText, fontWeight: '700' }}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  header: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.three,
  },
  hero: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.half,
  },
  heroSymbol: {
    fontSize: 36,
  },
  heroTamil: {
    fontSize: 22,
    fontWeight: '700',
    opacity: 0.9,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 40,
  },
  heroSubtitle: {
    textAlign: 'center',
    opacity: 0.9,
  },
  nextCard: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    borderWidth: 2,
    gap: Spacing.half,
  },
  nextName: {
    fontSize: 26,
    lineHeight: 32,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipIcon: {
    fontSize: 13,
  },
  notifyButton: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: Spacing.four,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  sectionHeader: {
    paddingVertical: Spacing.two,
  },
  separator: {
    height: Spacing.two,
  },
  sectionSeparator: {
    height: Spacing.one,
  },
});
