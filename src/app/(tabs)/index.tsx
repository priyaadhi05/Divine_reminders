import { useCallback, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DeityCard } from '@/components/deity-card';
import { MuruganMascot } from '@/components/murugan-mascot';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing, ThemeColor } from '@/constants/theme';
import { DEITIES, formatEventDate, getDeityById, relativeDayLabel, type Deity, type DeityEvent } from '@/data/events';
import { useTheme } from '@/hooks/use-theme';
import { getDeityFollowState, getFollowedUpcomingEvents } from '@/lib/notifications';

// Rotating accent per deity card, since there's no per-deity artwork yet to
// tell them apart visually - just symbol + name + this border color.
const DEITY_ACCENTS: Record<string, ThemeColor> = {
  murugan: 'primary',
  vishnu: 'secondary',
  shiva: 'maroon',
  durga: 'accent',
};

export default function HomeScreen() {
  const theme = useTheme();
  const [sacredDays, setSacredDays] = useState<DeityEvent[]>([]);
  const [otherDeities, setOtherDeities] = useState<Deity[]>([]);
  const [showBrowse, setShowBrowse] = useState(false);

  // Reload whenever Home regains focus (e.g. coming back from "Manage my
  // deities" or a deity's notify toggles), so the feed always reflects the
  // current follow selection.
  useFocusEffect(
    useCallback(() => {
      getFollowedUpcomingEvents(8).then(setSacredDays);
      Promise.all(DEITIES.map(async (d) => ((await getDeityFollowState(d.id)) === 'none' ? d : null))).then((results) =>
        setOtherDeities(results.filter((d): d is Deity => d !== null))
      );
      setShowBrowse(false); // collapse again each time Home regains focus
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
          ListFooterComponent={
            otherDeities.length > 0 ? (
              <ThemedView style={styles.browseSection}>
                <Pressable onPress={() => setShowBrowse((v) => !v)}>
                  <ThemedText type="linkPrimary">
                    {showBrowse ? '← Hide' : 'Browse other deities →'}
                  </ThemedText>
                </Pressable>
                {showBrowse &&
                  otherDeities.map((deity) => (
                    <ThemedView key={deity.id} style={styles.browseCardWrap}>
                      <DeityCard deity={deity} accentColor={DEITY_ACCENTS[deity.id] ?? 'primary'} />
                    </ThemedView>
                  ))}
              </ThemedView>
            ) : null
          }
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
  browseSection: {
    marginTop: Spacing.four,
    gap: Spacing.two,
  },
  browseCardWrap: {
    marginTop: Spacing.one,
  },
});
