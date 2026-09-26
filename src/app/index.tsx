import { useCallback, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DeityCard } from '@/components/deity-card';
import { DivineCompanion } from '@/components/divine-companion';
import { LanguageSelector } from '@/components/language-selector';
import { LogoMark } from '@/components/logo-mark';
import { LunarDaysCard } from '@/components/lunar-days-card';
import { RegionSelector } from '@/components/region-selector';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UpcomingRemindersCard } from '@/components/upcoming-reminders-card';
import { WebBadge } from '@/components/web-badge';
import { MaxContentWidth, Spacing, ThemeColor } from '@/constants/theme';
import { useRegion } from '@/contexts/region-context';
import { DEITIES, type Deity } from '@/data/events';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { getFollowedDeities } from '@/lib/notifications';

// One accent color per deity, cycling through the palette by the deity's
// position in DEITIES - stable regardless of which subset is followed or
// what order they're rendered in.
const ACCENT_CYCLE: ThemeColor[] = ['primary', 'secondary', 'accent', 'maroon'];
const DEITY_ACCENTS: Record<string, ThemeColor> = Object.fromEntries(
  DEITIES.map((d, i) => [d.id, ACCENT_CYCLE[i % ACCENT_CYCLE.length]])
);

export default function HomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { regionId, setRegionId } = useRegion();
  const [followedDeities, setFollowedDeities] = useState<Deity[]>([]);

  // Reload whenever Home regains focus (e.g. coming back from "Manage my
  // deities" or a deity's notify toggles), so the list of deities always
  // reflects the current follow selection.
  useFocusEffect(
    useCallback(() => {
      getFollowedDeities().then(setFollowedDeities);
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
                <LogoMark size={96} ringColor={theme.primary} />
                <ThemedText type="smallBold" style={[styles.heroEyebrow, { color: theme.primaryText }]}>
                  {t('home.eyebrow')}
                </ThemedText>
                <ThemedText type="title" style={[styles.heroTitle, { color: theme.primaryText }]}>
                  {t('home.title')}
                </ThemedText>
                <ThemedText type="small" style={[styles.heroSubtitle, { color: theme.primaryText }]}>
                  {t('home.subtitle')}
                </ThemedText>
              </ThemedView>

              <DivineCompanion />

              <UpcomingRemindersCard />

              <LunarDaysCard />

              {/* The full calendar used to be its own tab; with no tab bar
                  it opens on top of Home instead, with a back arrow. */}
              <Pressable
                onPress={() => router.push('/calendar')}
                accessibilityRole="button"
                style={({ pressed }) => pressed && styles.pressed}>
                <ThemedView style={[styles.calendarButton, { borderColor: theme.primary }]}>
                  <ThemedText type="smallBold" style={{ color: theme.primary }}>
                    {t('home.openCalendar')}
                  </ThemedText>
                </ThemedView>
              </Pressable>

              {/* Sole entry point for changing which deities are followed - the
                  same screen already lists every available deity with hearts
                  to pick from (pre-checked to whatever's currently followed),
                  so a separate "browse" list here would just repeat it. Jumps
                  straight to that step - language and region below are each
                  already a direct entry point on their own. */}
              <Pressable onPress={() => router.push({ pathname: '/onboarding', params: { step: 'deities' } })}>
                <ThemedText type="linkPrimary">{t('home.manageDeities')}</ThemedText>
              </Pressable>

              {/* One full-width row each rather than side by side - in Tamil,
                  Telugu or Kannada the two labels together are wider than a
                  phone screen. */}
              <ThemedView style={styles.settingsColumn}>
                <RegionSelector regionId={regionId} onChange={setRegionId} fullWidth />
                <LanguageSelector fullWidth />
              </ThemedView>

              {followedDeities.length === 0 && (
                <ThemedView type="backgroundElement" style={styles.emptyCard}>
                  <ThemedText type="smallBold">{t('home.emptyTitle')}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('home.emptySubtitle')}
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
    paddingBottom: Spacing.five,
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
  pressed: {
    opacity: 0.7,
  },
  calendarButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  settingsColumn: {
    gap: Spacing.two,
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
