import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LeadDaysRow } from '@/components/lead-days-row';
import { RegionSelector } from '@/components/region-selector';
import { SharePanel } from '@/components/share-panel';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useRegion } from '@/contexts/region-context';
import { CATEGORY_LABELS, daysUntil, formatEventDate, formatPeriodTiming, getDeityById, getEventById } from '@/data/events';
import { useTheme } from '@/hooks/use-theme';
import { CATEGORY_STYLE } from '@/lib/category-style';
import { getDevotionalContent } from '@/lib/devotional-content';
import {
  areRemindersEnabled,
  enableReminders,
  getTopicLeadDays,
  isTopicFollowed,
  notificationBody,
  notificationTitle,
  setTopicFollowed,
  setTopicLeadDays,
} from '@/lib/notifications';
import { resolveRegionTimeZone } from '@/lib/regions';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = getEventById(id);
  const { regionId } = useRegion();
  const theme = useTheme();
  const [reminderOn, setReminderOn] = useState(false);
  const [leadDays, setLeadDays] = useState<number[]>([3, 2, 1]);
  const [busy, setBusy] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!event) return;
    isTopicFollowed(event.deity, event.category).then(setReminderOn);
    getTopicLeadDays(event.deity, event.category).then(setLeadDays);
  }, [event]);

  if (!event) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Event not found.</ThemedText>
      </ThemedView>
    );
  }

  const { timeZone, label: regionLabel } = resolveRegionTimeZone(regionId);
  const timing = formatPeriodTiming(event, timeZone, regionLabel);
  const { colorKey, icon } = CATEGORY_STYLE[event.category];
  const accentColor = theme[colorKey];
  const { practice, prayer } = getDevotionalContent(event);

  const handleSetReminder = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const next = !reminderOn;
      if (next && !(await areRemindersEnabled())) await enableReminders();
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

  const shareMessage = `${notificationTitle(event, Math.max(daysUntil(event.date), 0))}\n\n${notificationBody(event, Math.max(daysUntil(event.date), 0))}`;
  const deityName = getDeityById(event.deity)?.name;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <SafeAreaView edges={['bottom']} style={styles.content}>
        <ThemedView style={[styles.headerBlock, { borderTopColor: accentColor }]}>
          <ThemedView style={styles.categoryRow}>
            <ThemedText style={styles.categoryIcon}>{icon}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {CATEGORY_LABELS[event.category]} · {event.tamilMonth}
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

        <ThemedView style={styles.buttonRow}>
          <Pressable onPress={handleSetReminder} disabled={busy} style={styles.buttonFlex}>
            <ThemedView style={[styles.button, { backgroundColor: reminderOn ? theme.backgroundSelected : theme.primary }]}>
              <ThemedText type="smallBold" style={{ color: reminderOn ? theme.text : theme.primaryText }}>
                {reminderOn ? '🔔 Reminder set' : 'Set reminder'}
              </ThemedText>
            </ThemedView>
          </Pressable>
          <Pressable onPress={() => setShareOpen((v) => !v)} style={styles.buttonFlex}>
            <ThemedView style={[styles.button, styles.buttonOutline, { borderColor: theme.primary }]}>
              <ThemedText type="smallBold" style={{ color: theme.primary }}>
                Share with family
              </ThemedText>
            </ThemedView>
          </Pressable>
        </ThemedView>

        {!reminderOn && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.permissionHint}>
            Requires notification permission — you'll be asked to allow it once.
          </ThemedText>
        )}

        {shareOpen && <SharePanel deityId={event.deity} message={shareMessage} />}

        {reminderOn && (
          <ThemedView style={styles.leadDaysSection}>
            <ThemedText type="small" themeColor="textSecondary">
              Applies to every {CATEGORY_LABELS[event.category]} day{deityName ? ` for ${deityName}` : ''}
            </ThemedText>
            <LeadDaysRow days={leadDays} disabled={busy} onChange={handleChangeLeadDays} />
          </ThemedView>
        )}

        {timing && (
          <ThemedView type="backgroundElement" style={styles.timingCard}>
            <ThemedView style={styles.timingHeader}>
              <ThemedText type="smallBold">Precise timing</ThemedText>
              <RegionSelector />
            </ThemedView>
            <ThemedView type="backgroundElement" style={styles.timingRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Begins
              </ThemedText>
              <ThemedText type="small">{timing.startLocal}</ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={styles.timingRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Ends
              </ThemedText>
              <ThemedText type="small">{timing.endLocal}</ThemedText>
            </ThemedView>
            <ThemedText type="small" themeColor="textSecondary" style={styles.timingNote}>
              Shown for {timing.regionLabel}. Panchangam reference (IST): {timing.startIST} → {timing.endIST}
            </ThemedText>
          </ThemedView>
        )}

        <ThemedView style={styles.section}>
          <ThemedText type="smallBold">Why this day matters</ThemedText>
          <ThemedText>{event.description}</ThemedText>
          <ThemedText style={styles.significance}>{event.significance}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="smallBold">What devotees traditionally do</ThemedText>
          <ThemedText>{practice}</ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={[styles.prayerCard, { borderLeftColor: accentColor }]}>
          <ThemedText type="smallBold">Simple prayer</ThemedText>
          <ThemedText style={styles.prayerText}>{prayer}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="smallBold">Panchangam basis</ThemedText>
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
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  buttonFlex: {
    flex: 1,
  },
  leadDaysSection: {
    gap: Spacing.two,
  },
  permissionHint: {
    marginTop: -Spacing.three,
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
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  timingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  timingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timingNote: {
    marginTop: Spacing.one,
  },
});
