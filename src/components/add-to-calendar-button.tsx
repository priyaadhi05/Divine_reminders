import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet } from 'react-native';
import * as Calendar from 'expo-calendar/legacy';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { DeityEvent } from '@/data/events';
import { useTheme } from '@/hooks/use-theme';
import { buildICS } from '@/lib/ics';
import { shareICS } from '@/lib/share-ics';

const CALENDAR_TITLE = 'Divine Calendar';

class AlreadyAddedError extends Error {}

async function getOrCreateCalendarId(): Promise<string> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const existing = calendars.find((c) => c.title === CALENDAR_TITLE);
  if (existing) return existing.id;

  const defaultCalendar = await Calendar.getDefaultCalendarAsync();
  const source: Calendar.Source =
    Platform.OS === 'ios'
      ? defaultCalendar.source
      : { isLocalAccount: true, name: CALENDAR_TITLE, type: Calendar.SourceType.LOCAL };

  return Calendar.createCalendarAsync({
    title: CALENDAR_TITLE,
    color: '#E67635',
    entityType: Calendar.EntityTypes.EVENT,
    source,
    sourceId: Platform.OS === 'ios' ? defaultCalendar.source.id : undefined,
    name: CALENDAR_TITLE,
    ownerAccount: CALENDAR_TITLE,
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

function parseISODate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

async function addEventNatively(event: DeityEvent): Promise<void> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Calendar permission was not granted.');
  }

  const calendarId = await getOrCreateCalendarId();
  const startDate = parseISODate(event.date);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  // Avoid duplicate entries if the user taps "Add to Calendar" more than once.
  const existing = await Calendar.getEventsAsync([calendarId], startDate, endDate);
  if (existing.some((e) => e.title === event.name)) {
    throw new AlreadyAddedError();
  }

  await Calendar.createEventAsync(calendarId, {
    title: event.name,
    notes: `${event.description}\n\n${event.significance}`,
    startDate,
    endDate,
    allDay: true,
    timeZone: 'Asia/Kolkata',
    alarms: [{ relativeOffset: -24 * 60 }],
  });
}

export function AddToCalendarButton({ event }: { event: DeityEvent }) {
  const [status, setStatus] = useState<'idle' | 'working' | 'done'>('idle');

  const handlePress = async () => {
    setStatus('working');
    try {
      if (Platform.OS === 'web') {
        await shareICS(buildICS([event], event.name), `${event.id}.ics`);
        setStatus('done');
        return;
      }
      try {
        await addEventNatively(event);
        setStatus('done');
        Alert.alert('Added to Calendar', `${event.name} was added with a reminder 1 day before.`);
      } catch (err) {
        if (err instanceof AlreadyAddedError) {
          setStatus('done');
          Alert.alert('Already added', `${event.name} is already on your calendar.`);
          return;
        }
        // expo-calendar's native module can be unavailable (e.g. Expo Go) - fall back to sharing an .ics file.
        await shareICS(buildICS([event], event.name), `${event.id}.ics`);
        setStatus('done');
      }
    } catch (err) {
      setStatus('idle');
      Alert.alert('Could not add to calendar', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const theme = useTheme();

  return (
    <Pressable
      onPress={handlePress}
      disabled={status === 'working'}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView style={[styles.button, { backgroundColor: theme.primary }]}>
        <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
          {status === 'done' ? 'Added to Calendar ✓' : status === 'working' ? 'Adding…' : '+ Add to Calendar'}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
});
