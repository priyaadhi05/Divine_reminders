import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const OPTIONS: { days: number; label: string }[] = [
  { days: 3, label: '3 days before' },
  { days: 2, label: '2 days before' },
  { days: 1, label: '1 day before' },
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

  const toggle = (d: number) => {
    const on = days.includes(d);
    if (on && days.length === 1) return;
    onChange(on ? days.filter((x) => x !== d) : [...days, d]);
  };

  return (
    <ThemedView style={styles.row}>
      {OPTIONS.map(({ days: d, label }) => {
        const on = days.includes(d);
        return (
          <Pressable key={d} onPress={() => toggle(d)} disabled={disabled}>
            <ThemedView
              type="backgroundElement"
              style={[styles.pill, on && { backgroundColor: theme.accent, borderColor: theme.accent }]}>
              <ThemedText type="small" style={on && { color: theme.primaryText, fontWeight: '700' }}>
                {label}
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
