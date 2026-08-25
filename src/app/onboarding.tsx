import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { DEITIES } from '@/data/events';
import { useTheme } from '@/hooks/use-theme';
import { enableReminders, markOnboarded, setDeityFollowed, setReminderStyle, type ReminderStyle } from '@/lib/notifications';

// First-run flow: Choose your deities -> Choose your reminder style -> the
// personalized "Your Sacred Days" home screen. Re-run any time from Home via
// "Manage my deities". Only offers the deities we actually have real,
// astronomically-computed calendars for today (Murugan, Vishnu, Shiva,
// Amman) - more are on the roadmap, but a selectable card with no data
// behind it would be a dead end.
export default function OnboardingScreen() {
  const theme = useTheme();
  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [style, setStyle] = useState<ReminderStyle>('full');
  const [busy, setBusy] = useState(false);

  const toggleDeity = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFinish = async () => {
    if (busy) return;
    setBusy(true);
    // Each step is isolated: a failure requesting OS permission (or saving
    // one deity's follow state) shouldn't cascade into skipping the rest -
    // the user picked these deities, they should end up followed even if
    // something else on the device hiccups.
    try {
      try {
        await enableReminders();
      } catch (err) {
        console.warn('enableReminders failed during onboarding', err);
      }
      for (const id of selected) {
        try {
          await setDeityFollowed(id, true);
        } catch (err) {
          console.warn(`setDeityFollowed(${id}) failed during onboarding`, err);
        }
      }
      try {
        await setReminderStyle(style);
      } catch (err) {
        console.warn('setReminderStyle failed during onboarding', err);
      }
      await markOnboarded();
      router.replace('/');
    } catch (err) {
      Alert.alert(
        'Something went wrong',
        err instanceof Error ? err.message : 'You can try again anytime from "Manage my deities" on Home.'
      );
      router.replace('/');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {step === 1 ? (
            <>
              <ThemedText type="title" style={styles.heading}>
                Which deities are meaningful to you?
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subheading}>
                Your home screen will only show sacred days for the deities you choose here.
              </ThemedText>

              <ThemedView style={styles.grid}>
                {DEITIES.map((deity) => {
                  const isSelected = selected.has(deity.id);
                  return (
                    <Pressable key={deity.id} onPress={() => toggleDeity(deity.id)} style={styles.cardWrap}>
                      <ThemedView
                        type="backgroundElement"
                        style={[styles.card, isSelected && { borderColor: theme.primary, backgroundColor: theme.backgroundSelected }]}>
                        <ThemedText style={styles.cardSymbol}>{deity.symbol}</ThemedText>
                        <ThemedText type="smallBold">{deity.name}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {deity.tamilName}
                        </ThemedText>
                        <ThemedText style={styles.heart}>{isSelected ? '❤️' : '🤍'}</ThemedText>
                      </ThemedView>
                    </Pressable>
                  );
                })}
              </ThemedView>

              <Pressable
                onPress={() => setStep(2)}
                disabled={selected.size === 0}
                style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: selected.size === 0 ? 0.5 : 1 }]}>
                <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
                  ❤️ My Deities
                </ThemedText>
              </Pressable>
            </>
          ) : (
            <>
              <ThemedText type="title" style={styles.heading}>
                Choose your reminder style
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subheading}>
                We'll remind you before the day arrives, wherever you are.
              </ThemedText>

              <StyleOption
                title="Full countdown (Recommended)"
                description="A heads-up 3 days before, a nudge 1 day before, and a blessing on the day itself."
                selected={style === 'full'}
                onPress={() => setStyle('full')}
              />
              <StyleOption
                title="Just today"
                description="One quiet reminder, only on the day itself - nothing before."
                selected={style === 'quiet'}
                onPress={() => setStyle('quiet')}
              />

              <Pressable
                onPress={handleFinish}
                disabled={busy}
                style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: busy ? 0.6 : 1 }]}>
                <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
                  {busy ? 'Setting up…' : 'Continue'}
                </ThemedText>
              </Pressable>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function StyleOption({
  title,
  description,
  selected,
  onPress,
}: {
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress}>
      <ThemedView
        type="backgroundElement"
        style={[styles.styleCard, selected && { borderColor: theme.primary, backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {description}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  heading: {
    fontSize: 30,
    lineHeight: 36,
  },
  subheading: {
    marginBottom: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  cardWrap: {
    width: '47%',
  },
  card: {
    borderRadius: Spacing.four,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.half,
  },
  cardSymbol: {
    fontSize: 32,
  },
  heart: {
    fontSize: 18,
    marginTop: Spacing.one,
  },
  styleCard: {
    borderRadius: Spacing.four,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: Spacing.three,
    gap: Spacing.half,
  },
  primaryButton: {
    marginTop: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
});
