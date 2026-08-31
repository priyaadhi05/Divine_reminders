import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { LeadDaysRow } from '@/components/lead-days-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { CATEGORY_LABELS, getCategoriesForDeity } from '@/data/events';
import { useTheme } from '@/hooks/use-theme';
import { CATEGORY_STYLE } from '@/lib/category-style';
import {
  areRemindersEnabled,
  enableReminders,
  getDeityFollowState,
  getTopicLeadDays,
  isTopicFollowed,
  setDeityFollowed,
  setTopicFollowed,
  setTopicLeadDays,
  type DeityFollowState,
} from '@/lib/notifications';

// A single bell summarizes notification state for this deity (off / some /
// all); tapping it opens a dropdown with the actual controls - an "every
// event" toggle, then one toggle per occasion type (e.g. Valarpirai Sashti,
// Monthly Krithigai) with its own lead-day picker once turned on. Keeping
// all of that tucked away by default means the deity page reads as one
// tidy row instead of a wall of always-visible chips.
export function NotifyPanel({ deityId, deityName }: { deityId: string; deityName: string }) {
  const theme = useTheme();
  const categories = getCategoriesForDeity(deityId);
  const [open, setOpen] = useState(false);
  const [deityState, setDeityState] = useState<DeityFollowState>('none');
  const [topicState, setTopicState] = useState<Record<string, boolean>>({});
  const [leadDaysState, setLeadDaysState] = useState<Record<string, number[]>>({});
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setDeityState(await getDeityFollowState(deityId));
    const entries = await Promise.all(categories.map(async (c) => [c, await isTopicFollowed(deityId, c)] as const));
    setTopicState(Object.fromEntries(entries));
    const leadEntries = await Promise.all(categories.map(async (c) => [c, await getTopicLeadDays(deityId, c)] as const));
    setLeadDaysState(Object.fromEntries(leadEntries));
  };

  useEffect(() => {
    refresh();
    // categories is derived from deityId, safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deityId]);

  const withPermission = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      if (!(await areRemindersEnabled())) await enableReminders();
      await action();
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const summaryLabel =
    deityState === 'all'
      ? `Notified for all ${deityName} events`
      : deityState === 'some'
        ? `Notified for some ${deityName} events`
        : `Notify me for ${deityName}`;

  return (
    <ThemedView style={styles.container}>
      <Pressable onPress={() => setOpen((v) => !v)} accessibilityRole="button">
        <ThemedView type="backgroundElement" style={[styles.summaryRow, { borderColor: theme.accent }]}>
          <ThemedView type="backgroundElement" style={[styles.bell, deityState !== 'none' && { backgroundColor: theme.accent }]}>
            <ThemedText>{deityState === 'none' ? '🔕' : '🔔'}</ThemedText>
          </ThemedView>
          <ThemedText type="smallBold" style={styles.summaryText}>
            {summaryLabel}
            {Platform.OS === 'web' ? ' (mobile only)' : ''}
          </ThemedText>
          <ThemedText themeColor="textSecondary">{open ? '︿' : '﹀'}</ThemedText>
        </ThemedView>
      </Pressable>

      {open && (
        <ThemedView type="backgroundElement" style={[styles.dropdown, { borderColor: theme.accent }]}>
          {deityState === 'none' && (
            <ThemedText type="small" themeColor="textSecondary">
              Requires notification permission — you'll be asked to allow it once.
            </ThemedText>
          )}

          <ToggleRow
            label={`Every ${deityName} event`}
            icon="🙏"
            on={deityState === 'all'}
            disabled={busy}
            onPress={() => withPermission(() => setDeityFollowed(deityId, deityState !== 'all'))}
          />

          {categories.length > 1 && (
            <>
              <ThemedView style={[styles.divider, { backgroundColor: theme.accent }]} />
              <ThemedText type="small" themeColor="textSecondary">
                Or just specific occasions:
              </ThemedText>
              {categories.map((cat) => {
                const on = !!topicState[cat];
                return (
                  <ThemedView key={cat} style={styles.categoryGroup}>
                    <ToggleRow
                      label={CATEGORY_LABELS[cat]}
                      icon={CATEGORY_STYLE[cat].icon}
                      on={on}
                      disabled={busy}
                      onPress={() => withPermission(() => setTopicFollowed(deityId, cat, !on))}
                    />
                    {on && (
                      <ThemedView style={styles.leadDaysIndent}>
                        <LeadDaysRow
                          days={leadDaysState[cat] ?? [3, 2, 1]}
                          disabled={busy}
                          onChange={(days) => withPermission(() => setTopicLeadDays(deityId, cat, days))}
                        />
                      </ThemedView>
                    )}
                  </ThemedView>
                );
              })}
            </>
          )}
        </ThemedView>
      )}
    </ThemedView>
  );
}

function ToggleRow({
  label,
  icon,
  on,
  disabled,
  onPress,
}: {
  label: string;
  icon: string;
  on: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button">
      <ThemedView type="backgroundElement" style={styles.toggleRow}>
        <ThemedText type="small">
          {icon} {label}
        </ThemedText>
        <ThemedView type="backgroundElement" style={[styles.miniBell, on && { backgroundColor: theme.accent }]}>
          <ThemedText style={styles.miniBellIcon}>{on ? '🔔' : '🔕'}</ThemedText>
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.two,
    borderWidth: 1.5,
    borderRadius: Spacing.five,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  bell: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    maxWidth: 220,
  },
  dropdown: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  divider: {
    height: 1,
    opacity: 0.25,
  },
  categoryGroup: {
    gap: Spacing.one,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miniBell: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBellIcon: {
    fontSize: 13,
  },
  leadDaysIndent: {
    marginLeft: Spacing.four,
  },
});
