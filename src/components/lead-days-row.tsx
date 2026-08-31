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

// Lets someone pick which of the 3/2/1-day countdown nudges they want for
// one followed topic (deity + category) - the same granularity following
// already works at, so this customizes *when* a reminder fires without
// adding a separate "which events" axis. Multi-select; always keeps at
// least one option on so a followed topic never goes silent by accident.
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

  const toggle = (d: number) => {
    const on = days.includes(d);
    if (on && days.length === 1) return;
    onChange(on ? days.filter((x) => x !== d) : [...days, d]);
  };

  return (
    <ThemedView style={styles.row}>
      {OPTIONS.map(({ days: d, key }) => {
        const on = days.includes(d);
        return (
          <Pressable key={d} onPress={() => toggle(d)} disabled={disabled} accessibilityRole="button" accessibilityState={{ selected: on }}>
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
