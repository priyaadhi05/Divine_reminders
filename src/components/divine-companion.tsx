import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { DeityEvent } from '@/data/events';
import { useNotifySound } from '@/hooks/use-notify-sound';
import { stopIfSpeaking, useSpeech } from '@/hooks/use-speech';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { getLanguageById } from '@/lib/i18n/languages';
import { areRemindersEnabled, disableReminders, enableReminders, reminderLine } from '@/lib/notifications';

// A reminder "companion" card: shows the next event (across any deity) as a
// first-person line voiced as whichever deity it belongs to (see
// reminderLine in src/lib/notifications.ts), speaks it aloud (on-device TTS)
// when tapped, and hosts the toggle for real OS-level scheduled reminders.
// No face/character graphic for now - just the text and a small pulse on the
// icon while speaking. (Named for what it does, not "MuruganMascot" as it
// was originally - it's always voiced whichever deity the next event
// belongs to, never Murugan specifically.)
const SPEECH_KEY = 'companion';

interface DivineCompanionProps {
  nextEvent?: DeityEvent;
}

export function DivineCompanion({ nextEvent }: DivineCompanionProps) {
  const theme = useTheme();
  const { t, languageId } = useTranslation();
  const playNotifySound = useNotifySound();
  const { speakingKey, missingVoiceKey, toggle } = useSpeech();
  const speaking = speakingKey === SPEECH_KEY;
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

  useEffect(() => () => stopIfSpeaking(SPEECH_KEY), []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + talk.value * 0.25 }],
  }));

  const line = nextEvent ? reminderLine(nextEvent, languageId) : t('mascot.nothingNew');

  const handleTap = () => toggle(SPEECH_KEY, line);

  const handleToggleReminders = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (remindersOn) {
        await disableReminders();
        setRemindersOn(false);
      } else {
        const granted = await enableReminders();
        if (granted) playNotifySound();
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
        accessibilityLabel={speaking ? t('listen.stop') : t('listen.play')}>
        <ThemedView type="backgroundSelected" style={styles.bubble}>
          <ThemedText type="small" numberOfLines={4}>
            <Animated.Text style={iconStyle}>{speaking ? '🔊 ' : '🙏 '}</Animated.Text>
            {line}
          </ThemedText>
          <View
            style={[styles.listenPill, { borderColor: theme.secondary }, speaking && { backgroundColor: theme.secondary }]}>
            <ThemedText type="smallBold" style={{ color: speaking ? theme.primaryText : theme.secondary }}>
              {speaking ? `⏹ ${t('listen.stop')}` : `🔊 ${t('listen.play')}`}
            </ThemedText>
          </View>
          {missingVoiceKey === SPEECH_KEY && (
            <ThemedText type="small" themeColor="textSecondary">
              {t('listen.noVoice', { language: getLanguageById(languageId).nativeLabel })}
            </ThemedText>
          )}
        </ThemedView>
      </Pressable>

      <Pressable
        onPress={handleToggleReminders}
        disabled={busy}
        style={[styles.bell, { borderColor: theme.accent, opacity: busy ? 0.6 : 1 }]}
        accessibilityRole="button">
        <ThemedText type="smallBold">
          {remindersOn ? t('mascot.remindersOn') : t('mascot.enableReminders')}
          {Platform.OS === 'web' ? t('mascot.mobileOnly') : ''}
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
  listenPill: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: Spacing.five,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.one,
  },
  bell: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: Spacing.four,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
});
