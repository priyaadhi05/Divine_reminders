import { Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, ThemeColor } from '@/constants/theme';
import { formatEventDate, getUpcomingEvents, type Deity } from '@/data/events';
import { useTheme } from '@/hooks/use-theme';

// One card per deity on the Home tab - symbol + name stand in for artwork
// (no image asset yet) and a "next up" teaser pulls the reader straight into
// that deity's own detail/calendar screen.
export function DeityCard({ deity, accentColor }: { deity: Deity; accentColor: ThemeColor }) {
  const theme = useTheme();
  const [next] = getUpcomingEvents(1, deity.id);
  const accent = theme[accentColor];

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/deity/[deityId]', params: { deityId: deity.id } })}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={[styles.card, { borderColor: accent }]}>
        <ThemedView style={[styles.symbolBadge, { backgroundColor: accent }]}>
          <ThemedText style={styles.symbol}>{deity.symbol}</ThemedText>
        </ThemedView>
        <ThemedView type="backgroundElement" style={styles.textColumn}>
          <ThemedText type="subtitle" style={styles.name}>
            {deity.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {deity.tamilName}
          </ThemedText>
          {next && (
            <ThemedText type="small" style={[styles.nextLine, { color: accent }]} numberOfLines={1}>
              Next: {next.name} · {formatEventDate(next.date).split(',').slice(0, 2).join(',')}
            </ThemedText>
          )}
        </ThemedView>
        <ThemedText style={[styles.chevron, { color: accent }]}>→</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.four,
    borderWidth: 2,
  },
  symbolBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    fontSize: 26,
  },
  textColumn: {
    flex: 1,
    gap: Spacing.half,
  },
  name: {
    fontSize: 22,
    lineHeight: 28,
  },
  nextLine: {
    fontWeight: '700',
    marginTop: Spacing.half,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '700',
  },
});
