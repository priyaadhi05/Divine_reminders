import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { enableReminders, followEverything, isEverythingFollowed, unfollowEverything } from '@/lib/notifications';

// The top tier of the three-tier notification model: one tap to follow (or
// unfollow) every event across every deity. Per-deity and per-category
// control live on each deity's own page (src/components/notify-panel.tsx).
export function EverythingToggle() {
  const theme = useTheme();
  const [allFollowed, setAllFollowed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    isEverythingFollowed().then(setAllFollowed);
  }, []);

  const handlePress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (allFollowed) {
        await unfollowEverything();
        setAllFollowed(false);
      } else {
        await enableReminders(); // requests OS permission if not already granted
        await followEverything();
        setAllFollowed(true);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable onPress={handlePress} disabled={busy} accessibilityRole="button">
      <ThemedView type="backgroundElement" style={[styles.button, { borderColor: theme.primary, opacity: busy ? 0.6 : 1 }]}>
        <ThemedText type="smallBold">
          {allFollowed ? '🔔 Notified for every god' : '🔕 Notify me about everything'}
          {Platform.OS === 'web' ? ' (mobile only)' : ''}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    borderWidth: 1.5,
    borderRadius: Spacing.four,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
});
