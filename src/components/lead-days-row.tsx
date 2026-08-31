import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

const OPTIONS = [
  { days: 3, key: 'leadDays.3' } as const,
  { days: 2, key: 'leadDays.2' } as const,
  { days: 1, key: 'leadDays.1' } as const,
];

// Lets someone pick how early the countdown for one followed topic (deity +
// category) starts. Picking "3 days before" is a countdown, not a single
// nudge - it cascades down to also include 2 and 1, same as picking "2"
// cascades to include 1. So this reads as one choice of starting point
// rather than three independent toggles: tapping any pill selects it and
// everything below it (all shown green), which is also what keeps a
// followed topic from ever going silent - there's always at least the
// tapped pill itself active.
export function LeadDaysRow({
  days,
  onChange,
  disabled,
}: {
  days: number[];
  onChange: (days: number[]) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const maxSelected = days.length ? Math.max(...days) : 0;

  const selectFrom = (d: number) => {
    onChange(OPTIONS.map((o) => o.days).filter((x) => x <= d));
  };

  return (
    <ThemedView style={styles.row}>
      {OPTIONS.map(({ days: d, key }) => {
        const on = d <= maxSelected;
        return (
          <Pressable key={d} onPress={() => selectFrom(d)} disabled={disabled} accessibilityRole="button" accessibilityState={{ selected: on }}>
            <ThemedView
              type="backgroundElement"
              style={[styles.pill, on && { backgroundColor: theme.success, borderColor: theme.success }]}>
              <ThemedText type="small" style={on && { color: theme.primaryText, fontWeight: '700' }}>
                {on ? '✓ ' : ''}
                {t(key)}
              </ThemedText>
            </ThemedView>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  pill: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.five,
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
