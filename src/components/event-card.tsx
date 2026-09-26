import { Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { CATEGORY_LABELS, DeityEvent } from '@/data/events';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { CATEGORY_STYLE } from '@/lib/category-style';

export function EventCard({ event }: { event: DeityEvent }) {
  const theme = useTheme();
  const { localize, shortDate, categoryLabel } = useTranslation();
  const shown = localize(event);
  const category = categoryLabel(event.category, CATEGORY_LABELS[event.category]);
  const { colorKey, icon } = CATEGORY_STYLE[event.category];
  const accentColor = theme[colorKey];

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={[styles.card, { borderLeftColor: accentColor }]}>
        <ThemedView type="backgroundElement" style={styles.dateColumn}>
          <ThemedText type="smallBold">{shortDate(event.date)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {event.date.slice(0, 4)}
          </ThemedText>
        </ThemedView>
        <ThemedView type="backgroundElement" style={styles.textColumn}>
          <ThemedView type="backgroundElement" style={styles.nameRow}>
            <ThemedText style={styles.icon}>{icon}</ThemedText>
            <ThemedText type="smallBold">{shown.name}</ThemedText>
          </ThemedView>
          {!!shown.tamilName && (
            <ThemedText type="small" themeColor="textSecondary">
              {shown.tamilName}
            </ThemedText>
          )}
        </ThemedView>
        <ThemedView type="backgroundElement" style={[styles.categoryPill, { backgroundColor: accentColor }]}>
          <ThemedText type="small" style={[styles.categoryPillText, { color: theme.primaryText }]}>
            {category}
          </ThemedText>
        </ThemedView>
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
    borderRadius: Spacing.three,
    borderLeftWidth: 4,
  },
  dateColumn: {
    minWidth: 76,
  },
  textColumn: {
    flex: 1,
    gap: Spacing.half,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  icon: {
    fontSize: 14,
  },
  categoryPill: {
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.five,
  },
  categoryPillText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: 700,
  },
});
