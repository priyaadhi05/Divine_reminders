import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LeadDaysRow } from '@/components/lead-days-row';
import { RegionSelector } from '@/components/region-selector';
import { SharePanel } from '@/components/share-panel';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useRegion } from '@/contexts/region-context';
import { CATEGORY_LABELS, formatEventDate, formatPeriodTiming, getDeityById, getEventById } from '@/data/events';
import { useNotifySound } from '@/hooks/use-notify-sound';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { APP_INSTALL_URL } from '@/lib/app-info';
import { CATEGORY_STYLE } from '@/lib/category-style';
import { getDevotionalContent } from '@/lib/devotional-content';
import {
  areRemindersEnabled,
  enableReminders,
  getTopicLeadDays,
  isTopicFollowed,
  setTopicFollowed,
  setTopicLeadDays,
} from '@/lib/notifications';
import { resolveRegionTimeZone } from '@/lib/regions';
import { buildGreeting } from '@/lib/share-greeting';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = getEventById(id);
  const { regionId: homeRegionId } = useRegion();
  const theme = useTheme();
  const { t, categoryLabel, deityName: translatedDeityName } = useTranslation();
  const playNotifySound = useNotifySound();
  const [reminderOn, setReminderOn] = useState(false);
  const [leadDays, setLeadDays] = useState<number[]>([3, 2, 1]);
  const [busy, setBusy] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  // Starts on the home country/region chosen at onboarding, but switching
  // it here (see RegionSelector) only changes what this page shows - it's a
  // one-off "what would this look like elsewhere?" peek, not a change to
  // that home setting.
  const [viewingRegionId, setViewingRegionId] = useState(homeRegionId);

  useEffect(() => {
    if (!event) return;
    isTopicFollowed(event.deity, event.category).then(setReminderOn);
    getTopicLeadDays(event.deity, event.category).then(setLeadDays);
  }, [event]);

  // Home region loads from storage asynchronously (see RegionProvider), so
  // sync once it resolves - this only fires again later if the home region
  // itself changes, not from a peek made on this page.
  useEffect(() => {
    setViewingRegionId(homeRegionId);
  }, [homeRegionId]);

  if (!event) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Event not found.</ThemedText>
      </ThemedView>
    );
  }

  const { timeZone, label: regionLabel } = resolveRegionTimeZone(viewingRegionId);
  const timing = formatPeriodTiming(event, timeZone, regionLabel);
  const { colorKey, icon } = CATEGORY_STYLE[event.category];
  const accentColor = theme[colorKey];
  const { practice, prayer } = getDevotionalContent(event);

  const handleSetReminder = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const next = !reminderOn;
      if (next) {
        if (!(await areRemindersEnabled())) await enableReminders();
        playNotifySound();
      }
      await setTopicFollowed(event.deity, event.category, next);
      setReminderOn(next);
    } finally {
      setBusy(false);
    }
  };

  const handleChangeLeadDays = async (days: number[]) => {
    if (busy) return;
    setBusy(true);
    try {
      await setTopicLeadDays(event.deity, event.category, days);
      setLeadDays(days);
    } finally {
      setBusy(false);
    }
  };

  const owningDeity = getDeityById(event.deity);
  const localizedDeityName = owningDeity ? translatedDeityName(owningDeity.id, owningDeity.name) : undefined;
  // The personal greeting (lib/share-greeting.ts) is what's written onto a
  // shared picture (see components/share-panel.tsx / greeting-card.tsx) - a
  // picture attachment can't carry a separate caption, so the same words are
  // also the text-only message. Every share carries the app's own name, and
  // an install link once one actually exists (see lib/app-info.ts) - sharing
  // is how this app grows, so it shouldn't read as an anonymous forwarded
  // text.
  const greeting = buildGreeting(event);
  const fullShareMessage = [
    greeting,
    APP_INSTALL_URL ? `${t('share.sentWith')}\n${t('share.getTheApp', { url: APP_INSTALL_URL })}` : t('share.sentWith'),
  ].join('\n\n');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <SafeAreaView edges={['bottom']} style={styles.content}>
        <ThemedView style={[styles.headerBlock, { borderTopColor: accentColor }]}>
          <ThemedView style={styles.categoryRow}>
            <ThemedText style={styles.categoryIcon}>{icon}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {categoryLabel(event.category, CATEGORY_LABELS[event.category])} · {event.tamilMonth}
            </ThemedText>
          </ThemedView>
          <ThemedText type="title" style={styles.title}>
            {event.name}
          </ThemedText>
          <ThemedText type="subtitle" style={[styles.tamilName, { color: accentColor }]}>
            {event.tamilName}
          </ThemedText>
          <ThemedText type="smallBold">{formatEventDate(event.date)}</ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={[styles.reminderCard, { borderLeftColor: accentColor }]}>
          <Pressable
            onPress={handleSetReminder}
            disabled={busy}
            accessibilityRole="switch"
            accessibilityState={{ checked: reminderOn, disabled: busy }}>
            <ThemedView type="backgroundElement" style={styles.reminderRow}>
              <ThemedView
                style={[styles.reminderIconWrap, { backgroundColor: reminderOn ? accentColor : theme.backgroundSelected }]}>
                <SymbolView
                  name={{
                    ios: reminderOn ? 'bell.fill' : 'bell',
                    android: reminderOn ? 'notifications_active' : 'notifications_none',
                    web: 'notifications',
                  }}
                  size={18}
                  tintColor={reminderOn ? theme.primaryText : theme.textSecondary}
                />
              </ThemedView>
              <ThemedView type="backgroundElement" style={styles.reminderTextWrap}>
                <ThemedText type="smallBold">{reminderOn ? t('event.reminderSet') : t('event.setReminder')}</ThemedText>
                {!reminderOn && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('notify.requiresPermission')}
                  </ThemedText>
                )}
              </ThemedView>
              <Switch
                value={reminderOn}
                disabled={busy}
                pointerEvents="none"
                trackColor={{ false: theme.backgroundSelected, true: accentColor }}
                thumbColor={Platform.OS === 'android' ? (reminderOn ? theme.primaryText : '#FFFFFF') : undefined}
              />
            </ThemedView>
          </Pressable>

          {reminderOn && (
            <ThemedView type="backgroundElement" style={styles.leadDaysSection}>
              <ThemedView style={[styles.reminderDivider, { backgroundColor: accentColor }]} />
              <ThemedText type="small" themeColor="textSecondary">
                {t('event.appliesTo', { category: categoryLabel(event.category, CATEGORY_LABELS[event.category]) })}
                {localizedDeityName ? t('event.forDeity', { name: localizedDeityName }) : ''}
              </ThemedText>
              <LeadDaysRow days={leadDays} disabled={busy} onChange={handleChangeLeadDays} />
            </ThemedView>
          )}
        </ThemedView>

        <Pressable onPress={() => setShareOpen((v) => !v)}>
          <ThemedView style={[styles.button, styles.buttonOutline, { borderColor: theme.primary }]}>
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              {t('event.share')}
            </ThemedText>
          </ThemedView>
        </Pressable>

        {shareOpen && <SharePanel deityId={event.deity} message={fullShareMessage} />}

        {timing && (
          <ThemedView type="backgroundElement" style={[styles.timingCard, { borderLeftColor: accentColor }]}>
            <ThemedView style={styles.timingHeader}>
              <ThemedView style={styles.timingHeaderLeft}>
                <ThemedText style={styles.timingIcon}>🕐</ThemedText>
                <ThemedText type="smallBold">{t('event.preciseTiming')}</ThemedText>
              </ThemedView>
              <RegionSelector
                regionId={viewingRegionId}
                onChange={setViewingRegionId}
                label={t('event.seeIn')}
                sheetTitle={t('region.seeAnother')}
              />
            </ThemedView>

            <ThemedView style={styles.timingBody}>
              <ThemedView style={styles.timingEntry}>
                <ThemedText style={styles.timingEntryIcon}>🌅</ThemedText>
                <ThemedView style={styles.timingEntryText}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('event.begins')}
                  </ThemedText>
                  <ThemedText type="smallBold" style={styles.timingValue}>
                    {timing.startLocal}
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              <ThemedView style={[styles.timingDivider, { backgroundColor: accentColor }]} />

              <ThemedView style={styles.timingEntry}>
                <ThemedText style={styles.timingEntryIcon}>🌇</ThemedText>
                <ThemedView style={styles.timingEntryText}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('event.ends')}
                  </ThemedText>
                  <ThemedText type="smallBold" style={styles.timingValue}>
                    {timing.endLocal}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>

            <ThemedView type="backgroundSelected" style={styles.timingNoteBadge}>
              <ThemedText type="small" themeColor="textSecondary">
                {t('event.timingNote', { region: timing.regionLabel, startIST: timing.startIST, endIST: timing.endIST })}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        )}

        <ThemedView style={styles.section}>
          <ThemedText type="smallBold">{t('event.whyMatters')}</ThemedText>
          <ThemedText>{event.description}</ThemedText>
          <ThemedText style={styles.significance}>{event.significance}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="smallBold">{t('event.whatDevoteesDo')}</ThemedText>
          <ThemedText>{practice}</ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={[styles.prayerCard, { borderLeftColor: accentColor }]}>
          <ThemedText type="smallBold">{t('event.simplePrayer')}</ThemedText>
          <ThemedText style={styles.prayerText}>{prayer}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="smallBold">{t('event.panchangamBasis')}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {event.basis}
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.four,
  },
  headerBlock: {
    gap: Spacing.one,
    borderTopWidth: 4,
    paddingTop: Spacing.three,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  categoryIcon: {
    fontSize: 16,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
  },
  tamilName: {
    fontSize: 20,
    lineHeight: 26,
  },
  reminderCard: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderLeftWidth: 4,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  reminderIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderTextWrap: {
    flex: 1,
    gap: Spacing.half,
  },
  reminderDivider: {
    height: 1,
    opacity: 0.2,
  },
  leadDaysSection: {
    gap: Spacing.two,
  },
  button: {
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  section: {
    gap: Spacing.one,
  },
  significance: {
    marginTop: Spacing.one,
  },
  prayerCard: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderLeftWidth: 4,
  },
  prayerText: {
    fontStyle: 'italic',
  },
  timingCard: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderLeftWidth: 4,
  },
  timingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  timingIcon: {
    fontSize: 16,
  },
  timingBody: {
    gap: Spacing.two,
  },
  timingEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  timingEntryIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  timingEntryText: {
    flex: 1,
    gap: Spacing.half,
  },
  timingValue: {
    fontSize: 16,
  },
  timingDivider: {
    height: 1,
    marginLeft: 28 + Spacing.two,
    opacity: 0.25,
  },
  timingNoteBadge: {
    padding: Spacing.two,
    borderRadius: Spacing.two,
  },
});
