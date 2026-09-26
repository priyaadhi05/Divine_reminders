import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { areRemindersEnabled, disableReminders, enableReminders, REMINDERS_SUPPORTED } from '@/lib/notifications';
import { alertRemindersBlocked } from '@/lib/reminder-permission';

// Home's intro card: a plain line on what the app does, and the toggle for
// real OS-level scheduled reminders.

export function DivineCompanion() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [remindersOn, setRemindersOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    areRemindersEnabled().then(setRemindersOn);
  }, []);

  const handleToggleReminders = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (remindersOn) {
        await disableReminders();
        setRemindersOn(false);
      } else {
        const granted = await enableReminders();
        if (!granted) alertRemindersBlocked(t);
        setRemindersOn(granted);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.accent }]}>
      <ThemedView type="backgroundSelected" style={styles.bubble}>
        <ThemedText type="small">
          🙏 {t('home.about')}
        </ThemedText>
      </ThemedView>

      {REMINDERS_SUPPORTED && (
        <Pressable
          onPress={handleToggleReminders}
          disabled={busy}
          style={[styles.bell, { borderColor: theme.accent, opacity: busy ? 0.6 : 1 }]}
          accessibilityRole="button">
          <ThemedText type="smallBold">
            {remindersOn ? t('mascot.remindersOn') : t('mascot.enableReminders')}
          </ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.four,
    borderWidth: 2,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  bubble: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  bell: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: Spacing.four,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
});
