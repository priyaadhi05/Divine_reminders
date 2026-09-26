import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

// Home's intro card: a plain line on what the app does. There's no global
// reminders on/off switch here - turning on any single reminder (an event,
// a deity, Amavasai/Pournami) asks for notification permission itself (see
// lib/reminder-permission.ts), and Home's "Reminders set for" card lists
// what's been turned on.
export function DivineCompanion() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.accent }]}>
      <ThemedView type="backgroundSelected" style={styles.bubble}>
        <ThemedText type="small">
          🙏 {t('home.about')}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.four,
    borderWidth: 2,
    padding: Spacing.three,
  },
  bubble: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.half,
  },
});
