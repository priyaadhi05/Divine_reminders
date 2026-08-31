import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoMark } from '@/components/logo-mark';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { DEITIES } from '@/data/events';
import { useTheme } from '@/hooks/use-theme';
import { enableReminders, markOnboarded, setDeityFollowed } from '@/lib/notifications';

// First-run flow: just "choose your deities" - straight into the
// personalized "Your Sacred Days" home screen. Re-run any time from Home via
// "Manage my deities" to add more. Only offers the deities we actually have
// real, astronomically-computed calendars for today (Murugan, Vishnu, Shiva,
// Amman) - more are on the roadmap, but a selectable card with no data
// behind it would be a dead end.
//
// Reminder *timing* (3 days before / 2 days before / 1 day before) isn't chosen
// here anymore - every followed topic starts on the full countdown, and can
// be dialed down per deity or per event afterward (see NotifyPanel and the
// event detail screen's LeadDaysRow), since that choice is easier to make
// looking at a specific event than guessed upfront for everything at once.
export default function OnboardingScreen() {
  const theme = useTheme();
  const [selected, setSelected] = useState<Set<string>>(new Set());
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
          <ThemedView style={styles.brandRow}>
            <LogoMark size={56} />
          </ThemedView>
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
            onPress={handleFinish}
            disabled={selected.size === 0 || busy}
            style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: selected.size === 0 || busy ? 0.5 : 1 }]}>
            <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
              {busy ? 'Saving…' : '❤️ Save my deities'}
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
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
  brandRow: {
    alignItems: 'center',
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
  primaryButton: {
    marginTop: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
});
