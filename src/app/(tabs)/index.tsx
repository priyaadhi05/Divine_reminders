import { useCallback, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DeityCard } from '@/components/deity-card';
import { LogoMark } from '@/components/logo-mark';
import { LunarDaysCard } from '@/components/lunar-days-card';
import { MuruganMascot } from '@/components/murugan-mascot';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing, ThemeColor } from '@/constants/theme';
import { DEITIES, type Deity, type DeityEvent } from '@/data/events';
import { useTheme } from '@/hooks/use-theme';
import { getFollowedDeities, getFollowedUpcomingEvents } from '@/lib/notifications';

// One accent color per deity, cycling through the palette by the deity's
// position in DEITIES - stable regardless of which subset is followed or
// what order they're rendered in.
const ACCENT_CYCLE: ThemeColor[] = ['primary', 'secondary', 'accent', 'maroon'];
const DEITY_ACCENTS: Record<string, ThemeColor> = Object.fromEntries(
  DEITIES.map((d, i) => [d.id, ACCENT_CYCLE[i % ACCENT_CYCLE.length]])
);

export default function HomeScreen() {
  const theme = useTheme();
  const [followedDeities, setFollowedDeities] = useState<Deity[]>([]);
  const [nextOverall, setNextOverall] = useState<DeityEvent | undefined>();

  // Reload whenever Home regains focus (e.g. coming back from "Manage my
  // deities" or a deity's notify toggles), so the list of deities and the
  // companion card's countdown always reflect the current follow selection.
  useFocusEffect(
    useCallback(() => {
      getFollowedDeities().then(setFollowedDeities);
      getFollowedUpcomingEvents(1).then(([first]) => setNextOverall(first));
    }, [])
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={followedDeities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <ThemedView style={styles.header}>
              <ThemedView style={[styles.hero, { backgroundColor: theme.primary }]}>
                <LogoMark ringColor={theme.primary} />
                <ThemedText type="smallBold" style={[styles.heroEyebrow, { color: theme.primaryText }]}>
                  DIVINE CALENDAR
                </ThemedText>
                <ThemedText type="title" style={[styles.heroTitle, { color: theme.primaryText }]}>
                  Your Sacred Days
                </ThemedText>
                <ThemedText type="small" style={[styles.heroSubtitle, { color: theme.primaryText }]}>
                  Personalized to the deities you follow
                </ThemedText>
              </ThemedView>

              <MuruganMascot nextEvent={nextOverall} />

              <LunarDaysCard />

              {/* Sole entry point for changing which deities are followed - the
                  onboarding screen already lists every available deity with
                  hearts to pick from, so a separate "browse" list here would
                  just repeat it. */}
              <Pressable onPress={() => router.push('/onboarding')}>
                <ThemedText type="linkPrimary">❤️ Manage my deities →</ThemedText>
              </Pressable>

              {followedDeities.length === 0 && (
                <ThemedView type="backgroundElement" style={styles.emptyCard}>
                  <ThemedText type="smallBold">No sacred days yet</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Choose which deities are meaningful to you and they'll show up here, each with what's coming next.
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
          }
          renderItem={({ item }) => <DeityCard deity={item} accentColor={DEITY_ACCENTS[item.id]} />}
          ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
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
  heroEyebrow: {
    marginTop: Spacing.two,
    letterSpacing: 2,
    opacity: 0.85,
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
  separator: {
    height: Spacing.two,
  },
});
