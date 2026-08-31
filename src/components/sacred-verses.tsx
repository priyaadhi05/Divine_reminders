import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { getVersesForDeity } from '@/lib/devotional-verses';

// Mantras, slogans, and parayanam (recitation) texts for one deity - see
// devotional-verses.ts for why these stay in their original script rather
// than following the UI's selected language. Collapsed by default, same
// "hidden until asked for" treatment as everything else added to these
// already-busy deity pages.
export function SacredVerses({ deityId }: { deityId: string }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const verses = getVersesForDeity(deityId);

  if (verses.length === 0) return null;

  return (
    <ThemedView style={styles.container}>
      <Pressable onPress={() => setOpen((v) => !v)} accessibilityRole="button">
        <ThemedView type="backgroundElement" style={[styles.summaryRow, { borderColor: theme.secondary }]}>
          <ThemedText type="smallBold">📿 {t('deity.sacredVerses')}</ThemedText>
          <ThemedText themeColor="textSecondary">{open ? '︿' : '﹀'}</ThemedText>
        </ThemedView>
      </Pressable>

      {open && (
        <ThemedView style={styles.list}>
          {verses.map((verse) => (
            <ThemedView key={verse.title} type="backgroundElement" style={[styles.card, { borderLeftColor: theme.secondary }]}>
              <ThemedText type="small" themeColor="textSecondary">
                {verse.label}
              </ThemedText>
              <ThemedText type="smallBold">{verse.title}</ThemedText>
              {verse.script && <ThemedText style={styles.script}>{verse.script}</ThemedText>}
              <ThemedText type="small" themeColor="textSecondary">
                {verse.note}
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  list: {
    gap: Spacing.two,
  },
  card: {
    gap: Spacing.half,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderLeftWidth: 3,
  },
  script: {
    fontSize: 17,
    lineHeight: 24,
    marginVertical: Spacing.half,
  },
});
