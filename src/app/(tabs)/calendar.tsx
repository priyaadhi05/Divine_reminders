import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, SectionList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EventCard } from '@/components/event-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing, ThemeColor } from '@/constants/theme';
import { CATEGORY_LABELS, CURRENT_YEAR, CURRENT_YEAR_MONTH, EventCategory, getAllEvents, getEventsByYearMonth } from '@/data/events';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { CATEGORY_STYLE } from '@/lib/category-style';

// Categories only - labels are resolved per-render via categoryLabel() so
// they follow the selected language.
const FILTER_CATEGORIES: EventCategory[] = [
  'festival',
  'vratham',
  'monthly-sashti',
  'monthly-krithigai',
  'theipirai-sashti',
  'ekadashi',
  'pradosham',
  'monthly-shivaratri',
  'monthly-durgashtami',
  'pournami',
  'amavasai',
];

export default function CalendarScreen() {
  const [filter, setFilter] = useState<EventCategory | 'all'>('all');
  // One more year at a time rather than jumping straight to all 10 -
  // starts at just the current year, same as before.
  const [visibleYearCount, setVisibleYearCount] = useState(1);
  useEffect(() => setVisibleYearCount(1), [filter]);
  const theme = useTheme();
  const { t, categoryLabel } = useTranslation();

  const filters: { key: EventCategory | 'all'; label: string; icon: string; colorKey: ThemeColor }[] = [
    { key: 'all', label: t('common.all'), icon: '📿', colorKey: 'primary' },
    ...FILTER_CATEGORIES.map((key) => ({
      key,
      label: categoryLabel(key, CATEGORY_LABELS[key]),
      ...CATEGORY_STYLE[key],
    })),
  ];

  const allGroups = useMemo(() => {
    const events = filter === 'all' ? getAllEvents() : getAllEvents().filter((e) => e.category === filter);
    return getEventsByYearMonth(events);
  }, [filter]);

  // Only the current year's upcoming months by default - ten years of every
  // deity's events on one page is overwhelming. "Show more" reveals one
  // additional year at a time rather than jumping straight to all of them.
  const upcomingGroups = useMemo(() => allGroups.filter((g) => g.key >= CURRENT_YEAR_MONTH), [allGroups]);
  const years = useMemo(() => Array.from(new Set(upcomingGroups.map((g) => g.key.slice(0, 4)))), [upcomingGroups]);
  const visibleYears = new Set(years.slice(0, visibleYearCount));
  const visibleGroups = upcomingGroups.filter((g) => visibleYears.has(g.key.slice(0, 4)));

  const sections = visibleGroups.map((group) => ({ title: group.label, data: group.events }));
  const hasMoreYears = visibleYearCount < years.length;
  const isExpanded = visibleYearCount > 1;

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
                {t('calendar.title')}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t('calendar.subtitle')}
              </ThemedText>
              <ThemedView style={styles.filterRow}>
                {filters.map((f) => {
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

              {hasMoreYears ? (
                <Pressable onPress={() => setVisibleYearCount((c) => c + 1)} style={styles.yearToggle}>
                  <ThemedText type="linkPrimary">{t('deity.showMore')}</ThemedText>
                </Pressable>
              ) : isExpanded ? (
                <Pressable onPress={() => setVisibleYearCount(1)} style={styles.yearToggle}>
                  <ThemedText type="linkPrimary">{t('deity.showCurrentYearOnly', { year: CURRENT_YEAR })}</ThemedText>
                </Pressable>
              ) : null}
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
  yearToggle: {
    marginTop: Spacing.three,
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
