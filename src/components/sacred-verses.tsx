import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ListenButton } from '@/components/listen-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { getVersesForDeity, localizedField, localizedLabel, type VerseEntry } from '@/lib/devotional-verses';
import { localizedVerseScript, localizedVerseTitle } from '@/lib/i18n/content';

// Mantras, slogans, and parayanam (recitation) texts for one deity - kept
// entirely in-app (see devotional-verses.ts - no more linking out to an
// external page that ignored the app's language) and shown in whichever
// language is currently selected. Collapsed by default, same "hidden until
// asked for" treatment as everything else added to these already-busy
// deity pages.
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
            <VerseCard key={verse.title} verse={verse} />
          ))}
        </ThemedView>
      )}
    </ThemedView>
  );
}

function VerseCard({ verse }: { verse: VerseEntry }) {
  const theme = useTheme();
  const { t, languageId } = useTranslation();
  const meaning = localizedField(verse.meaning, languageId);
  const note = localizedField(verse.note, languageId);
  const title = localizedVerseTitle(verse.title, languageId);
  const script = verse.script ? localizedVerseScript(verse.title, verse.script, languageId) : undefined;
  // The mantra itself first, then what it means and when it's recited.
  const listenText = [
    `${title}.`,
    script,
    meaning ? `${t('deity.meaning')}: ${meaning}` : undefined,
    note,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderLeftColor: theme.secondary }]}>
      <ThemedText type="small" themeColor="textSecondary">
        {localizedLabel(verse.label, languageId)}
      </ThemedText>
      <ThemedText type="smallBold">{title}</ThemedText>
      {script && <ThemedText style={styles.script}>{script}</ThemedText>}
      {meaning && (
        <ThemedText type="small" style={styles.meaning}>
          {t('deity.meaning')}: {meaning}
        </ThemedText>
      )}
      {note && (
        <ThemedText type="small" themeColor="textSecondary">
          {note}
        </ThemedText>
      )}
      <ListenButton speechKey={`verse:${verse.title}`} text={listenText} />
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
  meaning: {
    fontStyle: 'italic',
  },
});
