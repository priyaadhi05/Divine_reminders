import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

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
  isTopicFollowed,
  setDeityFollowed,
  setTopicFollowed,
  type DeityFollowState,
} from '@/lib/notifications';

// Three tiers of "which events do you want notified about", all living on
// the deity's own page: a master "all of this god" toggle, and beneath it,
// one toggle per category so someone can follow just Pradosham, or just
// Valarpirai Sashti, without the rest. ("Follow everything" across all
// gods lives on the Home screen instead.)
export function NotifyPanel({ deityId, deityName }: { deityId: string; deityName: string }) {
  const theme = useTheme();
  const categories = getCategoriesForDeity(deityId);
  const [deityState, setDeityState] = useState<DeityFollowState>('none');
  const [topicState, setTopicState] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setDeityState(await getDeityFollowState(deityId));
    const entries = await Promise.all(categories.map(async (c) => [c, await isTopicFollowed(deityId, c)] as const));
    setTopicState(Object.fromEntries(entries));
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

  const masterLabel =
    deityState === 'all'
      ? `🔔 Notified for all ${deityName} events`
      : deityState === 'some'
        ? `🔔 Notified for some ${deityName} events`
        : `🔕 Notify me for ${deityName}`;

  return (
    <ThemedView style={styles.container}>
      <Pressable
        onPress={() => withPermission(() => setDeityFollowed(deityId, deityState !== 'all'))}
        disabled={busy}
        style={[styles.masterButton, { borderColor: theme.accent, opacity: busy ? 0.6 : 1 }]}
        accessibilityRole="button">
        <ThemedText type="smallBold">
          {masterLabel}
          {Platform.OS === 'web' ? ' (mobile only)' : ''}
        </ThemedText>
      </Pressable>

      {deityState !== 'none' && (
        <ThemedText type="small" themeColor="textSecondary">
          You'll get a notification 3 days, 2 days, and 1 day before each followed event.
        </ThemedText>
      )}

      {categories.length > 1 && (
        <>
          <ThemedText type="small" themeColor="textSecondary" style={styles.orLabel}>
            Or pick specific events:
          </ThemedText>
          <ThemedView style={styles.chipRow}>
            {categories.map((cat) => {
              const on = !!topicState[cat];
              const { colorKey, icon } = CATEGORY_STYLE[cat];
              const chipColor = theme[colorKey];
              return (
                <Pressable
                  key={cat}
                  onPress={() => withPermission(() => setTopicFollowed(deityId, cat, !on))}
                  disabled={busy}>
                  <ThemedView
                    type="backgroundElement"
                    style={[styles.chip, on && { backgroundColor: chipColor, borderColor: chipColor }]}>
                    <ThemedText style={styles.chipIcon}>{on ? '🔔' : icon}</ThemedText>
                    <ThemedText type="small" style={on && { color: theme.primaryText, fontWeight: '700' }}>
                      {CATEGORY_LABELS[cat]}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              );
            })}
          </ThemedView>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  masterButton: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: Spacing.four,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  orLabel: {
    marginTop: Spacing.one,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipIcon: {
    fontSize: 13,
  },
});
