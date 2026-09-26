import { Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { DeityLogo } from '@/components/deity-logo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, ThemeColor } from '@/constants/theme';
import { getUpcomingEvents, type Deity } from '@/data/events';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

// One card per deity on the Home tab - symbol + name stand in for artwork
// (no image asset yet) and a "next up" teaser pulls the reader straight into
// that deity's own detail/calendar screen.
export function DeityCard({ deity, accentColor }: { deity: Deity; accentColor: ThemeColor }) {
  const theme = useTheme();
  const { t, deityName, localize, dateNoYear } = useTranslation();
  const [next] = getUpcomingEvents(1, deity.id);
  const accent = theme[accentColor];

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/deity/[deityId]', params: { deityId: deity.id } })}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={[styles.card, { borderColor: accent }]}>
        <DeityLogo deity={deity} size={56} />
        <ThemedView type="backgroundElement" style={styles.textColumn}>
          <ThemedText type="subtitle" style={styles.name}>
            {deityName(deity.id, deity.name)}
          </ThemedText>
          {next && (
            <ThemedText type="small" style={[styles.nextLine, { color: accent }]} numberOfLines={1}>
              {t('deity.nextLabel')}: {localize(next).name} · {dateNoYear(next.date)}
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
