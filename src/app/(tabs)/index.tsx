import { FlatList, Platform, Pressable, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EventCard } from '@/components/event-card';
import { MuruganMascot } from '@/components/murugan-mascot';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { formatEventDate, getUpcomingEvents } from '@/data/events';
import { useTheme } from '@/hooks/use-theme';
import { CATEGORY_STYLE } from '@/lib/category-style';

export default function HomeScreen() {
  const upcoming = getUpcomingEvents(8);
  const [next, ...rest] = upcoming;
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={rest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <ThemedView style={styles.header}>
              <ThemedView style={[styles.hero, { backgroundColor: theme.primary }]}>
                <ThemedText style={[styles.heroTamil, { color: theme.primaryText }]}>முருகன்</ThemedText>
                <ThemedText type="title" style={[styles.heroTitle, { color: theme.primaryText }]}>
                  Murugan
                </ThemedText>
                <ThemedText type="small" style={[styles.heroSubtitle, { color: theme.primaryText }]}>
                  Festivals, vrathams &amp; auspicious days · 2026–2035
                </ThemedText>
              </ThemedView>

              <MuruganMascot nextEvent={next} />

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

              {rest.length > 0 && (
                <ThemedText type="smallBold" style={styles.sectionLabel}>
                  Also coming up
                </ThemedText>
              )}
            </ThemedView>
          }
          renderItem={({ item }) => <EventCard event={item} />}
          ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
          ListFooterComponent={
            <ThemedView style={styles.footer}>
              <Link href="/calendar">
                <ThemedText type="linkPrimary">View the full 10-year calendar →</ThemedText>
              </Link>
            </ThemedView>
          }
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
  heroTamil: {
    fontSize: 22,
    fontWeight: '700',
    opacity: 0.9,
  },
  heroTitle: {
    fontSize: 40,
    lineHeight: 46,
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
  sectionLabel: {
    marginTop: Spacing.one,
  },
  separator: {
    height: Spacing.two,
  },
  footer: {
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
});
