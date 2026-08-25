import { ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RegionSelector } from '@/components/region-selector';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useRegion } from '@/contexts/region-context';
import { CATEGORY_LABELS, formatEventDate, formatPeriodTiming, getEventById } from '@/data/events';
import { useTheme } from '@/hooks/use-theme';
import { CATEGORY_STYLE } from '@/lib/category-style';
import { resolveRegionTimeZone } from '@/lib/regions';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = getEventById(id);
  const { regionId } = useRegion();
  const theme = useTheme();

  if (!event) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Event not found.</ThemedText>
      </ThemedView>
    );
  }

  const { timeZone, label: regionLabel } = resolveRegionTimeZone(regionId);
  const timing = formatPeriodTiming(event, timeZone, regionLabel);
  const { colorKey, icon } = CATEGORY_STYLE[event.category];
  const accentColor = theme[colorKey];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <SafeAreaView edges={['bottom']} style={styles.content}>
        <ThemedView style={[styles.headerBlock, { borderTopColor: accentColor }]}>
          <ThemedView style={styles.categoryRow}>
            <ThemedText style={styles.categoryIcon}>{icon}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {CATEGORY_LABELS[event.category]} · {event.tamilMonth}
            </ThemedText>
          </ThemedView>
          <ThemedText type="title" style={styles.title}>
            {event.name}
          </ThemedText>
          <ThemedText type="subtitle" style={[styles.tamilName, { color: accentColor }]}>
            {event.tamilName}
          </ThemedText>
          <ThemedText type="smallBold">{formatEventDate(event.date)}</ThemedText>
        </ThemedView>

        {timing && (
          <ThemedView type="backgroundElement" style={styles.timingCard}>
            <ThemedView style={styles.timingHeader}>
              <ThemedText type="smallBold">Precise timing</ThemedText>
              <RegionSelector />
            </ThemedView>
            <ThemedView type="backgroundElement" style={styles.timingRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Begins
              </ThemedText>
              <ThemedText type="small">{timing.startLocal}</ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={styles.timingRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Ends
              </ThemedText>
              <ThemedText type="small">{timing.endLocal}</ThemedText>
            </ThemedView>
            <ThemedText type="small" themeColor="textSecondary" style={styles.timingNote}>
              Shown for {timing.regionLabel}. Panchangam reference (IST): {timing.startIST} → {timing.endIST}
            </ThemedText>
          </ThemedView>
        )}

        <ThemedView style={styles.section}>
          <ThemedText type="smallBold">About</ThemedText>
          <ThemedText>{event.description}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="smallBold">Significance</ThemedText>
          <ThemedText>{event.significance}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="smallBold">Panchangam basis</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {event.basis}
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.four,
  },
  headerBlock: {
    gap: Spacing.one,
    borderTopWidth: 4,
    paddingTop: Spacing.three,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  categoryIcon: {
    fontSize: 16,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
  },
  tamilName: {
    fontSize: 20,
    lineHeight: 26,
  },
  section: {
    gap: Spacing.one,
  },
  timingCard: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  timingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  timingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timingNote: {
    marginTop: Spacing.one,
  },
});
