import { FlatList, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DeityCard } from '@/components/deity-card';
import { MuruganMascot } from '@/components/murugan-mascot';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing, ThemeColor } from '@/constants/theme';
import { DEITIES, getUpcomingEvents } from '@/data/events';
import { useTheme } from '@/hooks/use-theme';

// Rotating accent per deity card, since there's no per-deity artwork yet to
// tell them apart visually - just symbol + name + this border color.
const DEITY_ACCENTS: Record<string, ThemeColor> = {
  murugan: 'primary',
  vishnu: 'secondary',
  shiva: 'maroon',
  durga: 'accent',
};

export default function HomeScreen() {
  const [nextOverall] = getUpcomingEvents(1);
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={DEITIES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <ThemedView style={styles.header}>
              <ThemedView style={[styles.hero, { backgroundColor: theme.primary }]}>
                <ThemedText type="title" style={[styles.heroTitle, { color: theme.primaryText }]}>
                  Divine Calendar
                </ThemedText>
                <ThemedText type="small" style={[styles.heroSubtitle, { color: theme.primaryText }]}>
                  Festivals, vrathams &amp; auspicious days · 2026–2035
                </ThemedText>
              </ThemedView>

              <MuruganMascot nextEvent={nextOverall} />

              <ThemedText type="smallBold" style={styles.sectionLabel}>
                Choose a deity
              </ThemedText>
            </ThemedView>
          }
          renderItem={({ item }) => <DeityCard deity={item} accentColor={DEITY_ACCENTS[item.id] ?? 'primary'} />}
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
  heroTitle: {
    fontSize: 40,
    lineHeight: 46,
  },
  heroSubtitle: {
    textAlign: 'center',
    opacity: 0.9,
  },
  sectionLabel: {
    marginTop: Spacing.one,
  },
  separator: {
    height: Spacing.two,
  },
});
