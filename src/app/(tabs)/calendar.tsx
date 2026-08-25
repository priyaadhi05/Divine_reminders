import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, SectionList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EventCard } from '@/components/event-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing, ThemeColor } from '@/constants/theme';
import { CATEGORY_LABELS, EventCategory, getAllEvents, getEventsByYearMonth } from '@/data/events';
import { useTheme } from '@/hooks/use-theme';
import { buildICS } from '@/lib/ics';
import { CATEGORY_STYLE } from '@/lib/category-style';
import { shareICS } from '@/lib/share-ics';

const FILTERS: { key: EventCategory | 'all'; label: string; icon: string; colorKey: ThemeColor }[] = [
  { key: 'all', label: 'All', icon: '📿', colorKey: 'primary' },
  { key: 'festival', label: CATEGORY_LABELS.festival, ...CATEGORY_STYLE.festival },
  { key: 'vratham', label: CATEGORY_LABELS.vratham, ...CATEGORY_STYLE.vratham },
  { key: 'monthly-sashti', label: CATEGORY_LABELS['monthly-sashti'], ...CATEGORY_STYLE['monthly-sashti'] },
  { key: 'monthly-krithigai', label: CATEGORY_LABELS['monthly-krithigai'], ...CATEGORY_STYLE['monthly-krithigai'] },
  { key: 'theipirai-sashti', label: CATEGORY_LABELS['theipirai-sashti'], ...CATEGORY_STYLE['theipirai-sashti'] },
];

async function exportAllToCalendar() {
  try {
    const ics = buildICS(getAllEvents(), 'Murugan Events 2026-2035');
    await shareICS(ics, 'murugan-events-2026-2035.ics');
  } catch (err) {
    Alert.alert('Could not export calendar', err instanceof Error ? err.message : 'Please try again.');
  }
}

export default function CalendarScreen() {
  const [filter, setFilter] = useState<EventCategory | 'all'>('all');
  const theme = useTheme();

  const sections = useMemo(() => {
    const events = filter === 'all' ? getAllEvents() : getAllEvents().filter((e) => e.category === filter);
    return getEventsByYearMonth(events).map((group) => ({ title: group.label, data: group.events }));
  }, [filter]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <ThemedView style={styles.header}>
              <ThemedText type="title" style={styles.title} themeColor="primary">
                Calendar
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                All Murugan events, 2026–2035 · festivals, vrathams &amp; monthly observances
              </ThemedText>
              <ThemedView style={styles.filterRow}>
                {FILTERS.map((f) => {
                  const selected = filter === f.key;
                  const chipColor = theme[f.colorKey];
                  return (
                    <Pressable key={f.key} onPress={() => setFilter(f.key)}>
                      <ThemedView
                        type="backgroundElement"
                        style={[
                          styles.filterChip,
                          selected && { backgroundColor: chipColor, borderColor: chipColor },
                        ]}>
                        <ThemedText style={styles.filterChipIcon}>{f.icon}</ThemedText>
                        <ThemedText
                          type="small"
                          style={selected && { color: theme.primaryText, fontWeight: '700' }}>
                          {f.label}
                        </ThemedText>
                      </ThemedView>
                    </Pressable>
                  );
                })}
              </ThemedView>
              <Pressable onPress={exportAllToCalendar} style={styles.exportRow}>
                <ThemedText type="linkPrimary">Export all 10 years to Calendar (.ics) →</ThemedText>
              </Pressable>
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
        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
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
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
    gap: Spacing.one,
  },
  exportRow: {
    marginTop: Spacing.two,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.three,
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
