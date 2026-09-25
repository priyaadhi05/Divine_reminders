import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { stopIfSpeaking, useSpeech } from '@/hooks/use-speech';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { getLanguageById } from '@/lib/i18n/languages';

// "🔊 Listen" / "⏹ Stop" pill that reads `text` aloud in the selected
// language (see hooks/use-speech.ts). If the device has no voice for that
// language, it says so inline - an Alert wouldn't show on web.
export function ListenButton({ speechKey, text, compact = false }: { speechKey: string; text: string; compact?: boolean }) {
  const theme = useTheme();
  const { t, languageId } = useTranslation();
  const { speakingKey, missingVoiceKey, toggle } = useSpeech();
  const speaking = speakingKey === speechKey;
  const noVoice = missingVoiceKey === speechKey;

  // Leaving the screen shouldn't leave it talking.
  useEffect(() => () => stopIfSpeaking(speechKey), [speechKey]);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => toggle(speechKey, text)}
        accessibilityRole="button"
        accessibilityLabel={speaking ? t('listen.stop') : noVoice ? t('listen.noVoice', { language: getLanguageById(languageId).nativeLabel }) : t('listen.play')}
        style={({ pressed }) => pressed && styles.pressed}>
        <View
          style={[
            compact ? styles.round : styles.pill,
            { borderColor: theme.secondary },
            speaking && { backgroundColor: theme.secondary },
          ]}>
          <ThemedText type="smallBold" style={{ color: speaking ? theme.primaryText : theme.secondary }}>
            {compact ? (speaking ? '⏹' : noVoice ? '🔇' : '🔊') : speaking ? `⏹ ${t('listen.stop')}` : `🔊 ${t('listen.play')}`}
          </ThemedText>
        </View>
      </Pressable>
      {noVoice && !compact && (
        <ThemedText type="small" themeColor="textSecondary">
          {t('listen.noVoice', { language: getLanguageById(languageId).nativeLabel })}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'flex-start',
    gap: Spacing.half,
  },
  pressed: {
    opacity: 0.7,
  },
  // Icon-only, for tight rows like event cards - still a big enough target
  // to hit easily.
  round: {
    width: 44,
    height: 44,
    borderWidth: 1.5,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    borderWidth: 1.5,
    borderRadius: Spacing.five,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
});
