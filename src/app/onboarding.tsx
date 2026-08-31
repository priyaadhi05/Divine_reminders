import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
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
import { enableReminders, markOnboarded, setDeityFollowed } from '@/lib/notifications';
import { AUTO_REGION_ID, REGIONS, resolveRegionTimeZone } from '@/lib/regions';

// First-run flow, three short steps: language, home country/region (this is
// what decides what time a festival's precise timing shows in - see the
// event detail screen's "See in" selector for a one-off peek at another
// country without changing this), then which deities to follow. Re-run any
// time from Home via "Manage my deities" to add more deities; language and
// region can be changed from Home directly instead.
type Step = 'language' | 'location' | 'deities';

export default function OnboardingScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { languageId, setLanguageId } = useLanguage();
  const { regionId, setRegionId } = useRegion();
  const [step, setStep] = useState<Step>('language');
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
                    <Pressable key={language.id} onPress={() => setLanguageId(language.id)} style={styles.cardWrap}>
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
                {[{ id: AUTO_REGION_ID, label: resolveRegionTimeZone(AUTO_REGION_ID).label }, ...REGIONS].map((region) => {
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
