import { useCallback, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MuruganMascot } from '@/components/murugan-mascot';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { formatEventDate, getDeityById, relativeDayLabel, type DeityEvent } from '@/data/events';
import { useTheme } from '@/hooks/use-theme';
import { getFollowedUpcomingEvents } from '@/lib/notifications';

export default function HomeScreen() {
  const theme = useTheme();
  const [sacredDays, setSacredDays] = useState<DeityEvent[]>([]);

  // Reload whenever Home regains focus (e.g. coming back from "Manage my
  // deities" or a deity's notify toggles), so the feed always reflects the
  // current follow selection.
  useFocusEffect(
    useCallback(() => {
      getFollowedUpcomingEvents(8).then(setSacredDays);
    }, [])
  );

  const [nextOverall] = sacredDays;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={sacredDays}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <ThemedView style={styles.header}>
              <ThemedView style={[styles.hero, { backgroundColor: theme.primary }]}>
                <ThemedText type="title" style={[styles.heroTitle, { color: theme.primaryText }]}>
                  Your Sacred Days
                </ThemedText>
                <ThemedText type="small" style={[styles.heroSubtitle, { color: theme.primaryText }]}>
                  Personalized to the deities you follow
                </ThemedText>
              </ThemedView>

              <MuruganMascot nextEvent={nextOverall} />

              {/* Sole entry point for changing which deities are followed - the
                  onboarding screen already lists every available deity with
                  hearts to pick from, so a separate "browse" list here would
                  just repeat it. */}
              <Pressable onPress={() => router.push('/onboarding')}>
                <ThemedText type="linkPrimary">❤️ Manage my deities →</ThemedText>
              </Pressable>

              {sacredDays.length === 0 && (
                <ThemedView type="backgroundElement" style={styles.emptyCard}>
                  <ThemedText type="smallBold">No sacred days yet</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Choose which deities are meaningful to you and this screen will fill up with what's coming next.
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
          }
          renderItem={({ item }) => <SacredDayRow event={item} />}
          ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        />
        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

function SacredDayRow({ event }: { event: DeityEvent }) {
  const theme = useTheme();
  const deity = getDeityById(event.deity);

  return (
    <Pressable onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}>
      <ThemedView type="backgroundElement" style={[styles.row, { borderLeftColor: theme.primary }]}>
        <ThemedText style={styles.rowSymbol}>{deity?.symbol ?? '🪔'}</ThemedText>
        <ThemedView type="backgroundElement" style={styles.rowText}>
          <ThemedText type="smallBold" themeColor="primary">
            {relativeDayLabel(event.date)}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.rowName}>
            {event.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatEventDate(event.date)}
          </ThemedText>
        </ThemedView>
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
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  hero: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.half,
  },
  heroTitle: {
    fontSize: 36,
    lineHeight: 42,
  },
  heroSubtitle: {
    textAlign: 'center',
    opacity: 0.9,
  },
  emptyCard: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderLeftWidth: 4,
  },
  rowSymbol: {
    fontSize: 28,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
  rowName: {
    fontSize: 22,
    lineHeight: 28,
  },
  separator: {
    height: Spacing.two,
  },
});
