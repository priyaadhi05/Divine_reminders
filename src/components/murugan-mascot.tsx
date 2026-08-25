import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { DeityEvent } from '@/data/events';
import { useTheme } from '@/hooks/use-theme';
import { areRemindersEnabled, disableReminders, enableReminders, reminderLine } from '@/lib/notifications';

// A reminder "companion" card: shows the next event as a first-person
// Murugan-voiced line, speaks it aloud (on-device TTS) when tapped, and
// hosts the toggle for real OS-level scheduled reminders in
// src/lib/notifications.ts. No face/character graphic for now - just the
// text and a small pulse on the icon while speaking.
interface MuruganMascotProps {
  nextEvent?: DeityEvent;
}

export function MuruganMascot({ nextEvent }: MuruganMascotProps) {
  const theme = useTheme();
  const [speaking, setSpeaking] = useState(false);
  const [remindersOn, setRemindersOn] = useState(false);
  const [busy, setBusy] = useState(false);

  const talk = useSharedValue(0);

  useEffect(() => {
    areRemindersEnabled().then(setRemindersOn);
  }, []);

  useEffect(() => {
    talk.value = speaking
      ? withRepeat(withSequence(withTiming(1, { duration: 220 }), withTiming(0, { duration: 220 })), -1, true)
      : withTiming(0, { duration: 100 });
  }, [speaking, talk]);

  useEffect(() => () => void Speech.stop(), []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + talk.value * 0.25 }],
  }));

  const line = nextEvent ? reminderLine(nextEvent) : 'Vel Vel! Nothing new on the horizon just yet - check back soon.';

  const handleTap = () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(line, {
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const handleToggleReminders = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (remindersOn) {
        await disableReminders();
        setRemindersOn(false);
      } else {
        const granted = await enableReminders();
        setRemindersOn(granted);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.accent }]}>
      <Pressable
        onPress={handleTap}
        accessibilityRole="button"
        accessibilityLabel="Tap to hear the next reminder aloud">
        <ThemedView type="backgroundSelected" style={styles.bubble}>
          <ThemedText type="small" numberOfLines={4}>
            <Animated.Text style={iconStyle}>{speaking ? '🔊 ' : '🙏 '}</Animated.Text>
            {line}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.tapHint}>
            {speaking ? 'Tap to stop' : 'Tap to hear this'}
          </ThemedText>
        </ThemedView>
      </Pressable>

      <Pressable
        onPress={handleToggleReminders}
        disabled={busy}
        style={[styles.bell, { borderColor: theme.accent, opacity: busy ? 0.6 : 1 }]}
        accessibilityRole="button">
        <ThemedText type="smallBold">
          {remindersOn ? '🔔 Reminders on' : '🔕 Enable reminders'}
          {Platform.OS === 'web' ? ' (mobile only)' : ''}
        </ThemedText>
      </Pressable>
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
  tapHint: {
    fontStyle: 'italic',
  },
  bell: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: Spacing.four,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
});
