import { useEffect, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DeityLogo } from '@/components/deity-logo';
import { EventCard } from '@/components/event-card';
import { NotifyPanel } from '@/components/notify-panel';
import { SacredVerses } from '@/components/sacred-verses';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, ThemeColor } from '@/constants/theme';
import {
  CATEGORY_LABELS,
  CURRENT_YEAR_MONTH,
  EventCategory,
  getDeityById,
  getEventsForDeity,
  getEventsByYearMonth,
  getUpcomingEvents,
} from '@/data/events';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { CATEGORY_STYLE } from '@/lib/category-style';

const MONTHS_PER_PAGE = 3;

export default function DeityScreen() {
  const { deityId } = useLocalSearchParams<{ deityId: string }>();
  const deity = getDeityById(deityId);
  const theme = useTheme();
  const { t, categoryLabel, deityName: translatedDeityName, localize, fullDate, languageId } = useTranslation();
  const [filter, setFilter] = useState<EventCategory | 'all'>('all');
  // Reveals a few more months at a time rather than jumping straight to
  // everything - MONTHS_PER_PAGE more each tap of "Show more".
  const [visibleMonthCount, setVisibleMonthCount] = useState(1);
  useEffect(() => setVisibleMonthCount(1), [filter]);

  const allEvents = useMemo(() => getEventsForDeity(deityId), [deityId]);
  const [next] = useMemo(() => getUpcomingEvents(1, deityId), [deityId]);

  // Only show filter chips for categories this deity's dataset actually uses.
  const categoriesPresent = useMemo(
    () => Array.from(new Set(allEvents.map((e) => e.category))) as EventCategory[],
    [allEvents]
  );

  const allGroups = useMemo(() => {
    const events = filter === 'all' ? allEvents : allEvents.filter((e) => e.category === filter);
    return getEventsByYearMonth(events, languageId);
  }, [allEvents, filter, languageId]);

  // Just the nearest upcoming month by default - a whole year of one
  // deity's events (unlike the Calendar tab, which is meant to be browsed)
  // was too much to land on. "Show more" reveals a few months at a time
  // rather than jumping straight to the full decade.
  const upcomingGroups = useMemo(() => allGroups.filter((g) => g.key >= CURRENT_YEAR_MONTH), [allGroups]);
  const visibleGroups = upcomingGroups.slice(0, visibleMonthCount);
  const sections = visibleGroups.map((group) => ({ title: group.label, data: group.events }));
  const hasMoreMonths = visibleGroups.length < upcomingGroups.length;
  const isExpanded = visibleMonthCount > 1;

  if (!deity) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>{t('common.deityNotFound')}</ThemedText>
      </ThemedView>
    );
  }

  const localizedName = translatedDeityName(deity.id, deity.name);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: localizedName }} />
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <ThemedView style={styles.header}>
              <ThemedView style={[styles.hero, { backgroundColor: theme.primary }]}>
                <DeityLogo deity={deity} size={112} />
                <ThemedText type="title" style={[styles.heroTitle, { color: theme.primaryText }]}>
                  {localizedName}
                </ThemedText>
                <ThemedText type="small" style={[styles.heroSubtitle, { color: theme.primaryText }]}>
                  {t('deity.tagline')}
                </ThemedText>
              </ThemedView>

              {next && (
                <Pressable onPress={() => router.push({ pathname: '/event/[id]', params: { id: next.id } })}>
                  <ThemedView
                    type="backgroundElement"
                    style={[styles.nextCard, { borderColor: theme[CATEGORY_STYLE[next.category].colorKey] }]}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {t('deity.nextUp')} {CATEGORY_STYLE[next.category].icon}
                    </ThemedText>
                    <ThemedText type="subtitle" style={styles.nextName}>
                      {localize(next).name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {fullDate(next.date)}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              )}

              <NotifyPanel deityId={deityId} deityName={localizedName} />

              <SacredVerses deityId={deityId} />

              <ThemedText type="smallBold" style={styles.browseLabel}>
                {t('deity.browseCalendar')}
              </ThemedText>
              <ThemedView style={styles.filterRow}>
                <FilterChip
                  label={t('common.all')}
                  icon="📿"
                  colorKey="primary"
                  selected={filter === 'all'}
                  onPress={() => setFilter('all')}
                />
                {categoriesPresent.map((cat) => (
                  <FilterChip
                    key={cat}
                    label={categoryLabel(cat, CATEGORY_LABELS[cat])}
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
          // "Show more" lives at the end of what's already loaded, not up in
          // the header - a header-pinned control meant you'd scroll all the
          // way back to the top just to load more months, which read as the
          // page jumping around instead of smoothly extending downward.
          ListFooterComponent={
            hasMoreMonths ? (
              <Pressable onPress={() => setVisibleMonthCount((c) => c + MONTHS_PER_PAGE)} style={styles.yearToggle}>
                <ThemedText type="linkPrimary">{t('deity.showMore')}</ThemedText>
              </Pressable>
            ) : isExpanded ? (
              <Pressable onPress={() => setVisibleMonthCount(1)} style={styles.yearToggle}>
                <ThemedText type="linkPrimary">{t('deity.showNextMonthOnly')}</ThemedText>
              </Pressable>
            ) : null
          }
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
  browseLabel: {
    marginTop: Spacing.one,
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
  yearToggle: {
    marginTop: Spacing.three,
    alignItems: 'center',
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
