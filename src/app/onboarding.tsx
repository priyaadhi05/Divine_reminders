import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoMark } from '@/components/logo-mark';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { useRegion } from '@/contexts/region-context';
import { DEITIES } from '@/data/events';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { LANGUAGES } from '@/lib/i18n/languages';
import { enableReminders, getFollowedDeities, markOnboarded, setFollowedDeities } from '@/lib/notifications';
import { regionOptions } from '@/lib/regions';

// First-run flow, three short steps: language, home country/region (this is
// what decides what time a festival's precise timing shows in - see the
// event detail screen's "See in" selector for a one-off peek at another
// country without changing this), then which deities to follow. Re-run from
// Home's "Manage my deities" to add/remove deities - that link jumps
// straight to the deities step via ?step=deities, since language and region
// each have their own direct entry point on Home now and don't need
// re-visiting just to change who you follow.
type Step = 'language' | 'location' | 'deities';

export default function OnboardingScreen() {
  const theme = useTheme();
  const { t, deityName } = useTranslation();
  const { languageId, setLanguageId } = useLanguage();
  const { regionId, setRegionId } = useRegion();
  const { step: initialStep } = useLocalSearchParams<{ step?: Step }>();
  const [step, setStep] = useState<Step>(initialStep === 'deities' ? 'deities' : 'language');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  // Pre-check whichever deities are already followed - otherwise re-opening
  // this (e.g. from "Manage my deities") looks like nothing is followed yet,
  // and saving from that blank slate would silently unfollow everything.
  useEffect(() => {
    getFollowedDeities().then((deities) => setSelected(new Set(deities.map((d) => d.id))));
  }, []);

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
    // Every deity gets set explicitly (followed or not), not just the ones
    // picked this time - otherwise unchecking a previously-followed deity
    // would do nothing and it'd stay followed. A failure requesting OS
    // permission shouldn't stop the selection from being saved.
    try {
      try {
        await enableReminders();
      } catch (err) {
        console.warn('enableReminders failed during onboarding', err);
      }
      await setFollowedDeities(selected);
      await markOnboarded();
      router.replace('/');
    } catch (err) {
      console.warn('onboarding save failed', err);
      Alert.alert(t('common.errorTitle'), t('onboarding.saveFailed'));
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
            <LogoMark size={88} />
          </ThemedView>

          {step === 'language' && (
            <>
              <ThemedText type="title" style={styles.heading}>
                {t('onboarding.languageHeading')}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subheading}>
                {t('onboarding.languageSubheading')}
              </ThemedText>

              <ThemedView style={styles.grid}>
                {LANGUAGES.map((language) => {
                  const isSelected = language.id === languageId;
                  return (
                    <Pressable
                      key={language.id}
                      onPress={() => setLanguageId(language.id)}
                      style={styles.cardWrap}>
                      <ThemedView
                        type="backgroundElement"
                        style={[styles.card, isSelected && { borderColor: theme.primary, backgroundColor: theme.backgroundSelected }]}>
                        <ThemedText type="smallBold">{language.nativeLabel}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {language.label}
                        </ThemedText>
                        <ThemedText style={styles.heart}>{isSelected ? '❤️' : '🤍'}</ThemedText>
                      </ThemedView>
                    </Pressable>
                  );
                })}
              </ThemedView>

              <Pressable onPress={() => setStep('location')} style={[styles.primaryButton, { backgroundColor: theme.primary }]}>
                <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
                  {t('onboarding.continue')}
                </ThemedText>
              </Pressable>
            </>
          )}

          {step === 'location' && (
            <>
              <ThemedText type="title" style={styles.heading}>
                {t('onboarding.locationHeading')}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subheading}>
                {t('onboarding.locationSubheading')}
              </ThemedText>

              <ThemedView style={styles.list}>
                {regionOptions(languageId).map((region) => {
                  const isSelected = region.id === regionId;
                  return (
                    <Pressable key={region.id} onPress={() => setRegionId(region.id)}>
                      <ThemedView
                        type={isSelected ? 'backgroundSelected' : 'backgroundElement'}
                        style={[styles.listOption, isSelected && { borderColor: theme.primary }]}>
                        <ThemedText type={isSelected ? 'smallBold' : 'small'}>{region.label}</ThemedText>
                        {isSelected && <ThemedText>❤️</ThemedText>}
                      </ThemedView>
                    </Pressable>
                  );
                })}
              </ThemedView>

              <Pressable onPress={() => setStep('deities')} style={[styles.primaryButton, { backgroundColor: theme.primary }]}>
                <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
                  {t('onboarding.continue')}
                </ThemedText>
              </Pressable>
            </>
          )}

          {step === 'deities' && (
            <>
              <ThemedText type="title" style={styles.heading}>
                {t('onboarding.deityHeading')}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subheading}>
                {t('onboarding.deitySubheading')}
              </ThemedText>

              <ThemedView style={styles.grid}>
                {DEITIES.map((deity) => {
                  const isSelected = selected.has(deity.id);
                  return (
                    <Pressable
                      key={deity.id}
                      onPress={() => toggleDeity(deity.id)}
                      style={styles.cardWrap}>
                      <ThemedView
                        type="backgroundElement"
                        style={[styles.card, isSelected && { borderColor: theme.primary, backgroundColor: theme.backgroundSelected }]}>
                        <ThemedText style={styles.cardSymbol}>{deity.symbol}</ThemedText>
                        <ThemedText type="smallBold">{deityName(deity.id, deity.name)}</ThemedText>
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
                  {busy ? t('onboarding.saving') : t('onboarding.save')}
                </ThemedText>
              </Pressable>
            </>
          )}
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
    lineHeight: 40,
  },
  heart: {
    fontSize: 18,
    marginTop: Spacing.one,
  },
  list: {
    gap: Spacing.two,
  },
  listOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Spacing.three,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: Spacing.three,
  },
  primaryButton: {
    marginTop: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
});
